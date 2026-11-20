# Deterministic Build Sequence: CP Splash Sales Machine

Build one vertical slice at a time. Do not build all screens first and wire the database later.

## Phase 0: Freeze project identity
- Create isolated Supabase and hosting projects.
- Define tenant slug, currency, country, timezone, brand, domain and sales channels.
- Record the exact project reference in the private runbook.
- Confirm no CP Splash production credentials or tenant IDs are present.

Gate: connection smoke and target-project identity checks pass.

## Phase 1: Platform and tenant
- Auth profiles, roles, tenant membership and tenant resolution.
- Private authorization helper schema and least-privilege grants.
- RLS baseline and cross-tenant denial tests.

Gate: owner can access own tenant; anonymous and wrong-tenant users cannot access staff data.

## Phase 2: Product catalogue
- Categories, products, variants and product claims.
- CMS product save operation with server/database validation.
- Published catalogue read model.

Gate: product, variant and category read-back match persisted values; draft products remain private.

## Phase 3: Pricing
- Price lists, currency and variant prices.
- Price validity windows and active-price resolver.
- Price history/change reason.

Gate: one authoritative active price is resolved for each sellable variant; invalid or expired prices are excluded.

## Phase 4: Media persistence
- Storage buckets and object path policies.
- media_assets metadata and product_media associations.
- Primary image and ordered gallery operation.
- Semantic media sequence stored on product metadata.
- Media placements with stable slot keys and one active asset per slot.

Gate: upload -> Storage read-back -> metadata insert -> relation insert -> page reload -> same asset resolves. Failure paths preserve or compensate safely.

## Phase 5: Storefront sales presentation
- Homepage and product cards.
- Product detail page with gallery, variant, active price and rich content.
- Search/category pages if required.
- CTA and WhatsApp handoff.

Gate: displayed product and price values match Supabase read-back; links contain the correct product, variant, quantity and amount.

## Phase 6: Audience sales funnels
- Configure territories/audiences.
- Configure offers.
- Configure journey and destination.
- Configure qualification questions.
- Configure funnel hero/card placements.
- Capture source, medium, campaign and content attribution.

Gate: every funnel route loads its own content and CTA; lead is persisted with the expected journey, territory, offer and attribution.

## Phase 7: Customer and order transaction
- Customer identity and address.
- Order header and immutable order-item snapshots.
- Idempotency key and duplicate submission protection.
- Order totals calculated by trusted server/database logic.

Gate: repeated submission with same idempotency key does not create duplicate orders; persisted totals reconcile with line items.

## Phase 8: Payments
- Payment intent/reference creation.
- Verified provider webhook or audited manual verification.
- Payment history and status transitions.
- Replay protection and signature verification.

Gate: client redirect alone cannot mark an order paid; duplicate webhook replay is idempotent.

## Phase 9: Inventory and operations
- Locations, inventory items, transactions and transfers.
- Stock reservation/decrement policy linked to order lifecycle.
- Staff roles and audit trail.

Gate: no negative stock unless explicit business policy allows it; all movements are traceable.

## Phase 10: Analytics and management
- Funnel events, lead conversion, campaign attribution.
- Revenue, order and payment reconciliation.
- Admin dashboards driven from persisted data, not frontend counters.

Gate: dashboard aggregates reconcile to source records for a fixed test period.

## Phase 11: Release certification
- TypeScript and production build.
- Database migration and RLS tests.
- Media persistence and failure recovery tests.
- Sales-funnel and WhatsApp tests.
- Order idempotency and payment verification tests.
- Browser E2E against isolated Preview.
- Final database read-back and tenant-boundary audit.
- Preview evidence reviewed before production approval.

Gate: every requirement has a traceable implementation, test, read-back and runtime result. A skipped E2E test is not a pass.

## Fail-fast execution contract

CI must stop on the first failed command. Do not print a PASS summary after a failed test. Preserve command exit codes and attach the relevant logs and commit SHA to the certification report.

## No silent scope expansion

A new application may omit modules it does not need, but each omission must be recorded as deferred. Do not claim full CP Splash sales-machine parity when orders, payment verification, inventory or sales lead capture have not been implemented and tested.
