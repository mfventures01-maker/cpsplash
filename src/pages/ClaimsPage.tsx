import React, { useEffect, useState } from 'react';
import { claimsService } from '../services/claimsService';
import { ProductClaim } from '../types/database.types';
import { ShieldCheck, CheckCircle2, AlertTriangle, Leaf, Heart, Zap, Sparkles } from 'lucide-react';

export function ClaimsPage() {
  const [claims, setClaims] = useState<ProductClaim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    claimsService.getAllClaims().then(data => {
      setClaims(data);
      setLoading(false);
    });
  }, []);

  const verifiedClaims = claims.filter(c => c.status === 'verified');
  const pendingClaims = claims.filter(c => c.status === 'pending');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider border border-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>HOEOS Governance & Scientific Substantiation</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-stone-900 tracking-tight">
          Verified Product Claims Engine
        </h1>
        <p className="text-stone-600 text-sm leading-relaxed">
          At CP Fruit Splash, customer trust is sacred. We operate a controlled health-claims verification system backed by Supabase. Only claims backed by documented laboratory protocols and physical ingredient verification may appear on our public store.
        </p>
      </div>

      {/* Strict Anti-Slop / Medical Claim Prohibition Policy Banner */}
      <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <span>Strict Prohibition on Unsupported Medical Claims</span>
        </div>
        <p className="text-xs text-amber-900/90 leading-relaxed">
          In strict accordance with HOEOS Rule 14, CP Fruit Splash never claims to "cure disease", "prevent illness", or "detoxify the body". We celebrate our natural hibiscus and whole superfruits for what they are: whole-plant hydration rich in natural dietary antioxidants, polyphenols, and Vitamin C.
        </p>
      </div>

      {/* Verified Claims Grid */}
      <div className="space-y-6">
        <h2 className="text-2xl font-black text-stone-900 flex items-center gap-2">
          <span>Active Verified Claims ({verifiedClaims.length})</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">Publicly Certified</span>
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 rounded-2xl bg-stone-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {verifiedClaims.map(claim => (
              <div
                key={claim.id}
                className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-bold text-stone-900 leading-snug">
                    {claim.claim}
                  </h3>
                  <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-stone-600">
                  <p>
                    <strong className="text-stone-800">Substantiating Source:</strong> {claim.source}
                  </p>
                  <p>
                    <strong className="text-stone-800">Approved By:</strong> {claim.approved_by || 'Quality Assurance Office'}
                  </p>
                  {claim.approved_at && (
                    <p className="text-[11px] text-stone-400 font-mono">
                      Certified: {new Date(claim.approved_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending / In-Review Claims */}
      {pendingClaims.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-stone-200">
          <h2 className="text-lg font-bold text-stone-700 flex items-center gap-2">
            <span>Claims Under Laboratory Review ({pendingClaims.length})</span>
            <span className="text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-600 font-mono">Hidden from Public Store</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingClaims.map(claim => (
              <div key={claim.id} className="p-4 rounded-2xl bg-stone-50 border border-dashed border-stone-300 text-xs space-y-1">
                <span className="font-bold text-stone-900 block">{claim.claim}</span>
                <span className="text-stone-500 block">Pending verification: {claim.source}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
