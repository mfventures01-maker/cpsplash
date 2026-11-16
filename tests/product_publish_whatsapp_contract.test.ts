import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getProductPrice } from '../src/services/productHelpers';
import type { Product } from '../src/types/database.types';

const product = {
  id: 'product-1',
  variants: [
    { id: 'inactive', status: 'archived', prices: [{ id: 'old', status: 'active', amount: 100 }] },
    { id: 'active', status: 'active', prices: [
      { id: 'inactive-price', status: 'archived', amount: 999 },
      { id: 'current-price', status: 'active', amount: 2500, compare_at_amount: 3000 },
    ] },
  ],
} as unknown as Product;

assert.equal(getProductPrice(product).amount, 2500, 'pricing must resolve the active variant and active price');
assert.equal(getProductPrice(product).compare_at_amount, 3000, 'active compare-at price should be retained');

const noActivePrice = {
  id: 'product-2',
  variants: [{ id: 'active', status: 'active', prices: [{ id: 'inactive', status: 'archived', amount: 700 }] }],
} as unknown as Product;
assert.equal(getProductPrice(noActivePrice).amount, 0, 'inactive prices must never be used as a public fallback');

const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const productsService = source('../src/services/productsService.ts');
const modal = source('../src/components/product/WhatsAppOrderModal.tsx');
const catalog = source('../src/pages/ProductsCatalogPage.tsx');
const funnel = source('../src/pages/CommercialFunnelPage.tsx');
const routes = source('../src/App.tsx');
const adminEditor = source('../src/components/admin/AdminProductEditor.tsx');

assert.match(productsService, /product_prices\(id, amount, status\)/, 'publication gate must query persisted prices');
assert.match(productsService, /price\.status === 'active'.*Number\(price\.amount\) > 0/, 'publication gate must require a positive active price');
assert.match(productsService, /select\('id, amount, status'\)/, 'price writes must be read back');
assert.match(productsService, /asset\.bucket === BUCKET_NAME/, 'public catalog must require the approved storage bucket');
assert.match(productsService, /asset\.path\?\.startsWith/, 'public catalog must require product-linked storage paths');

assert.doesNotMatch(modal, /ordersService|createOrder|orderSent|Order Dispatched/, 'WhatsApp handoff must not create or claim persisted orders');
assert.match(modal, /Product link:.*productUrl/, 'WhatsApp message must include the product URL');
assert.match(modal, /Quantity:.*quantity/, 'WhatsApp message must include quantity');
assert.match(modal, /Unit price:.*unitPrice/, 'WhatsApp message must include the active unit price');

assert.match(catalog, /useProducts\(\)/, 'catalog search must use published database products');
assert.match(catalog, /type="search"/, 'catalog must expose product search');
assert.match(funnel, /useProducts\(\)/, 'each territory funnel must consume the shared published product hook');
assert.match(funnel, /<ProductCard/, 'each funnel must render shared product records');
for (const slug of ['sports', 'parties-events', 'hotels-hospitality', 'schools', 'individuals']) {
  assert.ok(routes.includes(`territorySlug="${slug}"`), `missing required funnel route: ${slug}`);
}
assert.match(adminEditor, /useState<number \| ''>\(''\)/, 'CMS must not prefill a fake/default price');
assert.match(adminEditor, /Enter a valid product price greater than zero/, 'CMS must reject missing or invalid prices');

console.log('Product publishing-to-WhatsApp contract: PASS');
