import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProfilePage } from './components/ProfilePage';
import { Dashboard } from './components/Dashboard';
import { LoginPage } from './components/LoginPage';
import { Loader2 } from 'lucide-react';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userProfile, loading } = useAuth();
  const location = useLocation();
  
  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
      <Loader2 className="animate-spin text-cyan-500" size={48} />
    </div>
  );

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  
  // If user is logged in but has no username, they MUST go to /profile
  if (!userProfile?.username && location.pathname !== '/profile') {
    return <Navigate to="/profile" replace />;
  }

  // If user has a username and tries to go to /profile, they can, but usually they should go to dashboard
  // However, we allow them to edit their profile.
  
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/" element={<ProtectedRoute><Dashboard activeTab="dashboard" /></ProtectedRoute>} />
          <Route path="/tasks" element={<ProtectedRoute><Dashboard activeTab="tasks" /></ProtectedRoute>} />
          <Route path="/habits" element={<ProtectedRoute><Dashboard activeTab="habits" /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><Dashboard activeTab="calendar" /></ProtectedRoute>} />
          <Route path="/opportunities" element={<ProtectedRoute><Dashboard activeTab="opportunities" /></ProtectedRoute>} />
          <Route path="/community" element={<ProtectedRoute><Dashboard activeTab="community" /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
