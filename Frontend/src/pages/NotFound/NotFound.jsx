// src/pages/NotFound/NotFound.jsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const goBack = () => navigate(-1);
  const goHome = () => navigate(user ? '/dashboard' : '/login');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 font-sans antialiased">
      <div className="text-center max-w-md w-full">
        {/* Large 404 */}
        <p className="text-[8rem] leading-none font-bold text-primary/10 select-none">
          404
        </p>

        {/* Heading */}
        <h1 className="text-h1 font-bold text-on-surface mt-4 mb-2">
          Page not found
        </h1>

        {/* Description */}
        <p className="text-body-lg text-secondary mb-8">
          Sorry, the page you’re looking for doesn’t exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={goBack}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-surface border border-outline hover:bg-secondary-container text-on-surface text-label-md font-medium rounded-xl transition-all active:scale-[0.98]"
          >
            <ArrowLeft size={18} />
            Go back
          </button>
          <button
            onClick={goHome}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-on-primary text-label-md font-medium rounded-xl shadow-md hover:brightness-110 active:scale-[0.98] transition-all"
            style={{ boxShadow: '0 4px 14px rgba(15,23,42,0.25)' }}
          >
            <Home size={18} />
            {user ? 'Dashboard' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}