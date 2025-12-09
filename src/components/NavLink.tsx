import React from 'react';
import { NavLink as RouterNavLink } from 'react-router-dom';
import { cn } from '@/lib/utils'; // Assuming cn utility exists

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const NavLink = ({ to, children, icon }: NavLinkProps) => {
  return (
    <RouterNavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted',
          isActive ? 'bg-muted text-primary' : 'text-muted-foreground'
        )
      }
    >
      {icon && <span className="h-4 w-4">{icon}</span>}
      {children}
    </RouterNavLink>
  );
};