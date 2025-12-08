import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Code2, ArrowLeft, Search, Globe, Lock, Users, Send, CheckCircle, Clock, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Class {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  courses?: { title: string } | null;
}

interface EnrollmentRequest {
  id: string;
  class_id: string;
  status: string;
}

interface Enrollment {
  id: string;
  class_id: string;
  status: string;
}

const AvailableClasses = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [myRequests, setMyRequests] = useState<EnrollmentRequest[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [message, setMessage] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [classesRes, requestsRes, enrollmentsRes] = await Promise.all([
      supabase.from('classes').select('*, courses(title)').eq('is_public', true).order('name'),
      supabase.from('enrollment_requests').select('id, class_id, status'),
      supabase.from('enrollments').select('id, class_id, status'),
    ]);

    if (classesRes.data) setClasses(classesRes.data as Class[]);
    if (requestsRes.data) setMyRequests(requestsRes.data);
    if (enrollmentsRes.data) setMyEnrollments(enrollmentsRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRequestEnrollment = async () => {
    if (!selectedClass || !user) return;

    const { error } = await supabase.from('enrollment_requests').insert({
      student_id: user.id,
      class_id: selectedClass.id,
      message: message || null,
    });

    if (error) {
      if (error.code === '23505') {
        toast.error("Você já solicitou entrada nesta turma");
      } else {
        toast.error("Erro ao solicitar entrada");
      }
      return;
    }

    toast.success("Solicitação enviada! Aguarde aprovação do professor.");
    setDialogOpen(false);
    setMessage("");
    setSelectedClass(null);
    fetchData();
  };

  const getClassStatus = (classId: string) => {
    const enrollment = myEnrollments.find(e => e.class_id === classId);
    if (enrollment?.status === 'approved') return 'enrolled';
    
    const request = myRequests.find(r => r.class_id === classId);
    if (request?.status === 'pending') return 'pending';
    if (request?.status === 'rejected') return 'rejected';
    
    return 'available';
  };

  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(search.toLowerCase()) ||
    cls.description?.toLowerCase().includes(search.toLowerCase())
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
            <Link to="/student">
              <Button variant="outline" size="icon"><ArrowLeft className="w-5 h-5 text-foreground" /></Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Code2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold text-foreground">Turmas Disponíveis</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar turmas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredClasses.length === 0 ? (
          <Card className="glass border-border/50">
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma turma disponível no momento</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClasses.map((cls) => {
              const status = getClassStatus(cls.id);
              return (
                <Card key={cls.id} className="glass border-border/50 hover:border-primary/30 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 mb-2">
                      {cls.is_public ? (
                        <Globe className="w-4 h-4 text-primary" />
                      ) : (
                        <Lock className="w-4 h-4 text-warning" />
                      )}
                      <Badge variant="secondary" className={cls.is_public ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"}>
                        {cls.is_public ? "Pública" : "Privada"}
                      </Badge>
                      {cls.courses && (
                        <Badge variant="secondary" className="bg-accent/10 text-accent">
                          <BookOpen className="w-3 h-3 mr-1" />
                          {cls.courses.title}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{cls.name}</CardTitle>
                    {cls.description && (
                      <CardDescription className="line-clamp-2">{cls.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {status === 'enrolled' ? (
                      <Link to={`/student/class/${cls.id}`}>
                        <Button className="w-full bg-primary hover:bg-primary/90">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Acessar Turma
                        </Button>
                      </Link>
                    ) : status === 'pending' ? (
                      <Button disabled className="w-full" variant="secondary">
                        <Clock className="w-4 h-4 mr-2" />
                        Aguardando Aprovação
                      </Button>
                    ) : status === 'rejected' ? (
                      <Button disabled className="w-full" variant="outline">
                        Solicitação Recusada
                      </Button>
                    ) : (
                      <Button 
                        className="w-full bg-gradient-primary hover:opacity-90"
                        onClick={() => { setSelectedClass(cls); setDialogOpen(true); }}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Solicitar Entrada
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Entrada na Turma</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Você está solicitando entrada na turma <strong>{selectedClass?.name}</strong>.
            </p>
            <div>
              <label className="text-sm font-medium">Mensagem (opcional)</label>
              <Textarea
                placeholder="Conte um pouco sobre você ou por que deseja entrar nesta turma..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-gradient-primary" onClick={handleRequestEnrollment}>
              <Send className="w-4 h-4 mr-2" />
              Enviar Solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AvailableClasses;