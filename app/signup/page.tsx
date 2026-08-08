'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { User, Mail, Lock, ArrowRight, ShieldCheck, AlertCircle, Loader2, Briefcase } from 'lucide-react';
import { OrbitaskLogo } from '@/components/logo';
import { registerUser } from '@/lib/actions/auth-register';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'TEAM_MEMBER' | 'PROJECT_MANAGER'>('TEAM_MEMBER');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!acceptTerms) {
      setError('You must accept the Terms of Service to continue.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await registerUser({
        name: fullName,
        email,
        password,
        role,
      });

      setLoading(false);

      if (!res.success) {
        setError(res.error || 'Failed to create account.');
        return;
      }

      setRegisteredSuccess(true);
    } catch (err: unknown) {
      setLoading(false);
      const message = err instanceof Error ? err.message : String(err);
      setError(message || 'An error occurred during registration.');
    }
  };

  if (registeredSuccess) {
    return (
      <div className="min-h-screen bg-[#0B0D1A] flex items-center justify-center p-4 md:p-8 select-none">
        <div className="w-full max-w-md bg-[#141726] border border-[#23263A] rounded-3xl shadow-2xl p-8 text-center space-y-6">
          <div className="mb-2">
            <OrbitaskLogo size="lg" />
          </div>
          <div className="w-16 h-16 rounded-2xl bg-[#4E75FF]/10 border border-[#5B82FF]/30 flex items-center justify-center mx-auto text-[#5B82FF]">
            <ShieldCheck className="w-8 h-8 text-[#5B82FF]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Account Created Successfully</h2>
            <p className="text-xs text-[#8E95AF] leading-relaxed">
              Your account is currently pending administrator approval. You will be able to log in once an administrator approves your account.
            </p>
          </div>
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center gap-2 bg-[#4E75FF] hover:bg-[#5B82FF] text-white px-5 py-3 rounded-xl font-semibold text-xs shadow-lg transition-all"
          >
            <span>Back to Login</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0D1A] flex items-center justify-center p-4 md:p-8 select-none">
      <div className="w-full max-w-5xl bg-[#141726] border border-[#23263A] rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        {/* Left Form Panel */}
        <div className="p-8 md:p-12 flex flex-col justify-between">
          <div>
            {/* Logo */}
            <div className="mb-6">
              <OrbitaskLogo size="lg" />
            </div>

            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Create an Account
              </h2>
              <p className="text-sm text-[#8E95AF] mt-1">
                Start managing real workspace projects with precision.
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-semibold text-[#8E95AF] mb-1 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E95AF]" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full bg-[#0B0D1A] border border-[#23263A] rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-[#626A86] focus:outline-none focus:border-[#5B82FF] transition-all"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-[11px] font-semibold text-[#8E95AF] mb-1 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E95AF]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-[#0B0D1A] border border-[#23263A] rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-[#626A86] focus:outline-none focus:border-[#5B82FF] transition-all"
                  />
                </div>
              </div>

              {/* Account Role */}
              <div>
                <label className="block text-[11px] font-semibold text-[#8E95AF] mb-1 uppercase tracking-wider">
                  Workspace Role
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E95AF]" />
                  <select
                    value={role}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRole(e.target.value as 'TEAM_MEMBER' | 'PROJECT_MANAGER')}
                    className="w-full bg-[#0B0D1A] border border-[#23263A] rounded-xl pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#5B82FF] transition-all cursor-pointer"
                  >
                    <option value="TEAM_MEMBER">Team Member</option>
                    <option value="PROJECT_MANAGER">Project Manager</option>
                  </select>
                </div>
              </div>

              {/* Password & Confirm Password in 2 cols */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-[#8E95AF] mb-1 uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E95AF]" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#0B0D1A] border border-[#23263A] rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-[#626A86] focus:outline-none focus:border-[#5B82FF] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#8E95AF] mb-1 uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E95AF]" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#0B0D1A] border border-[#23263A] rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-[#626A86] focus:outline-none focus:border-[#5B82FF] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 text-xs text-[#8E95AF] cursor-pointer hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    required
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-[#23263A] bg-[#0B0D1A] text-[#4E75FF] focus:ring-0 accent-[#4E75FF]"
                  />
                  <span>
                    I agree to the{' '}
                    <a href="#" className="text-[#5B82FF] hover:underline">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-[#5B82FF] hover:underline">
                      Privacy Policy
                    </a>
                    .
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 bg-[#4E75FF] hover:bg-[#5B82FF] text-white py-3 rounded-xl font-semibold text-sm shadow-[0_4px_14px_rgba(78,117,255,0.4)] transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer Link to Login */}
          <div className="mt-6 text-center text-xs text-[#8E95AF]">
            Already have an account?{' '}
            <Link href="/login" className="text-[#5B82FF] font-semibold hover:underline">
              Log in
            </Link>
          </div>
        </div>

        {/* Right Desktop Feature Illustration Panel */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-[#090B17] via-[#121527] to-[#1A1E36] border-l border-[#23263A] relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#5B82FF]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#4E75FF]/15 text-[#5B82FF] border border-[#5B82FF]/30 mb-6">
              <ShieldCheck className="w-3.5 h-3.5" /> High-Performance Teams
            </span>
            <h3 className="text-3xl font-extrabold text-white leading-tight tracking-tight">
              Join thousands of teams building better products.
            </h3>
            <p className="text-sm text-[#8E95AF] mt-3 leading-relaxed">
              Orbitask offers dark-theme dashboard execution, timeline metrics, team member task assignments, and seamless workflow management.
            </p>
          </div>

          <div className="relative z-10 space-y-3 my-6">
            <div className="bg-[#141726]/70 border border-[#23263A] rounded-xl p-3.5 flex items-center justify-between text-xs">
              <span className="text-white font-medium">✨ Real-time task board sync</span>
              <span className="text-emerald-400 font-semibold">Active</span>
            </div>
            <div className="bg-[#141726]/70 border border-[#23263A] rounded-xl p-3.5 flex items-center justify-between text-xs">
              <span className="text-white font-medium">⚡ Instant sprint progress reports</span>
              <span className="text-emerald-400 font-semibold">Automated</span>
            </div>
          </div>

          <div className="relative z-10 text-xs text-[#626A86] flex items-center justify-between">
            <span>© 2026 Orbitask Platform</span>
            <span>Enterprise Security</span>
          </div>
        </div>
      </div>
    </div>
  );
}
