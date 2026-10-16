import React, { useState, useEffect } from 'react';
import { Product, ProductCategory, MediaPlacement } from '../../types/database.types';
import { productsService } from '../../services/productsService';
import { placementService } from '../../services/placementService';
import { mediaService } from '../../services/mediaService';
import { getProductPrice, getProductHeroMediaUrl, getProductVolume } from '../../services/productHelpers';
import { Sparkles, ArrowRight, ChevronDown, RefreshCw } from 'lucide-react';

interface ProductMenuProps {
  onNavigate: (path: string) => void;
  onClose?: () => void;
  isMobile?: boolean;
}

export function ProductMenu({ onNavigate, onClose, isMobile = false }: ProductMenuProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [menuPlacements, setMenuPlacements] = useState<MediaPlacement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data: prodList, error: pErr }, catList, placementsList] = await Promise.all([
        productsService.getPublishedProducts(),
        productsService.getCategories(),
        placementService.getPlacements('product_menu'),
      ]);

      if (pErr) {
        setError(pErr);
      } else {
        setProducts(prodList || []);
      }
      setCategories(catList || []);
      setMenuPlacements(placementsList || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredProducts = products.filter(p => {
    if (selectedCategory === 'all') return true;
    return p.category_id === selectedCategory || p.category?.id === selectedCategory || p.category?.slug === selectedCategory;
  });

  const handleSelectProduct = (slug: string) => {
    onNavigate(`/products/${slug}`);
    if (onClose) onClose();
  };

  if (isMobile) {
    return (
      <div className="space-y-3 py-2 border-t border-stone-100">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Products & Blends
          </span>
          <button
            onClick={() => {
              onNavigate('/products');
              if (onClose) onClose();
            }}
            className="text-[11px] font-bold text-rose-600 flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-stone-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">
            {error}
          </div>
        ) : products.length === 0 ? (
          <div className="p-3 text-xs text-stone-500 text-center bg-stone-50 rounded-xl">
            Live catalog sync active. No products published yet.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {products.map(product => {
              const price = getProductPrice(product);
              const thumbUrl = getProductHeroMediaUrl(product);
              return (
                <button
                  key={product.id}
                  onClick={() => handleSelectProduct(product.slug)}
                  className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-rose-50 text-left transition-colors cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                    <img src={thumbUrl} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-stone-900 group-hover:text-rose-700 truncate">
                      {product.name}
                    </h5>
                    <p className="text-[10px] text-stone-500">
                      ₦{price.amount.toLocaleString()}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Desktop Dropdown flyout presentation
  return (
    <div className="w-[540px] p-5 rounded-3xl bg-white border border-stone-200/90 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
      {/* Category Tabs */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All ({products.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            onNavigate('/products');
            if (onClose) onClose();
          }}
          className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 shrink-0 ml-2 cursor-pointer"
        >
          <span>Catalog</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Product List */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 py-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 rounded-2xl bg-stone-100 animate-pulse border border-stone-200" />
          ))}
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-rose-50 text-rose-700 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchData} className="underline font-bold">Retry</button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-8 text-center text-xs text-stone-500 bg-stone-50 rounded-2xl space-y-2">
          <p className="font-semibold">No products published in this category yet.</p>
          <p className="text-[11px] text-stone-400">Products created and published in Supabase appear here live.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
          {filteredProducts.map(product => {
            const price = getProductPrice(product);
            const volume = getProductVolume(product);
            const thumbUrl = getProductHeroMediaUrl(product);

            return (
              <button
                key={product.id}
                onClick={() => handleSelectProduct(product.slug)}
                className="flex items-center gap-3 p-2.5 rounded-2xl border border-stone-100 hover:border-rose-200 bg-white hover:bg-rose-50/50 text-left transition-all duration-200 cursor-pointer group shadow-xs hover:shadow-sm"
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200 relative">
                  <img
                    src={thumbUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-stone-900 group-hover:text-rose-700 truncate">
                    {product.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-black text-rose-700">
                      ₦{price.amount.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {volume.volume}{volume.unit}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Persistent Menu Placement Feature */}
      {menuPlacements.length > 0 && (() => {
        const p = menuPlacements[0];
        const asset = p.media_assets || p.asset;
        const imgUrl = mediaService.getMediaAssetUrl(asset);
        if (!imgUrl) return null;
        return (
          <div
            onClick={() => {
              onNavigate('/products');
              if (onClose) onClose();
            }}
            className="p-2.5 rounded-2xl bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-200/60 flex items-center gap-3 cursor-pointer hover:border-rose-300 transition-all shadow-2xs"
          >
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-rose-200">
              <img
                src={imgUrl}
                alt={p.alt_text_override || asset?.alt_text || 'Featured blend'}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-mono font-bold uppercase text-rose-700 tracking-wider">
                {asset?.mime_type === 'image/gif' ? 'Animated Spotlight' : 'Featured Highlight'}
              </span>
              <p className="text-xs font-bold text-stone-900 truncate">
                {p.alt_text_override || asset?.caption || 'Handcrafted Fresh in Sapele'}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-rose-600 shrink-0 mr-1" />
          </div>
        );
      })()}

      {/* Footer link to admin or custom batch notice */}
      <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
        <span>Cold-crafted fresh in Sapele, Delta State</span>
        <span className="font-mono text-emerald-600 font-semibold">● Supabase SSOT</span>
      </div>
    </div>
  );
}
