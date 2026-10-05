import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, TENANT_ID } from '../lib/supabase';

export interface AdminAuthContextType {
  loading: boolean;
  authChecking: boolean;
  session: Session | null;
  user: User | null;
  isAuthorized: boolean;
  userRole: string | null;
  authError: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error: string | null }>;
  logout: () => Promise<void>;
  refreshAuthorization: () => Promise<boolean>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const AUTHORIZED_ROLES = ['owner', 'admin', 'editor', 'manager'];

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authChecking, setAuthChecking] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Keep track of pending authorization checks to prevent deadlocks
  const checkSeqRef = useRef<number>(0);

  const verifyTenantAuthorization = useCallback(async (currentUser: User | null): Promise<boolean> => {
    if (!currentUser) {
      setIsAuthorized(false);
      setUserRole(null);
      return false;
    }

    const currentSeq = ++checkSeqRef.current;
    setAuthChecking(true);
    setAuthError(null);

    try {
      // 1. Call authoritative database function has_tenant_role
      const { data: hasRole, error: rpcError } = await supabase.rpc('has_tenant_role', {
        _tenant_id: TENANT_ID,
        _role_names: AUTHORIZED_ROLES,
      });

      if (currentSeq !== checkSeqRef.current) {
        return false;
      }

      if (rpcError) {
        console.error('[HOEOS AUTH GATE] RPC has_tenant_role error:', rpcError.message);
        setIsAuthorized(false);
        setUserRole(null);
        setAuthError(`Authorization verification failed: ${rpcError.message}`);
        return false;
      }

      const authorized = !!hasRole;
      setIsAuthorized(authorized);

      if (authorized) {
        // Query role name for CMS identity display
        const { data: memberData } = await supabase
          .from('tenant_memberships')
          .select('status, roles:role_id(name)')
          .eq('tenant_id', TENANT_ID)
          .eq('user_id', currentUser.id)
          .eq('status', 'active')
          .limit(1)
          .maybeSingle();

        if (currentSeq === checkSeqRef.current) {
          const roleRecord = memberData?.roles as { name?: string } | null;
          setUserRole(roleRecord?.name || 'authorized_member');
        }
      } else {
        setUserRole(null);
        setAuthError('Access Denied: Your account does not have an authorized CMS role for CP Fruit Splash.');
      }

      return authorized;
    } catch (err: unknown) {
      if (currentSeq === checkSeqRef.current) {
        const msg = err instanceof Error ? err.message : 'Unknown authorization error';
        console.error('[HOEOS AUTH GATE] Authorization exception:', msg);
        setIsAuthorized(false);
        setUserRole(null);
        setAuthError(msg);
      }
      return false;
    } finally {
      if (currentSeq === checkSeqRef.current) {
        setAuthChecking(false);
      }
    }
  }, []);

  // Initialize session and subscribe to auth state changes
  useEffect(() => {
    let mounted = true;

    // Initial session retrieval
    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (!mounted) return;
      if (error) {
        console.warn('[HOEOS AUTH] Error retrieving initial session:', error.message);
      }

      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        verifyTenantAuthorization(initialSession.user).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setIsAuthorized(false);
        setUserRole(null);
        setLoading(false);
      }
    });

    // Subscribe to auth state changes without blocking the callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === 'SIGNED_OUT' || !newSession?.user) {
        setIsAuthorized(false);
        setUserRole(null);
        setAuthError(null);
        setLoading(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        // Schedule authorization check outside the synchronous callback to prevent auth lockups
        setTimeout(() => {
          if (mounted && newSession?.user) {
            verifyTenantAuthorization(newSession.user);
          }
        }, 0);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [verifyTenantAuthorization]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error: string | null }> => {
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setAuthError(error.message);
        return { success: false, error: error.message };
      }

      if (!data.user) {
        const msg = 'Login succeeded but no user session was returned.';
        setAuthError(msg);
        return { success: false, error: msg };
      }

      // Check tenant authorization
      const authorized = await verifyTenantAuthorization(data.user);
      if (!authorized) {
        return {
          success: false,
          error: 'Access Denied: You do not have permissions for CP Fruit Splash CMS.',
        };
      }

      return { success: true, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unexpected login error';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[HOEOS AUTH] SignOut warning:', err);
    } finally {
      setSession(null);
      setUser(null);
      setIsAuthorized(false);
      setUserRole(null);
      setAuthError(null);
    }
  };

  const refreshAuthorization = async (): Promise<boolean> => {
    return await verifyTenantAuthorization(user);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        loading,
        authChecking,
        session,
        user,
        isAuthorized,
        userRole,
        authError,
        login,
        logout,
        refreshAuthorization,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export function useAdminAuth(): AdminAuthContextType {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
