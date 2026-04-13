import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import LessonDetail from './pages/LessonDetail';
import SubmissionPage from './pages/SubmissionPage';
import AdminUsers from './pages/AdminUsers';
import AdminCourses from './pages/AdminCourses';
import AdminCheckSubmissions from './pages/AdminCheckSubmissions';
import GradeSubmission from './pages/GradeSubmission';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="courses" element={<Courses />} />
        <Route path="courses/:courseId" element={<CourseDetail />} />
        <Route path="lessons/:lessonId" element={<LessonDetail />} />
        <Route path="submit/:assignmentId" element={<SubmissionPage />} />

        {/* Admin Routes */}
        <Route path="admin/users" element={<ProtectedRoute role="admin"><AdminUsers /></ProtectedRoute>} />
        <Route path="admin/courses" element={<ProtectedRoute role="admin"><AdminCourses /></ProtectedRoute>} />
        <Route path="admin/submissions/:courseId" element={<ProtectedRoute role="admin"><AdminCheckSubmissions /></ProtectedRoute>} />
        <Route path="admin/grade/:submissionId" element={<ProtectedRoute role="admin"><GradeSubmission /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  );
}

export default App;