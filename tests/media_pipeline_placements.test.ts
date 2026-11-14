/**
 * HOEOS TEST SUITE: CMS MEDIA PIPELINE & PERSISTENT PLACEMENTS
 * Deterministic test harness covering:
 * 1. Static image upload (JPEG/PNG)
 * 2. GIF upload and MIME preservation (media_type='image', mime_type='image/gif')
 * 3. Animated WebP MIME handling
 * 4. Unsupported MIME rejection
 * 5. Oversized animation rejection & linked-media override
 * 6. Storage upload failure handling
 * 7. media_assets insert failure & safe storage compensation
 * 8. Duplicate / retry prevention
 * 9. Tenant isolation
 * 10. Product media linking & primary assignment
 * 11. Persistent placement ordering & active toggling
 * 12. Placement deletion without destroying shared media
 * 13. Homepage placement resolution
 * 14. Resolution for each of the 5 sales funnels:
 *     - sports
 *     - parties-events
 *     - hotels-hospitality
 *     - schools
 *     - individuals
 * 15. Public reads restricted to active approved media in cp-public
 * 16. Neutral placeholder / missing media resilience
 */

import assert from 'node:assert/strict';
// This suite is mock-only. Never read local env files or inherit remote
// Supabase credentials. Live certification is a separately authorized task.
process.env.HOEOS_MOCK_ONLY = '1';
process.env.VITE_SUPABASE_URL = 'http://127.0.0.1:54321';
process.env.VITE_SUPABASE_ANON_KEY = 'mock-anon-key-not-valid';
process.env.VITE_CP_SPLASH_TENANT_ID = '4b9995ce-0000-4000-8000-000000000001';

(import.meta as unknown as { env: Record<string, string> }).env = {
  VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
  VITE_SUPABASE_ANON_KEY: 'mock-anon-key-not-valid',
  VITE_CP_SPLASH_TENANT_ID: '4b9995ce-0000-4000-8000-000000000001',
};

const { mediaService, BUCKET_NAME } = await import('../src/services/mediaService');
const { placementService } = await import('../src/services/placementService');
const { supabase, TENANT_ID } = await import('../src/lib/supabase');
import type { MediaAsset, MediaPlacement } from '../src/types/database.types';

// Deterministic in-memory mock store
const mockStorage = new Map<string, { path: string; data: unknown; contentType?: string }>();
const mockMediaAssets = new Map<string, MediaAsset>();
const mockProductMedia: Array<{ product_id: string; media_id: string; is_primary: boolean; sort_order: number }> = [];
const mockProducts = new Map<string, { id: string; tenant_id: string; name: string }>();
const mockMediaPlacements = new Map<string, MediaPlacement>();
const mockCampaigns = new Map<string, { id: string; tenant_id: string; name: string }>();
const mockSalesJourneys = new Map<string, { id: string; tenant_id: string; name: string }>();

const TEST_PRODUCT_ID = '11111111-2222-3333-4444-555555555555';
const OTHER_TENANT_ID = '99999999-9999-9999-9999-999999999999';

// Setup default product in mock
mockProducts.set(TEST_PRODUCT_ID, {
  id: TEST_PRODUCT_ID,
  tenant_id: TENANT_ID,
  name: 'CP Splash Test Orange',
});

// Configure mocks for Supabase Storage and DB
let forceStorageError = false;
let forceAssetInsertError = false;
let forcePlacementInsertError = false;
let forcePlacementReloadError = false;
let forcePrimaryRpcError = false;
let storageDeletions: string[] = [];

// Intercept Supabase Storage methods
const originalStorageFrom = supabase.storage.from.bind(supabase.storage);
(supabase.storage as any).from = (bucket: string) => {
  const handler = originalStorageFrom(bucket);
  return {
    ...handler,
    upload: async (path: string, file: unknown, options?: { contentType?: string }) => {
      if (forceStorageError) {
        return { data: null, error: { message: 'Simulated storage failure' } };
      }
      mockStorage.set(`${bucket}/${path}`, { path, data: file, contentType: options?.contentType });
      return { data: { path }, error: null };
    },
    remove: async (paths: string[]) => {
      storageDeletions.push(...paths);
      for (const p of paths) {
        mockStorage.delete(`${bucket}/${p}`);
      }
      return { data: paths.map(p => ({ name: p })), error: null };
    },
    getPublicUrl: (path: string) => {
      return { data: { publicUrl: `https://mock.supabase.co/storage/v1/object/public/${bucket}/${path}` } };
    },
  };
};

