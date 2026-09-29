import React, { useEffect, useState } from 'react';
import { ordersService } from '../../services/ordersService';
import { CustomerOrder, OrderStatus } from '../../types/database.types';
import { 
  ShoppingBag, 
  Search, 
  RefreshCw, 
  MessageCircle, 
  Phone, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Truck, 
  XCircle, 
  Eye, 
  Trash2, 
  X,
  PackageCheck,
  AlertCircle
} from 'lucide-react';
import { subscribeToSync } from '../../lib/supabase';

export function AdminOrdersManager() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await ordersService.getAllOrders();
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();

    // Real-time synchronization subscription for customer_orders
    const unsubscribe = subscribeToSync((event) => {
      if (['customer_orders', '*'].includes(event.table)) {
        fetchOrders();
      }
    });
    return unsubscribe;
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    await ordersService.updateOrderStatus(orderId, newStatus);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
    }
    setUpdatingId(null);
  };

  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (confirm(`Are you sure you want to permanently delete order ${orderNumber} from Supabase?`)) {
      await ordersService.deleteOrder(orderId);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
      fetchOrders();
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />,
          label: 'Delivered',
        };
      case 'out_for_delivery':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-300',
          icon: <Truck className="w-3 h-3 text-blue-600" />,
          label: 'Out for Delivery',
        };
      case 'bottled':
        return {
          bg: 'bg-purple-50 text-purple-800 border-purple-300',
          icon: <PackageCheck className="w-3 h-3 text-purple-600" />,
          label: 'Bottled & Chilled',
        };
      case 'confirmed':
        return {
          bg: 'bg-cyan-50 text-cyan-800 border-cyan-300',
          icon: <CheckCircle2 className="w-3 h-3 text-cyan-600" />,
          label: 'Confirmed',
        };
      case 'cancelled':
        return {
          bg: 'bg-red-50 text-red-800 border-red-300',
          icon: <XCircle className="w-3 h-3 text-red-600" />,
          label: 'Cancelled',
        };
      case 'pending':
      default:
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          icon: <Clock className="w-3 h-3 text-amber-600" />,
          label: 'Pending Dispatch',
        };
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      order.customer_name.toLowerCase().includes(query) ||
      order.customer_phone.includes(query) ||
      order.order_number.toLowerCase().includes(query) ||
      order.customer_location.toLowerCase().includes(query) ||
      (order.delivery_address && order.delivery_address.toLowerCase().includes(query));

    return matchesStatus && matchesSearch;
  });

  const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.total_amount : 0), 0);
  const pendingCount = orders.filter(o => o.status === 'pending').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase text-emerald-600 tracking-wider">
              Supabase customer_orders Table
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">
            Customer Orders Management
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Real-time orders generated via the WhatsApp Commerce Engine and public store dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            className="p-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-600 transition-colors cursor-pointer"
            title="Refresh Orders from Supabase"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase text-stone-500">Total Orders</span>
          <div className="text-2xl sm:text-3xl font-black text-stone-900">{orders.length}</div>
          <span className="text-[10px] text-stone-400 block font-mono">Recorded in database</span>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase text-stone-500">Pending Action</span>
          <div className="text-2xl sm:text-3xl font-black text-amber-600">{pendingCount}</div>
          <span className="text-[10px] text-amber-700 block font-semibold">Requires dispatch</span>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase text-stone-500">Delivered</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">
            {orders.filter(o => o.status === 'delivered').length}
          </div>
          <span className="text-[10px] text-emerald-700 block font-semibold">Completed fulfillment</span>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase text-stone-500">Total Volume Value</span>
          <div className="text-2xl sm:text-3xl font-black text-stone-900">
            ₦{totalRevenue.toLocaleString()}
          </div>
          <span className="text-[10px] text-stone-400 block font-mono">Gross order value</span>
        </div>
      </div>

      {/* Controls: Search and Status Filter */}
      <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by customer name, phone, order number, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs bg-stone-50"
            />
          </div>

          {/* Quick counts */}
          <span className="text-xs text-stone-500 font-mono">
            Showing {filteredOrders.length} of {orders.length} orders
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'pending', label: 'Pending' },
            { id: 'confirmed', label: 'Confirmed' },
            { id: 'bottled', label: 'Bottled' },
            { id: 'out_for_delivery', label: 'Out for Delivery' },
            { id: 'delivered', label: 'Delivered' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-stone-400">Loading orders from Supabase...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-stone-400 text-xs space-y-2">
            <ShoppingBag className="w-8 h-8 mx-auto text-stone-300" />
            <p className="font-semibold text-stone-700">No customer orders found</p>
            <p className="text-[11px]">When customers click "Order on WhatsApp" in the store, their orders will appear here in real time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-mono uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5 font-bold">Order #</th>
                  <th className="py-3 px-4 font-bold">Customer</th>
                  <th className="py-3 px-4 font-bold">Items</th>
                  <th className="py-3 px-4 font-bold">Total</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold">Date</th>
                  <th className="py-3 px-5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredOrders.map((order) => {
                  const badge = getStatusBadge(order.status);
                  const isUpdating = updatingId === order.id;

                  return (
                    <tr key={order.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3.5 px-5 font-mono font-bold text-stone-900">
                        <span>{order.order_number}</span>
                        <span className="block text-[10px] text-stone-400 font-sans font-normal capitalize">
                          via {order.channel.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-stone-900">
                        <div className="flex flex-col">
                          <span>{order.customer_name}</span>
                          <span className="text-[11px] font-mono text-stone-500 font-normal">
                            {order.customer_phone}
                          </span>
                          <span className="text-[10px] text-stone-400 font-normal truncate max-w-[180px]">
                            {order.customer_location}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-stone-700">
                        <div className="space-y-0.5 max-w-xs">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="truncate text-[11px]">
                              <span className="font-bold text-stone-900">{item.quantity}x</span> {item.product_name} ({item.volume_ml}mL)
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-black text-stone-900 text-sm">
                        ₦{Number(order.total_amount).toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={order.status}
                          disabled={isUpdating}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                          className={`text-[10px] font-bold uppercase rounded-full px-2.5 py-1 border transition-colors cursor-pointer ${badge.bg}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="bottled">Bottled</option>
                          <option value="out_for_delivery">Out for Delivery</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[10px] text-stone-400">
                        {new Date(order.created_at).toLocaleDateString()}<br />
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      <td className="py-3.5 px-5 text-right space-x-1.5">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-700 font-bold transition-colors inline-flex items-center gap-1"
                          title="View Order Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Details</span>
                        </button>

                        <a
                          href={`https://wa.me/${order.customer_phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(order.customer_name)},%20this%20is%20CP%20Fruit%20Splash%20regarding%20your%20order%20${order.order_number}!`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-700 transition-colors inline-block"
                          title="Chat with Customer on WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>

                        <button
                          onClick={() => handleDeleteOrder(order.id, order.order_number)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-colors inline-block"
                          title="Delete Order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Order Details Drawer / Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-6 relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-stone-100 font-mono text-xs font-bold text-stone-700">
                  {selectedOrder.order_number}
                </span>
                <span className={`text-[10px] font-bold uppercase rounded-full px-2.5 py-0.5 border ${getStatusBadge(selectedOrder.status).bg}`}>
                  {getStatusBadge(selectedOrder.status).label}
                </span>
              </div>
              <h3 className="text-2xl font-black text-stone-900 mt-1">
                Order Specifications
              </h3>
              <p className="text-xs text-stone-400 font-mono mt-0.5">
                Created: {new Date(selectedOrder.created_at).toLocaleString()}
              </p>
            </div>

            {/* Customer Details Box */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3 text-xs">
              <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">
                Customer & Destination
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-stone-400 block text-[10px]">Customer Name:</span>
                  <span className="font-bold text-stone-800 text-sm">{selectedOrder.customer_name}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">Phone Number:</span>
                  <span className="font-bold font-mono text-stone-800">{selectedOrder.customer_phone}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">City / Region:</span>
                  <span className="font-semibold text-stone-700">{selectedOrder.customer_location}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">Delivery Landmark:</span>
                  <span className="font-semibold text-stone-700">{selectedOrder.delivery_address || 'Flagship Pickup (Opposite Ajimele Junction)'}</span>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="pt-2 border-t border-stone-200 text-stone-600">
                  <span className="font-bold text-stone-800 text-[10px] block">Special Instructions:</span>
                  <p className="italic font-medium">"{selectedOrder.notes}"</p>
                </div>
              )}

              {/* Action Buttons for Customer Contact */}
              <div className="pt-2 flex gap-2">
                <a
                  href={`tel:${selectedOrder.customer_phone}`}
                  className="flex-1 py-2 px-3 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Customer</span>
                </a>
                <a
                  href={`https://wa.me/${selectedOrder.customer_phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(selectedOrder.customer_name)},%20this%20is%20CP%20Fruit%20Splash%20regarding%20your%20order%20${selectedOrder.order_number}!`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Chat</span>
                </a>
              </div>
            </div>

            {/* Order Items Table */}
            <div className="space-y-2">
              <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">
                Bottled Beverage Items
              </h4>
              <div className="rounded-2xl border border-stone-200 overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-stone-50 border-b border-stone-200 font-mono text-stone-500 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Item</th>
                      <th className="py-2.5 px-3">Qty</th>
                      <th className="py-2.5 px-3">Price</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-semibold text-stone-900">
                          {item.product_name}
                          <span className="block text-[10px] text-stone-400 font-mono">{item.volume_ml}mL chilled</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono">{item.quantity}</td>
                        <td className="py-2.5 px-3 font-mono">₦{item.unit_price.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900">
                          ₦{item.subtotal.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-stone-50 font-bold border-t border-stone-200">
                    <tr>
                      <td colSpan={3} className="py-3 px-3 uppercase text-[11px] text-stone-600">Total Order Value</td>
                      <td className="py-3 px-3 text-right font-mono font-black text-rose-700 text-sm">
                        ₦{selectedOrder.total_amount.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Change Status Controls */}
            <div className="space-y-2 pt-2 border-t border-stone-200 text-xs">
              <label className="font-bold text-stone-700 block">
                Update Fulfillment Status (Mutates Supabase)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {(['pending', 'confirmed', 'bottled', 'out_for_delivery', 'delivered', 'cancelled'] as OrderStatus[]).map(st => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(selectedOrder.id, st)}
                    className={`py-2 px-1 rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer text-center ${
                      selectedOrder.status === st
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                    }`}
                  >
                    {st.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-bold text-xs"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
