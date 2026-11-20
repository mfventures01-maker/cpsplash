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

// 2. Import service and validation helpers
const {
  mediaService,
  validateAndClassifyMedia,
  isValidUuid,
  BUCKET_NAME,
  MAX_FILE_SIZE_BYTES,
} = await import('../src/services/mediaService');

const { supabase, TENANT_ID } = await import('../src/lib/supabase');

class MockFile {
  name: string;
  size: number;
  type: string;
  constructor(name: string, size: number, type: string) {
    this.name = name;
    this.size = size;
    this.type = type;
  }
  slice(): { arrayBuffer: () => Promise<ArrayBuffer> } {
    const signatures: Record<string, number[]> = {
      'image/jpeg': [0xff, 0xd8, 0xff, 0xdb],
      'image/png': [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
      'image/webp': [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50],
      'image/gif': [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
      'video/mp4': [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70],
      'video/webm': [0x1a, 0x45, 0xdf, 0xa3],
    };
    const bytes = Uint8Array.from(signatures[this.type] || []);
    return { arrayBuffer: async () => bytes.buffer as ArrayBuffer };
  }
}

class MockBlob {
  size: number;
  type: string;
  constructor(size: number, type: string) {
    this.size = size;
    this.type = type;
  }
}

console.log('======================================================================');
console.log('HOEOS TEST SUITE: MEDIA CONTRACT, UPLOAD INTEGRITY & FAILURE RECOVERY');
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

// ----------------------------------------------------------------------------
// SECTION A: Pure Classification Tests
// ----------------------------------------------------------------------------
console.log('--- SECTION A: PURE CLASSIFICATION TESTS ---');

// 1. Six canonical formats
runTest('Format 1: JPEG (.jpg, .jpeg)', () => {
  const file1 = new MockFile('bottle.jpg', 1024, 'image/jpeg') as unknown as File;
  const res1 = validateAndClassifyMedia(file1);
  assert.equal(res1.isValid, true);
  assert.equal(res1.mimeType, 'image/jpeg');
  assert.equal(res1.mediaType, 'image');
  assert.equal(res1.editorCategory, 'image');

  const file2 = new MockFile('bottle.jpeg', 1024, 'image/jpeg') as unknown as File;
  const res2 = validateAndClassifyMedia(file2);
  assert.equal(res2.isValid, true);
  assert.equal(res2.mimeType, 'image/jpeg');
  assert.equal(res2.mediaType, 'image');
});

runTest('Format 2: PNG (.png)', () => {
  const file = new MockFile('splash.png', 2048, 'image/png') as unknown as File;
  const res = validateAndClassifyMedia(file);
  assert.equal(res.isValid, true);
  assert.equal(res.mimeType, 'image/png');
  assert.equal(res.mediaType, 'image');
  assert.equal(res.editorCategory, 'image');
});

runTest('Format 3: WebP (.webp)', () => {
  const file = new MockFile('hero.webp', 1500, 'image/webp') as unknown as File;
  const res = validateAndClassifyMedia(file);
  assert.equal(res.isValid, true);
  assert.equal(res.mimeType, 'image/webp');
  assert.equal(res.mediaType, 'image');
  assert.equal(res.editorCategory, 'image');
});

runTest('Format 4: GIF (.gif) preserves image media_type while classifying as animation', () => {
  const file = new MockFile('orbit.gif', 3000, 'image/gif') as unknown as File;
  const res = validateAndClassifyMedia(file);
  assert.equal(res.isValid, true);
  assert.equal(res.mimeType, 'image/gif');
  assert.equal(res.mediaType, 'image', 'GIF must be stored as image so HTML <img> renders it');
  assert.equal(res.editorCategory, 'animation', 'GIF editor category must be animation');
});

runTest('Format 5: MP4 (.mp4)', () => {
  const file = new MockFile('flow.mp4', 5000, 'video/mp4') as unknown as File;
  const res = validateAndClassifyMedia(file);
  assert.equal(res.isValid, true);
  assert.equal(res.mimeType, 'video/mp4');
  assert.equal(res.mediaType, 'video');
  assert.equal(res.editorCategory, 'video');
});

runTest('Format 6: WebM (.webm)', () => {
  const file = new MockFile('pour.webm', 4500, 'video/webm') as unknown as File;
  const res = validateAndClassifyMedia(file);
  assert.equal(res.isValid, true);
  assert.equal(res.mimeType, 'video/webm');
  assert.equal(res.mediaType, 'video');
  assert.equal(res.editorCategory, 'video');
});

// 2. Uppercase extensions
runTest('Uppercase extensions (.JPG, .PNG, .MP4)', () => {
  const f1 = new MockFile('HERO.JPG', 1000, 'image/jpeg') as unknown as File;
  const r1 = validateAndClassifyMedia(f1);
  assert.equal(r1.isValid, true);
  assert.equal(r1.mimeType, 'image/jpeg');

  const f2 = new MockFile('ANIMATION.GIF', 1000, 'image/gif') as unknown as File;
  const r2 = validateAndClassifyMedia(f2);
  assert.equal(r2.isValid, true);
  assert.equal(r2.mimeType, 'image/gif');

  const f3 = new MockFile('LOOP.MP4', 1000, 'video/mp4') as unknown as File;
  const r3 = validateAndClassifyMedia(f3);
  assert.equal(r3.isValid, true);
  assert.equal(r3.mediaType, 'video');
});

// 3. Missing MIME type on File
runTest('Missing MIME type on File infers canonical MIME from supported extension', () => {
  const f1 = new MockFile('product_photo.jpg', 1000, '') as unknown as File;
  const r1 = validateAndClassifyMedia(f1);
  assert.equal(r1.isValid, true);
  assert.equal(r1.mimeType, 'image/jpeg');

  const f2 = new MockFile('animation.gif', 1000, '') as unknown as File;
  const r2 = validateAndClassifyMedia(f2);
  assert.equal(r2.isValid, true);
  assert.equal(r2.mimeType, 'image/gif');
});

// 4. Contradictory extension and MIME type
runTest('Contradictory extension and MIME type is rejected', () => {
  const f1 = new MockFile('spoof.png', 1000, 'image/jpeg') as unknown as File;
  const r1 = validateAndClassifyMedia(f1);
  assert.equal(r1.isValid, false);
  assert.match(r1.error || '', /Contradictory/i);

  const f2 = new MockFile('bad.gif', 1000, 'video/mp4') as unknown as File;
  const r2 = validateAndClassifyMedia(f2);
  assert.equal(r2.isValid, false);
  assert.match(r2.error || '', /Contradictory/i);
});

// 5. Unsupported file types
runTest('Unsupported file extensions and MIME types are rejected', () => {
  const f1 = new MockFile('malicious.exe', 1000, 'application/x-msdownload') as unknown as File;
  const r1 = validateAndClassifyMedia(f1);
  assert.equal(r1.isValid, false);
  assert.match(r1.error || '', /Unsupported/i);

  const f2 = new MockFile('vector.svg', 1000, 'image/svg+xml') as unknown as File;
  const r2 = validateAndClassifyMedia(f2);
  assert.equal(r2.isValid, false);
  assert.match(r2.error || '', /Unsupported/i);
});

// 6. Empty files
runTest('Empty files (0 bytes) are rejected', () => {
  const f1 = new MockFile('empty.jpg', 0, 'image/jpeg') as unknown as File;
  const r1 = validateAndClassifyMedia(f1);
  assert.equal(r1.isValid, false);
  assert.match(r1.error || '', /empty/i);
});

// 7. File size limits (Bucket limit 30 MB = 31457280 bytes)
runTest('File size boundary checks (below, at, and above 30 MB)', () => {
  const justBelow = new MockFile('big.mp4', MAX_FILE_SIZE_BYTES - 1, 'video/mp4') as unknown as File;
  const r1 = validateAndClassifyMedia(justBelow);
  assert.equal(r1.isValid, true);

  const exactlyAt = new MockFile('exact.mp4', MAX_FILE_SIZE_BYTES, 'video/mp4') as unknown as File;
  const r2 = validateAndClassifyMedia(exactlyAt);
  assert.equal(r2.isValid, true);

  const justAbove = new MockFile('too_big.mp4', MAX_FILE_SIZE_BYTES + 1, 'video/mp4') as unknown as File;
  const r3 = validateAndClassifyMedia(justAbove);
  assert.equal(r3.isValid, false);
  assert.match(r3.error || '', /exceeds bucket limit/i);
});

// 8. Blob inputs without a File name
runTest('Blob inputs with explicit supported MIME types are handled cleanly', () => {
  const blobJpg = new MockBlob(500, 'image/jpeg') as unknown as Blob;
  const r1 = validateAndClassifyMedia(blobJpg);
  assert.equal(r1.isValid, true);
  assert.equal(r1.mimeType, 'image/jpeg');
  assert.equal(r1.cleanFileName, 'upload.jpg');

  const blobGif = new MockBlob(800, 'image/gif') as unknown as Blob;
  const r2 = validateAndClassifyMedia(blobGif);
  assert.equal(r2.isValid, true);
  assert.equal(r2.editorCategory, 'animation');
  assert.equal(r2.mediaType, 'image');

  const blobEmptyMime = new MockBlob(500, '') as unknown as Blob;
  const r3 = validateAndClassifyMedia(blobEmptyMime);
  assert.equal(r3.isValid, false);
  assert.match(r3.error || '', /MIME type is required/i);
});

// 9. UUID validation
runTest('UUID syntax validation helper', () => {
  assert.equal(isValidUuid('d3b07384-d113-4045-812e-1317e0892095'), true);
  assert.equal(isValidUuid('not-a-uuid'), false);
  assert.equal(isValidUuid(''), false);
  assert.equal(isValidUuid('12345'), false);
});

// ----------------------------------------------------------------------------
// SECTION B: Upload Metadata & Call Chain Tests
// ----------------------------------------------------------------------------
console.log('\n--- SECTION B: UPLOAD METADATA TESTS ---');

const VALID_PRODUCT_ID = '11111111-2222-3333-4444-555555555555';

interface StorageUploadCall {
  bucket: string;
  path: string;
  options?: { contentType?: string; upsert?: boolean };
}

interface DbInsertCall {
  table: string;
  record: Record<string, unknown>;
}

interface CleanupCall {
  type: 'storage' | 'media_assets';
  target: string;
}

function createSupabaseMock(options: {
  productResult?: { data: Record<string, unknown> | null; error: unknown | null };
  storageUploadError?: unknown | null;
  assetInsertError?: unknown | null;
  sortOrderResult?: { data: Array<{ sort_order: number }> | null; error: unknown | null };
  clearPrimaryError?: unknown | null;
  linkInsertError?: unknown | null;
  existingRefs?: Array<{ product_id: string }> | null;
  referenceQueryError?: unknown | null;
  assetDeleteError?: unknown | null;
  assetDeleteRows?: Array<{ id: string }> | null;
  storageRemoveError?: unknown | null;
  storageRemoveData?: Array<{ name?: string }> | null;
  primaryRpcError?: unknown | null;
}) {
  const storageObjects = new Map<string, Blob>();
  const calls = {
    storageUploads: [] as StorageUploadCall[],
    storageRemovals: [] as string[],
    dbInserts: [] as DbInsertCall[],
    dbUpdates: [] as Array<{ table: string; values: Record<string, unknown> }>,
    dbDeletes: [] as Array<{ table: string; id: string }>,
    rpcCalls: [] as Array<{ name: string; args: Record<string, unknown> }>,
  };

  const mockClient = {
    rpc: async (name: string, args: Record<string, unknown>) => {
      calls.rpcCalls.push({ name, args });
      if (name === 'reorder_product_media') {
        if (options.primaryRpcError) return { data: null, error: options.primaryRpcError };
        return { data: Array.isArray(args.p_media_ids) ? args.p_media_ids.length : 0, error: null };
      }
      if (options.primaryRpcError) {
        return { data: null, error: options.primaryRpcError };
      }
      return {
        data: [{
          product_id: args.p_product_id,
          media_id: args.p_media_id,
          sort_order: args.p_sort_order ?? 3,
          is_primary: true,
          created_at: new Date().toISOString(),
        }],
        error: null,
      };
    },
    storage: {
      from: (bucketName: string) => ({
        upload: async (path: string, _file: unknown, opts: { contentType?: string; upsert?: boolean }) => {
          calls.storageUploads.push({ bucket: bucketName, path, options: opts });
          if (options.storageUploadError) {
            return { data: null, error: options.storageUploadError };
          }
          const fileSize = Number((_file as { size?: number })?.size || 0);
          storageObjects.set(path, new Blob([new Uint8Array(fileSize)], { type: opts.contentType }));
          return { data: { path }, error: null };
        },
        download: async (path: string) => ({
          data: storageObjects.get(path) || null,
          error: storageObjects.has(path) ? null : { message: 'Mock Storage object not found' },
        }),
        remove: async (paths: string[]) => {
          calls.storageRemovals.push(...paths);
          if (options.storageRemoveError) {
            return { data: null, error: options.storageRemoveError };
          }
          const data = options.storageRemoveData !== undefined
            ? options.storageRemoveData
            : paths.map((path) => ({ name: path }));
          return { data, error: null };
        },
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `https://mock.supabase.co/storage/v1/object/public/${bucketName}/${path}` }
        })
      })
    },
    from: (table: string) => {
      const queryState: Record<string, unknown> = {};

      const builder: any = {
        select: (_cols?: string) => builder,
        eq: (col: string, val: unknown) => {
          queryState[col] = val;
          return builder;
        },
        order: (_col: string, _opts: unknown) => builder,
        single: async () => {
          if (table === 'products') {
            if (options.productResult !== undefined) return options.productResult;
            return { data: { id: VALID_PRODUCT_ID, tenant_id: TENANT_ID }, error: null };
          }
          if (table === 'media_assets') {
            if (options.assetInsertError) {
              return { data: null, error: options.assetInsertError };
            }
            return {
              data: {
                id: 'asset-uuid-999',
                ...((queryState.insertedRecord as Record<string, unknown>) || {}),
              },
              error: null
            };
          }
          if (table === 'product_media') {
            if (options.linkInsertError) return { data: null, error: options.linkInsertError };
            return {
              data: {
                id: 'link-uuid-888',
                ...((queryState.insertedRecord as Record<string, unknown>) || {}),
                media_assets: queryState.insertedRecord,
              },
              error: null
            };
          }
          return { data: null, error: null };
        },
        insert: (record: Record<string, unknown>) => {
          calls.dbInserts.push({ table, record });
          queryState.insertedRecord = record;
          return builder;
        },
        update: (values: Record<string, unknown>) => {
          calls.dbUpdates.push({ table, values });
          if (table === 'product_media' && values.is_primary === false && options.clearPrimaryError) {
            return { eq: () => Promise.resolve({ error: options.clearPrimaryError }) };
          }
          return { eq: () => Promise.resolve({ error: null }) };
        },
        delete: () => {
          queryState.isDelete = true;
          return builder;
        },
        then: (resolve: (val: unknown) => void) => {
          if (queryState.isDelete === true) {
            const id = String(queryState.id ?? '');
            calls.dbDeletes.push({ table, id });
            if (table === 'media_assets') {
              if (options.assetDeleteError) {
                resolve({ data: null, error: options.assetDeleteError });
                return;
              }
              const rows = options.assetDeleteRows !== undefined
                ? options.assetDeleteRows
                : [{ id }];
              resolve({ data: rows, error: null });
              return;
            }
            resolve({ data: [], error: null });
            return;
          }

          if (table === 'product_media') {
            if (queryState.media_id) {
              resolve({
                data: options.existingRefs !== undefined ? options.existingRefs : [],
                error: options.referenceQueryError ?? null
              });
              return;
            }
            if (options.sortOrderResult) {
              resolve(options.sortOrderResult);
              return;
            }
            resolve({ data: [{ sort_order: 2 }], error: null });
            return;
          }
          resolve({ data: [], error: null });
        }
      };

      return builder;
    }
  };

  return { mockClient, calls };
}
// Helper to replace supabase client temporarily
const originalFrom = supabase.from.bind(supabase);
const originalRpc = supabase.rpc.bind(supabase);
const originalStorage = supabase.storage;

