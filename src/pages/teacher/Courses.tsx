import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus, Play, Users } from 'lucide-react';

const Courses = () => {
  const courses = [
    {
      id: 1,
      title: "Introdução à Programação",
      students: 15,
      progress: 65,
      nextLesson: "Variáveis e Tipos de Dados"
    },
    {
      id: 2,
      title: "Estruturas de Dados",
      students: 12,
      progress: 40,
      nextLesson: "Listas Encadeadas"
    },
    {
      id: 3,
      title: "Algoritmos Avançados",
      students: 8,
      progress: 25,
      nextLesson: "Algoritmos de Ordenação"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Meus Cursos</h2>
          <p className="text-muted-foreground">
            Gerencie seus cursos e acompanhe o progresso dos alunos
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Criar Novo Curso
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Card key={course.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {course.title}
              </CardTitle>
              <CardDescription>
                {course.students} alunos inscritos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso médio</span>
                  <span>{course.progress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary">
                  <div 
                    className="h-2 rounded-full bg-primary" 
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="pt-2">
                <p className="text-sm text-muted-foreground">
                  Próxima lição: <span className="font-medium text-foreground">{course.nextLesson}</span>
                </p>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button size="sm" className="flex-1">
                  <Play className="mr-1 h-4 w-4" />
                  Continuar
                </Button>
                <Button size="sm" variant="outline">
                  <Users className="mr-1 h-4 w-4" />
                  Alunos
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Courses;