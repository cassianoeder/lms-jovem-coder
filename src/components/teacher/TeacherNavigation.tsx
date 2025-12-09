import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  BookOpen, 
  Users, 
  BarChart3, 
  Calendar, 
  Settings,
  Award,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TeacherNavigation = () => {
  const location = useLocation();
  
  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/teacher',
      icon: Home,
    },
    {
      name: 'Meus Cursos',
      href: '/teacher/courses',
      icon: BookOpen,
    },
    {
      name: 'Gerenciar Alunos',
      href: '/teacher/students',
      icon: Users,
    },
    {
      name: 'Estatísticas',
      href: '/teacher/statistics',
      icon: TrendingUp,
    },
    {
      name: 'Presença',
      href: '/teacher/attendance',
      icon: Calendar,
    },
    {
      name: 'Conquistas',
      href: '/teacher/achievements',
      icon: Award,
    },
    {
      name: 'Configurações',
      href: '/teacher/settings',
      icon: Settings,
    },
  ];

  return (
    <nav className="space-y-2">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;
        
        return (
          <Button
            key={item.name}
            variant={isActive ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start",
              isActive && "bg-secondary font-medium"
            )}
            asChild
          >
            <Link to={item.href}>
              <Icon className="mr-2 h-4 w-4" />
              {item.name}
            </Link>
          </Button>
        );
      })}
    </nav>
  );
};

export default TeacherNavigation;