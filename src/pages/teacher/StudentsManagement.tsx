import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, User, BookOpen, Award, Calendar, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Student {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  total_xp: number;
  level: number;
  current_streak: number;
  last_activity_date: string | null;
  created_at: string;
  class_name: string | null;
  enrollment_status: string | null;
}

const StudentsManagement = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAllStudents();
    }
  }, [user]);

  useEffect(() => {
    const filtered = students.filter(student => 
      student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.class_name && student.class_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredStudents(filtered);
  }, [searchTerm, students]);

  const fetchAllStudents = async () => {
    try {
      setLoading(true);
      
      // Call the new Supabase function to get all student data
      const { data, error } = await supabase.rpc('get_all_students_data');

      if (error) throw error;

      setStudents(data || []);
      setFilteredStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Erro ao carregar alunos: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (userId: string, email: string) => {
    try {
      // Send password reset email
      const { data, error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: email
      });
      
      if (error) throw error;
      
      toast.success(`Email de redefinição de senha enviado para ${email}`);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error('Erro ao enviar email de redefinição de senha: ' + error.message);
    }
  };

  const handleDeleteStudent = async (userId: string, fullName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o aluno ${fullName}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      // Delete user from auth
      const { error } = await supabase.auth.admin.deleteUser(userId);
      
      if (error) throw error;
      
      // Remove from local state
      setStudents(students.filter(student => student.id !== userId));
      setFilteredStudents(filteredStudents.filter(student => student.id !== userId));
      
      toast.success(`Aluno ${fullName} excluído com sucesso`);
    } catch (error: any) {
      console.error('Error deleting student:', error);
      toast.error('Erro ao excluir aluno: ' + error.message);
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
            Visualize e gerencie todos os alunos cadastrados no sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            Total de alunos: {students.length}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Todos os Alunos</CardTitle>
              <CardDescription>
                Lista de todos os alunos cadastrados no sistema
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
                  <TableHead>Cadastro</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
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
                      {student.class_name ? (
                        <Badge variant="outline">{student.class_name}</Badge>
                      ) : (
                        <Badge variant="secondary">Sem turma</Badge>
                      )}
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
                        {new Date(student.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {student.enrollment_status ? (
                        <Badge variant={student.enrollment_status === 'approved' ? 'default' : 'secondary'}>
                          {student.enrollment_status === 'approved' ? 'Ativo' : 'Pendente'}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Não matriculado</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleResetPassword(student.id, student.email)}
                          >
                            Redefinir Senha
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteStudent(student.id, student.full_name)}
                          >
                            Excluir Aluno
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                  : 'Nenhum aluno cadastrado no sistema'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentsManagement;