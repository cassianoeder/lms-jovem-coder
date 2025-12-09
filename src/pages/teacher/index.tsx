import { Routes, Route, Navigate } from 'react-router-dom';
import TeacherLayout from '@/components/teacher/TeacherLayout';
import Dashboard from '@/pages/teacher/Dashboard';
import Courses from '@/pages/teacher/Courses';
import StudentsManagement from '@/pages/teacher/StudentsManagement';
import StudentStatistics from '@/pages/teacher/StudentStatistics';
import Attendance from '@/pages/teacher/Attendance';
import Achievements from '@/pages/teacher/Achievements';
import Settings from '@/pages/teacher/Settings';

const TeacherRoutes = () => {
  return (
    <Routes>
      <Route element={<TeacherLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="courses" element={<Courses />} />
        <Route path="students" element={<StudentsManagement />} />
        <Route path="statistics" element={<StudentStatistics />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="achievements" element={<Achievements />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/teacher" replace />} />
      </Route>
    </Routes>
  );
};

export default TeacherRoutes;