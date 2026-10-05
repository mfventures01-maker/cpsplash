import { 
  Product, 
  ProductVariant, 
  ProductClaim, 
  ResolvedProductPricing, 
  ResolvedProductVolume 
} from '../types/database.types';

const DEFAULT_CURRENCY = 'NGN';
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80';

/**
 * Resolves the active pricing for a product from its variants and price records.
 */
export function getProductPrice(product?: Product | null): ResolvedProductPricing {
  if (!product || !product.variants || product.variants.length === 0) {
    return { amount: 0, compare_at_amount: null, currency: DEFAULT_CURRENCY };
  }

  // Find active variant
  const variant = product.variants.find(v => v.status === 'active') || product.variants[0];
  if (!variant || !variant.prices || variant.prices.length === 0) {
    return { amount: 0, compare_at_amount: null, currency: DEFAULT_CURRENCY };
  }

  // Find active price
  const price = variant.prices.find(p => p.status === 'active') || variant.prices[0];
  if (!price) {
    return { amount: 0, compare_at_amount: null, currency: DEFAULT_CURRENCY };
  }

  return {
    amount: Number(price.amount) || 0,
    compare_at_amount: price.compare_at_amount ? Number(price.compare_at_amount) : null,
    compareAtAmount: price.compare_at_amount ? Number(price.compare_at_amount) : null,
    currency: DEFAULT_CURRENCY,
  };
}

/**
 * Resolves physical volume specifications for a product from its variants.
 */
export function getProductVolume(product?: Product | null): ResolvedProductVolume {
  if (!product || !product.variants || product.variants.length === 0) {
    return { volume: 500, unit: 'ml' };
  }

  const variant = product.variants.find(v => v.status === 'active') || product.variants[0];
  return {
    volume: variant.volume ? Number(variant.volume) : 500,
    unit: variant.volume_unit || 'ml',
  };
}

/**
 * Resolves the primary/hero media public URL for a product from media_assets.
 */
export function getProductHeroMediaUrl(product?: Product | null): string {
  if (!product || !product.media || product.media.length === 0) {
    return FALLBACK_IMAGE;
  }

  // Primary media first, then sort_order
  const primaryRel = product.media.find(m => m.is_primary) || product.media[0];
  const asset = primaryRel.media_assets || primaryRel.asset;
  if (!asset) {
    return FALLBACK_IMAGE;
  }

  if (asset.public_url) {
    return asset.public_url;
  }

  if (asset.bucket && asset.path) {
    return `https://efvvczmopacoroudzfnl.supabase.co/storage/v1/object/public/${asset.bucket}/${asset.path}`;
  }

  return FALLBACK_IMAGE;
}

/**
 * Resolves claims for a product.
 */
export function getProductClaims(product?: Product | null, verifiedOnly = false): ProductClaim[] {
  if (!product || !product.claims) {
    return [];
  }

  if (verifiedOnly) {
    return product.claims.filter(c => c.verification_status === 'verified');
  }

  return product.claims;
}

/**
 * Gets the primary variant of a product.
 */
export function getProductPrimaryVariant(product?: Product | null): ProductVariant | undefined {
  if (!product || !product.variants || product.variants.length === 0) {
    return undefined;
  }
  return product.variants.find(v => v.status === 'active') || product.variants[0];
}
