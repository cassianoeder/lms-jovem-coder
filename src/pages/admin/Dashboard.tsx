import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Settings, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AdminDashboard = () => {
  const { user, profile } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard do Administrador</h2>
        <p className="text-muted-foreground">
          Bem-vindo, {profile?.full_name || user?.email}! Gerencie o sistema JovemCoder.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gerenciar Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Todos os Usuários</div>
            <p className="text-xs text-muted-foreground">
              Crie, edite e exclua contas de usuários.
            </p>
            <Button className="mt-4" onClick={() => window.location.hash = '/admin/users'}>
              Ir para Gerenciamento
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configurações do Sistema</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Ajustar Parâmetros</div>
            <p className="text-xs text-muted-foreground">
              Configure o nome da plataforma, logo e outros detalhes.
            </p>
            <Button className="mt-4" onClick={() => window.location.hash = '/admin/settings'}>
              Ir para Configurações
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estatísticas Globais</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Visão Geral</div>
            <p className="text-xs text-muted-foreground">
              Acompanhe o desempenho geral da plataforma.
            </p>
            <Button className="mt-4" onClick={() => window.location.hash = '/admin/statistics'}>
              Ver Estatísticas
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;