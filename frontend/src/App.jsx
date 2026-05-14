import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import CreatePoll from './pages/CreatePoll';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import PublicPoll from './pages/PublicPoll';

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <section className="card narrow"><p>Loading…</p></section>;
  return <Navigate to={user ? '/dashboard' : '/login'} replace />;
}

export default function App() {
  return <Routes>
    <Route element={<Layout />}>
      <Route index element={<HomeRedirect />} />
      <Route path="login" element={<Login />} />
      <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="create" element={<ProtectedRoute><CreatePoll /></ProtectedRoute>} />
      <Route path="poll/:pollId" element={<PublicPoll />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>;
}
