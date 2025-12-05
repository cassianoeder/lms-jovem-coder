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
  HelpCircle,
  Pencil,
  Trash2,
  LogOut,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Exercise {
  id: string;
  title: string;
  type: string;
}

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
  exercise_id: string;
  exercises: { title: string; type: string } | null;
}

const ManageQuestions = () => {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Form state
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [exerciseId, setExerciseId] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: exercisesData } = await supabase
        .from('exercises')
        .select('id, title, type')
        .eq('type', 'multiple_choice')
        .order('created_at', { ascending: false });
      setExercises(exercisesData || []);

      const { data: questionsData } = await supabase
        .from('questions')
        .select('*, exercises(title, type)')
        .order('order_index');
      
      // Parse options from JSON
      const parsedQuestions = (questionsData || []).map(q => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : JSON.parse(q.options as string || '[]')
      }));
      setQuestions(parsedQuestions as Question[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setQuestionText("");
    setOptions(["", "", "", ""]);
    setCorrectAnswer("");
    setExplanation("");
    setExerciseId("");
    setEditingQuestion(null);
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setQuestionText(question.question_text);
    setOptions(question.options.length >= 4 ? question.options : [...question.options, ...Array(4 - question.options.length).fill("")]);
    setCorrectAnswer(question.correct_answer);
    setExplanation(question.explanation || "");
    setExerciseId(question.exercise_id);
    setDialogOpen(true);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    if (correctAnswer === options[index]) {
      setCorrectAnswer("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!exerciseId) {
      toast({ title: "Erro", description: "Selecione um exercício", variant: "destructive" });
      return;
    }

    const filteredOptions = options.filter(o => o.trim() !== "");
    if (filteredOptions.length < 2) {
      toast({ title: "Erro", description: "Adicione pelo menos 2 opções", variant: "destructive" });
      return;
    }

    if (!correctAnswer || !filteredOptions.includes(correctAnswer)) {
      toast({ title: "Erro", description: "Selecione a resposta correta", variant: "destructive" });
      return;
    }

    const questionData = {
      question_text: questionText,
      options: filteredOptions,
      correct_answer: correctAnswer,
      explanation: explanation || null,
      exercise_id: exerciseId,
    };

    try {
      if (editingQuestion) {
        const { error } = await supabase
          .from('questions')
          .update(questionData)
          .eq('id', editingQuestion.id);
        
        if (error) throw error;
        toast({ title: "Sucesso", description: "Questão atualizada!" });
      } else {
        const { error } = await supabase
          .from('questions')
          .insert(questionData);
        
        if (error) throw error;
        toast({ title: "Sucesso", description: "Questão criada!" });
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta questão?")) return;

    try {
      const { error } = await supabase.from('questions').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Sucesso", description: "Questão excluída!" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
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
              <span className="font-display text-lg font-bold text-foreground">Gerenciar Questões</span>
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
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">Questões</h1>
            <p className="text-muted-foreground">{questions.length} questões cadastradas</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                Nova Questão
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingQuestion ? "Editar Questão" : "Nova Questão"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Exercício</Label>
                  <Select value={exerciseId} onValueChange={setExerciseId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o exercício" />
                    </SelectTrigger>
                    <SelectContent>
                      {exercises.map((exercise) => (
                        <SelectItem key={exercise.id} value={exercise.id}>
                          {exercise.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {exercises.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Crie um exercício do tipo "Múltipla Escolha" primeiro.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Pergunta</Label>
                  <Textarea 
                    value={questionText} 
                    onChange={(e) => setQuestionText(e.target.value)} 
                    rows={3}
                    placeholder="Digite a pergunta..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Opções de Resposta</Label>
                  <div className="space-y-2">
                    {options.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <Input 
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          placeholder={`Opção ${index + 1}`}
                        />
                        <Button 
                          type="button"
                          variant={correctAnswer === option && option ? "default" : "outline"}
                          size="sm"
                          onClick={() => option && setCorrectAnswer(option)}
                          disabled={!option}
                          className={correctAnswer === option && option ? "bg-success" : ""}
                        >
                          {correctAnswer === option && option ? "✓" : "Correta"}
                        </Button>
                        {options.length > 2 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeOption(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addOption}>
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar Opção
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Explicação (opcional)</Label>
                  <Textarea 
                    value={explanation} 
                    onChange={(e) => setExplanation(e.target.value)} 
                    rows={2}
                    placeholder="Explique por que esta é a resposta correta..."
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-gradient-primary">
                    {editingQuestion ? "Salvar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {questions.length > 0 ? questions.map((question) => (
            <Card key={question.id} className="glass border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-gradient-xp flex items-center justify-center flex-shrink-0">
                      <HelpCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground mb-1">{question.question_text}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Exercício: {question.exercises?.title || "N/A"}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {question.options.map((opt, i) => (
                          <Badge 
                            key={i} 
                            variant="secondary"
                            className={opt === question.correct_answer ? "bg-success/20 text-success" : ""}
                          >
                            {opt === question.correct_answer && "✓ "}{opt}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(question)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(question.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )) : (
            <Card className="glass border-border/50">
              <CardContent className="p-8 text-center">
                <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma questão cadastrada. Crie um exercício do tipo "Múltipla Escolha" primeiro.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default ManageQuestions;
