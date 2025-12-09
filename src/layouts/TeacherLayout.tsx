import { Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, Home, Users, BookOpen, GraduationCap, Settings, BarChart3 } from 'lucide-react';
import { NavLink } from '@/components/NavLink'; // Assuming NavLink exists

const TeacherLayout = () => {
  const { user, profile, signOut, role } = useAuth();
  // In a real app, you'd have a proper sidebar/navbar component
  // For now, a simple layout with a logout button

  if (!user) return null; // Should be handled by ProtectedRoute

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 shadow-md p-4 flex flex-col">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary">JovemCoder</h1>
          <p className="text-sm text-muted-foreground">Professor</p>
        </div>
        <nav className="flex-grow space-y-2">
          <NavLink to="/teacher/dashboard" icon={<Home className="h-4 w-4" />}>
            Dashboard
          </NavLink>
          <NavLink to="/teacher/students" icon={<Users className="h-4 w-4" />}>
            Alunos
          </NavLink>
          <NavLink to="/teacher/courses" icon={<BookOpen className="h-4 w-4" />}>
            Cursos
          </NavLink>
          <NavLink to="/teacher/classes" icon={<GraduationCap className="h-4 w-4" />}>
            Turmas
          </NavLink>
          <NavLink to="/teacher/statistics" icon={<BarChart3 className="h-4 w-4" />}>
            Estatísticas
          </NavLink>
          <NavLink to="/teacher/settings" icon={<Settings className="h-4 w-4" />}>
            Configurações
          </NavLink>
        </nav>
        <div className="mt-auto">
          <div className="flex items-center gap-2 mb-4">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name || 'User'} className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                {profile?.full_name ? profile.full_name[0] : 'U'}
              </div>
            )}
            <span className="font-medium">{profile?.full_name || user.email}</span>
          </div>
          <Button onClick={signOut} className="w-full" variant="outline">
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default TeacherLayout;