import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, FileText, Code2, ChevronRight, LogOut, BarChart3, HelpCircle, UserCog } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const TeacherDashboard = () => {
  const { profile, role, signOut } = useAuth();
  const [stats, setStats] = useState({ lessons: 0, exercises: 0, questions: 0, classes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [lessons, exercises, questions, classes] = await Promise.all([
        supabase.from('lessons').select('*', { count: 'exact', head: true }),
        supabase.from('exercises').select('*', { count: 'exact', head: true }),
        supabase.from('questions').select('*', { count: 'exact', head: true }),
        supabase.from('classes').select('*', { count: 'exact', head: true }),
      ]);
      setStats({
        lessons: lessons.count || 0,
        exercises: exercises.count || 0,
        questions: questions.count || 0,
        classes: classes.count || 0,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const isAdmin = role === 'admin';

  const menuItems = [
    { icon: BookOpen, label: "Aulas", count: stats.lessons, href: "/teacher/lessons", color: "bg-gradient-accent" },
    { icon: FileText, label: "Exercícios", count: stats.exercises, href: "/teacher/exercises", color: "bg-gradient-primary" },
    { icon: HelpCircle, label: "Questões", count: stats.questions, href: "/teacher/questions", color: "bg-gradient-xp" },
  ];

  if (loading) {
    return <div className="min-h-screen bg-background dark flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="min-h-screen bg-background dark">
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Code2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">CodeQuest</span>
            <Badge variant="secondary" className="ml-2 bg-accent/10 text-accent">{isAdmin ? "Admin" : "Professor"}</Badge>
          </Link>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-5 h-5" /></Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Olá, {profile?.full_name?.split(" ")[0]}! 📚</h1>
          <p className="text-muted-foreground">Gerencie conteúdo e acompanhe seus alunos.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {menuItems.map((item) => (
            <Link key={item.href} to={item.href}>
              <Card className="glass border-border/50 hover:border-primary/50 transition-all cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl ${item.color} flex items-center justify-center`}>
                      <item.icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <p className="font-display text-2xl font-bold text-foreground">{item.count}</p>
                      <p className="text-muted-foreground">{item.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {isAdmin && (
          <Card className="glass border-border/50 border-badge-gold/30">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <UserCog className="w-5 h-5 text-badge-gold" />
                Administração
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link to="/teacher/users">
                <Button className="bg-gradient-primary hover:opacity-90">
                  <Users className="w-4 h-4 mr-2" />
                  Gerenciar Usuários
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground mt-2">Cadastre professores e coordenadores</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default TeacherDashboard;
