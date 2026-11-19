import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const migration = read('../supabase/migrations/20261119000000_cms_product_and_page_persistence.sql');
const products = read('../src/services/productsService.ts');
const pageService = read('../src/services/cmsPagesService.ts');
const pageAdmin = read('../src/components/admin/AdminPagesManager.tsx');
const pagePublic = read('../src/pages/CmsPublicPage.tsx');
const app = read('../src/App.tsx');
const adminLayout = read('../src/components/admin/AdminLayout.tsx');

assert.match(migration, /create or replace function public\.cms_save_product/i);
assert.match(migration, /language plpgsql\s+security invoker/i);
assert.match(migration, /private\.has_tenant_role\(v_tenant_id, array\['owner','admin','editor','manager'\]\)/i);
assert.match(migration, /create table if not exists public\.cms_pages/i);
assert.match(migration, /create table if not exists public\.cms_page_sections/i);
assert.match(migration, /cms_pages_public_read/i);
assert.match(migration, /cms_pages_staff_manage/i);
assert.match(migration, /cms_page_sections_public_read/i);
assert.match(migration, /cms_page_sections_staff_manage/i);

assert.match(products, /rpc\('cms_save_product'/);
assert.match(products, /p_product_id: null/);
assert.match(products, /p_price:/);
assert.match(products, /authoritative read-back/i);
assert.match(products, /positive active price/i);
assert.match(products, /media\/\$\{TENANT_ID\}/);
assert.doesNotMatch(products, /Number\(productData\.price\) \|\| 0/);

assert.match(pageService, /\.from\('cms_pages'\)/);
assert.match(pageService, /\.from\('cms_page_sections'\)/);
assert.match(pageAdmin, /section_key: String\(section\.key/);
assert.match(pageService, /notifySyncEvent\('cms_pages'/);
assert.match(pageAdmin, /Save page to Supabase/);
assert.match(pageAdmin, /JSON\.parse\(content\)/);
assert.match(pagePublic, /getPublishedPageByPath/);
assert.match(pagePublic, /page\.seo_title \|\| page\.title/);
assert.match(app, /<CmsPublicPage/);
assert.match(app, /'pages'/);
assert.match(adminLayout, /label: 'Website Pages'/);

console.log('CP Splash CMS persistence contract: PASS');
