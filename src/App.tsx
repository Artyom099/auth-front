import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './components/dashboard/Dashboard';
import { VKCallback } from './components/auth/VKCallback';
import { AuthForm } from './components/auth/AuthForm';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/auth" element={<AuthForm onLoginSuccess={() => {}} />} />
        <Route path="/auth/vk/callback" element={<VKCallback />} />
      </Routes>
    </Router>
  );
}

export default App;