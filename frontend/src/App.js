import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Pricing from './pages/Pricing';
import Leads from './pages/dashboard/crm/leads';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/pricing" />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/login" element={<div className="p-10">Login page (to be implemented)</div>} />
        <Route path="/dashboard" element={<div className="p-10">Dashboard (to be implemented)</div>} />
        <Route path="/dashboard/crm/leads" element={<Leads />} />
      </Routes>
    </Router>
  );
}

export default App;
