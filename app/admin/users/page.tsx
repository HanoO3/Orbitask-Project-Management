"use client";

import { useEffect, useState, useCallback } from "react";
import { getUsers, deleteUser, approveUser, rejectUser } from "@/lib/actions/users";
import { UserModal } from "@/components/user-modal";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";

type User = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "PROJECT_MANAGER" | "TEAM_MEMBER";
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: Date;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<'name' | 'role' | 'approvalStatus'>('name');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const data = await getUsers();
    setUsers(data as User[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void loadUsers(), 0);
    return () => clearTimeout(t);
  }, [loadUsers]);

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingUser(null);
    loadUsers();
  };

  const handleApprove = async (id: string) => {
    const result = await approveUser(id);
    if (!result.success) {
      alert("Failed to approve user");
      return;
    }
    loadUsers();
  };

  const handleReject = async (id: string) => {
    if (!confirm("Are you sure you want to reject this user account?")) return;
    const result = await rejectUser(id);
    if (!result.success) {
      alert(result.error || "Failed to reject user");
      return;
    }
    loadUsers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    const result = await deleteUser(id);
    if (!result.success) {
      alert(result.error);
      return;
    }
    loadUsers();
  };

  const filteredUsers = users
    .filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
      const matchesStatus = statusFilter === "ALL" || u.approvalStatus === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'role') return a.role.localeCompare(b.role);
      if (sortBy === 'approvalStatus') return (a.approvalStatus || 'APPROVED').localeCompare(b.approvalStatus || 'APPROVED');
      return 0;
    });

  const roleBadge = (role: string) => {
    const styles: Record<string, string> = {
      ADMIN: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30",
      PROJECT_MANAGER: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30",
      TEAM_MEMBER: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
    };
    return styles[role] || "bg-slate-100 text-slate-700 border-slate-300";
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30",
      PENDING: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
      REJECTED: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30",
    };
    return styles[status] || "bg-slate-100 text-slate-700 border-slate-300";
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] p-4 sm:p-6 lg:p-8 space-y-6 w-full max-w-full overflow-x-hidden transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">User Management</h1>
          <p className="text-[var(--text-secondary)] text-xs mt-1">Manage system user accounts, roles, and approval status</p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <NotificationBell />
          <button
            onClick={() => {
              setEditingUser(null);
              setModalOpen(true);
            }}
            className="bg-[#4E75FF] hover:bg-[#5B82FF] text-white font-semibold px-4 py-2.5 rounded-xl text-xs shadow-md transition cursor-pointer shrink-0"
          >
            + New User
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#5B82FF]"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'name' | 'role' | 'approvalStatus')}
          className="bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#5B82FF]"
        >
          <option value="name">Sort by Name</option>
          <option value="role">Sort by Role</option>
          <option value="approvalStatus">Sort by Status</option>
        </select>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#5B82FF]"
        >
          <option value="ALL">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="PROJECT_MANAGER">Project Manager</option>
          <option value="TEAM_MEMBER">Team Member</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#5B82FF]"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-xs transition-colors">
        {loading ? (
          <p className="p-8 text-center text-[var(--text-secondary)] text-xs">Loading users...</p>
        ) : filteredUsers.length === 0 ? (
          <p className="p-8 text-center text-[var(--text-secondary)] text-xs">No users found</p>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead className="bg-[var(--bg-sidebar)] text-[var(--text-secondary)] text-xs uppercase tracking-wider border-b border-[var(--border-color)]">
                <tr>
                  <th className="px-6 py-3.5">Name</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] text-xs">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                    <td className="px-6 py-4 font-semibold text-[var(--text-primary)]">{user.name}</td>
                    <td className="px-6 py-4 text-[var(--text-secondary)]">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${roleBadge(user.role)}`}>
                        {user.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusBadge(user.approvalStatus || 'APPROVED')}`}>
                        {user.approvalStatus || 'APPROVED'}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      {user.approvalStatus === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleApprove(user.id)}
                            className="bg-emerald-100 text-emerald-800 dark:bg-emerald-600/20 dark:text-emerald-400 hover:bg-emerald-200 border border-emerald-300 dark:border-emerald-500/40 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(user.id)}
                            className="bg-rose-100 text-rose-800 dark:bg-rose-600/20 dark:text-rose-400 hover:bg-rose-200 border border-rose-300 dark:border-rose-500/40 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {user.approvalStatus === "REJECTED" && (
                        <button
                          onClick={() => handleApprove(user.id)}
                          className="bg-emerald-100 text-emerald-800 dark:bg-emerald-600/20 dark:text-emerald-400 hover:bg-emerald-200 border border-emerald-300 dark:border-emerald-500/40 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setModalOpen(true);
                        }}
                        className="text-[#5B82FF] hover:underline px-1 cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-rose-600 dark:text-rose-400 hover:underline px-1 cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UserModal isOpen={modalOpen} onClose={handleModalClose} editingUser={editingUser} />
    </div>
  );
}