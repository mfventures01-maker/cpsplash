import React, { useEffect, useState } from 'react';
import { campaignService } from '../../services/campaignService';
import { productsService } from '../../services/productsService';
import { Campaign, Influencer, Product } from '../../types/database.types';
import { Plus, Users, Tag, ArrowRight, ExternalLink } from 'lucide-react';

export function AdminCampaignManager() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // New campaign form
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [headline, setHeadline] = useState('');
  const [subheadline, setSubheadline] = useState('');
  const [influencerId, setInfluencerId] = useState('');
  const [productId, setProductId] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(10);
  const [utmSource, setUtmSource] = useState('instagram');
  const [utmCampaign, setUtmCampaign] = useState('');

  const fetchAll = async () => {
    const [cData, iData, pData] = await Promise.all([
      campaignService.getAllCampaigns(),
      campaignService.getInfluencers(),
      productsService.getAllProducts(),
    ]);
    setCampaigns(cData);
    setInfluencers(iData);
    setProducts(pData.data);
    if (pData.data.length > 0 && !productId) setProductId(pData.data[0].id);
    if (iData.length > 0 && !influencerId) setInfluencerId(iData[0].id);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !headline) return;

    await campaignService.createCampaign({
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: headline + (subheadline ? ` - ${subheadline}` : ''),
      default_utm_source: utmSource,
      default_utm_campaign: utmCampaign || slug,
      status: 'active',
    });

    setName('');
    setSlug('');
    setHeadline('');
    setSubheadline('');
    setPromoCode('');
    fetchAll();
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      <div>
        <span className="text-xs font-mono font-bold uppercase text-rose-600 tracking-wider">
          Supabase campaigns & influencers Tables
        </span>
        <h1 className="text-3xl font-black text-stone-900 tracking-tight">
          Campaign & Influencer Attribution
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Flow: Social Traffic → /campaign/:slug → Supabase Product → WhatsApp Conversion
        </p>
      </div>

      {/* Campaign Form */}
      <form onSubmit={handleCreate} className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4 text-xs">
        <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-2">
          Create New Tracked Campaign
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-stone-700 block mb-1">Campaign Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
              }}
              placeholder="e.g. Sapele Healthy Refresh 2026"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">Campaign Landing Slug (/campaign/...) *</label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-stone-700 block mb-1">Hero Headline *</label>
            <input
              type="text"
              required
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Taste Nature. Feel Refreshed."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-semibold"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">Hero Subheadline</label>
            <input
              type="text"
              value={subheadline}
              onChange={(e) => setSubheadline(e.target.value)}
              placeholder="e.g. Fresh. Natural. Refreshing."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="font-bold text-stone-700 block mb-1">Influencer Partner</label>
            <select
              value={influencerId}
              onChange={(e) => setInfluencerId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white"
            >
              <option value="">No influencer</option>
              {influencers.map(i => (
                <option key={i.id} value={i.id}>{i.name} ({i.handle})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">Target Product</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">Promo Code</label>
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="e.g. REFRESH20"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">Discount %</label>
            <input
              type="number"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs"
          >
            Create Supabase Campaign
          </button>
        </div>
      </form>

      {/* Campaigns list */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-mono uppercase">
            <tr>
              <th className="py-3 px-6 font-bold">Campaign</th>
              <th className="py-3 px-4 font-bold">Description</th>
              <th className="py-3 px-4 font-bold">Status</th>
              <th className="py-3 px-6 font-bold text-right">Route</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {campaigns.map(cmp => {
              return (
                <tr key={cmp.id} className="hover:bg-stone-50">
                  <td className="py-4 px-6 font-bold text-stone-900">
                    <div>{cmp.name}</div>
                    <span className="text-[10px] text-stone-400 font-mono">/campaign/{cmp.slug}</span>
                  </td>
                  <td className="py-4 px-4 text-stone-700">
                    {cmp.description || '—'}
                  </td>
                  <td className="py-4 px-4 font-mono font-bold text-amber-700">
                    {cmp.status}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <a
                      href={`/campaign/${cmp.slug}`}
                      className="text-rose-600 hover:underline font-bold inline-flex items-center gap-1"
                    >
                      <span>Preview</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
