import React, { useEffect, useState } from 'react';
import { retailerService } from '../services/retailerService';
import { Retailer } from '../types/database.types';
import { MapPin, Phone, MessageCircle, ShieldCheck, Search, Navigation } from 'lucide-react';
import { analyticsService } from '../../src/services/analyticsService';

export function FindRetailersPage() {
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState('');

  useEffect(() => {
    analyticsService.trackEvent('retailer_view', { landingPage: '/find-cp-splash' });
    retailerService.getVerifiedRetailers().then(data => {
      setRetailers(data);
      setLoading(false);
    });
  }, []);

  const filtered = retailers.filter(r => 
    r.city.toLowerCase().includes(searchCity.toLowerCase()) ||
    r.state.toLowerCase().includes(searchCity.toLowerCase()) ||
    r.name.toLowerCase().includes(searchCity.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider">
          <MapPin className="w-4 h-4" />
          <span>Supabase Retailer Directory</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-stone-900 tracking-tight">
          Where to Find CP Fruit Splash
        </h1>
        <p className="text-stone-600 text-sm max-w-2xl leading-relaxed">
          Pick up ice-cold bottles directly from our Sapele Flagship Hub or verified stockists across Delta State, Edo, and nationwide partners.
        </p>
      </div>

      {/* Flagship Highlight Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-rose-950 via-stone-900 to-stone-950 text-white border border-rose-900/50 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-rose-600 text-white text-[11px] font-black uppercase tracking-wider">
            Flagship Hub
          </span>
          <span className="text-xs text-rose-300 font-medium">Sapele Bottling & Distribution Center</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              CP Fruit Splash Flagship Store
            </h2>
            <p className="text-sm text-rose-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Opposite Ajimele Junction, Ajogodo, Sapele, Delta State</span>
            </p>
            <p className="text-xs text-stone-300">
              Full inventory in stock daily: CP Zobo Sweet (500mL), Luxury Juice Mix (500mL), and Hibiscus Ginger Glow. Walk-in and bulk wholesale welcome.
            </p>
          </div>

          <div className="md:col-span-4 flex flex-col gap-2">
            <a
              href="https://wa.me/2348127700724?text=Hello%20CP%20Splash%20Sapele%20Hub,%20I%20am%20coming%20for%20pickup!"
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold text-center flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Message Sapele Hub (08127700724)</span>
            </a>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          placeholder="Filter by city (Sapele, Warri, Benin, etc.)..."
          value={searchCity}
          onChange={(e) => setSearchCity(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm bg-white"
        />
      </div>

      {/* Retailers List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-44 rounded-3xl bg-stone-100 animate-pulse border border-stone-200" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-stone-500 text-sm">
          No verified retailers found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map(retailer => (
            <div
              key={retailer.id}
              className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 block">
                    {retailer.city}, {retailer.state}
                  </span>
                  <h3 className="text-lg font-bold text-stone-900 mt-0.5">
                    {retailer.name}
                  </h3>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-stone-600">
                <p className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <span>{retailer.address}</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-semibold text-stone-700">Stock Availability:</span>
                  <span className="text-emerald-700 font-medium">{retailer.availability}</span>
                </p>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                {retailer.phone && (
                  <a
                    href={`tel:${retailer.phone}`}
                    className="flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 font-medium"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{retailer.phone}</span>
                  </a>
                )}

                {retailer.whatsapp && (
                  <a
                    href={`https://wa.me/${retailer.whatsapp}?text=Hello%20from%20CP%20Splash%20App,%20do%20you%20have%20bottles%20in%20stock?`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Stockist</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
