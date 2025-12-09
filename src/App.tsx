import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, AppRole } from './hooks/useAuth'; // Importar AppRole
import LoginPage from './pages/Login';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import ManageStudents from './pages/teacher/ManageStudents';
import { Toaster } from 'sonner';
import React from 'react'; // Importar React

// Componente para rotas protegidas
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: AppRole[] }) => {
  const { user, role, isLoading } = useAuth();

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

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* Rotas Protegidas para Professores e Administradores */}
          <Route path="/teacher" element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <TeacherDashboard />
            </ProtectedRoute>
          } />
          <Route path="/teacher/students" element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <ManageStudents />
            </ProtectedRoute>
          } />

          {/* Rota padrão, redireciona para /teacher se logado, senão para /login */}
          <Route path="/" element={<HomeRedirect />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

// Componente para redirecionamento da rota inicial
const HomeRedirect = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background dark flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/teacher" replace />; // Redireciona para o dashboard do professor se logado
  }
  return <Navigate to="/login" replace />; // Redireciona para login se não logado
};

export default App;