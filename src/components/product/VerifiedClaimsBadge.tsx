import React, { useState } from 'react';
import { ProductClaim } from '../../types/database.types';
import { ShieldCheck, Leaf, Heart, Sparkles, Zap, CheckCircle2 } from 'lucide-react';

interface VerifiedClaimsProps {
  claims?: ProductClaim[];
}

export function VerifiedClaimsBadge({ claims = [] }: VerifiedClaimsProps) {
  const [selectedClaim, setSelectedClaim] = useState<ProductClaim | null>(null);

  // Filter only verified claims for public presentation (HOEOS Rule)
  const verifiedList = claims.filter(c => c.verification_status === 'verified');

  if (verifiedList.length === 0) {
    return null;
  }

  const getIcon = (claimType: string) => {
    switch (claimType) {
      case 'health':
        return <Heart className="w-4 h-4 text-rose-500" />;
      case 'benefit':
        return <Zap className="w-4 h-4 text-amber-500" />;
      default:
        return <Leaf className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <div className="space-y-3 p-5 rounded-3xl bg-emerald-50/70 border border-emerald-200/80">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-emerald-600 text-white">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-950">
              HOEOS Verified Product Claims
            </h4>
            <p className="text-[11px] text-emerald-800">
              Only lab-substantiated and batch-certified claims appear publicly.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {verifiedList.map((claim) => (
          <div
            key={claim.id}
            onClick={() => setSelectedClaim(selectedClaim?.id === claim.id ? null : claim)}
            className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border border-emerald-100 hover:border-emerald-300 shadow-xs cursor-pointer transition-all hover:shadow-sm"
          >
            <div className="mt-0.5 shrink-0">
              {getIcon(claim.claim_type)}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-stone-900 block leading-tight">
                {claim.claim}
              </span>
              {claim.evidence_source && (
                <span className="text-[10px] text-emerald-700 block truncate mt-0.5">
                  Source: {claim.evidence_source}
                </span>
              )}
            </div>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
          </div>
        ))}
      </div>

      {/* Selected Claim Verification Details Dialog */}
      {selectedClaim && (
        <div className="p-3.5 rounded-2xl bg-white border border-emerald-300 text-xs space-y-1.5 animate-in fade-in duration-200">
          <div className="flex justify-between items-center text-emerald-900 font-bold">
            <span>Certification Authority:</span>
            <span className="text-emerald-700">CP Quality Assurance Lead</span>
          </div>
          {selectedClaim.evidence_source && (
            <p className="text-stone-600 text-[11px] leading-relaxed">
              <strong>Substantiation:</strong> {selectedClaim.evidence_source}
            </p>
          )}
          {selectedClaim.verified_at && (
            <p className="text-[10px] text-stone-400 font-mono">
              Audit Date: {new Date(selectedClaim.verified_at).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
