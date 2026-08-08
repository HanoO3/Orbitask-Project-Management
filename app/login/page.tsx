'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, CheckCircle2, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { OrbitaskLogo } from '@/components/logo';
import { PasswordInput } from '@/components/password-input';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get('error');

  const initialError =
    urlError === 'PendingApproval'
      ? 'Your account is pending administrator approval.'
      : urlError === 'AccountRejected'
      ? 'Your account has not been approved by the administrator.'
      : null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      });

      setLoading(false);

      if (res?.error) {
        if (res.error.includes('PendingApproval') || res.error.includes('Pending')) {
          setError('Your account is pending administrator approval.');
        } else if (res.error.includes('AccountRejected') || res.error.includes('Rejected')) {
          setError('Your account has not been approved by the administrator.');
        } else {
          setError('Invalid email address or password.');
        }
      } else {
        // Successful login, refresh router and navigate to dashboard
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: unknown) {
      setLoading(false);
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('PendingApproval')) {
        setError('Your account is pending administrator approval.');
      } else if (message.includes('AccountRejected')) {
        setError('Your account has not been approved by the administrator.');
      } else {
        setError('An error occurred while signing in. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-4 md:p-8 select-none transition-colors">
      <div className="w-full max-w-5xl bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        {/* Left Form Panel */}
        <div className="p-8 md:p-12 flex flex-col justify-between">
          <div>
            {/* Logo */}
            <div className="mb-8">
              <OrbitaskLogo size="lg" />
            </div>

            {/* Welcome Back Header */}
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                Welcome Back
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1.5">
                Enter your credentials to access your project workspace.
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
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

              {/* Password using reusable PasswordInput */}
              <PasswordInput
                id="login-password"
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)] transition-colors">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--border-color)] bg-[var(--bg-input)] text-[#4E75FF] focus:ring-0 accent-[#4E75FF]"
                  />
                  <span>Remember me</span>
                </label>

                <Link href="/forgot-password" className="text-[#5B82FF] hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 bg-[#4E75FF] hover:bg-[#5B82FF] text-white py-3 rounded-xl font-semibold text-sm shadow-[0_4px_14px_rgba(78,117,255,0.4)] transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Orbitask</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer Link to Signup */}
          <div className="mt-8 text-center text-xs text-[var(--text-secondary)]">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[#5B82FF] font-semibold hover:underline">
              Create an account
            </Link>
          </div>
        </div>

        {/* Right Desktop Illustration Panel */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-[#4E75FF]/10 via-[var(--bg-card-hover)] to-[var(--bg-card)] border-l border-[var(--border-color)] relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#5B82FF]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#4E75FF]/15 text-[#5B82FF] border border-[#5B82FF]/30 mb-6">
              <ShieldCheck className="w-3.5 h-3.5" /> Next-Gen Workspace
            </span>
            <h3 className="text-3xl font-extrabold text-[var(--text-primary)] leading-tight tracking-tight">
              Manage projects with ultimate clarity and precision.
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mt-3 leading-relaxed">
              Track real-time tasks, team activities, sprint deadlines, and progress analytics in one centralized hub.
            </p>
          </div>

          {/* Mini Preview Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative z-10 bg-[var(--bg-card)]/90 backdrop-blur-md border border-[var(--border-color)] rounded-2xl p-5 shadow-2xl space-y-4 my-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#5B82FF]/20 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-[#5B82FF]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)]">Orbitask Workspace Hub</h4>
                  <p className="text-[10px] text-[var(--text-secondary)]">Real-time Sprint Analytics</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>

            <div className="w-full bg-[var(--border-color)] h-2 rounded-full overflow-hidden">
              <div className="bg-[#4E75FF] h-full w-[100%] rounded-full shadow-[0_0_8px_rgba(78,117,255,0.6)] animate-pulse" />
            </div>
          </motion.div>

          <div className="relative z-10 text-xs text-[var(--text-muted)] flex items-center justify-between">
            <span>© 2026 Orbitask Platform</span>
            <span>v2.4 Production</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center text-[var(--text-primary)] text-xs">Loading...</div>}>
      <LoginFormContent />
    </React.Suspense>
  );
}