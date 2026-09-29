import React from 'react';
import { Product } from '../../types/database.types';
import { MessageCircle, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';

interface ProductCardProps {
  product: Product;
  onNavigate: (path: string) => void;
  onOpenOrderModal: (product: Product) => void;
}

export function ProductCard({ product, onNavigate, onOpenOrderModal }: ProductCardProps) {
  const primaryMedia = product.media?.find(m => m.is_primary) || product.media?.[0];
  const imageUrl = primaryMedia?.url || 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80';

  // Authoritative price directly from Supabase record
  const currentPrice = product.sale_price !== null && product.sale_price !== undefined
    ? product.sale_price
    : product.base_price;

  const verifiedClaims = product.claims?.filter(c => c.status === 'verified').slice(0, 2) || [];

  const handleCardClick = () => {
    analyticsService.trackEvent('product_view', {
      productId: product.id,
      landingPage: window.location.pathname,
    });
    onNavigate(`/products/${product.slug}`);
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    analyticsService.trackEvent('whatsapp_click', {
      productId: product.id,
      metadata: { source: 'product_card' },
    });
    onOpenOrderModal(product);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="group bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer transform hover:-translate-y-1"
    >
      {/* Product Image Area */}
      <div className="relative aspect-square w-full bg-stone-100 overflow-hidden">
        <img
          src={imageUrl}
          alt={primaryMedia?.alt_text || product.name}
          className="w-full h-full object-cover transition-transform duration-750 group-hover:scale-108"
          loading="lazy"
        />

        {/* Volume badge */}
        <div className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-stone-900/80 backdrop-blur-md text-white font-mono text-[11px] font-bold border border-white/20">
          {product.volume_ml}mL
        </div>

        {/* Status or Featured badge */}
        {product.featured && (
          <div className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-full bg-amber-500 text-stone-950 font-bold text-[10px] uppercase tracking-wider shadow-sm flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Flagship Blend
          </div>
        )}

        {/* Quick hover reveal overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <span className="text-white text-xs font-semibold flex items-center gap-1.5">
            View full formulation & gallery <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Verified Claims tags */}
          <div className="flex flex-wrap gap-1.5">
            {verifiedClaims.map(claim => (
              <span 
                key={claim.id} 
                className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200"
              >
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                {claim.claim}
              </span>
            ))}
          </div>

          <h3 className="font-extrabold text-lg text-stone-900 group-hover:text-rose-700 transition-colors leading-snug line-clamp-1">
            {product.name}
          </h3>

          <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
            {product.short_description || 'Cold-crafted natural Nigerian beverage. Pure fruit vitality.'}
          </p>
        </div>

        {/* Price Engine Display & CTA */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-stone-900">
                ₦{Number(currentPrice).toLocaleString()}
              </span>
              {product.sale_price && (
                <span className="text-xs text-stone-400 line-through">
                  ₦{Number(product.base_price).toLocaleString()}
                </span>
              )}
            </div>
            <span className="text-[10px] text-stone-400 font-mono block">
              Supabase Price Engine
            </span>
          </div>

          <button
            onClick={handleWhatsApp}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-emerald-700/20 transition-all cursor-pointer"
            title="Order directly on WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-white text-emerald-600" />
            <span>Order</span>
          </button>
        </div>
      </div>
    </div>
  );
}
