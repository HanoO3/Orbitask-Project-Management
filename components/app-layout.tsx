"use client";

import { Sidebar } from "@/components/sidebar";
import { usePathname } from "next/navigation";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#0B0E17] text-white flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 lg:pl-64 transition-all min-w-0">
        {children}
      </main>
    </div>
  );
}
