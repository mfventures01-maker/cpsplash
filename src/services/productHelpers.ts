import { 
  Product, 
  ProductVariant, 
  ProductClaim, 
  ResolvedProductPricing, 
  ResolvedProductVolume,
  MediaSequenceRole,
  ProductMediaSequenceItem,
  ProductAnimationConfig,
  BlogPost
} from '../types/database.types';

const DEFAULT_CURRENCY = 'NGN';

// Deterministic neutral bottle silhouette placeholder (Zero external Unsplash dependencies)
export const BRAND_PLACEHOLDER_IMAGE = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' fill='none'%3E%3Crect width='400' height='400' fill='%231c1917'/%3E%3Cpath d='M175 60h50v30h-50zM160 90h80c10 0 20 15 20 30v190c0 20-15 30-30 30h-60c-15 0-30-10-30-30V120c0-15 10-30 20-30z' fill='%2344403c'/%3E%3Ccircle cx='200' cy='200' r='36' fill='%23e11d48' opacity='0.8'/%3E%3Ctext x='200' y='206' fill='white' font-family='sans-serif' font-size='16' font-weight='bold' text-anchor='middle'%3ECP%3C/text%3E%3Ctext x='200' y='360' fill='%23a8a29e' font-family='sans-serif' font-size='12' text-anchor='middle'%3ECP Fruit Splash%3C/text%3E%3C/svg%3E";

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
    return BRAND_PLACEHOLDER_IMAGE;
  }

  // Primary media first, then sort_order
  const primaryRel = product.media.find(m => m.is_primary) || product.media[0];
  const asset = primaryRel.media_assets || primaryRel.asset;
  if (!asset) {
    return BRAND_PLACEHOLDER_IMAGE;
  }

  if (asset.public_url) {
    return asset.public_url;
  }

  if (asset.bucket && asset.path) {
    return `https://efvvczmopacoroudzfnl.supabase.co/storage/v1/object/public/${asset.bucket}/${asset.path}`;
  }

  return BRAND_PLACEHOLDER_IMAGE;
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

export const DEFAULT_ANIMATION_CONFIG: ProductAnimationConfig = {
  enabled: true,
  duration_seconds: 4.5,
  loop: true,
  autoplay: true,
  aspect_ratio: 'square'
};

export const SEQUENCE_ROLES_META: { role: MediaSequenceRole; position: number; label: string; description: string }[] = [
  { role: 'hero_bottle', position: 1, label: '01 Clean Hero Bottle', description: 'Primary product recognition with controlled push zoom' },
  { role: 'premium_three_quarter', position: 2, label: '02 Premium 3/4 Bottle', description: 'Depth presentation with camera orbit & lighting' },
  { role: 'ingredient_explosion', position: 3, label: '03 Ingredient Explosion', description: 'Whole botanicals and fruits revealing formulation' },
  { role: 'lifestyle', position: 4, label: '04 Lifestyle Model', description: 'Natural human context and wellness interaction' },
  { role: 'serving', position: 5, label: '05 Serving Shot', description: 'Chilled glass pouring, ice motion, cold condensation' },
  { role: 'campaign_hero', position: 6, label: '06 Surreal Campaign Hero', description: 'Selective cinematic artistic treatment' },
];

export function getProductAnimationConfig(product?: Product | null): ProductAnimationConfig {
  const meta = (product?.metadata || {}) as Record<string, unknown>;
  const raw = meta.animation_config as Partial<ProductAnimationConfig> | undefined;
  return {
    enabled: raw?.enabled !== undefined ? Boolean(raw.enabled) : true,
    duration_seconds: typeof raw?.duration_seconds === 'number' ? raw.duration_seconds : 4.5,
    loop: raw?.loop !== undefined ? Boolean(raw.loop) : true,
    autoplay: raw?.autoplay !== undefined ? Boolean(raw.autoplay) : true,
    aspect_ratio: raw?.aspect_ratio || 'square',
  };
}

export function getProductMediaSequence(product?: Product | null): ProductMediaSequenceItem[] {
  const meta = (product?.metadata || {}) as Record<string, unknown>;
  const rawSequence = meta.media_sequence as ProductMediaSequenceItem[] | undefined;
  if (Array.isArray(rawSequence) && rawSequence.length > 0) {
    return rawSequence;
  }

  // Derive sequence from product.media if not explicitly configured
  const mediaList = product?.media || [];
  return SEQUENCE_ROLES_META.map((metaItem, idx) => {
    const matchedMedia = mediaList[idx];
    return {
      position: metaItem.position,
      role: metaItem.role,
      media_id: matchedMedia ? matchedMedia.media_id : '',
      custom_label: metaItem.label,
      enabled: Boolean(matchedMedia),
    };
  });
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

/**
  * Resolves the featured image URL for a blog post.
  */
export function getBlogFeaturedImageUrl(post?: BlogPost | null): string {
  if (!post) return '';

  // Priority 1: featured_media relation
  const asset = post.featured_media || post.featured_media_assets;
  if (asset?.bucket && asset?.path) {
    return `https://efvvczmopacoroudzfnl.supabase.co/storage/v1/object/public/${asset.bucket}/${asset.path}`;
  }

  // Priority 2: stored URL
  if (post.featured_image_url) {
    return post.featured_image_url;
  }

  return '';
}

