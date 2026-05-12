import { useEffect, useState, useMemo } from 'react';
import {
  Plus,
  Search,
  X,
  Trash2,
  Shield,
  Users,
  UserCheck,
  AlertTriangle,
  Eye,
  EyeOff,
  User,
} from 'lucide-react';
import { fetchAllUsers, createUser, deleteUser } from '../../services/admin/userService';
import { useAuth } from '../../context/AuthContext';

/* ─── Helpers ─── */
const getInitials = (email) => {
  const parts = email.split('@')[0].split(/[._-]/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : email.slice(0, 2).toUpperCase();
};

const AVATAR_COLORS = [
  { bg: 'bg-primary-container', text: 'text-on-primary-container' },
  { bg: 'bg-secondary-container', text: 'text-on-secondary-container' },
  { bg: 'bg-tertiary-container', text: 'text-on-tertiary-container' },
];

const getAvatarColor = (email) => AVATAR_COLORS[email.charCodeAt(0) % AVATAR_COLORS.length];

/* ─── Stat Card ─── */
const StatCard = ({ icon: Icon, label, value, accent, iconColor, valueColor }) => (
  <div className="flex items-center gap-2.5 bg-surface border border-outline-variant rounded-xl px-3 py-2.5 shadow-sm">
    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${accent}`}>
      <Icon size={13} className={iconColor} />
    </div>
    <div className="min-w-0">
      <p className="text-[9.5px] text-secondary font-semibold uppercase tracking-wide leading-none mb-0.5 truncate">
        {label}
      </p>
      <p className={`text-[17px] font-bold leading-tight ${valueColor || 'text-on-surface'}`}>
        {value}
      </p>
    </div>
  </div>
);

/* ─── Bottom Sheet / Modal wrapper ─── */
const Sheet = ({ open, onClose, children, maxWidth = 'max-w-[520px]' }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`
          w-full ${maxWidth} bg-surface border border-outline-variant shadow-2xl
          rounded-t-3xl sm:rounded-2xl
          animate-in fade-in slide-in-from-bottom-4 duration-200
          max-h-[92vh] overflow-y-auto
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-0 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-outline-variant" />
        </div>
        {children}
      </div>
    </div>
  );
};

/* ─── Field wrapper ─── */
const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="block text-[10px] font-semibold text-secondary uppercase tracking-widest">
      {label}
    </label>
    {children}
  </div>
);

const inputCls =
  'w-full px-3.5 py-2.5 bg-background border border-outline-variant rounded-xl text-[13px] text-on-surface outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all';

