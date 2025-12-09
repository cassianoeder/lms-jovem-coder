import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Code2, ArrowLeft, BookOpen, Layers, Play, CheckCircle, Award } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ClassCourse {
  course_id: string;
  courses: { id: string; title: string };
}

interface EnrolledClass {
  id: string;
  class_id: string;
  status: string;
  classes: {
    id: string;
    name: string;
    description: string | null;
  };
}

interface ClassProgress {
  classId: string;
  totalLessons: number;
  completedLessons: number;
  totalExercises: number;
  completedExercises: number;
}

const MyClasses = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<EnrolledClass[]>([]);
  const [classCourses, setClassCourses] = useState<Record<string, ClassCourse[]>>({});
  const [progress, setProgress] = useState<Record<string, ClassProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Fetch enrollments
      const { data: enrollmentsData } = await supabase
        .from('enrollments')
        .select('id, class_id, status, classes(id, name, description)')
        .eq('student_id', user.id)
        .eq('status', 'approved');

      if (enrollmentsData && enrollmentsData.length > 0) {
        setEnrollments(enrollmentsData as unknown as EnrolledClass[]);

        // Fetch class_courses for each class
        const classIds = enrollmentsData.map(e => e.class_id);
        const { data: classCoursesData } = await supabase
          .from('class_courses')
          .select('class_id, course_id, courses(id, title)')
          .in('class_id', classIds);

        if (classCoursesData) {
          const grouped = (classCoursesData as any[]).reduce((acc, cc) => {
            if (!acc[cc.class_id]) acc[cc.class_id] = [];
            acc[cc.class_id].push(cc);
            return acc;
          }, {} as Record<string, ClassCourse[]>);
          setClassCourses(grouped);

          // Calculate progress for each class
          const progressMap: Record<string, ClassProgress> = {};
          
          for (const enrollment of enrollmentsData) {
            const courses = grouped[enrollment.class_id] || [];
            const courseIds = courses.map((c: ClassCourse) => c.course_id);

            if (courseIds.length > 0) {
              // Get all lessons from these courses
              const { data: lessons } = await supabase
                .from('lessons')
                .select('id')
                .in('course_id', courseIds);
              
              const lessonIds = lessons?.map(l => l.id) || [];

              // Get all exercises from these lessons
              const { data: exercises } = lessonIds.length > 0 
                ? await supabase
                    .from('exercises')
                    .select('id')
                    .in('lesson_id', lessonIds)
                : { data: [] };
              
              const exerciseIds = exercises?.map(e => e.id) || [];

              // Get completed lessons
              const { count: completedLessons } = lessonIds.length > 0
                ? await supabase
                    .from('student_progress')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .eq('completed', true)
                    .in('lesson_id', lessonIds)
                : { count: 0 };

              // Get completed exercises
              const { count: completedExercises } = exerciseIds.length > 0
                ? await supabase
                    .from('student_progress')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .eq('completed', true)
                    .in('exercise_id', exerciseIds)
                : { count: 0 };

              progressMap[enrollment.class_id] = {
                classId: enrollment.class_id,
                totalLessons: lessonIds.length,
                completedLessons: completedLessons || 0,
                totalExercises: exerciseIds.length,
                completedExercises: completedExercises || 0,
              };
            } else {
              progressMap[enrollment.class_id] = {
                classId: enrollment.class_id,
                totalLessons: 0,
                completedLessons: 0,
                totalExercises: 0,
                completedExercises: 0,
              };
            }
          }
          setProgress(progressMap);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const getProgressPercent = (classId: string) => {
    const p = progress[classId];
    if (!p) return 0;
    const total = p.totalLessons + p.totalExercises;
    if (total === 0) return 0;
    const completed = p.completedLessons + p.completedExercises;
    return Math.round((completed / total) * 100);
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
            <Link to="/student">
              <Button variant="outline" size="icon"><ArrowLeft className="w-5 h-5 text-foreground" /></Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-accent flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold text-foreground">Minhas Turmas</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {enrollments.length === 0 ? (
          <Card className="glass border-border/50">
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Você ainda não está matriculado em nenhuma turma</p>
              <Link to="/student/classes">
                <Button className="bg-gradient-primary">Explorar Turmas Disponíveis</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {enrollments.map((enrollment) => {
              const progressPercent = getProgressPercent(enrollment.class_id);
              const p = progress[enrollment.class_id];
              const isCompleted = progressPercent === 100 && p && (p.totalLessons + p.totalExercises) > 0;
              const courses = classCourses[enrollment.class_id] || [];
              
              return (
                <Card key={enrollment.id} className="glass border-border/50 hover:border-primary/30 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between flex-wrap gap-2"> {/* Adjusted for responsiveness */}
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Matriculado
                      </Badge>
                      {isCompleted && (
                        <Badge className="bg-badge-gold text-badge-gold-foreground">
                          <Award className="w-3 h-3 mr-1" />
                          Concluído
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg mt-2">{enrollment.classes.name}</CardTitle>
                    {enrollment.classes.description && (
                      <CardDescription className="line-clamp-2">{enrollment.classes.description}</CardDescription>
                    )}
                    {/* Show linked courses */}
                    {courses.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {courses.map((cc, idx) => (
                          <Badge key={idx} variant="secondary" className="bg-accent/10 text-accent">
                            <Layers className="w-3 h-3 mr-1" />
                            {cc.courses?.title || "Curso"}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium text-foreground">{progressPercent}%</span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                      {p && (
                        <div className="flex flex-col sm:flex-row sm:gap-4 mt-2 text-xs text-muted-foreground"> {/* Adjusted for responsiveness */}
                          <span>{p.completedLessons}/{p.totalLessons} aulas</span>
                          <span>{p.completedExercises}/{p.totalExercises} exercícios</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/student/class/${enrollment.class_id}`} className="flex-1">
                        <Button className="w-full bg-gradient-primary hover:opacity-90">
                          <Play className="w-4 h-4 mr-2" />
                          Continuar
                        </Button>
                      </Link>
                      {isCompleted && (
                        <Link to="/student/certificates">
                          <Button variant="outline">
                            <Award className="w-4 h-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyClasses;