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
  BookOpen,
  Code2,
  ChevronRight,
  Star,
  TrendingUp,
  Play,
  LogOut,
  Users,
  Award,
  Home,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useStudentLearningProgress } from "@/hooks/useStudentLearningProgress";

interface StudentXP {
  total_xp: number;
  level: number;
}

interface Streak {
  current_streak: number;
  longest_streak: number;
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

const StudentDashboard = () => {
  const { profile, signOut } = useAuth();
  const [xpData, setXpData] = useState<StudentXP | null>(null);
  const [streakData, setStreakData] = useState<Streak | null>(null);
  const [badges, setBadges] = useState<StudentBadge[]>([]);
  // missions state removed
  const [loading, setLoading] = useState(true);

  const { learningProgress, loading: learningProgressLoading } = useStudentLearningProgress();

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

        // Fetch badges
        const { data: badgesData } = await supabase
          .from('student_badges')
          .select('id, earned_at, badges(name, icon, rarity)')
          .order('earned_at', { ascending: false })
          .limit(3);
        setBadges(badgesData as StudentBadge[] || []);

        // Daily missions fetching logic removed

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

  if (loading || learningProgressLoading) {
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
            <span className="font-display text-lg font-bold text-foreground hidden sm:inline">JovemCoder</span> {/* Hidden on small screens */}
          </Link>

          <div className="flex items-center gap-2 sm:gap-4"> {/* Adjusted gap for mobile */}
            {/* XP Display */}
            <div className="flex items-center gap-1 bg-xp/10 px-2 py-1 rounded-full sm:px-3 sm:py-1.5"> {/* Adjusted padding for mobile */}
              <Zap className="w-3 h-3 text-xp sm:w-4 sm:h-4" /> {/* Adjusted icon size for mobile */}
              <span className="text-xs font-medium text-xp sm:text-sm">{currentXp} XP</span> {/* Adjusted text size for mobile */}
            </div>

            {/* Streak Display */}
            <div className="flex items-center gap-1 bg-streak/10 px-2 py-1 rounded-full sm:px-3 sm:py-1.5"> {/* Adjusted padding for mobile */}
              <Flame className="w-3 h-3 text-streak sm:w-4 sm:h-4" /> {/* Adjusted icon size for mobile */}
              <span className="text-xs font-medium text-streak sm:text-sm">{streakData?.current_streak || 0} dias</span> {/* Adjusted text size for mobile */}
            </div>

            {/* Level */}
            <div className="flex items-center gap-1 bg-level/10 px-2 py-1 rounded-full sm:px-3 sm:py-1.5"> {/* Adjusted padding for mobile */}
              <Star className="w-3 h-3 text-level sm:w-4 sm:h-4" /> {/* Adjusted icon size for mobile */}
              <span className="text-xs font-medium text-level sm:text-sm">Nível {xpData?.level || 1}</span> {/* Adjusted text size for mobile */}
            </div>

            <Link to="/">
              <Button variant="outline" size="icon" title="Página inicial" className="w-8 h-8 sm:w-9 sm:h-9"> {/* Adjusted button size for mobile */}
                <Home className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" /> {/* Adjusted icon size for mobile */}
              </Button>
            </Link>
            <Button variant="outline" size="icon" onClick={handleSignOut} title="Sair" className="w-8 h-8 sm:w-9 sm:h-9"> {/* Adjusted button size for mobile */}
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" /> {/* Adjusted icon size for mobile */}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2"> {/* Adjusted text size for mobile */}
            Olá, {profile?.full_name?.split(" ")[0] || "Estudante"}! 👋
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">Continue sua jornada e mantenha seu streak!</p> {/* Adjusted text size for mobile */}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-xp flex items-center justify-center"> {/* Adjusted size for mobile */}
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" /> {/* Adjusted icon size for mobile */}
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">XP Total</p> {/* Adjusted text size for mobile */}
                  <p className="font-display text-xl sm:text-2xl font-bold text-foreground">{currentXp}</p> {/* Adjusted text size for mobile */}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-streak flex items-center justify-center"> {/* Adjusted size for mobile */}
                  <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-white" /> {/* Adjusted icon size for mobile */}
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Streak</p> {/* Adjusted text size for mobile */}
                  <p className="font-display text-xl sm:text-2xl font-bold text-foreground">{streakData?.current_streak || 0} dias</p> {/* Adjusted text size for mobile */}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-accent flex items-center justify-center"> {/* Adjusted size for mobile */}
                  <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" /> {/* Adjusted icon size for mobile */}
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Conquistas</p> {/* Adjusted text size for mobile */}
                  <p className="font-display text-xl sm:text-2xl font-bold text-foreground">{badges.length}</p> {/* Adjusted text size for mobile */}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-primary flex items-center justify-center"> {/* Adjusted size for mobile */}
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" /> {/* Adjusted icon size for mobile */}
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Melhor Streak</p> {/* Adjusted text size for mobile */}
                  <p className="font-display text-xl sm:text-2xl font-bold text-foreground">{streakData?.longest_streak || 0}</p> {/* Adjusted text size for mobile */}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Level Progress */}
        <Card className="glass border-border/50 mb-8">
          <CardContent className="p-4 sm:p-6"> {/* Adjusted padding for mobile */}
            <div className="flex items-center justify-between mb-3 flex-col sm:flex-row"> {/* Adjusted for responsiveness */}
              <div className="flex items-center gap-3 mb-3 sm:mb-0"> {/* Added margin for mobile */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-accent flex items-center justify-center glow-accent"> {/* Adjusted size for mobile */}
                  <span className="font-display text-lg sm:text-xl font-bold text-white">{xpData?.level || 1}</span> {/* Adjusted text size for mobile */}
                </div>
                <div className="text-center sm:text-left"> {/* Adjusted text alignment for mobile */}
                  <p className="font-display text-base sm:text-lg font-semibold text-foreground">Nível {xpData?.level || 1}</p> {/* Adjusted text size for mobile */}
                  <p className="text-xs sm:text-sm text-muted-foreground"> {/* Adjusted text size for mobile */}
                    {(xpData?.level || 1) < 5 ? "Iniciante" : (xpData?.level || 1) < 10 ? "Intermediário" : "Avançado"}
                  </p>
                </div>
              </div>
              <div className="text-center sm:text-right"> {/* Adjusted text alignment for mobile */}
                <p className="text-xs sm:text-sm text-muted-foreground">Próximo nível</p> {/* Adjusted text size for mobile */}
                <p className="font-display text-base sm:text-lg font-semibold text-foreground"> {/* Adjusted text size for mobile */}
                  {500 - (currentXp % 500)} XP restantes
                </p>
              </div>
            </div>
            <Progress value={xpProgress} className="h-3" />
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Badges now takes full width if no missions */}
          <Card className="glass border-border/50 lg:col-span-1">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2 text-lg sm:text-xl"> {/* Adjusted text size for mobile */}
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
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-muted flex items-center justify-center text-xl sm:text-2xl"> {/* Adjusted size for mobile */}
                    {badge.badges?.icon || "🏆"}
                  </div>
                  <div>
                    <p className="font-medium text-sm sm:text-base text-foreground">{badge.badges?.name}</p> {/* Adjusted text size for mobile */}
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
                <p className="text-muted-foreground text-center py-4 text-sm sm:text-base">Complete exercícios para ganhar badges!</p> {/* Adjusted text size for mobile */}
              )}
              <Button variant="ghost" className="w-full mt-2 text-sm sm:text-base"> {/* Adjusted text size for mobile */}
                Ver todas conquistas
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
          {/* Continue Learning section now takes more space */}
          {learningProgress.length > 0 && (
            <Card className="glass border-border/50 lg:col-span-2"> {/* Adjusted col-span */}
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2 text-lg sm:text-xl"> {/* Adjusted text size for mobile */}
                  <BookOpen className="w-5 h-5 text-primary" />
                  Continue Aprendendo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4"> {/* Adjusted grid for 2 columns */}
                  {learningProgress.map((item) => (
                    <div
                      key={item.courseId}
                      className="p-4 rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-muted flex items-center justify-center text-xl sm:text-2xl"> {/* Adjusted size for mobile */}
                          {item.courseImageUrl?.startsWith('http') ? (
                            <img src={item.courseImageUrl} alt={item.courseTitle} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            item.courseImageUrl || "📚"
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm sm:text-base text-foreground">{item.courseTitle}</p> {/* Adjusted text size for mobile */}
                          {item.nextLesson ? (
                            <p className="text-xs sm:text-sm text-muted-foreground">Próxima: {item.nextLesson.title}</p> {/* Adjusted text size for mobile */}
                          ) : (
                            <p className="text-xs sm:text-sm text-muted-foreground">Todas as aulas concluídas!</p> {/* Adjusted text size for mobile */}
                          )}
                        </div>
                      </div>
                      <div className="mb-4">
                        <div className="flex justify-between text-xs sm:text-sm mb-2"> {/* Adjusted text size for mobile */}
                          <span className="text-muted-foreground">Progresso do Curso</span>
                          <span className="font-medium text-foreground">{item.progressPercentage}%</span>
                        </div>
                        <Progress value={item.progressPercentage} className="h-2" />
                      </div>
                      {item.nextLesson ? (
                        <Link to={`/student/lesson/${item.nextLesson.id}`}>
                          <Button className="w-full mt-4 bg-gradient-primary hover:opacity-90 group-hover:glow-primary transition-all text-sm sm:text-base"> {/* Adjusted text size for mobile */}
                            <Play className="w-4 h-4 mr-2" />
                            Continuar Aula
                          </Button>
                        </Link>
                      ) : (
                        <Button disabled className="w-full mt-4 text-sm sm:text-base" variant="outline"> {/* Adjusted text size for mobile */}
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Curso Concluído
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-3 gap-4 mt-6">
          <Link to="/student/classes">
            <Card className="glass border-border/50 hover:border-primary/50 transition-all cursor-pointer group">
              <CardContent className="p-4 sm:p-6"> {/* Adjusted padding for mobile */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-primary flex items-center justify-center"> {/* Adjusted size for mobile */}
                    <Users className="w-6 h-6 sm:w-7 sm:h-7 text-white" /> {/* Adjusted icon size for mobile */}
                  </div>
                  <div>
                    <p className="font-display text-lg sm:text-xl font-bold text-foreground">Explorar Turmas</p> {/* Adjusted text size for mobile */}
                    <p className="text-sm text-muted-foreground">Encontre novas turmas</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/student/my-classes">
            <Card className="glass border-border/50 hover:border-accent/50 transition-all cursor-pointer group">
              <CardContent className="p-4 sm:p-6"> {/* Adjusted padding for mobile */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-accent flex items-center justify-center"> {/* Adjusted size for mobile */}
                    <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-white" /> {/* Adjusted icon size for mobile */}
                  </div>
                  <div>
                    <p className="font-display text-lg sm:text-xl font-bold text-foreground">Minhas Turmas</p> {/* Adjusted text size for mobile */}
                    <p className="text-sm text-muted-foreground">Continue estudando</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/student/certificates">
            <Card className="glass border-border/50 hover:border-xp/50 transition-all cursor-pointer group">
              <CardContent className="p-4 sm:p-6"> {/* Adjusted padding for mobile */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-xp flex items-center justify-center"> {/* Adjusted size for mobile */}
                    <Award className="w-6 h-6 sm:w-7 sm:h-7 text-white" /> {/* Adjusted icon size for mobile */}
                  </div>
                  <div>
                    <p className="font-display text-lg sm:text-xl font-bold text-foreground">Certificados</p> {/* Adjusted text size for mobile */}
                    <p className="text-sm text-muted-foreground">Suas conquistas</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;