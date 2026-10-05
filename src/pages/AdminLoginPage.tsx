import React, { useState } from 'react';
import { useAdminAuth } from '../auth/AdminAuthContext';
import { BrandLogo } from '../components/common/BrandAssets';
import { Shield, Lock, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

interface AdminLoginPageProps {
  onBackToStore?: () => void;
}

export function AdminLoginPage({ onBackToStore }: AdminLoginPageProps) {
  const { login, loading, authChecking, authError: contextAuthError } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    setLocalError(null);

    const { success, error } = await login(email, password);
    if (!success) {
      setLocalError(error || 'Authentication failed. Please verify credentials.');
    }
    setSubmitting(false);
  };

  const displayError = localError || contextAuthError;

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col justify-center items-center px-4 py-12 selection:bg-rose-600 selection:text-white relative overflow-hidden">
      {/* Subtle ambient lighting */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-rose-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-black/80 space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex justify-center mb-2">
              <BrandLogo dark={true} className="h-10" />
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase bg-rose-950/80 border border-rose-900/40 text-rose-300 px-2.5 py-0.5 rounded-full">
                Security Gate
              </span>
              <span className="text-[10px] font-mono text-stone-500">
                HOEOS G1-G3
              </span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              CMS Administrator Login
            </h1>
            <p className="text-xs text-stone-400">
              Authorized personnel only. Authenticate with verified Supabase credentials.
            </p>
          </div>

          {/* Error Notice */}
          {displayError && (
            <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-900/50 flex items-start gap-3 text-xs text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold text-rose-300">Access Restricted</div>
                <div className="text-stone-300 text-[11px] leading-relaxed">{displayError}</div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Staff Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  required
                  disabled={submitting || loading}
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-950/80 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder:text-stone-600 focus:outline-hidden focus:border-rose-600 focus:ring-1 focus:ring-rose-600 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  disabled={submitting || loading}
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-950/80 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder:text-stone-600 focus:outline-hidden focus:border-rose-600 focus:ring-1 focus:ring-rose-600 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || loading || authChecking}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-950/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting || authChecking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials & Roles...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Admin CMS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Tenant Enforcement Details */}
          <div className="pt-4 border-t border-stone-800/80 text-center space-y-3">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-500">
              <Shield className="w-3.5 h-3.5 text-stone-400" />
              <span>Protected by Supabase Auth & Role-Based Access Control</span>
            </div>

            {onBackToStore && (
              <button
                type="button"
                onClick={onBackToStore}
                className="text-xs text-stone-400 hover:text-stone-200 transition-colors underline cursor-pointer"
              >
                ← Return to Public Storefront
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
