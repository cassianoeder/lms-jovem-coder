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
  Clock,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

interface SystemStats {
  total_students: number;
  active_students: number;
  pending_students: number;
  average_xp: number;
  average_level: number;
  average_streak: number;
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
  class_name: string | null;
  enrollment_status: string | null; // Added enrollment_status
}

const StudentStatistics = () => {
  const { user } = useAuth();
  const [systemStats, setSystemStats] = useState<SystemStats>({
    total_students: 0,
    active_students: 0,
    pending_students: 0,
    average_xp: 0,
    average_level: 0,
    average_streak: 0
  });
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
      
      // Call the new Supabase function to get all student data
      const { data: studentsData, error: studentsError } = await supabase.rpc('get_all_students_data');

      if (studentsError) throw studentsError;

      const allStudents: StudentProgress[] = studentsData || [];

      // Calculate system statistics
      const totalStudents = allStudents.length;
      const activeStudents = allStudents.filter(s => s.enrollment_status === 'approved').length;
      const pendingStudents = allStudents.filter(s => s.enrollment_status === 'pending').length;
      
      // Calculate averages
      const totalXP = allStudents.reduce((sum, s) => sum + (s.total_xp || 0), 0);
      const totalLevel = allStudents.reduce((sum, s) => sum + (s.level || 1), 0);
      const totalStreak = allStudents.reduce((sum, s) => sum + (s.current_streak || 0), 0);
      
      const averageXP = totalStudents > 0 ? Math.round(totalXP / totalStudents) : 0;
      const averageLevel = totalStudents > 0 ? Math.round(totalLevel / totalStudents) : 0;
      const averageStreak = totalStudents > 0 ? Math.round(totalStreak / totalStudents) : 0;

      setSystemStats({
        total_students: totalStudents,
        active_students: activeStudents,
        pending_students: pendingStudents,
        average_xp: averageXP,
        average_level: averageLevel,
        average_streak: averageStreak
      });

      // Top 10 students (already sorted by XP in the function, but let's re-sort for safety)
      const sortedStudents = [...allStudents].sort((a, b) => b.total_xp - a.total_xp).slice(0, 10);
      setTopStudents(sortedStudents);

    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast.error('Erro ao carregar estatísticas: ' + (error as Error).message);
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
          Acompanhe o progresso e desempenho de todos os alunos do sistema
        </p>
      </div>

      {/* System Statistics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.total_students}</div>
            <p className="text-xs text-muted-foreground">
              Alunos cadastrados
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alunos Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.active_students}</div>
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
            <div className="text-2xl font-bold">{systemStats.average_xp}</div>
            <p className="text-xs text-muted-foreground">
              Pontos de experiência
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nível Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.average_level}</div>
            <p className="text-xs text-muted-foreground">
              Nível médio dos alunos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Streak Médio</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.average_streak}</div>
            <p className="text-xs text-muted-foreground">
              Dias consecutivos estudando
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alunos Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.pending_students}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando aprovação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Students */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Principais Alunos
          </CardTitle>
          <CardDescription>
            Alunos com melhor desempenho no sistema
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
                        {student.class_name ? (
                          <Badge variant="outline">{student.class_name}</Badge>
                        ) : (
                          <Badge variant="secondary">Sem turma</Badge>
                        )}
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
                Não há alunos cadastrados no sistema no momento
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentStatistics;