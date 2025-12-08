import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Tables } from '@/integrations/supabase/types';

type Lesson = Tables<'lessons'>;
type Course = Tables<'courses'>;
type StudentProgress = Tables<'student_progress'>;
type Exercise = Tables<'exercises'>;

interface NextLearningItem {
  courseId: string;
  courseTitle: string;
  courseImageUrl: string | null;
  nextLesson: Lesson | null;
  progressPercentage: number;
}

export const useStudentLearningProgress = () => {
  const { user } = useAuth();
  const [learningProgress, setLearningProgress] = useState<NextLearningItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data: enrollmentsData, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select('class_id')
          .eq('student_id', user.id)
          .eq('status', 'approved');
          
        if (enrollmentsError) throw enrollmentsError;
        if (!enrollmentsData || enrollmentsData.length === 0) {
          setLearningProgress([]);
          setLoading(false);
          return;
        }
        
        const classIds = enrollmentsData.map(e => e.class_id);
        const { data: classCoursesData, error: classCoursesError } = await supabase
          .from('class_courses')
          .select('course_id, courses(id, title, image_url)')
          .in('class_id', classIds);
          
        if (classCoursesError) throw classCoursesError;
        const uniqueCourseIds = [...new Set(classCoursesData?.map(cc => cc.course_id))] as string[];
        const coursesMap = new Map<string, Course>();
        classCoursesData?.forEach(cc => {
          if (cc.courses) {
            coursesMap.set(cc.course_id, cc.courses as Course);
          }
        });
        
        if (uniqueCourseIds.length === 0) {
          setLearningProgress([]);
          setLoading(false);
          return;
        }
        
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .in('course_id', uniqueCourseIds)
          .order('course_id')
          .order('module_id')
          .order('order_index');
          
        if (lessonsError) throw lessonsError;
        const lessonIds = lessonsData?.map(l => l.id) || [];
        const { data: exercisesData, error: exercisesError } = lessonIds.length > 0 ? 
          await supabase
            .from('exercises')
            .select('id, lesson_id')
            .in('lesson_id', lessonIds) : 
          { data: [], error: null };
          
        if (exercisesError) throw exercisesError;
        const { data: progressData, error: progressError } = await supabase
          .from('student_progress')
          .select('lesson_id, exercise_id, completed')
          .eq('user_id', user.id);
          
        if (progressError) throw progressError;
        const completedLessons = new Set(progressData?.filter(p => p.lesson_id && p.completed).map(p => p.lesson_id));
        const completedExercises = new Set(progressData?.filter(p => p.exercise_id && p.completed).map(p => p.exercise_id));
        
        // Correção 1: Tipar corretamente o accumulator e garantir que exercisesData seja um array
        const exercisesByLesson = (exercisesData || []).reduce<Record<string, string[]>>((acc: Record<string, string[]>, ex: any) => {
          if (ex.lesson_id) {
            if (!acc[ex.lesson_id]) acc[ex.lesson_id] = [];
            acc[ex.lesson_id].push(ex.id);
          }
          return acc;
        }, {});
        
        const results: NextLearningItem[] = [];
        // Correção 2: Tipar courseId como string
        for (const courseId of uniqueCourseIds) {
          const course = coursesMap.get(courseId);
          if (!course) continue;
          
          let nextLesson: Lesson | null = null;
          let totalCourseLessons = 0;
          let completedCourseLessons = 0;
          const lessonsInCourse = lessonsData?.filter(l => l.course_id === courseId) || [];
          totalCourseLessons = lessonsInCourse.length;
          
          for (const lesson of lessonsInCourse) {
            const isLessonMarkedComplete = completedLessons.has(lesson.id);
            const lessonExercises = exercisesByLesson[lesson.id] || [];
            const allLessonExercisesCompleted = lessonExercises.every(exId => completedExercises.has(exId));
            const isLessonFullyCompleted = isLessonMarkedComplete && allLessonExercisesCompleted;
            
            if (isLessonFullyCompleted) {
              completedCourseLessons++;
            }
            if (!nextLesson && !isLessonFullyCompleted) {
              nextLesson = lesson;
            }
          }
          
          const progressPercentage = totalCourseLessons > 0 ? Math.round((completedCourseLessons / totalCourseLessons) * 100) : 0;
          results.push({
            courseId: course.id,
            courseTitle: course.title,
            courseImageUrl: course.image_url,
            nextLesson,
            progressPercentage,
          });
        }
        setLearningProgress(results);
      } catch (error) {
        console.error("Error fetching student learning progress:", error);
        setLearningProgress([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, [user]);
  
  return { learningProgress, loading };
};