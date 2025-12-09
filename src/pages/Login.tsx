import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { toast } from 'sonner';

function Login() {
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (session) {
      toast.success('Login realizado com sucesso!');
    }
  }, [session]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background dark flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background dark p-4">
      <div className="w-full max-w-md">
        <Auth
          supabaseClient={supabase}
          providers={[]} // Removendo provedores de terceiros para simplificar
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--primary))',
                  brandAccent: 'hsl(var(--primary-foreground))',
                },
              },
            },
          }}
          theme="dark" // Usando tema dark para combinar com o app
          redirectTo={window.location.origin} // Redireciona para a raiz após login
        />
      </div>
    </div>
  );
}

export default Login;