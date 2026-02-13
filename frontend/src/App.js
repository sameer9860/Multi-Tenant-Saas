import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Pricing from './pages/Pricing';
import Leads from './pages/dashboard/crm/leads';
import CreateLead from './pages/dashboard/crm/CreateLead';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Basic Auth Guard Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/pricing" element={<Pricing />} />
        
        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/dashboard/crm/leads" element={
          <ProtectedRoute>
            <Leads />
          </ProtectedRoute>
        } />

        <Route path="/dashboard/crm/leads/create" element={
          <ProtectedRoute>
            <CreateLead />
          </ProtectedRoute>
        } />

        {/* Default Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