async function withMockedSupabase(
  mock: ReturnType<typeof createSupabaseMock>['mockClient'],
  fn: () => Promise<void>
) {
  (supabase as unknown as { from: unknown }).from = mock.from;
  (supabase as unknown as { rpc: unknown }).rpc = mock.rpc;
  (supabase as unknown as { storage: unknown }).storage = mock.storage;
  try {
    await fn();
  } finally {
    (supabase as unknown as { from: unknown }).from = originalFrom;
    (supabase as unknown as { rpc: unknown }).rpc = originalRpc;
    (supabase as unknown as { storage: unknown }).storage = originalStorage;
  }
}

await runTest('Metadata test: Upload WebP creates exact canonical metadata', async () => {
  const { mockClient, calls } = createSupabaseMock({});
  await withMockedSupabase(mockClient, async () => {
    const file = new MockFile('hero_specimen.webp', 2048, 'image/webp') as unknown as File;
    const res = await mediaService.uploadMedia(VALID_PRODUCT_ID, file, 'image', 'Artisanal Hero', true);

    assert.equal(res.error, null);
    assert.ok(res.data);

    // Verify storage upload
    assert.equal(calls.storageUploads.length, 1);
    assert.equal(calls.storageUploads[0].bucket, BUCKET_NAME);
    assert.ok(calls.storageUploads[0].path.startsWith(`products/${VALID_PRODUCT_ID}/`));
    assert.equal(calls.storageUploads[0].options?.contentType, 'image/webp');

    // Verify media_assets insert
    const assetCall = calls.dbInserts.find(c => c.table === 'media_assets');
    assert.ok(assetCall);
    assert.equal(assetCall.record.tenant_id, TENANT_ID);
    assert.equal(assetCall.record.bucket, BUCKET_NAME);
    assert.equal(assetCall.record.media_type, 'image');
    assert.equal(assetCall.record.mime_type, 'image/webp');
    assert.equal(assetCall.record.filename, 'hero_specimen.webp');
    assert.equal(assetCall.record.size_bytes, 2048);
    assert.equal(assetCall.record.status, 'active');

    // Verify atomic product_media link + primary switch RPC
    assert.equal(calls.rpcCalls.length, 1);
    assert.equal(calls.rpcCalls[0].name, 'set_product_primary_media');
    assert.equal(calls.rpcCalls[0].args.p_product_id, VALID_PRODUCT_ID);
    assert.equal(calls.rpcCalls[0].args.p_media_id, res.data.media_id);
    assert.equal(calls.rpcCalls[0].args.p_create_link, true);
    assert.equal(calls.rpcCalls[0].args.p_sort_order, 3); // 2 + 1 from mock
    assert.equal(res.data.is_primary, true);
    assert.equal(res.data.media_assets?.id, 'asset-uuid-999');
    assert.equal(res.data.media_assets?.filename, 'hero_specimen.webp');
  });
});

