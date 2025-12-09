import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Award, Plus, Search, Trophy, Star, Zap } from 'lucide-react';
import { useState } from 'react';

const Achievements = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const achievements = [
    { id: 1, name: 'Primeira Lição', description: 'Completou a primeira lição', rarity: 'common', students: 42 },
    { id: 2, name: 'Mestre das Variáveis', description: 'Completou 10 lições sobre variáveis', rarity: 'rare', students: 15 },
    { id: 3, name: 'Maratonista', description: 'Estudou por 7 dias consecutivos', rarity: 'epic', students: 8 },
    { id: 4, name: 'Perfeccionista', description: 'Atingiu 100% de acerto em 5 exercícios', rarity: 'legendary', students: 3 },
  ];

  const students = [
    { id: 1, name: 'Maria Silva', achievement: 'Primeira Lição', date: '2023-05-15' },
    { id: 2, name: 'João Santos', achievement: 'Mestre das Variáveis', date: '2023-05-18' },
    { id: 3, name: 'Ana Costa', achievement: 'Maratonista', date: '2023-05-20' },
    { id: 4, name: 'Pedro Almeida', achievement: 'Primeira Lição', date: '2023-05-22' },
  ];

  const rarityColors = {
    common: 'bg-gray-100 text-gray-800',
    rare: 'bg-blue-100 text-blue-800',
    epic: 'bg-purple-100 text-purple-800',
    legendary: 'bg-yellow-100 text-yellow-800',
  };

  const rarityIcons = {
    common: Star,
    rare: Star,
    epic: Zap,
    legendary: Trophy,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Conquistas</h2>
          <p className="text-muted-foreground">
            Gerencie as conquistas dos alunos e acompanhe os destaques
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova Conquista
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Conquistas Disponíveis</CardTitle>
            <CardDescription>
              Lista de todas as conquistas que podem ser obtidas pelos alunos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {achievements.map((achievement) => {
                const Icon = rarityIcons[achievement.rarity as keyof typeof rarityIcons] || Star;
                return (
                  <div key={achievement.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className={`p-2 rounded-full ${rarityColors[achievement.rarity as keyof typeof rarityColors]}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{achievement.name}</div>
                      <div className="text-sm text-muted-foreground">{achievement.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{achievement.students}</div>
                      <div className="text-xs text-muted-foreground">alunos</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atribuir Conquista</CardTitle>
            <CardDescription>
              Atribua conquistas manualmente aos alunos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="student">Aluno</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um aluno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maria">Maria Silva</SelectItem>
                  <SelectItem value="joao">João Santos</SelectItem>
                  <SelectItem value="ana">Ana Costa</SelectItem>
                  <SelectItem value="pedro">Pedro Almeida</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="achievement">Conquista</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma conquista" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primeira-licao">Primeira Lição</SelectItem>
                  <SelectItem value="mestre-variaveis">Mestre das Variáveis</SelectItem>
                  <SelectItem value="maratonista">Maratonista</SelectItem>
                  <SelectItem value="perfeccionista">Perfeccionista</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" placeholder="Adicione observações sobre a conquista..." />
            </div>

            <Button className="w-full">
              <Award className="mr-2 h-4 w-4" />
              Atribuir Conquista
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Alunos Destacados</CardTitle>
              <CardDescription>
                Alunos que receberam conquistas recentemente
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Conquista</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="font-medium">{student.name}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{student.achievement}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(student.date).toLocaleDateString('pt-BR')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      Ver detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Achievements;