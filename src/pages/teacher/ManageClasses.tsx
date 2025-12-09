import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  ArrowLeft, Plus, Edit, Trash2, Search, Users, BookOpen, Shield, LogOut
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Class {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  status: string;
  teacher_id: string | null;
  created_at: string;
  updated_at: string;
}

const ManageClasses = () => {
  const { user, signOut } = useAuth(); // Corrigido: signOut agora está disponível
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  // Form states
  const [className, setClassName] = useState("");
  const [classDescription, setClassDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [classStatus, setClassStatus] = useState("active");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast.error("Erro ao carregar turmas.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async () => {
    if (!className) {
      toast.error("O nome da turma é obrigatório.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('classes').insert({
        name: className,
        description: classDescription,
        is_public: isPublic,
        status: classStatus,
        teacher_id: user?.id, // Atribuir o professor logado
      });
      if (error) throw error;
      toast.success("Turma criada com sucesso!");
      setCreateDialogOpen(false);
      resetForm();
      fetchClasses();
    } catch (error: any) {
      console.error("Error creating class:", error);
      toast.error("Erro ao criar turma: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateClass = async () => {
    if (!selectedClass || !className) {
      toast.error("O nome da turma é obrigatório.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('classes')
        .update({
          name: className,
          description: classDescription,
          is_public: isPublic,
          status: classStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedClass.id);
      if (error) throw error;
      toast.success("Turma atualizada com sucesso!");
      setEditDialogOpen(false);
      resetForm();
      fetchClasses();
    } catch (error: any) {
      console.error("Error updating class:", error);
      toast.error("Erro ao atualizar turma: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta turma? Esta ação é irreversível e removerá todos os cursos e matrículas associados.")) return;
    try {
      // Delete related class_courses first
      const { error: classCoursesError } = await supabase
        .from('class_courses')
        .delete()
        .eq('class_id', classId);
      if (classCoursesError) throw classCoursesError;

      // Delete related enrollments
      const { error: enrollmentsError } = await supabase
        .from('enrollments')
        .delete()
        .eq('class_id', classId);
      if (enrollmentsError) throw enrollmentsError;

      // Then delete the class
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId);
      if (error) throw error;
      toast.success("Turma excluída com sucesso!");
      fetchClasses();
    } catch (error: any) {
      console.error("Error deleting class:", error);
      toast.error("Erro ao excluir turma: " + error.message);
    }
  };

  const openEditDialog = (cls: Class) => {
    setSelectedClass(cls);
    setClassName(cls.name);
    setClassDescription(cls.description || "");
    setIsPublic(cls.is_public);
    setClassStatus(cls.status);
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setClassName("");
    setClassDescription("");
    setIsPublic(true);
    setClassStatus("active");
    setSelectedClass(null);
    setIsSubmitting(false);
  };

  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.description?.toLowerCase().includes(searchQuery.toLowerCase())
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
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold text-foreground">Gerenciar Turmas</span>
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
              placeholder="Buscar turma por nome ou descrição..." 
              className="pl-10" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            className="bg-gradient-primary hover:opacity-90"
            onClick={() => { setCreateDialogOpen(true); resetForm(); }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Turma
          </Button>
        </div>

        {filteredClasses.length === 0 ? (
          <Card className="glass border-border/50">
            <CardContent className="py-12 text-center">
              <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "Nenhuma turma encontrada" : "Nenhuma turma cadastrada ainda"}
              </p>
              <Button 
                className="mt-4 bg-gradient-primary"
                onClick={() => { setCreateDialogOpen(true); resetForm(); }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Turma
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass border-border/50">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome da Turma</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Pública</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClasses.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">{cls.name}</TableCell>
                    <TableCell className="text-muted-foreground">{cls.description || 'N/A'}</TableCell>
                    <TableCell>{cls.is_public ? 'Sim' : 'Não'}</TableCell>
                    <TableCell>{cls.status}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(cls)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleDeleteClass(cls.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </main>

      {/* Create Class Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Turma</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleCreateClass(); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="className">Nome da Turma *</Label>
              <Input
                id="className"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Ex: Turma de JavaScript Avançado"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="classDescription">Descrição</Label>
              <Textarea
                id="classDescription"
                value={classDescription}
                onChange={(e) => setClassDescription(e.target.value)}
                placeholder="Uma breve descrição da turma"
                disabled={isSubmitting}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isPublic"
                checked={isPublic}
                onCheckedChange={setIsPublic}
                disabled={isSubmitting}
              />
              <Label htmlFor="isPublic">Turma Pública</Label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-gradient-primary" disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Criar Turma"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Class Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Turma</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleUpdateClass(); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editClassName">Nome da Turma *</Label>
              <Input
                id="editClassName"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Ex: Turma de JavaScript Avançado"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editClassDescription">Descrição</Label>
              <Textarea
                id="editClassDescription"
                value={classDescription}
                onChange={(e) => setClassDescription(e.target.value)}
                placeholder="Uma breve descrição da turma"
                disabled={isSubmitting}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="editIsPublic"
                checked={isPublic}
                onCheckedChange={setIsPublic}
                disabled={isSubmitting}
              />
              <Label htmlFor="editIsPublic">Turma Pública</Label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isSubmitting}>
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

export default ManageClasses;