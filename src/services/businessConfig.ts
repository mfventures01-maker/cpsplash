/**
 * CP Splash Authoritative Business & Brand Configuration Service
 * 
 * Centralizes commercial contact details, flagship hub locations,
 * and WhatsApp routing to prevent scattered literals across the frontend.
 * Conforms to HOEOS SSOT Principles.
 */

export interface BusinessConfig {
  brandName: string;
  tagline: string;
  flagshipLocation: {
    title: string;
    hubName: string;
    address: string;
    city: string;
    state: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };
  contact: {
    enquiryPhoneDisplay: string;
    whatsappNumber: string;
    email?: string;
  };
  defaults: {
    currency: string;
    volumeUnit: string;
  };
}

export const BUSINESS_CONFIG: BusinessConfig = {
  brandName: 'CP Fruit Splash',
  tagline: 'Goodness in Every Sip. Real nature, authentic botanical craftsmanship.',
  flagshipLocation: {
    title: 'Sapele Flagship Bottling & Distribution Hub',
    hubName: 'Sapele Flagship Hub',
    address: 'Opposite Ajimele Junction, Ajogodo',
    city: 'Sapele',
    state: 'Delta State',
    country: 'Nigeria',
  },
  contact: {
    enquiryPhoneDisplay: '08127700724',
    whatsappNumber: '2348127700724',
    email: 'info@cpfruitsplash.ng',
  },
  defaults: {
    currency: 'NGN',
    volumeUnit: 'ml',
  },
};

/**
 * Builds a deterministic WhatsApp URL with encoded message
 */
export function buildWhatsAppUrl(message: string, customPhone?: string): string {
  const phone = customPhone || BUSINESS_CONFIG.contact.whatsappNumber;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
