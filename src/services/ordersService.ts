import { supabase, TENANT_ID, notifySyncEvent } from '../lib/supabase';
import { Order, OrderStatus } from '../types/database.types';

const getErrMsg = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return err ? String(err) : fallback;
};

export interface CreateOrderInput {
  customer_name?: string;
  customer_phone?: string;
  customer_location?: string;
  delivery_address?: string | null;
  channel?: string;
  status?: OrderStatus;
  currency?: string;
  total_amount?: number;
  notes?: string | null;
  items?: {
    product_id?: string | null;
    variant_id?: string | null;
    product_name: string;
    quantity: number;
    unit_price: number;
    volume?: number;
    subtotal: number;
  }[];
}

function enrichOrder(o: Record<string, unknown>): Order {
  const notes = (o.notes as string) || '';
  let customer_name = '';
  let customer_phone = '';
  let customer_location = '';
  let delivery_address = '';

  const nameMatch = notes.match(/Customer:\s*([^|]+)/i);
  if (nameMatch) customer_name = nameMatch[1].trim();

  const phoneMatch = notes.match(/Phone:\s*([^|]+)/i);
  if (phoneMatch) customer_phone = phoneMatch[1].trim();

  const locMatch = notes.match(/Location:\s*([^|]+)/i);
  if (locMatch) customer_location = locMatch[1].trim();

  const addrMatch = notes.match(/Address:\s*([^|]+)/i);
  if (addrMatch) delivery_address = addrMatch[1].trim();

  return {
    ...(o as unknown as Order),
    customer_name: customer_name || 'Walk-in / Online Customer',
    customer_phone: customer_phone || '2348127700724',
    customer_location: customer_location || 'Sapele',
    delivery_address: delivery_address || 'Flagship Hub',
  };
}

export const ordersService = {
  /**
   * Fetch all orders from Supabase (ordered by created_at DESC)
   */
  async getAllOrders(): Promise<{ data: Order[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .eq('tenant_id', TENANT_ID)
        .order('created_at', { ascending: false });

      if (error || !data) {
        return { data: [], error: error ? getErrMsg(error, 'Failed to fetch orders') : 'Failed to fetch orders' };
      }

      const enriched = (data as Record<string, unknown>[]).map(enrichOrder);
      return { data: enriched, error: null };
    } catch (err: unknown) {
      return { data: [], error: err instanceof Error ? err.message : 'Unknown order fetch error' };
    }
  },

  /**
   * Fetch single order by ID
   */
  async getOrderById(id: string): Promise<{ data: Order | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .eq('tenant_id', TENANT_ID)
        .eq('id', id)
        .single();

      if (error || !data) {
        return { data: null, error: error ? getErrMsg(error, 'Order not found') : 'Order not found' };
      }

      return { data: enrichOrder(data as Record<string, unknown>), error: null };
    } catch (err: unknown) {
      return { data: null, error: err instanceof Error ? err.message : 'Unknown order query error' };
    }
  },

  /**
   * Create customer order in Supabase live 'orders' and 'order_items' tables
   */
  async createOrder(orderData: CreateOrderInput): Promise<{ data: Order | null; error: string | null }> {
    try {
      const orderNumber = `CPS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const total = Number(orderData.total_amount || 0);

      const notesArr = [];
      if (orderData.customer_name) notesArr.push(`Customer: ${orderData.customer_name}`);
      if (orderData.customer_phone) notesArr.push(`Phone: ${orderData.customer_phone}`);
      if (orderData.customer_location) notesArr.push(`Location: ${orderData.customer_location}`);
      if (orderData.delivery_address) notesArr.push(`Address: ${orderData.delivery_address}`);
      if (orderData.notes) notesArr.push(`Note: ${orderData.notes}`);

      const newOrder = {
        tenant_id: TENANT_ID,
        order_number: orderNumber,
        channel: orderData.channel || 'whatsapp',
        status: orderData.status || 'pending',
        payment_status: 'unpaid',
        fulfillment_status: 'unfulfilled',
        currency: orderData.currency || 'NGN',
        subtotal: total,
        discount_total: 0,
        delivery_fee: 0,
        tax_total: 0,
        grand_total: total,
        notes: notesArr.join(' | ') || null,
        source: 'whatsapp_modal',
      };

      const { data: createdOrder, error: orderErr } = await supabase
        .from('orders')
        .insert(newOrder)
        .select('id')
        .single();

      if (orderErr || !createdOrder) {
        return { data: null, error: orderErr ? getErrMsg(orderErr, 'Failed to save order') : 'Failed to save order' };
      }

      const orderId = (createdOrder as { id: string }).id;

      // Insert line items
      if (orderData.items && orderData.items.length > 0) {
        const lineItems = orderData.items.map(item => ({
          tenant_id: TENANT_ID,
          order_id: orderId,
          product_id: item.product_id || null,
          variant_id: item.variant_id || null,
          product_name_snapshot: item.product_name,
          unit_price: Number(item.unit_price),
          quantity: Number(item.quantity),
          discount: 0,
          line_total: Number(item.subtotal),
        }));

        await supabase.from('order_items').insert(lineItems);
      }

      notifySyncEvent('orders', { id: orderId }, 'INSERT');
      return await this.getOrderById(orderId);
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
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('tenant_id', TENANT_ID);

      if (error) {
        return { success: false, error: getErrMsg(error, 'Failed to update order status') };
      }

      notifySyncEvent('orders', { id, status }, 'UPDATE');
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
      await supabase.from('order_items').delete().eq('order_id', id).eq('tenant_id', TENANT_ID);
      const { error } = await supabase.from('orders').delete().eq('id', id).eq('tenant_id', TENANT_ID);
      if (error) {
        return { success: false, error: getErrMsg(error, 'Failed to delete order') };
      }
      notifySyncEvent('orders', { id }, 'DELETE');
      return { success: true, error: null };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Error deleting order' };
    }
  }
};