await runTest('Metadata test: Upload GIF preserves image media_type with image/gif MIME', async () => {
  const { mockClient, calls } = createSupabaseMock({});
  await withMockedSupabase(mockClient, async () => {
    const file = new MockFile('animation.gif', 4096, 'image/gif') as unknown as File;
    const res = await mediaService.uploadMedia(VALID_PRODUCT_ID, file, 'animation', 'Orbit Animation', false);

    assert.equal(res.error, null);
    const assetCall = calls.dbInserts.find(c => c.table === 'media_assets');
    assert.ok(assetCall);
    assert.equal(assetCall.record.media_type, 'image', 'GIF must be stored as image');
    assert.equal(assetCall.record.mime_type, 'image/gif');
  });
});

await runTest('Metadata test: Upload MP4 sets media_type to video', async () => {
  const { mockClient, calls } = createSupabaseMock({});
  await withMockedSupabase(mockClient, async () => {
    const file = new MockFile('pour_loop.mp4', 8192, 'video/mp4') as unknown as File;
    const res = await mediaService.uploadMedia(VALID_PRODUCT_ID, file, 'video', 'Serving Loop', false);

    assert.equal(res.error, null);
    const assetCall = calls.dbInserts.find(c => c.table === 'media_assets');
    assert.ok(assetCall);
    assert.equal(assetCall.record.media_type, 'video');
    assert.equal(assetCall.record.mime_type, 'video/mp4');
  });
});

// ----------------------------------------------------------------------------
// SECTION C: Failure & Safe Compensation Tests
// ----------------------------------------------------------------------------
console.log('\n--- SECTION C: FAILURE & COMPENSATION TESTS ---');

await runTest('Failure 1: Product lookup fails -> no storage or DB insert', async () => {
  const { mockClient, calls } = createSupabaseMock({
    productResult: { data: null, error: { message: 'Database unreachable' } }
  });
  await withMockedSupabase(mockClient, async () => {
    const file = new MockFile('test.jpg', 1000, 'image/jpeg') as unknown as File;
    const res = await mediaService.uploadMedia(VALID_PRODUCT_ID, file);
    assert.equal(res.data, null);
    assert.match(res.error || '', /Database unreachable|Product lookup failed/i);
    assert.equal(calls.storageUploads.length, 0);
    assert.equal(calls.dbInserts.length, 0);
  });
});

await runTest('Failure 2: Product belongs to different tenant -> rejected before upload', async () => {
  const { mockClient, calls } = createSupabaseMock({
    productResult: { data: { id: VALID_PRODUCT_ID, tenant_id: 'FOREIGN-TENANT-UUID' }, error: null }
  });
  await withMockedSupabase(mockClient, async () => {
    const file = new MockFile('test.jpg', 1000, 'image/jpeg') as unknown as File;
    const res = await mediaService.uploadMedia(VALID_PRODUCT_ID, file);
    assert.equal(res.data, null);
    assert.match(res.error || '', /belongs to tenant/i);
    assert.equal(calls.storageUploads.length, 0);
  });
});

