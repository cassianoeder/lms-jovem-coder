import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const LoginPage = () => {
  const navigate = useNavigate();
  const { user, role, signIn, signUp, loading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      // Corrected signUp call: pass fullName and role within the options.data object
      const { error } = await signUp(email, password, { data: { full_name: fullName, role: 'student' } });
      if (!error) {
        toast.success('Conta criada com sucesso! Verifique seu email para confirmar.');
        setIsSignUp(false); // Switch back to login after sign up
      }
    } else {
      const { error } = await signIn(email, password);
      if (!error) {
        // Redirection is handled by HomeRedirect in App.tsx
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">JovemCoder</CardTitle>
          <CardDescription>
            {isSignUp ? 'Crie sua conta para começar' : 'Faça login na sua conta'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Seu nome completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={authLoading}>
              {authLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Carregando...
                </div>
              ) : (
                isSignUp ? 'Criar Conta' : 'Entrar'
              )}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {isSignUp ? (
              <>
                Já tem uma conta?{' '}
                <Button variant="link" onClick={() => setIsSignUp(false)} className="p-0 h-auto">
                  Faça login
                </Button>
              </>
            ) : (
              <>
                Não tem uma conta?{' '}
                <Button variant="link" onClick={() => setIsSignUp(true)} className="p-0 h-auto">
                  Cadastre-se
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;