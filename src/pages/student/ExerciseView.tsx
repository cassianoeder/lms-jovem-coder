import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, CheckCircle, XCircle, Zap, 
  ChevronRight, AlertCircle, Trophy
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Exercise {
  id: string;
  title: string;
  description: string | null;
  type: string;
  xp_reward: number;
  difficulty: number;
  lesson_id: string | null;
}

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
  order_index: number;
}

const ExerciseView = () => {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const [searchParams] = useSearchParams();
  const lessonId = searchParams.get('lessonId');
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!exerciseId || !user) return;

      // Fetch exercise
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
      setExercise(exerciseData);

      // Fetch questions for this exercise
      const { data: questionsData } = await supabase
        .from('questions')
        .select('*')
        .eq('exercise_id', exerciseId)
        .order('order_index');

      const parsedQuestions = (questionsData || []).map(q => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : JSON.parse(q.options as string || '[]')
      }));
      setQuestions(parsedQuestions);

      // Check if already completed
      const { data: progressData } = await supabase
        .from('student_progress')
        .select('completed, score')
        .eq('user_id', user.id)
        .eq('exercise_id', exerciseId)
        .single();

      if (progressData?.completed) {
        setIsCompleted(true);
        setScore(progressData.score || 0);
      }

      setLoading(false);
    };

    fetchData();
  }, [exerciseId, user, navigate]);

  const handleAnswer = () => {
    if (!selectedAnswer || isAnswered) return;

    const currentQuestion = questions[currentQuestionIndex];
    const correct = selectedAnswer === currentQuestion.correct_answer;
    
    setIsAnswered(true);
    setIsCorrect(correct);
    
    if (correct) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer("");
      setIsAnswered(false);
      setIsCorrect(false);
    } else {
      // Exercise completed
      await completeExercise();
    }
  };

  const completeExercise = async () => {
    if (!user || !exercise) return;

    setSubmitting(true);

    const finalScore = Math.round((score / questions.length) * 100);

    // Save progress
    const { error } = await supabase
      .from('student_progress')
      .upsert({
        user_id: user.id,
        exercise_id: exercise.id,
        completed: true,
        completed_at: new Date().toISOString(),
        score: finalScore
      }, {
        onConflict: 'user_id,exercise_id'
      });

    if (error) {
      // Try insert
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
      .single();

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

    setIsCompleted(true);
    setSubmitting(false);
    toast.success(`Exercício concluído! +${exercise.xp_reward} XP`);
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

  // Show results if completed
  if (isCompleted) {
    const finalScore = Math.round((score / questions.length) * 100);
    const passed = finalScore >= 70;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="glass border-border/50 max-w-md w-full">
          <CardContent className="py-12 text-center">
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${
              passed ? 'bg-primary' : 'bg-destructive'
            }`}>
              {passed ? (
                <Trophy className="w-10 h-10 text-white" />
              ) : (
                <XCircle className="w-10 h-10 text-white" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {passed ? 'Parabéns!' : 'Tente novamente'}
            </h2>
            <p className="text-muted-foreground mb-4">
              Você acertou {score} de {questions.length} questões
            </p>
            <div className="text-4xl font-bold mb-6" style={{ color: passed ? 'hsl(var(--primary))' : 'hsl(var(--destructive))' }}>
              {finalScore}%
            </div>
            {passed && (
              <Badge className="bg-xp/10 text-xp text-lg px-4 py-2 mb-6">
                <Zap className="w-5 h-5 mr-2" />
                +{exercise?.xp_reward} XP
              </Badge>
            )}
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={handleBack}>
                Voltar à Aula
              </Button>
              {!passed && (
                <Button 
                  className="bg-gradient-primary"
                  onClick={() => {
                    setCurrentQuestionIndex(0);
                    setSelectedAnswer("");
                    setIsAnswered(false);
                    setIsCorrect(false);
                    setScore(0);
                    setIsCompleted(false);
                  }}
                >
                  Tentar Novamente
                </Button>
              )}
            </div>
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
            <h1 className="font-display text-lg font-bold text-foreground line-clamp-1">{exercise?.title}</h1>
            <p className="text-sm text-muted-foreground">
              Questão {currentQuestionIndex + 1} de {questions.length}
            </p>
          </div>
          <Badge className="bg-xp/10 text-xp">
            <Zap className="w-3 h-3 mr-1" />
            {exercise?.xp_reward} XP
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
              onValueChange={setSelectedAnswer}
              disabled={isAnswered}
              className="space-y-3"
            >
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === option;
                const isCorrectAnswer = option === currentQuestion.correct_answer;
                
                let optionClass = "border-border/50 hover:bg-muted/50";
                if (isAnswered) {
                  if (isCorrectAnswer) {
                    optionClass = "border-primary bg-primary/10";
                  } else if (isSelected && !isCorrectAnswer) {
                    optionClass = "border-destructive bg-destructive/10";
                  }
                } else if (isSelected) {
                  optionClass = "border-primary bg-primary/5";
                }

                return (
                  <div
                    key={index}
                    className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors ${optionClass}`}
                  >
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label 
                      htmlFor={`option-${index}`} 
                      className="flex-1 cursor-pointer text-base"
                    >
                      {option}
                    </Label>
                    {isAnswered && isCorrectAnswer && (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    )}
                    {isAnswered && isSelected && !isCorrectAnswer && (
                      <XCircle className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                );
              })}
            </RadioGroup>

            {isAnswered && currentQuestion.explanation && (
              <div className={`mt-6 p-4 rounded-lg ${isCorrect ? 'bg-primary/10' : 'bg-destructive/10'}`}>
                <p className="text-sm font-medium mb-1">
                  {isCorrect ? '✓ Correto!' : '✗ Incorreto'}
                </p>
                <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              {!isAnswered ? (
                <Button 
                  onClick={handleAnswer}
                  disabled={!selectedAnswer}
                  className="flex-1 bg-gradient-primary"
                >
                  Confirmar Resposta
                </Button>
              ) : (
                <Button 
                  onClick={handleNext}
                  disabled={submitting}
                  className="flex-1 bg-gradient-primary"
                >
                  {submitting ? (
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : currentQuestionIndex < questions.length - 1 ? (
                    <>
                      Próxima Questão
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  ) : (
                    <>
                      Finalizar
                      <CheckCircle className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ExerciseView;
