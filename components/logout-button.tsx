'use client';

import React from 'react';
import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

interface LogoutButtonProps {
  showText?: boolean;
  className?: string;
}

export function LogoutButton({ showText = false, className = '' }: LogoutButtonProps) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      type="button"
      title="Sign Out of Orbitask"
      aria-label="Sign Out"
      className={`inline-flex items-center justify-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 active:scale-95 transition-all cursor-pointer shrink-0 ${className}`}
    >
      <LogOut className="w-4 h-4 text-current shrink-0" />
      {showText && <span>Logout</span>}
    </button>
  );
}