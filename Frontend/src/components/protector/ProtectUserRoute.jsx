import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loader from '../Loading/Loading';   // your actual loading spinner

const ProtectedRoute = ({ children }) => {
  const { user, loading: isLoading } = useAuth();   // alias to avoid naming clash

  // 1. Still checking auth → show spinner
  if (isLoading) return <Loader />;

  // 2. Not logged in → send to login
  if (!user) return <Navigate to="/login" replace />;

  // 3. Logged in → render the child page
  return children;
};

export default ProtectedRoute;