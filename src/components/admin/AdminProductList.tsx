import React, { useEffect, useState } from 'react';
import { productsService } from '../../services/productsService';
import { Product, ProductStatus } from '../../types/database.types';
import { Plus, Edit2, Trash2, Globe, Eye, EyeOff, DollarSign, ShieldCheck, RefreshCw } from 'lucide-react';
import {
  getProductPrice,
  getProductVolume,
  getProductHeroMediaUrl,
  getProductClaims
} from '../../services/productHelpers';

interface AdminProductListProps {
  onNewProduct: () => void;
  onEditProduct: (productId: string) => void;
  onViewLive: (slug: string) => void;
}

export function AdminProductList({ onNewProduct, onEditProduct, onViewLive }: AdminProductListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickPriceModal, setQuickPriceModal] = useState<Product | null>(null);
  const [newBasePrice, setNewBasePrice] = useState<number>(0);
  const [newSalePrice, setNewSalePrice] = useState<number | ''>('');
  const [priceReason, setPriceReason] = useState<string>('');
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await productsService.getAllProducts();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleStatusToggle = async (product: Product) => {
    const nextStatus: ProductStatus = product.status === 'published' ? 'draft' : 'published';
    await productsService.setProductStatus(product.id, nextStatus);
    fetchProducts();
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to permanently delete "${name}" from Supabase?`)) {
      await productsService.deleteProduct(id);
      fetchProducts();
    }
  };

  const handleOpenPriceModal = (p: Product) => {
    setQuickPriceModal(p);
    const price = getProductPrice(p);
    setNewBasePrice(price.amount);
    setNewSalePrice(price.compare_at_amount || '');
    setPriceReason('Standard retail adjustment');
  };

  const handleSavePrice = async () => {
    if (!quickPriceModal) return;
    setIsUpdatingPrice(true);
    await productsService.updateProductPrice(
      quickPriceModal.id,
      Number(newBasePrice),
      newSalePrice === '' ? null : Number(newSalePrice),
      priceReason
    );
    setIsUpdatingPrice(false);
    setQuickPriceModal(null);
    fetchProducts();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase text-rose-600 tracking-wider">
            Supabase products Table
          </span>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">
            Product Engine Management
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Every product record, price mutation, and media relationship is synchronized with Supabase.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchProducts}
            className="p-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-600 transition-colors cursor-pointer"
            title="Refresh from Supabase"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onNewProduct}
            className="px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-rose-900/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Product</span>
          </button>
        </div>
      </div>

      {/* Products Table Card */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-stone-400">Loading products from Supabase...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-mono uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-6 font-bold">Product</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold">Base Price</th>
                  <th className="py-3 px-4 font-bold">Sale Price</th>
                  <th className="py-3 px-4 font-bold">Volume</th>
                  <th className="py-3 px-4 font-bold">Verified Claims</th>
                  <th className="py-3 px-6 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {products.map((product) => {
                  const verifiedClaims = getProductClaims(product, true);
                  const heroUrl = getProductHeroMediaUrl(product);
                  const price = getProductPrice(product);
                  const volume = getProductVolume(product);

                  return (
                    <tr key={product.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-4 px-6 font-semibold text-stone-900">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                            <img src={heroUrl} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <span className="font-bold text-sm block leading-snug">{product.name}</span>
                            <span className="text-[11px] font-mono text-stone-400 block">
                              slug: <strong className="text-stone-600">{product.slug}</strong> • SKU: {product.sku || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleStatusToggle(product)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-colors cursor-pointer flex items-center gap-1.5 ${
                            product.status === 'published'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                              : 'bg-stone-100 text-stone-600 border border-stone-300 hover:bg-stone-200'
                          }`}
                          title="Click to toggle Draft / Published"
                        >
                          {product.status === 'published' ? <Eye className="w-3 h-3 text-emerald-600" /> : <EyeOff className="w-3 h-3" />}
                          <span>{product.status}</span>
                        </button>
                      </td>

                      <td className="py-4 px-4 font-mono font-bold text-stone-900 text-sm">
                        ₦{price.amount.toLocaleString()}
                      </td>

                      <td className="py-4 px-4 font-mono text-stone-700">
                        {price.compare_at_amount ? (
                          <span className="font-bold text-rose-700">
                            ₦{price.compare_at_amount.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-stone-400">—</span>
                        )}
                      </td>

                      <td className="py-4 px-4 font-mono text-stone-600">
                        {volume.volume}{volume.unit}
                      </td>

                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px]">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          {verifiedClaims.length} verified
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right space-x-1">
                        <button
                          onClick={() => handleOpenPriceModal(product)}
                          className="p-2 rounded-lg hover:bg-stone-100 text-stone-600 hover:text-stone-900 transition-colors inline-block cursor-pointer"
                          title="Quick Price Engine adjustment"
                        >
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                        </button>

                        <button
                          onClick={() => onEditProduct(product.id)}
                          className="p-2 rounded-lg hover:bg-stone-100 text-stone-600 hover:text-stone-900 transition-colors inline-block cursor-pointer"
                          title="Edit full product specifications"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {product.status === 'published' && (
                          <button
                            onClick={() => onViewLive(product.slug)}
                            className="p-2 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors inline-block cursor-pointer"
                            title="View public product page"
                          >
                            <Globe className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors inline-block cursor-pointer"
                          title="Delete from Supabase"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Price Engine Mutation Modal */}
      {quickPriceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div>
              <span className="text-xs font-mono font-bold text-rose-600 uppercase tracking-wider block">
                Price Engine Mutation
              </span>
              <h3 className="text-xl font-black text-stone-900">
                Adjust Price for {quickPriceModal.name}
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Updates the authoritative price in Supabase and records audit history in <code>product_prices</code>.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Base Price (₦ NGN)</label>
                <input
                  type="number"
                  value={newBasePrice}
                  onChange={(e) => setNewBasePrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono text-sm focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Sale / Promotional Price (Optional ₦)</label>
                <input
                  type="number"
                  placeholder="Leave empty if no sale"
                  value={newSalePrice}
                  onChange={(e) => setNewSalePrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono text-sm focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Reason for Adjustment</label>
                <input
                  type="text"
                  value={priceReason}
                  onChange={(e) => setPriceReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSavePrice}
                disabled={isUpdatingPrice}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                {isUpdatingPrice ? 'Updating Supabase...' : 'Confirm & Mutate Price'}
              </button>
              <button
                onClick={() => setQuickPriceModal(null)}
                className="px-4 py-3 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
