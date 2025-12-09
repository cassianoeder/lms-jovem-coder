import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

type AppRole = 'student' | 'teacher' | 'coordinator' | 'admin';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: AppRole) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Check if Supabase is configured
  const [supabaseConfigured, setSupabaseConfigured] = useState(true);

  useEffect(() => {
    // Check if Supabase is properly configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      setSupabaseConfigured(false);
      setLoading(false);
      return;
    }
    
    try {
      new URL(supabaseUrl);
    } catch (e) {
      setSupabaseConfigured(false);
      setLoading(false);
      return;
    }
    
    if (!supabaseConfigured) {
      setLoading(false);
      return;
    }

    const fetchUserData = async (userId: string) => {
      try {
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (profileError) {
          console.error('Error fetching profile:', profileError);
        } else if (profileData) {
          setProfile(profileData);
        }
        
        // Fetch role
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();
          
        if (roleError) {
          console.error('Error fetching role:', roleError);
        } else if (roleData) {
          setRole(roleData.role as AppRole);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch user data when session changes
        if (session?.user) {
          await fetchUserData(session.user.id);
        } else {
          setProfile(null);
          setRole(null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabaseConfigured]);

  const signUp = async (email: string, password: string, fullName: string, role: AppRole) => {
    if (!supabaseConfigured) {
      return { error: new Error("Supabase not configured") };
    }
    
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          // Note: The role will be set by admin later, not during signup
        },
      },
    });
    
    // After signup, create profile and default role
    if (!error) {
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          full_name: fullName,
          avatar_url: null,
        });
      
      if (profileError) {
        console.error('Error creating profile:', profileError);
      }
      
      // Create default student role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          role: 'student',
        });
      
      if (roleError) {
        console.error('Error creating role:', roleError);
      }
    }
    
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    if (!supabaseConfigured) {
      return { error: new Error("Supabase not configured") };
    }
    
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error: error as Error | null };
  };

  const signOut = async () => {
    if (!supabaseConfigured) {
      // Reset local state even if Supabase is not configured
      setUser(null);
      setSession(null);
      setProfile(null);
      setRole(null);
      return;
    }
    
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      role,
      loading,
      signUp,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};