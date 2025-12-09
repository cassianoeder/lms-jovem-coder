import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { BookOpen, Users, GraduationCap, BarChart3, Award, TrendingUp } from 'lucide-react';

interface CourseProgressStats {
  id: string;
  title: string;
  total_lessons: number;
  completed_lessons: number;
  total_students: number;
  completion_rate: number;
}

const TeacherDashboard = () => {
  const { user, profile, role, signOut } = useAuth(); // Corrected destructuring
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalClasses: 0,
    totalStudents: 0,
  });
  const [courseProgress, setCourseProgress] = useState<CourseProgressStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch total courses
      const { count: totalCourses, error: coursesError } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true });
      if (coursesError) throw coursesError;

      // Fetch total classes
      const { count: totalClasses, error: classesError } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true });
      if (classesError) throw classesError;

      // Fetch total students (using the rpc function for consistency)
      const { data: studentsData, error: studentsError } = await supabase.rpc('get_all_students_data');
      if (studentsError) throw studentsError;
      const totalStudents = studentsData ? studentsData.length : 0;

      setStats({
        totalCourses: totalCourses || 0,
        totalClasses: totalClasses || 0,
        totalStudents: totalStudents,
      });

      // Fetch course progress statistics
      const { data: progressStats, error: progressError } = await supabase.rpc('get_course_progress_stats');
      if (progressError) throw progressError;
      setCourseProgress(progressStats || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Erro ao carregar dados do dashboard: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard do Professor</h2>
        <p className="text-muted-foreground">
          Bem-vindo de volta, {profile?.full_name || user?.email}!
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Cursos</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              Cursos disponíveis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Turmas</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClasses}</div>
            <p className="text-xs text-muted-foreground">
              Turmas ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Alunos cadastrados
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Progresso dos Cursos
          </CardTitle>
          <CardDescription>
            Visão geral do progresso dos alunos em seus cursos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {courseProgress.length > 0 ? (
            <div className="space-y-4">
              {courseProgress.map((course) => (
                <div key={course.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{course.title}</h3>
                    <Badge variant="secondary">{course.completion_rate}% Concluído</Badge>
                  </div>
                  <Progress value={course.completion_rate} className="mb-2" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{course.completed_lessons}/{course.total_lessons} Aulas Concluídas</span>
                    <span>{course.total_students} Alunos</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum curso encontrado</h3>
              <p className="text-muted-foreground">
                Crie cursos para começar a acompanhar o progresso dos alunos.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherDashboard;