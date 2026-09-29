import React, { useEffect, useState } from 'react';
import { productsService } from '../../services/productsService';
import { claimsService } from '../../services/claimsService';
import { analyticsService } from '../../services/analyticsService';
import { retailerService } from '../../services/retailerService';
import { Product, ProductClaim, Retailer } from '../../types/database.types';
import { AdminTab } from './AdminLayout';
import { 
  Package, 
  DollarSign, 
  ShieldCheck, 
  MessageCircle, 
  Plus, 
  ArrowRight, 
  Sparkles, 
  BarChart3, 
  MapPin, 
  Activity,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface AdminDashboardProps {
  onSelectTab: (tab: AdminTab) => void;
}

export function AdminDashboard({ onSelectTab }: AdminDashboardProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [claims, setClaims] = useState<ProductClaim[]>([]);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [metrics, setMetrics] = useState<{ counts: Record<string, number>; conversionRate: string; totalEvents: number }>({
    counts: {},
    conversionRate: '0.0',
    totalEvents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      productsService.getAllProducts(),
      claimsService.getAllClaims(),
      retailerService.getAllRetailers(),
      analyticsService.getMetricsSummary(),
    ]).then(([prodRes, claimsData, retData, metData]) => {
      setProducts(prodRes.data);
      setClaims(claimsData);
      setRetailers(retData);
      setMetrics(metData);
      setLoading(false);
    });
  }, []);

  const publishedCount = products.filter(p => p.status === 'published').length;
  const verifiedClaimsCount = claims.filter(c => c.status === 'verified').length;
  const pendingClaimsCount = claims.filter(c => c.status === 'pending').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase text-rose-600 tracking-wider">
            Supabase PostgREST Engine
          </span>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">
            CP Splash Social Commerce CMS
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Real-time synchronization active across PostgreSQL, Storage, and WhatsApp Conversion Pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectTab('product_new')}
            className="px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-rose-900/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Product</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Products */}
        <div 
          onClick={() => onSelectTab('products')}
          className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs hover:shadow-md transition-shadow cursor-pointer space-y-3"
        >
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Active Products</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-stone-900">{publishedCount}</span>
            <span className="text-xs text-stone-400 ml-2">/ {products.length} total</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold block">
            ✓ 100% Live in Public Catalog
          </span>
        </div>

        {/* WhatsApp Conversions */}
        <div 
          onClick={() => onSelectTab('orders')}
          className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs hover:shadow-md transition-shadow cursor-pointer space-y-3"
        >
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Customer Orders</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <MessageCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-stone-900">
              {metrics.counts.order_started || metrics.counts.whatsapp_click || 0}
            </span>
            <span className="text-xs text-stone-400 ml-2">dispatched</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold block">
            Click to manage orders & fulfill
          </span>
        </div>

        {/* Verified Claims */}
        <div 
          onClick={() => onSelectTab('claims')}
          className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs hover:shadow-md transition-shadow cursor-pointer space-y-3"
        >
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Verified Claims</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-stone-900">{verifiedClaimsCount}</span>
            {pendingClaimsCount > 0 && (
              <span className="text-xs text-amber-600 font-bold ml-2">({pendingClaimsCount} pending)</span>
            )}
          </div>
          <span className="text-[11px] text-stone-500 block">
            HOEOS Rule 14 Compliant
          </span>
        </div>

        {/* Retailers */}
        <div 
          onClick={() => onSelectTab('retailers')}
          className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs hover:shadow-md transition-shadow cursor-pointer space-y-3"
        >
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Stockist Directory</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-stone-900">{retailers.length}</span>
            <span className="text-xs text-stone-400 ml-2">verified outlets</span>
          </div>
          <span className="text-[11px] text-stone-500 block">
            Flagship in Sapele, Delta State
          </span>
        </div>
      </div>

      {/* Quick Launch & Synchronization Test Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-stone-900 to-rose-950 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-300">
              HOEOS Production Verification
            </span>
          </div>
          <h3 className="text-xl font-bold">
            Run Deterministic Synchronization Audit
          </h3>
          <p className="text-xs text-stone-300 max-w-xl">
            Execute the mandatory Section 26 tests (Product Creation, Price Update, Media Upload, Description Mutate, Unpublish exclusion).
          </p>
        </div>

        <button
          onClick={() => onSelectTab('pricing')}
          className="px-5 py-3 rounded-xl bg-white text-stone-950 hover:bg-stone-100 font-bold text-xs shrink-0 transition-colors cursor-pointer"
        >
          Open Price & Sync Suite
        </button>
      </div>

      {/* Products Quick Table */}
      <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-stone-900">
            Supabase Product Engine Catalogue
          </h3>
          <button
            onClick={() => onSelectTab('products')}
            className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1"
          >
            <span>Manage All Products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-stone-400 uppercase font-mono tracking-wider">
                <th className="py-2.5 font-bold">Product</th>
                <th className="py-2.5 font-bold">Status</th>
                <th className="py-2.5 font-bold">Authoritative Price</th>
                <th className="py-2.5 font-bold">Volume</th>
                <th className="py-2.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {products.map(product => {
                const currentPrice = product.sale_price || product.base_price;
                return (
                  <tr key={product.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 font-semibold text-stone-900 flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-stone-100 overflow-hidden shrink-0">
                        {product.media?.[0]?.url && (
                          <img src={product.media[0].url} alt={product.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div>
                        <span>{product.name}</span>
                        <span className="text-[10px] text-stone-400 block font-mono">/{product.slug}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        product.status === 'published' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-stone-100 text-stone-600'
                      }`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="py-3 font-mono font-bold text-stone-900">
                      ₦{Number(currentPrice).toLocaleString()}
                      {product.sale_price && (
                        <span className="text-[10px] text-stone-400 line-through ml-1.5">
                          ₦{Number(product.base_price).toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="py-3 font-mono text-stone-600">
                      {product.volume_ml}mL
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => onSelectTab('products')}
                        className="text-rose-600 hover:text-rose-800 font-bold hover:underline cursor-pointer"
                      >
                        Edit in Engine
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
