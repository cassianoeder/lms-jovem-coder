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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Code2, ArrowLeft, Plus, Pencil, Trash2, FileCode, ListChecks, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

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
  xp_reward: number;
  difficulty: number;
  lesson_id: string | null;
  language: string | null;
  starter_code: string | null;
  solution_code: string | null;
  test_cases: QuestionItem[] | null;
}

interface Lesson {
  id: string;
  title: string;
}

const ManageExercises = () => {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  
  // Form state
  const [lessonId, setLessonId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("multiple_choice");
  const [language, setLanguage] = useState("python");
  const [difficulty, setDifficulty] = useState(1);
  const [xpReward, setXpReward] = useState(20);
  const [starterCode, setStarterCode] = useState("");
  const [solutionCode, setSolutionCode] = useState("");
  const [questions, setQuestions] = useState<QuestionItem[]>([]);

  const fetchData = async () => {
    setLoading(true);
    const [exercisesRes, lessonsRes] = await Promise.all([
      supabase.from('exercises').select('*').order('created_at'),
      supabase.from('lessons').select('id, title').order('title'),
    ]);
    
    if (exercisesRes.data) setExercises(exercisesRes.data);
    if (lessonsRes.data) setLessons(lessonsRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addQuestion = () => {
    setQuestions([...questions, {
      question_text: "",
      options: ["", "", "", ""],
      correct_answer: "",
      explanation: ""
    }]);
  };

  const updateQuestion = (index: number, field: keyof QuestionItem, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!lessonId) {
      toast.error("Selecione uma aula");
      return;
    }

    // Validate multiple choice questions
    if (type === 'multiple_choice') {
      if (questions.length === 0) {
        toast.error("Adicione pelo menos uma questão");
        return;
      }
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.question_text.trim()) {
          toast.error(`Questão ${i + 1}: Preencha o texto da pergunta`);
          return;
        }
        const validOptions = q.options.filter(o => o.trim() !== "");
        if (validOptions.length < 2) {
          toast.error(`Questão ${i + 1}: Adicione pelo menos 2 opções`);
          return;
        }
        if (!q.correct_answer || !validOptions.includes(q.correct_answer)) {
          toast.error(`Questão ${i + 1}: Selecione a resposta correta`);
          return;
        }
      }
    }

    // Validate code exercise
    if (type === 'code') {
      if (!language) {
        toast.error("Selecione a linguagem de programação");
        return;
      }
      if (!solutionCode.trim()) {
        toast.error("Adicione a solução do código");
        return;
      }
    }

    // Clean up questions for storage
    const cleanQuestions = questions.map(q => ({
      ...q,
      options: q.options.filter(o => o.trim() !== "")
    }));

    // Tente usar RPC primeiro
    try {
      const { data, error } = await supabase.rpc('admin_create_exercise', {
        p_title: title,
        p_description: description,
        p_type: type,
        p_language: type === 'code' ? language : null,
        p_difficulty: difficulty,
        p_xp_reward: xpReward,
        p_lesson_id: lessonId,
        p_starter_code: type === 'code' ? starterCode : null,
        p_solution_code: type === 'code' ? solutionCode : null,
        p_test_cases: type === 'multiple_choice' ? cleanQuestions : null
      });
      
      if (error) throw error;
      
      toast.success("Exercício criado via RPC!");
      setDialogOpen(false);
      resetForm();
      fetchData();
      return;
    } catch (rpcError) {
      console.log("RPC failed, trying direct insert:", rpcError);
    }

    // Se RPC falhar, tente inserção direta
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
        toast.success("Exercício atualizado!");
      } else {
        const { error } = await supabase
          .from('exercises')
          .insert(exerciseData);
        
        if (error) throw error;
        toast.success("Exercício criado!");
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este exercício?")) return;
    const { error } = await supabase.from('exercises').delete().eq('id', id);
    if (error) {
      toast.error("Erro ao excluir exercício");
      return;
    }
    toast.success("Exercício excluído!");
    fetchData();
  };

  const handleEdit = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setTitle(exercise.title);
    setDescription(exercise.description || "");
    setType(exercise.type);
    setLanguage(exercise.language || "python");
    setDifficulty(exercise.difficulty || 1);
    setXpReward(exercise.xp_reward || 20);
    setLessonId(exercise.lesson_id || "");
    setStarterCode(exercise.starter_code || "");
    setSolutionCode(exercise.solution_code || "");
    setQuestions(exercise.test_cases as QuestionItem[] || []);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingExercise(null);
    setTitle("");
    setDescription("");
    setType("multiple_choice");
    setLanguage("python");
    setDifficulty(1);
    setXpReward(20);
    setLessonId("");
    setStarterCode("");
    setSolutionCode("");
    setQuestions([]);
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
              <div className="w-9 h-9 rounded-xl bg-gradient-accent flex items-center justify-center">
                <FileCode className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold text-foreground">Gerenciar Exercícios</span>
            </div>
          </div>
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
              <Button className="bg-gradient-accent hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />Novo Exercício
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingExercise ? "Editar Exercício" : "Novo Exercício"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="lesson">Aula *</Label>
                  <Select value={lessonId} onValueChange={setLessonId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma aula" />
                    </SelectTrigger>
                    <SelectContent>
                      {lessons.map((lesson) => (
                        <SelectItem key={lesson.id} value={lesson.id}>{lesson.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="title">Título do Exercício</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Variáveis em Python"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrição do exercício..."
                  />
                </div>
                <div>
                  <Label>Tipo de Exercício</Label>
                  <RadioGroup value={type} onValueChange={(value) => setType(value)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="multiple_choice" id="multiple_choice" />
                      <Label htmlFor="multiple_choice">Múltipla Escolha</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="code" id="code" />
                      <Label htmlFor="code">Código</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                {type === 'code' && (
                  <>
                    <div>
                      <Label htmlFor="language">Linguagem</Label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="python">Python</SelectItem>
                          <SelectItem value="javascript">JavaScript</SelectItem>
                          <SelectItem value="java">Java</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="starter_code">Código Inicial</Label>
                      <Textarea
                        id="starter_code"
                        value={starterCode}
                        onChange={(e) => setStarterCode(e.target.value)}
                        placeholder="Código inicial para o aluno..."
                        className="font-mono"
                      />
                    </div>
                    <div>
                      <Label htmlFor="solution_code">Solução</Label>
                      <Textarea
                        id="solution_code"
                        value={solutionCode}
                        onChange={(e) => setSolutionCode(e.target.value)}
                        placeholder="Solução do exercício..."
                        className="font-mono"
                        required
                      />
                    </div>
                  </>
                )}

                {type === 'multiple_choice' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Questões</Label>
                      <Button type="button" variant="outline" onClick={addQuestion}>
                        <Plus className="w-4 h-4 mr-1" />Adicionar Questão
                      </Button>
                    </div>
                    {questions.map((q, index) => (
                      <Card key={index} className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <Label>Questão {index + 1}</Label>
                            <Button type="button" variant="outline" size="sm" onClick={() => removeQuestion(index)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <Input
                            value={q.question_text}
                            onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                            placeholder="Texto da pergunta"
                            required
                          />
                          {q.options.map((option, optIndex) => (
                            <Input
                              key={optIndex}
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...q.options];
                                newOptions[optIndex] = e.target.value;
                                updateQuestion(index, 'options', newOptions);
                              }}
                              placeholder={`Opção ${optIndex + 1}`}
                              required
                            />
                          ))}
                          <Select value={q.correct_answer} onValueChange={(value) => updateQuestion(index, 'correct_answer', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Resposta correta" />
                            </SelectTrigger>
                            <SelectContent>
                              {q.options.filter(o => o.trim() !== "").map((option, optIndex) => (
                                <SelectItem key={optIndex} value={option}>Opção {optIndex + 1}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="difficulty">Dificuldade</Label>
                    <Select value={difficulty.toString()} onValueChange={(value) => setDifficulty(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Fácil</SelectItem>
                        <SelectItem value="2">Médio</SelectItem>
                        <SelectItem value="3">Difícil</SelectItem>
                      </SelectContent>
                    </Select>
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
                  <Button type="submit" className="bg-gradient-accent">
                    {editingExercise ? "Salvar" : "Criar Exercício"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map((exercise) => (
            <Card key={exercise.id} className="glass border-border/50 hover:border-primary/30 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-2">
                  {exercise.type === 'code' ? (
                    <FileCode className="w-4 h-4 text-primary" />
                  ) : (
                    <ListChecks className="w-4 h-4 text-primary" />
                  )}
                  <Badge variant="secondary" className="bg-muted">
                    {exercise.type === 'code' ? 'Código' : 'Quiz'}
                  </Badge>
                  <Badge variant="secondary" className="bg-xp/10 text-xp">
                    <Zap className="w-3 h-3 mr-1" />
                    {exercise.xp_reward} XP
                  </Badge>
                </div>
                <CardTitle className="text-lg">{exercise.title}</CardTitle>
                {exercise.description && (
                  <CardDescription className="line-clamp-2">{exercise.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(exercise)}>
                    <Pencil className="w-4 h-4 mr-1" />Editar
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(exercise.id)}>
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

export default ManageExercises;