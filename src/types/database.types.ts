/**
 * Live Supabase ECOMMERCE Authoritative Schema Types
 * Tenant: CP Fruit Splash (42d36cee-4cd6-43d1-af5d-334e5a07e37c)
 * Governed under HOEOS Deterministic Engineering Standards
 */

export const CP_SPLASH_TENANT_ID = '42d36cee-4cd6-43d1-af5d-334e5a07e37c';

export type ProductStatus = 'draft' | 'published' | 'archived';
export type VariantStatus = 'active' | 'inactive' | 'archived';
export type PriceStatus = 'active' | 'inactive' | 'scheduled';
export type PriceType = 'retail' | 'wholesale' | 'promotional';
export type MediaAssetStatus = 'active' | 'archived';
export type ClaimType = 'marketing' | 'health' | 'benefit';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type BlogPostStatus = 'draft' | 'published' | 'archived';
export type CampaignStatus = 'draft' | 'active' | 'ended';
export type SocialPlatform = 'instagram' | 'tiktok' | 'youtube' | 'ugc' | 'influencer';
export type RetailerVerificationStatus = 'verified' | 'pending' | 'rejected';
export type RetailerStatus = 'active' | 'inactive';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'partially_refunded';
export type FulfillmentStatus = 'unfulfilled' | 'partially_fulfilled' | 'fulfilled';

// 1. TENANTS
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  legal_name: string | null;
  status: string;
  default_currency: string;
  default_country: string;
  timezone: string;
  logo_url: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// 2. PRODUCT CATEGORIES
export interface ProductCategory {
  id: string;
  tenant_id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  status: string;
  created_at: string;
  updated_at: string;
}

// 3. PRODUCTS (Identity & core product data only - NO direct prices, volume, or hero_media)
export interface Product {
  id: string;
  tenant_id: string;
  category_id: string | null;
  name: string;
  slug: string;
  sku: string | null;
  brand: string | null;
  product_type: string;
  short_description: string | null;
  description: string | null;
  status: ProductStatus;
  featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;

  // Joined relations from Supabase queries:
  category?: ProductCategory | null;
  variants?: ProductVariant[];
  media?: ProductMediaRelation[];
  claims?: ProductClaim[];
}

// 4. PRODUCT VARIANTS (Physical/sellable unit: volume, weight, SKU)
export interface ProductVariant {
  id: string;
  tenant_id: string;
  product_id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  volume: number | null;
  volume_unit: string | null;
  weight: number | null;
  weight_unit: string | null;
  status: VariantStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;

  // Joined relation:
  prices?: ProductPrice[];
}

// 5. PRICE LISTS (Tenant pricing containers)
export interface PriceList {
  id: string;
  tenant_id: string;
  name: string;
  currency: string;
  price_type: PriceType;
  status: PriceStatus;
  valid_from: string | null;
  valid_to: string | null;
  created_at: string;
}

// 6. PRODUCT PRICES (Prices linked to variant & price list)
export interface ProductPrice {
  id: string;
  tenant_id: string;
  price_list_id: string;
  variant_id: string;
  amount: number;
  compare_at_amount: number | null;
  status: PriceStatus;
  valid_from: string | null;
  valid_to: string | null;
  change_reason: string | null;
  created_by: string | null;
  created_at: string;
}

// 7. MEDIA ASSETS (Stored media files in Supabase Storage)
export interface MediaAsset {
  id: string;
  tenant_id: string;
  bucket: string;
  path: string;
  media_type: string;
  mime_type: string | null;
  filename: string | null;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  alt_text: string | null;
  caption: string | null;
  status: MediaAssetStatus;
  uploaded_by: string | null;
  created_at: string;
  // Computed property:
  public_url?: string;
}

// 8. PRODUCT MEDIA (Join table linking product to media_assets)
export interface ProductMediaRelation {
  product_id: string;
  media_id: string;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
  // Joined asset:
  media_assets?: MediaAsset;
  asset?: MediaAsset;
}

