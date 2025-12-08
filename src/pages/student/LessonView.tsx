import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, CheckCircle, Video, BookOpen, Clock, Zap, 
  ChevronRight, Play, FileCode, ListChecks, Lock
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { checkAndIssueModuleCertificate } from "@/utils/certificateUtils"; // Import the new utility

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
}

interface Exercise {
  id: string;
  title: string;
  type: string;
  xp_reward: number;
  difficulty: number;
}

interface Module {
  id: string;
  title: string;
  course_id: string;
}

const LessonView = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [module, setModule] = useState<Module | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isAccessible, setIsAccessible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!lessonId || !user) {
        console.log("LessonView: No lessonId or user", { lessonId, userId: user?.id });
        return;
      }

      console.log("LessonView: Fetching lesson", lessonId);

      // Fetch lesson
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      console.log("LessonView: Lesson fetch result", { lessonData, lessonError });

      if (lessonError || !lessonData) {
        toast.error("Aula não encontrada");
        navigate('/student/my-classes');
        return;
      }
      setLesson(lessonData);

      // Fetch module
      if (lessonData.module_id) {
        const { data: moduleData } = await supabase
          .from('modules')
          .select('*')
          .eq('id', lessonData.module_id)
          .single();
        setModule(moduleData);
      }

      // Check if user has access - for now, allow access if lesson exists
      // Teachers/Admins should also be able to preview
      setIsAccessible(true);
      
      // For students, verify enrollment
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      console.log("LessonView: User role", userRole);
      
      if (userRole?.role === 'student') {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('class_id')
          .eq('student_id', user.id)
          .eq('status', 'approved');

        console.log("LessonView: Student enrollments", enrollments);

        const classIds = (enrollments || []).map(e => e.class_id);
        
        if (classIds.length > 0) {
          const { data: classCourses } = await supabase
            .from('class_courses')
            .select('course_id')
            .in('class_id', classIds);

          console.log("LessonView: Class courses", classCourses);
          const courseIds = (classCourses || []).map(cc => cc.course_id);
          setIsAccessible(courseIds.includes(lessonData.course_id));
        } else {
          setIsAccessible(false);
        }
      }

      // Check if previous lessons in the module are completed
      if (lessonData.module_id) {
        const { data: moduleLessons } = await supabase
          .from('lessons')
          .select('id, order_index')
          .eq('module_id', lessonData.module_id)
          .lt('order_index', lessonData.order_index)
          .order('order_index');

        const previousLessonIds = (moduleLessons || []).map(l => l.id);
        
        if (previousLessonIds.length > 0) {
          const { data: progressData } = await supabase
            .from('student_progress')
            .select('lesson_id')
            .eq('user_id', user.id)
            .eq('completed', true)
            .in('lesson_id', previousLessonIds);

          const completedPrevious = (progressData || []).map(p => p.lesson_id);
          const allPreviousCompleted = previousLessonIds.every(id => completedPrevious.includes(id));
          
          if (!allPreviousCompleted) {
            toast.error("Complete as aulas anteriores primeiro");
            navigate(-1);
            return;
          }
        }
      }

      // Fetch exercises for this lesson
      const { data: exercisesData } = await supabase
        .from('exercises')
        .select('id, title, type, xp_reward, difficulty')
        .eq('lesson_id', lessonId);
      setExercises(exercisesData || []);

      // Check completed exercises
      const exerciseIds = (exercisesData || []).map(e => e.id);
      if (exerciseIds.length > 0) {
        const { data: exerciseProgress } = await supabase
          .from('student_progress')
          .select('exercise_id')
          .eq('user_id', user.id)
          .eq('completed', true)
          .in('exercise_id', exerciseIds);
        setCompletedExercises((exerciseProgress || []).map(p => p.exercise_id!));
      }

      // Check if lesson is completed
      const { data: lessonProgress } = await supabase
        .from('student_progress')
        .select('completed')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .maybeSingle(); // Use maybeSingle as it might not exist

      setIsCompleted(lessonProgress?.completed || false);

      setLoading(false);
    };

    fetchData();
  }, [lessonId, user, navigate]);

  const handleCompleteLesson = async () => {
    if (!user || !lesson) return;

    // Check if all exercises are completed
    if (exercises.length > 0 && completedExercises.length < exercises.length) {
      toast.error("Complete todos os exercícios antes de finalizar a aula");
      return;
    }

    setCompleting(true);

    // Check if progress already exists
    const { data: existingProgress } = await supabase
      .from('student_progress')
      .select('id')
      .eq('user_id', user.id)
      .eq('lesson_id', lesson.id)
      .maybeSingle();

    if (existingProgress) {
      // Update existing
      await supabase
        .from('student_progress')
        .update({
          completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', existingProgress.id);
    } else {
      // Insert new
      await supabase
        .from('student_progress')
        .insert({
          user_id: user.id,
          lesson_id: lesson.id,
          completed: true,
          completed_at: new Date().toISOString()
        });
    }

    // Add XP
    const { data: xpData } = await supabase
      .from('student_xp')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(); // Use maybeSingle as it might not exist

    if (xpData) {
      await supabase
        .from('student_xp')
        .update({ 
          total_xp: (xpData.total_xp || 0) + lesson.xp_reward,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('student_xp')
        .insert({
          user_id: user.id,
          total_xp: lesson.xp_reward,
          level: 1
        });
    }

    setIsCompleted(true);
    setCompleting(false);
    toast.success(`Aula concluída! +${lesson.xp_reward} XP`);

    // --- NEW: Check and issue module certificate ---
    if (lesson.module_id && lesson.course_id) {
      await checkAndIssueModuleCertificate(user.id, lesson.module_id, lesson.course_id);
    }
    // --- END NEW ---
  };

  const isExerciseAccessible = (index: number) => {
    // First exercise is always accessible if lesson is accessible
    if (index === 0) return true;
    // Others require previous exercise to be completed
    return completedExercises.includes(exercises[index - 1]?.id);
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&\n?#]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAccessible) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="glass border-border/50 max-w-md">
          <CardContent className="py-12 text-center">
            <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Você não tem acesso a esta aula</p>
            <Link to="/student/my-classes">
              <Button className="mt-4">Voltar às turmas</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const embedUrl = lesson?.video_url ? getYouTubeEmbedUrl(lesson.video_url) : null;
  const allExercisesCompleted = exercises.length === 0 || completedExercises.length >= exercises.length;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-display text-lg font-bold text-foreground line-clamp-1">{lesson?.title}</h1>
            {module && (
              <p className="text-sm text-muted-foreground">{module.title}</p>
            )}
          </div>
          {isCompleted && (
            <Badge className="bg-primary text-primary-foreground">
              <CheckCircle className="w-3 h-3 mr-1" />
              Concluída
            </Badge>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Video Section */}
        {embedUrl && (
          <div className="aspect-video rounded-xl overflow-hidden bg-muted mb-6">
            <iframe
              src={embedUrl}
              title={lesson?.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {/* Lesson Info */}
        <Card className="glass border-border/50 mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{lesson?.title}</CardTitle>
              <div className="flex items-center gap-3">
                {lesson?.duration_minutes && lesson.duration_minutes > 0 && (
                  <Badge variant="secondary" className="bg-muted">
                    <Clock className="w-3 h-3 mr-1" />
                    {lesson.duration_minutes} min
                  </Badge>
                )}
                <Badge className="bg-xp/10 text-xp">
                  <Zap className="w-3 h-3 mr-1" />
                  {lesson?.xp_reward} XP
                </Badge>
              </div>
            </div>
          </CardHeader>
          {lesson?.content && (
            <CardContent>
              <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: lesson.content }} />
            </CardContent>
          )}
        </Card>

        {/* Exercises Section */}
        {exercises.length > 0 && (
          <Card className="glass border-border/50 mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-primary" />
                Exercícios ({completedExercises.length}/{exercises.length})
              </CardTitle>
              <Progress value={(completedExercises.length / exercises.length) * 100} className="h-2" />
            </CardHeader>
            <CardContent className="space-y-3">
              {exercises.map((exercise, index) => {
                const completed = completedExercises.includes(exercise.id);
                const accessible = isExerciseAccessible(index);
                
                return (
                  <div 
                    key={exercise.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      completed 
                        ? 'border-primary/50 bg-primary/5' 
                        : accessible 
                          ? 'border-border/50 hover:bg-muted/50' 
                          : 'border-border/30 opacity-60'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      completed 
                        ? 'bg-primary' 
                        : accessible 
                          ? 'bg-muted' 
                          : 'bg-muted/50'
                    }`}>
                      {completed ? (
                        <CheckCircle className="w-4 h-4 text-white" />
                      ) : accessible ? (
                        exercise.type === 'code' ? (
                          <FileCode className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ListChecks className="w-4 h-4 text-muted-foreground" />
                        )
                      ) : (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{exercise.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{exercise.type === 'code' ? 'Código' : 'Quiz'}</span>
                        <span>•</span>
                        <span className="text-xp">+{exercise.xp_reward} XP</span>
                      </div>
                    </div>
                    {accessible && !completed && (
                      <Link to={`/student/exercise/${exercise.id}?lessonId=${lessonId}`}>
                        <Button size="sm" className="bg-gradient-primary">
                          Iniciar
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    )}
                    {completed && (
                      <Link to={`/student/exercise/${exercise.id}?lessonId=${lessonId}`}>
                        <Button size="sm" variant="outline">
                          Revisar
                        </Button>
                      </Link>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Complete Button */}
        {!isCompleted && (
          <Button 
            onClick={handleCompleteLesson}
            disabled={!allExercisesCompleted || completing}
            className="w-full bg-gradient-primary h-12 text-lg"
          >
            {completing ? (
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : !allExercisesCompleted ? (
              <>
                <Lock className="w-5 h-5 mr-2" />
                Complete os exercícios primeiro
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Concluir Aula (+{lesson?.xp_reward} XP)
              </>
            )}
          </Button>
        )}
      </main>
    </div>
  );
};

export default LessonView;