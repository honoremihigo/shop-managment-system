import { useEffect, useState, useMemo } from 'react';
import { Plus, Trash2, Shield, User, X, Eye, EyeOff, Search, Users, UserCheck, AlertTriangle } from 'lucide-react';
import { fetchAllUsers, createUser, deleteUser } from '../../services/admin/userService';

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

const StatCard = ({ icon: Icon, label, value, accent }) => (
  <div className="flex items-center gap-3 bg-surface border border-outline-variant rounded-xl px-4 py-3.5 shadow-sm">
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${accent}`}>
      <Icon size={16} />
    </div>
    <div>
      <p className="text-[11px] text-secondary font-medium">{label}</p>
      <p className="text-[18px] font-bold text-on-surface leading-tight">{value}</p>
    </div>
  </div>
);

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // --- NEW: delete confirmation state ---
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null); // { id, email }

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

  useEffect(() => { loadUsers(); }, []);

  const openModal = () => setModalOpen(true);

  const closeModal = () => {
    setModalOpen(false);
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setError('');
    setSuccessMsg('');
  };

  // --- NEW: open/close delete modal ---
  const openDeleteModal = (user) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const handleCreate = async () => {
    if (!email || !password) { setError('Email and password are required'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setSubmitting(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await createUser(email, password);
      if (res.success) {
        setSuccessMsg('User created successfully');
        loadUsers();
        setTimeout(closeModal, 900);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating user');
    } finally {
      setSubmitting(false);
    }
  };

  // --- UPDATED: no more window.confirm ---
  const handleDelete = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await deleteUser(userToDelete.id);
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      closeDeleteModal();
    } catch {
      setError('Failed to delete user');
      closeDeleteModal();
    } finally {
      setDeleting(false);
    }
  };

  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'ADMIN').length;
  const regularCount = users.filter(u => u.role === 'USER').length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q)
    );
  }, [users, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 font-sans antialiased">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-on-surface tracking-tight">User Management</h1>
          <p className="text-xs text-secondary mt-0.5">Manage employee and admin accounts</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-on-primary text-xs font-semibold rounded-lg hover:brightness-110 transition-all"
        >
          <Plus size={14} />
          Add user
        </button>
      </div>

      {/* Error banner */}
      {error && !modalOpen && (
        <div className="px-4 py-2.5 bg-error-container text-on-error-container text-xs rounded-lg flex items-center justify-between">
          {error}
          <button onClick={() => setError('')} className="opacity-60 hover:opacity-100"><X size={13} /></button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Users} label="Total Users" value={totalUsers} accent="bg-primary/10 text-primary" />
        <StatCard icon={Shield} label="Admins" value={adminCount} accent="bg-primary-container text-on-primary-container" />
        <StatCard icon={UserCheck} label="Regular Users" value={regularCount} accent="bg-secondary-container text-on-secondary-container" />
      </div>

      {/* Table */}
      <div className="bg-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-outline-variant flex items-center justify-between gap-3">
          <span className="text-[11px] font-semibold text-secondary uppercase tracking-wide shrink-0">All accounts</span>
          <div className="relative max-w-[240px] w-full">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
            <input
              type="text"
              placeholder="Search by email or role..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 bg-background border border-outline-variant rounded-lg text-[12px] text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface">
                <X size={11} />
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-2 text-secondary">
            <User size={28} strokeWidth={1.5} className="opacity-30" />
            <p className="text-xs">
              {search ? `No users matching "${search}"` : 'No users found. Add one to get started.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-outline-variant">
                <tr>
                  <th className="text-left py-2.5 px-4 text-[10.5px] font-semibold text-secondary uppercase tracking-wide">User</th>
                  <th className="text-left py-2.5 px-4 text-[10.5px] font-semibold text-secondary uppercase tracking-wide">Role</th>
                  <th className="text-right py-2.5 px-4 text-[10.5px] font-semibold text-secondary uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => {
                  const { bg, text } = getAvatarColor(user.email);
                  return (
                    <tr key={user.id} className="border-b border-outline-variant/40 hover:bg-secondary-container/15 transition-colors last:border-0">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${bg} ${text}`}>
                            {getInitials(user.email)}
                          </div>
                          <span className="text-on-surface text-[12.5px]">{user.email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                          user.role === 'ADMIN'
                            ? 'bg-primary-container text-on-primary-container'
                            : 'bg-secondary-container text-on-secondary-container'
                        }`}>
                          <Shield size={10} />
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {/* UPDATED: opens modal instead of window.confirm */}
                        <button
                          onClick={() => openDeleteModal(user)}
                          className="text-outline hover:text-error hover:bg-error-container/50 transition-all p-1.5 rounded-md"
                          title="Delete user"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="px-4 py-2.5 border-t border-outline-variant/50 text-[11px] text-secondary">
            Showing {filtered.length} of {totalUsers} user{totalUsers !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-surface border border-outline-variant rounded-2xl shadow-2xl w-full max-w-[520px] mx-4 overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-start justify-between px-6 pt-6 pb-0">
              <div>
                <h2 className="text-[16px] font-semibold text-on-surface tracking-tight">New account</h2>
                <p className="text-[12px] text-secondary mt-0.5">Fill in the details to create a user</p>
              </div>
              <button
                onClick={closeModal}
                className="text-secondary hover:text-on-surface bg-secondary-container/30 hover:bg-secondary-container/60 transition-all p-1.5 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-6 pt-4">
              {error && (
                <div className="px-4 py-2.5 bg-error-container text-on-error-container text-[12px] rounded-lg">{error}</div>
              )}
              {successMsg && (
                <div className="px-4 py-2.5 bg-success-container text-on-success-container text-[12px] rounded-lg">{successMsg}</div>
              )}
            </div>

            <div className="px-6 pt-4 pb-0 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-secondary uppercase tracking-wide mb-1.5">Email address</label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-outline-variant rounded-lg text-[13px] text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-secondary uppercase tracking-wide mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    minLength={6}
                    className="w-full pl-4 pr-11 py-3 bg-background border border-outline-variant rounded-lg text-[13px] text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p className="text-[11px] text-secondary mt-1.5">Password must be at least 6 characters long.</p>
              </div>
            </div>

            <div className="mx-6 mt-5 border-t border-outline-variant/50" />

            <div className="flex gap-2.5 justify-end px-6 py-5">
              <button
                onClick={closeModal}
                className="px-5 py-2.5 text-[13px] font-medium text-secondary border border-outline-variant rounded-lg hover:bg-secondary-container/30 hover:text-on-surface transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-on-primary text-[13px] font-semibold rounded-lg hover:brightness-110 disabled:opacity-55 transition-all"
              >
                <Plus size={15} />
                {submitting ? 'Creating...' : 'Create user'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- NEW: Delete Confirmation Modal --- */}
      {deleteModalOpen && userToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && closeDeleteModal()}
        >
          <div className="bg-surface border border-outline-variant rounded-2xl shadow-2xl w-full max-w-[420px] mx-4 overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200">

            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-6 pb-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-error-container flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={16} className="text-error" />
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-on-surface tracking-tight">Delete account</h2>
                  <p className="text-[12px] text-secondary mt-0.5">This action cannot be undone</p>
                </div>
              </div>
              <button
                onClick={closeDeleteModal}
                className="text-secondary hover:text-on-surface bg-secondary-container/30 hover:bg-secondary-container/60 transition-all p-1.5 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 pt-5 pb-0">
              <p className="text-[13px] text-on-surface leading-relaxed">
                You are about to permanently delete{' '}
                <span className="font-semibold text-on-surface">{userToDelete.email}</span>.
                Their account and all associated data will be removed.
              </p>
            </div>

            <div className="mx-6 mt-5 border-t border-outline-variant/50" />

            {/* Footer */}
            <div className="flex gap-2.5 justify-end px-6 py-5">
              <button
                onClick={closeDeleteModal}
                disabled={deleting}
                className="px-5 py-2.5 text-[13px] font-medium text-secondary border border-outline-variant rounded-lg hover:bg-secondary-container/30 hover:text-on-surface transition-all disabled:opacity-55"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-error text-on-error text-[13px] font-semibold rounded-lg hover:brightness-110 disabled:opacity-55 transition-all"
              >
                <Trash2 size={14} />
                {deleting ? 'Deleting...' : 'Delete user'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagement;