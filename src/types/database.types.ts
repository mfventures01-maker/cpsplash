/**
 * Database types for CP Splash Social Commerce Engine
 * Aligned with PostgreSQL Master Migration schema
 */

export type ProductStatus = 'draft' | 'published' | 'archived';
export type AvailabilityStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'pre_order';
export type MediaType = 
  | 'hero_image' 
  | 'product_image' 
  | 'lifestyle_image' 
  | 'gallery_image' 
  | 'hero_video' 
  | 'short_video' 
  | 'ugc_image' 
  | 'ugc_video' 
  | 'influencer_media';

export type ClaimStatus = 'pending' | 'verified' | 'rejected';
export type BlogPostStatus = 'draft' | 'published' | 'archived';
export type CampaignStatus = 'draft' | 'active' | 'ended';
export type SocialPlatform = 'instagram' | 'tiktok' | 'youtube' | 'ugc' | 'influencer';
export type RetailerStatus = 'pending' | 'verified' | 'inactive';
export type OrderStatus = 'pending' | 'confirmed' | 'bottled' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  volume_ml: number;
  subtotal: number;
}

export interface CustomerOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_location: string;
  delivery_address: string | null;
  items: OrderItem[];
  total_amount: number;
  currency: string;
  channel: 'whatsapp' | 'web_direct' | 'phone_call' | 'flagship_walkin';
  status: OrderStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export interface ProductMedia {
  id: string;
  product_id: string;
  type: MediaType;
  url: string;
  thumbnail_url: string | null;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  metadata?: {
    duration_seconds?: number;
    aspect_ratio?: string;
    width?: number;
    height?: number;
    format?: string;
  };
  created_at: string;
}

export interface ProductPrice {
  id: string;
  product_id: string;
  base_price: number;
  sale_price: number | null;
  currency: string;
  effective_date: string;
  end_date: string | null;
  reason: string | null;
  created_at: string;
}

export interface ProductClaim {
  id: string;
  product_id: string;
  claim: string;
  source: string;
  status: ClaimStatus;
  approved_by: string | null;
  approved_at: string | null;
  badge_icon: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  short_description: string | null;
  description: string | null;
  status: ProductStatus;
  featured: boolean;
  currency: string;
  base_price: number;
  sale_price: number | null;
  sale_start: string | null;
  sale_end: string | null;
  availability_status: AvailabilityStatus;
  volume_ml: number;
  hero_media_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image: string | null;
  whatsapp_order_number: string;
  created_at: string;
  updated_at: string;
  // Joined relation fields:
  media?: ProductMedia[];
  claims?: ProductClaim[];
  price_history?: ProductPrice[];
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_media: string | null;
  status: BlogPostStatus;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  related_product_id: string | null;
  cta_text: string;
  created_at: string;
  updated_at: string;
  related_product?: Product;
}

export interface Influencer {
  id: string;
  name: string;
  handle: string;
  platform: string;
  bio: string | null;
  avatar_url: string | null;
  reach_count: number;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  slug: string;
  hero_headline: string;
  hero_subheadline: string | null;
  video_url: string | null;
  influencer_id: string | null;
  product_id: string | null;
  promotion_code: string | null;
  discount_percent: number;
  status: CampaignStatus;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: string;
  influencer?: Influencer;
  product?: Product;
}

export interface SocialContent {
  id: string;
  platform: SocialPlatform;
  post_url: string;
  thumbnail: string;
  caption: string | null;
  creator: string | null;
  campaign_id: string | null;
  product_id: string | null;
  status: 'draft' | 'published';
  published_at: string;
}

export interface Retailer {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string | null;
  whatsapp: string | null;
  latitude: number | null;
  longitude: number | null;
  availability: string;
  status: RetailerStatus;
  created_at: string;
}

export interface AnalyticsEvent {
  id?: string;
  event_name: 
    | 'page_view' 
    | 'product_view' 
    | 'product_video_play' 
    | 'blog_view' 
    | 'social_click' 
    | 'influencer_view' 
    | 'campaign_view' 
    | 'whatsapp_click' 
    | 'retailer_view' 
    | 'order_started' 
    | 'order_completed';
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  content?: string | null;
  landing_page?: string;
  product_id?: string | null;
  metadata?: Record<string, unknown>;
  created_at?: string;
}
