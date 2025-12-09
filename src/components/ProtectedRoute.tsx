import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, AppRole } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: AppRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, role, isLoading } = useAuth(); // Corrigido: 'loading' para 'isLoading'

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background dark flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && allowedRoles.includes(role)) {
    return children;
  }

  // Se o usuário está logado mas não tem a role permitida
  if (user && role && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen bg-background dark flex items-center justify-center text-foreground text-lg">
        Acesso Negado. Sua função ({role}) não tem permissão para visualizar esta página.
      </div>
    );
  }

  // Fallback para quando a role ainda está carregando ou não foi encontrada
  return (
    <div className="min-h-screen bg-background dark flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mr-2" />
      Carregando permissões...
    </div>
  );
};

export default ProtectedRoute;