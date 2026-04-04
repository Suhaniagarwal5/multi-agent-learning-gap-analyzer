import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import CourseSelect from './pages/CourseSelect';
import TopicList from './pages/TopicList';
import IDE from './pages/IDE';
import Dashboard from './pages/Dashboard';
import Achievements from './pages/Achievements';
import Login from './pages/Login';
import Lens from './pages/Lens';
import { AuthProvider, useAuth } from './context/AuthContext';
import NotFound from './pages/NotFound';

// Protected Route (FIXED)
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // 1. Agar check kar raha hai, toh loading screen dikhao
  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center text-[#00CCFF]">
      Loading Sutra AI...
    </div>
  );

  // 2. NAYA LOGIC: Agar user login nahi hai, toh usko wapas /login par bhej do!
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Agar sab theek hai, toh page kholne do
  return children;
};

// Layout
const Layout = ({ children }) => (
  <>
    <Navbar />
    {children}
  </>
);

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-black text-white font-sans">
        <Routes>

          {/* Public Route */}
          <Route path="/login" element={<Login />} />
          
          {/* Default redirect to courses */}
          <Route path="/" element={<Navigate to="/courses" />} />

          {/* Protected Routes */}
          <Route path="/courses" element={
            <ProtectedRoute>
              <Layout><CourseSelect /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/course/:courseId" element={
            <ProtectedRoute>
              <Layout><TopicList /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/ide/:problemId" element={
            <ProtectedRoute>
              <Layout><IDE /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/achievements" element={
            <ProtectedRoute>
              <Layout><Achievements /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/lens/:problemId" element={
            <ProtectedRoute>
              <Lens />
            </ProtectedRoute>
          } />

          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;