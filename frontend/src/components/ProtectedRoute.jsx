import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <section className="card narrow"><p>Checking your session…</p></section>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
