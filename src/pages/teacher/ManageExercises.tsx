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
  FileCode,
  Pencil,
  Trash2,
  Zap,
  LogOut,
  ListChecks,
  Brain,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Lesson {
  id: string;
  title: string;
  courses: { title: string } | null;
}

interface Exercise {
  id: string;
  title: string;
  description: string | null;
  type: string;
  language: string | null;
  difficulty: number;
  xp_reward: number;
  starter_code: string | null;
  solution_code: string | null;
  lesson_id: string | null;
  lessons: { title: string; courses: { title: string } | null } | null;
}

const ManageExercises = () => {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("multiple_choice");
  const [language, setLanguage] = useState("");
  const [difficulty, setDifficulty] = useState(1);
  const [xpReward, setXpReward] = useState(20);
  const [lessonId, setLessonId] = useState("");
  const [starterCode, setStarterCode] = useState("");
  const [solutionCode, setSolutionCode] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('id, title, courses(title)')
        .order('order_index');
      setLessons(lessonsData as Lesson[] || []);

      const { data: exercisesData } = await supabase
        .from('exercises')
        .select('*, lessons(title, courses(title))')
        .order('created_at', { ascending: false });
      setExercises(exercisesData as Exercise[] || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setType("multiple_choice");
    setLanguage("");
    setDifficulty(1);
    setXpReward(20);
    setLessonId("");
    setStarterCode("");
    setSolutionCode("");
    setEditingExercise(null);
  };

  const handleEdit = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setTitle(exercise.title);
    setDescription(exercise.description || "");
    setType(exercise.type);
    setLanguage(exercise.language || "");
    setDifficulty(exercise.difficulty);
    setXpReward(exercise.xp_reward);
    setLessonId(exercise.lesson_id || "");
    setStarterCode(exercise.starter_code || "");
    setSolutionCode(exercise.solution_code || "");
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const exerciseData = {
      title,
      description,
      type,
      language: type === 'code' ? language : null,
      difficulty,
      xp_reward: xpReward,
      lesson_id: lessonId || null,
      starter_code: type === 'code' ? starterCode : null,
      solution_code: type === 'code' ? solutionCode : null,
    };

    try {
      if (editingExercise) {
        const { error } = await supabase
          .from('exercises')
          .update(exerciseData)
          .eq('id', editingExercise.id);
        
        if (error) throw error;
        toast({ title: "Sucesso", description: "Exercício atualizado!" });
      } else {
        const { error } = await supabase
          .from('exercises')
          .insert(exerciseData);
        
        if (error) throw error;
        toast({ title: "Sucesso", description: "Exercício criado!" });
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este exercício?")) return;

    try {
      const { error } = await supabase.from('exercises').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Sucesso", description: "Exercício excluído!" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const getTypeIcon = (exerciseType: string) => {
    switch (exerciseType) {
      case 'code': return <FileCode className="w-6 h-6 text-white" />;
      case 'logic': return <Brain className="w-6 h-6 text-white" />;
      default: return <ListChecks className="w-6 h-6 text-white" />;
    }
  };

  const getTypeLabel = (exerciseType: string) => {
    switch (exerciseType) {
      case 'code': return 'Código';
      case 'logic': return 'Lógica';
      default: return 'Múltipla Escolha';
    }
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
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/teacher" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Code2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold text-foreground">Gerenciar Exercícios</span>
            </div>
          </div>

          <Button variant="ghost" size="icon" onClick={signOut}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">Exercícios</h1>
            <p className="text-muted-foreground">{exercises.length} exercícios cadastrados</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                Novo Exercício
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingExercise ? "Editar Exercício" : "Novo Exercício"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple_choice">Múltipla Escolha</SelectItem>
                        <SelectItem value="code">Código</SelectItem>
                        <SelectItem value="logic">Lógica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    rows={3}
                    placeholder="Descreva o exercício..."
                  />
                </div>

                {type === 'code' && (
                  <>
                    <div className="space-y-2">
                      <Label>Linguagem</Label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a linguagem" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="python">Python</SelectItem>
                          <SelectItem value="javascript">JavaScript</SelectItem>
                          <SelectItem value="sql">SQL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Código Inicial (Starter)</Label>
                      <Textarea 
                        value={starterCode} 
                        onChange={(e) => setStarterCode(e.target.value)} 
                        rows={4}
                        className="font-mono text-sm"
                        placeholder="# Código inicial para o aluno..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Solução</Label>
                      <Textarea 
                        value={solutionCode} 
                        onChange={(e) => setSolutionCode(e.target.value)} 
                        rows={4}
                        className="font-mono text-sm"
                        placeholder="# Solução correta..."
                      />
                    </div>
                  </>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Dificuldade (1-5)</Label>
                    <Input 
                      type="number" 
                      value={difficulty} 
                      onChange={(e) => setDifficulty(Number(e.target.value))}
                      min={1}
                      max={5}
                    />
                  </div>
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
                    <Label>Aula (opcional)</Label>
                    <Select value={lessonId || "none"} onValueChange={(v) => setLessonId(v === "none" ? "" : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        {lessons.map((lesson) => (
                          <SelectItem key={lesson.id} value={lesson.id}>
                            {lesson.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-gradient-primary">
                    {editingExercise ? "Salvar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {exercises.length > 0 ? exercises.map((exercise) => (
            <Card key={exercise.id} className="glass border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                      {getTypeIcon(exercise.type)}
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{exercise.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {exercise.lessons?.title || "Sem aula vinculada"}
                        {exercise.lessons?.courses?.title && ` • ${exercise.lessons.courses.title}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{getTypeLabel(exercise.type)}</Badge>
                      {exercise.language && (
                        <Badge variant="secondary" className="bg-accent/10 text-accent">
                          {exercise.language}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="bg-xp/10 text-xp">
                        <Zap className="w-3 h-3 mr-1" />
                        {exercise.xp_reward} XP
                      </Badge>
                      <Badge variant="secondary">
                        Nível {exercise.difficulty}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(exercise)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(exercise.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )) : (
            <Card className="glass border-border/50">
              <CardContent className="p-8 text-center">
                <FileCode className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum exercício cadastrado. Clique em "Novo Exercício" para começar.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default ManageExercises;
