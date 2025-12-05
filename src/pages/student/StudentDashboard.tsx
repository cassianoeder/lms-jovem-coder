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
} from "lucide-react";

const StudentDashboard = () => {
  // Mock data - will be replaced with real data from Supabase
  const userData = {
    name: "João Silva",
    level: 12,
    xp: 2450,
    xpToNext: 3000,
    streak: 7,
    totalBadges: 15,
    ranking: 42,
  };

  const dailyMissions = [
    { id: 1, title: "Complete 3 exercícios", progress: 2, total: 3, xp: 50 },
    { id: 2, title: "Assista 1 aula", progress: 1, total: 1, xp: 30, completed: true },
    { id: 3, title: "Acerte 5 questões seguidas", progress: 3, total: 5, xp: 100 },
  ];

  const recentBadges = [
    { id: 1, name: "Primeira Semana", icon: "🎯", rarity: "common" },
    { id: 2, name: "Streak de 7 dias", icon: "🔥", rarity: "rare" },
    { id: 3, name: "Mestre Python", icon: "🐍", rarity: "epic" },
  ];

  const continueLearning = [
    { id: 1, title: "Python Básico", progress: 75, lessons: 12, image: "🐍" },
    { id: 2, title: "JavaScript Fundamentos", progress: 45, lessons: 15, image: "💛" },
    { id: 3, title: "SQL para Iniciantes", progress: 20, lessons: 10, image: "🗃️" },
  ];

  return (
    <div className="min-h-screen bg-background dark">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Code2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">CodeQuest</span>
          </Link>

          <div className="flex items-center gap-4">
            {/* XP Display */}
            <div className="hidden sm:flex items-center gap-2 bg-xp/10 px-3 py-1.5 rounded-full">
              <Zap className="w-4 h-4 text-xp" />
              <span className="text-sm font-medium text-xp">{userData.xp} XP</span>
            </div>

            {/* Streak Display */}
            <div className="hidden sm:flex items-center gap-2 bg-streak/10 px-3 py-1.5 rounded-full">
              <Flame className="w-4 h-4 text-streak" />
              <span className="text-sm font-medium text-streak">{userData.streak} dias</span>
            </div>

            {/* Level */}
            <div className="flex items-center gap-2 bg-level/10 px-3 py-1.5 rounded-full">
              <Star className="w-4 h-4 text-level" />
              <span className="text-sm font-medium text-level">Nível {userData.level}</span>
            </div>

            <Link to="/">
              <Button variant="ghost" size="icon">
                <LogOut className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Olá, {userData.name.split(" ")[0]}! 👋
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
                  <p className="font-display text-2xl font-bold text-foreground">{userData.xp}</p>
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
                  <p className="font-display text-2xl font-bold text-foreground">{userData.streak} dias</p>
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
                  <p className="font-display text-2xl font-bold text-foreground">{userData.totalBadges}</p>
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
                  <p className="text-sm text-muted-foreground">Ranking</p>
                  <p className="font-display text-2xl font-bold text-foreground">#{userData.ranking}</p>
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
                  <span className="font-display text-xl font-bold text-white">{userData.level}</span>
                </div>
                <div>
                  <p className="font-display text-lg font-semibold text-foreground">Nível {userData.level}</p>
                  <p className="text-sm text-muted-foreground">Desenvolvedor Intermediário</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Próximo nível</p>
                <p className="font-display text-lg font-semibold text-foreground">
                  {userData.xpToNext - userData.xp} XP restantes
                </p>
              </div>
            </div>
            <Progress value={(userData.xp / userData.xpToNext) * 100} className="h-3" />
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
              {dailyMissions.map((mission) => (
                <div
                  key={mission.id}
                  className={`p-4 rounded-xl border ${
                    mission.completed ? "bg-primary/5 border-primary/20" : "bg-card border-border/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {mission.completed ? (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-white text-sm">✓</span>
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-muted-foreground text-sm">
                            {mission.progress}/{mission.total}
                          </span>
                        </div>
                      )}
                      <span className={`font-medium ${mission.completed ? "text-primary" : "text-foreground"}`}>
                        {mission.title}
                      </span>
                    </div>
                    <Badge variant="secondary" className="bg-xp/10 text-xp">
                      +{mission.xp} XP
                    </Badge>
                  </div>
                  {!mission.completed && (
                    <Progress value={(mission.progress / mission.total) * 100} className="h-2" />
                  )}
                </div>
              ))}
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
              {recentBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50"
                >
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl">
                    {badge.icon}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{badge.name}</p>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        badge.rarity === "epic"
                          ? "bg-level/10 text-level"
                          : badge.rarity === "rare"
                          ? "bg-info/10 text-info"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {badge.rarity === "epic" ? "Épico" : badge.rarity === "rare" ? "Raro" : "Comum"}
                    </Badge>
                  </div>
                </div>
              ))}
              <Button variant="ghost" className="w-full mt-2">
                Ver todas conquistas
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Continue Learning */}
        <Card className="glass border-border/50 mt-6">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Continue Aprendendo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {continueLearning.map((course) => (
                <div
                  key={course.id}
                  className="p-4 rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl">
                      {course.image}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{course.title}</p>
                      <p className="text-sm text-muted-foreground">{course.lessons} aulas</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="text-foreground font-medium">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                  </div>
                  <Button className="w-full mt-4 bg-gradient-primary hover:opacity-90 group-hover:glow-primary transition-all">
                    <Play className="w-4 h-4 mr-2" />
                    Continuar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StudentDashboard;