const UserManagement = () => {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');

  /* Create modal */
  const [createOpen, setCreateOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  /* Delete modal */
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadUsers = async () => {
    try {
      const res = await fetchAllUsers();
      if (res.success) setUsers(res.data.users);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  /* ── Stats ── */
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const regularCount = users.filter((u) => u.role === 'USER').length;

  /* ── Search filter ── */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q)
    );
  }, [users, search]);

  /* ── Create handlers ── */
  const openCreate = () => {
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setCreateError('');
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!email || !password) {
      setCreateError('Email and password are required');
      return;
    }
    if (password.length < 6) {
      setCreateError('Password must be at least 6 characters');
      return;
    }
    setCreateLoading(true);
    setCreateError('');
    try {
      const res = await createUser(email, password);
      if (res.success) {
        setSuccessMsg('User created successfully');
        setCreateOpen(false);
        loadUsers();
      }
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Error creating user');
    } finally {
      setCreateLoading(false);
    }
  };

  /* ── Delete handlers ── */
  const openDelete = (usr) => {
    setUserToDelete(usr);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteUser(userToDelete.id);
      setSuccessMsg('User deleted');
      setDeleteOpen(false);
      loadUsers();
    } catch {
      setError('Failed to delete user');
      setDeleteOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  /* Auto‑dismiss success message */
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(''), 3000);
    return () => clearTimeout(t);
  }, [successMsg]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-7 h-7 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative space-y-4 font-sans antialiased pb-24 sm:pb-6">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[17px] font-bold text-on-surface tracking-tight">User Management</h1>
          <p className="text-[11px] text-secondary mt-0.5">{totalUsers} total</p>
        </div>
        <button
          onClick={openCreate}
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-primary text-on-primary text-[12px] font-semibold rounded-xl hover:brightness-110 transition-all shadow-sm"
        >
          <Plus size={13} />
          Add user
        </button>
      </div>

      {/* ─── Toast banners ─── */}
      {error && (
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-error-container text-on-error-container text-[11.5px] rounded-xl">
          <span className="flex items-center gap-2"><AlertTriangle size={12} />{error}</span>
          <button onClick={() => setError('')}><X size={12} /></button>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-primary-container text-on-primary-container text-[11.5px] rounded-xl">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')}><X size={12} /></button>
        </div>
      )}

      {/* ─── Stats ─── */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard
          icon={Users}
          label="Total"
          value={totalUsers}
          accent="bg-primary/10"
          iconColor="text-primary"
        />
        <StatCard
          icon={Shield}
          label="Admins"
          value={adminCount}
          accent="bg-primary-container/60"
          iconColor="text-on-primary-container"
        />
        <StatCard
          icon={UserCheck}
          label="Regular"
          value={regularCount}
          accent="bg-secondary-container/60"
          iconColor="text-on-secondary-container"
        />
      </div>

      {/* ─── Search ─── */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
        <input
          type="text"
          placeholder="Search by email or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8.5 pr-8 py-2.5 bg-surface border border-outline-variant rounded-xl text-[12.5px] text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          style={{ paddingLeft: '2.1rem' }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* ─── User list ─── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 gap-3 text-secondary bg-surface border border-outline-variant rounded-2xl">
          <User size={32} strokeWidth={1.2} className="opacity-25" />
          <p className="text-[12.5px]">
            {search ? `No users matching "${search}"` : 'No users found. Add one to get started.'}
          </p>
          <button onClick={openCreate} className="text-[11.5px] text-primary font-semibold hover:underline">
            Add the first user →
          </button>
        </div>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="sm:hidden space-y-1.5">
            {filtered.map((user) => {
              const { bg, text } = getAvatarColor(user.email);
              return (
                <div
                  key={user.id}
                  className="bg-surface border border-outline-variant rounded-xl px-3.5 py-3 flex items-center gap-3"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${bg} ${text}`}
                  >
                    {getInitials(user.email)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[12.5px] text-on-surface truncate">
                      {user.email}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold mt-1 ${
                        user.role === 'ADMIN'
                          ? 'bg-primary-container text-on-primary-container'
                          : 'bg-secondary-container text-on-secondary-container'
                      }`}
                    >
                      <Shield size={10} />
                      {user.role}
                    </span>
                  </div>
                  <button
                    onClick={() => openDelete(user)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-secondary hover:text-error hover:bg-error-container/40 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block bg-surface border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-outline-variant">
              <span className="text-[10px] font-semibold text-secondary uppercase tracking-widest">
                All accounts
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b border-outline-variant bg-background/50">
                  <tr>
                    <th className="text-left py-2.5 px-4 text-[10px] font-semibold text-secondary uppercase tracking-wide">
                      User
                    </th>
                    <th className="text-left py-2.5 px-4 text-[10px] font-semibold text-secondary uppercase tracking-wide">
                      Role
                    </th>
                    <th className="text-right py-2.5 px-4 text-[10px] font-semibold text-secondary uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => {
                    const { bg, text } = getAvatarColor(user.email);
                    return (
                      <tr
                        key={user.id}
                        className="border-b border-outline-variant/40 last:border-0 hover:bg-secondary-container/10 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${bg} ${text}`}
                            >
                              {getInitials(user.email)}
                            </div>
                            <span className="text-on-surface font-medium text-[12.5px]">
                              {user.email}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                              user.role === 'ADMIN'
                                ? 'bg-primary-container text-on-primary-container'
                                : 'bg-secondary-container text-on-secondary-container'
                            }`}
                          >
                            <Shield size={10} />
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openDelete(user)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-secondary hover:text-error hover:bg-error-container/40 transition-all"
                            title="Delete user"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 border-t border-outline-variant/50 text-[10.5px] text-secondary">
              Showing {filtered.length} of {totalUsers} user{totalUsers !== 1 ? 's' : ''}
            </div>
          </div>
        </>
      )}

      {/* ─── Mobile FAB ─── */}
      <button
        onClick={openCreate}
        className="sm:hidden fixed bottom-6 right-5 z-40 w-12 h-12 rounded-full bg-primary text-on-primary shadow-lg shadow-primary/30 flex items-center justify-center hover:brightness-110 active:scale-95 transition-all"
      >
        <Plus size={20} />
      </button>

      {/* ══════════ CREATE USER SHEET ══════════ */}
      <Sheet open={createOpen} onClose={() => setCreateOpen(false)}>
        <div className="px-5 pt-5 pb-0 flex items-start justify-between">
          <div>
            <h2 className="text-[15px] font-bold text-on-surface">New account</h2>
            <p className="text-[11.5px] text-secondary mt-0.5">Fill in the details to create a user</p>
          </div>
          <button
            onClick={() => setCreateOpen(false)}
            className="w-7 h-7 flex items-center justify-center rounded-xl text-secondary hover:bg-secondary-container/40 transition-all"
          >
            <X size={15} />
          </button>
        </div>

        {createError && (
          <div className="mx-5 mt-3.5 px-3.5 py-2.5 bg-error-container text-on-error-container text-[11.5px] rounded-xl flex items-center gap-2">
            <AlertTriangle size={11} />{createError}
          </div>
        )}

        <div className="px-5 pt-4 space-y-3.5">
          <Field label="Email address">
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Password">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls + ' pr-10'}
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <p className="text-[11px] text-secondary mt-1.5">Password must be at least 6 characters long.</p>
          </Field>
        </div>

        <div className="mx-5 mt-5 border-t border-outline-variant/50" />

        <div className="flex gap-2.5 justify-end px-5 py-5">
          <button
            onClick={() => setCreateOpen(false)}
            className="px-5 py-2.5 text-[13px] font-medium text-secondary border border-outline-variant rounded-lg hover:bg-secondary-container/30 hover:text-on-surface transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={createLoading}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-on-primary text-[13px] font-semibold rounded-lg hover:brightness-110 disabled:opacity-55 transition-all"
          >
            <Plus size={15} />
            {createLoading ? 'Creating...' : 'Create user'}
          </button>
        </div>
      </Sheet>

      {/* ══════════ DELETE CONFIRMATION SHEET ══════════ */}
      <Sheet open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <div className="px-5 pt-5 pb-0 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-error-container flex items-center justify-center flex-shrink-0">
              <Trash2 size={15} className="text-error" />
            </div>
            <div>
              <h2 className="text-[14.5px] font-bold text-on-surface">Delete account?</h2>
              <p className="text-[11px] text-secondary mt-0.5">This cannot be undone</p>
            </div>
          </div>
          <button
            onClick={() => setDeleteOpen(false)}
            className="w-7 h-7 flex items-center justify-center rounded-xl text-secondary hover:bg-secondary-container/40 transition-all"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-5 pt-4 pb-0">
          <div className="bg-error-container/30 border border-error-container rounded-xl px-3.5 py-3 text-[12.5px] text-on-surface">
            You're about to permanently delete{' '}
            <span className="font-bold">{userToDelete?.email}</span>.
            Their account and all associated data will be removed.
          </div>
        </div>

        <div className="mx-5 mt-5 border-t border-outline-variant/50" />

        <div className="flex gap-2.5 justify-end px-5 py-5">
          <button
            onClick={() => setDeleteOpen(false)}
            disabled={deleteLoading}
            className="px-5 py-2.5 text-[13px] font-medium text-secondary border border-outline-variant rounded-lg hover:bg-secondary-container/30 hover:text-on-surface transition-all disabled:opacity-55"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteLoading}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-error text-on-error text-[13px] font-semibold rounded-lg hover:brightness-110 disabled:opacity-55 transition-all"
          >
            <Trash2 size={14} />
            {deleteLoading ? 'Deleting...' : 'Delete user'}
          </button>
        </div>
      </Sheet>
    </div>
  );
};

export default UserManagement;