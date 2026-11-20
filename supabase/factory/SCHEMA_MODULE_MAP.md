# CP Splash Sales Machine: Supabase Schema Module Map

This map is based on the CP Splash live Supabase catalog inspected on 20 November 2026. It describes the reusable modules and separates observed CP Splash tables from recommended new-project organization.

## A. Platform and tenant identity

Observed tables:
- `tenants`
- `profiles`
- `roles`
- `tenant_memberships`
- `stores`

Purpose:
- Tenant identity and lifecycle.
- Auth user profile.
- Tenant-specific roles and membership.
- Store/branch identity and sales-channel contact details.

Deterministic rule: the new application creates a new tenant and membership graph. It must not import CP Splash's tenant UUID or reuse its users.

## B. Catalogue and merchandising

Observed tables:
- `product_categories`
- `products`
- `product_variants`
- `product_claims`

Purpose:
- Product identity, slug, SKU, descriptions, publication state and SEO metadata.
- Sellable units and variant attributes such as volume and weight.
- Category hierarchy.
- Evidence-backed product claims.

Product copy and SEO are separate fields. A storefront must not use SEO metadata as customer-facing copy fallback. Claims requiring verification must not be presented as verified before their verification state supports it.

## C. Pricing

Observed tables:
- `price_lists`
- `product_prices`

Purpose:
- Tenant price lists and currency.
- Variant-level prices, validity windows, compare-at amount and change reason.

Deterministic rule: product cards, product details, order snapshots and WhatsApp messages must resolve prices from the active price list and active variant price. Never create a second price source in frontend configuration.

## D. Persistent media and placement

Observed tables:
- `media_assets`
- `product_media`
- `media_placements`

Related contract:
- `products.metadata.media_sequence` contains the six semantic product image roles already used by CP Splash:
  `hero_bottle`, `premium_three_quarter`, `ingredient_explosion`, `lifestyle`, `serving`, `campaign_hero`.

Purpose:
- `media_assets`: tenant-scoped metadata for an object in Supabase Storage.
- `product_media`: product gallery relation, ordering and primary-image state.
- `media_placements`: reusable homepage, funnel and campaign placement slots.

Existing CP Splash Storage buckets observed:
- `cp-public`: public presentation media.
- `cp-private`: private documents/assets.
- `cp-campaigns`: campaign media.
- `cp-ugc`: user-generated content.

A new project chooses its own bucket names, visibility, size limits and MIME allowlist. Do not copy bucket policy blindly.

## E. Sales machine and conversion

Observed tables:
- `sales_territories`
- `sales_offers`
- `sales_journeys`
- `sales_questions`
- `sales_leads`
- `campaigns`
- `analytics_events`

Purpose:
- Territory defines a sales audience or geographic/market boundary.
- Offer defines the offer available in that territory.
- Journey defines the conversion path and destination, including WhatsApp configuration.
- Questions define dynamic lead qualification fields and ordering.
- Leads persist contact details, buyer type, interest, quantity, answers and attribution.
- Campaigns carry landing path and UTM defaults.
- Analytics events connect sessions, products, campaigns, orders and leads.

The five CP Splash funnel paths are:
- `/sports`
- `/parties-events`
- `/hotels-hospitality`
- `/schools`
- `/individuals`

A new app should configure its own audience funnels, offers, questions and journeys. Reuse the conversion engine, not CP Splash's customer-facing copy or IDs.

## F. Commerce transaction

Observed tables:
- `customers`
- `customer_addresses`
- `orders`
- `order_items`
- `payments`

Purpose:
- Customer identity and consent.
- Delivery addresses.
- Order header and immutable line-item snapshots.
- Payment attempts/references/status.

Deterministic rule: order creation must persist the order and all line items atomically or through a tested idempotent workflow. The order line stores product name, SKU, unit-price and quantity snapshots. Payment status must be driven by a verified provider result or a controlled staff verification workflow, not a browser redirect alone.

## G. Inventory, operations and channels

Observed tables:
- `locations`
- `inventory_items`
- `inventory_transactions`
- `inventory_transfers`
- `retailers`
- `influencers`
- `social_content`
- `blog_posts`
- `audit_logs`

Purpose:
- Stock location and inventory movement.
- Transfers between locations.
- Retail/wholesale distribution relationships.
- Influencer and social campaign records.
- Editorial content and auditable staff actions.

These modules are optional for a minimal new store, but must be consciously included or explicitly deferred. Do not create empty tables merely to imitate the shape of CP Splash.

## H. Observed public database functions

The inspected live project exposed:
- `cms_save_product(p_product_id uuid, p_product jsonb, p_variant jsonb, p_price jsonb)`
- `check_media_placement_tenant_consistency()`
- `enforce_tenant_consistency()`
- `update_media_placements_modtime()`

The catalog also showed `has_tenant_role` and `is_tenant_member` in the public namespace as SECURITY DEFINER functions. Current security advisor flags authenticated execution of `public.has_tenant_role`. A new project should place privileged authorization helpers in a non-exposed schema, lock down EXECUTE grants and pin `search_path`. Do not blindly copy the exposed legacy function surface.

## I. RLS contract

Observed CP Splash public catalogue policies are tenant-specific and check active tenant, published product/category, active variant, active price list and active media. Staff write policies use tenant-role authorization.

For a new project:
1. Enable RLS on every tenant-owned table.
2. Require tenant identity on every tenant-owned row.
3. Validate cross-table tenant consistency with composite foreign keys or database constraints/triggers.
4. Separate public read policies from staff write policies.
5. Test anonymous, authenticated member, wrong-tenant member and privileged roles.
6. Keep private Storage buckets private and enforce tenant path authorization.
7. Keep service-role keys server-side only.

## J. Important boundary

The CP Splash live catalog includes more modules than the storefront MVP. This map is an inventory and architecture guide, not a declaration that every table is production-certified for reuse. Each module must pass its own schema, RLS, RPC, integration and runtime tests before the next app depends on it.
