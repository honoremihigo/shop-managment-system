import { useEffect, useState } from 'react';
import { Plus, Trash2, Shield, X } from 'lucide-react';
import { fetchAllUsers, createUser, deleteUser } from '../../services/admin/userService';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

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
    setError('');
    setSuccessMsg('');
  };

  const handleCreate = async () => {
    if (!email || !password) { setError('Email and password are required'); return; }
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

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch {
      setError('Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans antialiased">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-on-surface">User Management</h1>
          <p className="text-sm text-secondary mt-1">Manage employees and admin accounts</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary text-sm font-semibold rounded-lg hover:brightness-110 transition-all"
        >
          <Plus size={16} />
          Add user
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-outline-variant text-sm font-medium text-secondary">
          All Users
        </div>
        {users.length === 0 ? (
          <p className="text-sm text-secondary p-5">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-outline-variant">
                <tr>
                  <th className="text-left py-2.5 px-5 text-xs font-medium text-secondary uppercase tracking-wide">Email</th>
                  <th className="text-left py-2.5 px-5 text-xs font-medium text-secondary uppercase tracking-wide">Role</th>
                  <th className="text-right py-2.5 px-5 text-xs font-medium text-secondary uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-outline-variant/50 hover:bg-secondary-container/20 transition-colors">
                    <td className="py-3 px-5 text-on-surface">{user.email}</td>
                    <td className="py-3 px-5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'ADMIN'
                          ? 'bg-primary-container text-on-primary-container'
                          : 'bg-secondary-container text-on-secondary-container'
                      }`}>
                        <Shield size={11} />
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <button onClick={() => handleDelete(user.id)} className="text-error hover:text-error/70 transition-colors p-1" title="Delete user">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-surface border border-outline-variant rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-on-surface">New User</h2>
              <button onClick={closeModal} className="text-secondary hover:text-on-surface transition-colors p-1 rounded-lg hover:bg-secondary-container/30">
                <X size={18} />
              </button>
            </div>

            {/* Alerts */}
            {error && (
              <div className="mb-4 px-4 py-2.5 bg-error-container text-on-error-container text-sm rounded-lg">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="mb-4 px-4 py-2.5 bg-success-container text-on-success-container text-sm rounded-lg">
                {successMsg}
              </div>
            )}

            {/* Fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">Email address</label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-outline-variant rounded-lg text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">Password</label>
                <input
                  type="password"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  minLength={6}
                  className="w-full px-4 py-2.5 bg-background border border-outline-variant rounded-lg text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={closeModal} className="px-4 py-2.5 text-sm font-medium text-secondary hover:text-on-surface border border-outline-variant rounded-lg hover:bg-secondary-container/30 transition-all">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary text-sm font-semibold rounded-lg hover:brightness-110 disabled:opacity-60 transition-all"
              >
                <Plus size={16} />
                {submitting ? 'Creating...' : 'Create user'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagement;