import React, { useEffect, useState } from 'react';
import { HeroSlider } from '../components/hero/HeroSlider';
import { ProductCard } from '../components/product/ProductCard';
import { SocialProofFeed } from '../components/product/SocialProofFeed';
import { Product, SocialContent, BlogPost, SalesTerritory } from '../types/database.types';
import { useProducts } from '../hooks/useProducts';
import { socialService } from '../services/socialService';
import { blogService } from '../services/blogService';
import { salesService } from '../services/salesService';
import { analyticsService } from '../services/analyticsService';
import { CommercialSalesEngine } from '../components/sales/CommercialSalesEngine';
import {
  ShieldCheck,
  Heart,
  Sparkles,
  MapPin,
  MessageCircle,
  ArrowRight,
  CheckCircle2,
  Truck,
  Droplets,
  Award,
  Building2,
  Trophy,
  Users,
  GraduationCap,
  Layers
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (path: string) => void;
  onOpenOrderModal: (product: Product) => void;
}

export function HomePage({ onNavigate, onOpenOrderModal }: HomePageProps) {
  const { products, loading, error } = useProducts();
  const [socialItems, setSocialItems] = useState<SocialContent[]>([]);
  const [recentBlog, setRecentBlog] = useState<BlogPost[]>([]);
  const [territories, setTerritories] = useState<SalesTerritory[]>([]);
  const [territoriesLoading, setTerritoriesLoading] = useState(true);
  const [activeEngineTerritory, setActiveEngineTerritory] = useState<SalesTerritory | null>(null);

  useEffect(() => {
    analyticsService.trackEvent('page_view', { landingPage: '/' });
    socialService.getPublishedContent().then(setSocialItems);
    blogService.getPublishedPosts().then(posts => setRecentBlog(posts.slice(0, 2)));
    salesService.getActiveTerritories().then(data => {
      setTerritories(data);
      setTerritoriesLoading(false);
    });
  }, []);


  return (
    <div className="space-y-20 pb-20">
      {/* 1. Master Hero Slider */}
      <HeroSlider
        products={products}
        onNavigate={onNavigate}
        onOpenOrderModal={onOpenOrderModal}
      />

      {/* 2. Primary Commercial Qualification Entry: "What are you buying for?" */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        <div className="bg-stone-900 text-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-stone-800 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-800 pb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Commercial Acquisition Engine</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                What are you buying for?
              </h2>
              <p className="text-stone-400 text-sm max-w-xl">
                Select your buyer territory below. Each path provides tailored pricing, institutional terms, or direct cold-chain order routing.
              </p>
            </div>
            <div className="text-xs font-mono text-stone-400 bg-stone-950 px-3 py-1.5 rounded-xl border border-stone-800">
              Deterministic RLS • Zero Hardcoded Logic
            </div>
          </div>

          {territoriesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-36 rounded-2xl bg-stone-800/60 animate-pulse border border-stone-700/50" />
              ))}
            </div>
          ) : territories.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-stone-950 border border-stone-800 space-y-3">
              <p className="text-sm font-semibold text-stone-300">
                Commercial territories are governed by the live Supabase CMS.
              </p>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                No active territory records currently exist in the database. Publish territories (Sports, Parties & Events, Hotels, Schools, Individuals) via the CMS Admin to activate the dynamic buyer funnels.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {territories.map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    if (t.landing_path) {
                      onNavigate(t.landing_path);
                    } else {
                      setActiveEngineTerritory(t);
                    }
                  }}
                  className="group text-left p-5 rounded-2xl bg-stone-950/70 hover:bg-stone-800/90 border border-stone-800 hover:border-rose-500/60 transition-all duration-300 flex flex-col justify-between cursor-pointer"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-900/40 inline-block">
                      {t.slug}
                    </span>
                    <h3 className="text-base font-black text-white group-hover:text-rose-400 transition-colors">
                      {t.name}
                    </h3>
                    <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">
                      {t.headline || t.buyer_summary || t.description || 'Exclusive terms & delivery.'}
                    </p>
                  </div>
                  <div className="pt-4 mt-2 flex items-center justify-between text-xs font-bold text-rose-400 group-hover:translate-x-0.5 transition-transform">
                    <span>{t.cta_label || 'Get Pricing'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3. Core Pillars Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 rounded-3xl bg-white border border-stone-200/90 shadow-xl shadow-stone-200/50">
          <div className="flex items-center gap-3.5 p-2">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
              <Droplets className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-stone-900 text-sm">100% Fresh & Natural</h4>
              <p className="text-xs text-stone-500">Pure botanicals & real fruit extraction</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-stone-900 text-sm">Rich in Antioxidants</h4>
              <p className="text-xs text-stone-500">Natural polyphenols + Extra Vitamin C</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-stone-900 text-sm">Zero Preservatives</h4>
              <p className="text-xs text-stone-500">No artificial colours, syrups or chemicals</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-2">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-stone-900 text-sm">Sapele, Delta State</h4>
              <p className="text-xs text-stone-500">Opposite Ajimele Junction flagship</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Authoritative Product Engine Catalog */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider">
              <span>Authoritative Supabase Product Engine</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight mt-1">
              Explore Our Signature Blends
            </h2>
            <p className="text-stone-600 text-sm max-w-xl mt-2">
              Every bottle is cold-crafted, sealed fresh, and priced deterministically through our live Supabase database.
            </p>
          </div>

          <button
            onClick={() => onNavigate('/products')}
            className="inline-flex items-center gap-2 text-rose-700 hover:text-rose-900 font-bold text-sm group"
          >
            <span>Browse Full Range</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-96 rounded-3xl bg-stone-100 animate-pulse border border-stone-200" />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onNavigate={onNavigate}
                onOpenOrderModal={onOpenOrderModal}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. The Two Flagship Stories Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card 1: Zobo Sweet */}
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-rose-900 to-red-950 text-white relative overflow-hidden flex flex-col justify-between min-h-[420px]">
            <div className="relative z-10 space-y-4">
              <span className="px-3 py-1 rounded-full bg-rose-800/80 text-rose-200 text-xs font-bold uppercase tracking-wider inline-block">
                Flagship Hibiscus Drink
              </span>
              <h3 className="text-3xl sm:text-4xl font-black leading-tight">
                CP Fruit Splash <br /><span className="text-rose-300 font-serif italic">Zobo Sweet</span>
              </h3>
              <p className="text-rose-100/90 text-sm leading-relaxed max-w-md">
                "Taste Nature. Feel Refreshed." A refreshing blend of natural zobo (hibiscus) packed with antioxidants, essential nutrients and a touch of natural sweetness for your well-being.
              </p>
              <ul className="space-y-1.5 text-xs text-rose-200">
                <li className="flex items-center gap-2">✓ 100% Fresh & Natural</li>
                <li className="flex items-center gap-2">✓ No Artificial Colours or Preservatives</li>
                <li className="flex items-center gap-2">✓ Zobo Goodness for a Healthier You</li>
              </ul>
            </div>

            <div className="pt-6 relative z-10 flex items-center gap-3">
              <button
                onClick={() => onNavigate('/products/zobo-sweet')}
                className="px-5 py-2.5 rounded-full bg-white text-rose-950 hover:bg-rose-50 font-bold text-xs transition-colors cursor-pointer"
              >
                Discover Zobo Sweet
              </button>
              <a
                href="https://wa.me/2348127700724?text=Hello%20CP%20Splash,%20I%20would%20like%20to%20order%20Zobo%20Sweet!"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Order on WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Card 2: Luxury Juice Mix */}
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-amber-950 via-rose-950 to-stone-950 text-white relative overflow-hidden flex flex-col justify-between min-h-[420px]">
            <div className="relative z-10 space-y-4">
              <span className="px-3 py-1 rounded-full bg-amber-800/80 text-amber-200 text-xs font-bold uppercase tracking-wider inline-block">
                Royal Fruit Harmony
              </span>
              <h3 className="text-3xl sm:text-4xl font-black leading-tight">
                CP Fruit Splash <br /><span className="text-amber-300 font-serif italic">Luxury Juice Mix</span>
              </h3>
              <p className="text-amber-100/90 text-sm leading-relaxed max-w-md">
                "Goodness in Every Sip!" The ultimate cold fruit symphony: Pomegranate • Apple • Strawberry • Blueberry + Extra Vitamin C.
              </p>
              <ul className="space-y-1.5 text-xs text-amber-200">
                <li className="flex items-center gap-2">✓ Cold-blended whole superfruits</li>
                <li className="flex items-center gap-2">✓ Rich in protective polyphenols</li>
                <li className="flex items-center gap-2">✓ Blend your way to a healthier you</li>
              </ul>
            </div>

            <div className="pt-6 relative z-10 flex items-center gap-3">
              <button
                onClick={() => onNavigate('/products/luxury-juice-mix')}
                className="px-5 py-2.5 rounded-full bg-white text-stone-950 hover:bg-stone-50 font-bold text-xs transition-colors cursor-pointer"
              >
                Discover Luxury Juice Mix
              </button>
              <a
                href="https://wa.me/2348127700724?text=Hello%20CP%20Splash,%20I%20would%20like%20to%20order%20Luxury%20Juice%20Mix!"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Order on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Community & Social Proof Feed */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SocialProofFeed 
          items={socialItems} 
          onProductClick={(id) => {
            const p = products.find(x => x.id === id);
            if (p) onNavigate(`/products/${p.slug}`);
          }}
        />
      </section>

      {/* 6. Flagship Location & Sapele Hub */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-stone-900 text-white p-8 sm:p-12 relative overflow-hidden border border-stone-800">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950 border border-rose-500/40 text-rose-300 text-xs font-bold uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                Official Bottling & Flagship Hub
              </div>
              <h3 className="text-3xl sm:text-4xl font-black">
                Visit Us in Sapele, Delta State
              </h3>
              <p className="text-stone-300 text-sm leading-relaxed max-w-xl">
                Experience fresh ice-cold bottles prepared daily. Conveniently located opposite Ajimele Junction, Ajogodo. Local delivery available throughout Sapele, Warri, and surrounding towns.
              </p>
              <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-mono text-stone-300">
                <div>
                  <strong className="text-white block">Location:</strong>
                  Opposite Ajimele Junction, Ajogodo, Sapele
                </div>
                <div>
                  <strong className="text-white block">Enquiry Hotline:</strong>
                  08127700724
                </div>
                <div>
                  <strong className="text-white block">Availability:</strong>
                  Fresh Daily Batches
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => onNavigate('/find-cp-splash')}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-white hover:bg-stone-100 text-stone-950 font-bold text-xs text-center transition-colors cursor-pointer"
              >
                View Retailer Directory
              </button>
              <a
                href="https://wa.me/2348127700724"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs text-center flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Message Sapele Hub</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Blog Highlights */}
      {recentBlog.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600 block">
                Fruit Science & Stories
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-stone-900">
                Latest From The CP Kitchen
              </h3>
            </div>
            <button
              onClick={() => onNavigate('/blog')}
              className="text-xs font-bold text-stone-700 hover:text-rose-600 flex items-center gap-1"
            >
              <span>All Articles</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {recentBlog.map(post => (
              <div
                key={post.id}
                onClick={() => onNavigate(`/blog/${post.slug}`)}
                className="group bg-white rounded-3xl border border-stone-200 p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                <div className="space-y-3">
                  <span className="text-[11px] font-mono text-stone-400">
                    {post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Recent'}
                  </span>
                  <h4 className="text-xl font-bold text-stone-900 group-hover:text-rose-700 transition-colors leading-snug">
                    {post.title}
                  </h4>
                  <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Read Article <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reusable Commercial Sales Engine Modal */}
      {activeEngineTerritory && (
        <CommercialSalesEngine
          territoryId={activeEngineTerritory.id}
          onClose={() => setActiveEngineTerritory(null)}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}
