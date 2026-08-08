"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Sidebar } from "@/components/sidebar";
import { usePathname } from "next/navigation";

interface MobileNavContextType {
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleMobileNav: () => void;
  closeMobileNav: () => void;
}

const MobileNavContext = createContext<MobileNavContextType>({
  mobileOpen: false,
  setMobileOpen: () => {},
  toggleMobileNav: () => {},
  closeMobileNav: () => {},
});

export const useMobileNav = () => useContext(MobileNavContext);

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMobileNav = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const closeMobileNav = useCallback(() => {
    setMobileOpen(false);
  }, []);

  const isAuthPage = pathname === "/login" || pathname === "/signup";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <MobileNavContext.Provider
      value={{ mobileOpen, setMobileOpen, toggleMobileNav, closeMobileNav }}
    >
      <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] flex flex-col lg:flex-row w-full max-w-full overflow-x-hidden transition-colors">
        <Sidebar />
        <main className="flex-1 lg:pl-64 transition-all min-w-0 w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </MobileNavContext.Provider>
  );
}
