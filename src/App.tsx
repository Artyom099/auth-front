import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Dashboard } from './components/dashboard/Dashboard';
import { VKCallback } from './components/auth/VKCallback';
import { AuthForm } from './components/auth/AuthForm';

function AppRoutes() {
  const navigate = useNavigate();
  
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/auth" element={<AuthForm onLoginSuccess={() => navigate('/dashboard')} />} />
      <Route path="/auth/vk/callback" element={<VKCallback />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;