import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Define AppRole type based on your Supabase enum
export type AppRole = 'student' | 'teacher' | 'admin' | 'coordinator';

interface UserProfile {
  full_name: string | null;
  avatar_url: string | null;
  // Add other profile fields as needed
}

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserAndRole = useCallback(async (session: any) => {
    if (session) {
      setUser(session.user);

      // Fetch user role
      const { data: userRoleData, error: userRoleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();

      if (userRoleError && userRoleError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Error fetching user role:', userRoleError);
        setRole(null);
      } else {
        setRole(userRoleData?.role || null);
      }

      // Fetch user profile
      const { data: userProfileData, error: userProfileError } = await supabase
        .from('profiles')
        .select('full_name, avatar_url') // Select relevant profile fields
        .eq('user_id', session.user.id)
        .single();

      if (userProfileError && userProfileError.code !== 'PGRST116') {
        console.error('Error fetching user profile:', userProfileError);
        setProfile(null);
      } else {
        setProfile(userProfileData || null);
      }

    } else {
      setUser(null);
      setProfile(null);
      setRole(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchUserAndRole(session);
    });

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') {
          if (session) {
            await fetchUserAndRole(session);
            if (event === 'SIGNED_IN') {
              toast.success('Bem-vindo de volta!');
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setRole(null);
          setLoading(false);
          toast.info('Você foi desconectado.');
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchUserAndRole]);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return { user: null, error };
    }
    // fetchUserAndRole will be called by onAuthStateChange
    return { user: data.user, error: null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, options?: { data?: object }) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password, options });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return { user: null, error };
    }
    // fetchUserAndRole will be called by onAuthStateChange
    return { user: data.user, error: null };
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return { error };
    }
    // fetchUserAndRole will be called by onAuthStateChange (SIGNED_OUT event)
    return { error: null };
  }, []);

  return { user, profile, role, loading, signIn, signUp, signOut };
};