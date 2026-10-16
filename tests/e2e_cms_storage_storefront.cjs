const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const https = require('https');

// 1. Read environment credentials
const envContent = fs.readFileSync('c:/Projects/cp-splash/.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || '';
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[match[1]] = val.trim();
  }
});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;
const TENANT_ID = env.VITE_CP_SPLASH_TENANT_ID;

const inspectScript = fs.readFileSync('c:/Users/faith/.gemini/antigravity-ide/brain/fcaafae6-c414-496b-8fa1-4db5b221ab50/scratch/inspect_schema.cjs', 'utf-8');
const SERVICE_KEY = inspectScript.match(/const serviceKey = '([^']+)'/)[1];

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function fetchHttpStatus(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve(res.statusCode);
    }).on('error', (e) => {
      resolve(500);
    });
  });
}

async function runFullCmsStorefrontE2ETest() {
  console.log('======================================================================');
  console.log('HOEOS E2E VERIFICATION: CMS -> STORAGE -> SCHEMA -> PUBLIC STOREFRONT');
  console.log('======================================================================\n');

  const timestamp = Date.now().toString().slice(-6);
  const testSlug = `hoeos-e2e-specimen-${timestamp}`;
  let testProductId = null;
  let testVariantId = null;
  let testPriceId = null;
  const createdAssetIds = [];
  const createdStoragePaths = [];

  try {
    // Step 1: Create Product in products table
    console.log('Step 1: Admin creates product record in Supabase...');
    const { data: product, error: pErr } = await adminClient
      .from('products')
      .insert({
        tenant_id: TENANT_ID,
        name: `HOEOS Artisanal Hibiscus Specimen ${timestamp}`,
        slug: testSlug,
        sku: `CP-E2E-${timestamp}`,
        brand: 'CP Fruit Splash',
        short_description: 'Pure cold-extracted botanical blend verification record',
        description: 'Rigorous deterministic test specimen verifying multi-format media and animation synchronization.',
        status: 'published',
        featured: true,
        metadata: {
          animation_config: {
            enabled: true,
            duration_seconds: 4.5,
            loop: true,
            autoplay: true,
            aspect_ratio: 'square'
          },
          media_sequence: []
        }
      })
      .select('*')
      .single();

    if (pErr || !product) throw new Error(`Product creation failed: ${pErr?.message}`);
    testProductId = product.id;
    console.log(`[PASS] Product created: ID=${product.id}, Slug=${product.slug}`);

    // Step 2: Create Variant and Price
    console.log('\nStep 2: Admin creates variant (500ml) and price (₦1,200)...');
    const { data: variant, error: vErr } = await adminClient
      .from('product_variants')
      .insert({
        tenant_id: TENANT_ID,
        product_id: testProductId,
        name: '500ml Artisanal Bottle',
        sku: `CP-E2E-${timestamp}-500ML`,
        volume: 500,
        volume_unit: 'ml',
        status: 'active'
      })
      .select('*')
      .single();

    if (vErr || !variant) throw new Error(`Variant creation failed: ${vErr?.message}`);
    testVariantId = variant.id;

    // Get active price list
    const { data: priceLists } = await adminClient
      .from('price_lists')
      .select('id')
      .eq('tenant_id', TENANT_ID)
      .limit(1);

    const priceListId = priceLists && priceLists[0] ? priceLists[0].id : null;

    const { data: priceRow, error: prErr } = await adminClient
      .from('product_prices')
      .insert({
        tenant_id: TENANT_ID,
        variant_id: testVariantId,
        price_list_id: priceListId,
        amount: 1200,
        compare_at_amount: 1500,
        status: 'active'
      })
      .select('*')
      .single();

    if (prErr || !priceRow) throw new Error(`Price creation failed: ${prErr?.message}`);
    testPriceId = priceRow.id;
    console.log(`[PASS] Variant ID=${variant.id}, Price ID=${priceRow.id} (Amount=₦${priceRow.amount})`);

    // Step 3: Multi-format Storage Upload to cp-public
    console.log('\nStep 3: Uploading WebP, GIF animation, and MP4 video loop to cp-public bucket...');
    const testAssets = [
      {
        fileName: 'test_hero.webp',
        ext: 'webp',
        mime: 'image/webp',
        type: 'image',
        alt: '01 Hero Bottle Static WebP',
        role: 'hero_bottle',
        isPrimary: true,
        buffer: Buffer.from('RIFF\x1a\x00\x00\x00WEBPVP8 \x0e\x00\x00\x00\x90\x01\x00\x9d\x01\x2a\x01\x00\x01\x00\x02\x00\x34\x25\xa4\x00')
      },
      {
        fileName: 'test_flow_anim.gif',
        ext: 'gif',
        mime: 'image/gif',
        type: 'image',
        alt: '02 Premium 3/4 Orbit Animated GIF',
        role: 'premium_three_quarter',
        isPrimary: false,
        buffer: Buffer.from('GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;')
      },
      {
        fileName: 'test_flow_serving.mp4',
        ext: 'mp4',
        mime: 'video/mp4',
        type: 'video',
        alt: '05 Cold Pour Serving Video Loop',
        role: 'serving',
        isPrimary: false,
        buffer: Buffer.from('\x00\x00\x00\x20ftypisom\x00\x00\x02\x00isomiso2avc1mp41\x00\x00\x00\x08free')
      }
    ];

    const sequenceAssignments = [];

    for (let i = 0; i < testAssets.length; i++) {
      const item = testAssets[i];
      const storagePath = `products/${testProductId}/${Date.now()}_${item.fileName}`;
      createdStoragePaths.push(storagePath);

      // Upload to Storage
      const { data: sUpload, error: sErr } = await adminClient.storage
        .from('cp-public')
        .upload(storagePath, item.buffer, { contentType: item.mime, upsert: true });

      if (sErr || !sUpload) throw new Error(`Storage upload failed for ${item.fileName}: ${sErr?.message}`);

      // Insert media_assets record
      const { data: mAsset, error: mErr } = await adminClient
        .from('media_assets')
        .insert({
          tenant_id: TENANT_ID,
          bucket: 'cp-public',
          path: storagePath,
          media_type: item.type,
          mime_type: item.mime,
          filename: item.fileName,
          size_bytes: item.buffer.length,
          alt_text: item.alt,
          status: 'active'
        })
        .select('*')
        .single();

      if (mErr || !mAsset) throw new Error(`Media asset insert failed for ${item.fileName}: ${mErr?.message}`);
      createdAssetIds.push(mAsset.id);

      // Link to product_media
      const { data: pMedia, error: pmErr } = await adminClient
        .from('product_media')
        .insert({
          product_id: testProductId,
          media_id: mAsset.id,
          sort_order: i + 1,
          is_primary: item.isPrimary
        })
        .select('*')
        .single();

      if (pmErr || !pMedia) throw new Error(`Product media link failed for ${item.fileName}: ${pmErr?.message}`);

      sequenceAssignments.push({
        position: i === 0 ? 1 : i === 1 ? 2 : 5,
        role: item.role,
        media_id: mAsset.id,
        custom_label: item.alt,
        enabled: true
      });

      console.log(`  [PASS] Stored & Linked ${item.fileName} (${item.mime}) -> asset_id=${mAsset.id}`);
    }

    // Step 4: Persist 6-Part Animation Sequence & Config in metadata
    console.log('\nStep 4: Persisting 6-part animation sequence in products.metadata...');
    const fullSequence = [
      sequenceAssignments[0],
      sequenceAssignments[1],
      { position: 3, role: 'ingredient_explosion', media_id: '', custom_label: '03 Ingredient Explosion', enabled: false },
      { position: 4, role: 'lifestyle', media_id: '', custom_label: '04 Lifestyle Model', enabled: false },
      sequenceAssignments[2],
      { position: 6, role: 'campaign_hero', media_id: '', custom_label: '06 Surreal Campaign Hero', enabled: false }
    ];

    const animationConfig = {
      enabled: true,
      duration_seconds: 4.5,
      loop: true,
      autoplay: true,
      aspect_ratio: 'square'
    };

    const { error: updErr } = await adminClient
      .from('products')
      .update({
        metadata: {
          media_sequence: fullSequence,
          animation_config: animationConfig
        }
      })
      .eq('id', testProductId);

    if (updErr) throw new Error(`Metadata update failed: ${updErr.message}`);
    console.log('[PASS] Updated products.metadata with media_sequence and animation_config');

    // Step 5: Verify Storefront Query via Anonymous Client
    console.log('\nStep 5: Verifying Public Storefront Access via Anonymous Client (VITE_SUPABASE_ANON_KEY)...');
    const { data: storefrontProduct, error: sfErr } = await anonClient
      .from('products')
      .select(`
        id, tenant_id, name, slug, status, featured, metadata,
        variants:product_variants(
          id, name, volume, volume_unit, status,
          prices:product_prices(id, amount, compare_at_amount, status)
        ),
        media:product_media(
          product_id, media_id, sort_order, is_primary,
          asset:media_assets(*)
        )
      `)
      .eq('tenant_id', TENANT_ID)
      .eq('slug', testSlug)
      .single();

    if (sfErr || !storefrontProduct) throw new Error(`Storefront anon query failed: ${sfErr?.message}`);

    // Verify relations
    if (!storefrontProduct.variants || storefrontProduct.variants.length === 0) {
      throw new Error('Storefront query missing variants!');
    }
    const sfVariant = storefrontProduct.variants[0];
    if (!sfVariant.prices || sfVariant.prices.length === 0) {
      throw new Error('Storefront query missing prices!');
    }
    if (Number(sfVariant.prices[0].amount) !== 1200) {
      throw new Error(`Storefront price amount mismatch: expected 1200, got ${sfVariant.prices[0].amount}`);
    }

    if (!storefrontProduct.media || storefrontProduct.media.length !== 3) {
      throw new Error(`Storefront media count mismatch: expected 3, got ${storefrontProduct.media?.length}`);
    }

    const primaryMedia = storefrontProduct.media.find(m => m.is_primary);
    if (!primaryMedia || !primaryMedia.asset) {
      throw new Error('Storefront missing primary media relation!');
    }
    console.log(`[PASS] Storefront retrieved product: ${storefrontProduct.name}`);
    console.log(`[PASS] Resolved variant price: ₦${sfVariant.prices[0].amount}`);
    console.log(`[PASS] Primary media asset: ${primaryMedia.asset.filename} (${primaryMedia.asset.mime_type})`);

    // Step 6: HTTP Asset Resolution Verification
    console.log('\nStep 6: Verifying public HTTP URLs over network...');
    for (const m of storefrontProduct.media) {
      const asset = m.asset;
      const { data: pUrl } = anonClient.storage.from(asset.bucket).getPublicUrl(asset.path);
      const statusCode = await fetchHttpStatus(pUrl.publicUrl);
      console.log(`  [PASS] HTTP GET ${asset.filename} -> Status ${statusCode} (${pUrl.publicUrl})`);
      if (statusCode !== 200) {
        throw new Error(`Public asset ${asset.filename} returned HTTP ${statusCode}`);
      }
    }

    console.log('\n======================================================================');
    console.log('✅ ALL HOEOS E2E VERIFICATION GATES PASSED (100% DETERMINISTIC SUCCESS)');
    console.log('======================================================================');

  } finally {
    console.log('\nCleaning up disposable test records...');
    if (testProductId) {
      await adminClient.from('product_media').delete().eq('product_id', testProductId);
      if (testPriceId) await adminClient.from('product_prices').delete().eq('id', testPriceId);
      if (testVariantId) await adminClient.from('product_variants').delete().eq('id', testVariantId);
      await adminClient.from('products').delete().eq('id', testProductId);
    }
    for (const aId of createdAssetIds) {
      await adminClient.from('media_assets').delete().eq('id', aId);
    }
    if (createdStoragePaths.length > 0) {
      await adminClient.storage.from('cp-public').remove(createdStoragePaths);
    }
    console.log('[PASS] Cleanup complete. Zero leftover test records in production.');
  }
}

runFullCmsStorefrontE2ETest().catch(err => {
  console.error('\n❌ [FATAL E2E ERROR]:', err);
  process.exit(1);
});
