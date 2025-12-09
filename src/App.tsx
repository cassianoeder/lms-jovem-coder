import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth, AppRole } from './hooks/useAuth';
import LoginPage from './pages/Login';
import TeacherLayout from './layouts/TeacherLayout';
import StudentLayout from './layouts/StudentLayout';
import AdminLayout from './layouts/AdminLayout';
import LoadingPage from './components/LoadingPage';
import ProtectedRoute from './components/ProtectedRoute';
import TeacherDashboard from './pages/teacher/Dashboard';
import StudentsManagement from './pages/teacher/StudentsManagement';
import TeacherCourses from './pages/teacher/Courses';
import TeacherClasses from './pages/teacher/Classes';
import TeacherSettings from './pages/teacher/Settings';
import StudentStatistics from './pages/teacher/StudentStatistics';
import StudentDashboard from './pages/student/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from './integrations/supabase/client';

const HomeRedirect = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) { // Only act when loading is complete
      if (user) {
        // User is logged in, now determine where to send them based on role
        if (role === 'teacher' || role === 'admin') {
          navigate('/teacher/dashboard', { replace: true });
        } else if (role === 'student') {
          navigate('/student/dashboard', { replace: true });
        } else {
          // This case should ideally not happen if handle_new_user works
          // If user is logged in but has no recognized role, or role is null
          console.warn('User logged in but no recognized role found. Redirecting to login.');
          toast.error('Sua conta não possui um papel definido. Por favor, contate o suporte.');
          supabase.auth.signOut(); // Force sign out if role is ambiguous
          navigate('/login', { replace: true });
        }
      } else {
        // User is not logged in, redirect to login page
        navigate('/login', { replace: true });
      }
    }
  }, [loading, user, role, navigate]); // Depend on loading, user, and role

  if (loading) {
    return <LoadingPage />; // Show loading screen while auth state is being determined
  }
  return null; // This component doesn't render anything once redirection is handled
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<HomeRedirect />} /> {/* Handles initial redirect */}

        {/* Teacher Routes */}
        <Route path="/teacher" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><TeacherLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="students" element={<StudentsManagement />} />
          <Route path="courses" element={<TeacherCourses />} />
          <Route path="classes" element={<TeacherClasses />} />
          <Route path="settings" element={<TeacherSettings />} />
          <Route path="statistics" element={<StudentStatistics />} />
          {/* Add other teacher routes here */}
        </Route>

        {/* Student Routes */}
        <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<StudentDashboard />} />
          {/* Add other student routes here */}
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<AdminDashboard />} />
          {/* Add other admin routes here */}
        </Route>

        {/* Fallback for unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;