import React, { useState, useEffect } from 'react';
import { Product, MediaPlacement } from '../../types/database.types';
import { MessageCircle, ArrowRight, ShieldCheck, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';
import {
  getProductPrice,
  getProductVolume,
  getProductHeroMediaUrl,
  BRAND_PLACEHOLDER_IMAGE
} from '../../services/productHelpers';
import { mediaService } from '../../services/mediaService';
import { placementService } from '../../services/placementService';
import { BUSINESS_CONFIG, buildWhatsAppUrl } from '../../services/businessConfig';
import { Pause, Play } from 'lucide-react';

interface HeroSliderProps {
  products: Product[];
  onNavigate: (path: string) => void;
  onOpenOrderModal: (product: Product) => void;
}

export function HeroSlider({ products, onNavigate, onOpenOrderModal }: HeroSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [heroPlacements, setHeroPlacements] = useState<MediaPlacement[]>([]);

  useEffect(() => {
    let mounted = true;
    async function loadPlacements() {
      const data = await placementService.getPlacements('homepage_hero');
      if (mounted) setHeroPlacements(data);
    }
    loadPlacements();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    if (mediaQuery.matches) setIsPlaying(false);

    const listener = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
      if (e.matches) setIsPlaying(false);
    };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // Derive dynamic slides strictly from published database records and persistent media placements
  const featured = products.filter(p => p.featured);
  const candidates = featured.length > 0 ? featured : products.slice(0, 3);

  const dynamicSlides = candidates.map((p, idx) => {
    // Check if a persistent hero placement exists for this slot
    const placement = heroPlacements[idx];
    const placementAsset = placement?.media_assets || placement?.asset;
    const placementUrl = placementAsset ? mediaService.getMediaAssetUrl(placementAsset) : null;
    const isAnimation = placementAsset?.mime_type === 'image/gif';

    // Check if product has an approved lifestyle asset (role='lifestyle' or sort_order=4)
    const rawSeq = p.metadata?.media_sequence as Array<{ role: string; media_id: string }> | undefined;
    const lifestyleSeq = rawSeq?.find(s => s.role === 'lifestyle');
    let lifestyleUrl: string | null = null;
    if (lifestyleSeq) {
      const matched = p.media?.find(m => m.media_id === lifestyleSeq.media_id);
      if (matched) {
        lifestyleUrl = mediaService.getMediaAssetUrl(matched.media_assets || matched.asset);
      }
    }
    if (!lifestyleUrl && p.media && p.media.length > 3) {
      lifestyleUrl = mediaService.getMediaAssetUrl(p.media[3].media_assets || p.media[3].asset);
    }

    return {
      id: `slide-${p.id}`,
      title: p.brand || 'CP Fruit Splash',
      headline: p.name,
      subheadline: p.short_description || p.seo_title || 'Cold-Crafted Natural Beverage',
      description: p.description || p.short_description || 'Cold-crafted in Sapele, Delta State with pure natural ingredients and verified health claims.',
      cta: `Discover ${p.name}`,
      secondaryCta: 'Order on WhatsApp',
      product: p,
      bgGradient: idx % 2 === 0 ? 'from-rose-950 via-red-950 to-stone-950' : 'from-stone-950 via-purple-950 to-rose-950',
      badge: isAnimation
        ? `${p.category?.name || 'Signature Blend'} • Animated`
        : `${p.category?.name || 'Signature Blend'} • Cold Bottle`,
      badgeColor: idx % 2 === 0 ? 'bg-rose-900/60 border-rose-500/40 text-rose-200' : 'bg-amber-900/60 border-amber-500/40 text-amber-200',
      highlights: (p.claims || [])
        .filter(c => c.verification_status === 'verified')
        .slice(0, 3)
        .map(c => c.claim),
      imageSrc: placementUrl || getProductHeroMediaUrl(p),
      altText: placement?.alt_text_override || placementAsset?.alt_text || p.name,
      lifestyleSrc: lifestyleUrl,
    };
  });

  // Standalone persistent hero placements if any exist beyond product candidates
  const standalonePlacementSlides = heroPlacements
    .filter((_, idx) => idx >= candidates.length)
    .map((placement, pIdx) => {
      const asset = placement.media_assets || placement.asset;
      const imgUrl = mediaService.getMediaAssetUrl(asset);
      const isGif = asset?.mime_type === 'image/gif';
      return {
        id: `placement-slide-${placement.id}`,
        title: 'CP Fruit Splash',
        headline: placement.alt_text_override || asset?.caption || 'Artisanal Cold-Crafted Refreshment',
        subheadline: 'Cold-Crafted Botanicals & Superfruits',
        description: 'Fresh Nigerian fruit drinks handcrafted daily in Sapele, Delta State with zero synthetic preservatives.',
        cta: 'Explore Full Range',
        secondaryCta: 'Order on WhatsApp',
        product: null as Product | null,
        bgGradient: pIdx % 2 === 0 ? 'from-rose-950 via-red-950 to-stone-950' : 'from-stone-950 via-purple-950 to-rose-950',
        badge: isGif ? '100% Fresh • Animated Showcase' : '100% Fresh & Natural • Sapele Flagship',
        badgeColor: 'bg-rose-900/60 border-rose-500/40 text-rose-200',
        highlights: ['Zero Artificial Preservatives', 'Cold-Chain Sealed', 'Sapele Flagship Hub'],
        imageSrc: imgUrl || BRAND_PLACEHOLDER_IMAGE,
        altText: placement.alt_text_override || asset?.alt_text || 'CP Splash Spotlight',
        lifestyleSrc: null,
      };
    });

  // Fallback presentation when catalog has no live published products yet
  const defaultPlacementAsset = heroPlacements[0]?.media_assets || heroPlacements[0]?.asset;
  const defaultPlacementUrl = defaultPlacementAsset ? mediaService.getMediaAssetUrl(defaultPlacementAsset) : null;
  const defaultSlide = {
    id: 'slide-default',
    title: 'CP Fruit Splash',
    headline: 'Taste Nature. Feel Refreshed.',
    subheadline: 'Cold-Crafted Botanicals & Superfruits',
    description: 'Artisanal Nigerian beverages handcrafted in Sapele, Delta State. Zero synthetic preservatives, live synchronized via our database-backed product engine.',
    cta: 'Explore Full Range',
    secondaryCta: 'Connect on WhatsApp',
    product: null as Product | null,
    bgGradient: 'from-rose-950 via-red-950 to-stone-950',
    badge: '100% Fresh & Natural • Sapele Flagship',
    badgeColor: 'bg-rose-900/60 border-rose-500/40 text-rose-200',
    highlights: ['Zero Artificial Preservatives', 'Cold-Chain Sealed', 'Sapele Flagship Hub'],
    imageSrc: defaultPlacementUrl || BRAND_PLACEHOLDER_IMAGE,
    altText: heroPlacements[0]?.alt_text_override || defaultPlacementAsset?.alt_text || 'CP Fruit Splash Natural Beverage',
    lifestyleSrc: null,
  };

  const combinedSlides = [...dynamicSlides, ...standalonePlacementSlides];
  const slides = combinedSlides.length > 0 ? combinedSlides : [defaultSlide];

  useEffect(() => {
    if (slides.length <= 1 || !isPlaying || prefersReducedMotion) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1 >= slides.length ? 0 : prev + 1));
    }, 7500);
    return () => clearInterval(timer);
  }, [slides.length, isPlaying, prefersReducedMotion]);

  const slide = slides[currentSlide] || slides[0];
  const activeProduct = slide.product;
  const activePrice = activeProduct ? getProductPrice(activeProduct) : { amount: 0, compare_at_amount: null, currency: 'NGN' };
  const activeVolume = activeProduct ? getProductVolume(activeProduct) : { volume: 500, unit: 'ml' };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeProduct) {
      analyticsService.trackEvent('whatsapp_click', {
        productId: activeProduct.id,
        content: `hero_slide_${currentSlide + 1}`,
      });
      onOpenOrderModal(activeProduct);
    } else {
      window.open(buildWhatsAppUrl('Hello CP Splash, I would like to inquire about your products!'), '_blank');
    }
  };

  const handleDiscover = () => {
    if (activeProduct) {
      analyticsService.trackEvent('product_view', {
        productId: activeProduct.id,
        content: `hero_slide_${currentSlide + 1}_cta`,
      });
      onNavigate(`/products/${activeProduct.slug}`);
    } else {
      onNavigate('/products');
    }
  };

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${slide.bgGradient} text-white transition-colors duration-1000 min-h-[580px] lg:min-h-[640px] flex items-center`}>
      {/* Decorative background glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Text Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-sm ${slide.badgeColor}`}>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {slide.badge}
              </span>
              <span className="text-xs text-rose-300 font-mono tracking-wide">
                NOW AVAILABLE IN SAPELE & NATIONWIDE
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">
                {slide.title}
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] text-white">
                {slide.headline}
              </h1>
              <p className="text-xl sm:text-2xl font-serif italic text-rose-200 font-medium">
                {slide.subheadline}
              </p>
            </div>

            <p className="text-sm sm:text-base text-stone-300 max-w-xl leading-relaxed">
              {slide.description}
            </p>

            {/* Authoritative Price Display dynamically from Supabase */}
            {activeProduct && activePrice.amount > 0 && (
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm inline-flex items-center gap-4">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-stone-400 block font-semibold">
                    Supabase Price Engine
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-white">
                      ₦{activePrice.amount.toLocaleString()}
                    </span>
                    {activePrice.compare_at_amount && (
                      <span className="text-sm text-stone-400 line-through">
                        ₦{activePrice.compare_at_amount.toLocaleString()}
                      </span>
                    )}
                    <span className="text-xs text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/30">
                      {activeVolume.volume}{activeVolume.unit}
                    </span>
                  </div>
                </div>

                <div className="h-8 w-px bg-white/10" />

                <div className="text-xs text-stone-300">
                  <div className="flex items-center gap-1 text-emerald-300 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Fresh
                  </div>
                  <span className="text-stone-400 text-[11px]">No Preservatives</span>
                </div>
              </div>
            )}

            {/* Highlight Badges from verified claims */}
            {slide.highlights.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {slide.highlights.map((item, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-stone-300 font-medium">
                    ✓ {item}
                  </span>
                ))}
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleDiscover}
                className="px-6 py-3.5 rounded-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-sm shadow-lg shadow-rose-900/40 flex items-center gap-2 transition-all hover:gap-3 cursor-pointer"
              >
                <span>{slide.cta}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleWhatsApp}
                className="px-6 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-emerald-600 text-white" />
                <span>{slide.secondaryCta}</span>
              </button>
            </div>
          </div>

          {/* Product Media Display */}
          <div className="lg:col-span-5 flex justify-center relative">
            <div className="relative w-full max-w-md aspect-square rounded-3xl p-6 bg-gradient-to-b from-white/10 to-white/5 border border-white/15 backdrop-blur-md shadow-2xl flex items-center justify-center group overflow-hidden">
              <img
                src={slide.imageSrc}
                alt={slide.altText || slide.title}
                className="w-full h-full object-cover rounded-2xl shadow-inner transition-transform duration-700 group-hover:scale-105"
                loading="eager"
              />

              {/* Inset lifestyle photo badge (only if approved asset exists) */}
              {slide.lifestyleSrc && (
                <div className="absolute -bottom-2 -right-2 p-2 bg-stone-900/90 rounded-2xl border border-white/20 shadow-xl backdrop-blur-md max-w-[150px] hidden sm:block">
                  <img
                    src={slide.lifestyleSrc}
                    alt="Lifestyle Presentation"
                    className="w-full h-20 object-cover rounded-xl mb-1.5"
                  />
                  <p className="text-[10px] font-semibold text-rose-300 text-center leading-tight">
                    Approved Campaign
                  </p>
                </div>
              )}

              {/* Verified Badge */}
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-emerald-900/80 border border-emerald-400/40 text-emerald-200 text-[11px] font-bold backdrop-blur-md flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Verified Batch
              </div>
            </div>
          </div>
        </div>

        {/* Slide navigation controls */}
        {slides.length > 1 && (
          <div className="flex items-center justify-between pt-10 border-t border-white/10 mt-12">
            <div className="flex items-center gap-3">
              {slides.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    currentSlide === idx ? 'w-10 bg-rose-500' : 'w-2.5 bg-white/30 hover:bg-white/50'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                aria-label={isPlaying ? "Pause automatic slide advancement" : "Resume automatic slide advancement"}
                title={isPlaying ? "Pause slider" : "Play slider"}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
              </button>
              <button
                type="button"
                onClick={() => setCurrentSlide(prev => (prev === 0 ? slides.length - 1 : prev - 1))}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentSlide(prev => (prev + 1 >= slides.length ? 0 : prev + 1))}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                aria-label="Next slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
