import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Mail, Lock, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';

function AuthPage() {
  const navigate = useNavigate();
  const { user, role, signIn, signUp, isLoading: authLoading } = useAuth(); // Corrigido: loading para isLoading
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false); // Local loading state for form submission

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (isLogin) {
      const { error } = await signIn(email, password);
      if (!error) {
        navigate('/'); // Redireciona após login bem-sucedido
      }
    } else {
      const { error } = await signUp(email, password, fullName, 'student'); // Default role 'student'
      if (!error) {
        setIsLogin(true); // Volta para a tela de login após o cadastro
        setEmail('');
        setPassword('');
        setFullName('');
      }
    }
    setLoading(false);
  };

  if (user) {
    navigate('/'); // Redireciona se já estiver logado
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background dark p-4">
      <Card className="w-full max-w-md glass border-border/50">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-foreground text-center">
            {isLogin ? 'Entrar' : 'Cadastrar'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Seu nome completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="pl-10"
                    disabled={loading || authLoading}
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                  disabled={loading || authLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-10 pr-10"
                  disabled={loading || authLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading || authLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full bg-gradient-primary" disabled={loading || authLoading}>
              {loading || authLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                isLogin ? 'Entrar' : 'Cadastrar'
              )}
            </Button>
          </form>
          <Button
            variant="link"
            className="w-full mt-4 text-muted-foreground"
            onClick={() => setIsLogin(!isLogin)}
            disabled={loading || authLoading}
          >
            {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default AuthPage;