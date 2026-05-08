// src/components/Navbar.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, Store } from 'lucide-react';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="h-16 bg-surface border-b border-outline-variant flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10">
      {/* Left section: hamburger + system name */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 -ml-2 rounded-md text-on-surface hover:bg-secondary-container transition-colors"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>

        {/* Brand name (always visible) */}
        <div className="flex items-center gap-2 select-none">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <Store className="text-on-primary w-4 h-4" />
          </div>
          <span className="text-on-surface text-h3 font-bold tracking-tight hidden sm:inline">
            M.SANGWA SHOP
          </span>
        </div>
      </div>

      {/* Right: user */}
      <div className="relative ml-auto">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-3 focus:outline-none"
        >
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-medium">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="hidden md:inline text-body-md text-on-surface font-medium">
            {user?.email || 'User'}
          </span>
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-48 bg-surface border border-outline-variant rounded-xl shadow-lg py-1 z-20">
            <div className="px-4 py-2 text-label-sm text-secondary border-b border-outline-variant">
              {user?.email}
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-body-md text-error hover:bg-error-container/30 transition-colors"
            >
              <LogOut size={18} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;