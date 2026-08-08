'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowRight, AlertCircle, Loader2, CheckCircle2, KeyRound } from 'lucide-react';
import { OrbitaskLogo } from '@/components/logo';
import { PasswordInput } from '@/components/password-input';
import { validateResetToken, resetPassword } from '@/lib/actions/password-reset';

function ResetPasswordFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  const checkToken = useCallback(async () => {
    if (!token) {
      setValidating(false);
      setTokenValid(false);
      setTokenError('No reset token provided. Please check your reset link.');
      return;
    }

    setValidating(true);
    const res = await validateResetToken(token);
    setValidating(false);

    if (res.valid) {
      setTokenValid(true);
      setTokenError(null);
    } else {
      setTokenValid(false);
      setTokenError(res.error || 'Invalid or expired password reset link.');
    }
  }, [token]);

  useEffect(() => {
    const t = setTimeout(() => void checkToken(), 0);
    return () => clearTimeout(t);
  }, [checkToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (newPassword.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await resetPassword(token, newPassword);
      setSubmitting(false);

      if (!res.success) {
        setFormError(res.error || 'Failed to reset password.');
        return;
      }

      setResetSuccess(true);
    } catch {
      setSubmitting(false);
      setFormError('An unexpected error occurred while resetting your password.');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-4 md:p-8 select-none transition-colors">
      <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl shadow-2xl p-8 text-[var(--text-primary)] transition-colors">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <OrbitaskLogo size="lg" />
        </div>

        {validating ? (
          <div className="py-12 text-center text-xs text-[var(--text-secondary)] flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-[#4E75FF]" />
            <span>Validating reset link...</span>
          </div>
        ) : !tokenValid ? (
          /* Invalid / Expired Token View */
          <div className="text-center space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-500">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">
                Invalid Reset Link
              </h2>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {tokenError || 'This password reset link is invalid or has expired.'}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Link
                href="/forgot-password"
                className="w-full inline-flex items-center justify-center gap-2 bg-[#4E75FF] hover:bg-[#5B82FF] text-white px-5 py-3 rounded-xl font-semibold text-xs shadow-lg transition-all"
              >
                <span>Request New Link</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <div>
                <Link href="/login" className="text-xs text-[#5B82FF] font-semibold hover:underline">
                  Back to Sign In
                </Link>
              </div>
            </div>
          </div>
        ) : resetSuccess ? (
          /* Success View */
          <div className="text-center space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-500">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">
                Password Reset Complete
              </h2>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Your password has been updated successfully. You can now sign in using your new credentials.
              </p>
            </div>

            <button
              onClick={() => router.push('/login')}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#4E75FF] hover:bg-[#5B82FF] text-white px-5 py-3 rounded-xl font-semibold text-xs shadow-lg transition-all cursor-pointer"
            >
              <span>Back to Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Password Reset Form */
          <div>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#4E75FF]/10 border border-[#5B82FF]/30 flex items-center justify-center mx-auto text-[#5B82FF] mb-3">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
                Create New Password
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Enter and confirm your new password below.
              </p>
            </div>

            {formError && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <PasswordInput
                id="new-password"
                label="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
              />

              <PasswordInput
                id="confirm-password"
                label="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 flex items-center justify-center gap-2 bg-[#4E75FF] hover:bg-[#5B82FF] text-white py-3 rounded-xl font-semibold text-sm shadow-[0_4px_14px_rgba(78,117,255,0.4)] transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Resetting password...</span>
                  </>
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center text-[var(--text-primary)] text-xs">Loading...</div>}>
      <ResetPasswordFormContent />
    </React.Suspense>
  );
}
