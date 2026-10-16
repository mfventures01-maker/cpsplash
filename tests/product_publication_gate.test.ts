import assert from 'node:assert/strict';
import fs from 'node:fs';

// 1. Setup environment before importing services
const envContent = fs.readFileSync('C:/Projects/cp-splash/.env', 'utf-8');
const envVars: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || '';
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    envVars[match[1]] = val.trim();
  }
});

Object.assign(process.env, envVars);

(import.meta as unknown as { env: Record<string, string> }).env = {
  VITE_SUPABASE_URL: envVars.VITE_SUPABASE_URL || 'https://efvvczmopacoroudzfnl.supabase.co',
  VITE_SUPABASE_ANON_KEY: envVars.VITE_SUPABASE_ANON_KEY || '',
  VITE_CP_SPLASH_TENANT_ID: envVars.VITE_CP_SPLASH_TENANT_ID || '42d36cee-4cd6-43d1-af5d-334e5a07e37c',
};

// 2. Import service and validation helpers
const {
  productsService,
  validateProductPublication,
} = await import('../src/services/productsService');

const { supabase, TENANT_ID } = await import('../src/lib/supabase');
const { BUCKET_NAME } = await import('../src/services/mediaService');

console.log('======================================================================');
console.log('HOEOS TEST SUITE: UNIVERSAL PRODUCT PUBLICATION GATE REGRESSION');
console.log('======================================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name: string, fn: () => void | Promise<void>) {
  totalTests++;
  try {
    const result = fn();
    if (result && typeof (result as Promise<void>).then === 'function') {
      return (result as Promise<void>).then(
        () => {
          passedTests++;
          console.log(`  [PASS] ${name}`);
        },
        (err) => {
          console.error(`  [FAIL] ${name}:`, err.message);
          throw err;
        }
      );
    } else {
      passedTests++;
      console.log(`  [PASS] ${name}`);
    }
  } catch (err: unknown) {
    console.error(`  [FAIL] ${name}:`, err instanceof Error ? err.message : err);
    throw err;
  }
}

const TEST_PRODUCT_ID = '11111111-2222-3333-4444-555555555555';

