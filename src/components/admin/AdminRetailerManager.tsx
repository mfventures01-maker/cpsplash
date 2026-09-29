import React, { useEffect, useState } from 'react';
import { retailerService } from '../../services/retailerService';
import { Retailer, RetailerStatus } from '../../types/database.types';
import { Plus, Trash2, MapPin, Phone, ShieldCheck, CheckCircle2 } from 'lucide-react';

export function AdminRetailerManager() {
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Sapele');
  const [state, setState] = useState('Delta State');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [availability, setAvailability] = useState('In Stock - Zobo Sweet & Luxury Juice Mix');

  const fetchRetailers = async () => {
    const data = await retailerService.getAllRetailers();
    setRetailers(data);
  };

  useEffect(() => {
    fetchRetailers();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address) return;

    await retailerService.addRetailer({
      name,
      address,
      city,
      state,
      phone,
      whatsapp,
      availability,
      status: 'verified',
    });

    setName('');
    setAddress('');
    setPhone('');
    setWhatsapp('');
    fetchRetailers();
  };

  const handleToggleStatus = async (id: string, current: RetailerStatus) => {
    const next: RetailerStatus = current === 'verified' ? 'inactive' : 'verified';
    await retailerService.updateRetailer(id, { status: next });
    fetchRetailers();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete retailer?')) {
      await retailerService.deleteRetailer(id);
      fetchRetailers();
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      <div>
        <span className="text-xs font-mono font-bold uppercase text-rose-600 tracking-wider">
          Supabase retailers Table
        </span>
        <h1 className="text-3xl font-black text-stone-900 tracking-tight">
          Retailer Directory Management
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Verified outlets visible to customers on /find-cp-splash.
        </p>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4 text-xs">
        <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-2">
          Add New Stockist Outlet
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="font-bold text-stone-700 block mb-1">Store / Outlet Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sapele Central Mart"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-semibold"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">City</label>
            <input
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="font-bold text-stone-700 block mb-1">Physical Address *</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Opposite Ajimele Junction, Ajogodo"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">State</label>
            <input
              type="text"
              required
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="font-bold text-stone-700 block mb-1">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08127700724"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">WhatsApp Number</label>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="2348127700724"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">Stock Availability Description</label>
            <input
              type="text"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs"
          >
            Save to Supabase Retailers
          </button>
        </div>
      </form>

      {/* Retailers list */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-mono uppercase">
            <tr>
              <th className="py-3 px-6 font-bold">Outlet</th>
              <th className="py-3 px-4 font-bold">Location</th>
              <th className="py-3 px-4 font-bold">Stock Status</th>
              <th className="py-3 px-4 font-bold">Verification</th>
              <th className="py-3 px-6 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {retailers.map(r => (
              <tr key={r.id} className="hover:bg-stone-50">
                <td className="py-4 px-6 font-bold text-stone-900">
                  {r.name}
                  <span className="text-[10px] text-stone-400 block font-normal">{r.address}</span>
                </td>
                <td className="py-4 px-4 text-stone-700">
                  {r.city}, {r.state}
                </td>
                <td className="py-4 px-4 text-stone-600 font-medium">
                  {r.availability}
                </td>
                <td className="py-4 px-4">
                  <button
                    onClick={() => handleToggleStatus(r.id, r.status)}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      r.status === 'verified' ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {r.status}
                  </button>
                </td>
                <td className="py-4 px-6 text-right">
                  <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-700 font-bold">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
