import { Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, Home, BookOpen, Award } from 'lucide-react';
import { NavLink } from '@/components/NavLink'; // Assuming NavLink exists

const StudentLayout = () => {
  const { user, profile, signOut } = useAuth();

  if (!user) return null; // Should be handled by ProtectedRoute

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 shadow-md p-4 flex flex-col">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary">JovemCoder</h1>
          <p className="text-sm text-muted-foreground">Aluno</p>
        </div>
        <nav className="flex-grow space-y-2">
          <NavLink to="/student/dashboard" icon={<Home className="h-4 w-4" />}>
            Dashboard
          </NavLink>
          <NavLink to="/student/courses" icon={<BookOpen className="h-4 w-4" />}>
            Meus Cursos
          </NavLink>
          <NavLink to="/student/achievements" icon={<Award className="h-4 w-4" />}>
            Conquistas
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

export default StudentLayout;