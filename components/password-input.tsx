'use client';

import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  showLockIcon?: boolean;
}

export function PasswordInput({
  label,
  error,
  showLockIcon = true,
  className = '',
  value,
  onChange,
  placeholder = '••••••••',
  id,
  required,
  disabled,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {showLockIcon && (
          <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none z-10" />
        )}

        <input
          {...props}
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl ${
            showLockIcon ? 'pl-11' : 'pl-4'
          } pr-11 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#5B82FF] focus:ring-1 focus:ring-[#5B82FF] transition-all disabled:opacity-50 ${className}`}
        />

        <button
          type="button"
          onClick={togglePasswordVisibility}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#5B82FF]/50"
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" />
          ) : (
            <Eye className="w-4 h-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" />
          )}
        </button>
      </div>

      {error && (
        <p className="mt-1 text-xs text-rose-500 font-medium">{error}</p>
      )}
    </div>
  );
}


