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
  Filter, Calendar, User
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Student {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
  role?: string;
  total_xp?: number;
  level?: number;
  current_streak?: number;
  enrollments_count?: number;
}

interface StudentDetail {
  user_id: string;
  full_name: string;
  total_xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  badges_count: number;
  completed_lessons: number;
  completed_exercises: number;
  enrollments: { class_name: string; course_titles: string[] }[];
}

interface XpData {
  user_id: string;
  total_xp: number;
  level: number;
}

interface StreakData {
  user_id: string;
  current_streak: number;
}

interface Class {
  id: string;
  name: string;
}

interface StudentStats {
  total_students: number;
  active_students: number;
  inactive_students: number;
  avg_xp: number;
  top_level: number;
}

const ManageStudents = () => {
  const { role } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [createStudentDialogOpen, setCreateStudentDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudentForEnroll, setSelectedStudentForEnroll] = useState<Student | null>(null);
  const [stats, setStats] = useState<StudentStats>({
    total_students: 0,
    active_students: 0,
    inactive_students: 0,
    avg_xp: 0,
    top_level: 0
  });

  // Form states for creating new student
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentPassword, setNewStudentPassword] = useState("");

  useEffect(() => {
    fetchStudents();
    fetchClasses();
    fetchStudentStats();
  }, []);

  const fetchClasses = async () => {
    const { data } = await supabase.from('classes').select('id, name').order('name');
    if (data) setClasses(data);
  };

  const fetchStudentStats = async () => {
    try {
      // Total students
      const { count: totalStudents } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student');

      // Active students (with recent activity)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const { count: activeStudents } = await supabase
        .from('student_progress')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', oneWeekAgo.toISOString())
        .neq('lesson_id', null);

      // Average XP
      const { data: xpData } = await supabase
        .from('student_xp')
        .select('total_xp');
      
      const avgXp = xpData && xpData.length > 0 
        ? Math.round(xpData.reduce((sum, student) => sum + (student.total_xp || 0), 0) / xpData.length)
        : 0;

      // Top level
      const { data: levelData } = await supabase
        .from('student_xp')
        .select('level')
        .order('level', { ascending: false })
        .limit(1);
      
      const topLevel = levelData && levelData.length > 0 ? levelData[0].level || 1 : 1;

      setStats({
        total_students: totalStudents || 0,
        active_students: activeStudents || 0,
        inactive_students: (totalStudents || 0) - (activeStudents || 0),
        avg_xp: avgXp,
        top_level: topLevel
      });
    } catch (error) {
      console.error('Error fetching student stats:', error);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    const { data: studentRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'student');

    if (!studentRoles || studentRoles.length === 0) {
      setStudents([]);
      setLoading(false);
      return;
    }

    const studentIds = studentRoles.map(r => r.user_id);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url, created_at');

    const { data: xpData } = await supabase
      .from('student_xp')
      .select('user_id, total_xp, level')
      .in('user_id', studentIds);

    const { data: streaks } = await supabase
      .from('streaks')
      .select('user_id, current_streak')
      .in('user_id', studentIds);

    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('student_id')
      .eq('status', 'approved')
      .in('student_id', studentIds);

    const xpMap = new Map<string, { total_xp: number; level: number }>();
    if (xpData) {
      xpData.forEach(x => {
        xpMap.set(x.user_id, { total_xp: x.total_xp || 0, level: x.level || 1 });
      });
    }

    const streakMap = new Map<string, { current_streak: number }>();
    if (streaks) {
      streaks.forEach(s => {
        streakMap.set(s.user_id, { current_streak: s.current_streak || 0 });
      });
    }

    const enrollmentCounts: Record<string, number> = {};
    if (enrollments) {
      enrollments.forEach(e => {
        enrollmentCounts[e.student_id] = (enrollmentCounts[e.student_id] || 0) + 1;
      });
    }

    const studentsData: Student[] = (profiles || []).map(p => ({
      ...p,
      role: 'student',
      total_xp: xpMap.get(p.user_id)?.total_xp || 0,
      level: xpMap.get(p.user_id)?.level || 1,
      current_streak: streakMap.get(p.user_id)?.current_streak || 0,
      enrollments_count: enrollmentCounts[p.user_id] || 0,
    }));

    setStudents(studentsData);
    setLoading(false);
  };

  const viewStudentDetails = async (student: Student) => {
    const { data: xp } = await supabase
      .from('student_xp')
      .select('total_xp, level')
      .eq('user_id', student.user_id)
      .maybeSingle();

    const { data: streak } = await supabase
      .from('streaks')
      .select('current_streak, longest_streak')
      .eq('user_id', student.user_id)
      .maybeSingle();

    const { count: badgesCount } = await supabase
      .from('student_badges')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', student.user_id);

    const { count: completedLessons } = await supabase
      .from('student_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', student.user_id)
      .eq('completed', true)
      .not('lesson_id', 'is', null);

    const { count: completedExercises } = await supabase
      .from('student_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', student.user_id)
      .eq('completed', true)
      .not('exercise_id', 'is', null);

    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('class_id, classes(name)')
      .eq('student_id', student.user_id)
      .eq('status', 'approved');

    const enrollmentDetails: { class_name: string; course_titles: string[] }[] = [];
    for (const e of enrollments || []) {
      const cls = (e as any).classes;
      const { data: classCourses } = await supabase
        .from('class_courses')
        .select('courses(title)')
        .eq('class_id', e.class_id);
      
      enrollmentDetails.push({
        class_name: cls?.name || 'Turma',
        course_titles: (classCourses || []).map((cc: any) => cc.courses?.title).filter(Boolean),
      });
    }

    setSelectedStudent({
      user_id: student.user_id,
      full_name: student.full_name,
      total_xp: xp?.total_xp || 0,
      level: xp?.level || 1,
      current_streak: streak?.current_streak || 0,
      longest_streak: streak?.longest_streak || 0,
      badges_count: badgesCount || 0,
      completed_lessons: completedLessons || 0,
      completed_exercises: completedExercises || 0,
      enrollments: enrollmentDetails,
    });

    setDetailDialogOpen(true);
  };

  const handleEnrollStudent = async (student: Student) => {
    setSelectedStudentForEnroll(student);
    setEnrollDialogOpen(true);
  };

  const confirmEnrollment = async () => {
    if (!selectedStudentForEnroll || !selectedClass) return;

    try {
      const { error } = await supabase.rpc('admin_enroll_user', {
        p_user_id: selectedStudentForEnroll.user_id,
        p_class_id: selectedClass,
        p_status: 'approved'
      });

      if (error) throw error;

      toast.success("Aluno matriculado na turma com sucesso!");
      setEnrollDialogOpen(false);
      setSelectedStudentForEnroll(null);
      setSelectedClass("");
      fetchStudents();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const deleteStudent = async (userId: string) => {
    if (!confirm("Tem certeza que deseja remover este aluno? Esta ação é irreversível.")) return;

    try {
      // Delete all related data
      await supabase.from('enrollments').delete().eq('student_id', userId);
      await supabase.from('enrollment_requests').delete().eq('student_id', userId);
      await supabase.from('student_progress').delete().eq('user_id', userId);
      await supabase.from('student_badges').delete().eq('user_id', userId);
      await supabase.from('student_missions').delete().eq('user_id', userId);
      await supabase.from('student_xp').delete().eq('user_id', userId);
      await supabase.from('streaks').delete().eq('user_id', userId);
      await supabase.from('user_roles').delete().eq('user_id', userId);
      await supabase.from('profiles').delete().eq('user_id', userId);
      
      // Delete auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) throw authError;

      toast.success("Aluno removido com sucesso");
      fetchStudents();
    } catch (error: any) {
      console.error('Error deleting student:', error);
      toast.error("Erro ao remover aluno: " + error.message);
    }
  };

  const handleCreateStudent = async () => {
    if (!newStudentName || !newStudentEmail || !newStudentPassword) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (newStudentPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newStudentEmail,
        password: newStudentPassword,
        email_confirm: true,
        user_metadata: {
          full_name: newStudentName
        }
      });

      if (authError) throw authError;

      const userId = authData.user.id;

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          full_name: newStudentName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      // Create user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'student',
          created_at: new Date().toISOString()
        });

      if (roleError) throw roleError;

      // Create initial XP record
      const { error: xpError } = await supabase
        .from('student_xp')
        .insert({
          user_id: userId,
          total_xp: 0,
          level: 1,
          updated_at: new Date().toISOString()
        });

      if (xpError) throw xpError;

      // Create initial streak record
      const { error: streakError } = await supabase
        .from('streaks')
        .insert({
          user_id: userId,
          current_streak: 0,
          longest_streak: 0,
          updated_at: new Date().toISOString()
        });

      if (streakError) throw streakError;

      toast.success("Aluno criado com sucesso!");
      setCreateStudentDialogOpen(false);
      resetCreateStudentForm();
      fetchStudents();
    } catch (error: any) {
      console.error('Error creating student:', error);
      toast.error("Erro ao criar aluno: " + error.message);
    }
  };

  const resetCreateStudentForm = () => {
    setNewStudentName("");
    setNewStudentEmail("");
    setNewStudentPassword("");
  };

  const filteredStudents = students.filter(s => 
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <Link to="/teacher">
              <Button variant="outline" size="icon"><ArrowLeft className="w-5 h-5 text-foreground" /></Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Code2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold text-foreground">Gerenciar Alunos</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Student Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="glass border-border/50">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="font-display text-2xl font-bold text-foreground">{stats.total_students}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 text-success mx-auto mb-2" />
              <p className="font-display text-2xl font-bold text-foreground">{stats.active_students}</p>
              <p className="text-sm text-muted-foreground">Ativos</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="p-4 text-center">
              <BarChart3 className="w-8 h-8 text-warning mx-auto mb-2" />
              <p className="font-display text-2xl font-bold text-foreground">{stats.inactive_students}</p>
              <p className="text-sm text-muted-foreground">Inativos</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="p-4 text-center">
              <Zap className="w-8 h-8 text-xp mx-auto mb-2" />
              <p className="font-display text-2xl font-bold text-foreground">{stats.avg_xp}</p>
              <p className="text-sm text-muted-foreground">Média XP</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="p-4 text-center">
              <Trophy className="w-8 h-8 text-level mx-auto mb-2" />
              <p className="font-display text-2xl font-bold text-foreground">{stats.top_level}</p>
              <p className="text-sm text-muted-foreground">Nível Máx.</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar aluno por nome..." 
              className="pl-10" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button className="bg-gradient-primary hover:opacity-90">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button 
            className="bg-gradient-primary hover:opacity-90"
            onClick={() => setCreateStudentDialogOpen(true)}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Novo Aluno
          </Button>
        </div>

        {filteredStudents.length === 0 ? (
          <Card className="glass border-border/50">
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "Nenhum aluno encontrado" : "Nenhum aluno cadastrado ainda"}
              </p>
              <Button 
                className="mt-4 bg-gradient-primary"
                onClick={() => setCreateStudentDialogOpen(true)}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Criar Primeiro Aluno
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass border-border/50">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead>XP</TableHead>
                  <TableHead>Streak</TableHead>
                  <TableHead>Turmas</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="font-medium text-primary">
                            {student.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{student.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Desde {new Date(student.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-level/10 text-level">
                        Nível {student.level || 1}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-xp">
                        <Zap className="w-4 h-4" />
                        {student.total_xp || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-streak">{student.current_streak || 0} dias</span>
                    </TableCell>
                    <TableCell>{student.enrollments_count || 0}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => viewStudentDetails(student)}>
                        <Eye className="w-4 h-4 mr-1" />Detalhes
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEnrollStudent(student)}>
                        <Plus className="w-4 h-4 mr-1" />Turma
                      </Button>
                      {role === 'admin' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-destructive" 
                          onClick={() => deleteStudent(student.user_id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </main>

      {/* Dialog para detalhes do aluno */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              {selectedStudent?.full_name}
            </DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Nível</p>
                  <p className="font-display text-xl font-bold text-foreground">{selectedStudent.level}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">XP Total</p>
                  <p className="font-display text-xl font-bold text-xp">{selectedStudent.total_xp}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Streak Atual</p>
                  <p className="font-display text-xl font-bold text-streak">{selectedStudent.current_streak} dias</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Maior Streak</p>
                  <p className="font-display text-xl font-bold text-foreground">{selectedStudent.longest_streak} dias</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <Trophy className="w-5 h-5 text-badge-gold mx-auto mb-1" />
                  <p className="font-bold text-foreground">{selectedStudent.badges_count}</p>
                  <p className="text-xs text-muted-foreground">Badges</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <BookOpen className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="font-bold text-foreground">{selectedStudent.completed_lessons}</p>
                  <p className="text-xs text-muted-foreground">Aulas</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <Shield className="w-5 h-5 text-accent mx-auto mb-1" />
                  <p className="font-bold text-foreground">{selectedStudent.completed_exercises}</p>
                  <p className="text-xs text-muted-foreground">Exercícios</p>
                </div>
              </div>

              {selectedStudent.enrollments.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Turmas Matriculadas</p>
                  <div className="space-y-2">
                    {selectedStudent.enrollments.map((e, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-muted/30 border border-border/50">
                        <p className="font-medium text-sm">{e.class_name}</p>
                        {e.course_titles.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {e.course_titles.join(", ")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para matricular em turma */}
      <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Matricular Aluno em Turma</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Aluno: <strong>{selectedStudentForEnroll?.full_name}</strong>
              </p>
            </div>
            <div className="space-y-2">
              <Label>Selecione a Turma</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha uma turma" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEnrollDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={confirmEnrollment} 
                disabled={!selectedClass}
                className="bg-gradient-primary"
              >
                Matricular
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para criar novo aluno */}
      <Dialog open={createStudentDialogOpen} onOpenChange={(open) => {
        setCreateStudentDialogOpen(open);
        if (!open) resetCreateStudentForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Aluno</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome Completo *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Nome do aluno"
                  className="pl-10"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  className="pl-10"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Senha *</Label>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newStudentPassword}
                onChange={(e) => setNewStudentPassword(e.target.value)}
                minLength={6}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateStudentDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateStudent}
                className="bg-gradient-primary"
              >
                Criar Aluno
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageStudents;