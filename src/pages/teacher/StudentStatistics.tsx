import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Award, 
  Calendar, 
  TrendingUp, 
  Users, 
  CheckCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface ClassStats {
  id: string;
  name: string;
  total_students: number;
  active_students: number;
  average_xp: number;
  average_level: number;
  average_streak: number;
  completion_rate: number;
}

interface StudentProgress {
  id: string;
  full_name: string;
  total_xp: number;
  level: number;
  current_streak: number;
  completed_lessons: number;
  total_lessons: number;
  completion_rate: number;
  class_name: string;
}

const StudentStatistics = () => {
  const { user } = useAuth();
  const [classStats, setClassStats] = useState<ClassStats[]>([]);
  const [topStudents, setTopStudents] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStatistics();
    }
  }, [user]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      
      // First, get classes taught by this teacher
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('id, name')
        .eq('teacher_id', user?.id);

      if (classesError) throw classesError;

      if (!classes || classes.length === 0) {
        setClassStats([]);
        setTopStudents([]);
        setLoading(false);
        return;
      }

      const classIds = classes.map(cls => cls.id);

      // Fetch class statistics
      const classStatsPromises = classIds.map(async (classId) => {
        // Get class details
        const { data: classData, error: classError } = await supabase
          .from('classes')
          .select('name')
          .eq('id', classId)
          .single();

        if (classError) throw classError;

        // Get total students
        const { count: totalStudents, error: studentsError } = await supabase
          .from('enrollments')
          .select('*', { count: 'exact' })
          .eq('class_id', classId)
          .eq('status', 'approved');

        if (studentsError) throw studentsError;

        // Get student progress for completion rate
        const { data: progressData, error: progressError } = await supabase
          .from('student_progress')
          .select('completed')
          .in('user_id', 
            (await supabase
              .from('enrollments')
              .select('student_id')
              .eq('class_id', classId)
              .eq('status', 'approved')
            ).data?.map(e => e.student_id) || []
          );

        if (progressError) throw progressError;

        const totalProgressItems = progressData?.length || 0;
        const completedItems = progressData?.filter(p => p.completed).length || 0;
        const completionRate = totalProgressItems > 0 
          ? Math.round((completedItems / totalProgressItems) * 100) 
          : 0;

        return {
          id: classId,
          name: classData.name,
          total_students: totalStudents || 0,
          active_students: totalStudents || 0,
          average_xp: 0, // Will be calculated separately
          average_level: 0, // Will be calculated separately
          average_streak: 0, // Will be calculated separately
          completion_rate: completionRate
        };
      });

      const resolvedClassStats = await Promise.all(classStatsPromises);
      setClassStats(resolvedClassStats);

      // Fetch top students from all classes
      const { data: studentsData, error: studentsError } = await supabase
        .from('enrollments')
        .select(`
          student_id,
          class_id,
          classes (
            name
          ),
          profiles:user_id (
            full_name
          ),
          student_xp:user_id (
            total_xp,
            level
          ),
          streaks:user_id (
            current_streak
          )
        `)
        .in('class_id', classIds)
        .eq('status', 'approved')
        .limit(10);

      if (studentsError) throw studentsError;

      // Transform student data
      const transformedStudents = studentsData.map((enrollment: any) => {
        return {
          id: enrollment.student_id,
          full_name: enrollment.profiles?.full_name || 'Nome não disponível',
          total_xp: enrollment.student_xp?.total_xp || 0,
          level: enrollment.student_xp?.level || 1,
          current_streak: enrollment.streaks?.current_streak || 0,
          completed_lessons: 0, // Will be calculated separately
          total_lessons: 0, // Will be calculated separately
          completion_rate: 0, // Will be calculated separately
          class_name: enrollment.classes?.name || 'Turma não especificada'
        };
      })
      .sort((a: StudentProgress, b: StudentProgress) => b.total_xp - a.total_xp);

      setTopStudents(transformedStudents);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast.error('Erro ao carregar estatísticas');
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
        <h2 className="text-3xl font-bold tracking-tight">Estatísticas dos Alunos</h2>
        <p className="text-muted-foreground">
          Acompanhe o progresso e desempenho dos alunos em suas turmas
        </p>
      </div>

      {/* Class Statistics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Turmas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classStats.length}</div>
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
            <div className="text-2xl font-bold">
              {classStats.reduce((sum, cls) => sum + cls.total_students, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Alunos matriculados
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média de XP</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {classStats.length > 0 
                ? Math.round(classStats.reduce((sum, cls) => sum + cls.average_xp, 0) / classStats.length)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Pontos de experiência
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {classStats.length > 0 
                ? Math.round(classStats.reduce((sum, cls) => sum + cls.completion_rate, 0) / classStats.length)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Média das turmas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Class Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {classStats.map((cls) => (
          <Card key={cls.id}>
            <CardHeader>
              <CardTitle>{cls.name}</CardTitle>
              <CardDescription>
                Estatísticas da turma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Alunos matriculados</span>
                <span className="text-sm text-muted-foreground">{cls.total_students}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Taxa de conclusão</span>
                <span className="text-sm text-muted-foreground">{cls.completion_rate}%</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso médio</span>
                  <span>{cls.completion_rate}%</span>
                </div>
                <Progress value={cls.completion_rate} className="h-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Students */}
      <Card>
        <CardHeader>
          <CardTitle>Principais Alunos</CardTitle>
          <CardDescription>
            Alunos com melhor desempenho em suas turmas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topStudents.length > 0 ? (
            <div className="space-y-4">
              {topStudents.map((student, index) => (
                <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                      <span className="text-sm font-medium text-primary">#{index + 1}</span>
                    </div>
                    <div>
                      <div className="font-medium">{student.full_name}</div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline">{student.class_name}</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-medium">Nível {student.level}</div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Award className="w-4 h-4 mr-1" />
                        {student.total_xp} XP
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-1" />
                        {student.current_streak} dias
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum aluno encontrado</h3>
              <p className="text-muted-foreground">
                Não há alunos matriculados em suas turmas no momento
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentStatistics;