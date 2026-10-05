/**
 * LEGACY TEST FIXTURE ONLY - ISOLATED FROM PRODUCTION RUNTIME
 * Governed under HOEOS Phase G4
 */
export const INITIAL_PRODUCTS: Record<string, unknown>[] = [
  {
    id: 'prod-001-zobo-sweet',
    name: 'CP Fruit Splash Zobo Sweet',
    slug: 'zobo-sweet',
    sku: 'CP-FS-ZS-500',
    short_description: 'Taste Nature. Feel Refreshed. A refreshing blend of natural zobo (hibiscus) packed with antioxidants, essential nutrients, and natural sweetness.',
    description: 'CP Fruit Splash Zobo Sweet is an artisanal hibiscus beverage crafted from premium sun-ripened Nigerian hibiscus calyces. Carefully steeped and naturally infused to preserve vital polyphenols and rich ruby color without any artificial coloring, artificial preservatives, or chemical additives. Every sip delivers a crisp, refreshing, tart-sweet sensation that revitalizes body and spirit.',
    status: 'published',
    featured: true,
    currency: 'NGN',
    base_price: 1200,
    sale_price: 1000,
    sale_start: '2026-01-01T00:00:00Z',
    sale_end: '2026-12-31T23:59:59Z',
    availability_status: 'in_stock',
    volume_ml: 500,
    hero_media_id: 'med-001',
    seo_title: 'CP Fruit Splash Zobo Sweet | Premium Natural Hibiscus Beverage',
    seo_description: 'Discover CP Fruit Splash Zobo Sweet. 100% fresh, natural hibiscus drink with zero artificial preservatives. Goodness in Every Sip. Order directly on WhatsApp.',
    og_image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1200&q=80',
    whatsapp_order_number: '2348127700724',
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-09-29T12:00:00Z',
  },
  {
    id: 'prod-002-luxury-juice-mix',
    name: 'CP Fruit Splash Luxury Juice Mix',
    slug: 'luxury-juice-mix',
    sku: 'CP-FS-LJM-500',
    short_description: 'Goodness in Every Sip! Premium blend of Pomegranate, Crisp Apple, Ripe Strawberry, and Wild Blueberry with Extra Vitamin C.',
    description: 'Experience the pinnacle of natural indulgence with CP Fruit Splash Luxury Juice Mix. We harmoniously cold-blend sweet pomegranate arils, fresh orchard apples, juicy mountain strawberries, and antioxidant-dense blueberries. Fortified with natural Vitamin C, it delivers pure fruit nourishment in every glass.',
    status: 'published',
    featured: true,
    currency: 'NGN',
    base_price: 1800,
    sale_price: 1500,
    sale_start: '2026-01-01T00:00:00Z',
    sale_end: '2026-12-31T23:59:59Z',
    availability_status: 'in_stock',
    volume_ml: 500,
    hero_media_id: 'med-005',
    seo_title: 'CP Fruit Splash Luxury Juice Mix | Pomegranate, Apple, Berry Blend',
    seo_description: 'Taste the luxury fruit fusion of CP Fruit Splash. Pomegranate, Apple, Strawberry, Blueberry + Extra Vitamin C. Order fresh on WhatsApp.',
    og_image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=1200&q=80',
    whatsapp_order_number: '2348127700724',
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-09-29T12:00:00Z',
  },
  {
    id: 'prod-003-hibiscus-ginger-glow',
    name: 'CP Fruit Splash Hibiscus & Ginger Glow',
    slug: 'hibiscus-ginger-glow',
    sku: 'CP-FS-HGG-500',
    short_description: 'A warm invigorating blend of organic hibiscus infused with spicy crushed ginger and aromatic cloves.',
    description: 'When you crave soothing warmth with deep botanical refreshment, CP Fruit Splash Hibiscus & Ginger Glow provides an authentic Nigerian spiced zobo infusion. Crafted with real sun-dried ginger root, organic cloves, and natural sweetness.',
    status: 'published',
    featured: false,
    currency: 'NGN',
    base_price: 1400,
    sale_price: 1200,
    sale_start: null,
    sale_end: null,
    availability_status: 'in_stock',
    volume_ml: 500,
    hero_media_id: 'med-009',
    seo_title: 'CP Fruit Splash Hibiscus & Ginger Glow | Spiced Botanical Drink',
    seo_description: 'Energizing Nigerian ginger zobo drink with natural spices and pure botanicals. Order directly from CP Fruit Splash Sapele.',
    og_image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=1200&q=80',
    whatsapp_order_number: '2348127700724',
    created_at: '2026-04-10T11:00:00Z',
    updated_at: '2026-09-29T12:00:00Z',
  }
];

export const INITIAL_PRODUCT_MEDIA: Record<string, unknown>[] = [
  // Zobo Sweet Media
  {
    id: 'med-001',
    product_id: 'prod-001-zobo-sweet',
    type: 'hero_image',
    url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1200&q=80',
    thumbnail_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=400&q=80',
    alt_text: 'CP Fruit Splash Zobo Sweet bottle with fresh hibiscus flowers and ice',
    sort_order: 1,
    is_primary: true,
    metadata: { aspect_ratio: '1:1', format: 'image/jpeg' },
    created_at: '2026-03-01T10:00:00Z'
  },
  {
    id: 'med-002',
    product_id: 'prod-001-zobo-sweet',
    type: 'lifestyle_image',
    url: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=1200&q=80',
    thumbnail_url: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=400&q=80',
    alt_text: 'Kapeni model holding CP Fruit Splash Zobo Sweet bottle with vibrant smile',
    sort_order: 2,
    is_primary: false,
    metadata: { aspect_ratio: '16:9', format: 'image/jpeg' },
    created_at: '2026-03-01T10:00:00Z'
  },
  {
    id: 'med-003',
    product_id: 'prod-001-zobo-sweet',
    type: 'short_video',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-pouring-red-fruit-juice-into-a-glass-with-ice-42999-large.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=400&q=80',
    alt_text: 'Pouring ice-cold ruby red Zobo Sweet into a crystal glass with mint',
    sort_order: 3,
    is_primary: false,
    metadata: { duration_seconds: 8, aspect_ratio: '9:16', format: 'video/mp4' },
    created_at: '2026-03-01T10:00:00Z'
  },
  {
    id: 'med-004',
    product_id: 'prod-001-zobo-sweet',
    type: 'gallery_image',
    url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1000&q=80',
    thumbnail_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=300&q=80',
    alt_text: 'Fresh organic Nigerian hibiscus calyces and dried zobo petals',
    sort_order: 4,
    is_primary: false,
    metadata: { aspect_ratio: '1:1' },
    created_at: '2026-03-01T10:00:00Z'
  },

  // Luxury Juice Mix Media
  {
    id: 'med-005',
    product_id: 'prod-002-luxury-juice-mix',
    type: 'hero_image',
    url: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=1200&q=80',
    thumbnail_url: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=400&q=80',
    alt_text: 'CP Fruit Splash Luxury Juice Mix bottle surrounded by pomegranate, apple, strawberry, and blueberry',
    sort_order: 1,
    is_primary: true,
    metadata: { aspect_ratio: '1:1', format: 'image/jpeg' },
    created_at: '2026-03-01T10:00:00Z'
  },
  {
    id: 'med-006',
    product_id: 'prod-002-luxury-juice-mix',
    type: 'lifestyle_image',
    url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80',
    thumbnail_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80',
    alt_text: 'Fitness active cyclist smiling with CP Splash luxury berry juice',
    sort_order: 2,
    is_primary: false,
    metadata: { aspect_ratio: '16:9' },
    created_at: '2026-03-01T10:00:00Z'
  },
  {
    id: 'med-007',
    product_id: 'prod-002-luxury-juice-mix',
    type: 'short_video',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-blending-a-healthy-fruit-smoothie-with-berries-and-apple-42998-large.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=400&q=80',
    alt_text: 'Fresh fruit blend splashing into luxury juice bottle',
    sort_order: 3,
    is_primary: false,
    metadata: { duration_seconds: 7, aspect_ratio: '9:16', format: 'video/mp4' },
    created_at: '2026-03-01T10:00:00Z'
  },
  {
    id: 'med-008',
    product_id: 'prod-002-luxury-juice-mix',
    type: 'gallery_image',
    url: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=1000&q=80',
    thumbnail_url: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=300&q=80',
    alt_text: 'Freshly cut pomegranates, ripe strawberries and blueberries with water droplets',
    sort_order: 4,
    is_primary: false,
    metadata: { aspect_ratio: '1:1' },
    created_at: '2026-03-01T10:00:00Z'
  },

  // Ginger Glow Media
  {
    id: 'med-009',
    product_id: 'prod-003-hibiscus-ginger-glow',
    type: 'hero_image',
    url: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=1200&q=80',
    thumbnail_url: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=400&q=80',
    alt_text: 'CP Fruit Splash Hibiscus & Ginger Glow with fresh ginger roots and spice',
    sort_order: 1,
    is_primary: true,
    metadata: { aspect_ratio: '1:1' },
    created_at: '2026-04-10T11:00:00Z'
  }
];

export const INITIAL_PRODUCT_CLAIMS: Record<string, unknown>[] = [
  // Zobo Sweet Verified Claims (Direct from Artwork)
  {
    id: 'clm-001',
    product_id: 'prod-001-zobo-sweet',
    claim: '100% Fresh & Natural',
    source: 'Batch verification & ingredient inspection, CP Quality Assurance',
    status: 'verified',
    approved_by: 'CP Quality Assurance Lead (Sapele Facility)',
    approved_at: '2026-03-01T12:00:00Z',
    badge_icon: 'leaf',
    created_at: '2026-03-01T12:00:00Z'
  },
  {
    id: 'clm-002',
    product_id: 'prod-001-zobo-sweet',
    claim: 'Rich in Antioxidants',
    source: 'Natural Hibiscus Sabdariffa anthocyanin polyphenol profile',
    status: 'verified',
    approved_by: 'Food Science Nutrition Reviewer',
    approved_at: '2026-03-01T12:00:00Z',
    badge_icon: 'shield',
    created_at: '2026-03-01T12:00:00Z'
  },
  {
    id: 'clm-003',
    product_id: 'prod-001-zobo-sweet',
    claim: 'No Artificial Colours or Preservatives',
    source: 'Certified cold-pasteurized natural beverage protocol',
    status: 'verified',
    approved_by: 'Chief Product Officer',
    approved_at: '2026-03-01T12:00:00Z',
    badge_icon: 'sparkles',
    created_at: '2026-03-01T12:00:00Z'
  },
  {
    id: 'clm-004',
    product_id: 'prod-001-zobo-sweet',
    claim: 'Essential Nutrients & Pure Plant Sweetness',
    source: 'Botanical analysis of hibiscus infusion with natural cane sweetness',
    status: 'verified',
    approved_by: 'Chief Product Officer',
    approved_at: '2026-03-01T12:00:00Z',
    badge_icon: 'heart',
    created_at: '2026-03-01T12:00:00Z'
  },

  // Luxury Juice Mix Verified Claims
  {
    id: 'clm-005',
    product_id: 'prod-002-luxury-juice-mix',
    claim: '100% Natural Whole Fruit Blend',
    source: 'Pure pressed pomegranate, apple, strawberry, and blueberry formulation',
    status: 'verified',
    approved_by: 'CP Quality Assurance Lead (Sapele Facility)',
    approved_at: '2026-03-01T12:00:00Z',
    badge_icon: 'leaf',
    created_at: '2026-03-01T12:00:00Z'
  },
  {
    id: 'clm-006',
    product_id: 'prod-002-luxury-juice-mix',
    claim: 'Rich in Antioxidants',
    source: 'Superfruit polyphenols from pomegranate arils and wild blueberries',
    status: 'verified',
    approved_by: 'Food Science Nutrition Reviewer',
    approved_at: '2026-03-01T12:00:00Z',
    badge_icon: 'shield',
    created_at: '2026-03-01T12:00:00Z'
  },
  {
    id: 'clm-007',
    product_id: 'prod-002-luxury-juice-mix',
    claim: 'Extra Vitamin C',
    source: 'Fortified with natural berry and citrus ascorbic acid',
    status: 'verified',
    approved_by: 'Food Science Nutrition Reviewer',
    approved_at: '2026-03-01T12:00:00Z',
    badge_icon: 'zap',
    created_at: '2026-03-01T12:00:00Z'
  },
  {
    id: 'clm-008',
    product_id: 'prod-002-luxury-juice-mix',
    claim: 'No Artificial Colours or Preservatives',
    source: 'Certified natural extraction without synthetic stabilizers',
    status: 'verified',
    approved_by: 'Chief Product Officer',
    approved_at: '2026-03-01T12:00:00Z',
    badge_icon: 'sparkles',
    created_at: '2026-03-01T12:00:00Z'
  }
];

export const INITIAL_PRODUCT_PRICES: Record<string, unknown>[] = [
  {
    id: 'prc-001',
    product_id: 'prod-001-zobo-sweet',
    base_price: 1200,
    sale_price: 1000,
    currency: 'NGN',
    effective_date: '2026-01-01T00:00:00Z',
    end_date: null,
    reason: 'Initial retail launch promotion',
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'prc-002',
    product_id: 'prod-002-luxury-juice-mix',
    base_price: 1800,
    sale_price: 1500,
    currency: 'NGN',
    effective_date: '2026-01-01T00:00:00Z',
    end_date: null,
    reason: 'Luxury blend launch special',
    created_at: '2026-01-01T00:00:00Z'
  }
];

export const INITIAL_BLOG_POSTS: Record<string, unknown>[] = [
  {
    id: 'blog-001',
    title: 'Taste Nature, Feel Refreshed: Why Real Hibiscus (Zobo) Is the King of Natural Refreshment',
    slug: 'why-real-hibiscus-zobo-is-the-king-of-natural-refreshment',
    excerpt: 'Deep ruby hues, crisp natural tartness, and ancient wellness benefits. Here is why CP Fruit Splash Zobo Sweet is revolutionizing natural beverages in Delta State and beyond.',
    content: `For generations across West Africa, Zobo (Hibiscus sabdariffa) has been celebrated for its intoxicating crimson beauty and deeply invigorating flavor. But not all zobo is created equal.

At CP Fruit Splash, located opposite Ajimele Junction in Sapele, Delta State, we set out with a simple mission: honor this cherished beverage with uncompromising purity.

### What Makes CP Fruit Splash Zobo Sweet Special?
1. **100% Whole Hibiscus Calyces**: We never use artificial syrups or synthetic colorants. The hypnotic red color comes purely from natural anthocyanins in real hibiscus flowers.
2. **Cold-Crafted Infusion**: By carefully calibrating steeping temperatures, we protect the delicate polyphenols and antioxidants.
3. **No Artificial Preservatives**: Freshness is our sacred promise. Every bottle is sealed fresh for immediate enjoyment.

Whether enjoying a cold bottle on a sunny afternoon in Sapele or pairing it with your favorite meal, discover why locals call it 'Goodness in Every Sip'.`,
    featured_media: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
    published_at: '2026-08-15T09:00:00Z',
    seo_title: 'Why Real Hibiscus (Zobo) Is the King of Natural Refreshment | CP Splash',
    seo_description: 'Read the full story behind CP Fruit Splash Zobo Sweet. 100% natural, fresh hibiscus drink in Sapele, Delta State.',
    related_product_id: 'prod-001-zobo-sweet',
    cta_text: 'Order Zobo Sweet on WhatsApp',
    created_at: '2026-08-15T09:00:00Z',
    updated_at: '2026-09-20T10:00:00Z'
  },
  {
    id: 'blog-002',
    title: 'The Superfruits Behind Our Luxury Juice Mix: Pomegranate, Apple, Strawberry & Blueberry',
    slug: 'superfruits-behind-luxury-juice-mix',
    excerpt: 'Explore the scientific and sensory balance of four legendary superfruits cold-blended into CP Splash Luxury Juice Mix + Extra Vitamin C.',
    content: `When we formulated the CP Fruit Splash Luxury Juice Mix, we wanted a beverage that offered both decadent flavor and rich nutritional value.

We combined four extraordinary superfruits:
- **Pomegranate**: Known as the jewel of fruits, bursting with punicalagins and bright tart notes.
- **Crisp Orchard Apple**: Provides smooth natural sweetness and dietary balance.
- **Ripe Strawberries**: Infuses summer fragrance and vibrant crimson sweetness.
- **Wild Blueberries**: One of the highest antioxidant-bearing berries on the planet.

Each 500mL bottle is fortified with Extra Vitamin C to support your daily vitality. No chemical additives, no artificial colorings—pure whole fruit luxury.`,
    featured_media: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
    published_at: '2026-09-01T09:00:00Z',
    seo_title: 'Superfruits Behind CP Splash Luxury Juice Mix | Pomegranate, Berry, Apple',
    seo_description: 'Discover the cold-blended fruit science behind CP Fruit Splash Luxury Juice Mix + Extra Vitamin C.',
    related_product_id: 'prod-002-luxury-juice-mix',
    cta_text: 'Discover Luxury Juice Mix',
    created_at: '2026-09-01T09:00:00Z',
    updated_at: '2026-09-20T10:00:00Z'
  }
];

export const INITIAL_INFLUENCERS: Record<string, unknown>[] = [
  {
    id: 'inf-001',
    name: 'Kapeni Joy',
    handle: '@kapeni_official',
    platform: 'instagram',
    bio: 'Lifestyle & wellness creator in Delta State. Passionate about authentic African botanical drinks.',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    reach_count: 85000,
    status: 'active',
    created_at: '2026-02-10T10:00:00Z'
  },
  {
    id: 'inf-002',
    name: 'Tega Fitness Sapele',
    handle: '@tega_wellness',
    platform: 'tiktok',
    bio: 'Endurance cyclist and fitness coach inspiring healthy active living across the Niger Delta.',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    reach_count: 142000,
    status: 'active',
    created_at: '2026-03-05T11:00:00Z'
  }
];

export const INITIAL_CAMPAIGNS: Record<string, unknown>[] = [
  {
    id: 'cmp-001-taste-nature',
    name: 'Taste Nature, Feel Refreshed',
    slug: 'taste-nature-zobo',
    hero_headline: 'Taste Nature. Feel Refreshed.',
    hero_subheadline: 'Fresh. Natural. Refreshing Zobo Sweet directly from Sapele to your doorstep.',
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-pouring-red-fruit-juice-into-a-glass-with-ice-42999-large.mp4',
    influencer_id: 'inf-001',
    product_id: 'prod-001-zobo-sweet',
    promotion_code: 'REFRESH20',
    discount_percent: 15,
    status: 'active',
    utm_source: 'social',
    utm_medium: 'influencer_kapeni',
    utm_campaign: 'taste_nature',
    created_at: '2026-03-10T10:00:00Z'
  },
  {
    id: 'cmp-002-blend-your-way',
    name: 'Blend Your Way to a Healthier You',
    slug: 'blend-your-way',
    hero_headline: 'Blend Your Way to a Healthier You!',
    hero_subheadline: 'Pomegranate • Apple • Strawberry • Blueberry + Extra Vitamin C. Goodness in Every Sip!',
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-blending-a-healthy-fruit-smoothie-with-berries-and-apple-42998-large.mp4',
    influencer_id: 'inf-002',
    product_id: 'prod-002-luxury-juice-mix',
    promotion_code: 'HEALTHYMIX',
    discount_percent: 10,
    status: 'active',
    utm_source: 'tiktok',
    utm_medium: 'cyclist_tega',
    utm_campaign: 'blend_healthier',
    created_at: '2026-03-15T12:00:00Z'
  }
];

export const INITIAL_SOCIAL_CONTENT: Record<string, unknown>[] = [
  {
    id: 'soc-001',
    platform: 'instagram',
    post_url: 'https://instagram.com/p/cpfruitsplash_zobo',
    thumbnail: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80',
    caption: 'Nothing hits better after a long afternoon in Sapele than an ice-cold bottle of CP Splash Zobo Sweet! 🌺 100% natural, no fake syrups. #TasteNature #CPSplash',
    creator: '@kapeni_official',
    campaign_id: 'cmp-001-taste-nature',
    product_id: 'prod-001-zobo-sweet',
    status: 'published',
    published_at: '2026-09-15T14:00:00Z'
  },
  {
    id: 'soc-002',
    platform: 'tiktok',
    post_url: 'https://tiktok.com/@tega_wellness/video/cp_luxury_mix',
    thumbnail: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=600&q=80',
    caption: 'Post-workout hydration with CP Fruit Splash Luxury Juice Mix! Pomegranate + Strawberry + Blueberry + Extra Vitamin C 💪 #HealthyLiving #SapeleFit',
    creator: '@tega_wellness',
    campaign_id: 'cmp-002-blend-your-way',
    product_id: 'prod-002-luxury-juice-mix',
    status: 'published',
    published_at: '2026-09-20T16:30:00Z'
  },
  {
    id: 'soc-003',
    platform: 'ugc',
    post_url: 'https://twitter.com/delta_foodie/status/12345',
    thumbnail: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
    caption: 'Found CP Fruit Splash opposite Ajimele Junction! Stocked my fridge with 10 bottles of Zobo Sweet. Family approved! 🍷🔥',
    creator: 'Chioma E., Sapele Resident',
    campaign_id: 'cmp-001-taste-nature',
    product_id: 'prod-001-zobo-sweet',
    status: 'published',
    published_at: '2026-09-22T11:15:00Z'
  }
];

export const INITIAL_RETAILERS: Record<string, unknown>[] = [
  {
    id: 'ret-001',
    name: 'CP Fruit Splash Flagship Hub',
    address: 'Opposite Ajimele Junction, Ajogodo',
    city: 'Sapele',
    state: 'Delta State',
    phone: '08127700724',
    whatsapp: '2348127700724',
    latitude: 5.8941,
    longitude: 5.6767,
    availability: 'Full Stock: Zobo Sweet (500ml), Luxury Juice Mix (500ml), Ginger Glow',
    status: 'verified',
    created_at: '2026-01-01T08:00:00Z'
  },
  {
    id: 'ret-002',
    name: 'Ajogodo Fresh Supermarket',
    address: '14 Ajogodo Road, Near Central Hospital',
    city: 'Sapele',
    state: 'Delta State',
    phone: '08033001122',
    whatsapp: '2348033001122',
    latitude: 5.8912,
    longitude: 5.6791,
    availability: 'In Stock - Zobo Sweet & Luxury Juice Mix',
    status: 'verified',
    created_at: '2026-02-15T09:00:00Z'
  },
  {
    id: 'ret-003',
    name: 'Delta Mart Warri Express',
    address: 'Effurun Roundabout, Airport Road',
    city: 'Warri',
    state: 'Delta State',
    phone: '08022114455',
    whatsapp: '2348022114455',
    latitude: 5.5442,
    longitude: 5.7603,
    availability: 'In Stock - Zobo Sweet, Luxury Juice Mix',
    status: 'verified',
    created_at: '2026-03-01T10:00:00Z'
  },
  {
    id: 'ret-004',
    name: 'Benin Royal Gourmet Mart',
    address: '28 Airport Road, GRA',
    city: 'Benin City',
    state: 'Edo State',
    phone: '08055667788',
    whatsapp: '2348055667788',
    latitude: 6.3350,
    longitude: 5.6037,
    availability: 'In Stock - Luxury Juice Mix & Zobo Sweet',
    status: 'verified',
    created_at: '2026-04-12T11:00:00Z'
  }
];

