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
import AvailableClasses from "./pages/student/AvailableClasses";
import MyClasses from "./pages/student/MyClasses";
import MyCertificates from "./pages/student/MyCertificates";
import ClassContent from "./pages/student/ClassContent";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import ManageLessons from "./pages/teacher/ManageLessons";
import ManageExercises from "./pages/teacher/ManageExercises";
import ManageQuestions from "./pages/teacher/ManageQuestions";
import ManageUsers from "./pages/teacher/ManageUsers";
import ManageStudents from "./pages/teacher/ManageStudents";
import ManageClasses from "./pages/teacher/ManageClasses";
import ManageCourses from "./pages/teacher/ManageCourses";
import ManageModules from "./pages/teacher/ManageModules";
import Settings from "./pages/teacher/Settings";
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
            <Route path="/student/classes" element={<ProtectedRoute allowedRoles={['student']}><AvailableClasses /></ProtectedRoute>} />
            <Route path="/student/my-classes" element={<ProtectedRoute allowedRoles={['student']}><MyClasses /></ProtectedRoute>} />
            <Route path="/student/class/:classId" element={<ProtectedRoute allowedRoles={['student']}><ClassContent /></ProtectedRoute>} />
            <Route path="/student/certificates" element={<ProtectedRoute allowedRoles={['student']}><MyCertificates /></ProtectedRoute>} />
            <Route path="/teacher" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><TeacherDashboard /></ProtectedRoute>} />
            <Route path="/teacher/classes" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><ManageClasses /></ProtectedRoute>} />
            <Route path="/teacher/courses" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><ManageCourses /></ProtectedRoute>} />
            <Route path="/teacher/modules" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><ManageModules /></ProtectedRoute>} />
            <Route path="/teacher/lessons" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><ManageLessons /></ProtectedRoute>} />
            <Route path="/teacher/exercises" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><ManageExercises /></ProtectedRoute>} />
            <Route path="/teacher/questions" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><ManageQuestions /></ProtectedRoute>} />
            <Route path="/teacher/students" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><ManageStudents /></ProtectedRoute>} />
            <Route path="/teacher/users" element={<ProtectedRoute allowedRoles={['admin']}><ManageUsers /></ProtectedRoute>} />
            <Route path="/teacher/settings" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><Settings /></ProtectedRoute>} />
            <Route path="/coordinator" element={<ProtectedRoute allowedRoles={['coordinator', 'admin']}><CoordinatorDashboard /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
