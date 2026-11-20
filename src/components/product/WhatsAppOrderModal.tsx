import React, { useState } from 'react';
import { Product } from '../../types/database.types';
import { X, MessageCircle, Plus, Minus } from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';
import {
  getProductPrice,
  getProductVolume,
  getProductHeroMediaUrl,
} from '../../services/productHelpers';
import { BUSINESS_CONFIG, buildWhatsAppUrl } from '../../services/businessConfig';

interface WhatsAppOrderModalProps {
  product: Product | null;
  onClose: () => void;
}

export function WhatsAppOrderModal({ product, onClose }: WhatsAppOrderModalProps) {
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const price = getProductPrice(product);
  const volumeInfo = getProductVolume(product);
  const imageUrl = getProductHeroMediaUrl(product);
  const unitPrice = price.amount;
  const subtotal = unitPrice * quantity;
  const productUrl = `${window.location.origin}/products/${product.slug}`;

  const message = [
    'Hello CP Splash, I would like to enquire about this product:',
    `Product: ${product.name}`,
    `Quantity: ${quantity}`,
    `Pack size: ${volumeInfo.volume}${volumeInfo.unit}`,
    `Unit price: ₦${unitPrice.toLocaleString()}`,
    `Total: ₦${subtotal.toLocaleString()}`,
    `Product link: ${productUrl}`,
  ].join('\n');

  const whatsappUrl = buildWhatsAppUrl(message);

  const handleWhatsAppClick = () => {
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) return;
    analyticsService.trackEvent('whatsapp_click', {
      productId: product.id,
      landingPage: window.location.pathname,
      metadata: { source: 'product_whatsapp_cta', quantity, unitPrice, subtotal },
    });
    // No order header, order item, or persistence claim is created in this MVP.
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 relative my-8">
        <button onClick={onClose} className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100" aria-label="Close">
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs uppercase tracking-wider mb-1">
              <MessageCircle className="w-4 h-4" />
              <span>Continue on WhatsApp</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-stone-900">Enquire about {product.name}</h3>
            <p className="text-xs text-stone-500 mt-1">Confirm availability and your order directly with CP Splash on WhatsApp.</p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-stone-200 overflow-hidden shrink-0">
              <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-stone-900 text-sm">{product.name}</h4>
              <p className="text-xs text-stone-500">{volumeInfo.volume}{volumeInfo.unit}</p>
              <span className="text-base font-extrabold text-stone-900">₦{unitPrice.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block">Quantity</label>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-100 border border-stone-200">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-9 h-9 rounded-xl bg-white border border-stone-300 flex items-center justify-center" aria-label="Decrease quantity">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-lg font-bold text-stone-900 w-8 text-center font-mono">{quantity}</span>
                <button type="button" onClick={() => setQuantity(q => q + 1)} className="w-9 h-9 rounded-xl bg-white border border-stone-300 flex items-center justify-center" aria-label="Increase quantity">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="text-right">
                <span className="text-xs text-stone-500 block">Estimated total</span>
                <span className="text-lg font-black text-rose-700">₦{subtotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {unitPrice > 0 ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleWhatsAppClick}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Continue to WhatsApp</span>
            </a>
          ) : (
            <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              A valid active price is not available for this product. Please try again later.
            </div>
          )}
          <p className="text-[11px] text-center text-stone-500">
            WhatsApp: {BUSINESS_CONFIG.contact.enquiryPhoneDisplay}. Your message includes the current product price and product link. Your order is confirmed directly with the business.
          </p>
        </div>
      </div>
    </div>
  );
}
