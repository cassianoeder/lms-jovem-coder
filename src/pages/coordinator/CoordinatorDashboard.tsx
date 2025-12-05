import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Code2,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  LogOut,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  Filter,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CoordinatorDashboard = () => {
  // Mock data
  const overview = {
    totalStudents: 486,
    totalTeachers: 12,
    totalClasses: 24,
    avgEngagement: 73,
    completionRate: 68,
    dropoutRisk: 15,
  };

  const performanceByModule = [
    { name: "Python Básico", avgScore: 82, students: 156, trend: "up" },
    { name: "JavaScript", avgScore: 74, students: 132, trend: "up" },
    { name: "SQL", avgScore: 68, students: 98, trend: "down" },
    { name: "Algoritmos", avgScore: 71, students: 100, trend: "stable" },
  ];

  const atRiskStudents = [
    { id: 1, name: "Carlos Oliveira", class: "Turma A", lastAccess: "7 dias", reason: "Inatividade" },
    { id: 2, name: "Fernanda Lima", class: "Turma B", lastAccess: "5 dias", reason: "Notas baixas" },
    { id: 3, name: "Ricardo Santos", class: "Turma C", lastAccess: "10 dias", reason: "Inatividade" },
  ];

  const topPerformers = [
    { id: 1, name: "Maria Silva", xp: 4520, level: 18, streak: 45 },
    { id: 2, name: "João Costa", xp: 4280, level: 17, streak: 32 },
    { id: 3, name: "Ana Santos", xp: 4150, level: 16, streak: 28 },
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
            <Badge variant="secondary" className="ml-2 bg-level/10 text-level">Coordenação</Badge>
          </Link>

          <div className="flex items-center gap-4">
            <Select defaultValue="month">
              <SelectTrigger className="w-[140px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Esta Semana</SelectItem>
                <SelectItem value="month">Este Mês</SelectItem>
                <SelectItem value="quarter">Trimestre</SelectItem>
                <SelectItem value="year">Este Ano</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon">
              <Download className="w-4 h-4" />
            </Button>

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
              Painel da Coordenação 📊
            </h1>
            <p className="text-muted-foreground">Visão geral do desempenho e métricas da plataforma.</p>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
            <Button className="bg-gradient-primary hover:opacity-90">
              <Download className="w-4 h-4 mr-2" />
              Exportar Relatório
            </Button>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <Card className="glass border-border/50">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="font-display text-2xl font-bold text-foreground">{overview.totalStudents}</p>
              <p className="text-sm text-muted-foreground">Alunos</p>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardContent className="p-4 text-center">
              <BookOpen className="w-8 h-8 text-accent mx-auto mb-2" />
              <p className="font-display text-2xl font-bold text-foreground">{overview.totalTeachers}</p>
              <p className="text-sm text-muted-foreground">Professores</p>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardContent className="p-4 text-center">
              <BarChart3 className="w-8 h-8 text-info mx-auto mb-2" />
              <p className="font-display text-2xl font-bold text-foreground">{overview.totalClasses}</p>
              <p className="text-sm text-muted-foreground">Turmas</p>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 text-success mx-auto mb-2" />
              <p className="font-display text-2xl font-bold text-foreground">{overview.avgEngagement}%</p>
              <p className="text-sm text-muted-foreground">Engajamento</p>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 text-xp mx-auto mb-2" />
              <p className="font-display text-2xl font-bold text-foreground">{overview.completionRate}%</p>
              <p className="text-sm text-muted-foreground">Conclusão</p>
            </CardContent>
          </Card>

          <Card className="glass border-border/50 border-destructive/30">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
              <p className="font-display text-2xl font-bold text-destructive">{overview.dropoutRisk}</p>
              <p className="text-sm text-muted-foreground">Risco Evasão</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Performance by Module */}
          <Card className="glass border-border/50 lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display flex items-center gap-2">
                <PieChart className="w-5 h-5 text-primary" />
                Desempenho por Módulo
              </CardTitle>
              <Button variant="ghost" size="sm">
                Ver detalhes
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceByModule.map((module) => (
                  <div key={module.name} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-foreground">{module.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{module.students} alunos</span>
                          {module.trend === "up" ? (
                            <TrendingUp className="w-4 h-4 text-success" />
                          ) : module.trend === "down" ? (
                            <TrendingDown className="w-4 h-4 text-destructive" />
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              module.avgScore >= 80
                                ? "bg-gradient-primary"
                                : module.avgScore >= 70
                                ? "bg-gradient-xp"
                                : "bg-gradient-streak"
                            }`}
                            style={{ width: `${module.avgScore}%` }}
                          />
                        </div>
                        <span className="font-display text-lg font-bold text-foreground w-14 text-right">
                          {module.avgScore}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-xp" />
                Top Alunos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topPerformers.map((student, index) => (
                <div
                  key={student.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0
                        ? "bg-badge-gold"
                        : index === 1
                        ? "bg-badge-silver"
                        : "bg-badge-bronze"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{student.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Nível {student.level} • {student.streak} dias streak
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-xp/10 text-xp">
                    {student.xp} XP
                  </Badge>
                </div>
              ))}
              <Button variant="ghost" className="w-full mt-2">
                Ver ranking completo
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* At Risk Students */}
        <Card className="glass border-border/50 border-destructive/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Alunos em Risco de Evasão
            </CardTitle>
            <Badge variant="destructive">{atRiskStudents.length} alunos</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {atRiskStudents.map((student) => (
                <div
                  key={student.id}
                  className="p-4 rounded-xl bg-destructive/5 border border-destructive/20"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium text-foreground">{student.name}</p>
                      <p className="text-sm text-muted-foreground">{student.class}</p>
                    </div>
                    <Badge variant="secondary" className="bg-destructive/10 text-destructive">
                      {student.reason}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Último acesso: {student.lastAccess}
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    Enviar Mensagem
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

export default CoordinatorDashboard;