await runTest('Failure 2b: Signature mismatch is rejected before product lookup or Storage upload', async () => {
  const { mockClient, calls } = createSupabaseMock({});
  await withMockedSupabase(mockClient, async () => {
    const jpegBytes = Uint8Array.from([0xff, 0xd8, 0xff, 0x00]);
    const spoofedGif = {
      name: 'spoofed.gif',
      size: jpegBytes.byteLength,
      type: 'image/gif',
      slice: () => ({ arrayBuffer: async () => jpegBytes.buffer as ArrayBuffer }),
    } as unknown as File;
    const res = await mediaService.uploadMedia(VALID_PRODUCT_ID, spoofedGif);
    assert.equal(res.data, null);
    assert.match(res.error || '', /signature mismatch/i);
    assert.equal(calls.storageUploads.length, 0);
    assert.equal(calls.dbInserts.length, 0);
  });
});

await runTest('Failure 3: Storage upload fails -> no media_assets record created', async () => {
  const { mockClient, calls } = createSupabaseMock({
    storageUploadError: { message: 'Storage bucket quota exceeded' }
  });
  await withMockedSupabase(mockClient, async () => {
    const file = new MockFile('test.jpg', 1000, 'image/jpeg') as unknown as File;
    const res = await mediaService.uploadMedia(VALID_PRODUCT_ID, file);
    assert.equal(res.data, null);
    assert.match(res.error || '', /Storage bucket quota exceeded|Storage upload failed/i);
    assert.equal(calls.dbInserts.length, 0);
  });
});

