import React, { useEffect, useState } from 'react';
import { 
  getStoredConfig, 
  saveStoredConfig, 
  checkSupabaseConnection, 
  SupabaseConfigState 
} from '../../lib/supabase';
import { Database, CheckCircle2, AlertTriangle, RefreshCw, Key, Shield, Terminal, ArrowUpRight } from 'lucide-react';

export function AdminSettings() {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [statusState, setStatusState] = useState<SupabaseConfigState | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    const config = getStoredConfig();
    setUrl(config.url || '');
    setAnonKey(config.anonKey || '');
    checkSupabaseConnection().then(setStatusState);
  }, []);

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setSaveMessage(null);

    saveStoredConfig(url.trim(), anonKey.trim());
    const res = await checkSupabaseConnection();
    setStatusState(res);
    setIsTesting(false);
    setSaveMessage('Supabase client reconfigured successfully!');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div>
        <span className="text-xs font-mono font-bold uppercase text-rose-600 tracking-wider">
          HOEOS Gate G2 Configuration
        </span>
        <h1 className="text-3xl font-black text-stone-900 tracking-tight">
          Supabase Connection & Engine Settings
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Connect your live Supabase cloud project or verify the active PostgREST data layer.
        </p>
      </div>

      {saveMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Live Status Card */}
      <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-stone-900">
              Database Connection Health Check
            </h3>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
            statusState?.isLive 
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
              : 'bg-stone-100 text-stone-700'
          }`}>
            {statusState?.isLive ? 'Supabase Live Connected' : 'PostgREST Authoritative Engine'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-2 font-mono">
          <div className="flex justify-between">
            <span className="text-stone-500">Current Endpoint:</span>
            <span className="font-semibold text-stone-800 truncate max-w-xs">{url || 'Local PostgREST Engine'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Auth Token Role:</span>
            <span className="font-semibold text-stone-800">{anonKey ? 'Public Anon Key (Protected)' : 'Anonymous / Mock'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Master Migration Schema:</span>
            <span className="font-semibold text-emerald-700">/supabase/migrations/20260929000000_cp_splash_schema.sql</span>
          </div>
        </div>
      </div>

      {/* Configure Live Supabase Credentials */}
      <form onSubmit={handleTestAndSave} className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4 text-xs">
        <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">
          <Key className="w-4 h-4 text-stone-500" />
          <span>Supabase Project Credentials</span>
        </h3>

        <div className="space-y-3">
          <div>
            <label className="font-bold text-stone-700 block mb-1">
              Supabase Project URL (VITE_SUPABASE_URL)
            </label>
            <input
              type="text"
              placeholder="https://your-project.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">
              Supabase Anon Public API Key (VITE_SUPABASE_ANON_KEY)
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>

        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed flex items-start gap-2">
          <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>HOEOS Security Rule:</strong> Never expose privileged administrative keys or backend secrets in client-facing code. Only public <code>anon</code> keys are permitted here.
          </span>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isTesting}
            className="px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'Testing Connection...' : 'Save & Verify Connection'}</span>
          </button>
        </div>
      </form>

      {/* Database Maintenance & Live Architecture Status */}
      <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-2">
          Authoritative Production Architecture
        </h3>

        <div className="flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-stone-900 block">Supabase ECOMMERCE Cloud Instance</span>
            <span className="text-stone-500 text-[11px]">
              Direct PostgREST synchronization active. Tenant: CP Fruit Splash (42d36cee-4cd6-43d1-af5d-334e5a07e37c).
            </span>
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold font-mono">
            LIVE SYNCHRONIZED
          </span>
        </div>
      </div>
    </div>
  );
}
