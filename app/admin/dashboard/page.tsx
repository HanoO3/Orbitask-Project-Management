import { auth } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
import { NotificationBell } from "@/components/notification-bell";

export default async function AdminDashboard() {
  const session = await auth();
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2">
  <NotificationBell />
  <LogoutButton />
</div>
        <div className="flex justify-between items-center mb-1">
          <h1 className="text-2xl font-bold text-indigo-600">
            Admin Dashboard
          </h1>
          <LogoutButton />
        </div>
        <p className="text-gray-500 mb-6">
          Welcome back, {session?.user?.name}
        </p>
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <p className="text-gray-700">
            Yahan User Management, Project Management, aur system overview aayega.
          </p>
        </div>
      </div>
    </div>
  );
}