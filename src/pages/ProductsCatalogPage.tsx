import React, { useState, useEffect } from 'react';
import { useProducts } from '../hooks/useProducts';
import { ProductCard } from '../components/product/ProductCard';
import { Product, ProductCategory } from '../types/database.types';
import { productsService } from '../services/productsService';
import { Sparkles, RefreshCw, Search } from 'lucide-react';

interface ProductsCatalogPageProps {
  onNavigate: (path: string) => void;
  onOpenOrderModal: (product: Product) => void;
}

export function ProductsCatalogPage({ onNavigate, onOpenOrderModal }: ProductsCatalogPageProps) {
  const { products, loading, error, refetch } = useProducts();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    productsService.getCategories().then(setCategories);
  }, []);

  const normalizedSearch = searchQuery.trim().toLocaleLowerCase();
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' ||
      p.category_id === selectedCategory || p.category?.id === selectedCategory || p.category?.slug === selectedCategory;
    const matchesSearch = !normalizedSearch ||
      [p.name, p.sku, p.short_description, p.description, p.brand].some(value =>
        String(value || '').toLocaleLowerCase().includes(normalizedSearch)
      );
    return matchesCategory && matchesSearch;
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

      <div className="relative max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          type="search"
          value={searchQuery}
          onChange={event => setSearchQuery(event.target.value)}
          placeholder="Search published products..."
          aria-label="Search published products"
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-rose-700 text-white shadow-sm'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            All Products ({products.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-rose-700 text-white shadow-sm'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
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
