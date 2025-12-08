import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  Code2, ArrowLeft, Plus, Pencil, Trash2, Users, Lock, Globe, 
  CheckCircle, XCircle, Clock, Eye, BookOpen
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Class {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  status: string;
  teacher_id: string | null;
  created_at: string;
}

interface Course {
  id: string;
  title: string;
}

interface ClassCourse {
  course_id: string;
  courses?: { title: string };
}

interface EnrollmentRequest {
  id: string;
  student_id: string;
  class_id: string;
  message: string | null;
  status: string;
  created_at: string;
  profiles?: { full_name: string };
}

interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  status: string;
  enrolled_at: string;
  profiles?: { full_name: string };
}

const ManageClasses = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classCourses, setClassCourses] = useState<Record<string, ClassCourse[]>>({});
  const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isStudentsDialogOpen, setIsStudentsDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_public: true,
    course_ids: [] as string[],
  });

  const fetchData = async () => {
    setLoading(true);
    const [classesRes, coursesRes, requestsRes, classCoursesRes] = await Promise.all([
      supabase.from('classes').select('*').order('created_at', { ascending: false }),
      supabase.from('courses').select('id, title').order('title'),
      supabase.from('enrollment_requests').select('*').eq('status', 'pending'),
      supabase.from('class_courses').select('class_id, course_id, courses(title)'),
    ]);

    if (classesRes.data) setClasses(classesRes.data as Class[]);
    if (coursesRes.data) setCourses(coursesRes.data);
    
    // Group class_courses by class_id
    if (classCoursesRes.data) {
      const grouped = (classCoursesRes.data as any[]).reduce((acc, cc) => {
        if (!acc[cc.class_id]) acc[cc.class_id] = [];
        acc[cc.class_id].push(cc);
        return acc;
      }, {} as Record<string, ClassCourse[]>);
      setClassCourses(grouped);
    }
    
    // Fetch profiles for requests
    if (requestsRes.data && requestsRes.data.length > 0) {
      const studentIds = requestsRes.data.map(r => r.student_id);
      const { data: profilesData } = await supabase.from('profiles').select('user_id, full_name').in('user_id', studentIds);
      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      const requestsWithProfiles = requestsRes.data.map(r => ({
        ...r,
        profiles: profilesMap.get(r.student_id)
      }));
      setRequests(requestsWithProfiles as EnrollmentRequest[]);
    } else {
      setRequests([]);
    }
    setLoading(false);
  };

  const fetchEnrollments = async (classId: string) => {
    const { data } = await supabase.from('enrollments').select('*').eq('class_id', classId);
    if (data && data.length > 0) {
      const studentIds = data.map(e => e.student_id);
      const { data: profilesData } = await supabase.from('profiles').select('user_id, full_name').in('user_id', studentIds);
      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      const enrollmentsWithProfiles = data.map(e => ({
        ...e,
        profiles: profilesMap.get(e.student_id)
      }));
      setEnrollments(enrollmentsWithProfiles as Enrollment[]);
    } else {
      setEnrollments([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      name: formData.name,
      description: formData.description || null,
      is_public: formData.is_public,
      teacher_id: user?.id,
    };

    try {
      if (selectedClass) {
        // Update class
        const { error } = await supabase
          .from('classes')
          .update(payload)
          .eq('id', selectedClass.id);
        if (error) throw error;

        // Update class_courses: delete all and re-insert
        await supabase.from('class_courses').delete().eq('class_id', selectedClass.id);
        
        if (formData.course_ids.length > 0) {
          const coursesToInsert = formData.course_ids.map(courseId => ({
            class_id: selectedClass.id,
            course_id: courseId,
          }));
          const { error: insertError } = await supabase.from('class_courses').insert(coursesToInsert);
          if (insertError) throw insertError;
        }

        toast.success("Turma atualizada!");
      } else {
        // Create class
        const { data: newClass, error } = await supabase.from('classes').insert(payload).select().single();
        if (error) throw error;

        // Insert class_courses
        if (formData.course_ids.length > 0 && newClass) {
          const coursesToInsert = formData.course_ids.map(courseId => ({
            class_id: newClass.id,
            course_id: courseId,
          }));
          const { error: insertError } = await supabase.from('class_courses').insert(coursesToInsert);
          if (insertError) throw insertError;
        }

        toast.success("Turma criada!");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar turma");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta turma?")) return;
    const { error } = await supabase.from('classes').delete().eq('id', id);
    if (error) {
      toast.error("Erro ao excluir turma");
      return;
    }
    toast.success("Turma excluída!");
    fetchData();
  };

  const handleEdit = (cls: Class) => {
    setSelectedClass(cls);
    const courseIds = (classCourses[cls.id] || []).map(cc => cc.course_id);
    setFormData({
      name: cls.name,
      description: cls.description || "",
      is_public: cls.is_public,
      course_ids: courseIds,
    });
    setIsDialogOpen(true);
  };

  const handleViewStudents = (cls: Class) => {
    setSelectedClass(cls);
    fetchEnrollments(cls.id);
    setIsStudentsDialogOpen(true);
  };

  const handleRequestAction = async (requestId: string, action: 'approved' | 'rejected') => {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    if (action === 'approved') {
      const { error: enrollError } = await supabase.from('enrollments').insert({
        student_id: request.student_id,
        class_id: request.class_id,
        status: 'approved',
      });
      if (enrollError) {
        toast.error("Erro ao aprovar aluno");
        return;
      }
    }

    const { error } = await supabase
      .from('enrollment_requests')
      .update({ status: action, reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
      .eq('id', requestId);

    if (error) {
      toast.error("Erro ao processar solicitação");
      return;
    }

    toast.success(action === 'approved' ? "Aluno aprovado!" : "Solicitação recusada");
    fetchData();
  };

  const handleRemoveStudent = async (enrollmentId: string) => {
    if (!confirm("Remover este aluno da turma?")) return;
    const { error } = await supabase.from('enrollments').delete().eq('id', enrollmentId);
    if (error) {
      toast.error("Erro ao remover aluno");
      return;
    }
    toast.success("Aluno removido da turma");
    if (selectedClass) fetchEnrollments(selectedClass.id);
  };

  const resetForm = () => {
    setSelectedClass(null);
    setFormData({ name: "", description: "", is_public: true, course_ids: [] });
  };

  const toggleCourse = (courseId: string) => {
    setFormData(prev => ({
      ...prev,
      course_ids: prev.course_ids.includes(courseId)
        ? prev.course_ids.filter(id => id !== courseId)
        : [...prev.course_ids, courseId]
    }));
  };

  const pendingRequestsCount = requests.length;

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
              <span className="font-display text-lg font-bold text-foreground">Gerenciar Turmas</span>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />Nova Turma
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedClass ? "Editar Turma" : "Nova Turma"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome da Turma</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Turma de Python 2024"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição da turma..."
                  />
                </div>
                
                {/* Multiple Courses Selection */}
                <div className="space-y-3">
                  <Label>Cursos Vinculados</Label>
                  <div className="border border-border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                    {courses.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum curso cadastrado</p>
                    ) : (
                      courses.map((course) => (
                        <div key={course.id} className="flex items-center space-x-3">
                          <Checkbox 
                            id={course.id}
                            checked={formData.course_ids.includes(course.id)}
                            onCheckedChange={() => toggleCourse(course.id)}
                          />
                          <label 
                            htmlFor={course.id}
                            className="text-sm font-medium leading-none cursor-pointer"
                          >
                            {course.title}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                  {formData.course_ids.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {formData.course_ids.length} curso(s) selecionado(s)
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    {formData.is_public ? <Globe className="w-5 h-5 text-primary" /> : <Lock className="w-5 h-5 text-warning" />}
                    <div>
                      <p className="font-medium">{formData.is_public ? "Turma Pública" : "Turma Privada"}</p>
                      <p className="text-sm text-muted-foreground">
                        {formData.is_public ? "Qualquer aluno pode solicitar entrada" : "Entrada somente com aprovação"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.is_public}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-gradient-primary hover:opacity-90">
                    {selectedClass ? "Salvar" : "Criar Turma"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="classes">
          <TabsList className="mb-6">
            <TabsTrigger value="classes">Turmas</TabsTrigger>
            <TabsTrigger value="requests" className="relative">
              Solicitações
              {pendingRequestsCount > 0 && (
                <Badge className="ml-2 bg-destructive text-destructive-foreground">{pendingRequestsCount}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="classes">
            {classes.length === 0 ? (
              <Card className="glass border-border/50">
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma turma cadastrada</p>
                  <Button className="mt-4 bg-gradient-primary" onClick={() => setIsDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />Criar Primeira Turma
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.map((cls) => {
                  const classCoursesData = classCourses[cls.id] || [];
                  return (
                    <Card key={cls.id} className="glass border-border/50 hover:border-primary/30 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {cls.is_public ? (
                              <Globe className="w-4 h-4 text-primary" />
                            ) : (
                              <Lock className="w-4 h-4 text-warning" />
                            )}
                            <Badge variant="secondary" className={cls.is_public ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"}>
                              {cls.is_public ? "Pública" : "Privada"}
                            </Badge>
                          </div>
                        </div>
                        <CardTitle className="text-lg mt-2">{cls.name}</CardTitle>
                        {cls.description && (
                          <CardDescription className="line-clamp-2">{cls.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        {/* Show linked courses */}
                        {classCoursesData.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {classCoursesData.map((cc, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                <BookOpen className="w-3 h-3 mr-1" />
                                {cc.courses?.title || "Curso"}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2 flex-wrap">
                          <Button variant="outline" size="sm" onClick={() => handleViewStudents(cls)}>
                            <Eye className="w-4 h-4 mr-1" />Alunos
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(cls)}>
                            <Pencil className="w-4 h-4 mr-1" />Editar
                          </Button>
                          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(cls.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests">
            {requests.length === 0 ? (
              <Card className="glass border-border/50">
                <CardContent className="py-12 text-center">
                  <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma solicitação pendente</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="glass border-border/50">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno</TableHead>
                      <TableHead>Turma</TableHead>
                      <TableHead>Mensagem</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => {
                      const cls = classes.find(c => c.id === request.class_id);
                      return (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.profiles?.full_name || "Aluno"}</TableCell>
                          <TableCell>{cls?.name || "Turma"}</TableCell>
                          <TableCell className="max-w-xs truncate">{request.message || "-"}</TableCell>
                          <TableCell>{new Date(request.created_at).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button size="sm" onClick={() => handleRequestAction(request.id, 'approved')} className="bg-primary hover:bg-primary/90">
                              <CheckCircle className="w-4 h-4 mr-1" />Aprovar
                            </Button>
                            <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleRequestAction(request.id, 'rejected')}>
                              <XCircle className="w-4 h-4 mr-1" />Recusar
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Students Dialog */}
      <Dialog open={isStudentsDialogOpen} onOpenChange={setIsStudentsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Alunos - {selectedClass?.name}</DialogTitle>
          </DialogHeader>
          {enrollments.length === 0 ? (
            <div className="py-8 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum aluno matriculado</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {enrollments.map((enrollment) => (
                <div key={enrollment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">{enrollment.profiles?.full_name || "Aluno"}</p>
                    <p className="text-xs text-muted-foreground">
                      Desde {new Date(enrollment.enrolled_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleRemoveStudent(enrollment.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageClasses;