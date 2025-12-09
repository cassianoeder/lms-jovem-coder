import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { UserPlus, Users } from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateStudentAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Por favor, insira um email válido');
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsCreating(true);
    try {
      // Check if user already exists
      const { data: existingUsers, error: fetchError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email);

      if (fetchError) throw fetchError;

      if (existingUsers && existingUsers.length > 0) {
        toast.error('Já existe um usuário com este email');
        setIsCreating(false);
        return;
      }

      // Create user in auth table using admin API
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: 'student'
        }
      });

      if (error) throw error;

      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: data.user.id,
            full_name: fullName,
          }, { onConflict: 'user_id' });

        if (profileError) throw profileError;

        // Create role
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: data.user.id,
            role: 'student',
          }, { onConflict: 'user_id' });

        if (roleError) throw roleError;

        // Create XP record
        const { error: xpError } = await supabase
          .from('student_xp')
          .upsert({
            user_id: data.user.id,
            total_xp: 0,
            level: 1,
          }, { onConflict: 'user_id' });

        if (xpError) throw xpError;

        // Create streak record
        const { error: streakError } = await supabase
          .from('streaks')
          .upsert({
            user_id: data.user.id,
            current_streak: 0,
            longest_streak: 0,
          }, { onConflict: 'user_id' });

        if (streakError) throw streakError;

        toast.success('Conta de aluno criada com sucesso!');
        setFullName('');
        setEmail('');
        setPassword('');
      }
    } catch (error: any) {
      console.error('Error creating student account:', error);
      toast.error('Erro ao criar conta de aluno: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground">
          Gerencie as configurações da sua conta e crie contas de alunos
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Criar Conta de Aluno
            </CardTitle>
            <CardDescription>
              Crie contas de alunos que poderão ser matriculados em suas turmas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateStudentAccount} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nome do aluno"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha segura (mínimo 6 caracteres)"
                  required
                  minLength={6}
                />
              </div>
              
              <Button type="submit" disabled={isCreating} className="w-full">
                {isCreating ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Criando...
                  </div>
                ) : (
                  'Criar Conta de Aluno'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gerenciar Alunos
            </CardTitle>
            <CardDescription>
              Visualize e gerencie todos os alunos cadastrados no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Gerenciamento de Alunos</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Acesse a seção "Gerenciar Alunos" no menu para visualizar todos os alunos cadastrados.
              </p>
              <Button 
                className="mt-4"
                onClick={() => window.location.hash = '/teacher/students'}
              >
                Ir para Gerenciar Alunos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;