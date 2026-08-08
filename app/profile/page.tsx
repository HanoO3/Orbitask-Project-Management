'use client';

import { useEffect, useState, useCallback } from 'react';
import { getProfile, updateProfile } from '@/lib/actions/profile';
import { useSession } from 'next-auth/react';
import { Save } from 'lucide-react';

type ProfileData = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  createdAt: string | Date;
  stats: {
    projectsCount: number;
    tasksCount: number;
  };
};

function formatDate(d: string | Date) {
  if (!d) return '';
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return '';
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function ProfilePage() {
  const { update: updateSession } = useSession();
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await getProfile();
    if (data) {
      setProfile(data as ProfileData);
      setName(data.name);
      setEmail(data.email);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void loadData(), 0);
    return () => clearTimeout(t);
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setSaving(true);
    const res = await updateProfile({
      name,
      email,
      ...(currentPassword ? { currentPassword } : {}),
      ...(newPassword ? { newPassword } : {}),
    });
    setSaving(false);

    if (res.error) {
      setMessage({ type: 'error', text: res.error });
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      void loadData();
      await updateSession({ name, email });
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#0B0D1A] p-8 text-center text-[#8E95AF]">Loading profile...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0B0D1A] text-white p-4 md:p-8 space-y-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Profile Settings</h1>
          <p className="text-xs text-[#8E95AF] mt-1">Manage your account information and password.</p>
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl text-xs font-semibold ${
              message.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-[#141726] border border-[#23263A] rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-[#23263A]">
            <div className="w-16 h-16 rounded-full bg-[#4E75FF] text-white flex items-center justify-center font-extrabold text-xl shadow-lg border border-[#5B82FF]/40">
              {name ? name.slice(0, 2).toUpperCase() : 'JD'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{name}</h2>
              <p className="text-xs text-[#8E95AF]">{profile?.role.replace('_', ' ')} · Member since {mounted ? formatDate(profile?.createdAt || '') : ''}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#8E95AF] mb-1 uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#0B0D1A] border border-[#23263A] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#5B82FF]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8E95AF] mb-1 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0B0D1A] border border-[#23263A] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#5B82FF]"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-[#23263A] space-y-4">
            <h3 className="text-sm font-bold text-white">Change Password</h3>
            <div>
              <label className="block text-xs font-semibold text-[#8E95AF] mb-1 uppercase tracking-wider">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0B0D1A] border border-[#23263A] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#5B82FF]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#8E95AF] mb-1 uppercase tracking-wider">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0B0D1A] border border-[#23263A] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#5B82FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8E95AF] mb-1 uppercase tracking-wider">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0B0D1A] border border-[#23263A] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#5B82FF]"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#23263A] flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-[#4E75FF] hover:bg-[#5B82FF] text-white px-5 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-md disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
