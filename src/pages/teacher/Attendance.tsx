import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle, XCircle, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const Attendance = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState([
    { id: 1, name: 'Maria Silva', present: true, notes: '' },
    { id: 2, name: 'João Santos', present: false, notes: '' },
    { id: 3, name: 'Ana Costa', present: true, notes: '' },
    { id: 4, name: 'Pedro Almeida', present: true, notes: '' },
    { id: 5, name: 'Carla Oliveira', present: false, notes: '' },
  ]);

  const toggleAttendance = (id: number) => {
    setAttendance(attendance.map(student => 
      student.id === id 
        ? { ...student, present: !student.present } 
        : student
    ));
  };

  const updateNotes = (id: number, notes: string) => {
    setAttendance(attendance.map(student => 
      student.id === id 
        ? { ...student, notes } 
        : student
    ));
  };

  const handleSubmit = () => {
    console.log('Attendance submitted:', { date, attendance });
    alert('Lista de presença registrada com sucesso!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Lista de Presença</h2>
        <p className="text-muted-foreground">
          Registre a presença dos alunos em suas aulas
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registrar Presença</CardTitle>
          <CardDescription>
            Selecione a data e marque a presença dos alunos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1">
              <Label htmlFor="date">Data da Aula</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full sm:w-auto"
              />
            </div>
            <Button onClick={handleSubmit} className="w-full sm:w-auto">
              <CheckCircle className="mr-2 h-4 w-4" />
              Salvar Presença
            </Button>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Alunos</h3>
            <div className="space-y-3">
              {attendance.map((student) => (
                <div key={student.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => toggleAttendance(student.id)}
                    className={student.present ? "bg-green-100 border-green-500" : "bg-red-100 border-red-500"}
                  >
                    {student.present ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </Button>
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{student.name}</div>
                    </div>
                  </div>
                  <div className="flex-1 max-w-md">
                    <Textarea
                      placeholder="Observações (opcional)"
                      value={student.notes}
                      onChange={(e) => updateNotes(student.id, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Histórico de Presença
            </div>
          </CardTitle>
          <CardDescription>
            Acompanhe o histórico de presença dos alunos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="mx-auto h-12 w-12" />
            <p className="mt-2">Nenhum registro de presença encontrado</p>
            <p className="text-sm">Comece registrando a presença dos alunos</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Attendance;