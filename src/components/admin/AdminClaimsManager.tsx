import React, { useEffect, useState } from 'react';
import { claimsService } from '../../services/claimsService';
import { productsService } from '../../services/productsService';
import { ProductClaim, Product, VerificationStatus, ClaimType } from '../../types/database.types';
import { CheckCircle2, XCircle, RefreshCw, Plus } from 'lucide-react';

export function AdminClaimsManager() {
  const [claims, setClaims] = useState<ProductClaim[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // New claim form
  const [selectedProductId, setSelectedProductId] = useState('');
  const [claimText, setClaimText] = useState('');
  const [claimSource, setClaimSource] = useState('');
  const [claimType, setClaimType] = useState<ClaimType>('health');

  const fetchData = async () => {
    setLoading(true);
    const [claimsData, prodsRes] = await Promise.all([
      claimsService.getAllClaims(),
      productsService.getAllProducts(),
    ]);
    setClaims(claimsData);
    setProducts(prodsRes.data);
    if (prodsRes.data.length > 0 && !selectedProductId) {
      setSelectedProductId(prodsRes.data[0].id);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (claimId: string, status: VerificationStatus) => {
    await claimsService.updateClaimStatus(claimId, status);
    fetchData();
  };

  const handleDeleteClaim = async (claimId: string) => {
    if (confirm('Permanently remove this claim?')) {
      await claimsService.deleteClaim(claimId);
      fetchData();
    }
  };

  const handleAddClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !claimText || !claimSource) return;

    // Strict Anti-slop / unsubstantiated medical claims check
    const prohibitedKeywords = ['cures', 'prevents illness', 'miracle cure'];
    const hasForbidden = prohibitedKeywords.some(kw => claimText.toLowerCase().includes(kw));

    if (hasForbidden) {
      alert('HOEOS REJECTION: Unsubstantiated medical disease claims are strictly prohibited under HOEOS governance.');
      return;
    }

    await claimsService.addClaim(
      selectedProductId,
      claimText,
      claimSource,
      claimType,
      'verified'
    );

    setClaimText('');
    setClaimSource('');
    fetchData();
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div>
        <span className="text-xs font-mono font-bold uppercase text-emerald-600 tracking-wider">
          HOEOS Rule 14 Governance
        </span>
        <h1 className="text-3xl font-black text-stone-900 tracking-tight">
          Product Claims & Purity Engine
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Control verified nutritional attributes. Only claims with <code>verification_status = 'verified'</code> are visible on public pages.
        </p>
      </div>

      {/* Add New Claim */}
      <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-2">
          Submit Substantive Claim for Verification
        </h3>

        <form onSubmit={handleAddClaim} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-stone-700 block mb-1">Target Product</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white font-semibold text-xs"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-stone-700 block mb-1">Claim Text *</label>
              <input
                type="text"
                required
                value={claimText}
                onChange={(e) => setClaimText(e.target.value)}
                placeholder="e.g. 100% Fresh & Natural, Rich in Antioxidants"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="font-bold text-stone-700 block mb-1">Substantiating Laboratory / Formula Source *</label>
              <input
                type="text"
                required
                value={claimSource}
                onChange={(e) => setClaimSource(e.target.value)}
                placeholder="e.g. Physical calyces inspection batch QA report #CP-2026"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Claim Type</label>
              <select
                value={claimType}
                onChange={(e) => setClaimType(e.target.value as ClaimType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs"
              >
                <option value="health">Health Claim</option>
                <option value="benefit">Functional Benefit</option>
                <option value="marketing">Marketing Claim</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Verify & Register Claim</span>
            </button>
          </div>
        </form>
      </div>

      {/* Claims Management Table */}
      <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-stone-900">
            Registered Product Claims Database (product_claims)
          </h3>
          <button onClick={fetchData} className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-stone-400 font-mono uppercase tracking-wider">
                <th className="py-2.5 font-bold">Claim</th>
                <th className="py-2.5 font-bold">Product</th>
                <th className="py-2.5 font-bold">Type</th>
                <th className="py-2.5 font-bold">Status</th>
                <th className="py-2.5 font-bold">Substantiation Source</th>
                <th className="py-2.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {claims.map((claim) => {
                const prod = products.find(p => p.id === claim.product_id);
                return (
                  <tr key={claim.id} className="hover:bg-stone-50/70">
                    <td className="py-3 font-bold text-stone-900">
                      {claim.claim}
                    </td>
                    <td className="py-3 font-semibold text-stone-700">
                      {prod?.name || claim.product_id}
                    </td>
                    <td className="py-3 font-mono text-[10px] text-stone-500 uppercase">
                      {claim.claim_type}
                    </td>
                    <td className="py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        claim.verification_status === 'verified'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                          : claim.verification_status === 'rejected'
                          ? 'bg-rose-50 text-rose-800 border border-rose-300'
                          : 'bg-amber-50 text-amber-800 border border-amber-300'
                      }`}>
                        {claim.verification_status}
                      </span>
                    </td>
                    <td className="py-3 text-stone-600 max-w-xs truncate text-[11px]">
                      {claim.evidence_source}
                    </td>
                    <td className="py-3 text-right space-x-1">
                      {claim.verification_status !== 'verified' && (
                        <button
                          onClick={() => handleUpdateStatus(claim.id, 'verified')}
                          className="p-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold px-2 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Verify
                        </button>
                      )}
                      {claim.verification_status !== 'rejected' && (
                        <button
                          onClick={() => handleUpdateStatus(claim.id, 'rejected')}
                          className="p-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-[11px] font-bold px-2 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3 h-3" /> Reject
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteClaim(claim.id)}
                        className="text-stone-400 hover:text-red-600 p-1 text-[11px] cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
