import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner } from './Feedback.jsx';

// Convenience only: the server independently rejects admin API calls without a valid session.
export default function ProtectedRoute({ children }) {
  const { admin, loading } = useAuth();
  if (loading) return <Spinner label="Checking your session..." />;
  return admin ? children : <Navigate to="/admin/login" replace />;
}
