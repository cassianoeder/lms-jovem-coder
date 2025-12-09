import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Code2, ArrowLeft, Plus, Pencil, Trash2, Users, BookOpen, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Class {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  status: string | null;
  teacher_id: string | null;
  created_at: string;
  updated_at: string;
}

interface EnrollmentRequest {
  id: string;
  class_id: string;
  student_id: string;
  message: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  profiles?: {
    full_name: string;
  };
}

const ManageClasses = () => {
  const { user, signOut } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [enrollmentRequests, setEnrollmentRequests] = useState<EnrollmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_public: true,
    status: "active",
  });

  useEffect(() => {
    const fetchData = async () => {
      const [classesRes, requestsRes] = await Promise.all([
        supabase.from('classes').select('*').order('name'),
        supabase.from('enrollment_requests').select('*, profiles(full_name)').eq('status', 'pending').order('created_at'),
      ]);
      
      if (classesRes.data) setClasses(classesRes.data);
      if (requestsRes.data) setEnrollmentRequests(requestsRes.data);
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      description: formData.description || null,
      is_public: formData.is_public,
      status: formData.status,
      teacher_id: user?.id,
    };

    if (selectedClass) {
      const { error } = await supabase.from('classes').update(payload).eq('id', selectedClass.id);
      if (error) {
        toast.error("Erro ao atualizar turma");
        return;
      }
      toast.success("Turma atualizada!");
    } else {
      const { error } = await supabase.from('classes').insert(payload);
      if (error) {
        toast.error("Erro ao criar turma");
        return;
      }
      toast.success("Turma criada!");
    }

    setDialogOpen(false);
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta turma?")) return;
    const { error } = await supabase.from('classes').delete().eq('id', id);
    if (error) {
      toast.error("Erro ao excluir turma");
      return;
    }
    toast.success("Turma excluída!");
    fetchData();
  };

  const handleEdit = (cls: Class) => {
    setSelectedClass(cls);
    setFormData({
      name: cls.name,
      description: cls.description || "",
      is_public: cls.is_public,
      status: cls.status || "active",
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setSelectedClass(null);
    setFormData({
      name: "",
      description: "",
      is_public: true,
      status: "active",
    });
  };

  const handleApproveRequest = async (requestId: string, classId: string, studentId: string) => {
    // Create enrollment
    const { error: enrollError } = await supabase.from('enrollments').insert({
      student_id: studentId,
      class_id: classId,
      status: 'approved',
    });

    if (enrollError) {
      toast.error("Erro ao aprovar solicitação");
      return;
    }

    // Update request status
    const { error: updateError } = await supabase.from('enrollment_requests').update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user?.id,
    }).eq('id', requestId);

    if (updateError) {
      toast.error("Erro ao atualizar solicitação");
      return;
    }

    toast.success("Solicitação aprovada!");
    fetchData();
  };

  const handleRejectRequest = async (requestId: string) => {
    const { error } = await supabase.from('enrollment_requests').update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user?.id,
    }).eq('id', requestId);

    if (error) {
      toast.error("Erro ao rejeitar solicitação");
      return;
    }

    toast.success("Solicitação rejeitada!");
    fetchData();
  };

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
                <Code2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold text-foreground">Gerenciar Turmas</span>
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
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">Turmas</h1>
            <p className="text-muted-foreground">{classes.length} turmas cadastradas</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />Nova Turma
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{selectedClass ? "Editar Turma" : "Nova Turma"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome da Turma</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Turma de Python Básico"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição da turma..."
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={formData.is_public}
                    onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                  />
                  <Label htmlFor="is_public">Turma pública</Label>
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-gradient-primary">
                    {selectedClass ? "Salvar" : "Criar Turma"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {classes.map((cls) => (
            <Card key={cls.id} className="glass border-border/50 hover:border-primary/30 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className={cls.is_public ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}>
                    {cls.is_public ? "Pública" : "Privada"}
                  </Badge>
                  <Badge variant="secondary" className="bg-accent/10 text-accent">
                    {cls.status || "Ativa"}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{cls.name}</CardTitle>
                {cls.description && (
                  <CardDescription className="line-clamp-2">{cls.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(cls)}>
                    <Pencil className="w-4 h-4 mr-1" />Editar
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(cls.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {enrollmentRequests.length > 0 && (
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Solicitações de Matrícula ({enrollmentRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {enrollmentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 rounded-lg bg-card border border-border/50">
                    <div>
                      <p className="font-medium">{request.profiles?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Solicitou entrada em {new Date(request.created_at).toLocaleDateString('pt-BR')}
                      </p>
                      {request.message && (
                        <p className="text-sm text-muted-foreground mt-1">"{request.message}"</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleApproveRequest(request.id, request.class_id, request.student_id)}>
                        Aprovar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleRejectRequest(request.id)}>
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ManageClasses;