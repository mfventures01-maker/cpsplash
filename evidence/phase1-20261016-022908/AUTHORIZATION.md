# PRODUCTION WRITE AUTHORIZATION REQUEST — PIPELINE A (PHASE 1)

**Timestamp:** 2026-10-16T02:29:08+01:00

## 1. Exact Change to be Applied
Execution of the CMS "Create Product in Supabase" flow (`AdminProductEditor.tsx` -> `productsService.createProduct`) using authenticated CMS owner credentials (`kevweoyibode@gmail.com`).
This will attempt two product insertions with test slugs:
- Test Product 1: `hoeos-trace-specimen-1`
- Test Product 2: `hoeos-trace-specimen-2`
Each insertion writes 1 row to `products`, 1 row to `product_variants`, and 1 row to `product_prices` (status: `draft`, physical type).

## 2. Target
- **Project Ref:** `efvvczmopacoroudzfnl` (ECOMMERCE, eu-central-1)
- **Tenant ID:** `42d36cee-4cd6-43d1-af5d-334e5a07e37c` (CP Fruit Splash)
- **Tables affected:**
  - `public.products` (INSERT)
  - `public.product_variants` (INSERT)
  - `public.product_prices` (INSERT)
  - `public.price_lists` (lookup / read, or single insert if missing)
- **Policies exercised:**
  - `products_staff_manage` on `public.products`
  - `variants_staff_manage` on `public.product_variants`
  - `prices_staff_manage` on `public.product_prices`

## 3. Rollback Plan
If test records are created in production:
Test products will be queried by slug (`hoeos-trace-specimen-1`, `hoeos-trace-specimen-2`) and removed or preserved as verified specimens according to the Phase exit plan.
Explicit SQL deletion rollback command (if requested):
```sql
DELETE FROM public.products WHERE tenant_id = '42d36cee-4cd6-43d1-af5d-334e5a07e37c' AND slug IN ('hoeos-trace-specimen-1', 'hoeos-trace-specimen-2');
```

## 4. Human Signature Gate
Signed: 
