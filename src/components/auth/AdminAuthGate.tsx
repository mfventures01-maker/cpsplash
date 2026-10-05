import React from 'react';
import { useAdminAuth } from '../../auth/AdminAuthContext';
import { AdminLoginPage } from '../../pages/AdminLoginPage';
import { BrandLogo } from '../common/BrandAssets';
import { ShieldAlert, Loader2, LogOut, ArrowLeft, RefreshCw } from 'lucide-react';
import { TENANT_ID } from '../../lib/supabase';

interface AdminAuthGateProps {
  children: React.ReactNode;
  onExitAdmin: () => void;
}

export function AdminAuthGate({ children, onExitAdmin }: AdminAuthGateProps) {
  const {
    loading,
    authChecking,
    session,
    user,
    isAuthorized,
    userRole,
    authError,
    logout,
    refreshAuthorization,
  } = useAdminAuth();

  // State 1: INITIALIZING
  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <BrandLogo dark={true} className="h-10 mx-auto" />
          <div className="flex items-center justify-center gap-2 text-stone-400 text-xs font-mono">
            <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
            <span>Initializing Security Session...</span>
          </div>
        </div>
      </div>
    );
  }

  // State 2: NO SESSION -> Render Login Page
  if (!session || !user) {
    return <AdminLoginPage onBackToStore={onExitAdmin} />;
  }

  // State 3: AUTHENTICATED but AUTHORIZATION IN PROGRESS
  if (authChecking) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <BrandLogo dark={true} className="h-10 mx-auto" />
          <div className="flex items-center justify-center gap-2 text-stone-400 text-xs font-mono">
            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
            <span>Verifying Tenant Authorization & Roles for CP Fruit Splash...</span>
          </div>
          <div className="text-[11px] text-stone-600 font-mono">
            User: {user.email}
          </div>
        </div>
      </div>
    );
  }

  // State 4: AUTHENTICATED but NOT AUTHORIZED -> Access Denied Screen
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-4 text-stone-100">
        <div className="max-w-md w-full bg-stone-900 border border-red-900/40 rounded-3xl p-8 space-y-6 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-800/50 flex items-center justify-center text-red-400 mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Access Denied: Unauthorized Account
            </h2>
            <p className="text-xs text-stone-400 leading-relaxed">
              Your Supabase credentials are valid, but your user account does not have an active CMS staff role (owner, admin, editor, manager) assigned for this tenant.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-stone-950/80 border border-stone-800 font-mono text-[11px] space-y-2 text-stone-400">
            <div>
              <span className="text-stone-500">Account:</span> <span className="text-stone-200">{user.email}</span>
            </div>
            <div>
              <span className="text-stone-500">User ID:</span> <span className="text-stone-300">{user.id}</span>
            </div>
            <div>
              <span className="text-stone-500">Tenant:</span> <span className="text-stone-300">{TENANT_ID}</span>
            </div>
            {authError && (
              <div className="text-rose-400 pt-1 border-t border-stone-800/60 text-[10px]">
                {authError}
              </div>
            )}
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => refreshAuthorization()}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Authorization Check</span>
            </button>

            <button
              onClick={() => logout()}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-950/60 hover:bg-red-900/60 border border-red-800/40 text-red-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out from Supabase</span>
            </button>

            <button
              onClick={onExitAdmin}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-stone-500 hover:text-stone-300 text-xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Storefront</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State 5: AUTHENTICATED & AUTHORIZED -> Render Protected CMS
  return <>{children}</>;
}
