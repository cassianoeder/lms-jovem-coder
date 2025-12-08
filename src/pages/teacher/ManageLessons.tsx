import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Code2,
  Plus,
  ArrowLeft,
  BookOpen,
  Pencil,
  Trash2,
  Video,
  Clock,
  Zap,
  LogOut,
  Layers,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: string;
  title: string;
}

interface Module {
  id: string;
  title: string;
  course_id: string;
  courses?: { title: string } | null;
}

interface Lesson {
  id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  order_index: number;
  xp_reward: number;
  duration_minutes: number;
  module_id: string | null;
  course_id: string;
  modules?: { title: string; courses?: { title: string } | null } | null;
}

const ManageLessons = () => {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [filteredModules, setFilteredModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [courseId, setCourseId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [xpReward, setXpReward] = useState(10);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (courseId) {
      setFilteredModules(modules.filter(m => m.course_id === courseId));
    } else {
      setFilteredModules([]);
    }
    setModuleId("");
  }, [courseId, modules]);

  const fetchData = async () => {
    try {
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, title')
        .order('order_index');
      setCourses(coursesData || []);

      const { data: modulesData } = await supabase
        .from('modules')
        .select('id, title, course_id, courses(title)')
        .eq('is_active', true)
        .order('order_index');
      setModules(modulesData as Module[] || []);

      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('*, modules(title, courses(title))')
        .order('order_index');
      setLessons(lessonsData as Lesson[] || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setVideoUrl("");
    setCourseId("");
    setModuleId("");
    setXpReward(10);
    setDuration(0);
    setEditingLesson(null);
  };

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setTitle(lesson.title);
    setContent(lesson.content || "");
    setVideoUrl(lesson.video_url || "");
    // Find the module to get the course_id
    const lessonModule = modules.find(m => m.id === lesson.module_id);
    if (lessonModule) {
      setCourseId(lessonModule.course_id);
      setFilteredModules(modules.filter(m => m.course_id === lessonModule.course_id));
    }
    setModuleId(lesson.module_id || "");
    setXpReward(lesson.xp_reward);
    setDuration(lesson.duration_minutes);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!moduleId) {
      toast({ title: "Erro", description: "Selecione um módulo", variant: "destructive" });
      return;
    }

    const selectedModule = modules.find(m => m.id === moduleId);
    
    const lessonData = {
      title,
      content,
      video_url: videoUrl || null,
      module_id: moduleId,
      course_id: selectedModule?.course_id || courseId,
      xp_reward: xpReward,
      duration_minutes: duration,
    };

    try {
      if (editingLesson) {
        const { error } = await supabase
          .from('lessons')
          .update(lessonData)
          .eq('id', editingLesson.id);
        
        if (error) throw error;
        toast({ title: "Sucesso", description: "Aula atualizada!" });
      } else {
        const { error } = await supabase
          .from('lessons')
          .insert(lessonData);
        
        if (error) throw error;
        toast({ title: "Sucesso", description: "Aula criada!" });
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta aula?")) return;

    try {
      const { error } = await supabase.from('lessons').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Sucesso", description: "Aula excluída!" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  // Group lessons by module
  const lessonsByModule = lessons.reduce((acc, lesson) => {
    const moduleTitle = lesson.modules?.title || "Sem Módulo";
    const courseTitle = lesson.modules?.courses?.title || "Sem Curso";
    const key = `${courseTitle} > ${moduleTitle}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(lesson);
    return acc;
  }, {} as Record<string, Lesson[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

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
              <span className="font-display text-lg font-bold text-foreground">Gerenciar Aulas</span>
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
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">Aulas</h1>
            <p className="text-muted-foreground">{lessons.length} aulas cadastradas</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                Nova Aula
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingLesson ? "Editar Aula" : "Nova Aula"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Curso</Label>
                    <Select value={courseId} onValueChange={setCourseId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o curso" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Módulo *</Label>
                    <Select value={moduleId} onValueChange={setModuleId} disabled={!courseId}>
                      <SelectTrigger>
                        <SelectValue placeholder={courseId ? "Selecione o módulo" : "Selecione um curso primeiro"} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredModules.map((module) => (
                          <SelectItem key={module.id} value={module.id}>{module.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {courseId && filteredModules.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Nenhum módulo encontrado. <Link to="/teacher/modules" className="text-primary underline">Crie um módulo primeiro.</Link>
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label>Conteúdo</Label>
                  <Textarea 
                    value={content} 
                    onChange={(e) => setContent(e.target.value)} 
                    rows={5}
                    placeholder="Conteúdo da aula em texto ou Markdown..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>URL do Vídeo (opcional)</Label>
                  <Input 
                    value={videoUrl} 
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>XP de Recompensa</Label>
                    <Input 
                      type="number" 
                      value={xpReward} 
                      onChange={(e) => setXpReward(Number(e.target.value))}
                      min={0}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duração (minutos)</Label>
                    <Input 
                      type="number" 
                      value={duration} 
                      onChange={(e) => setDuration(Number(e.target.value))}
                      min={0}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-gradient-primary">
                    {editingLesson ? "Salvar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {Object.keys(lessonsByModule).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(lessonsByModule).map(([groupName, groupLessons]) => (
              <div key={groupName}>
                <div className="flex items-center gap-2 mb-4">
                  <Layers className="w-5 h-5 text-primary" />
                  <h2 className="font-display text-lg font-semibold text-foreground">{groupName}</h2>
                  <Badge variant="secondary">{groupLessons.length}</Badge>
                </div>
                <div className="grid gap-3">
                  {groupLessons.map((lesson) => (
                    <Card key={lesson.id} className="glass border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-accent flex items-center justify-center">
                              {lesson.video_url ? <Video className="w-6 h-6 text-white" /> : <BookOpen className="w-6 h-6 text-white" />}
                            </div>
                            <div>
                              <h3 className="font-medium text-foreground">{lesson.title}</h3>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="bg-xp/10 text-xp">
                                <Zap className="w-3 h-3 mr-1" />
                                {lesson.xp_reward} XP
                              </Badge>
                              {lesson.duration_minutes > 0 && (
                                <Badge variant="secondary">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {lesson.duration_minutes} min
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(lesson)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(lesson.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card className="glass border-border/50">
            <CardContent className="p-8 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma aula cadastrada. Clique em "Nova Aula" para começar.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ManageLessons;