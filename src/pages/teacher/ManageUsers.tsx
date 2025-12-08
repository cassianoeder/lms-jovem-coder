import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Code2,
  ArrowLeft,
  Users,
  UserPlus,
  LogOut,
  Shield,
  GraduationCap,
  BookOpen,
  Crown,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserWithRole {
  id: string;
  user_id: string;
  role: string;
  full_name?: string;
}

const ManageUsers = () => {
  const { role: currentUserRole, signOut } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state for creating new user
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<string>("teacher");

  const isAdmin = currentUserRole === 'admin';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('id, user_id, role')
        .order('role');

      if (rolesError) throw rolesError;

      // Fetch profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name');

      // Merge data
      const merged = (rolesData || []).map(role => ({
        ...role,
        full_name: profilesData?.find(p => p.user_id === role.user_id)?.full_name || 'Sem nome'
      }));

      setUsers(merged);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin) {
      toast({ title: "Erro", description: "Apenas administradores podem criar usuários", variant: "destructive" });
      return;
    }

    try {
      // Create user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newEmail,
        password: newPassword,
        options: {
          data: {
            full_name: newName,
            role: 'student', // Will be overridden by admin
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update the role to the selected one (admin function)
        const { error: rpcError } = await supabase.rpc('admin_set_user_role', {
          target_user_id: authData.user.id,
          new_role: newRole as any,
        });

        if (rpcError) throw rpcError;

        toast({ title: "Sucesso", description: `Usuário ${newRole} criado com sucesso!` });
        setDialogOpen(false);
        setNewEmail("");
        setNewPassword("");
        setNewName("");
        setNewRole("teacher");
        fetchUsers();
      }
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-5 h-5" />;
      case 'coordinator': return <Shield className="w-5 h-5" />;
      case 'teacher': return <BookOpen className="w-5 h-5" />;
      default: return <GraduationCap className="w-5 h-5" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'coordinator': return 'Coordenador';
      case 'teacher': return 'Professor';
      default: return 'Aluno';
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-badge-gold/20 text-badge-gold';
      case 'coordinator': return 'bg-level/20 text-level';
      case 'teacher': return 'bg-accent/20 text-accent';
      default: return 'bg-primary/20 text-primary';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background dark flex items-center justify-center">
        <Card className="glass border-border/50 max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground mb-4">
              Apenas administradores podem gerenciar usuários.
            </p>
            <Link to="/teacher">
              <Button variant="outline">Voltar ao Painel</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const teachers = users.filter(u => u.role === 'teacher');
  const coordinators = users.filter(u => u.role === 'coordinator');
  const admins = users.filter(u => u.role === 'admin');
  const students = users.filter(u => u.role === 'student');

  return (
    <div className="min-h-screen bg-background dark">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/teacher" className="text-muted-foreground hover:text-foreground">
              <Button variant="outline" size="icon"><ArrowLeft className="w-5 h-5 text-foreground" /></Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Code2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold text-foreground">Gerenciar Usuários</span>
            </div>
          </div>

          <Button variant="outline" size="icon" onClick={signOut}>
            <LogOut className="w-5 h-5 text-foreground" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">Usuários</h1>
            <p className="text-muted-foreground">
              {teachers.length} professores • {coordinators.length} coordenadores • {students.length} alunos
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90">
                <UserPlus className="w-4 h-4 mr-2" />
                Novo Professor/Coordenador
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <Input 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)} 
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    type="email"
                    value={newEmail} 
                    onChange={(e) => setNewEmail(e.target.value)} 
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input 
                    type="password"
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={6}
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Função</Label>
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teacher">Professor</SelectItem>
                      <SelectItem value="coordinator">Coordenador</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-gradient-primary">
                    Criar Usuário
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Admins & Coordinators */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Crown className="w-5 h-5 text-badge-gold" />
                Administradores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {admins.length > 0 ? admins.map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
                  <div className="w-10 h-10 rounded-full bg-badge-gold/20 flex items-center justify-center text-badge-gold">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{user.full_name || "Sem nome"}</p>
                  </div>
                  <Badge className={getRoleBadgeClass(user.role)}>{getRoleLabel(user.role)}</Badge>
                </div>
              )) : (
                <p className="text-muted-foreground text-center py-4">Nenhum administrador</p>
              )}
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Shield className="w-5 h-5 text-level" />
                Coordenadores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {coordinators.length > 0 ? coordinators.map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
                  <div className="w-10 h-10 rounded-full bg-level/20 flex items-center justify-center text-level">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{user.full_name || "Sem nome"}</p>
                  </div>
                  <Badge className={getRoleBadgeClass(user.role)}>{getRoleLabel(user.role)}</Badge>
                </div>
              )) : (
                <p className="text-muted-foreground text-center py-4">Nenhum coordenador</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Teachers */}
        <Card className="glass border-border/50 mb-6">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-accent" />
              Professores ({teachers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teachers.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {teachers.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{user.full_name || "Sem nome"}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">Nenhum professor cadastrado</p>
            )}
          </CardContent>
        </Card>

        {/* Students count */}
        <Card className="glass border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Alunos</p>
                <p className="font-display text-3xl font-bold text-foreground">{students.length}</p>
                <p className="text-sm text-muted-foreground">Alunos se cadastram automaticamente pelo sistema</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ManageUsers;