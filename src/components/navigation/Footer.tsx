import React from 'react';
import { BrandLogo } from '../common/BrandAssets';
import { MapPin, Phone, MessageCircle, ShieldCheck, Heart, ArrowRight } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-stone-950 text-stone-300 pt-16 pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-stone-800/80">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo dark={true} />
            <p className="text-sm text-stone-400 max-w-sm leading-relaxed">
              Nigeria's premium cold-crafted botanical juice brand. Delivering nature's richest hibiscus and luxury whole fruit blends with zero artificial preservatives or colors. Goodness in Every Sip.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> 100% Fresh & Natural
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                <Heart className="w-3.5 h-3.5" /> Sapele Born & Bottled
              </span>
            </div>
          </div>

          {/* Quick Discovery */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-100">Products & Blends</h4>
            <ul className="space-y-2 text-sm text-stone-400">
              <li>
                <button onClick={() => onNavigate('/products/zobo-sweet')} className="hover:text-rose-400 transition-colors">
                  CP Zobo Sweet (500ml)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/products/luxury-juice-mix')} className="hover:text-rose-400 transition-colors">
                  Luxury Juice Mix (500ml)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/products/hibiscus-ginger-glow')} className="hover:text-rose-400 transition-colors">
                  Hibiscus & Ginger Glow
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/products')} className="hover:text-rose-400 transition-colors font-medium text-rose-500 flex items-center gap-1">
                  View Full Catalog <ArrowRight className="w-3 h-3" />
                </button>
              </li>
            </ul>
          </div>

          {/* Governance & Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-100">Integrity & Claims</h4>
            <ul className="space-y-2 text-sm text-stone-400">
              <li>
                <button onClick={() => onNavigate('/claims')} className="hover:text-stone-100 transition-colors">
                  Verified Health Claims
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/find-cp-splash')} className="hover:text-stone-100 transition-colors">
                  Retailer Directory
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/blog')} className="hover:text-stone-100 transition-colors">
                  Fruit Science & Blog
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/certification')} className="hover:text-stone-100 transition-colors text-emerald-400 font-medium">
                  HOEOS Production Certification
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/admin')} className="hover:text-rose-400 transition-colors font-mono text-xs">
                  Admin CMS Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Contact & Location (Exact from prompt artwork) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-100">Flagship & Orders</h4>
            <div className="space-y-2.5 text-xs text-stone-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-stone-200 block">Cp Fruit Splash Flagship:</strong>
                  Opposite Ajimele Junction, Ajogodo, Sapele, Delta State.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  Enquiry: <strong className="text-stone-200">08127700724</strong>
                </span>
              </div>
              <div className="pt-2">
                <a
                  href="https://wa.me/2348127700724"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-700/40 hover:bg-emerald-700/60 border border-emerald-500/30 text-emerald-300 font-semibold transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp 08127700724</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} CP Fruit Splash. All rights reserved. Sapele, Delta State, Nigeria.</p>
          <p className="text-center md:text-right text-stone-600 max-w-xl">
            Governed by HOEOS Production Protocols. Supabase-backed Content-Commerce Architecture. No artificial colours, no synthetic preservatives.
          </p>
        </div>
      </div>
    </footer>
  );
}
