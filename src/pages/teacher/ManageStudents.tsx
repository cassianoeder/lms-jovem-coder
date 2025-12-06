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
import { 
  ArrowLeft, Users, Search, Eye, Trash2, Shield, BookOpen, 
  Zap, Trophy, TrendingUp, Code2, Mail
} from "lucide-react";
import { toast } from "sonner";
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

const ManageStudents = () => {
  const { role } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    
    // Get all users with student role
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

    // Get profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url, created_at')
      .in('user_id', studentIds);

    // Get XP data
    const { data: xpData } = await supabase
      .from('student_xp')
      .select('user_id, total_xp, level')
      .in('user_id', studentIds);

    // Get streaks
    const { data: streaks } = await supabase
      .from('streaks')
      .select('user_id, current_streak')
      .in('user_id', studentIds);

    // Get enrollment counts
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('student_id')
      .eq('status', 'approved')
      .in('student_id', studentIds);

    // Map data
    const xpMap = new Map(xpData?.map(x => [x.user_id, x]) || []);
    const streakMap = new Map(streaks?.map(s => [s.user_id, s]) || []);
    const enrollmentCounts = (enrollments || []).reduce((acc, e) => {
      acc[e.student_id] = (acc[e.student_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

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
    // Get detailed info
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

    // Get enrollments with class and course info
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('class_id, classes(name)')
      .eq('student_id', student.user_id)
      .eq('status', 'approved');

    const enrollmentDetails: { class_name: string; course_titles: string[] }[] = [];
    
    for (const e of enrollments || []) {
      const cls = e.classes as any;
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

  const deleteStudent = async (userId: string) => {
    if (!confirm("Tem certeza que deseja remover este aluno? Esta ação é irreversível.")) return;

    // Remove all related data
    await supabase.from('enrollments').delete().eq('student_id', userId);
    await supabase.from('enrollment_requests').delete().eq('student_id', userId);
    await supabase.from('student_progress').delete().eq('user_id', userId);
    await supabase.from('student_badges').delete().eq('user_id', userId);
    await supabase.from('student_missions').delete().eq('user_id', userId);
    await supabase.from('student_xp').delete().eq('user_id', userId);
    await supabase.from('streaks').delete().eq('user_id', userId);
    await supabase.from('user_roles').delete().eq('user_id', userId);
    await supabase.from('profiles').delete().eq('user_id', userId);

    toast.success("Aluno removido com sucesso");
    fetchStudents();
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
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/teacher">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Code2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">Gerenciar Alunos</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Alunos</p>
                  <p className="font-display text-2xl font-bold text-foreground">{students.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-xp flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">XP Total</p>
                  <p className="font-display text-2xl font-bold text-foreground">
                    {students.reduce((acc, s) => acc + (s.total_xp || 0), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-streak flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Média Nível</p>
                  <p className="font-display text-2xl font-bold text-foreground">
                    {students.length > 0 
                      ? Math.round(students.reduce((acc, s) => acc + (s.level || 1), 0) / students.length) 
                      : 0}
                  </p>
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
                  <p className="text-sm text-muted-foreground">Matrículas</p>
                  <p className="font-display text-2xl font-bold text-foreground">
                    {students.reduce((acc, s) => acc + (s.enrollments_count || 0), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
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
        </div>

        {/* Students Table */}
        {filteredStudents.length === 0 ? (
          <Card className="glass border-border/50">
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "Nenhum aluno encontrado" : "Nenhum aluno cadastrado ainda"}
              </p>
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
                      {role === 'admin' && (
                        <Button size="sm" variant="outline" className="text-destructive" onClick={() => deleteStudent(student.user_id)}>
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

      {/* Student Detail Dialog */}
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
    </div>
  );
};

export default ManageStudents;