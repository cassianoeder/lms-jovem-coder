import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  ArrowLeft, Users, Search, Eye, Trash2, Shield, BookOpen, Zap, Trophy, 
  TrendingUp, Code2, Mail, Plus, UserPlus, BarChart3, PieChart, Download,
  Filter, Calendar, User, LogOut
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface CourseProgress {
  id: string;
  title: string;
  total_lessons: number;
  completed_lessons: number;
  total_students: number;
  completion_rate: number;
}

const TeacherDashboard = () => {
  const { user, role, signOut } = useAuth(); // Corrigido: profile para user
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    totalClasses: 0,
    avgCompletionRate: 0,
  });
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
      fetchCourseProgress();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      // Total Students
      const { count: totalStudents, error: studentsError } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student');
      if (studentsError) throw studentsError;

      // Total Courses
      const { count: totalCourses, error: coursesError } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true });
      if (coursesError) throw coursesError;

      // Total Classes
      const { count: totalClasses, error: classesError } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true });
      if (classesError) throw classesError;

      // Average Completion Rate (using RPC)
      const { data: progressStats, error: progressError } = await supabase.rpc('get_course_progress_stats');
      if (progressError) throw progressError;

      const avgCompletionRate = progressStats && progressStats.length > 0
        ? progressStats.reduce((sum: number, cp: CourseProgress) => sum + cp.completion_rate, 0) / progressStats.length
        : 0;

      setStats({
        totalStudents: totalStudents || 0,
        totalCourses: totalCourses || 0,
        totalClasses: totalClasses || 0,
        avgCompletionRate: parseFloat(avgCompletionRate.toFixed(2)),
      });

    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      toast.error("Erro ao carregar estatísticas do dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseProgress = async () => {
    try {
      const { data, error } = await supabase.rpc('get_course_progress_stats');
      if (error) throw error;
      setCourseProgress(data || []);
    } catch (error) {
      console.error("Error fetching course progress:", error);
      toast.error("Erro ao carregar progresso dos cursos.");
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
        <h1 className="text-3xl font-bold font-display text-foreground mb-8">Dashboard do Professor</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card className="glass border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Alunos</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Alunos cadastrados</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Cursos</CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalCourses}</div>
              <p className="text-xs text-muted-foreground">Cursos disponíveis</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Turmas</CardTitle>
              <Shield className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalClasses}</div>
              <p className="text-xs text-muted-foreground">Turmas ativas</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Conclusão Média</CardTitle>
              <PieChart className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.avgCompletionRate}%</div>
              <p className="text-xs text-muted-foreground">Média de todos os cursos</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="glass border-border/50 mb-10">
          <CardHeader>
            <CardTitle className="text-foreground">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/teacher/students">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center glass-button">
                <Users className="h-6 w-6 mb-2 text-primary" />
                <span className="text-foreground">Gerenciar Alunos</span>
              </Button>
            </Link>
            <Link to="/teacher/classes">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center glass-button">
                <Shield className="h-6 w-6 mb-2 text-primary" />
                <span className="text-foreground">Gerenciar Turmas</span>
              </Button>
            </Link>
            <Link to="/teacher/courses">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center glass-button">
                <BookOpen className="h-6 w-6 mb-2 text-primary" />
                <span className="text-foreground">Gerenciar Cursos</span>
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Course Progress Table */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-foreground">Progresso dos Cursos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Curso</TableHead>
                  <TableHead>Lições Concluídas</TableHead>
                  <TableHead>Total de Alunos</TableHead>
                  <TableHead className="text-right">Taxa de Conclusão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courseProgress.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.title}</TableCell>
                    <TableCell>{course.completed_lessons}/{course.total_lessons}</TableCell>
                    <TableCell>{course.total_students}</TableCell>
                    <TableCell className="text-right">{course.completion_rate}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TeacherDashboard;