export const INITIAL_CUSTOMER_ORDERS: Record<string, unknown>[] = [
  {
    id: 'ord-001',
    order_number: 'CPS-2026-0901',
    customer_name: 'Blessing Okonkwo',
    customer_phone: '08134567890',
    customer_location: 'Sapele, Delta State',
    delivery_address: 'Close to Ajimele Junction, Ajogodo Road',
    items: [
      {
        product_id: 'prod-001-zobo-sweet',
        product_name: 'CP Fruit Splash Zobo Sweet',
        quantity: 4,
        unit_price: 1000,
        volume_ml: 500,
        subtotal: 4000
      },
      {
        product_id: 'prod-002-luxury-juice-mix',
        product_name: 'CP Fruit Splash Luxury Juice Mix',
        quantity: 2,
        unit_price: 1500,
        volume_ml: 500,
        subtotal: 3000
      }
    ],
    total_amount: 7000,
    currency: 'NGN',
    channel: 'whatsapp',
    status: 'delivered',
    notes: 'Ice-chilled delivery for family lunch',
    created_at: '2026-09-28T11:20:00Z',
    updated_at: '2026-09-28T12:45:00Z'
  },
  {
    id: 'ord-002',
    order_number: 'CPS-2026-0902',
    customer_name: 'Engr. Daniel Efe',
    customer_phone: '08023456789',
    customer_location: 'Warri / Effurun, Delta State',
    delivery_address: 'Shell RA Estate, Warri',
    items: [
      {
        product_id: 'prod-002-luxury-juice-mix',
        product_name: 'CP Fruit Splash Luxury Juice Mix',
        quantity: 6,
        unit_price: 1500,
        volume_ml: 500,
        subtotal: 9000
      }
    ],
    total_amount: 9000,
    currency: 'NGN',
    channel: 'whatsapp',
    status: 'out_for_delivery',
    notes: 'Please dispatch with cooler packs',
    created_at: '2026-09-29T08:15:00Z',
    updated_at: '2026-09-29T09:30:00Z'
  },
  {
    id: 'ord-003',
    order_number: 'CPS-2026-0903',
    customer_name: 'Chioma Adeyemi',
    customer_phone: '08167890123',
    customer_location: 'Sapele, Delta State',
    delivery_address: '18 Boyo Road, Sapele Central',
    items: [
      {
        product_id: 'prod-001-zobo-sweet',
        product_name: 'CP Fruit Splash Zobo Sweet',
        quantity: 3,
        unit_price: 1000,
        volume_ml: 500,
        subtotal: 3000
      }
    ],
    total_amount: 3000,
    currency: 'NGN',
    channel: 'whatsapp',
    status: 'confirmed',
    notes: 'Requested pickup at Sapele Flagship Hub',
    created_at: '2026-09-29T10:45:00Z',
    updated_at: '2026-09-29T11:00:00Z'
  },
  {
    id: 'ord-004',
    order_number: 'CPS-2026-0904',
    customer_name: 'Osasere Igbinedion',
    customer_phone: '07034561234',
    customer_location: 'Benin City, Edo State',
    delivery_address: 'Airport Road, GRA, Benin City',
    items: [
      {
        product_id: 'prod-001-zobo-sweet',
        product_name: 'CP Fruit Splash Zobo Sweet',
        quantity: 10,
        unit_price: 1000,
        volume_ml: 500,
        subtotal: 10000
      },
      {
        product_id: 'prod-002-luxury-juice-mix',
        product_name: 'CP Fruit Splash Luxury Juice Mix',
        quantity: 5,
        unit_price: 1500,
        volume_ml: 500,
        subtotal: 7500
      }
    ],
    total_amount: 17500,
    currency: 'NGN',
    channel: 'whatsapp',
    status: 'pending',
    notes: 'Wholesale retail stock for Benin store',
    created_at: '2026-09-29T13:30:00Z',
    updated_at: '2026-09-29T13:30:00Z'
  }
];
