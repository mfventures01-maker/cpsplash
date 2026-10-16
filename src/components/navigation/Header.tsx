import React, { useState, useEffect, useRef } from 'react';
import { BrandLogo } from '../common/BrandAssets';
import { MessageCircle, ShoppingBag, Menu, X, ShieldCheck, Database, Sliders, MapPin, ChevronDown } from 'lucide-react';
import { checkSupabaseConnection, SupabaseConfigState } from '../../lib/supabase';
import { ProductMenu } from './ProductMenu';
import { BUSINESS_CONFIG, buildWhatsAppUrl } from '../../services/businessConfig';

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  cartCount?: number;
  onOpenCart?: () => void;
}

export function Header({ currentPath, onNavigate, cartCount = 0, onOpenCart }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productMenuOpen, setProductMenuOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<SupabaseConfigState | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkSupabaseConnection().then(setDbStatus);
  }, []);

  // Close product menu dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuContainerRef.current && !menuContainerRef.current.contains(event.target as Node)) {
        setProductMenuOpen(false);
      }
    }
    if (productMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [productMenuOpen]);

  const navItems = [
    { label: 'Commercial Supply', path: '/sports' },
    { label: 'Goodness & Benefits', path: '/claims' },
    { label: 'Fresh Blog', path: '/blog' },
    { label: 'Find in Store', path: '/find-cp-splash' },
    { label: 'Story', path: '/story' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
      {/* Top Banner with Sapele flagship address & phone */}
      <div className="bg-gradient-to-r from-rose-900 via-rose-950 to-stone-900 text-rose-100 text-xs py-1.5 px-4 font-medium">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-rose-800/80 text-rose-200 px-2 py-0.5 rounded text-[11px] font-semibold">
              <MapPin className="w-3 h-3 text-rose-400" /> Sapele Flagship
            </span>
            <span className="hidden sm:inline text-rose-300">
              {BUSINESS_CONFIG.flagshipLocation.address}, {BUSINESS_CONFIG.flagshipLocation.city}, {BUSINESS_CONFIG.flagshipLocation.state}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <a 
              href={buildWhatsAppUrl('Hello CP Splash, I have an enquiry about your products!')}
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-emerald-300 hover:text-emerald-200 font-semibold transition-colors"
            >
              <MessageCircle className="w-3 h-3" />
              <span>WhatsApp: {BUSINESS_CONFIG.contact.enquiryPhoneDisplay}</span>
            </a>
            <span className="text-stone-600 hidden md:inline">|</span>
            <button
              onClick={() => setShowStatusModal(true)}
              className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded bg-stone-800/80 hover:bg-stone-700/80 text-stone-300 transition-colors"
              title="Supabase Source of Truth status"
            >
              <span className={`w-2 h-2 rounded-full ${dbStatus?.isLive ? 'bg-emerald-400 animate-ping' : 'bg-emerald-500'}`} />
              <span className="font-mono text-[10px]">
                {dbStatus?.isLive ? 'Supabase Live' : 'Supabase PostgREST: Active'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <div 
            onClick={() => onNavigate('/')} 
            className="cursor-pointer transition-transform hover:scale-[1.02]"
          >
            <BrandLogo />
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-7">
            {/* Dynamic Products Dropdown */}
            <div className="relative" ref={menuContainerRef}>
              <button
                type="button"
                onClick={() => setProductMenuOpen(!productMenuOpen)}
                className={`text-sm font-semibold transition-colors cursor-pointer py-1 flex items-center gap-1.5 ${
                  currentPath.startsWith('/products') || currentPath.startsWith('/shop') || productMenuOpen
                    ? 'text-rose-700'
                    : 'text-stone-700 hover:text-rose-600'
                }`}
                aria-expanded={productMenuOpen}
                aria-haspopup="true"
              >
                <span>Products & Blends</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${productMenuOpen ? 'rotate-180 text-rose-600' : 'text-stone-400'}`} />
              </button>

              {productMenuOpen && (
                <div className="absolute top-full left-0 mt-3 z-50">
                  <ProductMenu
                    onNavigate={(path) => {
                      onNavigate(path);
                      setProductMenuOpen(false);
                    }}
                    onClose={() => setProductMenuOpen(false)}
                  />
                </div>
              )}
            </div>

            {navItems.map((item) => {
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className={`text-sm font-semibold transition-colors cursor-pointer py-1 relative ${
                    isActive ? 'text-rose-700' : 'text-stone-700 hover:text-rose-600'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-rose-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {/* Direct WhatsApp Quick Order */}
            <a
              href={buildWhatsAppUrl('Hello CP Splash, I would like to order CP Fruit Splash drinks!')}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-700/20 transition-all hover:shadow-lg active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-emerald-600 text-white" />
              <span>Order on WhatsApp</span>
            </a>

            {/* Admin CMS Button */}
            <button
              onClick={() => onNavigate('/admin')}
              className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold ${
                currentPath.startsWith('/admin')
                  ? 'bg-stone-900 border-stone-800 text-white shadow-sm'
                  : 'bg-stone-100 hover:bg-stone-200 border-stone-200 text-stone-700'
              }`}
              title="Admin CMS & Product Engine"
            >
              <Sliders className="w-4 h-4 text-rose-600" />
              <span className="hidden xl:inline">CMS</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-stone-700 hover:bg-stone-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-stone-200 px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top duration-200">
          <div className="grid grid-cols-2 gap-2 pb-2 border-b border-stone-100">
            <button
              onClick={() => {
                onNavigate('/products');
                setMobileMenuOpen(false);
              }}
              className={`text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                currentPath === '/products' || currentPath === '/shop' ? 'bg-rose-50 text-rose-700 font-bold' : 'text-stone-700 hover:bg-stone-50'
              }`}
            >
              All Products
            </button>
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  onNavigate(item.path);
                  setMobileMenuOpen(false);
                }}
                className={`text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  currentPath === item.path ? 'bg-rose-50 text-rose-700 font-bold' : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Dynamic Database-Driven Mobile Product List */}
          <ProductMenu
            isMobile={true}
            onNavigate={onNavigate}
            onClose={() => setMobileMenuOpen(false)}
          />

          <div className="pt-2 flex flex-col gap-2">
            <a
              href={buildWhatsAppUrl('Hello CP Splash, I would like to order CP Fruit Splash drinks!')}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Order on WhatsApp ({BUSINESS_CONFIG.contact.enquiryPhoneDisplay})</span>
            </a>

            <button
              onClick={() => {
                onNavigate('/admin');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-stone-900 text-white font-medium text-sm"
            >
              <Sliders className="w-4 h-4 text-rose-400" />
              <span>Open Admin CMS & Product Engine</span>
            </button>
          </div>
        </div>
      )}

      {/* Supabase Engine Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-stone-900">Supabase Source of Truth</h3>
              </div>
              <button 
                onClick={() => setShowStatusModal(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-sm">
              <div className="p-3 bg-stone-50 rounded-xl space-y-1.5 border border-stone-200">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-500">Connection Mode:</span>
                  <span className="font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {dbStatus?.isLive ? 'Supabase Cloud (Live)' : 'PostgREST Authoritative Engine'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-500">PostgreSQL Schema:</span>
                  <span className="font-mono text-stone-700">HOEOS G1 Master Verified</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-500">Real-time Bus:</span>
                  <span className="text-emerald-700 font-semibold">Active (Instant sync across tabs)</span>
                </div>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                All products, prices, verified claims, and media displayed on CP Splash originate directly from this database. You can manage or configure credentials anytime in the CMS.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  onNavigate('/admin/settings');
                }}
                className="flex-1 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs transition-colors"
              >
                Manage Supabase in CMS
              </button>
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
