import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  ArrowLeft, BookOpen, Layers, Play, CheckCircle, Video, FileCode, 
  Lock, Clock, Zap, ChevronRight, ListChecks
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ClassData {
  id: string;
  name: string;
  description: string | null;
}

interface Course {
  id: string;
  title: string;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  course_id: string;
  order_index: number;
}

interface Lesson {
  id: string;
  title: string;
  video_url: string | null;
  duration_minutes: number;
  xp_reward: number;
  module_id: string | null;
  order_index: number;
}

interface Exercise {
  id: string;
  title: string;
  type: string;
  xp_reward: number;
  lesson_id: string | null;
  difficulty: number;
}

interface StudentProgress {
  lesson_id: string | null;
  exercise_id: string | null;
  completed: boolean;
}

const ClassContent = () => {
  const { classId } = useParams<{ classId: string }>();
  const { user } = useAuth();
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!classId || !user) return;

      // Fetch class data
      const { data: classResult } = await supabase
        .from('classes')
        .select('id, name, description')
        .eq('id', classId)
        .single();
      setClassData(classResult);

      // Fetch class_courses (courses linked to this class)
      const { data: classCourses } = await supabase
        .from('class_courses')
        .select('course_id, courses(id, title)')
        .eq('class_id', classId);

      const linkedCourses = (classCourses || []).map((cc: any) => cc.courses).filter(Boolean);
      setCourses(linkedCourses);
      const linkedCourseIds = linkedCourses.map((c: Course) => c.id);
      setEnrolledCourseIds(linkedCourseIds);

      if (linkedCourseIds.length > 0) {
        // Fetch modules for linked courses
        const { data: modulesData } = await supabase
          .from('modules')
          .select('*')
          .in('course_id', linkedCourseIds)
          .eq('is_active', true)
          .order('order_index');
        setModules(modulesData || []);

        // Fetch lessons for linked courses
        const { data: lessonsData } = await supabase
          .from('lessons')
          .select('id, title, video_url, duration_minutes, xp_reward, module_id, order_index')
          .in('course_id', linkedCourseIds)
          .order('order_index');
        setLessons(lessonsData || []);

        // Get lesson IDs to fetch exercises
        const lessonIds = (lessonsData || []).map(l => l.id);
        if (lessonIds.length > 0) {
          const { data: exercisesData } = await supabase
            .from('exercises')
            .select('id, title, type, xp_reward, lesson_id, difficulty')
            .in('lesson_id', lessonIds);
          setExercises(exercisesData || []);
        }
      }

      // Fetch ALL lessons and exercises (for showing locked content)
      const { data: allLessonsData } = await supabase
        .from('lessons')
        .select('id, title, video_url, duration_minutes, xp_reward, module_id, order_index, course_id')
        .order('order_index');
      setAllLessons(allLessonsData || []);

      // Fetch all exercises
      const allLessonIds = (allLessonsData || []).map((l: any) => l.id);
      if (allLessonIds.length > 0) {
        const { data: allExercisesData } = await supabase
          .from('exercises')
          .select('id, title, type, xp_reward, lesson_id, difficulty');
        setAllExercises(allExercisesData || []);
      }

      // Fetch all modules
      const { data: allModulesData } = await supabase
        .from('modules')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      // Merge modules: ones from enrolled courses + all others
      const allModuleIds = (allModulesData || []).map((m: Module) => m.id);
      const enrolledModuleIds = (modulesData => modulesData || [])([]);
      // We'll recalculate this after setting modules
      
      // Fetch student progress
      const { data: progressData } = await supabase
        .from('student_progress')
        .select('lesson_id, exercise_id, completed')
        .eq('user_id', user.id);
      setProgress(progressData || []);

      // Set all modules for display (enrolled + locked)
      setModules(allModulesData || []);

      setLoading(false);
    };

    fetchData();
  }, [classId, user]);

  const isLessonCompleted = (lessonId: string) => {
    return progress.some(p => p.lesson_id === lessonId && p.completed);
  };

  const isExerciseCompleted = (exerciseId: string) => {
    return progress.some(p => p.exercise_id === exerciseId && p.completed);
  };

  const getModuleLessons = (moduleId: string) => {
    return allLessons
      .filter(l => l.module_id === moduleId)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  };

  const getLessonExercises = (lessonId: string) => {
    return allExercises.filter(e => e.lesson_id === lessonId);
  };

  // Check if a lesson is accessible based on sequential progress
  const isLessonAccessible = (lesson: Lesson, moduleLessons: Lesson[]) => {
    // Check if this lesson belongs to an enrolled course
    const lessonFull = allLessons.find(l => l.id === lesson.id) as any;
    if (!lessonFull) return false;
    if (!enrolledCourseIds.includes(lessonFull.course_id)) return false;

    // Find lesson index in the module
    const lessonIndex = moduleLessons.findIndex(l => l.id === lesson.id);
    
    // First lesson is always accessible
    if (lessonIndex === 0) return true;
    
    // Check if all previous lessons in the module are completed
    for (let i = 0; i < lessonIndex; i++) {
      const prevLesson = moduleLessons[i];
      if (!isLessonCompleted(prevLesson.id)) {
        return false;
      }
      // Also check if all exercises of previous lessons are completed
      const prevExercises = getLessonExercises(prevLesson.id);
      for (const ex of prevExercises) {
        if (!isExerciseCompleted(ex.id)) {
          return false;
        }
      }
    }
    
    return true;
  };

  const getModuleProgress = (moduleId: string) => {
    const moduleLessons = getModuleLessons(moduleId);
    const accessibleLessons = moduleLessons.filter(l => {
      const full = allLessons.find(al => al.id === l.id) as any;
      return full && enrolledCourseIds.includes(full.course_id);
    });
    if (accessibleLessons.length === 0) return 0;
    const completed = accessibleLessons.filter(l => isLessonCompleted(l.id)).length;
    return Math.round((completed / accessibleLessons.length) * 100);
  };

  const isModuleAccessible = (module: Module) => {
    return enrolledCourseIds.includes(module.course_id);
  };

  // Group modules by course
  const modulesByCourse = modules.reduce((acc, module) => {
    if (!acc[module.course_id]) acc[module.course_id] = [];
    acc[module.course_id].push(module);
    return acc;
  }, {} as Record<string, Module[]>);

  // Get all courses (enrolled + others for locked display)
  const allCourseIds = [...new Set(modules.map(m => m.course_id))];

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
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/student/my-classes">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="font-display text-lg font-bold text-foreground">{classData?.name}</h1>
            <p className="text-sm text-muted-foreground">
              {courses.length} curso(s) vinculado(s)
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Enrolled Courses */}
        {courses.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {courses.map((course) => (
              <Badge key={course.id} className="bg-primary/10 text-primary">
                <BookOpen className="w-3 h-3 mr-1" />
                {course.title}
              </Badge>
            ))}
          </div>
        )}

        {modules.length === 0 ? (
          <Card className="glass border-border/50">
            <CardContent className="py-12 text-center">
              <Layers className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum conteúdo disponível ainda</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {allCourseIds.map((courseId) => {
              const courseModules = modulesByCourse[courseId] || [];
              const isEnrolled = enrolledCourseIds.includes(courseId);
              // Find course title
              const courseTitle = courses.find(c => c.id === courseId)?.title || "Curso";

              return (
                <div key={courseId} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className={`w-5 h-5 ${isEnrolled ? 'text-primary' : 'text-muted-foreground'}`} />
                    <h2 className="font-display text-xl font-bold text-foreground">{courseTitle}</h2>
                    {!isEnrolled && (
                      <Badge variant="secondary" className="bg-muted text-muted-foreground">
                        <Lock className="w-3 h-3 mr-1" />
                        Não vinculado
                      </Badge>
                    )}
                  </div>

                  <Accordion type="multiple" className="space-y-3">
                    {courseModules.map((module) => {
                      const moduleProgress = getModuleProgress(module.id);
                      const accessible = isModuleAccessible(module);
                      const moduleLessons = getModuleLessons(module.id);

                      return (
                        <AccordionItem 
                          key={module.id} 
                          value={module.id}
                          className={`border rounded-xl overflow-hidden ${
                            accessible 
                              ? 'glass border-border/50' 
                              : 'bg-muted/30 border-border/30'
                          }`}
                        >
                          <AccordionTrigger className="px-4 py-3 hover:no-underline">
                            <div className="flex items-center gap-4 flex-1">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                accessible ? 'bg-gradient-primary' : 'bg-muted'
                              }`}>
                                {accessible ? (
                                  <Layers className="w-6 h-6 text-white" />
                                ) : (
                                  <Lock className="w-6 h-6 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1 text-left">
                                <h3 className={`font-medium ${accessible ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {module.title}
                                </h3>
                                {module.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-1">{module.description}</p>
                                )}
                                <div className="flex items-center gap-4 mt-1">
                                  <span className="text-xs text-muted-foreground">
                                    {moduleLessons.length} aulas
                                  </span>
                                  {accessible && moduleProgress > 0 && (
                                    <div className="flex items-center gap-2">
                                      <Progress value={moduleProgress} className="h-1 w-20" />
                                      <span className="text-xs text-primary">{moduleProgress}%</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="space-y-2 ml-16">
                              {moduleLessons.map((lesson, lessonIndex) => {
                                const isAccessible = isLessonAccessible(lesson, moduleLessons);
                                const completed = isLessonCompleted(lesson.id);
                                const lessonExercises = getLessonExercises(lesson.id);
                                const allExercisesCompleted = lessonExercises.every(e => isExerciseCompleted(e.id));

                                return (
                                  <div key={lesson.id} className="space-y-1">
                                    {/* Lesson */}
                                    <div 
                                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                        isAccessible 
                                          ? 'hover:bg-muted/50 cursor-pointer' 
                                          : 'opacity-60'
                                      }`}
                                    >
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                        completed 
                                          ? 'bg-primary' 
                                          : isAccessible 
                                            ? 'bg-accent/20' 
                                            : 'bg-muted'
                                      }`}>
                                        {completed ? (
                                          <CheckCircle className="w-4 h-4 text-white" />
                                        ) : isAccessible ? (
                                          lesson.video_url ? (
                                            <Video className="w-4 h-4 text-accent" />
                                          ) : (
                                            <BookOpen className="w-4 h-4 text-accent" />
                                          )
                                        ) : (
                                          <Lock className="w-4 h-4 text-muted-foreground" />
                                        )}
                                      </div>
                                      <div className="flex-1">
                                        <p className={`font-medium text-sm ${
                                          isAccessible ? 'text-foreground' : 'text-muted-foreground'
                                        }`}>
                                          {lesson.title}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                          {lesson.duration_minutes > 0 && (
                                            <span className="flex items-center gap-1">
                                              <Clock className="w-3 h-3" />
                                              {lesson.duration_minutes} min
                                            </span>
                                          )}
                                          <span className="flex items-center gap-1">
                                            <Zap className="w-3 h-3 text-xp" />
                                            {lesson.xp_reward} XP
                                          </span>
                                        </div>
                                      </div>
                                      {isAccessible && (
                                        <Link to={`/student/lesson/${lesson.id}`}>
                                          <Button size="sm" variant={completed ? "outline" : "default"} className={completed ? "" : "bg-gradient-primary"}>
                                            {completed ? "Revisar" : "Iniciar"}
                                            <ChevronRight className="w-4 h-4 ml-1" />
                                          </Button>
                                        </Link>
                                      )}
                                    </div>

                                    {lessonExercises.length > 0 && (
                                      <div className="ml-11 space-y-1">
                                        {lessonExercises.map((exercise, exIndex) => {
                                          const exCompleted = isExerciseCompleted(exercise.id);
                                          // Exercise is accessible if lesson is accessible and all previous exercises are completed
                                          const exAccessible = isAccessible && (exIndex === 0 || isExerciseCompleted(lessonExercises[exIndex - 1]?.id));
                                          
                                          return (
                                            <div 
                                              key={exercise.id}
                                              className={`flex items-center gap-3 p-2 rounded-lg ${
                                                exAccessible ? 'hover:bg-muted/30' : 'opacity-50'
                                              }`}
                                            >
                                              <div className={`w-6 h-6 rounded flex items-center justify-center ${
                                                exCompleted 
                                                  ? 'bg-primary' 
                                                  : exAccessible 
                                                    ? 'bg-muted' 
                                                    : 'bg-muted/50'
                                              }`}>
                                                {exCompleted ? (
                                                  <CheckCircle className="w-3 h-3 text-white" />
                                                ) : exAccessible ? (
                                                  exercise.type === 'code' ? (
                                                    <FileCode className="w-3 h-3 text-muted-foreground" />
                                                  ) : (
                                                    <ListChecks className="w-3 h-3 text-muted-foreground" />
                                                  )
                                                ) : (
                                                  <Lock className="w-3 h-3 text-muted-foreground" />
                                                )}
                                              </div>
                                              <span className={`text-sm flex-1 ${
                                                exAccessible ? 'text-foreground' : 'text-muted-foreground'
                                              }`}>
                                                {exercise.title}
                                              </span>
                                              <Badge variant="secondary" className="text-xs bg-xp/10 text-xp">
                                                +{exercise.xp_reward} XP
                                              </Badge>
                                              {exAccessible && (
                                                <Link to={`/student/exercise/${exercise.id}?lessonId=${lesson.id}`}>
                                                  <Button size="sm" variant={exCompleted ? "ghost" : "default"} className={exCompleted ? "h-7" : "h-7 bg-gradient-primary"}>
                                                    {exCompleted ? <Play className="w-3 h-3" /> : "Iniciar"}
                                                  </Button>
                                                </Link>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default ClassContent;