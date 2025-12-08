import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Code2, ArrowLeft, Plus, Pencil, Trash2, Layers, BookOpen, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  courses?: { title: string };
}

interface Course {
  id: string;
  title: string;
}

const ManageModules = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    course_id: "",
    is_active: true,
    order_index: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    const [modulesRes, coursesRes] = await Promise.all([
      supabase.from('modules').select('*, courses(title)').order('order_index'),
      supabase.from('courses').select('id, title').order('title'),
    ]);

    if (modulesRes.data) setModules(modulesRes.data as Module[]);
    if (coursesRes.data) setCourses(coursesRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.course_id) {
      toast.error("Selecione um curso");
      return;
    }

    const payload = {
      title: formData.title,
      description: formData.description || null,
      course_id: formData.course_id,
      is_active: formData.is_active,
      order_index: formData.order_index,
    };

    if (selectedModule) {
      const { error } = await supabase.from('modules').update(payload).eq('id', selectedModule.id);
      if (error) {
        toast.error("Erro ao atualizar módulo");
        return;
      }
      toast.success("Módulo atualizado!");
    } else {
      const { error } = await supabase.from('modules').insert(payload);
      if (error) {
        toast.error("Erro ao criar módulo");
        return;
      }
      toast.success("Módulo criado!");
    }

    setIsDialogOpen(false);
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este módulo?")) return;
    const { error } = await supabase.from('modules').delete().eq('id', id);
    if (error) {
      toast.error("Erro ao excluir módulo");
      return;
    }
    toast.success("Módulo excluído!");
    fetchData();
  };

  const handleEdit = (mod: Module) => {
    setSelectedModule(mod);
    setFormData({
      title: mod.title,
      description: mod.description || "",
      course_id: mod.course_id,
      is_active: mod.is_active,
      order_index: mod.order_index,
    });
    setIsDialogOpen(true);
  };

  const toggleActive = async (mod: Module) => {
    const { error } = await supabase.from('modules').update({ is_active: !mod.is_active }).eq('id', mod.id);
    if (error) {
      toast.error("Erro ao atualizar módulo");
      return;
    }
    toast.success(mod.is_active ? "Módulo desativado" : "Módulo ativado");
    fetchData();
  };

  const resetForm = () => {
    setSelectedModule(null);
    setFormData({ title: "", description: "", course_id: "", is_active: true, order_index: 0 });
  };

  // Group modules by course
  const modulesByCourse = modules.reduce((acc, mod) => {
    const courseName = mod.courses?.title || "Sem Curso";
    if (!acc[courseName]) acc[courseName] = [];
    acc[courseName].push(mod);
    return acc;
  }, {} as Record<string, Module[]>);

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
              <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-accent flex items-center justify-center">
                <Layers className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold text-foreground">Gerenciar Módulos</span>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-accent hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />Novo Módulo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{selectedModule ? "Editar Módulo" : "Novo Módulo"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="course">Curso *</Label>
                  <Select value={formData.course_id} onValueChange={(v) => setFormData({ ...formData, course_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um curso" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="title">Título do Módulo</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Introdução ao Python"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição do módulo..."
                  />
                </div>
                <div>
                  <Label htmlFor="order">Ordem</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order_index}
                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    {formData.is_active ? <Eye className="w-5 h-5 text-primary" /> : <EyeOff className="w-5 h-5 text-muted-foreground" />}
                    <div>
                      <p className="font-medium">{formData.is_active ? "Módulo Ativo" : "Módulo Inativo"}</p>
                      <p className="text-sm text-muted-foreground">
                        {formData.is_active ? "Visível para alunos" : "Oculto para alunos"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-gradient-accent hover:opacity-90">
                    {selectedModule ? "Salvar" : "Criar Módulo"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {modules.length === 0 ? (
          <Card className="glass border-border/50">
            <CardContent className="py-12 text-center">
              <Layers className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum módulo cadastrado</p>
              <p className="text-sm text-muted-foreground mt-1">Crie cursos primeiro para depois adicionar módulos</p>
              <Button className="mt-4 bg-gradient-accent" onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />Criar Primeiro Módulo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(modulesByCourse).map(([courseName, courseModules]) => (
              <div key={courseName}>
                <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  {courseName}
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courseModules.map((mod) => (
                    <Card key={mod.id} className={`glass border-border/50 hover:border-primary/30 transition-colors ${!mod.is_active ? 'opacity-60' : ''}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <Badge variant="secondary" className={mod.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}>
                            {mod.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">Ordem: {mod.order_index}</span>
                        </div>
                        <CardTitle className="text-lg mt-2">{mod.title}</CardTitle>
                        {mod.description && (
                          <CardDescription className="line-clamp-2">{mod.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2 flex-wrap">
                          <Button variant="outline" size="sm" onClick={() => toggleActive(mod)}>
                            {mod.is_active ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                            {mod.is_active ? "Desativar" : "Ativar"}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(mod)}>
                            <Pencil className="w-4 h-4 mr-1" />Editar
                          </Button>
                          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(mod.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ManageModules;
