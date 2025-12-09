import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, FileText, Code2, ChevronRight, LogOut, UserCog, GraduationCap, Layers, School, Settings, Award, Home } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const TeacherDashboard = () => {
  const { profile, role, signOut } = useAuth();
  const [stats, setStats] = useState({ lessons: 0, exercises: 0, classes: 0, courses: 0, modules: 0, pendingRequests: 0, students: 0 });
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
      setLoading(false);
    };
    fetchStats();
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
              <span className="font-display text-lg font-bold text-foreground hidden sm:inline">JovemCoder</span> {/* Hidden on small screens */}
            </Link>
            <Badge variant="secondary" className="bg-accent/10 text-accent">
              {isAdmin ? "Admin" : "Professor"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="outline" size="icon" title="Página inicial" className="w-8 h-8 sm:w-9 sm:h-9"> {/* Adjusted button size for mobile */}
                <Home className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" /> {/* Adjusted icon size for mobile */}
              </Button>
            </Link>
            <Button variant="outline" size="icon" onClick={signOut} title="Sair" className="w-8 h-8 sm:w-9 sm:h-9"> {/* Adjusted button size for mobile */}
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" /> {/* Adjusted icon size for mobile */}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2"> {/* Adjusted text size for mobile */}
            Olá, {profile?.full_name?.split(" ")[0]}! 📚
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gerencie conteúdo e acompanhe seus alunos.</p> {/* Adjusted text size for mobile */}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"> {/* Adjusted grid for responsiveness */}
          {menuItems.map((item) => (
            <Link key={item.href} to={item.href}>
              <Card className="glass border-border/50 hover:border-primary/50 transition-all cursor-pointer group">
                <CardContent className="p-4 sm:p-6"> {/* Adjusted padding for mobile */}
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${item.color} flex items-center justify-center relative`}> {/* Adjusted size for mobile */}
                      <item.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" /> {/* Adjusted icon size for mobile */}
                      {item.badge && (
                        <span className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center"> {/* Adjusted size for mobile */}
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-display text-xl sm:text-2xl font-bold text-foreground">{item.count}</p> {/* Adjusted text size for mobile */}
                      <p className="text-sm sm:text-base text-muted-foreground">{item.label}</p> {/* Adjusted text size for mobile */}
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"> {/* Adjusted grid for responsiveness */}
          {/* Gerenciar Alunos */}
          <Link to="/teacher/students">
            <Card className="glass border-border/50 hover:border-primary/50 transition-all cursor-pointer group">
              <CardContent className="p-4 sm:p-6"> {/* Adjusted padding for mobile */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-primary flex items-center justify-center"> {/* Adjusted size for mobile */}
                    <Users className="w-6 h-6 sm:w-7 sm:h-7 text-white" /> {/* Adjusted icon size for mobile */}
                  </div>
                  <div>
                    <p className="font-display text-xl sm:text-2xl font-bold text-foreground">{stats.students}</p> {/* Adjusted text size for mobile */}
                    <p className="text-sm sm:text-base text-muted-foreground">Alunos</p> {/* Adjusted text size for mobile */}
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
                <CardContent className="p-4 sm:p-6"> {/* Adjusted padding for mobile */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-xp flex items-center justify-center"> {/* Adjusted size for mobile */}
                      <UserCog className="w-6 h-6 sm:w-7 sm:h-7 text-white" /> {/* Adjusted icon size for mobile */}
                    </div>
                    <div>
                      <p className="font-display text-xl sm:text-2xl font-bold text-foreground">Gerenciar</p> {/* Adjusted text size for mobile */}
                      <p className="text-sm sm:text-base text-muted-foreground">Usuários</p> {/* Adjusted text size for mobile */}
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          <Card className="glass border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="font-display flex items-center gap-2 text-base sm:text-lg"> {/* Adjusted text size for mobile */}
                <Settings className="w-5 h-5 text-accent" />
                Configurações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link to="/teacher/settings">
                <Button variant="outline" className="w-full justify-between text-sm sm:text-base"> {/* Adjusted text size for mobile */}
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