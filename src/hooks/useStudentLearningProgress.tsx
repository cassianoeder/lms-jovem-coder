import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// Define a interface completa do Course conforme esperado pelo tipo de destino no erro
interface Course {
  id: string;
  title: string;
  description: string | null; // Pode ser nulo
  image_url: string | null; // Pode ser nulo
  order_index: number;
  created_at: string;
}

interface Lesson {
  id: string;
  title: string;
  course_id: string;
  module_id: string | null;
  completed: boolean;
}

interface Module {
  id: string;
  title: string;
  course_id: string;
  lessons: Lesson[];
}

interface StudentCourseProgress {
  course: Course;
  modules: Module[];
  completedLessonsCount: number;
  totalLessonsCount: number;
  completionPercentage: number;
}

export const useStudentLearningProgress = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<StudentCourseProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Buscar matrículas do usuário
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select('class_id')
          .eq('student_id', user.id)
          .eq('status', 'approved');

        if (enrollmentsError) throw enrollmentsError;

        if (!enrollments || enrollments.length === 0) {
          setProgress([]);
          setIsLoading(false);
          return;
        }

        const classIds = enrollments.map(e => e.class_id);

        // Buscar cursos associados a essas turmas
        // A instrução select deve corresponder à interface Course
        const { data: classCourses, error: classCoursesError } = await supabase
          .from('class_courses')
          .select('course_id, courses(id, title, description, image_url, order_index, created_at)'); // Garantir que todos os campos sejam selecionados

        if (classCoursesError) throw classCoursesError;

        const coursesMap = new Map<string, Course>();
        classCourses.forEach(cc => {
          // cc.courses pode ser um array de objetos, mesmo que seja apenas um.
          // Esperamos um único objeto Course por entrada class_course.
          const courseData = Array.isArray(cc.courses) ? cc.courses[0] : cc.courses;
          if (courseData) {
            // Cast para unknown primeiro, depois para Course para satisfazer TS2352
            coursesMap.set(cc.course_id, courseData as unknown as Course);
          }
        });

        const courseIds = Array.from(coursesMap.keys());

        // Buscar módulos e lições para esses cursos
        const { data: modulesData, error: modulesError } = await supabase
          .from('modules')
          .select('id, title, course_id, lessons(id, title, course_id, module_id)')
          .in('course_id', courseIds)
          .order('order_index', { foreignTable: 'lessons', ascending: true })
          .order('order_index', { ascending: true });

        if (modulesError) throw modulesError;

        // Buscar progresso do aluno para as lições
        const { data: studentProgressData, error: studentProgressError } = await supabase
          .from('student_progress')
          .select('lesson_id, completed')
          .eq('user_id', user.id)
          .eq('completed', true);

        if (studentProgressError) throw studentProgressError;

        const completedLessons = new Set(studentProgressData?.map(p => p.lesson_id));

        const courseProgressMap = new Map<string, StudentCourseProgress>();

        modulesData.forEach(module => {
          const course = coursesMap.get(module.course_id);
          if (!course) return;

          if (!courseProgressMap.has(course.id)) {
            courseProgressMap.set(course.id, {
              course: course,
              modules: [],
              completedLessonsCount: 0,
              totalLessonsCount: 0,
              completionPercentage: 0,
            });
          }

          const currentCourseProgress = courseProgressMap.get(course.id)!;
          const lessonsForModule: Lesson[] = (module.lessons || []).map((lesson: any) => ({
            id: lesson.id,
            title: lesson.title,
            course_id: lesson.course_id,
            module_id: lesson.module_id,
            completed: completedLessons.has(lesson.id),
          }));

          currentCourseProgress.modules.push({
            id: module.id,
            title: module.title,
            course_id: module.course_id,
            lessons: lessonsForModule,
          });

          currentCourseProgress.totalLessonsCount += lessonsForModule.length;
          currentCourseProgress.completedLessonsCount += lessonsForModule.filter(l => l.completed).length;
        });

        const finalProgress = Array.from(courseProgressMap.values()).map(cp => ({
          ...cp,
          completionPercentage: cp.totalLessonsCount > 0
            ? Math.round((cp.completedLessonsCount / cp.totalLessonsCount) * 100)
            : 0,
        }));

        setProgress(finalProgress);

      } catch (error) {
        console.error('Error fetching student learning progress:', error);
        toast.error('Erro ao carregar progresso de aprendizado.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgress();
  }, [user]);

  return { progress, isLoading };
};