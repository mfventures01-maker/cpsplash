import { supabase } from '../lib/supabase';
import { CustomerOrder, OrderStatus } from '../types/database.types';

const getErrMsg = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return err ? String(err) : fallback;
};

export const ordersService = {
  /**
   * Fetch all customer orders from Supabase (ordered by created_at DESC)
   */
  async getAllOrders(): Promise<{ data: CustomerOrder[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('customer_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) {
        return { data: [], error: error ? getErrMsg(error, 'Failed to fetch customer orders') : 'Failed to fetch orders' };
      }

      return { data: (data as unknown as CustomerOrder[]) || [], error: null };
    } catch (err: unknown) {
      return { data: [], error: err instanceof Error ? err.message : 'Unknown order fetch error' };
    }
  },

  /**
   * Fetch single order by ID
   */
  async getOrderById(id: string): Promise<{ data: CustomerOrder | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('customer_orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return { data: null, error: error ? getErrMsg(error, 'Order not found') : 'Order not found' };
      }

      return { data: data as unknown as CustomerOrder, error: null };
    } catch (err: unknown) {
      return { data: null, error: err instanceof Error ? err.message : 'Unknown order query error' };
    }
  },

  /**
   * Create customer order in Supabase
   */
  async createOrder(orderData: Partial<CustomerOrder>): Promise<{ data: CustomerOrder | null; error: string | null }> {
    try {
      const orderNumber = orderData.order_number || `CPS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newOrder = {
        order_number: orderNumber,
        customer_name: orderData.customer_name || 'Valued Customer',
        customer_phone: orderData.customer_phone || '08127700724',
        customer_location: orderData.customer_location || 'Sapele, Delta State',
        delivery_address: orderData.delivery_address || null,
        items: orderData.items || [],
        total_amount: Number(orderData.total_amount || 0),
        currency: orderData.currency || 'NGN',
        channel: orderData.channel || 'whatsapp',
        status: orderData.status || 'pending',
        notes: orderData.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase.from('customer_orders').insert(newOrder as unknown as Record<string, unknown>);
      if (error || !data) {
        return { data: null, error: error ? getErrMsg(error, 'Failed to save customer order') : 'Failed to save order' };
      }

      const created = Array.isArray(data) ? data[0] : data;
      return { data: created as unknown as CustomerOrder, error: null };
    } catch (err: unknown) {
      return { data: null, error: err instanceof Error ? err.message : 'Error creating customer order' };
    }
  },

  /**
   * Update order status in Supabase
   */
  async updateOrderStatus(id: string, status: OrderStatus): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('customer_orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        return { success: false, error: getErrMsg(error, 'Failed to update order status') };
      }
      return { success: true, error: null };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Error updating order status' };
    }
  },

  /**
   * Delete order from Supabase
   */
  async deleteOrder(id: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase.from('customer_orders').delete().eq('id', id);
      if (error) {
        return { success: false, error: getErrMsg(error, 'Failed to delete order') };
      }
      return { success: true, error: null };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Error deleting order' };
    }
  }
};
