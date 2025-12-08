import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
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
  BookOpen,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";

interface Course {
  id: string;
  title: string;
}

interface Module {
  id: string;
  title: string;
  course_id: string;
}

interface Lesson {
  id: string;
  title: string;
  module_id: string | null;
  modules?: { title: string; courses?: { title: string } | null } | null;
}

interface QuestionItem {
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
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
  test_cases: Json | null;
  lesson_id: string | null;
  lessons?: { title: string; modules?: { title: string; courses?: { title: string } | null } | null } | null;
}

const ManageExercises = () => {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

  // Filters
  const [filterCourseId, setFilterCourseId] = useState("");
  const [filterModuleId, setFilterModuleId] = useState("");
  const [filteredModules, setFilteredModules] = useState<Module[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([]);

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

  // Multiple choice questions
  const [questions, setQuestions] = useState<QuestionItem[]>([]);

  // Form filters
  const [formCourseId, setFormCourseId] = useState("");
  const [formModuleId, setFormModuleId] = useState("");
  const [formFilteredModules, setFormFilteredModules] = useState<Module[]>([]);
  const [formFilteredLessons, setFormFilteredLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  // Filter modules based on selected course
  useEffect(() => {
    if (filterCourseId) {
      setFilteredModules(modules.filter(m => m.course_id === filterCourseId));
    } else {
      setFilteredModules([]);
    }
    setFilterModuleId("");
  }, [filterCourseId, modules]);

  // Filter lessons based on selected module
  useEffect(() => {
    if (filterModuleId) {
      setFilteredLessons(lessons.filter(l => l.module_id === filterModuleId));
    } else {
      setFilteredLessons([]);
    }
  }, [filterModuleId, lessons]);

  // Form: Filter modules based on selected course
  useEffect(() => {
    if (formCourseId) {
      setFormFilteredModules(modules.filter(m => m.course_id === formCourseId));
    } else {
      setFormFilteredModules([]);
    }
    setFormModuleId("");
    setLessonId("");
  }, [formCourseId, modules]);

  // Form: Filter lessons based on selected module
  useEffect(() => {
    if (formModuleId) {
      setFormFilteredLessons(lessons.filter(l => l.module_id === formModuleId));
    } else {
      setFormFilteredLessons([]);
    }
    setLessonId("");
  }, [formModuleId, lessons]);

  const fetchData = async () => {
    try {
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, title')
        .order('order_index');
      setCourses(coursesData || []);

      const { data: modulesData } = await supabase
        .from('modules')
        .select('id, title, course_id')
        .eq('is_active', true)
        .order('order_index');
      setModules(modulesData || []);

      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('id, title, module_id, modules(title, courses(title))')
        .order('order_index');
      setLessons(lessonsData as Lesson[] || []);

      const { data: exercisesData } = await supabase
        .from('exercises')
        .select('*, lessons(title, modules(title, courses(title)))')
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
    setQuestions([]);
    setFormCourseId("");
    setFormModuleId("");
    setEditingExercise(null);
  };

  const handleEdit = async (exercise: Exercise) => {
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

    // Load questions from test_cases for multiple choice
    if (exercise.type === 'multiple_choice' && exercise.test_cases) {
      const testCases = exercise.test_cases as unknown as QuestionItem[];
      if (Array.isArray(testCases)) {
        setQuestions(testCases);
      }
    } else {
      setQuestions([]);
    }

    // Find the lesson to get course and module
    const lesson = lessons.find(l => l.id === exercise.lesson_id);
    if (lesson) {
      const module = modules.find(m => m.id === lesson.module_id);
      if (module) {
        setFormCourseId(module.course_id);
        setFormFilteredModules(modules.filter(m => m.course_id === module.course_id));
        setFormModuleId(module.id);
        setFormFilteredLessons(lessons.filter(l => l.module_id === module.id));
      }
    }

    setDialogOpen(true);
  };

  const addQuestion = () => {
    setQuestions([...questions, { question_text: "", options: ["", "", "", ""], correct_answer: "", explanation: "" }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof QuestionItem, value: string | string[]) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...questions];
    const newOptions = [...updated[qIndex].options];
    newOptions[oIndex] = value;
    updated[qIndex] = { ...updated[qIndex], options: newOptions };
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!lessonId) {
      toast({ title: "Erro", description: "Selecione uma aula", variant: "destructive" });
      return;
    }

    // Validate multiple choice questions
    if (type === 'multiple_choice') {
      if (questions.length === 0) {
        toast({ title: "Erro", description: "Adicione pelo menos uma questão", variant: "destructive" });
        return;
      }
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.question_text.trim()) {
          toast({ title: "Erro", description: `Questão ${i + 1}: Preencha o texto da pergunta`, variant: "destructive" });
          return;
        }
        const validOptions = q.options.filter(o => o.trim() !== "");
        if (validOptions.length < 2) {
          toast({ title: "Erro", description: `Questão ${i + 1}: Adicione pelo menos 2 opções`, variant: "destructive" });
          return;
        }
        if (!q.correct_answer || !validOptions.includes(q.correct_answer)) {
          toast({ title: "Erro", description: `Questão ${i + 1}: Selecione a resposta correta`, variant: "destructive" });
          return;
        }
      }
    }

    // Validate code exercise
    if (type === 'code') {
      if (!language) {
        toast({ title: "Erro", description: "Selecione a linguagem de programação", variant: "destructive" });
        return;
      }
      if (!solutionCode.trim()) {
        toast({ title: "Erro", description: "Adicione a solução do código", variant: "destructive" });
        return;
      }
    }

    // Clean up questions for storage
    const cleanQuestions = questions.map(q => ({
      ...q,
      options: q.options.filter(o => o.trim() !== "")
    }));

    const exerciseData = {
      title,
      description,
      type,
      language: type === 'code' ? language : null,
      difficulty,
      xp_reward: xpReward,
      lesson_id: lessonId,
      starter_code: type === 'code' ? starterCode : null,
      solution_code: type === 'code' ? solutionCode : null,
      test_cases: type === 'multiple_choice' ? cleanQuestions : null,
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
      default: return <ListChecks className="w-6 h-6 text-white" />;
    }
  };

  const getTypeLabel = (exerciseType: string) => {
    switch (exerciseType) {
      case 'code': return 'Código';
      default: return 'Múltipla Escolha';
    }
  };

  const getQuestionsCount = (exercise: Exercise) => {
    if (exercise.type === 'multiple_choice' && exercise.test_cases) {
      const cases = exercise.test_cases as unknown as QuestionItem[];
      if (Array.isArray(cases)) return cases.length;
    }
    return 0;
  };

  // Group exercises by lesson
  const exercisesByLesson = exercises.reduce((acc, exercise) => {
    const lessonTitle = exercise.lessons?.title || "Sem Aula";
    const moduleTitle = exercise.lessons?.modules?.title || "";
    const courseTitle = exercise.lessons?.modules?.courses?.title || "";
    const key = courseTitle && moduleTitle 
      ? `${courseTitle} > ${moduleTitle} > ${lessonTitle}` 
      : lessonTitle;
    if (!acc[key]) acc[key] = [];
    acc[key].push(exercise);
    return acc;
  }, {} as Record<string, Exercise[]>);

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
              <span className="font-display text-lg font-bold text-foreground">Gerenciar Exercícios</span>
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
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingExercise ? "Editar Exercício" : "Novo Exercício"}</DialogTitle>
                <DialogDescription>
                  {type === 'multiple_choice' 
                    ? "Configure as questões de múltipla escolha para este exercício"
                    : "Configure o exercício de código para os alunos resolverem"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Hierarchy Selection: Course > Module > Lesson */}
                <div className="p-4 rounded-lg bg-muted/30 space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Vincular a uma Aula *</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Curso</Label>
                      <Select value={formCourseId} onValueChange={setFormCourseId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Curso" />
                        </SelectTrigger>
                        <SelectContent>
                          {courses.map((course) => (
                            <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Módulo</Label>
                      <Select value={formModuleId} onValueChange={setFormModuleId} disabled={!formCourseId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Módulo" />
                        </SelectTrigger>
                        <SelectContent>
                          {formFilteredModules.map((module) => (
                            <SelectItem key={module.id} value={module.id}>{module.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Aula *</Label>
                      <Select value={lessonId} onValueChange={setLessonId} disabled={!formModuleId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Aula" />
                        </SelectTrigger>
                        <SelectContent>
                          {formFilteredLessons.map((lesson) => (
                            <SelectItem key={lesson.id} value={lesson.id}>{lesson.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {formModuleId && formFilteredLessons.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Nenhuma aula neste módulo. <Link to="/teacher/lessons" className="text-primary underline">Crie uma aula primeiro.</Link>
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={type} onValueChange={(v) => { setType(v); if (v !== 'multiple_choice') setQuestions([]); }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple_choice">Múltipla Escolha</SelectItem>
                        <SelectItem value="code">Código</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    rows={2}
                    placeholder="Descreva o exercício..."
                  />
                </div>

                {/* Multiple Choice Questions */}
                {type === 'multiple_choice' && (
                  <div className="space-y-4 p-4 rounded-lg border border-border/50">
                    <div className="flex items-center justify-between">
                      <Label className="text-base">Questões ({questions.length})</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar Questão
                      </Button>
                    </div>

                    {questions.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Clique em "Adicionar Questão" para começar
                      </p>
                    )}

                    {questions.map((q, qIndex) => (
                      <div key={qIndex} className="p-4 rounded-lg bg-muted/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="font-medium">Questão {qIndex + 1}</Label>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeQuestion(qIndex)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        <Textarea
                          value={q.question_text}
                          onChange={(e) => updateQuestion(qIndex, 'question_text', e.target.value)}
                          placeholder="Digite a pergunta..."
                          rows={2}
                        />

                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Opções (clique para marcar como correta)</Label>
                          {q.options.map((opt, oIndex) => (
                            <div key={oIndex} className="flex gap-2">
                              <Input
                                value={opt}
                                onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                placeholder={`Opção ${oIndex + 1}`}
                              />
                              <Button
                                type="button"
                                variant={q.correct_answer === opt && opt ? "default" : "outline"}
                                size="sm"
                                onClick={() => opt && updateQuestion(qIndex, 'correct_answer', opt)}
                                disabled={!opt}
                                className={q.correct_answer === opt && opt ? "bg-primary" : ""}
                              >
                                {q.correct_answer === opt && opt ? "✓" : "Correta"}
                              </Button>
                            </div>
                          ))}
                        </div>

                        <Input
                          value={q.explanation}
                          onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                          placeholder="Explicação (opcional)"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Code Exercise Fields */}
                {type === 'code' && (
                  <>
                    <div className="space-y-2">
                      <Label>Linguagem *</Label>
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
                      <Label>Código Inicial (opcional)</Label>
                      <Textarea 
                        value={starterCode} 
                        onChange={(e) => setStarterCode(e.target.value)} 
                        rows={4}
                        className="font-mono text-sm"
                        placeholder="# Código inicial para o aluno..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Solução *</Label>
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

                <div className="grid grid-cols-2 gap-4">
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

        {Object.keys(exercisesByLesson).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(exercisesByLesson).map(([groupName, groupExercises]) => (
              <div key={groupName}>
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <h2 className="font-display text-lg font-semibold text-foreground">{groupName}</h2>
                  <Badge variant="secondary">{groupExercises.length}</Badge>
                </div>
                <div className="grid gap-3">
                  {groupExercises.map((exercise) => (
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
                                {exercise.type === 'multiple_choice' 
                                  ? `${getQuestionsCount(exercise)} questões` 
                                  : exercise.language || "Código"}
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
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card className="glass border-border/50">
            <CardContent className="p-8 text-center">
              <FileCode className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum exercício cadastrado. Clique em "Novo Exercício" para começar.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ManageExercises;