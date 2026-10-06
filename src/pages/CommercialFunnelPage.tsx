import React, { useEffect, useState } from 'react';
import { SalesTerritory } from '../types/database.types';
import { salesService } from '../services/salesService';
import { analyticsService } from '../services/analyticsService';
import { CommercialSalesEngine } from '../components/sales/CommercialSalesEngine';
import { 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  MessageCircle, 
  Truck, 
  Droplets, 
  Award,
  Building2,
  Trophy,
  Users,
  GraduationCap,
  Heart,
  AlertCircle
} from 'lucide-react';

interface CommercialFunnelPageProps {
  territorySlug: string;
  onNavigate: (path: string) => void;
}

export function CommercialFunnelPage({ territorySlug, onNavigate }: CommercialFunnelPageProps) {
  const [territory, setTerritory] = useState<SalesTerritory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModalEngine, setShowModalEngine] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await salesService.getTerritoryBySlug(territorySlug);
        if (!mounted) return;
        if (!data) {
          setError(`Commercial territory "${territorySlug}" is not currently published.`);
        } else {
          setTerritory(data);
          analyticsService.trackEvent('page_view', {
            landingPage: `/${territorySlug}`,
            territoryId: data.id,
            metadata: { territorySlug }
          });
        }
      } catch (err: unknown) {
        if (!mounted) return;
        const msg = err instanceof Error ? err.message : 'Error loading territory';
        setError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [territorySlug]);

  // Set page title for SEO/AEO
  useEffect(() => {
    if (territory) {
      document.title = `${territory.name} Supply & Pricing | CP Fruit Splash Nigeria`;
    } else {
      document.title = 'Commercial Supply Engine | CP Fruit Splash';
    }
  }, [territory]);

  // Territory icon helper
  const getTerritoryIcon = (slug: string) => {
    switch (slug.toLowerCase()) {
      case 'sports':
        return <Trophy className="w-8 h-8 text-rose-500" />;
      case 'events':
      case 'parties-events':
        return <Users className="w-8 h-8 text-amber-500" />;
      case 'hotels':
      case 'hotels-hospitality':
        return <Building2 className="w-8 h-8 text-purple-500" />;
      case 'schools':
        return <GraduationCap className="w-8 h-8 text-emerald-500" />;
      case 'individuals':
        return <Heart className="w-8 h-8 text-rose-500" />;
      default:
        return <Sparkles className="w-8 h-8 text-rose-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-stone-600">Loading commercial territory contract...</p>
        </div>
      </div>
    );
  }

  if (error || !territory) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900">
            Commercial Territory Not Published
          </h2>
          <p className="text-stone-600 text-sm max-w-md mx-auto">
            {error || 'This commercial territory is not active or has not yet been configured in the CMS.'}
          </p>
        </div>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => onNavigate('/')}
            className="px-6 py-3 rounded-2xl bg-stone-900 text-white font-bold text-xs hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Back to Homepage
          </button>
          <button
            onClick={() => onNavigate('/shop')}
            className="px-6 py-3 rounded-2xl bg-rose-700 text-white font-bold text-xs hover:bg-rose-600 transition-colors cursor-pointer"
          >
            Browse Retail Store
          </button>
        </div>
      </div>
    );
  }

  // Structured Data (JSON-LD) for AEO/SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    'name': `${territory.name} Beverage Supply`,
    'provider': {
      '@type': 'Organization',
      'name': 'CP Fruit Splash',
      'url': 'https://cp-splash-nine.vercel.app',
      'telephone': '+2348127700724',
      'address': {
        '@type': 'PostalAddress',
        'addressLocality': 'Sapele',
        'addressRegion': 'Delta State',
        'addressCountry': 'NG'
      }
    },
    'description': territory.headline || territory.description,
    'areaServed': 'Nigeria',
    'serviceType': 'Commercial Beverage Supply & Distribution'
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Inject Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-stone-900 via-stone-850 to-stone-900 text-white py-16 sm:py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-rose-950 border border-rose-500/40 text-rose-300 text-xs font-mono font-bold uppercase tracking-wider">
                {getTerritoryIcon(territory.slug)}
                <span>Commercial Territory: {territory.name}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                {territory.headline || `Tailored Supply for ${territory.name}`}
              </h1>

              <p className="text-stone-300 text-base sm:text-lg leading-relaxed max-w-xl">
                {territory.description || territory.buyer_summary || 'Access bespoke institutional pricing, cold-chain distribution, and direct WhatsApp sales support.'}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => setShowModalEngine(true)}
                  className="px-8 py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-xl shadow-rose-950/40 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span>{territory.cta_label || 'Get Instant Pricing'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onNavigate('/shop')}
                  className="px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white font-bold text-sm transition-all cursor-pointer"
                >
                  Browse Retail Catalog
                </button>
              </div>
            </div>

            <div className="lg:col-span-5">
              {/* Inline qualification preview */}
              <div className="p-1 rounded-3xl bg-gradient-to-tr from-rose-500/30 to-amber-500/20 shadow-2xl">
                <CommercialSalesEngine
                  territorySlug={territory.slug}
                  onNavigate={onNavigate}
                  isInline={true}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Supply Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-stone-900">Direct Cold-Chain Delivery</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Bottled daily in Sapele, Delta State with temperature-controlled transit across Delta, Edo, and neighboring commercial hubs.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-stone-900">Volume Discounts & Invoicing</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Tiered pricing curves for event planners, institutions, clubs, and stockists with official purchase orders and receipts.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Droplets className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-stone-900">100% Pure Botanicals</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Zero preservatives, pure hibiscus (Zobo Sweet) and cold-blended superfruits (Luxury Juice Mix). Certified quality.
            </p>
          </div>
        </div>
      </section>

      {/* Reusable Qualification Modal */}
      {showModalEngine && (
        <CommercialSalesEngine
          territorySlug={territory.slug}
          onClose={() => setShowModalEngine(false)}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}
