// src/components/Sidebar.jsx
import { NavLink, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Store,
  X,
  Shield,
  ScanLine
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Regular navigation – available to all authenticated users
const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products',   icon: Package, label: 'Products' },
  { to: '/orders',     icon: ShoppingCart, label: 'Sales' },
  { to: '/stock',  icon: BarChart3, label: 'stock' },
  { to: '/purchases',  icon:ScanLine, label: 'Purchase' },
//   { to: '/settings',   icon: Settings, label: 'Settings' },
];

// Admin‑only links – will be appended only for ADMIN users
const adminItems = [
  { to: '/user-management', icon: Shield, label: 'User Management' },
];

const Sidebar = ({ open, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();

  // Build the final link list based on role
  const links =
    user?.role === 'ADMIN'
      ? [...navItems, /* divider */ null, ...adminItems]
      : navItems;

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Sidebar content – reused for both mobile overlay and desktop
  const content = (
    <div className="flex flex-col h-full bg-primary text-on-primary">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-on-primary/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-on-primary/10 flex items-center justify-center">
            <Store className="text-on-primary w-5 h-5" />
          </div>
          <span className="text-h2 font-bold tracking-tight">ShopDesk</span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1 rounded-md hover:bg-on-primary/10 transition-colors"
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {links.map((item, index) => {
          // Render divider + admin section label
          if (item === null) {
            return (
              <div key="divider" className="pt-4 pb-1">
                <div className="border-t border-on-primary/10 mb-3" />
                <p className="px-3 text-xs font-semibold uppercase tracking-wider text-on-primary/40">
                  Admin
                </p>
              </div>
            );
          }

          const { to, icon: Icon, label } = item;
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-md font-medium transition-colors ${
                  isActive
                    ? 'bg-on-primary/10 text-on-primary'
                    : 'text-on-primary/70 hover:bg-on-primary/5 hover:text-on-primary'
                }`
              }
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-on-primary/10 text-label-sm text-on-primary/50">
        v1.0.0 · ShopDesk
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`lg:hidden fixed inset-0 z-40 transition-all duration-300 ${
          open ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <div
          className={`absolute left-0 top-0 h-full w-64 transition-transform duration-300 ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {content}
        </div>
      </div>

      {/* Desktop permanent sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:flex-shrink-0 lg:h-screen">
        {content}
      </aside>
    </>
  );
};

export default Sidebar;