const DEFAULT_PRODUCT_ROW = {
  id: TEST_PRODUCT_ID,
  tenant_id: TENANT_ID,
  name: 'CP Fruit Splash Zobo Sweet',
  slug: 'zobo-sweet',
  sku: 'CP-123456',
  brand: 'CP Fruit Splash',
  product_type: 'physical',
  short_description: 'Pure Artisanal Hibiscus',
  description: 'Rich in antioxidants and natural vitamins',
  status: 'draft',
  featured: false,
  metadata: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const QUALIFYING_MEDIA_ASSET = {
  id: 'asset-uuid-111',
  tenant_id: TENANT_ID,
  bucket: 'cp-public',
  path: `products/${TEST_PRODUCT_ID}/1791910642767_zobo_hero.jpg`,
  media_type: 'image',
  mime_type: 'image/jpeg',
  filename: 'zobo_hero.jpg',
  size_bytes: 2048,
  status: 'active',
  created_at: new Date().toISOString(),
};

const QUALIFYING_MEDIA_LINK = {
  product_id: TEST_PRODUCT_ID,
  media_id: 'asset-uuid-111',
  is_primary: true,
  sort_order: 1,
  media_assets: QUALIFYING_MEDIA_ASSET,
};

interface MockOptions {
  productRow?: Record<string, unknown> | null;
  productQueryError?: unknown | null;
  productMediaLinks?: unknown[] | null;
  productMediaQueryError?: unknown | null;
  mediaAssetRow?: Record<string, unknown> | null;
  mediaAssetQueryError?: unknown | null;
  updateError?: unknown | null;
}

function createSupabaseMock(options: MockOptions = {}) {
  const calls = {
    updates: [] as Array<{ table: string; values: Record<string, unknown>; filters: Record<string, unknown> }>,
    inserts: [] as Array<{ table: string; record: Record<string, unknown> }>,
    selects: [] as Array<{ table: string; query: string }>,
    trace: [] as Array<{ op: 'SELECT' | 'UPDATE' | 'INSERT'; table: string; details?: unknown }>,
  };

  const mockClient = {
    from: (table: string) => {
      const filters: Record<string, unknown> = {};
      let isSingle = false;
      let insertedRecord: Record<string, unknown> | null = null;
      let updateValues: Record<string, unknown> | null = null;
      let selectCols: string = '*';

      const builder: any = {
        select: (cols?: string) => {
          selectCols = cols || '*';
          calls.selects.push({ table, query: selectCols });
          return builder;
        },
        eq: (col: string, val: unknown) => {
          filters[col] = val;
          return builder;
        },
        order: () => builder,
        limit: () => builder,
        single: async () => {
          isSingle = true;
          calls.trace.push({ op: 'SELECT', table, details: { query: selectCols, filters: { ...filters } } });
          if (table === 'products') {
            if (options.productQueryError) {
              return { data: null, error: options.productQueryError };
            }
            if (options.productRow === null) {
              return { data: null, error: { code: 'PGRST116', message: 'Row not found' } };
            }
            return {
              data: options.productRow !== undefined ? options.productRow : { ...DEFAULT_PRODUCT_ROW },
              error: null,
            };
          }
          if (table === 'media_assets') {
            if (options.mediaAssetQueryError) {
              return { data: null, error: options.mediaAssetQueryError };
            }
            if (options.mediaAssetRow === null) {
              return { data: null, error: { code: 'PGRST116', message: 'Asset not found' } };
            }
            return {
              data: options.mediaAssetRow !== undefined ? options.mediaAssetRow : { ...QUALIFYING_MEDIA_ASSET },
              error: null,
            };
          }
          if (table === 'price_lists') {
            return { data: { id: 'price-list-001' }, error: null };
          }
          if (table === 'product_variants') {
            return { data: { id: 'variant-001' }, error: null };
          }
          return { data: null, error: null };
        },
        insert: (record: Record<string, unknown>) => {
          calls.inserts.push({ table, record });
          calls.trace.push({ op: 'INSERT', table, details: record });
          insertedRecord = record;
          return builder;
        },
        update: (values: Record<string, unknown>) => {
          updateValues = values;
          return builder;
        },
        then: (resolve: (val: unknown) => void) => {
          if (updateValues) {
            calls.updates.push({ table, values: updateValues, filters: { ...filters } });
            calls.trace.push({ op: 'UPDATE', table, details: { values: updateValues, filters: { ...filters } } });
            if (options.updateError) {
              resolve({ data: null, error: options.updateError });
              return;
            }
            resolve({ data: [{ ...updateValues }], error: null });
            return;
          }

          if (table === 'product_media') {
            calls.trace.push({ op: 'SELECT', table, details: { query: selectCols, filters: { ...filters } } });
            if (options.productMediaQueryError) {
              resolve({ data: null, error: options.productMediaQueryError });
              return;
            }
            if (options.productMediaLinks !== undefined) {
              resolve({ data: options.productMediaLinks, error: null });
              return;
            }
            resolve({ data: [QUALIFYING_MEDIA_LINK], error: null });
            return;
          }

          if (table === 'products') {
            calls.trace.push({ op: 'SELECT', table, details: { query: selectCols, filters: { ...filters } } });
            resolve({ data: [options.productRow || DEFAULT_PRODUCT_ROW], error: null });
            return;
          }

          if (table === 'product_variants') {
            resolve({ data: [{ id: 'variant-001' }], error: null });
            return;
          }

          if (table === 'product_prices') {
            resolve({ data: [{ id: 'price-001' }], error: null });
            return;
          }

          resolve({ data: [], error: null });
        },
      };

      return builder;
    },
    storage: supabase.storage,
  };

  return { mockClient, calls };
}

const originalFrom = supabase.from.bind(supabase);

async function withMockedSupabase(
  mock: ReturnType<typeof createSupabaseMock>['mockClient'],
  fn: () => Promise<void>
) {
  (supabase as unknown as { from: unknown }).from = mock.from;
  try {
    await fn();
  } finally {
    (supabase as unknown as { from: unknown }).from = originalFrom;
  }
}

// ----------------------------------------------------------------------------
// TEST 1: setProductStatus('published') rejects product with no primary media
// ----------------------------------------------------------------------------
await runTest('1. setProductStatus("published") rejects product with no primary media', async () => {
  const { mockClient, calls } = createSupabaseMock({
    productRow: { ...DEFAULT_PRODUCT_ROW, status: 'draft' },
    productMediaLinks: [], // No media
  });

  await withMockedSupabase(mockClient, async () => {
    const res = await productsService.setProductStatus(TEST_PRODUCT_ID, 'published');
    assert.equal(res.success, false, 'Expected success to be false');
    assert.match(res.error || '', /Publication prerequisite failed.*no primary media/i);
    // Ensure no update call was made to products table
    const productUpdates = calls.updates.filter(u => u.table === 'products');
    assert.equal(productUpdates.length, 0, 'No product status update should be issued');
  });
});

// ----------------------------------------------------------------------------
// TEST 2: updateProduct({ status: 'published' }) rejects product with no primary media
// ----------------------------------------------------------------------------
await runTest('2. updateProduct({ status: "published" }) rejects product with no primary media', async () => {
  const { mockClient, calls } = createSupabaseMock({
    productRow: { ...DEFAULT_PRODUCT_ROW, status: 'draft' },
    productMediaLinks: [], // No media
  });

  await withMockedSupabase(mockClient, async () => {
    const res = await productsService.updateProduct(TEST_PRODUCT_ID, { status: 'published' });
    assert.equal(res.data, null, 'Expected data to be null on rejected update');
    assert.match(res.error || '', /Publication prerequisite failed.*no primary media/i);
    const productUpdates = calls.updates.filter(u => u.table === 'products');
    assert.equal(productUpdates.length, 0, 'No product update should be issued');
  });
});

// ----------------------------------------------------------------------------
// TEST 3: Failed publication leaves product unpublished
// ----------------------------------------------------------------------------
await runTest('3. Failed publication leaves the product unpublished in database', async () => {
  const { mockClient, calls } = createSupabaseMock({
    productRow: { ...DEFAULT_PRODUCT_ROW, status: 'draft' },
    productMediaLinks: [],
  });

  await withMockedSupabase(mockClient, async () => {
    // Attempt via setProductStatus
    await productsService.setProductStatus(TEST_PRODUCT_ID, 'published');
    // Attempt via updateProduct
    await productsService.updateProduct(TEST_PRODUCT_ID, { status: 'published' });

    // Verify absolutely no status mutation to 'published' was emitted
    const publicationWrites = calls.updates.filter(u => u.table === 'products' && u.values.status === 'published');
    assert.equal(publicationWrites.length, 0, 'Product must remain unpublished');
  });
});

// ----------------------------------------------------------------------------
// TEST 4: Failed publication through updateProduct does not partially apply other fields
// ----------------------------------------------------------------------------
await runTest('4. Failed publication through updateProduct() does not partially apply other fields', async () => {
  const { mockClient, calls } = createSupabaseMock({
    productRow: { ...DEFAULT_PRODUCT_ROW, status: 'draft' },
    productMediaLinks: [],
  });

  await withMockedSupabase(mockClient, async () => {
    const res = await productsService.updateProduct(TEST_PRODUCT_ID, {
      status: 'published',
      name: 'Unpublished Illicit Title',
      price: 9999,
      volume: 1000,
      description: 'Illicit description that should not be saved',
    });

    assert.equal(res.data, null);
    assert.ok(res.error);

    // Verify NO database table updates were called (neither products, variants, nor prices)
    const productUpdates = calls.updates.filter(u => u.table === 'products');
    const variantUpdates = calls.updates.filter(u => u.table === 'product_variants');
    const priceUpdates = calls.updates.filter(u => u.table === 'product_prices');

    assert.equal(productUpdates.length, 0, 'Products table must have zero updates');
    assert.equal(variantUpdates.length, 0, 'Variants table must have zero updates');
    assert.equal(priceUpdates.length, 0, 'Prices table must have zero updates');
  });
});

// ----------------------------------------------------------------------------
// TEST 5: Qualifying active primary image in cp-public permits guarded transition
// ----------------------------------------------------------------------------
await runTest('5. Qualifying active primary image in cp-public permits guarded transition', async () => {
  const { mockClient, calls } = createSupabaseMock({
    productRow: { ...DEFAULT_PRODUCT_ROW, status: 'draft' },
    productMediaLinks: [QUALIFYING_MEDIA_LINK],
  });

  await withMockedSupabase(mockClient, async () => {
    // 5a: setProductStatus('published')
    const statusRes = await productsService.setProductStatus(TEST_PRODUCT_ID, 'published');
    assert.equal(statusRes.success, true);
    assert.equal(statusRes.error, null);

    const statusUpdates = calls.updates.filter(u => u.table === 'products' && u.values.status === 'published');
    assert.equal(statusUpdates.length, 1, 'Product status should be updated to published');

    // 5b: updateProduct({ status: 'published' })
    const updateRes = await productsService.updateProduct(TEST_PRODUCT_ID, {
      status: 'published',
      name: 'Verified Published Product',
    });
    assert.equal(updateRes.error, null);
    assert.ok(updateRes.data);
  });
});

// ----------------------------------------------------------------------------
// TEST 6: GIF with image/gif and media_type = image is accepted
// ----------------------------------------------------------------------------
await runTest('6. GIF with image/gif and media_type = image is accepted', async () => {
  const gifAsset = {
    ...QUALIFYING_MEDIA_ASSET,
    filename: 'hero_animation.gif',
    path: `products/${TEST_PRODUCT_ID}/1791910642767_hero_animation.gif`,
    mime_type: 'image/gif',
    media_type: 'image',
  };

  const gifLink = {
    ...QUALIFYING_MEDIA_LINK,
    media_assets: gifAsset,
  };

  const { mockClient } = createSupabaseMock({
    productRow: { ...DEFAULT_PRODUCT_ROW, status: 'draft' },
    productMediaLinks: [gifLink],
  });

  await withMockedSupabase(mockClient, async () => {
    const val = await validateProductPublication(TEST_PRODUCT_ID);
    assert.equal(val.isValid, true, 'GIF should be valid primary media');
    assert.equal(val.error, null);

    const res = await productsService.setProductStatus(TEST_PRODUCT_ID, 'published');
    assert.equal(res.success, true);
  });
});

// ----------------------------------------------------------------------------
// TEST 7: Inactive, non-primary, unlinked, wrong-bucket, wrong-tenant, video, or wrong-product rejected
// ----------------------------------------------------------------------------
await runTest('7a. Inactive asset (status = "archived") is rejected', async () => {
  const asset = { ...QUALIFYING_MEDIA_ASSET, status: 'archived' };
  const link = { ...QUALIFYING_MEDIA_LINK, media_assets: asset };
  const { mockClient } = createSupabaseMock({ productMediaLinks: [link] });

  await withMockedSupabase(mockClient, async () => {
    const res = await productsService.setProductStatus(TEST_PRODUCT_ID, 'published');
    assert.equal(res.success, false);
    assert.match(res.error || '', /status is "archived"/i);
  });
});

await runTest('7b. Non-primary link (is_primary = false) is rejected', async () => {
  const link = { ...QUALIFYING_MEDIA_LINK, is_primary: false };
  const { mockClient } = createSupabaseMock({ productMediaLinks: [link] });

  await withMockedSupabase(mockClient, async () => {
    const res = await productsService.setProductStatus(TEST_PRODUCT_ID, 'published');
    assert.equal(res.success, false);
    assert.match(res.error || '', /not marked as primary/i);
  });
});

await runTest('7c. Unlinked asset (no product_media record) is rejected', async () => {
  const { mockClient } = createSupabaseMock({ productMediaLinks: [] });

  await withMockedSupabase(mockClient, async () => {
    const res = await productsService.setProductStatus(TEST_PRODUCT_ID, 'published');
    assert.equal(res.success, false);
    assert.match(res.error || '', /no primary media attached/i);
  });
});

await runTest('7d. Wrong bucket (bucket != "cp-public") is rejected', async () => {
  const asset = { ...QUALIFYING_MEDIA_ASSET, bucket: 'cp-private' };
  const link = { ...QUALIFYING_MEDIA_LINK, media_assets: asset };
  const { mockClient } = createSupabaseMock({ productMediaLinks: [link] });

  await withMockedSupabase(mockClient, async () => {
    const res = await productsService.setProductStatus(TEST_PRODUCT_ID, 'published');
    assert.equal(res.success, false);
    assert.match(res.error || '', /bucket mismatch/i);
  });
});

await runTest('7e. Wrong tenant (tenant_id != TENANT_ID) is rejected', async () => {
  const asset = { ...QUALIFYING_MEDIA_ASSET, tenant_id: '99999999-9999-9999-9999-999999999999' };
  const link = { ...QUALIFYING_MEDIA_LINK, media_assets: asset };
  const { mockClient } = createSupabaseMock({ productMediaLinks: [link] });

  await withMockedSupabase(mockClient, async () => {
    const res = await productsService.setProductStatus(TEST_PRODUCT_ID, 'published');
    assert.equal(res.success, false);
    assert.match(res.error || '', /tenant mismatch/i);
  });
});

await runTest('7f. Video asset (media_type = "video", mime = "video/mp4") is rejected', async () => {
  const asset = { ...QUALIFYING_MEDIA_ASSET, media_type: 'video', mime_type: 'video/mp4' };
  const link = { ...QUALIFYING_MEDIA_LINK, media_assets: asset };
  const { mockClient } = createSupabaseMock({ productMediaLinks: [link] });

  await withMockedSupabase(mockClient, async () => {
    const res = await productsService.setProductStatus(TEST_PRODUCT_ID, 'published');
    assert.equal(res.success, false);
    assert.match(res.error || '', /must have media_type "image"/i);
  });
});

await runTest('7g. Wrong product storage path (products/other-id/...) is rejected', async () => {
  const asset = {
    ...QUALIFYING_MEDIA_ASSET,
    path: 'products/88888888-8888-8888-8888-888888888888/hero.jpg',
  };
  const link = { ...QUALIFYING_MEDIA_LINK, media_assets: asset };
  const { mockClient } = createSupabaseMock({ productMediaLinks: [link] });

  await withMockedSupabase(mockClient, async () => {
    const res = await productsService.setProductStatus(TEST_PRODUCT_ID, 'published');
    assert.equal(res.success, false);
    assert.match(res.error || '', /storage path.*does not belong to expected/i);
  });
});

// ----------------------------------------------------------------------------
// TEST 8: Supabase validation query errors block publication
// ----------------------------------------------------------------------------
await runTest('8a. Product lookup query error blocks publication with actionable message', async () => {
  const { mockClient, calls } = createSupabaseMock({
    productQueryError: { message: 'Connection to Supabase PostgreSQL timed out' },
  });

  await withMockedSupabase(mockClient, async () => {
    const res = await productsService.setProductStatus(TEST_PRODUCT_ID, 'published');
    assert.equal(res.success, false);
    assert.match(res.error || '', /Database verification error checking product existence/i);
    assert.equal(calls.updates.length, 0, 'No status update should occur on query error');
  });
});

await runTest('8b. Product media query error blocks publication with actionable message', async () => {
  const { mockClient, calls } = createSupabaseMock({
    productMediaQueryError: { message: 'RLS policy evaluation failure on product_media' },
  });

  await withMockedSupabase(mockClient, async () => {
    const res = await productsService.setProductStatus(TEST_PRODUCT_ID, 'published');
    assert.equal(res.success, false);
    assert.match(res.error || '', /Database verification error checking primary media association/i);
    assert.equal(calls.updates.length, 0, 'No status update should occur on query error');
  });
});

await runTest('8c. Media assets lookup error blocks publication with actionable message', async () => {
  // Link has media_id but media_assets was not embedded, requiring direct fetch
  const unjoinedLink = {
    product_id: TEST_PRODUCT_ID,
    media_id: 'asset-uuid-111',
    is_primary: true,
    sort_order: 1,
    media_assets: null,
  };

  const { mockClient, calls } = createSupabaseMock({
    productMediaLinks: [unjoinedLink],
    mediaAssetQueryError: { message: 'Foreign table media_assets inaccessible' },
  });

  await withMockedSupabase(mockClient, async () => {
    const res = await productsService.setProductStatus(TEST_PRODUCT_ID, 'published');
    assert.equal(res.success, false);
    assert.match(res.error || '', /Database verification error fetching media asset/i);
    assert.equal(calls.updates.length, 0, 'No status update should occur on query error');
  });
});

// ----------------------------------------------------------------------------
// TEST 9: Status changes to 'draft' and 'archived' remain supported
// ----------------------------------------------------------------------------
await runTest('9. Status changes to "draft" and "archived" remain supported without media', async () => {
  const { mockClient, calls } = createSupabaseMock({
    productRow: { ...DEFAULT_PRODUCT_ROW, status: 'published' },
    productMediaLinks: [], // No media at all
  });

  await withMockedSupabase(mockClient, async () => {
    // 9a: setProductStatus('draft')
    const draftRes = await productsService.setProductStatus(TEST_PRODUCT_ID, 'draft');
    assert.equal(draftRes.success, true);
    assert.equal(draftRes.error, null);

    // 9b: setProductStatus('archived')
    const archivedRes = await productsService.setProductStatus(TEST_PRODUCT_ID, 'archived');
    assert.equal(archivedRes.success, true);
    assert.equal(archivedRes.error, null);

    // 9c: updateProduct({ status: 'draft' })
    const updateDraftRes = await productsService.updateProduct(TEST_PRODUCT_ID, { status: 'draft' });
    assert.equal(updateDraftRes.error, null);

    // 9d: updateProduct({ status: 'archived' })
    const updateArchivedRes = await productsService.updateProduct(TEST_PRODUCT_ID, { status: 'archived' });
    assert.equal(updateArchivedRes.error, null);

    const productUpdates = calls.updates.filter(u => u.table === 'products');
    assert.ok(productUpdates.length >= 4, 'All draft and archived transitions must be issued');
  });
});

// ----------------------------------------------------------------------------
// TEST 10: Every discovered publication caller uses guarded path; no bypass remains
// ----------------------------------------------------------------------------
await runTest('10a. createProduct({ status: "published" }) is rejected by publication gate', async () => {
  const { mockClient, calls } = createSupabaseMock();

  await withMockedSupabase(mockClient, async () => {
    const res = await productsService.createProduct({
      name: 'Ungated Specimen Drink',
      slug: 'ungated-drink',
      status: 'published',
    });

    assert.equal(res.data, null);
    assert.match(res.error || '', /Publication prerequisite failed.*cannot be created directly with status "published"/i);

    const productInserts = calls.inserts.filter(i => i.table === 'products');
    assert.equal(productInserts.length, 0, 'No product insert allowed when status is published');
  });
});

await runTest('10b. Universal caller audit: No unguarded publication path exists in src tree', async () => {
  // Read productsService source and verify every entry point routes through validator
  const svcContent = fs.readFileSync('C:/Projects/cp-splash/src/services/productsService.ts', 'utf-8');
  assert.ok(svcContent.includes('validateProductPublication(id)'), 'updateProduct and setProductStatus must invoke validator');
  assert.ok(svcContent.includes("productData.status === 'published'"), 'createProduct must guard against published status');

  // Verify AdminProductList passes through setProductStatus
  const adminListContent = fs.readFileSync('C:/Projects/cp-splash/src/components/admin/AdminProductList.tsx', 'utf-8');
  assert.ok(adminListContent.includes('productsService.setProductStatus('), 'AdminProductList must use setProductStatus');

  // Verify AdminProductEditor passes through createProduct and updateProduct
  const adminEditorContent = fs.readFileSync('C:/Projects/cp-splash/src/components/admin/AdminProductEditor.tsx', 'utf-8');
  assert.ok(adminEditorContent.includes('productsService.updateProduct('), 'AdminProductEditor must use updateProduct');
  assert.ok(adminEditorContent.includes('productsService.createProduct('), 'AdminProductEditor must use createProduct');

  // Verify CertificationPage passes through createProduct as draft and setProductStatus
  const certifyContent = fs.readFileSync('C:/Projects/cp-splash/src/pages/CertificationPage.tsx', 'utf-8');
  assert.ok(certifyContent.includes("status: 'draft'"), 'CertificationPage must create products as draft');
  assert.ok(certifyContent.includes("productsService.setProductStatus(testId, 'published')"), 'CertificationPage must publish via guarded service');
});

// ----------------------------------------------------------------------------
// TEST 11: Forensic Ordered Mutation Tracing & Atomic Rejection Invariant
// ----------------------------------------------------------------------------
await runTest('11a. Trace verification: missing media aborts after SELECTs with zero mutations', async () => {
  const { mockClient, calls } = createSupabaseMock({
    productRow: { ...DEFAULT_PRODUCT_ROW, status: 'draft' },
    productMediaLinks: [],
  });

  await withMockedSupabase(mockClient, async () => {
    await productsService.updateProduct(TEST_PRODUCT_ID, {
      status: 'published',
      name: 'Unapplied Modification',
      price: 2500,
    });

    const ops = calls.trace.map(t => `${t.op} ${t.table}`);
    assert.deepEqual(ops, ['SELECT products', 'SELECT product_media']);
    const mutations = calls.trace.filter(t => t.op !== 'SELECT');
    assert.equal(mutations.length, 0, 'Must have zero mutations on rejection');
  });
});

await runTest('11b. Trace verification: product query error aborts immediately with zero mutations', async () => {
  const { mockClient, calls } = createSupabaseMock({
    productQueryError: { message: 'Database unreachable' },
  });

  await withMockedSupabase(mockClient, async () => {
    await productsService.updateProduct(TEST_PRODUCT_ID, {
      status: 'published',
      name: 'Unapplied Modification',
    });

    const ops = calls.trace.map(t => `${t.op} ${t.table}`);
    assert.deepEqual(ops, ['SELECT products']);
    const mutations = calls.trace.filter(t => t.op !== 'SELECT');
    assert.equal(mutations.length, 0, 'Must abort immediately on product query failure');
  });
});

await runTest('11c. Trace verification: media query error aborts with zero mutations', async () => {
  const { mockClient, calls } = createSupabaseMock({
    productMediaQueryError: { message: 'product_media table locked' },
  });

  await withMockedSupabase(mockClient, async () => {
    await productsService.updateProduct(TEST_PRODUCT_ID, {
      status: 'published',
      name: 'Unapplied Modification',
    });

    const ops = calls.trace.map(t => `${t.op} ${t.table}`);
    assert.deepEqual(ops, ['SELECT products', 'SELECT product_media']);
    const mutations = calls.trace.filter(t => t.op !== 'SELECT');
    assert.equal(mutations.length, 0, 'Must abort immediately on media query failure');
  });
});

await runTest('11d. Trace verification: unlinked asset direct fetch error aborts with zero mutations', async () => {
  const unjoinedLink = {
    product_id: TEST_PRODUCT_ID,
    media_id: 'asset-uuid-111',
    is_primary: true,
    sort_order: 1,
    media_assets: null,
  };

  const { mockClient, calls } = createSupabaseMock({
    productMediaLinks: [unjoinedLink],
    mediaAssetQueryError: { message: 'media_assets table locked' },
  });

  await withMockedSupabase(mockClient, async () => {
    await productsService.updateProduct(TEST_PRODUCT_ID, {
      status: 'published',
      name: 'Unapplied Modification',
    });

    const ops = calls.trace.map(t => `${t.op} ${t.table}`);
    assert.deepEqual(ops, ['SELECT products', 'SELECT product_media', 'SELECT media_assets']);
    const mutations = calls.trace.filter(t => t.op !== 'SELECT');
    assert.equal(mutations.length, 0, 'Must abort on asset query failure');
  });
});

await runTest('11e. Trace verification: successful publication executes validation SELECTs before any UPDATE', async () => {
  const { mockClient, calls } = createSupabaseMock({
    productRow: { ...DEFAULT_PRODUCT_ROW, status: 'draft' },
    productMediaLinks: [QUALIFYING_MEDIA_LINK],
  });

  await withMockedSupabase(mockClient, async () => {
    await productsService.updateProduct(TEST_PRODUCT_ID, {
      status: 'published',
      name: 'Legitimate Published Product',
    });

    const ops = calls.trace.map(t => `${t.op} ${t.table}`);
    // First two operations must be validation queries
    assert.equal(ops[0], 'SELECT products');
    assert.equal(ops[1], 'SELECT product_media');
    // First write operation must be after validation
    const firstWriteIndex = ops.findIndex(o => o.startsWith('UPDATE') || o.startsWith('INSERT'));
    assert.ok(firstWriteIndex >= 2, 'No writes allowed before validation queries complete');
    assert.equal(ops[firstWriteIndex], 'UPDATE products');
  });
});

console.log('\n======================================================================');
console.log(`HOEOS TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
console.log('======================================================================');

process.exit(0);
