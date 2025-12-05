import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import StudentDashboard from "./pages/student/StudentDashboard";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import ManageLessons from "./pages/teacher/ManageLessons";
import ManageExercises from "./pages/teacher/ManageExercises";
import ManageQuestions from "./pages/teacher/ManageQuestions";
import ManageUsers from "./pages/teacher/ManageUsers";
import CoordinatorDashboard from "./pages/coordinator/CoordinatorDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
            <Route path="/teacher" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><TeacherDashboard /></ProtectedRoute>} />
            <Route path="/teacher/lessons" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><ManageLessons /></ProtectedRoute>} />
            <Route path="/teacher/exercises" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><ManageExercises /></ProtectedRoute>} />
            <Route path="/teacher/questions" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><ManageQuestions /></ProtectedRoute>} />
            <Route path="/teacher/users" element={<ProtectedRoute allowedRoles={['admin']}><ManageUsers /></ProtectedRoute>} />
            <Route path="/coordinator" element={<ProtectedRoute allowedRoles={['coordinator', 'admin']}><CoordinatorDashboard /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
