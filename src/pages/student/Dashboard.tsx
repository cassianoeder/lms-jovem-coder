import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Award, BookOpen, Calendar, TrendingUp } from 'lucide-react';

interface StudentXP {
  total_xp: number;
  level: number;
}

interface Streak {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
}

const StudentDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const [xpData, setXpData] = useState<StudentXP | null>(null);
  const [streakData, setStreakData] = useState<Streak | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStudentData();
    }
  }, [user]);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      // Fetch XP data
      const { data: xp, error: xpError } = await supabase
        .from('student_xp')
        .select('total_xp, level')
        .eq('user_id', user.id)
        .single();

      if (xpError && xpError.code !== 'PGRST116') throw xpError;
      setXpData(xp);

      // Fetch Streak data
      const { data: streak, error: streakError } = await supabase
        .from('streaks')
        .select('current_streak, longest_streak, last_activity_date')
        .eq('user_id', user.id)
        .single();

      if (streakError && streakError.code !== 'PGRST116') throw streakError;
      setStreakData(streak);

    } catch (error) {
      console.error('Error fetching student data:', error);
      toast.error('Erro ao carregar dados do aluno: ' + (error as Error).message);
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
        <h2 className="text-3xl font-bold tracking-tight">Dashboard do Aluno</h2>
        <p className="text-muted-foreground">
          Bem-vindo de volta, {profile?.full_name || user?.email}!
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">XP Total</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{xpData?.total_xp || 0} XP</div>
            <p className="text-xs text-muted-foreground">
              Continue aprendendo para ganhar mais!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nível Atual</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Nível {xpData?.level || 1}</div>
            <Progress value={(xpData?.total_xp || 0) % 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {(xpData?.total_xp || 0) % 100}% para o próximo nível
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sequência (Streak)</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{streakData?.current_streak || 0} dias</div>
            <p className="text-xs text-muted-foreground">
              Maior sequência: {streakData?.longest_streak || 0} dias
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Meus Cursos
          </CardTitle>
          <CardDescription>
            Continue de onde parou ou explore novos cursos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">Nenhum curso em andamento</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Comece um novo curso para iniciar sua jornada de aprendizado!
            </p>
            <Button className="mt-4" onClick={() => window.location.hash = '/student/courses'}>
              Explorar Cursos
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDashboard;