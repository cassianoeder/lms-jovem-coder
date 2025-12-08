import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, CheckCircle, XCircle, Zap, 
  ChevronRight, AlertCircle, Trophy, Play, Code2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

const ExerciseView = () => {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const [searchParams] = useSearchParams();
  const lessonId = searchParams.get('lessonId');
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Multiple choice state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [answers, setAnswers] = useState<{[key: number]: string}>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState(0);

  // Code exercise state
  const [userCode, setUserCode] = useState("");
  const [codeResult, setCodeResult] = useState<{success: boolean; message: string} | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!exerciseId || !user) return;

      const { data: exerciseData, error: exerciseError } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', exerciseId)
        .single();

      if (exerciseError || !exerciseData) {
        toast.error("Exercício não encontrado");
        navigate(-1);
        return;
      }
      
      // Parse test_cases if it's a string
      const parsed = {
        ...exerciseData,
        test_cases: exerciseData.test_cases 
          ? (typeof exerciseData.test_cases === 'string' 
              ? JSON.parse(exerciseData.test_cases) 
              : exerciseData.test_cases)
          : null
      };
      setExercise(parsed as Exercise);
      setUserCode(exerciseData.starter_code || "");

      // Check if already completed
      const { data: progressData } = await supabase
        .from('student_progress')
        .select('completed, score')
        .eq('user_id', user.id)
        .eq('exercise_id', exerciseId)
        .maybeSingle();

      if (progressData?.completed) {
        setIsCompleted(true);
        setScore(progressData.score || 0);
      }

      setLoading(false);
    };

    fetchData();
  }, [exerciseId, user, navigate]);

  const handleSelectAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    setAnswers({ ...answers, [currentQuestionIndex]: answer });
  };

  const handleNextQuestion = () => {
    if (!exercise?.test_cases) return;
    const questions = exercise.test_cases as QuestionItem[];
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(answers[currentQuestionIndex + 1] || "");
    } else {
      // Complete the exercise
      completeMultipleChoice();
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedAnswer(answers[currentQuestionIndex - 1] || "");
    }
  };

  const completeMultipleChoice = async () => {
    if (!user || !exercise?.test_cases) return;
    setSubmitting(true);

    const questions = exercise.test_cases as QuestionItem[];
    let correctCount = 0;
    
    questions.forEach((q, index) => {
      if (answers[index] === q.correct_answer) {
        correctCount++;
      }
    });

    const finalScore = Math.round((correctCount / questions.length) * 100);
    await saveProgress(finalScore);
    
    setScore(finalScore);
    setIsCompleted(true);
    setSubmitting(false);
    toast.success(`Exercício concluído! Nota: ${finalScore}%`);
  };

  const handleRunCode = () => {
    if (!exercise?.solution_code) return;

    // Simple code comparison (in production, use a proper code execution service)
    const normalizedUser = userCode.replace(/\s+/g, '').toLowerCase();
    const normalizedSolution = exercise.solution_code.replace(/\s+/g, '').toLowerCase();

    if (normalizedUser === normalizedSolution || normalizedUser.includes(normalizedSolution.slice(0, 50))) {
      setCodeResult({ success: true, message: "Código correto! Você pode prosseguir." });
    } else {
      setCodeResult({ success: false, message: "O código não está correto. Verifique sua solução." });
    }
  };

  const completeCodeExercise = async () => {
    if (!user || !exercise) return;
    
    if (!codeResult?.success) {
      toast.error("Resolva o código corretamente antes de prosseguir");
      return;
    }

    setSubmitting(true);
    await saveProgress(100);
    setIsCompleted(true);
    setSubmitting(false);
    toast.success(`Exercício concluído! +${exercise.xp_reward} XP`);
  };

  const saveProgress = async (finalScore: number) => {
    if (!user || !exercise) return;

    // Check if progress exists
    const { data: existingProgress } = await supabase
      .from('student_progress')
      .select('id')
      .eq('user_id', user.id)
      .eq('exercise_id', exercise.id)
      .maybeSingle();

    if (existingProgress) {
      await supabase
        .from('student_progress')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
          score: finalScore
        })
        .eq('id', existingProgress.id);
    } else {
      await supabase
        .from('student_progress')
        .insert({
          user_id: user.id,
          exercise_id: exercise.id,
          completed: true,
          completed_at: new Date().toISOString(),
          score: finalScore
        });
    }

    // Add XP
    const { data: xpData } = await supabase
      .from('student_xp')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (xpData) {
      await supabase
        .from('student_xp')
        .update({ 
          total_xp: (xpData.total_xp || 0) + exercise.xp_reward,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('student_xp')
        .insert({
          user_id: user.id,
          total_xp: exercise.xp_reward,
          level: 1
        });
    }
  };

  const handleBack = () => {
    if (lessonId) {
      navigate(`/student/lesson/${lessonId}`);
    } else {
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="glass border-border/50 max-w-md">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Exercício não encontrado</p>
            <Button className="mt-4" onClick={handleBack}>Voltar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Completed state
  if (isCompleted) {
    const passed = score >= 70;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="glass border-border/50 max-w-md w-full">
          <CardContent className="py-12 text-center">
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${
              passed ? 'bg-primary' : 'bg-accent'
            }`}>
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Exercício Concluído!
            </h2>
            <p className="text-muted-foreground mb-4">
              {exercise.type === 'multiple_choice' ? `Sua nota: ${score}%` : 'Código executado com sucesso!'}
            </p>
            <Badge className="bg-xp/10 text-xp text-lg px-4 py-2 mb-6">
              <Zap className="w-5 h-5 mr-2" />
              +{exercise.xp_reward} XP
            </Badge>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={handleBack}>
                Voltar à Aula
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Multiple Choice Exercise
  if (exercise.type === 'multiple_choice') {
    const questions = (exercise.test_cases || []) as QuestionItem[];
    
    if (questions.length === 0) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="glass border-border/50 max-w-md">
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma questão cadastrada para este exercício</p>
              <Button className="mt-4" onClick={handleBack}>Voltar</Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 glass border-b border-border/50">
          <div className="container mx-auto px-4 py-3 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="font-display text-lg font-bold text-foreground line-clamp-1">{exercise.title}</h1>
              <p className="text-sm text-muted-foreground">
                Questão {currentQuestionIndex + 1} de {questions.length}
              </p>
            </div>
            <Badge className="bg-xp/10 text-xp">
              <Zap className="w-3 h-3 mr-1" />
              {exercise.xp_reward} XP
            </Badge>
          </div>
          <div className="h-1 bg-muted">
            <div 
              className="h-full bg-gradient-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 max-w-2xl">
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="text-xl leading-relaxed">
                {currentQuestion.question_text}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={selectedAnswer}
                onValueChange={handleSelectAnswer}
                className="space-y-3"
              >
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswer === option;
                  return (
                    <div
                      key={index}
                      className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors ${
                        isSelected ? 'border-primary bg-primary/5' : 'border-border/50 hover:bg-muted/50'
                      }`}
                    >
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label 
                        htmlFor={`option-${index}`} 
                        className="flex-1 cursor-pointer text-base"
                      >
                        {option}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>

              <div className="mt-6 flex gap-3">
                {currentQuestionIndex > 0 && (
                  <Button variant="outline" onClick={handlePrevQuestion}>
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Anterior
                  </Button>
                )}
                <Button 
                  onClick={handleNextQuestion}
                  disabled={!selectedAnswer || submitting}
                  className="flex-1 bg-gradient-primary"
                >
                  {submitting ? (
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : currentQuestionIndex < questions.length - 1 ? (
                    <>
                      Próxima
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  ) : (
                    <>
                      Finalizar
                      <CheckCircle className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Code Exercise
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-display text-lg font-bold text-foreground line-clamp-1">{exercise.title}</h1>
            <p className="text-sm text-muted-foreground">
              Exercício de Código • {exercise.language?.toUpperCase()}
            </p>
          </div>
          <Badge className="bg-xp/10 text-xp">
            <Zap className="w-3 h-3 mr-1" />
            {exercise.xp_reward} XP
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <Card className="glass border-border/50 mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-primary" />
              {exercise.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {exercise.description && (
              <p className="text-muted-foreground mb-4">{exercise.description}</p>
            )}
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Seu Código:</Label>
                <Textarea
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value)}
                  className="font-mono text-sm min-h-[200px] bg-muted/30"
                  placeholder="Escreva seu código aqui..."
                />
              </div>

              {codeResult && (
                <div className={`p-4 rounded-lg ${
                  codeResult.success 
                    ? 'bg-primary/10 border border-primary/30' 
                    : 'bg-destructive/10 border border-destructive/30'
                }`}>
                  <div className="flex items-center gap-2">
                    {codeResult.success ? (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive" />
                    )}
                    <span className={codeResult.success ? 'text-primary' : 'text-destructive'}>
                      {codeResult.message}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleRunCode}>
                  <Play className="w-4 h-4 mr-2" />
                  Executar
                </Button>
                <Button 
                  onClick={completeCodeExercise}
                  disabled={!codeResult?.success || submitting}
                  className="flex-1 bg-gradient-primary"
                >
                  {submitting ? (
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      Concluir Exercício
                      <CheckCircle className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ExerciseView;