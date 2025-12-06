import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Flame,
  Zap,
  Trophy,
  Target,
  BookOpen,
  Code2,
  ChevronRight,
  Star,
  Calendar,
  TrendingUp,
  Play,
  LogOut,
  Users,
  Award,
  Home,
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
}

interface Course {
  id: string;
  title: string;
  description: string;
  image_url: string;
}

interface StudentBadge {
  id: string;
  earned_at: string;
  badges: {
    name: string;
    icon: string;
    rarity: string;
  };
}

interface DailyMission {
  id: string;
  title: string;
  target_count: number;
  xp_reward: number;
  student_missions: {
    progress: number;
    completed: boolean;
  }[];
}

const StudentDashboard = () => {
  const { profile, signOut } = useAuth();
  const [xpData, setXpData] = useState<StudentXP | null>(null);
  const [streakData, setStreakData] = useState<Streak | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [badges, setBadges] = useState<StudentBadge[]>([]);
  const [missions, setMissions] = useState<DailyMission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch XP data
        const { data: xp } = await supabase
          .from('student_xp')
          .select('total_xp, level')
          .maybeSingle();
        setXpData(xp);

        // Fetch streak data
        const { data: streak } = await supabase
          .from('streaks')
          .select('current_streak, longest_streak')
          .maybeSingle();
        setStreakData(streak);

        // Fetch courses
        const { data: coursesData } = await supabase
          .from('courses')
          .select('*')
          .order('order_index');
        setCourses(coursesData || []);

        // Fetch badges
        const { data: badgesData } = await supabase
          .from('student_badges')
          .select('id, earned_at, badges(name, icon, rarity)')
          .order('earned_at', { ascending: false })
          .limit(3);
        setBadges(badgesData as StudentBadge[] || []);

        // Fetch daily missions with progress
        const { data: missionsData } = await supabase
          .from('daily_missions')
          .select(`
            id,
            title,
            target_count,
            xp_reward,
            student_missions(progress, completed)
          `)
          .eq('active', true);
        setMissions(missionsData as DailyMission[] || []);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const xpToNextLevel = (xpData?.level || 1) * 500;
  const currentXp = xpData?.total_xp || 0;
  const xpProgress = (currentXp % 500) / 500 * 100;

  const handleSignOut = async () => {
    await signOut();
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
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Code2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">JovemCoder</span>
          </Link>

          <div className="flex items-center gap-4">
            {/* XP Display */}
            <div className="hidden sm:flex items-center gap-2 bg-xp/10 px-3 py-1.5 rounded-full">
              <Zap className="w-4 h-4 text-xp" />
              <span className="text-sm font-medium text-xp">{currentXp} XP</span>
            </div>

            {/* Streak Display */}
            <div className="hidden sm:flex items-center gap-2 bg-streak/10 px-3 py-1.5 rounded-full">
              <Flame className="w-4 h-4 text-streak" />
              <span className="text-sm font-medium text-streak">{streakData?.current_streak || 0} dias</span>
            </div>

            {/* Level */}
            <div className="flex items-center gap-2 bg-level/10 px-3 py-1.5 rounded-full">
              <Star className="w-4 h-4 text-level" />
              <span className="text-sm font-medium text-level">Nível {xpData?.level || 1}</span>
            </div>

            <Link to="/">
              <Button variant="ghost" size="icon" title="Página inicial">
                <Home className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sair">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Olá, {profile?.full_name?.split(" ")[0] || "Estudante"}! 👋
          </h1>
          <p className="text-muted-foreground">Continue sua jornada e mantenha seu streak!</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-xp flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">XP Total</p>
                  <p className="font-display text-2xl font-bold text-foreground">{currentXp}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-streak flex items-center justify-center">
                  <Flame className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Streak</p>
                  <p className="font-display text-2xl font-bold text-foreground">{streakData?.current_streak || 0} dias</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-accent flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conquistas</p>
                  <p className="font-display text-2xl font-bold text-foreground">{badges.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Melhor Streak</p>
                  <p className="font-display text-2xl font-bold text-foreground">{streakData?.longest_streak || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Level Progress */}
        <Card className="glass border-border/50 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-gradient-accent flex items-center justify-center glow-accent">
                  <span className="font-display text-xl font-bold text-white">{xpData?.level || 1}</span>
                </div>
                <div>
                  <p className="font-display text-lg font-semibold text-foreground">Nível {xpData?.level || 1}</p>
                  <p className="text-sm text-muted-foreground">
                    {(xpData?.level || 1) < 5 ? "Iniciante" : (xpData?.level || 1) < 10 ? "Intermediário" : "Avançado"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Próximo nível</p>
                <p className="font-display text-lg font-semibold text-foreground">
                  {500 - (currentXp % 500)} XP restantes
                </p>
              </div>
            </div>
            <Progress value={xpProgress} className="h-3" />
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Daily Missions */}
          <Card className="glass border-border/50 lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Missões Diárias
              </CardTitle>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                <Calendar className="w-3 h-3 mr-1" />
                Hoje
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {missions.length > 0 ? missions.map((mission) => {
                const progress = mission.student_missions?.[0]?.progress || 0;
                const completed = mission.student_missions?.[0]?.completed || false;
                return (
                  <div
                    key={mission.id}
                    className={`p-4 rounded-xl border ${
                      completed ? "bg-primary/5 border-primary/20" : "bg-card border-border/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {completed ? (
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-white text-sm">✓</span>
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-muted-foreground text-sm">
                              {progress}/{mission.target_count}
                            </span>
                          </div>
                        )}
                        <span className={`font-medium ${completed ? "text-primary" : "text-foreground"}`}>
                          {mission.title}
                        </span>
                      </div>
                      <Badge variant="secondary" className="bg-xp/10 text-xp">
                        +{mission.xp_reward} XP
                      </Badge>
                    </div>
                    {!completed && (
                      <Progress value={(progress / mission.target_count) * 100} className="h-2" />
                    )}
                  </div>
                );
              }) : (
                <p className="text-muted-foreground text-center py-4">Nenhuma missão disponível</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Badges */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Trophy className="w-5 h-5 text-badge-gold" />
                Conquistas Recentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {badges.length > 0 ? badges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50"
                >
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl">
                    {badge.badges?.icon || "🏆"}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{badge.badges?.name}</p>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        badge.badges?.rarity === "epic"
                          ? "bg-level/10 text-level"
                          : badge.badges?.rarity === "rare"
                          ? "bg-info/10 text-info"
                          : badge.badges?.rarity === "legendary"
                          ? "bg-badge-gold/10 text-badge-gold"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {badge.badges?.rarity === "epic" ? "Épico" : 
                       badge.badges?.rarity === "rare" ? "Raro" : 
                       badge.badges?.rarity === "legendary" ? "Lendário" : "Comum"}
                    </Badge>
                  </div>
                </div>
              )) : (
                <p className="text-muted-foreground text-center py-4">Complete exercícios para ganhar badges!</p>
              )}
              <Button variant="ghost" className="w-full mt-2">
                Ver todas conquistas
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-3 gap-4 mt-6">
          <Link to="/student/classes">
            <Card className="glass border-border/50 hover:border-primary/50 transition-all cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="font-display text-lg font-bold text-foreground">Explorar Turmas</p>
                    <p className="text-sm text-muted-foreground">Encontre novas turmas</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/student/my-classes">
            <Card className="glass border-border/50 hover:border-accent/50 transition-all cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-accent flex items-center justify-center">
                    <BookOpen className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="font-display text-lg font-bold text-foreground">Minhas Turmas</p>
                    <p className="text-sm text-muted-foreground">Continue estudando</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/student/certificates">
            <Card className="glass border-border/50 hover:border-xp/50 transition-all cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-xp flex items-center justify-center">
                    <Award className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="font-display text-lg font-bold text-foreground">Certificados</p>
                    <p className="text-sm text-muted-foreground">Suas conquistas</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Continue Learning */}
        {courses.length > 0 && (
          <Card className="glass border-border/50 mt-6">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Continue Aprendendo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="p-4 rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl">
                        {course.image_url}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{course.title}</p>
                        <p className="text-sm text-muted-foreground">{course.description?.slice(0, 30)}...</p>
                      </div>
                    </div>
                    <Button className="w-full mt-4 bg-gradient-primary hover:opacity-90 group-hover:glow-primary transition-all">
                      <Play className="w-4 h-4 mr-2" />
                      Começar
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;
