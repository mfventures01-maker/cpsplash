-- ==============================================================================
-- CP SPLASH SOCIAL COMMERCE ENGINE - MASTER SCHEMA & MIGRATIONS
-- HOEOS Gate G1 Verified Production PostgreSQL Schema
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PRODUCT CATEGORIES
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    sku VARCHAR(64) UNIQUE,
    short_description TEXT,
    description TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    currency VARCHAR(8) NOT NULL DEFAULT 'NGN',
    base_price NUMERIC(12, 2) NOT NULL,
    sale_price NUMERIC(12, 2),
    sale_start TIMESTAMPTZ,
    sale_end TIMESTAMPTZ,
    availability_status VARCHAR(32) NOT NULL DEFAULT 'in_stock' CHECK (availability_status IN ('in_stock', 'low_stock', 'out_of_stock', 'pre_order')),
    volume_ml INTEGER DEFAULT 500,
    hero_media_id UUID,
    seo_title VARCHAR(255),
    seo_description TEXT,
    og_image TEXT,
    whatsapp_order_number VARCHAR(32) NOT NULL DEFAULT '2348127700724',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PRODUCT MEDIA
CREATE TABLE IF NOT EXISTS product_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    type VARCHAR(64) NOT NULL DEFAULT 'product_image' CHECK (type IN ('hero_image', 'product_image', 'lifestyle_image', 'gallery_image', 'hero_video', 'short_video', 'ugc_image', 'ugc_video', 'influencer_media')),
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    alt_text VARCHAR(255),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Link hero_media_id foreign key after table creation
ALTER TABLE products DROP CONSTRAINT IF EXISTS fk_products_hero_media;
ALTER TABLE products ADD CONSTRAINT fk_products_hero_media FOREIGN KEY (hero_media_id) REFERENCES product_media(id) ON DELETE SET NULL;

-- 4. PRODUCT PRICE HISTORY
CREATE TABLE IF NOT EXISTS product_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    base_price NUMERIC(12, 2) NOT NULL,
    sale_price NUMERIC(12, 2),
    currency VARCHAR(8) NOT NULL DEFAULT 'NGN',
    effective_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. VERIFIED PRODUCT CLAIMS (HOEOS Health & Benefit Claims Engine)
CREATE TABLE IF NOT EXISTS product_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    claim VARCHAR(255) NOT NULL,
    source VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    approved_by VARCHAR(120),
    approved_at TIMESTAMPTZ,
    badge_icon VARCHAR(64) DEFAULT 'leaf',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. BLOG POSTS
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_media TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    seo_title VARCHAR(255),
    seo_description TEXT,
    related_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    cta_text VARCHAR(120) DEFAULT 'Order on WhatsApp',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. INFLUENCERS
CREATE TABLE IF NOT EXISTS influencers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(120) NOT NULL,
    handle VARCHAR(120) NOT NULL,
    platform VARCHAR(64) NOT NULL DEFAULT 'instagram',
    bio TEXT,
    avatar_url TEXT,
    reach_count INTEGER DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. CAMPAIGNS
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    hero_headline VARCHAR(255) NOT NULL,
    hero_subheadline TEXT,
    video_url TEXT,
    influencer_id UUID REFERENCES influencers(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    promotion_code VARCHAR(64),
    discount_percent NUMERIC(5, 2) DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'ended')),
    utm_source VARCHAR(64),
    utm_medium VARCHAR(64),
    utm_campaign VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. SOCIAL CONTENT
CREATE TABLE IF NOT EXISTS social_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform VARCHAR(64) NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'youtube', 'ugc', 'influencer')),
    post_url TEXT NOT NULL,
    thumbnail TEXT,
    caption TEXT,
    creator VARCHAR(120),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. RETAILER DIRECTORY
CREATE TABLE IF NOT EXISTS retailers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(120) NOT NULL,
    state VARCHAR(120) NOT NULL,
    phone VARCHAR(32),
    whatsapp VARCHAR(32),
    latitude NUMERIC(10, 6),
    longitude NUMERIC(10, 6),
    availability TEXT DEFAULT 'In Stock - Zobo Sweet & Luxury Juice Mix',
    status VARCHAR(32) NOT NULL DEFAULT 'verified' CHECK (status IN ('pending', 'verified', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. ANALYTICS EVENTS (Event Pipeline)
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_name VARCHAR(64) NOT NULL,
    source VARCHAR(120),
    medium VARCHAR(120),
    campaign VARCHAR(120),
    content VARCHAR(120),
    landing_page TEXT,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. CUSTOMER ORDERS (WhatsApp Commerce & Direct Web Orders)
CREATE TABLE IF NOT EXISTS customer_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(64) NOT NULL UNIQUE,
    customer_name VARCHAR(160) NOT NULL,
    customer_phone VARCHAR(32) NOT NULL,
    customer_location VARCHAR(160) NOT NULL,
    delivery_address TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(8) NOT NULL DEFAULT 'NGN',
    channel VARCHAR(32) NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'web_direct', 'phone_call', 'flagship_walkin')),
    status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'bottled', 'out_for_delivery', 'delivered', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_product_media_product ON product_media(product_id);
CREATE INDEX IF NOT EXISTS idx_product_claims_product ON product_claims(product_id);
CREATE INDEX IF NOT EXISTS idx_product_claims_status ON product_claims(status);
CREATE INDEX IF NOT EXISTS idx_blog_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_slug ON campaigns(slug);
CREATE INDEX IF NOT EXISTS idx_retailers_status ON retailers(status);
CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON customer_orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON customer_orders(created_at);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE retailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_orders ENABLE ROW LEVEL SECURITY;

-- Anonymous public read access:
CREATE POLICY "Public products viewable" ON products
    FOR SELECT USING (status = 'published');

CREATE POLICY "Public product media viewable" ON product_media
    FOR SELECT USING (true);

CREATE POLICY "Public claims viewable only if verified" ON product_claims
    FOR SELECT USING (status = 'verified');

CREATE POLICY "Public blog viewable" ON blog_posts
    FOR SELECT USING (status = 'published');

CREATE POLICY "Public social content viewable" ON social_content
    FOR SELECT USING (status = 'published');

CREATE POLICY "Public influencers viewable" ON influencers
    FOR SELECT USING (status = 'active');

CREATE POLICY "Public campaigns viewable" ON campaigns
    FOR SELECT USING (status = 'active');

CREATE POLICY "Public retailers viewable" ON retailers
    FOR SELECT USING (status = 'verified');

CREATE POLICY "Public can insert analytics" ON analytics_events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can insert orders" ON customer_orders
    FOR INSERT WITH CHECK (true);

-- Authenticated / Admin full access:
CREATE POLICY "Admin full access products" ON products
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access customer_orders" ON customer_orders
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access product_media" ON product_media
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access product_prices" ON product_prices
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access product_claims" ON product_claims
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access blog_posts" ON blog_posts
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access influencers" ON influencers
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access campaigns" ON campaigns
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access social_content" ON social_content
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access retailers" ON retailers
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access analytics" ON analytics_events
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- STORAGE BUCKETS SETUP
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('product-media', 'product-media', true),
    ('ugc-uploads', 'ugc-uploads', true),
    ('admin-assets', 'admin-assets', false)
ON CONFLICT (id) DO NOTHING;