await runTest('Failure 4: media_assets insert fails -> preserve Storage when persistence is unconfirmed', async () => {
  const { mockClient, calls } = createSupabaseMock({
    assetInsertError: { message: 'Unique constraint violation on media_assets' }
  });
  await withMockedSupabase(mockClient, async () => {
    const file = new MockFile('test.jpg', 1000, 'image/jpeg') as unknown as File;
    const res = await mediaService.uploadMedia(VALID_PRODUCT_ID, file);
    assert.equal(res.data, null);
    assert.match(res.error || '', /Unique constraint violation|Failed to create media asset/i);
    assert.equal(calls.storageUploads.length, 1);
    assert.equal(calls.storageRemovals.length, 0, 'Storage must be preserved when asset-row persistence is unconfirmed');
  });
});

await runTest('Failure 5: product_media link insert fails -> cleans unreferenced asset & storage', async () => {
  const { mockClient, calls } = createSupabaseMock({
    linkInsertError: { message: 'Foreign key error linking product_media' },
    existingRefs: [] // No other product references this asset
  });
  await withMockedSupabase(mockClient, async () => {
    const file = new MockFile('test.jpg', 1000, 'image/jpeg') as unknown as File;
    const res = await mediaService.uploadMedia(VALID_PRODUCT_ID, file);
    assert.equal(res.data, null);
    assert.match(res.error || '', /Foreign key error|Failed to link/i);
    assert.equal(calls.storageRemovals.length, 1);
    const assetDelete = calls.dbDeletes.find(d => d.table === 'media_assets');
    assert.ok(assetDelete, 'media_assets row must be cleaned up when unreferenced');
  });
});

