'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { User, Bell, Shield, Users, Save, Check, Lock, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getProfile, updateProfile } from '@/lib/actions/profile';
import { getWorkspaceUsers } from '@/lib/actions/users';

type WorkspaceUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
};

function formatRole(role?: string) {
  if (!role) return 'User';
  switch (role) {
    case 'ADMIN':
      return 'Administrator';
    case 'PROJECT_MANAGER':
      return 'Project Manager';
    case 'TEAM_MEMBER':
      return 'Team Member';
    default:
      return role.replace('_', ' ');
  }
}

function getInitials(name: string) {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const colorPalette = [
  'bg-blue-600',
  'bg-purple-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-indigo-600',
];

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'team'>('profile');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  
  // Real workspace users for Team tab
  const [teamUsers, setTeamUsers] = useState<WorkspaceUser[]>([]);

  // Security tab state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const loadProfileData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileData, usersData] = await Promise.all([
        getProfile(),
        getWorkspaceUsers(),
      ]);

      if (profileData) {
        setName(profileData.name || '');
        setEmail(profileData.email || '');
        setRoleTitle(formatRole(profileData.role));
      }

      setTeamUsers(usersData as WorkspaceUser[]);
    } catch {
      // Fallback to session data if profile fetch fails
      if (session?.user) {
        setName(session.user.name || '');
        setEmail(session.user.email || '');
        setRoleTitle(formatRole(session.user.role));
      }
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    const t = setTimeout(() => void loadProfileData(), 0);
    return () => clearTimeout(t);
  }, [loadProfileData]);

  const userInitials = (name || session?.user?.name || 'User')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

    const res = await updateProfile({ name, email });
    setSaving(false);

    if (res.error) {
      setMessage({ type: 'error', text: res.error });
    } else {
      setSaved(true);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      await updateSession({ name, email });
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!currentPassword) {
      setMessage({ type: 'error', text: 'Please enter your current password.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setSaving(true);
    const res = await updateProfile({
      name,
      email,
      currentPassword,
      newPassword,
    });
    setSaving(false);

    if (res.error) {
      setMessage({ type: 'error', text: res.error });
    } else {
      setSaved(true);
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSaved(false), 2500);
    }
  };

  return (
    <DashboardLayout title="Settings">
      {/* Header */}
      <div className="pb-2">
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Account Settings</h2>
        <p className="text-xs text-[#8E95AF] mt-1">
          Manage your personal details, workspace preferences, and team permissions.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#23263A] pb-3 overflow-x-auto">
        {[
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'security', label: 'Security', icon: Shield },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'team', label: 'Team Members', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
                onClick={() => {
                setActiveTab(tab.id as 'profile' | 'security' | 'notifications' | 'team');
                setMessage(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'bg-[#4E75FF] text-white shadow-md'
                  : 'bg-[#141726] text-[#8E95AF] hover:text-white border border-[#23263A]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Message Feedback */}
      {message && (
        <div
          className={`max-w-3xl p-3.5 rounded-xl text-xs font-medium border ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Content Panel */}
      <div className="bg-[#141726] border border-[#23263A] rounded-2xl p-6 shadow-lg max-w-3xl">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-[#8E95AF] gap-2 text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-[#4E75FF]" />
            Loading settings...
          </div>
        ) : (
          <>
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="flex items-center gap-4 pb-4 border-b border-[#23263A]">
                  <div className="w-16 h-16 rounded-full bg-[#4E75FF] flex items-center justify-center text-white font-extrabold text-xl shadow-lg border border-[#5B82FF]/40 uppercase">
                    {userInitials}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">{name || 'User Profile'}</h3>
                    <p className="text-xs text-[#8E95AF]">{roleTitle} · Orbitask Workspace</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#8E95AF] mb-1.5 uppercase tracking-wider">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#0B0D1A] border border-[#23263A] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#5B82FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#8E95AF] mb-1.5 uppercase tracking-wider">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#0B0D1A] border border-[#23263A] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#5B82FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#8E95AF] mb-1.5 uppercase tracking-wider">
                      Role Title
                    </label>
                    <input
                      type="text"
                      disabled
                      value={roleTitle}
                      className="w-full bg-[#0B0D1A]/60 border border-[#23263A] rounded-xl px-4 py-2.5 text-sm text-[#8E95AF] cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[#23263A] flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 bg-[#4E75FF] hover:bg-[#5B82FF] text-white px-5 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-md disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : saved ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{saving ? 'Saving...' : saved ? 'Saved Successfully' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'security' && (
              <form onSubmit={handleSaveSecurity} className="space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-[#23263A]">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Security & Password</h3>
                    <p className="text-xs text-[#8E95AF]">Update your password to secure your account</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#8E95AF] mb-1.5 uppercase tracking-wider">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#0B0D1A] border border-[#23263A] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#5B82FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#8E95AF] mb-1.5 uppercase tracking-wider">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#0B0D1A] border border-[#23263A] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#5B82FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#8E95AF] mb-1.5 uppercase tracking-wider">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#0B0D1A] border border-[#23263A] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#5B82FF]"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[#23263A] flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 bg-[#4E75FF] hover:bg-[#5B82FF] text-white px-5 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-md disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : saved ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{saving ? 'Updating...' : saved ? 'Password Updated' : 'Update Password'}</span>
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-4 py-2">
                <div className="flex items-center justify-between p-4 rounded-xl bg-[#0B0D1A] border border-[#23263A]">
                  <div>
                    <p className="text-sm font-semibold text-white">Email Notifications</p>
                    <p className="text-xs text-[#8E95AF]">Receive task assignments and project updates via email</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#4E75FF] cursor-pointer" />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-[#0B0D1A] border border-[#23263A]">
                  <div>
                    <p className="text-sm font-semibold text-white">In-App Notifications</p>
                    <p className="text-xs text-[#8E95AF]">Show bell popups for updates in real time</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#4E75FF] cursor-pointer" />
                </div>
              </div>
            )}

            {activeTab === 'team' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#23263A]">
                  <h3 className="text-base font-bold text-white">
                    Active Workspace Members ({teamUsers.length})
                  </h3>
                  <span className="text-xs text-[#8E95AF]">Synced with Database</span>
                </div>

                <div className="divide-y divide-[#23263A]">
                  {teamUsers.map((m, idx) => {
                    const initials = getInitials(m.name);
                    const colorBg = colorPalette[idx % colorPalette.length];
                    const isSelf = m.id === session?.user?.id;

                    return (
                      <div key={m.id} className="py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white uppercase shadow-md ${colorBg}`}
                          >
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-white">{m.name}</p>
                              {isSelf && (
                                <span className="text-[10px] bg-[#4E75FF]/20 text-[#5B82FF] px-1.5 py-0.2 rounded-md font-semibold">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#8E95AF]">{m.email}</p>
                          </div>
                        </div>

                        <span className="text-xs text-[#5B82FF] font-medium bg-[#5B82FF]/10 border border-[#5B82FF]/20 px-3 py-1 rounded-full">
                          {formatRole(m.role)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
