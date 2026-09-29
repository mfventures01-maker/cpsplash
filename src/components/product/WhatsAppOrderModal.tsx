import React, { useState } from 'react';
import { Product } from '../../types/database.types';
import { X, MessageCircle, Plus, Minus, MapPin, CheckCircle, ShieldCheck } from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';
import { ordersService } from '../../services/ordersService';

interface WhatsAppOrderModalProps {
  product: Product | null;
  onClose: () => void;
}

export function WhatsAppOrderModal({ product, onClose }: WhatsAppOrderModalProps) {
  if (!product) return null;

  const [quantity, setQuantity] = useState(2);
  const [customerName, setCustomerName] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('Sapele, Delta State');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [note, setNote] = useState('');
  const [orderSent, setOrderSent] = useState(false);

  // Authoritative price directly from the Supabase product record
  const unitPrice = (product.sale_price !== null && product.sale_price !== undefined) 
    ? product.sale_price 
    : product.base_price;

  const subtotal = unitPrice * quantity;
  const phoneNumber = product.whatsapp_order_number || '2348127700724';

  const handleSendOrder = () => {
    // 1. Generate Deterministic WhatsApp Order Message (Authoritative format)
    const orderLines = [
      `Hello CP Splash,`,
      ``,
      `I would like to order:`,
      `Product: ${product.name}`,
      `Quantity: ${quantity}`,
      `Volume: ${product.volume_ml}mL`,
      `Unit Price: ₦${unitPrice.toLocaleString()}`,
      `Subtotal: ₦${subtotal.toLocaleString()}`,
      ``,
      `Delivery Details:`,
      `Customer: ${customerName.trim() || 'Valued Customer'}`,
      `Location: ${deliveryLocation}`,
      deliveryAddress ? `Address: ${deliveryAddress.trim()}` : null,
      customerPhone ? `Contact Phone: ${customerPhone.trim()}` : null,
      note ? `Special Note: ${note.trim()}` : null,
      ``,
      `Order generated via CP Splash Commerce Engine (HOEOS Verified).`
    ].filter(Boolean);

    const message = orderLines.join('\n');
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    // 2. Persist order record into Supabase customer_orders table
    ordersService.createOrder({
      customer_name: customerName.trim() || 'Valued Customer',
      customer_phone: customerPhone.trim() || '08127700724',
      customer_location: deliveryLocation,
      delivery_address: deliveryAddress.trim() || null,
      channel: 'whatsapp',
      status: 'pending',
      currency: 'NGN',
      total_amount: subtotal,
      notes: note.trim() || null,
      items: [
        {
          product_id: product.id,
          product_name: product.name,
          quantity,
          unit_price: unitPrice,
          volume_ml: product.volume_ml,
          subtotal,
        }
      ]
    });

    // 3. Track analytics event deterministically into Supabase
    analyticsService.trackEvent('order_started', {
      productId: product.id,
      landingPage: window.location.pathname,
      metadata: {
        product_name: product.name,
        quantity,
        subtotal,
        location: deliveryLocation,
      }
    });

    analyticsService.trackEvent('whatsapp_click', {
      productId: product.id,
      metadata: {
        target: 'whatsapp_order_flow',
        phone: phoneNumber
      }
    });

    setOrderSent(true);

    // Open WhatsApp link in new tab
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {!orderSent ? (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs uppercase tracking-wider mb-1">
                <MessageCircle className="w-4 h-4 fill-emerald-600 text-white" />
                <span>Direct WhatsApp Commerce</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-stone-900 leading-tight">
                Order {product.name}
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Authoritative pricing sourced directly from Supabase PostgreSQL engine.
              </p>
            </div>

            {/* Product Summary Box */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-stone-200 overflow-hidden shrink-0">
                {product.media && product.media[0] ? (
                  <img
                    src={product.media[0].url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-stone-400">
                    No image
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-stone-900 text-sm truncate">{product.name}</h4>
                <p className="text-xs text-stone-500">{product.volume_ml}mL chilled bottle</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-base font-extrabold text-stone-900">
                    ₦{unitPrice.toLocaleString()}
                  </span>
                  {product.sale_price && (
                    <span className="text-xs text-stone-400 line-through">
                      ₦{product.base_price.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
                Quantity (Bottles)
              </label>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-100 border border-stone-200">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-9 h-9 rounded-xl bg-white border border-stone-300 flex items-center justify-center text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-lg font-bold text-stone-900 w-8 text-center font-mono">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-9 h-9 rounded-xl bg-white border border-stone-300 flex items-center justify-center text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-right">
                  <span className="text-xs text-stone-500 block">Subtotal</span>
                  <span className="text-lg font-black text-rose-700">
                    ₦{subtotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Details */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Your Name / Contact Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sandra Osagie"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    City / Area
                  </label>
                  <select
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm bg-white"
                  >
                    <option value="Sapele, Delta State">Sapele, Delta State (Local Delivery)</option>
                    <option value="Warri / Effurun, Delta State">Warri / Effurun, Delta State</option>
                    <option value="Asaba, Delta State">Asaba, Delta State</option>
                    <option value="Benin City, Edo State">Benin City, Edo State</option>
                    <option value="Port Harcourt, Rivers State">Port Harcourt, Rivers State</option>
                    <option value="Lagos State">Lagos State</option>
                    <option value="Abuja FCT">Abuja FCT</option>
                    <option value="Other Nigeria City">Other Nigeria City</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Phone / WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 08123456789"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Delivery Address / Landmark
                </label>
                <input
                  type="text"
                  placeholder="e.g. Close to Ajimele Junction, Ajogodo Road"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Optional Order Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Please deliver ice-chilled by 3 PM"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
                />
              </div>
            </div>

            {/* Dispatch Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSendOrder}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold text-base shadow-lg shadow-emerald-700/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-white text-emerald-600" />
                <span>Launch WhatsApp Order (₦{subtotal.toLocaleString()})</span>
              </button>
              <p className="text-[11px] text-center text-stone-500 mt-2 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Direct Line: +234 812 770 0724 (Sapele Hub)</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-stone-900">
              Order Dispatched to WhatsApp!
            </h3>
            <p className="text-sm text-stone-600 max-w-sm mx-auto leading-relaxed">
              Your deterministic order for <strong>{quantity}x {product.name}</strong> was formatted with Supabase pricing and routed to CP Splash headquarters.
            </p>
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-left text-xs font-mono space-y-1 text-stone-700">
              <div>Product: {product.name}</div>
              <div>Total: ₦{subtotal.toLocaleString()}</div>
              <div>Destination: {deliveryLocation}</div>
              <div>Target: 08127700724</div>
            </div>
            <div className="pt-2 flex gap-3">
              <button
                onClick={handleSendOrder}
                className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs"
              >
                Re-open WhatsApp
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-50"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
