import { supabase } from '../lib/supabase';
import { Retailer, RetailerStatus } from '../types/database.types';

const getErrMsg = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return err ? String(err) : fallback;
};

export const retailerService = {
  async getVerifiedRetailers(): Promise<Retailer[]> {
    const { data } = await supabase
      .from('retailers')
      .select('*')
      .eq('status', 'verified')
      .order('city', { ascending: true });
    return (data as Retailer[]) || [];
  },

  async getAllRetailers(): Promise<Retailer[]> {
    const { data } = await supabase
      .from('retailers')
      .select('*')
      .order('created_at', { ascending: false });
    return (data as Retailer[]) || [];
  },

  async addRetailer(retailer: Partial<Retailer>): Promise<{ data: Retailer | null; error: string | null }> {
    try {
      const record = {
        name: retailer.name || '',
        address: retailer.address || '',
        city: retailer.city || 'Sapele',
        state: retailer.state || 'Delta State',
        phone: retailer.phone || null,
        whatsapp: retailer.whatsapp || null,
        latitude: retailer.latitude || null,
        longitude: retailer.longitude || null,
        availability: retailer.availability || 'In Stock - Zobo Sweet & Luxury Juice Mix',
        status: (retailer.status as RetailerStatus) || 'verified',
      };

      const { data, error } = await supabase.from('retailers').insert(record);
      if (error || !data) {
        return { data: null, error: error ? getErrMsg(error, 'Failed to add retailer') : 'Failed to add retailer' };
      }
      return { data: Array.isArray(data) ? (data[0] as Retailer) : (data as Retailer), error: null };
    } catch (e: unknown) {
      return { data: null, error: e instanceof Error ? e.message : 'Error adding retailer' };
    }
  },

  async updateRetailer(id: string, updates: Partial<Retailer>): Promise<{ success: boolean; error: string | null }> {
    const { error } = await supabase.from('retailers').update(updates).eq('id', id);
    return { success: !error, error: error ? getErrMsg(error, 'Update retailer failed') : null };
  },

  async deleteRetailer(id: string): Promise<{ success: boolean; error: string | null }> {
    const { error } = await supabase.from('retailers').delete().eq('id', id);
    return { success: !error, error: error ? getErrMsg(error, 'Delete retailer failed') : null };
  }
};
