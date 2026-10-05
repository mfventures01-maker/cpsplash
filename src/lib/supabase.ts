import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CP_SPLASH_TENANT_ID } from '../types/database.types';

// Supabase environment configuration — strictly authoritative from environment
const ENV_SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const ENV_SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const TENANT_ID = (import.meta.env.VITE_CP_SPLASH_TENANT_ID || CP_SPLASH_TENANT_ID).trim();

if (!ENV_SUPABASE_URL || !ENV_SUPABASE_ANON_KEY) {
  console.warn('[HOEOS CONFIG] Supabase environment variables missing or incomplete. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in environment.');
}

export interface SupabaseConfigState {
  url: string;
  anonKey: string;
  isLive: boolean;
  status: 'connected' | 'disconnected';
  error: string | null;
}

// Single Authoritative Supabase Client
export const supabase: SupabaseClient = createClient(ENV_SUPABASE_URL, ENV_SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export function getLiveSupabase(): SupabaseClient {
  return supabase;
}

export function getStoredConfig(): { url: string; anonKey: string } {
  return {
    url: ENV_SUPABASE_URL,
    anonKey: ENV_SUPABASE_ANON_KEY,
  };
}

export function saveStoredConfig(_url: string, _anonKey: string) {
  // Stored config is driven by environment configuration
  notifySyncEvent('config_updated', { url: ENV_SUPABASE_URL });
}

// Event bus for real-time synchronization between Admin and Public pages
type SyncListener = (event: { table: string; action: 'INSERT' | 'UPDATE' | 'DELETE' | 'RESET'; payload?: unknown }) => void;
const syncListeners: Set<SyncListener> = new Set();

export function subscribeToSync(listener: SyncListener): () => void {
  syncListeners.add(listener);
  return () => {
    syncListeners.delete(listener);
  };
}

export function notifySyncEvent(table: string, payload?: unknown, action: 'INSERT' | 'UPDATE' | 'DELETE' | 'RESET' = 'UPDATE') {
  syncListeners.forEach(listener => {
    try {
      listener({ table, action, payload });
    } catch (e) {
      console.error('Error in sync listener:', e);
    }
  });

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('cp_splash_sync');
      bc.postMessage({ table, action, payload, timestamp: Date.now() });
      bc.close();
    }
  } catch {
    // Ignore cross-tab broadcast errors
  }
}

if (typeof BroadcastChannel !== 'undefined') {
  try {
    const rxBc = new BroadcastChannel('cp_splash_sync');
    rxBc.onmessage = (ev) => {
      if (ev.data && ev.data.table) {
        syncListeners.forEach(listener => {
          try {
            listener({ table: ev.data.table, action: ev.data.action, payload: ev.data.payload });
          } catch (e) {
            console.error('Error in rx sync listener:', e);
          }
        });
      }
    };
  } catch {
    // Ignore
  }
}

// Connection test against authoritative database
export async function checkSupabaseConnection(): Promise<SupabaseConfigState> {
  try {
    const { error } = await supabase.from('products').select('id').limit(1);
    if (error) {
      return {
        url: ENV_SUPABASE_URL,
        anonKey: ENV_SUPABASE_ANON_KEY,
        isLive: false,
        status: 'disconnected',
        error: error.message,
      };
    }
    return {
      url: ENV_SUPABASE_URL,
      anonKey: ENV_SUPABASE_ANON_KEY,
      isLive: true,
      status: 'connected',
      error: null,
    };
  } catch (err: unknown) {
    return {
      url: ENV_SUPABASE_URL,
      anonKey: ENV_SUPABASE_ANON_KEY,
      isLive: false,
      status: 'disconnected',
      error: err instanceof Error ? err.message : 'Unknown connection error',
    };
  }
}
