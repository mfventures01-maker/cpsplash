# HOEOS Law 13: Reusable Ecommerce Factory Contract

**Law 13: Every Project Must Strengthen the Factory.**

Every completed project must leave reusable engineering assets, knowledge, controls, templates, evidence and patterns. The next application must start from a stronger foundation rather than rebuild the same machinery.

## 1. Purpose

This contract extracts the reusable ecommerce foundation implemented and verified in CP Splash. It is a product-agnostic starting point for another application using the shared ecommerce schema. It is not permission to copy CP Splash tenant data, branding, credentials, product records or deployment configuration.

## 2. Canonical data model

| Capability | Canonical entity | Responsibility |
|---|---|---|
| Tenant boundary | tenants | Tenant identity, currency, locale and settings |
| Product identity | products | Name, slug, SKU, brand, descriptions, publication state and SEO metadata |
| Classification | product_categories | Tenant-scoped category hierarchy |
| Sellable unit | product_variants | Volume, weight, SKU and variant state |
| Pricing | price_lists, product_prices | Currency, price type, active price and price history |
| Uploaded file | media_assets | Storage bucket/path, MIME, dimensions, alt text and lifecycle |
| Product gallery | product_media | Product-to-asset relation, primary flag and order |
| Editorial/funnel placement | media_placements | Tenant-scoped reusable placement for homepage, funnels and campaigns |
| Product claims | product_claims | Claim text, evidence source and verification state |
| Conversion attribution | campaigns, analytics_events | Campaign and funnel attribution |

Do not create duplicate product-media or price tables in a new app. Extend the canonical model only when a documented domain requirement cannot be represented safely.

## 3. Product media contract

A product has one primary image through product_media.is_primary. The six semantic media roles are stored in products.metadata.media_sequence:

1. hero_bottle
2. premium_three_quarter
3. ingredient_explosion
4. lifestyle
5. serving
6. campaign_hero

Each sequence entry references a media_assets.id. A role assignment is valid only when the asset is already attached to that product. The primary product-media association remains authoritative for the default card and product hero image.

Accepted media formats in the CP Splash implementation: JPEG, PNG, WebP, GIF, MP4 and WebM. Current CMS limits: images up to 10 MB and video up to 30 MB. New apps must adopt limits appropriate to their own storage policy rather than silently assuming these limits are universal.

## 4. Funnel placement contract

Use the existing media_placements table for audience-specific creative. Canonical scope types:

- homepage_hero
- homepage_carousel
- funnel_hero
- funnel_card
- campaign
- sales_journey

Use a stable placement_key, not a timestamp-generated key, for a logical slot. Recommended keys:

- homepage.hero.primary
- funnel.sports.hero
- funnel.sports.card.primary
- funnel.parties-events.hero
- funnel.hotels-hospitality.hero
- funnel.schools.hero
- funnel.individuals.hero

The scope_id identifies the funnel slug for funnel placements. A media asset can be reused across placements without duplicating its Storage object or media_assets row.

The database enforces at most one active row for a tenant + scope type + scope id + placement key. Inactive historical placements remain available for audit and reactivation.

## 5. Customer presentation contract

### Funnel pages
1. Audience-specific hero creative
2. Audience-specific headline and value proposition
3. Primary qualification or enquiry CTA
4. Shared published product catalogue
5. Trust, supply and delivery information

### Ecommerce product page
1. Primary product image and ordered gallery
2. Product name and short description
3. Active variant and authoritative active price
4. Rich product story
5. Verified claims only
6. Related products
7. WhatsApp/order action

### Homepage
1. Featured published products
2. Short product subtitle sourced from short_description
3. Plain-text description excerpt, never raw Markdown
4. Primary product image or approved homepage placement
5. Active price and product-specific CTA

SEO title and SEO description are metadata only. They must never be used as customer-facing copy fallbacks.

## 6. Content rendering security

Product descriptions support headings, paragraphs, unordered and ordered lists, bold, italic, inline code, blockquotes and safe HTTP(S) links. Raw HTML is not interpreted. Plain-text legacy descriptions remain readable. Rendering must not use unsafe HTML injection.

## 7. Security and tenant isolation

- Every product, media asset and placement is tenant-scoped.
- Public catalogue reads expose published products and approved active media only.
- CMS writes require authenticated tenant roles and RLS.
- Storage objects are not public merely because a media row exists.
- Never expose service-role credentials in browser code.
- Reusing a schema does not mean reusing another tenant's records or IDs.
- New application bootstrap must create its own tenant and role assignments through an approved onboarding process.

## 8. Required implementation layers

UI -> domain service -> Supabase client/Data API -> canonical ecommerce schema -> Storage.

UI components must not issue ad hoc mutations that bypass the domain service. Product save, media upload, media association, publication and placement operations must each return persisted read-back evidence before the UI reports success.

## 9. New application factory inputs

A new application must supply only its configuration and domain extensions:

- tenant bootstrap and membership
- brand identity and design tokens
- product categories and product-specific attributes
- currency, locale and tax/shipping policy
- audience funnels and placement keys
- approved media roles and upload limits
- conversion channels and analytics events
- required regulatory/claims workflow

The canonical product, variant, price, media and placement contracts remain stable unless an approved versioned schema change is recorded.

## 10. Law 13 deliverables

Every app completed from this foundation must return reusable assets to the factory:

- schema contract and versioned migrations
- typed domain contracts
- reusable product/media/funnel UI components
- safe content-rendering primitives
- security/RLS patterns
- deterministic tests and fixtures
- deployment and rollback playbook
- evidence and certification report

## 11. HOEOS Law 13 certification gate

Certification is not a declaration. The evidence chain must connect requirement -> implementation -> test -> Supabase read-back -> deployed runtime. Evidence classes must remain distinct:

- A STATIC: source and configuration inspection
- B STRUCTURAL: schema, migration, policy and type inspection
- C RUNTIME: executed behavior against the intended runtime
- D CERTIFICATION: complete reproducible evidence chain

STATIC or STRUCTURAL evidence must never be promoted to RUNTIME or CERTIFICATION without execution evidence.

**Factory outcome:** CP Splash must leave the next ecommerce application faster to build, safer to operate and easier to certify.
