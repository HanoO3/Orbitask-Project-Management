'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface BackButtonProps {
  href: string;
  label: string;
  iconPosition?: 'left' | 'right';
  showArrow?: boolean;
}

export function BackButton({
  href,
  label,
  iconPosition = 'left',
  showArrow = true,
}: BackButtonProps) {
  const Icon = iconPosition === 'right' ? ArrowRight : ArrowLeft;
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
    >
      {showArrow && iconPosition === 'left' && <Icon className="w-4 h-4 text-[#5B82FF]" />}
      <span>{label}</span>
      {showArrow && iconPosition === 'right' && <Icon className="w-4 h-4 text-[#5B82FF]" />}
    </Link>
  );
}
