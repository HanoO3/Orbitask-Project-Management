'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { OrbitaskLogo } from '@/components/logo';
import { requestPasswordReset } from '@/lib/actions/password-reset';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmittedMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await requestPasswordReset(trimmedEmail);
      setLoading(false);

      if (!res.success) {
        setError(res.error || 'Failed to process password reset request.');
        return;
      }

      setSubmittedMessage(res.message || 'If an account exists for this email, a password reset link has been sent.');
    } catch {
      setLoading(false);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-4 md:p-8 select-none transition-colors">
      <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl shadow-2xl p-8 text-[var(--text-primary)] transition-colors">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <OrbitaskLogo size="lg" />
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Reset Password
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
            Enter your registered email address below and we will send you instructions to reset your password.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Message Card */}
        {submittedMessage ? (
          <div className="space-y-6 text-center">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-1">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-xs leading-relaxed font-semibold">{submittedMessage}</p>
            </div>

            <p className="text-[11px] text-[var(--text-secondary)]">
              Check your inbox and click the reset link to choose a new password.
            </p>

            <Link
              href="/login"
              className="w-full inline-flex items-center justify-center gap-2 bg-[#4E75FF] hover:bg-[#5B82FF] text-white px-5 py-3 rounded-xl font-semibold text-xs shadow-lg transition-all"
            >
              <span>Back to Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* Reset Request Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl pl-11 pr-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#5B82FF] focus:ring-1 focus:ring-[#5B82FF] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-[#4E75FF] hover:bg-[#5B82FF] text-white py-3 rounded-xl font-semibold text-sm shadow-[0_4px_14px_rgba(78,117,255,0.4)] transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Sending instructions...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-4 text-center text-xs text-[var(--text-secondary)]">
              Remembered your password?{' '}
              <Link href="/login" className="text-[#5B82FF] font-semibold hover:underline">
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
