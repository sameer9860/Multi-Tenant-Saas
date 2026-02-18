import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Pricing from './pages/Pricing';
import Leads from './pages/dashboard/crm/leads';
import CreateLead from './pages/dashboard/crm/CreateLead';
import Pipeline from './pages/dashboard/crm/Pipeline';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ActivityLog from './pages/dashboard/crm/ActivityLog';
import InvoiceList from './pages/InvoiceList';
import InvoiceCreate from './pages/InvoiceCreate';
import InvoicePrint from './pages/InvoicePrint';

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

        <Route path="/dashboard/crm/pipeline" element={
          <ProtectedRoute>
            <Pipeline />
          </ProtectedRoute>
        } />

        <Route path="/dashboard/crm/activity" element={
          <ProtectedRoute>
            <ActivityLog />
          </ProtectedRoute>
        } />

        {/* Invoice Routes */}
        <Route path="/dashboard/invoices" element={
          <ProtectedRoute>
            <InvoiceList />
          </ProtectedRoute>
        } />

        <Route path="/dashboard/invoices/create" element={
          <ProtectedRoute>
            <InvoiceCreate />
          </ProtectedRoute>
        } />

        <Route path="/dashboard/invoices/:id/print" element={
          <ProtectedRoute>
            <InvoicePrint />
          </ProtectedRoute>
        } />

        <Route path="/dashboard/invoices/:id" element={
          <ProtectedRoute>
            <InvoicePrint />
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
