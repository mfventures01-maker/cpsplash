import React, { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { ProductCard } from '../components/product/ProductCard';
import { Product } from '../types/database.types';
import { Filter, Sparkles, RefreshCw } from 'lucide-react';

interface ProductsCatalogPageProps {
  onNavigate: (path: string) => void;
  onOpenOrderModal: (product: Product) => void;
}

export function ProductsCatalogPage({ onNavigate, onOpenOrderModal }: ProductsCatalogPageProps) {
  const { products, loading, error, refetch } = useProducts();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'hibiscus' | 'luxury'>('all');

  const filteredProducts = products.filter(p => {
    if (selectedFilter === 'hibiscus') return p.slug.includes('zobo') || p.slug.includes('hibiscus');
    if (selectedFilter === 'luxury') return p.slug.includes('luxury') || p.slug.includes('juice');
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Cold-Crafted Beverage Portfolio</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-stone-900 tracking-tight">
          Natural Fruit & Botanical Elixirs
        </h1>
        <p className="text-stone-600 text-sm max-w-2xl leading-relaxed">
          Crafted in small batches with whole Nigerian hibiscus and cold-pressed superfruits. Verified zero synthetic additives, real-time synchronized with Supabase.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-rose-700 text-white shadow-sm'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            All Products ({products.length})
          </button>
          <button
            onClick={() => setSelectedFilter('hibiscus')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedFilter === 'hibiscus'
                ? 'bg-rose-700 text-white shadow-sm'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            Zobo & Hibiscus
          </button>
          <button
            onClick={() => setSelectedFilter('luxury')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedFilter === 'luxury'
                ? 'bg-rose-700 text-white shadow-sm'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            Luxury Whole Fruit Mix
          </button>
        </div>

        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
          title="Fetch latest updates from Supabase"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Database</span>
        </button>
      </div>

      {/* Products Grid */}
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
      ) : filteredProducts.length === 0 ? (
        <div className="py-16 text-center text-stone-500 text-sm">
          No products matched the selected filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onNavigate={onNavigate}
              onOpenOrderModal={onOpenOrderModal}
            />
          ))}
        </div>
      )}
    </div>
  );
}
