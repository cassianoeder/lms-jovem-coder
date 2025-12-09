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
import { Code2, ArrowLeft, Plus, Pencil, Trash2, GraduationCap, Layers, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Course {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  order_index: number;
  created_at: string;
}

const ManageCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [moduleCounts, setModuleCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    order_index: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    const { data: coursesData } = await supabase.from('courses').select('*').order('order_index');
    if (coursesData) {
      setCourses(coursesData);
      // Fetch module counts
      const { data: modulesData } = await supabase.from('modules').select('course_id');
      const counts: Record<string, number> = {};
      modulesData?.forEach(m => {
        counts[m.course_id] = (counts[m.course_id] || 0) + 1;
      });
      setModuleCounts(counts);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      title: formData.title,
      description: formData.description || null,
      image_url: formData.image_url || null,
      order_index: formData.order_index,
    };

    if (selectedCourse) {
      const { error } = await supabase.from('courses').update(payload).eq('id', selectedCourse.id);
      if (error) {
        toast.error("Erro ao atualizar curso");
        return;
      }
      toast.success("Curso atualizado!");
    } else {
      const { error } = await supabase.from('courses').insert(payload);
      if (error) {
        toast.error("Erro ao criar curso");
        return;
      }
      toast.success("Curso criado!");
    }

    setIsDialogOpen(false);
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este curso? Todos os módulos e aulas associados serão excluídos.")) return;
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) {
      toast.error("Erro ao excluir curso");
      return;
    }
    toast.success("Curso excluído!");
    fetchData();
  };

  const handleEdit = (course: Course) => {
    setSelectedCourse(course);
    setFormData({
      title: course.title,
      description: course.description || "",
      image_url: course.image_url || "",
      order_index: course.order_index || 0,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setSelectedCourse(null);
    setFormData({ title: "", description: "", image_url: "", order_index: 0 });
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
              <div className="w-9 h-9 rounded-xl bg-gradient-xp flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold text-foreground">Gerenciar Cursos</span>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-xp hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />Novo Curso
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{selectedCourse ? "Editar Curso" : "Novo Curso"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Título do Curso</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Python para Iniciantes"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição do curso..."
                  />
                </div>
                <div>
                  <Label htmlFor="image_url">Emoji ou URL da Imagem</Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="🐍 ou https://..."
                  />
                </div>
                <div>
                  <Label htmlFor="order">Ordem de Exibição</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order_index}
                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-gradient-xp hover:opacity-90">
                    {selectedCourse ? "Salvar" : "Criar Curso"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {courses.length === 0 ? (
          <Card className="glass border-border/50">
            <CardContent className="py-12 text-center">
              <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum curso cadastrado</p>
              <Button className="mt-4 bg-gradient-xp" onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />Criar Primeiro Curso
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <Card key={course.id} className="glass border-border/50 hover:border-primary/30 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center text-3xl shrink-0">
                      {course.image_url?.startsWith('http') ? (
                        <img src={course.image_url} alt={course.title} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        course.image_url || "📚"
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{course.title}</CardTitle>
                      {course.description && (
                        <CardDescription className="line-clamp-2 mt-1">{course.description}</CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="secondary" className="bg-accent/10 text-accent">
                      <Layers className="w-3 h-3 mr-1" />
                      {moduleCounts[course.id] || 0} módulos
                    </Badge>
                    <Badge variant="secondary" className="bg-muted text-muted-foreground">
                      Ordem: {course.order_index}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(course)}>
                      <Pencil className="w-4 h-4 mr-1" />Editar
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(course.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ManageCourses;