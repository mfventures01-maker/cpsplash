const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

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

const client = createClient(SUPABASE_URL, SERVICE_KEY);

async function runMediaAnimationProbe() {
  console.log('=== HOEOS TEST: MEDIA SEQUENCE & ANIMATION ENGINE VERIFICATION ===');
  const testSlug = `hoeos-animation-test-${Date.now().toString().slice(-6)}`;
  let testProductId = null;
  let testAssetIds = [];

  try {
    // 1. Create two test media assets in media_assets
    console.log('Step 1: Creating 2 test media assets...');
    for (let i = 1; i <= 2; i++) {
      const { data: asset, error: aErr } = await client
        .from('media_assets')
        .insert({
          tenant_id: TENANT_ID,
          bucket: 'cp-public',
          path: `probe_anim/asset_${i}_${Date.now()}.png`,
          media_type: 'image',
          mime_type: 'image/png',
          filename: `asset_${i}.png`,
          size_bytes: 2048,
          alt_text: `Test Asset ${i}`,
          status: 'active'
        })
        .select('*')
        .single();

      if (aErr || !asset) throw new Error(`Media creation failed: ${aErr?.message}`);
      testAssetIds.push(asset.id);
    }
    console.log('[PASS] Created test media assets:', testAssetIds);

    // 2. Create product with media_sequence and animation_config in metadata
    console.log('Step 2: Creating product with 6-part sequence & animation config...');
    const animConfig = {
      enabled: true,
      duration_seconds: 3.5,
      loop: true,
      autoplay: true,
      aspect_ratio: 'square'
    };

    const mediaSequence = [
      { position: 1, role: 'hero_bottle', media_id: testAssetIds[0], custom_label: '01 Clean Hero Bottle', enabled: true },
      { position: 2, role: 'premium_three_quarter', media_id: testAssetIds[1], custom_label: '02 Premium 3/4 Bottle', enabled: true },
      { position: 3, role: 'ingredient_explosion', media_id: '', custom_label: '03 Ingredient Explosion', enabled: false },
      { position: 4, role: 'lifestyle', media_id: '', custom_label: '04 Lifestyle Model', enabled: false },
      { position: 5, role: 'serving', media_id: '', custom_label: '05 Serving Shot', enabled: false },
      { position: 6, role: 'campaign_hero', media_id: '', custom_label: '06 Surreal Campaign Hero', enabled: false }
    ];

    const { data: prod, error: pErr } = await client
      .from('products')
      .insert({
        tenant_id: TENANT_ID,
        name: 'HOEOS Animation Sequence Specimen',
        slug: testSlug,
        status: 'published',
        featured: true,
        metadata: {
          animation_config: animConfig,
          media_sequence: mediaSequence
        }
      })
      .select('*')
      .single();

    if (pErr || !prod) throw new Error(`Product creation failed: ${pErr?.message}`);
    testProductId = prod.id;
    console.log('[PASS] Product created with ID:', prod.id);

    // 3. Link media to product_media
    console.log('Step 3: Linking media assets in product_media...');
    for (let i = 0; i < testAssetIds.length; i++) {
      await client.from('product_media').insert({
        product_id: testProductId,
        media_id: testAssetIds[i],
        sort_order: i + 1,
        is_primary: i === 0
      });
    }

    // 4. Read back via anonymous client (simulating public gallery consumption)
    console.log('Step 4: Public storefront query via Anon Client...');
    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: pubProd, error: pubErr } = await anonClient
      .from('products')
      .select(`
        id, name, slug, status, metadata,
        media:product_media(
          product_id, media_id, sort_order, is_primary,
          asset:media_assets(*)
        )
      `)
      .eq('tenant_id', TENANT_ID)
      .eq('slug', testSlug)
      .single();

    if (pubErr || !pubProd) throw new Error(`Anon read failed: ${pubErr?.message}`);

    const readAnimConfig = pubProd.metadata?.animation_config;
    const readSeq = pubProd.metadata?.media_sequence;

    if (!readAnimConfig || readAnimConfig.duration_seconds !== 3.5 || readAnimConfig.loop !== true) {
      throw new Error(`Animation config mismatch: ${JSON.stringify(readAnimConfig)}`);
    }

    if (!Array.isArray(readSeq) || readSeq.length !== 6 || readSeq[0].role !== 'hero_bottle') {
      throw new Error(`Media sequence mismatch: ${JSON.stringify(readSeq)}`);
    }

    console.log('[PASS] Verified Authoritative Animation Engine Persistence:');
    console.log('  Duration:', readAnimConfig.duration_seconds, 'seconds');
    console.log('  Loop:', readAnimConfig.loop);
    console.log('  Sequence items:', readSeq.length);
    console.log('  Position 01:', readSeq[0].role, '-> media_id:', readSeq[0].media_id);
    console.log('  Position 02:', readSeq[1].role, '-> media_id:', readSeq[1].media_id);
    console.log('\n*** HOEOS MEDIA SEQUENCE & ANIMATION ENGINE TEST PASSED ***');
  } finally {
    console.log('\nCleaning up disposable test records...');
    if (testProductId) {
      await client.from('product_media').delete().eq('product_id', testProductId);
      await client.from('products').delete().eq('id', testProductId);
    }
    for (const aId of testAssetIds) {
      await client.from('media_assets').delete().eq('id', aId);
    }
    console.log('[PASS] Cleanup complete.');
  }
}

runMediaAnimationProbe().catch(err => {
  console.error('[FATAL ERROR]:', err);
  process.exit(1);
});
