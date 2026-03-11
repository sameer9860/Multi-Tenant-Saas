import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Pricing from './pages/Pricing';
import Leads from './pages/dashboard/crm/leads';
import CreateLead from './pages/dashboard/crm/CreateLead';
import Pipeline from './pages/dashboard/crm/Pipeline';
import Clients from './pages/dashboard/crm/Clients';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ActivityLog from './pages/dashboard/crm/ActivityLog';
import InvoiceList from './pages/InvoiceList';
import InvoiceCreate from './pages/InvoiceCreate';
import InvoiceEdit from './pages/InvoiceEdit';
import InvoicePrint from './pages/InvoicePrint';
import InvoiceDetail from './pages/InvoiceDetail';
import Team from './pages/dashboard/accounts/Team';
import CreateMember from './pages/dashboard/accounts/CreateMember';
import Expenses from './pages/dashboard/crm/Expenses';
import Reminders from './pages/dashboard/crm/Reminders';
import CustomerDetail from './pages/customers/CustomerDetail';
import CustomerList from './pages/customers/CustomerList';
import Reports from './pages/Reports';
import VATSummary from './pages/VATSummary';
import Employees from './pages/dashboard/hr/Employees';
import CreateEmployee from './pages/dashboard/hr/CreateEmployee';
import Departments from './pages/dashboard/hr/Departments';
import Roles from './pages/dashboard/hr/Roles';
import Attendance from './pages/dashboard/hr/Attendance';
import LeaveRequests from './pages/dashboard/hr/LeaveRequests';
import Payroll from './pages/dashboard/hr/Payroll';
import SalaryAdvance from './pages/dashboard/hr/SalaryAdvance';

// Basic Auth Guard Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const loginTime = parseInt(localStorage.getItem('login_time') || '0', 10);
  const maxAge = 15 * 60 * 1000; // 15 minutes

  // if there's no token or the login has aged past maxAge, force logout
  if (!token || (loginTime && Date.now() - loginTime > maxAge)) {
    localStorage.removeItem('token');
    localStorage.removeItem('login_time');
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

        <Route path="/dashboard/crm/clients" element={
          <ProtectedRoute>
            <Clients />
          </ProtectedRoute>
        } />

        <Route path="/dashboard/crm/activity" element={
          <ProtectedRoute>
            <ActivityLog />
          </ProtectedRoute>
        } />

        <Route path="/dashboard/crm/reminders" element={
          <ProtectedRoute>
            <Reminders />
          </ProtectedRoute>
        } />

        <Route path="/dashboard/crm/expenses" element={
          <ProtectedRoute>
            <Expenses />
          </ProtectedRoute>
        } />

        <Route path="/dashboard/team" element={
          <ProtectedRoute>
            <Team />
          </ProtectedRoute>
        } />

        <Route path="/dashboard/team/create" element={
          <ProtectedRoute>
            <CreateMember />
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

        <Route path="/dashboard/invoices/:id/edit" element={
          <ProtectedRoute>
            <InvoiceEdit />
          </ProtectedRoute>
        } />

        <Route path="/dashboard/invoices/:id/print" element={
          <ProtectedRoute>
            <InvoicePrint />
          </ProtectedRoute>
        } />

        <Route path="/dashboard/invoices/:id" element={
          <ProtectedRoute>
            <InvoiceDetail />
          </ProtectedRoute>
        } />

        <Route path="/dashboard/customers/:id" element={
          <ProtectedRoute>
            <CustomerDetail />
          </ProtectedRoute>
        } />

        <Route path="/dashboard/customers" element={
          <ProtectedRoute>
            <CustomerList />
          </ProtectedRoute>
        } />

        <Route path="/dashboard/reports" element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        } />

        <Route path="/dashboard/reports/vat" element={
          <ProtectedRoute>
            <VATSummary />
          </ProtectedRoute>
        } />

        {/* HR Routes */}
        <Route path="/dashboard/hr/employees" element={
          <ProtectedRoute>
            <Employees />
          </ProtectedRoute>
        } />
        
        <Route path="/dashboard/hr/employees/create" element={
          <ProtectedRoute>
             <CreateEmployee />
          </ProtectedRoute>
        } />

        <Route path="/dashboard/hr/departments" element={
          <ProtectedRoute>
            <Departments />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/hr/roles" element={
          <ProtectedRoute>
            <Roles />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/hr/attendance" element={
          <ProtectedRoute>
            <Attendance />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/hr/leave" element={
          <ProtectedRoute>
            <LeaveRequests />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/hr/payroll" element={
          <ProtectedRoute>
            <Payroll />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/hr/salary-advance" element={
          <ProtectedRoute>
            <SalaryAdvance />
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
