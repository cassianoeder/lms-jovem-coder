import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  BookOpen, Zap, Trophy, Award, CalendarDays, CheckCircle, LogOut,
  Code2, GraduationCap, Star, Target, Clock
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface StudentXP {
  total_xp: number;
  level: number;
}

interface Streak {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
}

interface Badge {
  name: string;
  icon: string | null;
  rarity: string | null;
}

interface StudentBadge {
  id: string;
  earned_at: string;
  badges: Badge; // Assumindo que 'badges' é um objeto relacionado único
}

interface DailyMission {
  id: string;
  title: string;
  description: string | null; // Pode ser nulo
  mission_type: string;
  target_count: number;
  xp_reward: number;
}

interface StudentMission {
  id: string;
  mission_id: string;
  date: string;
  progress: number;
  completed: boolean;
  daily_missions: DailyMission; // Assumindo que 'daily_missions' é um objeto relacionado único
}

const StudentDashboard = () => {
  const { user, signOut } = useAuth();
  const [xpData, setXpData] = useState<StudentXP | null>(null);
  const [streakData, setStreakData] = useState<Streak | null>(null);
  const [badges, setBadges] = useState<StudentBadge[]>([]);
  const [missions, setMissions] = useState<StudentMission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStudentData();
    }
  }, [user]);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      // Fetch XP and Level
      const { data: xp, error: xpError } = await supabase
        .from('student_xp')
        .select('total_xp, level')
        .eq('user_id', user?.id)
        .maybeSingle();
      if (xpError) throw xpError;
      setXpData(xp);

      // Fetch Streaks
      const { data: streak, error: streakError } = await supabase
        .from('streaks')
        .select('current_streak, longest_streak, last_activity_date')
        .eq('user_id', user?.id)
        .maybeSingle();
      if (streakError) throw streakError;
      setStreakData(streak);

      // Fetch Badges
      const { data: badgesData, error: badgesError } = await supabase
        .from('student_badges')
        .select('id, earned_at, badges(name, icon, rarity)')
        .eq('user_id', user?.id)
        .limit(3); // Limit to 3 recent badges
      if (badgesError) throw badgesError;
      
      const mappedBadges: StudentBadge[] = (badgesData || []).map(item => {
        // item.badges pode ser um array ou um objeto, dependendo da configuração do Supabase
        const badgeData = Array.isArray(item.badges) ? item.badges[0] : item.badges;
        return {
          id: item.id,
          earned_at: item.earned_at,
          badges: badgeData as Badge // Cast após garantir que é um único objeto
        };
      });
      setBadges(mappedBadges);

      // Fetch Daily Missions
      const today = new Date().toISOString().split('T')[0];
      const { data: missionsData, error: missionsError } = await supabase
        .from('student_missions')
        .select('id, mission_id, date, progress, completed, daily_missions(id, title, description, mission_type, target_count, xp_reward)')
        .eq('user_id', user?.id)
        .eq('date', today);
      if (missionsError) throw missionsError;

      const mappedMissions: StudentMission[] = (missionsData || []).map(item => {
        // item.daily_missions pode ser um array ou um objeto
        const dailyMissionData = Array.isArray(item.daily_missions) ? item.daily_missions[0] : item.daily_missions;
        return {
          id: item.id,
          mission_id: item.mission_id,
          date: item.date,
          progress: item.progress,
          completed: item.completed,
          daily_missions: dailyMissionData as DailyMission // Cast após garantir que é um único objeto
        };
      });
      setMissions(mappedMissions);

    } catch (error) {
      console.error("Error fetching student data:", error);
      toast.error("Erro ao carregar dados do aluno.");
    } finally {
      setLoading(false);
    }
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
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Code2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold text-foreground">JovemCoder</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-foreground font-medium">Olá, {user?.user_metadata?.full_name || user?.email}!</span>
            <Button variant="outline" size="icon" onClick={signOut}>
              <LogOut className="w-5 h-5 text-foreground" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold font-display text-foreground mb-8">Dashboard do Aluno</h1>

        {/* XP and Level */}
        <Card className="glass border-border/50 mb-6">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-level/20 flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-level" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nível Atual</p>
                <p className="font-display text-3xl font-bold text-level">{xpData?.level || 1}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-xp/20 flex items-center justify-center">
                <Zap className="w-8 h-8 text-xp" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">XP Total</p>
                <p className="font-display text-3xl font-bold text-xp">{xpData?.total_xp || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Streaks and Badges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="glass border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Sua Sequência</CardTitle>
              <CalendarDays className="h-4 w-4 text-streak" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-streak">{streakData?.current_streak || 0} dias</div>
              <p className="text-xs text-muted-foreground">Maior sequência: {streakData?.longest_streak || 0} dias</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Badges Recentes</CardTitle>
              <Award className="h-4 w-4 text-badge-gold" />
            </CardHeader>
            <CardContent>
              {badges.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {badges.map((badge) => (
                    <Badge key={badge.id} variant="secondary" className="bg-badge-gold/10 text-badge-gold">
                      {badge.badges.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Nenhum badge ainda. Continue aprendendo!</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Daily Missions */}
        <Card className="glass border-border/50 mb-6">
          <CardHeader>
            <CardTitle className="text-foreground">Missões Diárias</CardTitle>
          </CardHeader>
          <CardContent>
            {missions.length > 0 ? (
              <div className="space-y-4">
                {missions.map((mission) => (
                  <div key={mission.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                    <div>
                      <p className="font-medium text-foreground">{mission.daily_missions.title}</p>
                      <p className="text-sm text-muted-foreground">{mission.daily_missions.description}</p>
                      <p className="text-xs text-muted-foreground">Recompensa: {mission.daily_missions.xp_reward} XP</p>
                    </div>
                    {mission.completed ? (
                      <Badge className="bg-success/20 text-success">
                        <CheckCircle className="w-4 h-4 mr-1" /> Concluída
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-warning">
                        <Clock className="w-4 h-4 mr-1" /> {mission.progress}/{mission.daily_missions.target_count}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhuma missão diária por enquanto. Volte amanhã!</p>
            )}
          </CardContent>
        </Card>

        {/* Continue Learning */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-foreground">Continuar Aprendendo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Explore nossos cursos e continue sua jornada de aprendizado.</p>
            <Link to="/student/courses">
              <Button className="bg-gradient-primary">
                <BookOpen className="w-4 h-4 mr-2" /> Ver Cursos
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StudentDashboard;