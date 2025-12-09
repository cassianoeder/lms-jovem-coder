import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Code2, ArrowLeft, Plus, Pencil, Trash2, BookOpen, Video, Clock, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Lesson {
  id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  duration_minutes: number;
  xp_reward: number;
  module_id: string | null;
  order_index: number;
  course_id: string;
  created_at: string;
}

interface Module {
  id: string;
  title: string;
  course_id: string;
}

interface Course {
  id: string;
  title: string;
}

const ManageLessons = () => {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  
  // Form state
  const [moduleId, setModuleId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [duration, setDuration] = useState(0);
  const [xpReward, setXpReward] = useState(10);
  const [courseId, setCourseId] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const [lessonsRes, modulesRes, coursesRes] = await Promise.all([
      supabase.from('lessons').select('*').order('order_index'),
      supabase.from('modules').select('id, title, course_id').order('order_index'),
      supabase.from('courses').select('id, title').order('title'),
    ]);
    
    if (lessonsRes.data) setLessons(lessonsRes.data);
    if (modulesRes.data) setModules(modulesRes.data);
    if (coursesRes.data) setCourses(coursesRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!moduleId) {
      toast.error("Selecione um módulo");
      return;
    }

    const selectedModule = modules.find(m => m.id === moduleId);
    
    // Tente usar RPC primeiro
    try {
      const { data, error } = await supabase.rpc('admin_create_lesson', {
        p_course_id: selectedModule?.course_id || courseId,
        p_title: title,
        p_content: content,
        p_video_url: videoUrl || null,
        p_duration_minutes: duration,
        p_xp_reward: xpReward,
        p_module_id: moduleId,
        p_order_index: 0
      });
      
      if (error) throw error;
      
      toast.success("Aula criada via RPC!");
      setDialogOpen(false);
      resetForm();
      fetchData();
      return;
    } catch (rpcError) {
      console.log("RPC failed, trying direct insert:", rpcError);
    }

    // Se RPC falhar, tente inserção direta
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
        toast.success("Aula atualizada!");
      } else {
        const { error } = await supabase
          .from('lessons')
          .insert(lessonData);
        
        if (error) throw error;
        toast.success("Aula criada!");
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta aula?")) return;
    const { error } = await supabase.from('lessons').delete().eq('id', id);
    if (error) {
      toast.error("Erro ao excluir aula");
      return;
    }
    toast.success("Aula excluída!");
    fetchData();
  };

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setTitle(lesson.title);
    setContent(lesson.content || "");
    setVideoUrl(lesson.video_url || "");
    setDuration(lesson.duration_minutes || 0);
    setXpReward(lesson.xp_reward || 10);
    setModuleId(lesson.module_id || "");
    setCourseId(lesson.course_id); // Set courseId when editing
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingLesson(null);
    setTitle("");
    setContent("");
    setVideoUrl("");
    setDuration(0);
    setXpReward(10);
    setModuleId("");
    setCourseId("");
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
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold text-foreground">Gerenciar Aulas</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8"> {/* Adjusted for responsiveness */}
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">Aulas</h1>
            <p className="text-muted-foreground">{lessons.length} aulas cadastradas</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90 mt-4 sm:mt-0"> {/* Added margin for mobile */}
                <Plus className="w-4 h-4 mr-2" />Nova Aula
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingLesson ? "Editar Aula" : "Nova Aula"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="module">Módulo *</Label>
                  <Select value={moduleId} onValueChange={setModuleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um módulo" />
                    </SelectTrigger>
                    <SelectContent>
                      {modules.map((module) => (
                        <SelectItem key={module.id} value={module.id}>{module.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="title">Título da Aula</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Introdução ao Python"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="content">Conteúdo</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Conteúdo da aula..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="video_url">URL do Vídeo</Label>
                  <Input
                    id="video_url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration">Duração (minutos)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="xp_reward">XP</Label>
                    <Input
                      id="xp_reward"
                      type="number"
                      value={xpReward}
                      onChange={(e) => setXpReward(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-gradient-primary">
                    {editingLesson ? "Salvar" : "Criar Aula"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lessons.map((lesson) => (
            <Card key={lesson.id} className="glass border-border/50 hover:border-primary/30 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-2">
                  {lesson.video_url ? (
                    <Video className="w-4 h-4 text-primary" />
                  ) : (
                    <BookOpen className="w-4 h-4 text-primary" />
                  )}
                  <Badge variant="secondary" className="bg-muted">
                    {lesson.duration_minutes || 0} min
                  </Badge>
                  <Badge variant="secondary" className="bg-xp/10 text-xp">
                    <Zap className="w-3 h-3 mr-1" />
                    {lesson.xp_reward || 0} XP
                  </Badge>
                </div>
                <CardTitle className="text-lg">{lesson.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(lesson)}>
                    <Pencil className="w-4 h-4 mr-1" />Editar
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(lesson.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default ManageLessons;