await runTest('Failure 6: Preservation rule -> if asset is referenced elsewhere, it is NEVER deleted', async () => {
  const { mockClient, calls } = createSupabaseMock({
    linkInsertError: { message: 'Insert conflict' },
    existingRefs: [{ product_id: 'another-product-id' }] // Asset IS referenced elsewhere!
  });
  await withMockedSupabase(mockClient, async () => {
    const file = new MockFile('test.jpg', 1000, 'image/jpeg') as unknown as File;
    const res = await mediaService.uploadMedia(VALID_PRODUCT_ID, file);
    assert.equal(res.data, null);
    assert.equal(calls.dbDeletes.length, 0, 'Must NOT delete asset referenced by another product');
    assert.equal(calls.storageRemovals.length, 0, 'Must NOT delete storage object referenced by another product');
  });
});

await runTest('Failure 7: Atomic primary RPC fails -> aborts and safely compensates the unlinked asset', async () => {
  const { mockClient, calls } = createSupabaseMock({
    primaryRpcError: { message: 'RLS authorization denied by atomic primary RPC' },
    existingRefs: []
  });
  await withMockedSupabase(mockClient, async () => {
    const file = new MockFile('test.jpg', 1000, 'image/jpeg') as unknown as File;
    const res = await mediaService.uploadMedia(VALID_PRODUCT_ID, file, 'image', '', true);
    assert.equal(res.data, null);
    assert.match(res.error || '', /RLS authorization denied by atomic primary RPC/i);
    assert.equal(calls.rpcCalls.length, 1);
    assert.equal(calls.rpcCalls[0].name, 'set_product_primary_media');
    assert.equal(calls.storageRemovals.length, 1);
  });
});

// ----------------------------------------------------------------------------
// SECTION C2: Cleanup Integrity Failure Paths (mock-only)
// ----------------------------------------------------------------------------
console.log('\n--- SECTION C2: CLEANUP INTEGRITY FAILURE PATHS ---');

await runTest('Cleanup: reference query error preserves asset row and Storage', async () => {
  const { mockClient, calls } = createSupabaseMock({
    linkInsertError: { message: 'Simulated link failure' },
    referenceQueryError: { message: 'Reference query unavailable' },
    existingRefs: null
  });
  await withMockedSupabase(mockClient, async () => {
    const res = await mediaService.uploadMedia(VALID_PRODUCT_ID, new MockFile('ref-error.jpg', 1000, 'image/jpeg') as unknown as File);
    assert.equal(res.data, null);
    assert.equal(calls.dbDeletes.length, 0, 'Must not delete asset when reference status is unknown');
    assert.equal(calls.storageRemovals.length, 0, 'Must preserve Storage when reference status is unknown');
  });
});

await runTest('Cleanup: asset-row deletion error preserves Storage', async () => {
  const { mockClient, calls } = createSupabaseMock({
    linkInsertError: { message: 'Simulated link failure' },
    existingRefs: [],
    assetDeleteError: { message: 'Simulated asset delete failure' }
  });
  await withMockedSupabase(mockClient, async () => {
    const res = await mediaService.uploadMedia(VALID_PRODUCT_ID, new MockFile('delete-error.jpg', 1000, 'image/jpeg') as unknown as File);
    assert.equal(res.data, null);
    assert.equal(calls.dbDeletes.length, 1);
    assert.equal(calls.storageRemovals.length, 0, 'Must not remove Storage after database deletion error');
  });
});

await runTest('Cleanup: unconfirmed asset-row deletion preserves Storage', async () => {
  const { mockClient, calls } = createSupabaseMock({
    linkInsertError: { message: 'Simulated link failure' },
    existingRefs: [],
    assetDeleteRows: []
  });
  await withMockedSupabase(mockClient, async () => {
    const res = await mediaService.uploadMedia(VALID_PRODUCT_ID, new MockFile('delete-unconfirmed.jpg', 1000, 'image/jpeg') as unknown as File);
    assert.equal(res.data, null);
    assert.equal(calls.dbDeletes.length, 1);
    assert.equal(calls.storageRemovals.length, 0, 'Must preserve Storage unless exactly one matching asset row was confirmed deleted');
  });
});

