import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
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
  Key,
  Edit,
  Trash2,
  Mail,
  User,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface UserWithRole {
  user_id: string;
  full_name?: string;
  role: string;
  created_at: string;
  email?: string;
}

const ManageUsers = () => {
  const { role: currentUserRole, signOut } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("student");
  const [resetPassword, setResetPassword] = useState("");
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");

  const isAdmin = currentUserRole === 'admin';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Buscar usuários com roles e profiles
      const { data: usersData, error: usersError } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          role,
          created_at,
          profiles!inner(full_name)
        `)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Buscar emails do auth.users
      const userIds = usersData?.map(u => u.user_id) || [];
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      
      const merged = (usersData || []).map(user => ({
        ...user,
        email: authUsers.users.find(au => au.id === user.user_id)?.email,
      }));

      setUsers(merged);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error("Erro ao buscar usuários");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!isAdmin) {
      toast.error("Apenas administradores podem criar usuários");
      setIsSubmitting(false);
      return;
    }

    // Validação básica
    if (!newEmail || !newPassword || !newName) {
      toast.error("Preencha todos os campos obrigatórios");
      setIsSubmitting(false);
      return;
    }

    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      setIsSubmitting(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('admin_create_user', {
        p_email: newEmail,
        p_password: newPassword,
        p_full_name: newName,
        p_role: newRole,
      });

      if (error) {
        console.error('RPC Error:', error);
        throw error;
      }

      toast.success(`Usuário ${newRole} criado com sucesso!`);
      setDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      console.error('Create user error:', error);
      toast.error(error.message || "Erro ao criar usuário");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!selectedUser) {
      setIsSubmitting(false);
      return;
    }

    if (!resetPassword || resetPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.rpc('admin_update_user_password', {
        p_user_id: selectedUser.user_id,
        p_new_password: resetPassword,
      });

      if (error) throw error;

      toast.success("Senha atualizada com sucesso!");
      setPasswordDialogOpen(false);
      setResetPassword("");
      setSelectedUser(null);
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar senha");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!selectedUser) {
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.rpc('admin_update_user', {
        p_user_id: selectedUser.user_id,
        p_full_name: editName || undefined,
        p_role: editRole || undefined,
      });

      if (error) throw error;

      toast.success("Usuário atualizado com sucesso!");
      setEditDialogOpen(false);
      setSelectedUser(null);
      setEditName("");
      setEditRole("");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar usuário");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário? Esta ação é irreversível.")) return;

    try {
      const { error } = await supabase.rpc('admin_delete_user', {
        p_user_id: userId,
      });

      if (error) throw error;

      toast.success("Usuário excluído com sucesso!");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir usuário");
    }
  };

  const resetForm = () => {
    setNewEmail("");
    setNewPassword("");
    setNewName("");
    setNewRole("student");
    setIsSubmitting(false);
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

  const students = users.filter(u => u.role === 'student');
  const teachers = users.filter(u => u.role === 'teacher');
  const coordinators = users.filter(u => u.role === 'coordinator');
  const admins = users.filter(u => u.role === 'admin');

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
              {students.length} alunos • {teachers.length} professores • {coordinators.length} coordenadores • {admins.length} admins
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={(open) => { 
            setDialogOpen(open); 
            if (!open) resetForm(); 
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90">
                <UserPlus className="w-4 h-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input 
                    id="name"
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)} 
                    placeholder="Nome completo do usuário"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input 
                    id="email"
                    type="email"
                    value={newEmail} 
                    onChange={(e) => setNewEmail(e.target.value)} 
                    placeholder="email@exemplo.com"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha *</Label>
                  <Input 
                    id="password"
                    type="password"
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Função *</Label>
                  <Select value={newRole} onValueChange={setNewRole} disabled={isSubmitting}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Aluno</SelectItem>
                      <SelectItem value="teacher">Professor</SelectItem>
                      <SelectItem value="coordinator">Coordenador</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-gradient-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Criando...
                      </>
                    ) : (
                      "Criar Usuário"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs para diferentes tipos de usuários */}
        <Tabs defaultValue="students" className="space-y-6">
          <TabsList>
            <TabsTrigger value="students">Alunos ({students.length})</TabsTrigger>
            <TabsTrigger value="teachers">Professores ({teachers.length})</TabsTrigger>
            <TabsTrigger value="coordinators">Coordenadores ({coordinators.length})</TabsTrigger>
            <TabsTrigger value="admins">Administradores ({admins.length})</TabsTrigger>
          </TabsList>

          {/* Alunos */}
          <TabsContent value="students">
            <Card className="glass border-border/50">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {students.length > 0 ? students.map((user) => (
                    <div key={user.user_id} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.full_name || "Sem nome"}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Criado em {new Date(user.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getRoleBadgeClass(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setPasswordDialogOpen(true);
                          }}
                        >
                          <Key className="w-4 h-4 mr-1" />
                          Senha
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setEditName(user.full_name || "");
                            setEditRole(user.role);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-destructive" 
                          onClick={() => handleDeleteUser(user.user_id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )) : (
                    <p className="text-muted-foreground text-center py-8">Nenhum aluno cadastrado</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Professores */}
          <TabsContent value="teachers">
            <Card className="glass border-border/50">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {teachers.length > 0 ? teachers.map((user) => (
                    <div key={user.user_id} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.full_name || "Sem nome"}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getRoleBadgeClass(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setPasswordDialogOpen(true);
                          }}
                        >
                          <Key className="w-4 h-4 mr-1" />
                          Senha
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setEditName(user.full_name || "");
                            setEditRole(user.role);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-destructive" 
                          onClick={() => handleDeleteUser(user.user_id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )) : (
                    <p className="text-muted-foreground text-center py-8">Nenhum professor cadastrado</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Coordenadores */}
          <TabsContent value="coordinators">
            <Card className="glass border-border/50">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {coordinators.length > 0 ? coordinators.map((user) => (
                    <div key={user.user_id} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-level/20 flex items-center justify-center">
                          <Shield className="w-5 h-5 text-level" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.full_name || "Sem nome"}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getRoleBadgeClass(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setPasswordDialogOpen(true);
                          }}
                        >
                          <Key className="w-4 h-4 mr-1" />
                          Senha
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setEditName(user.full_name || "");
                            setEditRole(user.role);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-destructive" 
                          onClick={() => handleDeleteUser(user.user_id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )) : (
                    <p className="text-muted-foreground text-center py-8">Nenhum coordenador cadastrado</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Administradores */}
          <TabsContent value="admins">
            <Card className="glass border-border/50">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {admins.length > 0 ? admins.map((user) => (
                    <div key={user.user_id} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-badge-gold/20 flex items-center justify-center">
                          <Crown className="w-5 h-5 text-badge-gold" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.full_name || "Sem nome"}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getRoleBadgeClass(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setPasswordDialogOpen(true);
                          }}
                        >
                          <Key className="w-4 h-4 mr-1" />
                          Senha
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setEditName(user.full_name || "");
                            setEditRole(user.role);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        {admins.length > 1 && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-destructive" 
                            onClick={() => handleDeleteUser(user.user_id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )) : (
                    <p className="text-muted-foreground text-center py-8">Nenhum administrador cadastrado</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialog para reset de senha */}
      <Dialog open={passwordDialogOpen} onOpenChange={(open) => { 
        setPasswordDialogOpen(open); 
        if (!open) {
          setResetPassword("");
          setSelectedUser(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Usuário: <strong>{selectedUser?.full_name}</strong>
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="resetPassword">Nova Senha</Label>
              <Input
                id="resetPassword"
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="Digite a nova senha"
                minLength={6}
                required
                disabled={isSubmitting}
              />
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setPasswordDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Atualizando...
                  </>
                ) : (
                  "Atualizar Senha"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar usuário */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { 
        setEditDialogOpen(open); 
        if (!open) {
          setEditName("");
          setEditRole("");
          setSelectedUser(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Usuário: <strong>{selectedUser?.full_name}</strong>
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editName">Nome Completo</Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nome do usuário"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRole">Função</Label>
              <Select value={editRole} onValueChange={setEditRole} disabled={isSubmitting}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Aluno</SelectItem>
                  <SelectItem value="teacher">Professor</SelectItem>
                  <SelectItem value="coordinator">Coordenador</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setEditDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Atualizando...
                  </>
                ) : (
                  "Atualizar Usuário"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageUsers;