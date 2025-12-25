import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import Products from './pages/admin/Products';
import Production from './pages/admin/Production';
import Distribution from './pages/admin/Distribution';
import StockOpname from './pages/admin/StockOpname';
import Returns from './pages/admin/Returns';
import Rejects from './pages/admin/Rejects';
import Reports from './pages/admin/Reports';
import GPSTracking from './pages/admin/GPSTracking';
import UserManagement from './pages/admin/UserManagement';
import AdminSettings from './pages/admin/Settings';

// Rider Pages
import RiderPOS from './pages/rider/POS';
import RiderLeaderboard from './pages/rider/Leaderboard';
import RiderReports from './pages/rider/Reports';
import RiderSettings from './pages/rider/Settings';

// Protected Route Component
function ProtectedRoute({ children, requiredRole }) {
  const { user, loading, isAdmin, isSuperAdmin, isRider } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role-based access control
  if (requiredRole === 'admin' && !isAdmin) {
    return <Navigate to="/rider" replace />;
  }

  if (requiredRole === 'super_admin' && !isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }

  if (requiredRole === 'rider' && !isRider && !isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

// Public Route (redirect if logged in)
function PublicRoute({ children }) {
  const { user, loading, isAdmin, isRider } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    if (isAdmin) {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/rider" replace />;
  }

  return children;
}

function AppRoutes() {
  const { user, isAdmin, isRider } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/products" element={<ProtectedRoute requiredRole="admin"><Products /></ProtectedRoute>} />
      <Route path="/admin/production" element={<ProtectedRoute requiredRole="admin"><Production /></ProtectedRoute>} />
      <Route path="/admin/distribution" element={<ProtectedRoute requiredRole="admin"><Distribution /></ProtectedRoute>} />
      <Route path="/admin/stock-opname" element={<ProtectedRoute requiredRole="admin"><StockOpname /></ProtectedRoute>} />
      <Route path="/admin/returns" element={<ProtectedRoute requiredRole="admin"><Returns /></ProtectedRoute>} />
      <Route path="/admin/rejects" element={<ProtectedRoute requiredRole="admin"><Rejects /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute requiredRole="admin"><Reports /></ProtectedRoute>} />
      <Route path="/admin/gps" element={<ProtectedRoute requiredRole="admin"><GPSTracking /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute requiredRole="super_admin"><UserManagement /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute requiredRole="admin"><AdminSettings /></ProtectedRoute>} />

      {/* Rider Routes */}
      <Route path="/rider" element={<ProtectedRoute requiredRole="rider"><RiderPOS /></ProtectedRoute>} />
      <Route path="/rider/leaderboard" element={<ProtectedRoute requiredRole="rider"><RiderLeaderboard /></ProtectedRoute>} />
      <Route path="/rider/reports" element={<ProtectedRoute requiredRole="rider"><RiderReports /></ProtectedRoute>} />
      <Route path="/rider/settings" element={<ProtectedRoute requiredRole="rider"><RiderSettings /></ProtectedRoute>} />

      {/* Default Route */}
      <Route path="/" element={
        user ? (
          isAdmin ? <Navigate to="/admin" replace /> : <Navigate to="/rider" replace />
        ) : (
          <Navigate to="/login" replace />
        )
      } />

      {/* 404 Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <AppRoutes />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
