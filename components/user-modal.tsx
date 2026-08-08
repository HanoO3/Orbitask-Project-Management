'use client';

import { useState, useEffect } from 'react';
import { createUser, updateUser } from '@/lib/actions/users';
import { X } from 'lucide-react';

type User = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'PROJECT_MANAGER' | 'TEAM_MEMBER';
};

export function UserModal({
  isOpen,
  onClose,
  editingUser,
}: {
  isOpen: boolean;
  onClose: () => void;
  editingUser: User | null;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'PROJECT_MANAGER' | 'TEAM_MEMBER'>('TEAM_MEMBER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      if (editingUser) {
        setName(editingUser.name);
        setEmail(editingUser.email);
        setPassword('');
        setRole(editingUser.role);
      } else {
        setName('');
        setEmail('');
        setPassword('');
        setRole('TEAM_MEMBER');
      }
      setError('');
    }, 0);
    return () => clearTimeout(t);
  }, [editingUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.');
      return;
    }

    if (!editingUser && (!password || password.length < 6)) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');

    const payload = {
      name,
      email,
      role,
      ...(password ? { password } : {}),
    };

    const res = editingUser
      ? await updateUser(editingUser.id, payload)
      : await createUser({ name, email, password: password!, role });

    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto text-[var(--text-primary)] transition-colors">
        <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--border-color)]">
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            {editingUser ? 'Edit User' : 'Create New User'}
          </h2>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs rounded-xl">{error}</div>}

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Johnson"
              className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#5B82FF]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@company.com"
              className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#5B82FF]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">
              {editingUser ? 'Password (leave blank to keep unchanged)' : 'Password *'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#5B82FF]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Role</label>
            <select
              value={role}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRole(e.target.value as 'ADMIN' | 'PROJECT_MANAGER' | 'TEAM_MEMBER')}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#5B82FF]"
            >
              <option value="TEAM_MEMBER">Team Member</option>
              <option value="PROJECT_MANAGER">Project Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#4E75FF] hover:bg-[#5B82FF] text-white px-5 py-2 text-xs font-semibold rounded-xl shadow-md disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Saving...' : editingUser ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}