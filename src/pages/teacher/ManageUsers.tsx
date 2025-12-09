import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  ArrowLeft, Users, Search, Edit, Trash2, LogOut
} from "lucide-react";
import { useAuth, AppRole } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from '@supabase/supabase-js';

interface UserWithRole {
  user_id: string;
  full_name: string | null;
  email: string;
  role: AppRole;
  created_at: string;
  avatar_url: string | null;
}

const ManageUsers = () => {
  const { user, role: currentUserRole, signOut } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);

  // Form states for editing user
  const [editFullName, setEditFullName] = useState("");
  const [editRole, setEditRole] = useState<AppRole>('student');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch all auth users
      const { data: authUsersData, error: authUsersError } = await supabase.auth.admin.listUsers();
      if (authUsersError) throw authUsersError;
      
      const authUsersMap = new Map<string, SupabaseUser>();
      if (authUsersData && authUsersData.users) {
        authUsersData.users.forEach((u: SupabaseUser) => authUsersMap.set(u.id, u)); // Corrigido: tipagem explícita para 'u'
      }

      // Fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, created_at');
      if (profilesError) throw profilesError;
      const profilesMap = new Map<string, { user_id: string; full_name: string | null; avatar_url: string | null; created_at: string; }>();
      profilesData?.forEach(p => profilesMap.set(p.user_id, p));

      // Fetch all user roles
      const { data: userRolesData, error: userRolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      if (userRolesError) throw userRolesError;
      const userRolesMap = new Map<string, { user_id: string; role: AppRole; }>();
      userRolesData?.forEach(ur => userRolesMap.set(ur.user_id, ur as { user_id: string; role: AppRole; }));

      const combinedUsers: UserWithRole[] = [];
      for (const [userId, authUser] of authUsersMap.entries()) {
        const profile = profilesMap.get(userId);
        const userRole = userRolesMap.get(userId);

        if (profile && userRole) {
          combinedUsers.push({
            user_id: userId,
            full_name: profile.full_name,
            email: authUser.email || 'N/A',
            role: userRole.role,
            created_at: profile.created_at,
            avatar_url: profile.avatar_url,
          });
        }
      }
      setUsers(combinedUsers);

    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Erro ao carregar usuários.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser || !editFullName || !editRole) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc('admin_update_user', {
        p_user_id: selectedUser.user_id,
        p_full_name: editFullName,
        p_role: editRole,
      });
      if (error) throw error;
      toast.success("Usuário atualizado com sucesso!");
      setEditUserDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error("Erro ao atualizar usuário: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário? Esta ação é irreversível e removerá todos os dados associados.")) return;
    try {
      const { error } = await supabase.rpc('admin_delete_user', { p_user_id: userId });
      if (error) throw error;
      toast.success("Usuário excluído com sucesso!");
      fetchUsers();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error("Erro ao excluir usuário: " + error.message);
    }
  };

  const openEditUserDialog = (user: UserWithRole) => {
    setSelectedUser(user);
    setEditFullName(user.full_name || '');
    setEditRole(user.role);
    setEditUserDialogOpen(true);
  };

  const filteredUsers = users.filter(u =>
    (u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark">
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/teacher">
              <Button variant="outline" size="icon"><ArrowLeft className="w-5 h-5 text-foreground" /></Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Users className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold text-foreground">Gerenciar Usuários</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-foreground font-medium">Olá, {user?.user_metadata?.full_name || user?.email}!</span>
            <Button variant="outline" size="icon" onClick={signOut}>
              <LogOut className="w-5 h-5 text-foreground" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar usuário por nome ou email..." 
              className="pl-10" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <Card className="glass border-border/50">
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado ainda"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass border-border/50">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Criado Em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="font-medium text-primary">
                            {user.full_name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <p className="font-medium">{user.full_name}</p>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-level/10 text-level">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openEditUserDialog(user)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      {currentUserRole === 'admin' && (
                        <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleDeleteUser(user.user_id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </main>

      {/* Edit User Dialog */}
      <Dialog open={editUserDialogOpen} onOpenChange={setEditUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleUpdateUser(); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editFullName">Nome Completo</Label>
              <Input
                id="editFullName"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                placeholder="Nome completo do usuário"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRole">Role</Label>
              <Select value={editRole} onValueChange={(value: AppRole) => setEditRole(value)} disabled={isSubmitting}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="coordinator">Coordinator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditUserDialogOpen(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-gradient-primary" disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Salvar Alterações"
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