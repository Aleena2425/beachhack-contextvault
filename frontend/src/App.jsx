import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import RegisterPage from './pages/RegisterPage';
import AgentDash from './pages/AgentDash';
import ManagerDashboard from './pages/ManagerDashboard';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  if (!token || !user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

// Smart redirect based on role
const RoleBasedRedirect = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user?.role === 'manager') return <Navigate to="/manager" replace />;
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<RegisterPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['agent', 'manager']}><AgentDash /></ProtectedRoute>} />
        <Route path="/manager" element={<ProtectedRoute allowedRoles={['manager']}><ManagerDashboard /></ProtectedRoute>} />
        <Route path="/" element={<RoleBasedRedirect />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
export default App;