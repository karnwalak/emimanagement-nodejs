import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ReactNode } from 'react';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import SocialCallback from './pages/auth/SocialCallback';

// App Pages
import Dashboard from './pages/Dashboard';
import LoanList from './pages/loans/LoanList';
import LoanCreate from './pages/loans/LoanCreate';
import LoanShow from './pages/loans/LoanShow';
import LoanEdit from './pages/loans/LoanEdit';
import ProfileEdit from './pages/profile/ProfileEdit';

// Public Pages
import Welcome from './pages/Welcome';
import Support from './pages/Support';

function PrivateRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function GuestRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  return !user ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Welcome />} />
      <Route path="/support" element={<Support />} />

      {/* Guest-only (redirect to dashboard if logged in) */}
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
      <Route path="/reset-password" element={<GuestRoute><ResetPassword /></GuestRoute>} />

      {/* OAuth callback (public — processes token from URL) */}
      <Route path="/auth/social-callback" element={<SocialCallback />} />

      {/* Protected */}
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/loans" element={<PrivateRoute><LoanList /></PrivateRoute>} />
      <Route path="/loans/create" element={<PrivateRoute><LoanCreate /></PrivateRoute>} />
      <Route path="/loans/:id" element={<PrivateRoute><LoanShow /></PrivateRoute>} />
      <Route path="/loans/:id/edit" element={<PrivateRoute><LoanEdit /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><ProfileEdit /></PrivateRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
