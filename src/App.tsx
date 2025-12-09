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
import LessonView from "./pages/student/LessonView";
import ExerciseView from "./pages/student/ExerciseView";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import ManageLessons from "./pages/teacher/ManageLessons";
import ManageExercises from "./pages/teacher/ManageExercises";
import ManageUsers from "./pages/teacher/ManageUsers";
import ManageStudents from "./pages/teacher/ManageStudents";
import ManageClasses from "./pages/teacher/ManageClasses";
import ManageCourses from "./pages/teacher/ManageCourses";
import ManageModules from "./pages/teacher/ManageModules";
import Settings from "./pages/teacher/Settings";
import NotFound from "./pages/NotFound";
import SetupGuard from "./components/SetupGuard";
import CertificateValidation from "./pages/CertificateValidation";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SetupGuard>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/certificate/validate/:validationCode" element={<CertificateValidation />} />
              
              {/* Student Routes */}
              <Route path="/student" element={
                <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
                  <StudentDashboard />
                </ProtectedRoute>
              } />
              <Route path="/student/classes" element={
                <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
                  <AvailableClasses />
                </ProtectedRoute>
              } />
              <Route path="/student/my-classes" element={
                <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
                  <MyClasses />
                </ProtectedRoute>
              } />
              <Route path="/student/class/:classId" element={
                <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
                  <ClassContent />
                </ProtectedRoute>
              } />
              <Route path="/student/certificates" element={
                <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
                  <MyCertificates />
                </ProtectedRoute>
              } />
              <Route path="/student/lesson/:lessonId" element={
                <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
                  <LessonView />
                </ProtectedRoute>
              } />
              <Route path="/student/exercise/:exerciseId" element={
                <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
                  <ExerciseView />
                </ProtectedRoute>
              } />
              
              {/* Teacher/Admin Routes */}
              <Route path="/teacher" element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <TeacherDashboard />
                </ProtectedRoute>
              } />
              <Route path="/teacher/classes" element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <ManageClasses />
                </ProtectedRoute>
              } />
              <Route path="/teacher/courses" element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <ManageCourses />
                </ProtectedRoute>
              } />
              <Route path="/teacher/modules" element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <ManageModules />
                </ProtectedRoute>
              } />
              <Route path="/teacher/lessons" element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <ManageLessons />
                </ProtectedRoute>
              } />
              <Route path="/teacher/exercises" element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <ManageExercises />
                </ProtectedRoute>
              } />
              <Route path="/teacher/students" element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <ManageStudents />
                </ProtectedRoute>
              } />
              <Route path="/teacher/users" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ManageUsers />
                </ProtectedRoute>
              } />
              <Route path="/teacher/settings" element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <Settings />
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </SetupGuard>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;