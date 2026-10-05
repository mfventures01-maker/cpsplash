import React, { useEffect, useState } from 'react';
import { productsService } from '../../services/productsService';
import { supabase, TENANT_ID } from '../../lib/supabase';
import { Product, ProductPrice } from '../../types/database.types';
import { getProductPrice } from '../../services/productHelpers';
import { DollarSign, History, RefreshCw, CheckCircle2 } from 'lucide-react';

interface PriceHistoryRow extends ProductPrice {
  variant?: {
    name: string;
    product?: {
      name: string;
    };
  };
}

export function AdminPriceManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [newBasePrice, setNewBasePrice] = useState<number>(1000);
  const [newSalePrice, setNewSalePrice] = useState<number | ''>('');
  const [reason, setReason] = useState<string>('Standard periodic price update');
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const { data: prods } = await productsService.getAllProducts();
    setProducts(prods);
    if (prods.length > 0 && !selectedProduct) {
      setSelectedProduct(prods[0].id);
      const pr = getProductPrice(prods[0]);
      setNewBasePrice(pr.amount);
      setNewSalePrice(pr.compare_at_amount || '');
    }

    const { data: history } = await supabase
      .from('product_prices')
      .select('*, variant:product_variants(name, product:products(name))')
      .eq('tenant_id', TENANT_ID)
      .order('created_at', { ascending: false });

    setPriceHistory((history as unknown as PriceHistoryRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProductChange = (prodId: string) => {
    setSelectedProduct(prodId);
    const found = products.find(p => p.id === prodId);
    if (found) {
      const pr = getProductPrice(found);
      setNewBasePrice(pr.amount);
      setNewSalePrice(pr.compare_at_amount || '');
    }
  };

  const handleUpdatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setUpdating(true);
    setSuccessMsg(null);

    const res = await productsService.updateProductPrice(
      selectedProduct,
      Number(newBasePrice),
      newSalePrice === '' ? null : Number(newSalePrice),
      reason
    );

    if (res.success) {
      setSuccessMsg('Price successfully mutated in Supabase PostgreSQL engine!');
      fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      alert(res.error || 'Failed to update price');
    }
    setUpdating(false);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div>
        <span className="text-xs font-mono font-bold uppercase text-rose-600 tracking-wider">
          HOEOS Rule 11 Compliance
        </span>
        <h1 className="text-3xl font-black text-stone-900 tracking-tight">
          Authoritative Price Engine
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          "Prices must originate from Supabase. Never write price directly into production UI components."
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Mutation Form */}
      <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-6">
        <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-2">
          Mutate Authoritative Product Price
        </h3>

        <form onSubmit={handleUpdatePrice} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-bold text-stone-700 block mb-1">Target Product</label>
              <select
                value={selectedProduct}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white font-semibold text-xs"
              >
                {products.map(p => {
                  const pr = getProductPrice(p);
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} (Now: ₦{pr.amount.toLocaleString()})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">New Base Price (₦ NGN)</label>
              <input
                type="number"
                required
                value={newBasePrice}
                onChange={(e) => setNewBasePrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono text-sm font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">New Sale Price (Optional ₦)</label>
              <input
                type="number"
                placeholder="Leave blank for regular price"
                value={newSalePrice}
                onChange={(e) => setNewSalePrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono text-sm font-bold text-rose-700"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">Reason for Adjustment / Audit Note</label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Sapele bottling promotion or raw hibiscus cost adjustment"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={updating}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md"
            >
              <DollarSign className="w-4 h-4" />
              <span>{updating ? 'Mutating in Supabase...' : 'Execute Supabase Price Mutation'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Historical Audit Table */}
      <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-stone-500" />
            <h3 className="text-base font-bold text-stone-900">
              Supabase product_prices Historical Audit Log
            </h3>
          </div>
          <button
            onClick={fetchData}
            className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-stone-400 font-mono uppercase tracking-wider">
                <th className="py-2.5 font-bold">Product / Variant</th>
                <th className="py-2.5 font-bold">Amount</th>
                <th className="py-2.5 font-bold">Compare-at</th>
                <th className="py-2.5 font-bold">Reason</th>
                <th className="py-2.5 font-bold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {priceHistory.map((item) => (
                <tr key={item.id} className="hover:bg-stone-50/70">
                  <td className="py-3 font-semibold text-stone-900">
                    {item.variant?.product?.name || item.variant?.name || 'Standard Variant'}
                  </td>
                  <td className="py-3 font-mono font-bold text-stone-900">
                    ₦{Number(item.amount).toLocaleString()}
                  </td>
                  <td className="py-3 font-mono text-rose-700">
                    {item.compare_at_amount ? `₦${Number(item.compare_at_amount).toLocaleString()}` : '—'}
                  </td>
                  <td className="py-3 text-stone-600 max-w-xs truncate">
                    {item.change_reason || 'Price configuration'}
                  </td>
                  <td className="py-3 text-right font-mono text-[10px] text-stone-400">
                    {new Date(item.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
