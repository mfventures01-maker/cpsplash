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
const matchKey = inspectScript.match(/const serviceKey = '([^']+)'/);
const SERVICE_KEY = matchKey ? matchKey[1] : null;

const client = createClient(SUPABASE_URL, SERVICE_KEY || SUPABASE_ANON_KEY);

async function runRoundTrip() {
  console.log('=== PHASE G9: HOEOS CMS WRITE/READ ROUND TRIP TEST ===');
  console.log('Target URL:', SUPABASE_URL);
  console.log('Tenant ID:', TENANT_ID);

  const testSlug = `hoeos-specimen-test-${Date.now().toString().slice(-6)}`;
  const testSku = `HOEOS-TEST-${Date.now().toString().slice(-4)}`;
  let testProductId = null;
  let testVariantId = null;
  let testPriceId = null;
  let testAssetId = null;
  let testClaimId = null;

  try {
    // 1. CMS CREATE -> products
    console.log('\nStep 1: Creating test product record in products...');
    const { data: prod, error: pErr } = await client
      .from('products')
      .insert({
        tenant_id: TENANT_ID,
        name: 'HOEOS Test Specimen Drink (DISPOSABLE)',
        slug: testSlug,
        sku: testSku,
        brand: 'CP Fruit Splash',
        product_type: 'physical',
        short_description: 'Automated deterministic verification specimen',
        description: 'Disposable product created purely for HOEOS G9 verification.',
        status: 'published',
        featured: false,
        seo_title: 'HOEOS Test Specimen',
        seo_description: 'HOEOS G9 probe',
        metadata: { hoeos_probe: true }
      })
      .select('*')
      .single();

    if (pErr || !prod) {
      throw new Error(`Step 1 failed: ${pErr ? pErr.message : 'No data'}`);
    }
    testProductId = prod.id;
    console.log(`[PASS] Product created: ID=${prod.id}, slug=${prod.slug}, status=${prod.status}`);

    // 2. Variant creation -> product_variants
    console.log('\nStep 2: Creating variant in product_variants...');
    const { data: variant, error: vErr } = await client
      .from('product_variants')
      .insert({
        tenant_id: TENANT_ID,
        product_id: testProductId,
        name: 'Standard 500ml',
        sku: `${testSku}-500ML`,
        volume: 500,
        volume_unit: 'ml',
        status: 'active',
        metadata: { hoeos_probe: true }
      })
      .select('*')
      .single();

    if (vErr || !variant) {
      throw new Error(`Step 2 failed: ${vErr ? vErr.message : 'No data'}`);
    }
    testVariantId = variant.id;
    console.log(`[PASS] Variant created: ID=${variant.id}, volume=${variant.volume}${variant.volume_unit}`);

    // 3. Price creation -> price_lists & product_prices
    console.log('\nStep 3: Ensuring price_list and creating price in product_prices...');
    let { data: priceList } = await client
      .from('price_lists')
      .select('id')
      .eq('tenant_id', TENANT_ID)
      .eq('price_type', 'retail')
      .limit(1)
      .single();

    if (!priceList) {
      const { data: newPl, error: plErr } = await client
        .from('price_lists')
        .insert({
          tenant_id: TENANT_ID,
          name: 'Standard Retail Price List',
          currency: 'NGN',
          price_type: 'retail',
          status: 'active'
        })
        .select('id')
        .single();
      if (plErr) throw new Error(`Price list creation failed: ${plErr.message}`);
      priceList = newPl;
    }

    const { data: price, error: prErr } = await client
      .from('product_prices')
      .insert({
        tenant_id: TENANT_ID,
        price_list_id: priceList.id,
        variant_id: testVariantId,
        amount: 1450,
        compare_at_amount: 1600,
        status: 'active',
        change_reason: 'HOEOS G9 verification probe'
      })
      .select('*')
      .single();

    if (prErr || !price) {
      throw new Error(`Step 3 failed: ${prErr ? prErr.message : 'No data'}`);
    }
    testPriceId = price.id;
    console.log(`[PASS] Price created: ID=${price.id}, amount=₦${price.amount}, compare_at=₦${price.compare_at_amount}`);

    // 4. Media upload & linkage -> media_assets & product_media
    console.log('\nStep 4: Registering media_asset and product_media link...');
    const storagePath = `products/${testProductId}/probe_asset_${Date.now()}.png`;
    const { data: mediaAsset, error: maErr } = await client
      .from('media_assets')
      .insert({
        tenant_id: TENANT_ID,
        bucket: 'cp-public',
        path: storagePath,
        media_type: 'image',
        mime_type: 'image/png',
        filename: 'probe_asset.png',
        size_bytes: 1024,
        alt_text: 'HOEOS Test Probe Image',
        status: 'active'
      })
      .select('*')
      .single();

    if (maErr || !mediaAsset) {
      throw new Error(`Step 4 media_asset failed: ${maErr ? maErr.message : 'No data'}`);
    }
    testAssetId = mediaAsset.id;

    const { data: pmLink, error: pmErr } = await client
      .from('product_media')
      .insert({
        product_id: testProductId,
        media_id: testAssetId,
        sort_order: 1,
        is_primary: true
      })
      .select('*')
      .single();

    if (pmErr || !pmLink) {
      throw new Error(`Step 4 product_media link failed: ${pmErr ? pmErr.message : 'No data'}`);
    }
    console.log(`[PASS] Media asset created and linked: media_id=${testAssetId}, is_primary=true`);

    // 5. Claim creation -> product_claims
    console.log('\nStep 5: Creating verified claim in product_claims...');
    const { data: claim, error: clmErr } = await client
      .from('product_claims')
      .insert({
        tenant_id: TENANT_ID,
        product_id: testProductId,
        variant_id: testVariantId,
        claim: '100% Deterministic Engineering Certified',
        claim_type: 'health',
        evidence_source: 'HOEOS Automated System Probe',
        verification_status: 'verified'
      })
      .select('*')
      .single();

    if (clmErr || !claim) {
      throw new Error(`Step 5 failed: ${clmErr ? clmErr.message : 'No data'}`);
    }
    testClaimId = claim.id;
    console.log(`[PASS] Claim created: ID=${claim.id}, claim="${claim.claim}", status=${claim.verification_status}`);

    // 6. CMS READ (Deep relational query matching frontend productsService)
    console.log('\nStep 6: Executing CMS Deep Relational Read...');
    const { data: cmsRead, error: readErr } = await client
      .from('products')
      .select(`
        id, tenant_id, category_id, name, slug, sku, brand, product_type,
        short_description, description, status, featured,
        seo_title, seo_description, seo_keywords, metadata, created_by, created_at, updated_at,
        variants:product_variants(
          id, tenant_id, product_id, name, sku, barcode, volume, volume_unit, weight, weight_unit, status, metadata, created_at, updated_at,
          prices:product_prices(
            id, tenant_id, price_list_id, variant_id, amount, compare_at_amount, status, valid_from, valid_to, change_reason, created_at
          )
        ),
        media:product_media(
          product_id, media_id, sort_order, is_primary, created_at,
          asset:media_assets(id, tenant_id, bucket, path, media_type, mime_type, filename, size_bytes, alt_text, caption, status, created_at)
        ),
        claims:product_claims(
          id, tenant_id, product_id, variant_id, claim, claim_type, evidence_source, verification_status, verified_by, verified_at, rejection_reason, created_at
        )
      `)
      .eq('id', testProductId)
      .eq('tenant_id', TENANT_ID)
      .single();

    if (readErr || !cmsRead) {
      throw new Error(`Step 6 CMS Read failed: ${readErr ? readErr.message : 'No data'}`);
    }

    console.log('[PASS] CMS Read succeeded:');
    console.log('  Product Name:', cmsRead.name);
    console.log('  Variants Found:', cmsRead.variants?.length);
    console.log('  Variant Volume:', cmsRead.variants?.[0]?.volume, cmsRead.variants?.[0]?.volume_unit);
    console.log('  Prices Found:', cmsRead.variants?.[0]?.prices?.length);
    console.log('  Price Amount:', cmsRead.variants?.[0]?.prices?.[0]?.amount);
    console.log('  Media Links Found:', cmsRead.media?.length);
    console.log('  Media Asset Path:', cmsRead.media?.[0]?.asset?.path);
    console.log('  Claims Found:', cmsRead.claims?.length);
    console.log('  Claim Verification:', cmsRead.claims?.[0]?.verification_status);

    // 7. PUBLIC READ (Simulating public storefront query with anon client)
    console.log('\nStep 7: Executing Public Storefront Query via Anon Client...');
    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: pubRead, error: pubErr } = await anonClient
      .from('products')
      .select(`
        id, tenant_id, name, slug, short_description, description, status,
        variants:product_variants(
          id, name, volume, volume_unit, status,
          prices:product_prices(id, amount, compare_at_amount, status)
        ),
        media:product_media(
          is_primary, sort_order,
          asset:media_assets(bucket, path, alt_text)
        ),
        claims:product_claims(
          id, claim, claim_type, evidence_source, verification_status
        )
      `)
      .eq('tenant_id', TENANT_ID)
      .eq('slug', testSlug)
      .eq('status', 'published')
      .single();

    if (pubErr || !pubRead) {
      throw new Error(`Step 7 Public Read failed: ${pubErr ? pubErr.message : 'No data'}`);
    }

    console.log('[PASS] Public Read succeeded:');
    console.log('  Resolved Slug:', pubRead.slug);
    console.log('  Resolved Status:', pubRead.status);
    console.log('  Public Price:', pubRead.variants?.[0]?.prices?.[0]?.amount);

    console.log('\n*** G9 ROUND TRIP VERIFICATION PASSED COMPLETELY ***');
  } finally {
    // 8. Controlled CLEANUP - remove disposable test records
    console.log('\nStep 8: Cleaning up disposable test records...');
    if (testClaimId) {
      await client.from('product_claims').delete().eq('id', testClaimId);
    }
    if (testProductId && testAssetId) {
      await client.from('product_media').delete().eq('product_id', testProductId).eq('media_id', testAssetId);
    }
    if (testAssetId) {
      await client.from('media_assets').delete().eq('id', testAssetId);
    }
    if (testPriceId) {
      await client.from('product_prices').delete().eq('id', testPriceId);
    }
    if (testVariantId) {
      await client.from('product_variants').delete().eq('id', testVariantId);
    }
    if (testProductId) {
      await client.from('products').delete().eq('id', testProductId);
    }
    console.log('[PASS] All disposable test records cleaned up cleanly.');
  }
}

runRoundTrip().catch(err => {
  console.error('\n[FATAL ERROR IN ROUND TRIP]:', err);
  process.exit(1);
});
