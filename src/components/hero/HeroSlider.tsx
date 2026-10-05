import React, { useState, useEffect } from 'react';
import { Product } from '../../types/database.types';
import { MessageCircle, ArrowRight, ShieldCheck, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';
import { getProductPrice, getProductVolume, getProductHeroMediaUrl } from '../../services/productHelpers';

interface HeroSliderProps {
  products: Product[];
  onNavigate: (path: string) => void;
  onOpenOrderModal: (product: Product) => void;
}

export function HeroSlider({ products, onNavigate, onOpenOrderModal }: HeroSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const zoboProduct = products.find(p => p.slug === 'zobo-sweet') || products[0];
  const luxuryProduct = products.find(p => p.slug === 'luxury-juice-mix') || products[1] || products[0];

  const slides = [
    {
      id: 'slide-1',
      title: 'CP Fruit Splash Zobo Sweet',
      headline: 'Taste Nature. Feel Refreshed.',
      subheadline: 'Fresh. Natural. Refreshing.',
      description: 'Artisanal Nigerian hibiscus beverage steeped from premium sun-ripened calyces. Packed with natural antioxidants, vital polyphenols, and gentle sweetness. Zero artificial colours or preservatives.',
      cta: 'Discover Zobo Sweet',
      secondaryCta: 'Order on WhatsApp',
      product: zoboProduct,
      bgGradient: 'from-rose-950 via-red-950 to-stone-950',
      badge: 'Hibiscus Drink • 100% Fresh & Natural',
      badgeColor: 'bg-rose-900/60 border-rose-500/40 text-rose-200',
      highlights: ['Rich in Antioxidants', 'Extra Vitamin C', 'No Artificial Preservatives'],
      imageSrc: getProductHeroMediaUrl(zoboProduct),
      lifestyleSrc: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'slide-2',
      title: 'CP Fruit Splash Luxury Juice Mix',
      headline: 'Goodness in Every Sip.',
      subheadline: 'Pomegranate • Apple • Strawberry • Blueberry',
      description: 'The ultimate royal antioxidant elixir. Four whole superfruits cold-blended into crisp refreshing perfection, naturally fortified with Extra Vitamin C to elevate your vitality.',
      cta: 'Discover Luxury Juice Mix',
      secondaryCta: 'Order on WhatsApp',
      product: luxuryProduct,
      bgGradient: 'from-purple-950 via-rose-950 to-stone-950',
      badge: 'Luxury Cold Blend • 500mL',
      badgeColor: 'bg-amber-900/60 border-amber-500/40 text-amber-200',
      highlights: ['Pomegranate Arils', 'Whole Orchard Apples', 'Mountain Strawberries', 'Wild Blueberries'],
      imageSrc: getProductHeroMediaUrl(luxuryProduct),
      lifestyleSrc: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === 0 ? 1 : 0));
    }, 7500);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[currentSlide];
  const activeProduct = slide.product;
  const activePrice = getProductPrice(activeProduct);
  const activeVolume = getProductVolume(activeProduct);

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeProduct) {
      analyticsService.trackEvent('whatsapp_click', {
        productId: activeProduct.id,
        content: `hero_slide_${currentSlide + 1}`,
      });
      onOpenOrderModal(activeProduct);
    }
  };

  const handleDiscover = () => {
    if (activeProduct) {
      analyticsService.trackEvent('product_view', {
        productId: activeProduct.id,
        content: `hero_slide_${currentSlide + 1}_cta`,
      });
      onNavigate(`/products/${activeProduct.slug}`);
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

            {/* Highlight Badges */}
            <div className="flex flex-wrap gap-2 pt-1">
              {slide.highlights.map((item, idx) => (
                <span key={idx} className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-stone-300 font-medium">
                  ✓ {item}
                </span>
              ))}
            </div>

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
                alt={slide.title}
                className="w-full h-full object-cover rounded-2xl shadow-inner transition-transform duration-700 group-hover:scale-105"
                loading="eager"
              />

              {/* Inset lifestyle photo badge */}
              <div className="absolute -bottom-2 -right-2 p-2 bg-stone-900/90 rounded-2xl border border-white/20 shadow-xl backdrop-blur-md max-w-[150px] hidden sm:block">
                <img
                  src={slide.lifestyleSrc}
                  alt="Lifestyle Model"
                  className="w-full h-20 object-cover rounded-xl mb-1.5"
                />
                <p className="text-[10px] font-semibold text-rose-300 text-center leading-tight">
                  Goodness in Every Sip!
                </p>
              </div>

              {/* Verified Badge */}
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-emerald-900/80 border border-emerald-400/40 text-emerald-200 text-[11px] font-bold backdrop-blur-md flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Verified Batch
              </div>
            </div>
          </div>
        </div>

        {/* Slide navigation controls */}
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
              onClick={() => setCurrentSlide(prev => (prev === 0 ? 1 : 0))}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentSlide(prev => (prev === 0 ? 1 : 0))}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
