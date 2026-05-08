// components/ProtectedRoute.jsx
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loading from '../Loading/Loading';
import { useEffect } from 'react';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // If user already logged in, redirect immediately
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);


  // While the initial auth check is running, show a loader
  if (loading) {
    return Loading
  }

  // If no user is logged in, redirect to the login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // User is authenticated – render the requested page
  return children;
};

export default ProtectedRoute;