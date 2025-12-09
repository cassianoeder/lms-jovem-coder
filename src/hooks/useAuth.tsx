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
      console.error("Supabase URL or Key is missing.");
      setSupabaseConfigured(false);
      setLoading(false);
      return;
    }
    
    try {
      new URL(supabaseUrl);
    } catch (e) {
      console.error("Invalid Supabase URL format:", supabaseUrl);
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
          // Don't throw error, just log it. Profile might not exist yet.
        } else if (profileData) {
          setProfile(profileData);
        } else {
          // Profile does not exist, clear it
          setProfile(null);
        }
        
        // Fetch role
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();
          
        if (roleError) {
          console.error('Error fetching role:', roleError);
          // Don't throw error, just log it. Role might not exist yet.
        } else if (roleData) {
          setRole(roleData.role as AppRole);
        } else {
          // Role does not exist, clear it
          setRole(null);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
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
      console.log("Initial session check:", session?.user?.id);
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
    
    console.log("Attempting sign up for:", email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: {
          full_name: fullName,
        },
      },
    });
    
    if (error) {
      console.error("Sign up error:", error);
      return { error: error as Error | null };
    }

    if (!data.user || !data.session) {
      // Email confirmation might be required
      console.log("Sign up successful, but session is null. Email confirmation might be required.");
      // We still need to create the profile and role, so we'll use the user from the data object
      // if available, otherwise we can't proceed.
      if (!data.user) {
        return { error: new Error("Sign up successful, but no user data returned.") };
      }
    }

    const userId = data.user.id;
    console.log("User created with ID:", userId);

    // Create profile and role in a single transaction-like operation
    try {
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          full_name: fullName,
          avatar_url: null,
        });
      
      if (profileError) {
        console.error('Error creating profile:', profileError);
        // Attempt to delete the user if profile creation fails
        await supabase.auth.admin.deleteUser(userId);
        return { error: new Error(`Failed to create profile: ${profileError.message}`) };
      }
      
      // Create role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: role, // Use the role passed to the function
        });
      
      if (roleError) {
        console.error('Error creating role:', roleError);
        // Attempt to delete the user and profile if role creation fails
        await supabase.auth.admin.deleteUser(userId);
        return { error: new Error(`Failed to create role: ${roleError.message}`) };
      }

      console.log("Profile and role created successfully for user:", userId);
      return { error: null };

    } catch (err: any) {
      console.error("Unexpected error during profile/role creation:", err);
      // Attempt to delete the user if an unexpected error occurs
      await supabase.auth.admin.deleteUser(userId);
      return { error: new Error(`An unexpected error occurred: ${err.message}`) };
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!supabaseConfigured) {
      return { error: new Error("Supabase not configured") };
    }
    
    console.log("Attempting sign in for:", email);
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error("Sign in error:", error);
      return { error: error as Error | null };
    }

    console.log("Sign in successful for user:", data.user?.id);
    // The onAuthStateChange listener will handle fetching profile and role
    return { error: null };
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
    
    console.log("Signing out...");
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign out error:", error);
    }
    // The onAuthStateChange listener will handle resetting the state
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