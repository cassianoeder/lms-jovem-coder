import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, User, BookOpen, Award, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Student {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  total_xp: number;
  level: number;
  current_streak: number;
  last_activity_date: string | null;
  enrolled_at: string;
  class_name: string;
}

const StudentsManagement = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStudents();
    }
  }, [user]);

  useEffect(() => {
    const filtered = students.filter(student => 
      student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.class_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStudents(filtered);
  }, [searchTerm, students]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      
      // First, get classes taught by this teacher
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('id, name')
        .eq('teacher_id', user?.id);

      if (classesError) throw classesError;

      if (!classes || classes.length === 0) {
        setStudents([]);
        setFilteredStudents([]);
        setLoading(false);
        return;
      }

      const classIds = classes.map(cls => cls.id);

      // Fetch students enrolled in classes taught by this teacher
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          student_id,
          enrolled_at,
          class_id,
          classes (
            name
          ),
          profiles:user_id (
            full_name,
            avatar_url
          ),
          users:user_id (
            email
          ),
          student_xp:user_id (
            total_xp,
            level
          ),
          streaks:user_id (
            current_streak,
            last_activity_date
          )
        `)
        .in('class_id', classIds)
        .eq('status', 'approved');

      if (error) throw error;

      // Transform data to match Student interface
      const transformedStudents = data.map((enrollment: any) => ({
        id: enrollment.student_id,
        full_name: enrollment.profiles?.full_name || 'Nome não disponível',
        email: enrollment.users?.email || 'Email não disponível',
        avatar_url: enrollment.profiles?.avatar_url || null,
        total_xp: enrollment.student_xp?.total_xp || 0,
        level: enrollment.student_xp?.level || 1,
        current_streak: enrollment.streaks?.current_streak || 0,
        last_activity_date: enrollment.streaks?.last_activity_date || null,
        enrolled_at: enrollment.enrolled_at,
        class_name: enrollment.classes?.name || 'Turma não especificada'
      }));

      setStudents(transformedStudents);
      setFilteredStudents(transformedStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Erro ao carregar alunos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gerenciamento de Alunos</h2>
          <p className="text-muted-foreground">
            Visualize e gerencie os alunos matriculados em suas turmas
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Alunos Matriculados</CardTitle>
              <CardDescription>
                Lista de todos os alunos matriculados em suas turmas
              </CardDescription>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar alunos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredStudents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Streak</TableHead>
                  <TableHead>Matrícula</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {student.avatar_url ? (
                          <img 
                            src={student.avatar_url} 
                            alt={student.full_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{student.full_name}</div>
                          <div className="text-sm text-muted-foreground">{student.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{student.class_name}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          Nível {student.level}
                        </Badge>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Award className="w-4 h-4 mr-1" />
                          {student.total_xp} XP
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-1 text-muted-foreground" />
                        {student.current_streak} dias
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(student.enrolled_at).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum aluno encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? 'Nenhum aluno corresponde à sua busca' 
                  : 'Você ainda não tem alunos matriculados em suas turmas'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentsManagement;