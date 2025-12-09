import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, AppRole } from '@/hooks/useAuth'; // Import AppRole

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: AppRole[] }) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>; // Or a proper LoadingPage component
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Ensure role is not null before checking includes
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // User is logged in but doesn't have the required role
    if (role === 'teacher' || role === 'admin') return <Navigate to="/teacher/dashboard" replace />;
    if (role === 'student') return <Navigate to="/student/dashboard" replace />;
    return <Navigate to="/unauthorized" replace />; // Fallback for unknown roles
  }

  return children;
};

export default ProtectedRoute;