// Intercept Supabase DB calls
const originalFrom = supabase.from.bind(supabase);
supabase.from = (table: string) => {
  if (table === 'products') {
    return {
      select: () => ({
        eq: (_col: string, val: string) => ({
          single: async () => {
            const prod = mockProducts.get(val);
            if (!prod) return { data: null, error: { message: 'Product not found' } };
            return { data: prod, error: null };
          },
        }),
      }),
    } as any;
  }

  if (table === 'campaigns') {
    return {
      select: () => ({
        eq: (_col: string, val: string) => ({
          single: async () => {
            const camp = mockCampaigns.get(val);
            if (!camp) return { data: null, error: { message: 'Campaign not found' } };
            return { data: camp, error: null };
          },
        }),
      }),
    } as any;
  }

  if (table === 'sales_journeys') {
    return {
      select: () => ({
        eq: (_col: string, val: string) => ({
          single: async () => {
            const j = mockSalesJourneys.get(val);
            if (!j) return { data: null, error: { message: 'Sales journey not found' } };
            return { data: j, error: null };
          },
        }),
      }),
    } as any;
  }

  if (table === 'media_assets') {
    return {
      select: () => {
        let tenantFilter: string | null = null;
        let filenameFilter: string | null = null;
        let sizeFilter: number | null = null;
        let statusFilter: string | null = null;
        let idFilter: string | null = null;

        const builder: any = {
          eq: (col: string, val: any) => {
            if (col === 'tenant_id') tenantFilter = val;
            if (col === 'filename') filenameFilter = val;
            if (col === 'size_bytes') sizeFilter = val;
            if (col === 'status') statusFilter = val;
            if (col === 'id') idFilter = val;
            return builder;
          },
          order: () => builder,
          limit: () => builder,
          single: async () => {
            if (idFilter && mockMediaAssets.has(idFilter)) {
              return { data: mockMediaAssets.get(idFilter), error: null };
            }
            return { data: null, error: { message: 'Asset not found' } };
          },
          then: (resolve: any) => {
            let items = Array.from(mockMediaAssets.values());
            if (tenantFilter) items = items.filter(a => a.tenant_id === tenantFilter);
            if (filenameFilter) items = items.filter(a => a.filename === filenameFilter);
            if (sizeFilter !== null) items = items.filter(a => a.size_bytes === sizeFilter);
            if (statusFilter) items = items.filter(a => a.status === statusFilter);
            resolve({ data: items, error: null });
          },
        };
        return builder;
      },
      insert: (record: any) => ({
        select: () => ({
          single: async () => {
            if (forceAssetInsertError) {
              return { data: null, error: { message: 'Simulated media_assets DB insert failure' } };
            }
            const id = record.id || crypto.randomUUID();
            const asset: MediaAsset = {
              id,
              tenant_id: record.tenant_id,
              bucket: record.bucket,
              path: record.path,
              media_type: record.media_type,
              mime_type: record.mime_type,
              filename: record.filename,
              size_bytes: record.size_bytes,
              width: record.width || null,
              height: record.height || null,
              duration_seconds: record.duration_seconds || null,
              alt_text: record.alt_text || null,
              caption: record.caption || null,
              status: record.status || 'active',
              uploaded_by: record.uploaded_by || null,
              created_at: new Date().toISOString(),
            };
            mockMediaAssets.set(id, asset);
            return { data: asset, error: null };
          },
        }),
      }),
    } as any;
  }

  if (table === 'product_media') {
    return {
      select: () => {
        let pId: string | null = null;
        const builder: any = {
          eq: (col: string, val: any) => {
            if (col === 'product_id') pId = val;
            return builder;
          },
          order: () => builder,
          then: (resolve: any) => {
            let res = mockProductMedia;
            if (pId) res = res.filter(m => m.product_id === pId);
            resolve({ data: res, error: null });
          },
        };
        return builder;
      },
      update: (updates: any) => ({
        eq: (_col: string, pId: string) => ({
          then: (resolve: any) => {
            for (const m of mockProductMedia) {
              if (m.product_id === pId) Object.assign(m, updates);
            }
            resolve({ data: null, error: null });
          },
        }),
      }),
      insert: (record: any) => ({
        select: () => ({
          single: async () => {
            mockProductMedia.push(record);
            const asset = mockMediaAssets.get(record.media_id);
            return { data: { ...record, media_assets: asset }, error: null };
          },
        }),
      }),
      delete: () => ({
        eq: (_col1: string, pId: string) => ({
          eq: (_col2: string, mId: string) => ({
            then: (resolve: any) => {
              const idx = mockProductMedia.findIndex(m => m.product_id === pId && m.media_id === mId);
              if (idx >= 0) mockProductMedia.splice(idx, 1);
              resolve({ data: null, error: null });
            },
          }),
        }),
      }),
    } as any;
  }

  if (table === 'media_placements') {
    return {
      select: () => {
        let tenantFilter: string | null = null;
        let scopeTypeFilter: string | null = null;
        let scopeIdFilter: string | null = null;
        let activeFilter: boolean | null = null;
        let idFilter: string | null = null;

        const builder: any = {
          eq: (col: string, val: any) => {
            if (col === 'tenant_id') tenantFilter = val;
            if (col === 'scope_type') scopeTypeFilter = val;
            if (col === 'scope_id') scopeIdFilter = val;
            if (col === 'active') activeFilter = val;
            if (col === 'id') idFilter = val;
            return builder;
          },
          order: () => builder,
          single: async () => {
            if (forcePlacementReloadError) {
              return { data: null, error: { message: 'Simulated placement reload query failure' } };
            }
            if (idFilter && mockMediaPlacements.has(idFilter)) {
              const p = mockMediaPlacements.get(idFilter)!;
              const asset = mockMediaAssets.get(p.media_id);
              return { data: { ...p, media_assets: asset }, error: null };
            }
            return { data: null, error: { message: 'Placement not found' } };
          },
          then: (resolve: any) => {
            let items = Array.from(mockMediaPlacements.values());
            if (tenantFilter) items = items.filter(p => p.tenant_id === tenantFilter);
            if (scopeTypeFilter) items = items.filter(p => p.scope_type === scopeTypeFilter);
            if (scopeIdFilter) items = items.filter(p => p.scope_id === scopeIdFilter);
            if (activeFilter !== null) items = items.filter(p => p.active === activeFilter);
            const enriched = items.map(p => ({
              ...p,
              media_assets: mockMediaAssets.get(p.media_id),
            }));
            resolve({ data: enriched, error: null });
          },
        };
        return builder;
      },
      insert: (record: any) => ({
        select: () => ({
          single: async () => {
            if (forcePlacementInsertError) {
              return { data: null, error: { message: 'Simulated media_placements DB insert failure' } };
            }
            const id = record.id || crypto.randomUUID();
            const placement: MediaPlacement = {
              id,
              tenant_id: record.tenant_id,
              media_id: record.media_id,
              placement_key: record.placement_key,
              scope_type: record.scope_type,
              scope_id: record.scope_id || null,
              sort_order: record.sort_order ?? 0,
              active: record.active ?? true,
              alt_text_override: record.alt_text_override || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            mockMediaPlacements.set(id, placement);
            return { data: { id }, error: null };
          },
        }),
      }),
      update: (updates: any) => ({
        eq: (_col1: string, val1: string) => ({
          eq: (_col2: string, _val2: string) => ({
            select: () => ({
              single: async () => {
                const id = val1;
                if (!mockMediaPlacements.has(id)) {
                  return { data: null, error: { message: 'Placement not found' } };
                }
                const p = mockMediaPlacements.get(id)!;
                Object.assign(p, updates);
                return { data: { id }, error: null };
              },
            }),
            then: (resolve: any) => {
              const id = val1;
              if (mockMediaPlacements.has(id)) {
                Object.assign(mockMediaPlacements.get(id)!, updates);
              }
              resolve({ data: null, error: null });
            },
          }),
        }),
      }),
      delete: () => ({
        eq: (_col1: string, val1: string) => ({
          eq: (_col2: string, _val2: string) => ({
            then: (resolve: any) => {
              mockMediaPlacements.delete(val1);
              resolve({ data: null, error: null });
            },
          }),
        }),
      }),
    } as any;
  }

  return originalFrom(table);
};

// Mock the transaction-backed primary-media RPC. Mutations happen only
// after all simulated checks pass, mirroring PostgreSQL transaction rollback.
(supabase as any).rpc = async (fn: string, args: Record<string, unknown>) => {
  if (fn !== 'set_product_primary_media') {
    return { data: null, error: { message: `Unexpected RPC: ${fn}` } };
  }
  if (forcePrimaryRpcError) {
    return { data: null, error: { message: 'Simulated atomic primary switch failure' } };
  }

  const productId = String(args.p_product_id);
  const mediaId = String(args.p_media_id);
  let relation = mockProductMedia.find(m => m.product_id === productId && m.media_id === mediaId);
  if (!args.p_create_link && !relation) {
    return { data: null, error: { message: 'Media asset is not linked to this product' } };
  }

  if (args.p_create_link && !relation) {
    relation = {
      product_id: productId,
      media_id: mediaId,
      sort_order: Number(args.p_sort_order ?? 0),
      is_primary: true,
    };
    mockProductMedia.push(relation);
  }

  for (const item of mockProductMedia) {
    if (item.product_id === productId) item.is_primary = item.media_id === mediaId;
  }
  if (relation) relation.is_primary = true;
  return { data: relation ? [{ ...relation }] : [], error: null };
};

// Test Runner
console.log('======================================================================');
console.log('HOEOS TEST SUITE: CMS MEDIA PIPELINE & PERSISTENT PLACEMENTS');
console.log('======================================================================\n');

let total = 0;
let passed = 0;

async function test(name: string, fn: () => Promise<void> | void) {
  total++;
  try {
    await fn();
    passed++;
    console.log(`  [PASS] ${name}`);
  } catch (err: unknown) {
    console.error(`  [FAIL] ${name}:`, err instanceof Error ? err.message : err);
    throw err;
  }
}

class MockFile extends Blob {
  name: string;

  constructor(name: string, size: number, type: string) {
    const signatures: Record<string, number[]> = {
      'image/jpeg': [0xff, 0xd8, 0xff, 0xe0],
      'image/png': [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
      'image/gif': [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
      'image/webp': [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50],
      'video/mp4': [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70],
      'video/webm': [0x1a, 0x45, 0xdf, 0xa3],
    };
    const bytes = new Uint8Array(Math.max(size, 1));
    const signature = signatures[type] ?? [];
    bytes.set(signature.slice(0, bytes.length));
    super([bytes], { type });
    this.name = name;
  }
}

// ----------------------------------------------------------------------------
// 1. Static Image Uploads (JPEG & PNG)
// ----------------------------------------------------------------------------
await test('1a. Static JPEG upload produces media_type=image, cp-public bucket, and persisted record', async () => {
  const file = new MockFile('citrus.jpg', 45000, 'image/jpeg') as unknown as File;
  const res = await mediaService.uploadAsset(file, { altText: 'Citrus Splash' });
  assert.equal(res.error, null);
  assert.ok(res.data);
  assert.equal(res.data.media_type, 'image');
  assert.equal(res.data.mime_type, 'image/jpeg');
  assert.equal(res.data.bucket, BUCKET_NAME);
  assert.equal(res.data.status, 'active');
  assert.equal(res.data.alt_text, 'Citrus Splash');
});

await test('1b. Static PNG upload produces canonical media asset', async () => {
  const file = new MockFile('splash_label.png', 68000, 'image/png') as unknown as File;
  const res = await mediaService.uploadAsset(file, { altText: 'Label Graphic' });
  assert.equal(res.error, null);
  assert.ok(res.data);
  assert.equal(res.data.media_type, 'image');
  assert.equal(res.data.mime_type, 'image/png');
  assert.equal(res.data.bucket, BUCKET_NAME);
});

// ----------------------------------------------------------------------------
// 2. GIF Upload & Animation Preservation
// ----------------------------------------------------------------------------
await test('2. GIF upload preserves animation (media_type=image, mime_type=image/gif)', async () => {
  const file = new MockFile('bottle_spin.gif', 85000, 'image/gif') as unknown as File;
  const res = await mediaService.uploadAsset(file, { altText: 'Spinning Cold Bottle' });
  assert.equal(res.error, null);
  assert.ok(res.data);
  // Rule: GIF must NEVER be saved as media_type='animation' in DB, only 'image'
  assert.equal(res.data.media_type, 'image');
  assert.equal(res.data.mime_type, 'image/gif');
});

// ----------------------------------------------------------------------------
// 3. Animated WebP Handling
// ----------------------------------------------------------------------------
await test('3. Animated WebP is accepted and classified as image/webp', async () => {
  const file = new MockFile('animated_pour.webp', 72000, 'image/webp') as unknown as File;
  const res = await mediaService.uploadAsset(file, { altText: 'Pouring WebP' });
  assert.equal(res.error, null);
  assert.ok(res.data);
  assert.equal(res.data.media_type, 'image');
  assert.equal(res.data.mime_type, 'image/webp');
});

// ----------------------------------------------------------------------------
// 4. Unsupported MIME Rejection
// ----------------------------------------------------------------------------
await test('4. Unsupported MIME types are rejected before storage write', async () => {
  const file = new MockFile('malicious.exe', 10000, 'application/x-msdownload') as unknown as File;
  const res = await mediaService.uploadAsset(file);
  assert.equal(res.data, null);
  assert.ok(res.error);
  assert.match(res.error, /unsupported/i);
});

// ----------------------------------------------------------------------------
// 5. Oversized Animation Policy (<100 KB target)
// ----------------------------------------------------------------------------
await test('5a. Oversized GIF (>100 KB) without allowOversizedAnimation is rejected with guidance', async () => {
  const file = new MockFile('huge_animation.gif', 250000, 'image/gif') as unknown as File;
  const res = await mediaService.uploadAsset(file, { allowOversizedAnimation: false });
  assert.equal(res.data, null);
  assert.ok(res.error);
  assert.match(res.error, /100 KB/i);
});

await test('5b. Oversized GIF (>100 KB) WITH allowOversizedAnimation is permitted as linked media', async () => {
  const file = new MockFile('authorized_large.gif', 250000, 'image/gif') as unknown as File;
  const res = await mediaService.uploadAsset(file, { allowOversizedAnimation: true });
  assert.equal(res.error, null);
  assert.ok(res.data);
  assert.equal(res.data.mime_type, 'image/gif');
});

// ----------------------------------------------------------------------------
// 6. Storage Upload Failure
// ----------------------------------------------------------------------------
await test('6. Storage upload failure returns structured error and aborts persistence', async () => {
  forceStorageError = true;
  const file = new MockFile('fail.jpg', 30000, 'image/jpeg') as unknown as File;
  const res = await mediaService.uploadAsset(file);
  forceStorageError = false;
  assert.equal(res.data, null);
  assert.ok(res.error);
  assert.match(res.error, /storage/i);
});

// ----------------------------------------------------------------------------
// 7. media_assets Insert Failure & Safe Compensation
// ----------------------------------------------------------------------------
await test('7. Ambiguous DB insert failure preserves uploaded Storage object for reconciliation', async () => {
  forceAssetInsertError = true;
  storageDeletions = [];
  const file = new MockFile('preserve-on-uncertain-insert.jpg', 30000, 'image/jpeg') as unknown as File;
  const res = await mediaService.uploadAsset(file);
  forceAssetInsertError = false;

  assert.equal(res.data, null);
  assert.ok(res.error);
  assert.match(res.error, /preserved for reconciliation/i);
  // The insert may have committed even when its response reports failure.
  // Never delete the Storage object until database state is independently reconciled.
  assert.equal(storageDeletions.length, 0, 'Storage must be preserved when asset-row persistence is unconfirmed');
});

// ----------------------------------------------------------------------------
// 8. Duplicate / Retry Prevention
// ----------------------------------------------------------------------------
await test('8. Re-uploading identical file returns existing asset without creating duplicate', async () => {
  const file = new MockFile('citrus.jpg', 45000, 'image/jpeg') as unknown as File;
  const res = await mediaService.uploadAsset(file);
  assert.equal(res.error, null);
  assert.ok(res.data);
  assert.equal(res.warning, 'Existing identical asset record reused');
});

// ----------------------------------------------------------------------------
// 9. Product Media Linking & Primary Assignment
// ----------------------------------------------------------------------------
let createdAssetId: string;
await test('9a. Link existing asset to product via linkAssetToProduct', async () => {
  const file = new MockFile('product_thumb.png', 50000, 'image/png') as unknown as File;
  const up = await mediaService.uploadAsset(file);
  assert.ok(up.data);
  createdAssetId = up.data.id;

  const linkRes = await mediaService.linkAssetToProduct(TEST_PRODUCT_ID, createdAssetId, false);
  assert.equal(linkRes.error, null);
  assert.ok(linkRes.data);
  assert.equal(linkRes.data.product_id, TEST_PRODUCT_ID);
  assert.equal(linkRes.data.media_id, createdAssetId);
  assert.equal(linkRes.data.is_primary, false);
});

await test('9b. Primary asset linking uses the atomic RPC and leaves exactly one primary', async () => {
  const linkRes = await mediaService.linkAssetToProduct(TEST_PRODUCT_ID, createdAssetId, true);
  assert.equal(linkRes.error, null);
  assert.ok(linkRes.data);
  assert.equal(linkRes.data.is_primary, true);
  assert.equal(linkRes.data.media_assets?.id, createdAssetId);
  assert.equal(linkRes.data.media_assets?.status, 'active');
  const primaries = mockProductMedia.filter(m => m.product_id === TEST_PRODUCT_ID && m.is_primary);
  assert.equal(primaries.length, 1);
  assert.equal(primaries[0].media_id, createdAssetId);
});

await test('9c. Failed atomic primary switch preserves the previous primary', async () => {
  const otherFile = new MockFile('alternate_primary.jpg', 12000, 'image/jpeg') as unknown as File;
  const otherAsset = await mediaService.uploadAsset(otherFile);
  assert.ok(otherAsset.data);
  const otherLink = await mediaService.linkAssetToProduct(TEST_PRODUCT_ID, otherAsset.data.id, true);
  assert.equal(otherLink.error, null);
  assert.equal(otherLink.data?.is_primary, true);

  forcePrimaryRpcError = true;
  const failedSwitch = await mediaService.setPrimaryMedia(TEST_PRODUCT_ID, createdAssetId);
  forcePrimaryRpcError = false;

  assert.equal(failedSwitch.success, false);
  assert.match(failedSwitch.error || '', /Simulated atomic primary switch failure/i);
  const primaries = mockProductMedia.filter(m => m.product_id === TEST_PRODUCT_ID && m.is_primary);
  assert.equal(primaries.length, 1);
  assert.equal(primaries[0].media_id, otherAsset.data.id);
});

// ----------------------------------------------------------------------------
// 10. Persistent Placements Engine: Homepage, Product Menu & 5 Sales Funnels
// ----------------------------------------------------------------------------
let heroPlacementId: string;
await test('10a. Create persistent placement for homepage_hero', async () => {
  const res = await placementService.createPlacement({
    media_id: createdAssetId,
    placement_key: 'hero_primary',
    scope_type: 'homepage_hero',
    sort_order: 1,
    active: true,
    alt_text_override: 'Homepage Hero Cold-Crafted Blend',
  });
  assert.equal(res.error, null);
  assert.ok(res.data);
  assert.equal(res.data.scope_type, 'homepage_hero');
  assert.equal(res.data.alt_text_override, 'Homepage Hero Cold-Crafted Blend');
  heroPlacementId = res.data.id;
});

await test('10b. Create persistent placement for product_menu', async () => {
  const res = await placementService.createPlacement({
    media_id: createdAssetId,
    placement_key: 'menu_spotlight',
    scope_type: 'product_menu',
    sort_order: 1,
    active: true,
  });
  assert.equal(res.error, null);
  assert.ok(res.data);
  assert.equal(res.data.scope_type, 'product_menu');
});

// ----------------------------------------------------------------------------
// 11. Create and Resolve Placements for all 5 Sales Funnels
// ----------------------------------------------------------------------------
const FIVE_FUNNELS = [
  'sports',
  'parties-events',
  'hotels-hospitality',
  'schools',
  'individuals',
];

for (const funnelSlug of FIVE_FUNNELS) {
  await test(`11. Sales funnel placement created and resolved for: ${funnelSlug}`, async () => {
    const key = `funnel_hero_${funnelSlug}`;
    const createRes = await placementService.createPlacement({
      media_id: createdAssetId,
      placement_key: key,
      scope_type: 'funnel_hero',
      scope_id: funnelSlug,
      sort_order: 1,
      active: true,
      alt_text_override: `Official ${funnelSlug} Commercial Supply`,
    });
    assert.equal(createRes.error, null);
    assert.ok(createRes.data);
    assert.equal(createRes.data.scope_id, funnelSlug);

    // Read resolution from placementService
    const resolved = await placementService.getPlacements('funnel_hero', funnelSlug);
    assert.ok(resolved.length > 0, `Funnel ${funnelSlug} should resolve its media placement`);
    assert.equal(resolved[0].scope_id, funnelSlug);
    assert.equal(resolved[0].media_id, createdAssetId);
  });
}

// ----------------------------------------------------------------------------
// 12. Placement Ordering and Active Toggling
// ----------------------------------------------------------------------------
await test('12a. Toggle placement active status (deactivate)', async () => {
  const updateRes = await placementService.updatePlacement(heroPlacementId, { active: false });
  assert.equal(updateRes.error, null);
  assert.equal(updateRes.data?.active, false);

  // Active-only read should not include deactivated placement
  const activeOnly = await placementService.getPlacements('homepage_hero', undefined, true);
  const found = activeOnly.find(p => p.id === heroPlacementId);
  assert.equal(found, undefined, 'Deactivated placement must not appear in active storefront query');

  // Reactivate
  await placementService.updatePlacement(heroPlacementId, { active: true });
});

await test('12b. Delete placement removes placement without deleting shared media asset', async () => {
  const tempPlacement = await placementService.createPlacement({
    media_id: createdAssetId,
    placement_key: 'temp_to_delete',
    scope_type: 'homepage_carousel',
    active: true,
  });
  assert.ok(tempPlacement.data);
  const tempId = tempPlacement.data.id;

  const delRes = await placementService.deletePlacement(tempId);
  assert.equal(delRes.success, true);

  // Assert media asset still exists
  assert.ok(mockMediaAssets.has(createdAssetId), 'Underlying media asset must be preserved when placement is deleted');
});

// ----------------------------------------------------------------------------
// 13. Public Reads Restricted to Active Approved Media in cp-public
// ----------------------------------------------------------------------------
await test('13. Public read filter excludes non-approved buckets or inactive assets', async () => {
  // Add an asset with bucket != 'cp-public'
  const foreignAsset: MediaAsset = {
    id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    tenant_id: TENANT_ID,
    bucket: 'private-ugc',
    path: 'secret.jpg',
    media_type: 'image',
    mime_type: 'image/jpeg',
    filename: 'secret.jpg',
    size_bytes: 1000,
    width: null,
    height: null,
    duration_seconds: null,
    alt_text: null,
    caption: null,
    status: 'active',
    uploaded_by: null,
    created_at: new Date().toISOString(),
  };
  mockMediaAssets.set(foreignAsset.id, foreignAsset);

  const foreignPlacement = await placementService.createPlacement({
    media_id: foreignAsset.id,
    placement_key: 'foreign_key',
    scope_type: 'homepage_hero',
    active: true,
  });
  assert.ok(foreignPlacement.data);

  // Storefront read with activeOnly must reject the foreign bucket asset
  const publicPlacements = await placementService.getPlacements('homepage_hero', undefined, true);
  const leaked = publicPlacements.find(p => p.media_id === foreignAsset.id);
  assert.equal(leaked, undefined, 'Public reads must never expose assets outside cp-public bucket');
});

// ----------------------------------------------------------------------------
// 15. Cross-Tenant Denial: Media Assets, Campaigns, and Sales Journeys
// ----------------------------------------------------------------------------
await test('15a. Cross-tenant denial: Reject media asset belonging to a different tenant', async () => {
  const otherTenantAsset: MediaAsset = {
    id: '88888888-8888-8888-8888-888888888888',
    tenant_id: OTHER_TENANT_ID,
    bucket: 'cp-public',
    path: `media/${OTHER_TENANT_ID}/alien.png`,
    media_type: 'image',
    mime_type: 'image/png',
    filename: 'alien.png',
    size_bytes: 2048,
    width: null,
    height: null,
    duration_seconds: null,
    alt_text: 'Alien Asset',
    caption: null,
    status: 'active',
    uploaded_by: null,
    created_at: new Date().toISOString(),
  };
  mockMediaAssets.set(otherTenantAsset.id, otherTenantAsset);

  const res = await placementService.createPlacement({
    media_id: otherTenantAsset.id,
    placement_key: 'cross_tenant_test',
    scope_type: 'homepage_hero',
  });

  assert.equal(res.data, null);
  assert.ok(res.error);
  assert.match(res.error, /cross-tenant assignment denied/i);
});

await test('15b. Cross-tenant denial: Reject campaign belonging to a different tenant', async () => {
  const otherCampaignId = '77777777-7777-7777-7777-777777777777';
  mockCampaigns.set(otherCampaignId, {
    id: otherCampaignId,
    tenant_id: OTHER_TENANT_ID,
    name: 'Alien Promo Campaign',
  });

  const res = await placementService.createPlacement({
    media_id: createdAssetId,
    placement_key: 'cross_campaign_test',
    scope_type: 'campaign',
    scope_id: otherCampaignId,
  });

  assert.equal(res.data, null);
  assert.ok(res.error);
  assert.match(res.error, /cross-tenant assignment denied/i);
});

await test('15c. Cross-tenant denial: Reject sales journey belonging to a different tenant', async () => {
  const otherJourneyId = '66666666-6666-6666-6666-666666666666';
  mockSalesJourneys.set(otherJourneyId, {
    id: otherJourneyId,
    tenant_id: OTHER_TENANT_ID,
    name: 'Alien Onboarding Journey',
  });

  const res = await placementService.createPlacement({
    media_id: createdAssetId,
    placement_key: 'cross_journey_test',
    scope_type: 'sales_journey',
    scope_id: otherJourneyId,
  });

  assert.equal(res.data, null);
  assert.ok(res.error);
  assert.match(res.error, /cross-tenant assignment denied/i);
});

// ----------------------------------------------------------------------------
// 16. Scoped Storage Upload Paths Reconciled with Phase 2 Storage Policy
// ----------------------------------------------------------------------------
await test('16a. Standalone asset upload strictly uses media/{tenant_id}/ namespace with exact folder depth 2', async () => {
  const file = new MockFile('hp_hero.webp', 20000, 'image/webp') as unknown as File;
  const res = await mediaService.uploadAsset(file);
  assert.equal(res.error, null);
  assert.ok(res.data);
  assert.match(res.data.path, new RegExp(`^media\\/${TENANT_ID}\\/`));

  // Validate exact folder depth = 2 (folder segments ['media', TENANT_ID])
  const pathParts = res.data.path.split('/');
  assert.equal(pathParts.length, 3, 'Path must be media/{tenant_id}/{filename} with exactly 2 folder segments');
  assert.equal(pathParts[0], 'media');
  assert.equal(pathParts[1], TENANT_ID);
});

await test('16b. Product media upload strictly preserves products/{productId}/ namespace with exact folder depth 2', async () => {
  const file = new MockFile('prod_asset.png', 15000, 'image/png') as unknown as File;
  const res = await mediaService.uploadMedia(TEST_PRODUCT_ID, file, 'image', 'Test Product Image', false);
  assert.equal(res.error, null);
  assert.ok(res.data);
  const asset = res.data.media_assets;
  assert.ok(asset);
  assert.match(asset.path, new RegExp(`^products\\/${TEST_PRODUCT_ID}\\/`));

  const pathParts = asset.path.split('/');
  assert.equal(pathParts.length, 3, 'Product path must be products/{productId}/{filename} with exactly 2 folder segments');
  assert.equal(pathParts[0], 'products');
  assert.equal(pathParts[1], TEST_PRODUCT_ID);
});

await test('16c. Storage upload path with non-media/{tenant_id} prefix is strictly rejected', async () => {
  const file = new MockFile('attack.png', 10000, 'image/png') as unknown as File;
  const res = await mediaService.uploadAsset(file, { targetPathPrefix: 'unauthorized_folder' });
  assert.equal(res.data, null);
  assert.ok(res.error);
  assert.match(res.error, /Phase 2 Storage policy strictly requires/i);
});

await test('16d. Storage upload path with unapproved namespace (e.g. homepage/) is rejected in Phase 2', async () => {
  const file = new MockFile('direct_hp.png', 10000, 'image/png') as unknown as File;
  const res = await mediaService.uploadAsset(file, { targetPathPrefix: 'homepage/hero' });
  assert.equal(res.data, null);
  assert.ok(res.error);
  assert.match(res.error, /Phase 2 Storage policy strictly requires/i);
});

// ----------------------------------------------------------------------------
// 17. Database Persistence Failure: Explicit Failure, Zero In-Memory Fakes
// ----------------------------------------------------------------------------
await test('17. Persistence failure returns explicit failure state without in-memory publishing', async () => {
  forcePlacementInsertError = true;
  const res = await placementService.createPlacement({
    media_id: createdAssetId,
    placement_key: 'fail_placement',
    scope_type: 'homepage_hero',
  });
  forcePlacementInsertError = false;

  assert.equal(res.data, null);
  assert.ok(res.error);
  assert.match(res.error, /(database write failed|simulated media_placements db insert failure)/i);
  // Prove that failed persistence did not leave any record in placements store
  const allPlacements = await placementService.getAllPlacements();
  const leaked = allPlacements.find(p => p.placement_key === 'fail_placement');
  assert.equal(leaked, undefined, 'Failed persistence must never leave unpersisted record in store');
});

// ----------------------------------------------------------------------------
// 18. Reload-Based Publication Verification
// ----------------------------------------------------------------------------
await test('18. Reload verification failure aborts publication with explicit error', async () => {
  forcePlacementReloadError = true;
  const res = await placementService.createPlacement({
    media_id: createdAssetId,
    placement_key: 'unverified_placement',
    scope_type: 'homepage_hero',
  });
  forcePlacementReloadError = false;

  assert.equal(res.data, null);
  assert.ok(res.error);
  assert.match(res.error, /publication verification failed/i);
});

console.log('\n======================================================================');
console.log(`HOEOS TEST SUMMARY: ${passed}/${total} TESTS PASSED`);
console.log('======================================================================\n');

try {
  supabase.auth.stopAutoRefresh();
  await supabase.removeAllChannels();
  supabase.realtime.disconnect();
} catch {}
process.exit(0);
