import { useState, useEffect, useContext, createContext, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Definir AppRole com base no seu schema do Supabase
export type AppRole = 'student' | 'teacher' | 'coordinator' | 'admin';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, role: AppRole) => Promise<{ user: User | null; error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper para buscar a role do usuário
  const fetchUserRole = useCallback(async (userId: string) => {
    const { data: userRoleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (roleError && roleError.code !== 'PGRST116') { // PGRST116 significa que nenhuma linha foi encontrada
      console.error('Error fetching user role:', roleError);
      toast.error('Erro ao carregar role do usuário: ' + roleError.message);
      return null;
    }
    return userRoleData?.role as AppRole || null;
  }, []);

  useEffect(() => {
    const fetchInitialSessionAndRole = async () => {
      setIsLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Error fetching session:', sessionError);
        toast.error('Erro ao carregar sessão: ' + sessionError.message);
      }

      setSession(session);
      setUser(session?.user || null);

      if (session?.user) {
        const userRole = await fetchUserRole(session.user.id);
        setRole(userRole);
      } else {
        setRole(null);
      }
      setIsLoading(false);
    };

    fetchInitialSessionAndRole();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
          setSession(currentSession);
          setUser(currentSession?.user || null);
          if (currentSession?.user) {
            const userRole = await fetchUserRole(currentSession.user.id);
            setRole(userRole);
          } else {
            setRole(null);
          }
        }
        setIsLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchUserRole]);

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error('Erro ao fazer login: ' + error.message);
    } else if (data.user) {
      toast.success('Login realizado com sucesso!');
    }
    setIsLoading(false);
    return { user: data.user, error };
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string, role: AppRole) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role
        }
      }
    });
    if (error) {
      toast.error('Erro ao cadastrar: ' + error.message);
    } else if (data.user) {
      toast.success('Cadastro realizado com sucesso! Verifique seu e-mail para confirmar.');
    }
    setIsLoading(false);
    return { user: data.user, error };
  }, []);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Erro ao fazer logout: ' + error.message);
    } else {
      toast.success('Logout realizado com sucesso!');
    }
    setIsLoading(false);
    return { error };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, role, isLoading, signIn, signUp, signOut }}>
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