// 9. PRODUCT CLAIMS (Claims verification engine)
export interface ProductClaim {
  id: string;
  tenant_id: string;
  product_id: string;
  variant_id: string | null;
  claim: string;
  claim_type: ClaimType;
  evidence_source: string | null;
  verification_status: VerificationStatus;
  verified_by: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

// 10. BLOG POSTS
export interface BlogPost {
  id: string;
  tenant_id: string;
  author_id: string | null;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_media_id: string | null;
  status: BlogPostStatus;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
  featured_media?: MediaAsset | null;
}

// 11. INFLUENCERS
export interface Influencer {
  id: string;
  tenant_id: string;
  name: string;
  handle: string | null;
  platform: string | null;
  profile_url: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  created_at: string;
}

// 12. CAMPAIGNS
export interface Campaign {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description: string | null;
  status: CampaignStatus;
  starts_at: string | null;
  ends_at: string | null;
  landing_path: string | null;
  default_utm_source: string | null;
  default_utm_medium: string | null;
  default_utm_campaign: string | null;
  created_at: string;
}

// 13. SOCIAL CONTENT
export interface SocialContent {
  id: string;
  tenant_id: string;
  campaign_id: string | null;
  influencer_id: string | null;
  platform: SocialPlatform;
  external_post_id: string | null;
  url: string;
  caption: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
}

// 14. RETAILERS
export interface Retailer {
  id: string;
  tenant_id: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  verification_status: RetailerVerificationStatus;
  status: string;
  created_at: string;
}

// 15. ORDERS & ORDER ITEMS
export interface Order {
  id: string;
  tenant_id: string;
  store_id: string | null;
  customer_id: string | null;
  order_number: string;
  channel: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  currency: string;
  subtotal: number;
  discount_total: number;
  delivery_fee: number;
  tax_total: number;
  grand_total: number;
  notes: string | null;
  source: string | null;
  campaign_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_location?: string | null;
  delivery_address?: string | null;
}

export interface OrderItem {
  id: string;
  tenant_id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name_snapshot: string;
  sku_snapshot: string | null;
  unit_price: number;
  quantity: number;
  discount: number;
  line_total: number;
  created_at: string;
}

// 16. ANALYTICS EVENTS
export interface AnalyticsEvent {
  id?: string;
  tenant_id: string;
  session_id?: string | null;
  customer_id?: string | null;
  event_name: string;
  product_id?: string | null;
  campaign_id?: string | null;
  order_id?: string | null;
  lead_id?: string | null;
  territory_id?: string | null;
  offer_id?: string | null;
  journey_id?: string | null;
  page_path?: string | null;
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  content?: string | null;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

// 17. COMMERCIAL SALES ENGINE TYPES
export interface SalesTerritory {
  id: string;
  tenant_id: string;
  slug: string;
  name: string;
  headline: string;
  description: string | null;
  buyer_summary: string | null;
  cta_label: string;
  landing_path: string | null;
  active: boolean;
  sort_order: number;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
  // Relations
  journeys?: SalesJourney[];
  offers?: SalesOffer[];
}

export type SalesJourneyType = 'quote' | 'direct' | 'consultation' | 'distribution';
export type SalesJourneyDestination = 'whatsapp' | 'checkout' | 'portal' | 'custom';

export interface SalesJourney {
  id: string;
  tenant_id: string;
  territory_id: string;
  slug: string;
  name: string;
  journey_type: string;
  destination: string;
  cta_label: string;
  whatsapp_number: string | null;
  manychat_flow_key: string | null;
  active: boolean;
  config: Record<string, unknown>;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
  // Relations
  questions?: SalesQuestion[];
  territory?: SalesTerritory;
}

export interface SalesOffer {
  id: string;
  tenant_id: string;
  territory_id: string;
  slug: string;
  name: string;
  description: string | null;
  offer_type: string;
  active: boolean;
  metadata: Record<string, unknown>;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type QuestionType = 'text' | 'number' | 'date' | 'select' | 'tel' | 'email' | 'textarea';

export interface SalesQuestion {
  id: string;
  tenant_id: string;
  journey_id: string;
  field_key: string;
  label: string;
  question_type: QuestionType | string;
  required: boolean;
  placeholder: string | null;
  options: string[] | { label: string; value: string }[] | Record<string, unknown>[];
  sort_order: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'quoted' | 'won' | 'lost' | 'closed';

export interface SalesLead {
  id: string;
  tenant_id: string;
  lead_number: string;
  territory_id: string;
  offer_id: string | null;
  journey_id: string | null;
  buyer_type: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  quantity: number | null;
  event_date: string | null;
  product_interest: string | null;
  status: LeadStatus;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  manychat_contact_id: string | null;
  notes: string | null;
  answers: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined relations
  territory?: SalesTerritory;
  journey?: SalesJourney;
  offer?: SalesOffer;
}

export interface SalesFunnelSummary {
  tenant_id: string;
  territory_id: string;
  status: string;
  lead_count: number;
  first_lead_at: string | null;
  last_lead_at: string | null;
  territory_name?: string;
}

// Convenience view / domain model for UI consumption
export interface ResolvedProductPricing {
  amount: number;
  compare_at_amount: number | null;
  compareAtAmount?: number | null;
  currency: string;
}

export interface ResolvedProductVolume {
  volume: number;
  unit: string;
}
