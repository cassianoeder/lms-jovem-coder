import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, BookOpen, FileText, Code2, ChevronRight, LogOut, UserCog, 
  GraduationCap, Layers, School, Settings, Award, Home, BarChart3, 
  PieChart, Calendar, Download, Filter, TrendingUp, Zap, CheckCircle 
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface TopStudent {
  user_id: string;
  total_xp: number;
  level: number;
}

interface Course {
  id: string;
  title: string;
}

const TeacherDashboard = () => {
  const { profile, role, signOut } = useAuth();
  const [stats, setStats] = useState({
    lessons: 0,
    exercises: 0,
    classes: 0,
    courses: 0,
    modules: 0,
    pendingRequests: 0,
    students: 0
  });
  
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const [totalClasses, setTotalClasses] = useState(0);
  const [courses, setCourses] = useState<Course[]>([]);
  const [topStudents, setTopStudents] = useState<TopStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [lessons, exercises, classes, courses, modules, requests, students] = await Promise.all([
        supabase.from('lessons').select('*', { count: 'exact', head: true }),
        supabase.from('exercises').select('*', { count: 'exact', head: true }),
        supabase.from('classes').select('*', { count: 'exact', head: true }),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('modules').select('*', { count: 'exact', head: true }),
        supabase.from('enrollment_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
      ]);

      setStats({
        lessons: lessons.count || 0,
        exercises: exercises.count || 0,
        classes: classes.count || 0,
        courses: courses.count || 0,
        modules: modules.count || 0,
        pendingRequests: requests.count || 0,
        students: students.count || 0,
      });
    };

    const fetchData = async () => {
      try {
        // Count students
        const { count: studentCount } = await supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'student');
        setTotalStudents(studentCount || 0);

        // Count teachers
        const { count: teacherCount } = await supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'teacher');
        setTotalTeachers(teacherCount || 0);

        // Count classes
        const { count: classCount } = await supabase
          .from('classes')
          .select('*', { count: 'exact', head: true });
        setTotalClasses(classCount || 0);

        // Fetch courses
        const { data: coursesData } = await supabase
          .from('courses')
          .select('id, title')
          .order('order_index');
        setCourses(coursesData || []);

        // Fetch top students by XP
        const { data: topStudentsData } = await supabase
          .from('student_xp')
          .select('user_id, total_xp, level')
          .order('total_xp', { ascending: false })
          .limit(5);
        setTopStudents(topStudentsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    fetchData();
  }, []);

  const isAdmin = role === 'admin';

  const menuItems = [
    { icon: School, label: "Turmas", count: stats.classes, href: "/teacher/classes", color: "bg-gradient-primary", badge: stats.pendingRequests > 0 ? stats.pendingRequests : null },
    { icon: GraduationCap, label: "Cursos", count: stats.courses, href: "/teacher/courses", color: "bg-gradient-xp" },
    { icon: Layers, label: "Módulos", count: stats.modules, href: "/teacher/modules", color: "bg-gradient-accent" },
    { icon: BookOpen, label: "Aulas", count: stats.lessons, href: "/teacher/lessons", color: "bg-gradient-streak" },
    { icon: FileText, label: "Exercícios", count: stats.exercises, href: "/teacher/exercises", color: "bg-gradient-level" },
  ];

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
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Code2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold text-foreground">JovemCoder</span>
            </Link>
            <Badge variant="secondary" className="bg-accent/10 text-accent">
              {isAdmin ? "Administrador" : "Professor"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="outline" size="icon" title="Página inicial">
                <Home className="w-5 h-5 text-foreground" />
              </Button>
            </Link>
            <Button variant="outline" size="icon" onClick={signOut} title="Sair">
              <LogOut className="w-5 h-5 text-foreground" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Olá, {profile?.full_name?.split(" ")[0]}! 📊
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="glass border-border/50">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="font-display text-2xl font-bold text-foreground">{totalStudents}</p>
              <p className="text-sm text-muted-foreground">Alunos</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="p-4 text-center">
              <BookOpen className="w-8 h-8 text-accent mx-auto mb-2" />
              <p className="font-display text-2xl font-bold text-foreground">{totalTeachers}</p>
              <p className="text-sm text-muted-foreground">Professores</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="p-4 text-center">
              <BarChart3 className="w-8 h-8 text-info mx-auto mb-2" />
              <p className="font-display text-2xl font-bold text-foreground">{totalClasses}</p>
              <p className="text-sm text-muted-foreground">Turmas</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 text-success mx-auto mb-2" />
              <p className="font-display text-2xl font-bold text-foreground">{courses.length}</p>
              <p className="text-sm text-muted-foreground">Cursos</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Courses Overview */}
          <Card className="glass border-border/50 lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display flex items-center gap-2">
                <PieChart className="w-5 h-5 text-primary" />
                Cursos Disponíveis
              </CardTitle>
              <Button variant="ghost" size="sm">
                Ver detalhes
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courses.map((course) => (
                  <div key={course.id} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{course.title}</p>
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      Ativo
                    </Badge>
                  </div>
                ))}
                {courses.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">Nenhum curso cadastrado</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Students */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-xp" />
                Top Alunos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topStudents.length > 0 ? topStudents.map((student, index) => (
                <div key={student.user_id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                    index === 0 ? "bg-badge-gold" : 
                    index === 1 ? "bg-badge-silver" : 
                    index === 2 ? "bg-badge-bronze" : "bg-muted"
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Aluno #{index + 1}</p>
                    <p className="text-xs text-muted-foreground">
                      Nível {student.level}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-xp/10 text-xp">
                    {student.total_xp} XP
                  </Badge>
                </div>
              )) : (
                <p className="text-muted-foreground text-center py-4">Nenhum aluno cadastrado</p>
              )}
              <Button variant="ghost" className="w-full mt-2">
                Ver ranking completo
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {menuItems.map((item) => (
            <Link key={item.href} to={item.href}>
              <Card className="glass border-border/50 hover:border-primary/50 transition-all cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl ${item.color} flex items-center justify-center relative`}>
                      <item.icon className="w-7 h-7 text-white" />
                      {item.badge && (
                        <span className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-display text-2xl font-bold text-foreground">{item.count}</p>
                      <p className="text-muted-foreground">{item.label}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Gerenciar Alunos */}
          <Link to="/teacher/students">
            <Card className="glass border-border/50 hover:border-primary/50 transition-all cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="font-display text-2xl font-bold text-foreground">{stats.students}</p>
                    <p className="text-muted-foreground">Alunos</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Gerenciar Usuários (Apenas Admin) */}
          {isAdmin && (
            <Link to="/teacher/users">
              <Card className="glass border-border/50 border-badge-gold/30 hover:border-badge-gold/50 transition-all cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-xp flex items-center justify-center">
                      <UserCog className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <p className="font-display text-2xl font-bold text-foreground">Gerenciar</p>
                      <p className="text-muted-foreground">Usuários</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Configurações */}
          <Card className="glass border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="font-display flex items-center gap-2 text-base">
                <Settings className="w-5 h-5 text-accent" />
                Configurações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link to="/teacher/settings">
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Certificados e Plataforma
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground mt-2">Configure certificados e dados da empresa</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;