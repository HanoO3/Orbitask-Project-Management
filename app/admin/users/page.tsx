"use client";

import { useEffect, useState, useCallback } from "react";
import { getUsers, deleteUser } from "@/lib/actions/users";
import { UserModal } from "@/components/user-modal";

type User = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "PROJECT_MANAGER" | "TEAM_MEMBER";
  createdAt: Date;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    const result = await deleteUser(id);
    if (!result.success) {
      alert(result.error);
      return;
    }
    loadUsers();
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleBadge = (role: string) => {
    const styles: Record<string, string> = {
      ADMIN: "bg-purple-500/15 text-purple-300 border-purple-500/30",
      PROJECT_MANAGER: "bg-blue-500/15 text-blue-300 border-blue-500/30",
      TEAM_MEMBER: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    };
    return styles[role] || "bg-gray-500/15 text-gray-300 border-gray-500/30";
  };

  return (
    <div className="min-h-screen bg-[#0B0E17] text-white p-4 sm:p-6 lg:p-8 space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">User Management</h1>
          <p className="text-gray-400 text-xs mt-1">Manage system user accounts and roles</p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setModalOpen(true);
          }}
          className="bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl text-xs hover:bg-blue-500 shadow-lg shadow-blue-600/25 transition self-start sm:self-auto shrink-0"
        >
          + New User
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-[#131725] border border-[#22293F] text-white px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-blue-500"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-[#131725] border border-[#22293F] text-white px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-blue-500"
        >
          <option value="ALL">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="PROJECT_MANAGER">Project Manager</option>
          <option value="TEAM_MEMBER">Team Member</option>
        </select>
      </div>

      <div className="bg-[#131725] border border-[#22293F] rounded-2xl overflow-hidden shadow-2xl">
        {loading ? (
          <p className="p-8 text-center text-gray-500 text-xs">Loading users...</p>
        ) : filteredUsers.length === 0 ? (
          <p className="p-8 text-center text-gray-500 text-xs">No users found</p>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[550px]">
            <thead className="bg-[#0B0E17] text-gray-400 text-xs uppercase tracking-wider border-b border-[#22293F]">
              <tr>
                <th className="px-6 py-3.5">Name</th>
                <th className="px-6 py-3.5">Email</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E253B] text-xs">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-[#0B0E17]/50 transition">
                  <td className="px-6 py-4 font-semibold text-white">{user.name}</td>
                  <td className="px-6 py-4 text-gray-400">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${roleBadge(user.role)}`}>
                      {user.role.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 space-x-3">
                    <button
                      onClick={() => {
                        setEditingUser(user);
                        setModalOpen(true);
                      }}
                      className="text-blue-400 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-400 hover:underline"
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