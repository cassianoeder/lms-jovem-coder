import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  BookOpen,
  FileText,
  Trophy,
  Code2,
  Plus,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  LogOut,
  BarChart3,
} from "lucide-react";

const TeacherDashboard = () => {
  // Mock data
  const stats = {
    totalStudents: 156,
    totalClasses: 8,
    pendingCorrections: 23,
    avgPerformance: 78,
  };

  const recentActivities = [
    { id: 1, type: "submission", student: "Maria Santos", activity: "Exercício Python #12", time: "2 min atrás" },
    { id: 2, type: "completion", student: "João Silva", activity: "Módulo JavaScript", time: "15 min atrás" },
    { id: 3, type: "submission", student: "Ana Costa", activity: "Prova SQL", time: "1 hora atrás" },
    { id: 4, type: "badge", student: "Pedro Lima", activity: "Conquistou badge 'Mestre Python'", time: "2 horas atrás" },
  ];

  const classes = [
    { id: 1, name: "Turma A - Python", students: 32, avgProgress: 68 },
    { id: 2, name: "Turma B - JavaScript", students: 28, avgProgress: 54 },
    { id: 3, name: "Turma C - SQL", students: 24, avgProgress: 82 },
  ];

  const quickActions = [
    { icon: FileText, label: "Nova Questão", color: "bg-gradient-primary" },
    { icon: BookOpen, label: "Nova Aula", color: "bg-gradient-accent" },
    { icon: Trophy, label: "Novo Desafio", color: "bg-gradient-xp" },
    { icon: Users, label: "Nova Turma", color: "bg-gradient-streak" },
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
            <Badge variant="secondary" className="ml-2 bg-accent/10 text-accent">Professor</Badge>
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-destructive/10 px-3 py-1.5 rounded-full">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">{stats.pendingCorrections} pendentes</span>
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Painel do Professor 📚
            </h1>
            <p className="text-muted-foreground">Gerencie suas turmas e acompanhe o progresso dos alunos.</p>
          </div>
          <Button className="mt-4 sm:mt-0 bg-gradient-primary hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Criar Conteúdo
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickActions.map((action, index) => (
            <button
              key={index}
              className="p-4 rounded-xl glass border-border/50 hover:scale-105 transition-transform flex flex-col items-center gap-3"
            >
              <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <span className="font-medium text-foreground">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Alunos</p>
                  <p className="font-display text-2xl font-bold text-foreground">{stats.totalStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-accent flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Turmas Ativas</p>
                  <p className="font-display text-2xl font-bold text-foreground">{stats.totalClasses}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-streak flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Correções</p>
                  <p className="font-display text-2xl font-bold text-foreground">{stats.pendingCorrections}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-xp flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Média Geral</p>
                  <p className="font-display text-2xl font-bold text-foreground">{stats.avgPerformance}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Activities */}
          <Card className="glass border-border/50 lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Atividades Recentes
              </CardTitle>
              <Button variant="ghost" size="sm">
                Ver todas
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 p-3 rounded-xl bg-card border border-border/50"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activity.type === "submission"
                        ? "bg-info/10"
                        : activity.type === "completion"
                        ? "bg-success/10"
                        : "bg-xp/10"
                    }`}
                  >
                    {activity.type === "submission" ? (
                      <FileText className="w-5 h-5 text-info" />
                    ) : activity.type === "completion" ? (
                      <CheckCircle className="w-5 h-5 text-success" />
                    ) : (
                      <Trophy className="w-5 h-5 text-xp" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{activity.student}</p>
                    <p className="text-sm text-muted-foreground">{activity.activity}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Classes Overview */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Minhas Turmas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className="p-4 rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-foreground">{cls.name}</p>
                    <Badge variant="secondary" className="bg-muted">
                      {cls.students} alunos
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-primary rounded-full"
                        style={{ width: `${cls.avgProgress}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground">{cls.avgProgress}%</span>
                  </div>
                </div>
              ))}
              <Button variant="ghost" className="w-full mt-2">
                <Plus className="w-4 h-4 mr-2" />
                Nova Turma
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;