await runTest('Cleanup: Storage removal error is captured after confirmed asset deletion', async () => {
  const { mockClient, calls } = createSupabaseMock({
    linkInsertError: { message: 'Simulated link failure' },
    existingRefs: [],
    storageRemoveError: { message: 'Simulated Storage removal failure' }
  });
  await withMockedSupabase(mockClient, async () => {
    const res = await mediaService.uploadMedia(VALID_PRODUCT_ID, new MockFile('storage-error.jpg', 1000, 'image/jpeg') as unknown as File);
    assert.equal(res.data, null);
    assert.equal(calls.dbDeletes.length, 1, 'Asset row deletion should be confirmed first');
    assert.equal(calls.storageRemovals.length, 1, 'Storage removal should be attempted only after confirmed row deletion');
  });
});

await runTest('Cleanup: successful compensation confirms asset deletion before Storage removal', async () => {
  const { mockClient, calls } = createSupabaseMock({
    linkInsertError: { message: 'Simulated link failure' },
    existingRefs: []
  });
  await withMockedSupabase(mockClient, async () => {
    const res = await mediaService.uploadMedia(VALID_PRODUCT_ID, new MockFile('cleanup-success.jpg', 1000, 'image/jpeg') as unknown as File);
    assert.equal(res.data, null);
    assert.equal(calls.dbDeletes.length, 1);
    assert.equal(calls.dbDeletes[0].table, 'media_assets');
    assert.equal(calls.storageRemovals.length, 1);
  });
});

await runTest('Cleanup: empty or invalid reference result preserves asset and Storage', async () => {
  const { mockClient, calls } = createSupabaseMock({
    linkInsertError: { message: 'Simulated link failure' },
    existingRefs: null
  });
  await withMockedSupabase(mockClient, async () => {
    const res = await mediaService.uploadMedia(VALID_PRODUCT_ID, new MockFile('refs-null.jpg', 1000, 'image/jpeg') as unknown as File);
    assert.equal(res.data, null);
    assert.equal(calls.dbDeletes.length, 0);
    assert.equal(calls.storageRemovals.length, 0);
  });
});

// ----------------------------------------------------------------------------
if (process.env.HOEOS_MOCK_ONLY !== '1') {
// SECTION D: Authenticated Tenant Boundary & Live DB Verification
// ----------------------------------------------------------------------------
console.log('\n--- SECTION D: AUTHENTICATED TENANT BOUNDARY TESTS ---');

await runTest('Tenant Boundary: Unauthenticated user cannot insert into media_assets', async () => {
  const { data, error } = await supabase.from('media_assets').insert({
    tenant_id: TENANT_ID,
    bucket: BUCKET_NAME,
    path: 'unauth.png',
    media_type: 'image',
    mime_type: 'image/png',
    filename: 'unauth.png',
    status: 'active'
  }).select('*');

  assert.equal(data, null);
  assert.ok(error);
  assert.match(error.message, /permission denied/i);
});

await runTest('Tenant Boundary: Unauthenticated user cannot upload to cp-public bucket', async () => {
  const dummyBuffer = Buffer.from('TEST_DATA');
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(`probe_unauth_${Date.now()}.png`, dummyBuffer, { contentType: 'image/png' });

  assert.equal(data, null);
  assert.ok(error);
  assert.match(error.message, /violates row-level security policy/i);
});


} else {
  console.log('HOEOS_MOCK_ONLY=1: skipped live Supabase database and Storage tests.');
}

console.log('\n======================================================================');
console.log(`HOEOS TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
console.log('======================================================================\n');

try {
  supabase.auth.stopAutoRefresh();
  await supabase.removeAllChannels();
  supabase.realtime.disconnect();
} catch {}

// This file is a standalone Node test runner. Exit explicitly after cleanup so
// platform handles cannot keep a mock-only CI process alive indefinitely.
process.exit(passedTests === totalTests ? 0 : 1);


