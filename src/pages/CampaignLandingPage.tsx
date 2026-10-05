import React, { useEffect, useState } from 'react';
import { campaignService } from '../services/campaignService';
import { productsService } from '../services/productsService';
import { Campaign, Product } from '../types/database.types';
import { analyticsService } from '../services/analyticsService';
import { getProductPrice, getProductVolume, getProductHeroMediaUrl } from '../services/productHelpers';
import { Sparkles, MessageCircle, ArrowRight, Tag, ShieldCheck, Play } from 'lucide-react';

interface CampaignLandingPageProps {
  slug: string;
  onNavigate: (path: string) => void;
  onOpenOrderModal: (product: Product) => void;
}

export function CampaignLandingPage({ slug, onNavigate, onOpenOrderModal }: CampaignLandingPageProps) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    campaignService.getCampaignBySlug(slug).then(async (cmp) => {
      setCampaign(cmp);
      // Fetch default campaign featured product
      const { data: prods } = await productsService.getPublishedProducts();
      if (prods && prods.length > 0) {
        setProduct(prods.find(p => p.featured) || prods[0]);
      }
      setLoading(false);

      if (cmp) {
        analyticsService.trackEvent('campaign_view', {
          campaign: cmp.name,
          source: cmp.default_utm_source,
          medium: cmp.default_utm_medium,
          landingPage: `/campaign/${slug}`
        });
      }
    });
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="h-64 rounded-3xl bg-stone-100 animate-pulse" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-stone-900">Campaign Not Found</h2>
        <p className="text-stone-500 text-sm">This social campaign link has expired or is invalid.</p>
        <button
          onClick={() => onNavigate('/')}
          className="px-6 py-2.5 rounded-full bg-stone-900 text-white text-xs font-bold"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-20">
      {/* Campaign Hero Banner */}
      <div className="bg-gradient-to-br from-rose-950 via-stone-900 to-stone-950 text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-rose-900/50">
        <div className="max-w-5xl mx-auto space-y-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-900/80 border border-rose-500/40 text-rose-200 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Special Creator Campaign</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight max-w-3xl mx-auto">
            {campaign.name}
          </h1>

          {campaign.description && (
            <p className="text-lg sm:text-xl font-serif italic text-rose-200 max-w-2xl mx-auto">
              {campaign.description}
            </p>
          )}
        </div>
      </div>

      {/* Main Campaign Product Connection */}
      {product && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-white border border-stone-200 shadow-xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-5 aspect-square rounded-2xl overflow-hidden bg-stone-100">
              {getProductHeroMediaUrl(product) && (
                <img
                  src={getProductHeroMediaUrl(product)}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="md:col-span-7 space-y-4">
              <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold uppercase tracking-wider">
                Featured Campaign Product
              </span>
              <h2 className="text-3xl font-black text-stone-900">{product.name}</h2>
              <p className="text-stone-600 text-sm leading-relaxed">{product.short_description}</p>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-stone-500 block">Campaign Special Price</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-stone-900">
                      ₦{getProductPrice(product).amount.toLocaleString()}
                    </span>
                    {getProductPrice(product).compare_at_amount && (
                      <span className="text-xs text-stone-400 line-through">
                        ₦{getProductPrice(product).compare_at_amount?.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  {getProductVolume(product).volume}{getProductVolume(product).unit} Fresh Bottle
                </span>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => onOpenOrderModal(product)}
                  className="flex-1 py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Claim & Order on WhatsApp</span>
                </button>
                <button
                  onClick={() => onNavigate(`/products/${product.slug}`)}
                  className="py-3.5 px-5 rounded-2xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Product Specs</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
