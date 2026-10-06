import React, { useState, useEffect } from 'react';
import { 
  Package, 
  DollarSign, 
  Image as ImageIcon, 
  ShieldCheck, 
  FileText, 
  Share2, 
  Users, 
  TrendingUp, 
  MapPin, 
  BarChart3, 
  Settings, 
  LogOut, 
  ArrowLeft,
  Database,
  Menu,
  X,
  Sliders,
  Sparkles,
  ShoppingBag,
  Layers,
  Compass
} from 'lucide-react';
import { checkSupabaseConnection, SupabaseConfigState, supabase } from '../../lib/supabase';
import { BrandLogo } from '../common/BrandAssets';
import { useAdminAuth } from '../../auth/AdminAuthContext';

export type AdminTab = 
  | 'dashboard'
  | 'commercial_brain'
  | 'sales_leads'
  | 'orders'
  | 'products'
  | 'product_new'
  | 'product_edit'
  | 'pricing'
  | 'media'
  | 'claims'
  | 'blog'
  | 'social'
  | 'campaigns'
  | 'retailers'
  | 'analytics'
  | 'settings';

interface AdminLayoutProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onExitAdmin: () => void;
  children: React.ReactNode;
}

export function AdminLayout({ currentTab, onSelectTab, onExitAdmin, children }: AdminLayoutProps) {
  const { user, userRole, logout } = useAdminAuth();
  const [dbStatus, setDbStatus] = useState<SupabaseConfigState | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkSupabaseConnection().then(setDbStatus);
  }, [currentTab]);

  const navItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <Sliders className="w-4 h-4" /> },
    { id: 'commercial_brain', label: 'Commercial Brain', icon: <Layers className="w-4 h-4" /> },
    { id: 'sales_leads', label: 'Sales Leads', icon: <Users className="w-4 h-4" /> },
    { id: 'orders', label: 'Customer Orders', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'products', label: 'Product Engine', icon: <Package className="w-4 h-4" /> },
    { id: 'pricing', label: 'Price Engine', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'claims', label: 'Verified Claims', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'media', label: 'Media & Storage', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'blog', label: 'Blog Engine', icon: <FileText className="w-4 h-4" /> },
    { id: 'social', label: 'Social & UGC', icon: <Share2 className="w-4 h-4" /> },
    { id: 'campaigns', label: 'Campaigns & Influencers', icon: <Users className="w-4 h-4" /> },
    { id: 'retailers', label: 'Retailer Directory', icon: <MapPin className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics Pipeline', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'settings', label: 'Supabase Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col md:flex-row text-stone-900">
      {/* Mobile Top Navigation */}
      <div className="md:hidden bg-stone-900 text-white p-4 flex items-center justify-between border-b border-stone-800">
        <div className="flex items-center gap-2">
          <BrandLogo dark={true} className="h-8" />
          <span className="text-xs font-mono font-bold bg-rose-950 px-2 py-0.5 rounded text-rose-300">
            CMS
          </span>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-stone-800 text-stone-300"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        ${mobileMenuOpen ? 'block' : 'hidden'} 
        md:block w-full md:w-64 bg-stone-900 text-stone-300 border-r border-stone-800 shrink-0 flex flex-col justify-between p-4 z-30
      `}>
        <div className="space-y-6">
          {/* Brand header */}
          <div className="hidden md:block pb-4 border-b border-stone-800">
            <BrandLogo dark={true} />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider font-mono text-stone-400">
                Product Engine CMS
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-900 text-rose-200 font-bold">
                HOEOS G4
              </span>
            </div>
          </div>

          {/* Database status pill */}
          <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-stone-400 text-[11px]">Database:</span>
            </div>
            <span className={`text-[11px] font-mono font-bold ${dbStatus?.isLive ? 'text-emerald-400' : 'text-emerald-500'}`}>
              {dbStatus?.isLive ? 'Supabase Live' : 'PostgREST Sync'}
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map(item => {
              const isActive = currentTab === item.id || (item.id === 'products' && (currentTab === 'product_new' || currentTab === 'product_edit'));
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-rose-700 text-white shadow-sm shadow-rose-950/40'
                      : 'text-stone-400 hover:text-stone-100 hover:bg-stone-800/60'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions & Authenticated User Identity */}
        <div className="pt-4 border-t border-stone-800 space-y-3">
          {/* User Identity Pill */}
          <div className="p-3 rounded-2xl bg-stone-950/80 border border-stone-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500">
                Logged in as
              </span>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-900/40">
                {userRole || 'Staff'}
              </span>
            </div>
            <div className="text-xs font-semibold text-stone-200 truncate" title={user?.email || ''}>
              {user?.email || 'Authenticated User'}
            </div>
            <div className="text-[10px] font-mono text-stone-500 truncate">
              UID: {user?.id ? `${user.id.slice(0, 8)}...${user.id.slice(-4)}` : 'Active'}
            </div>
          </div>

          {/* Logout Action */}
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-900/40 text-red-300 hover:text-red-100 text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out from CMS</span>
          </button>

          <button
            onClick={onExitAdmin}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Public Store</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 lg:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
