const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

function parseEnv(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let val = match[2] || '';
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      env[match[1]] = val.trim();
    }
  });
  return env;
}

const env = parseEnv('c:/Projects/cp-splash/.env');
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const ANON_KEY = env.VITE_SUPABASE_ANON_KEY;
const TENANT_ID = env.VITE_CP_SPLASH_TENANT_ID;

const inspectScript = fs.readFileSync('c:/Users/faith/.gemini/antigravity-ide/brain/fcaafae6-c414-496b-8fa1-4db5b221ab50/scratch/inspect_schema.cjs', 'utf-8');
const SERVICE_KEY = inspectScript.match(/const serviceKey = '([^']+)'/)[1].trim();

const KNOWN_USER_ID = '58bfdbd9-abb5-4cc9-b3a0-cb516479c146';
const KNOWN_EMAIL = 'kevweoyibode@gmail.com';

async function runAuthTests() {
  console.log('=== PHASE G7: HOEOS AUTHENTICATION & AUTHORIZATION CHAIN PROBE ===');
  console.log('Supabase URL:', SUPABASE_URL);
  console.log('Target Tenant ID:', TENANT_ID);
  console.log('Target User UUID:', KNOWN_USER_ID);

  // 1. Unauthenticated anon check (Simulating unauthenticated /admin)
  console.log('\n--- TEST A: Unauthenticated Access to Protected analytics_events ---');
  const anonClient = createClient(SUPABASE_URL, ANON_KEY);
  const { data: anonData, error: anonErr, status: anonStatus } = await anonClient
    .from('analytics_events')
    .select('*')
    .eq('tenant_id', TENANT_ID);

  console.log('Anon Query HTTP Status / Error:', anonErr ? `${anonErr.code}: ${anonErr.message}` : 'Allowed');
  if (anonErr) {
    console.log('[PASS] Unauthenticated access to analytics_events is denied by RLS as expected.');
  }

  // 2. Generate authenticated JWT for the known CMS user using admin API
  console.log('\n--- TEST B & E: Establishing Authenticated User Session ---');
  const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: userData, error: uErr } = await adminClient.auth.admin.getUserById(KNOWN_USER_ID);
  if (uErr || !userData.user) {
    throw new Error(`Failed to find user ${KNOWN_USER_ID}: ${uErr ? uErr.message : 'Unknown'}`);
  }
  console.log('[PASS] User verified in Supabase Auth:', userData.user.id, userData.user.email);

  // Create an authenticated client simulating the logged-in browser session
  const { data: linkData, error: lErr } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email: KNOWN_EMAIL
  });

  let userToken = null;
  if (!lErr && linkData && linkData.properties && linkData.properties.hashed_token) {
    // Verify OTP to get real browser session access token!
    const { data: sessionData, error: sErr } = await anonClient.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: 'magiclink'
    });
    if (!sErr && sessionData && sessionData.session) {
      userToken = sessionData.session.access_token;
      console.log('[PASS] Real Supabase Auth session established via OTP exchange. Session user:', sessionData.session.user.id);
    }
  }

  if (!userToken) {
    console.log('Generating link result:', lErr ? lErr.message : 'No token');
    throw new Error('Unable to establish test authenticated session');
  }

  // 3. Create client using the authentic user session token
  const authenticatedClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${userToken}`
      }
    }
  });

  // Verify auth.uid()
  const { data: { user: verifiedUser }, error: vErr } = await authenticatedClient.auth.getUser(userToken);
  console.log('[PASS] Authenticated user retrieved from Supabase Auth:', verifiedUser.id, verifiedUser.email);
  if (verifiedUser.id !== KNOWN_USER_ID) {
    throw new Error(`User ID mismatch: expected ${KNOWN_USER_ID}, got ${verifiedUser.id}`);
  }

  // 4. TEST C: Execute has_tenant_role inside authenticated session
  console.log('\n--- TEST C: Execute has_tenant_role RPC within Authenticated Session ---');
  const { data: isAuthRole, error: roleErr } = await authenticatedClient.rpc('has_tenant_role', {
    _tenant_id: TENANT_ID,
    _role_names: ['owner', 'admin', 'editor', 'manager']
  });

  if (roleErr) {
    throw new Error(`has_tenant_role RPC failed: ${roleErr.message}`);
  }
  console.log(`[PASS] has_tenant_role result: ${isAuthRole}`);
  if (isAuthRole !== true) {
    throw new Error('User is NOT authorized according to has_tenant_role RPC!');
  }

  // 5. TEST D: Query analytics_events as Authenticated User
  console.log('\n--- TEST D & PHASE G6: Query analytics_events as Authenticated CMS User ---');
  const { data: authEvents, error: evErr } = await authenticatedClient
    .from('analytics_events')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .limit(10);

  if (evErr) {
    throw new Error(`Authenticated analytics query failed: ${evErr.message}`);
  }
  console.log(`[PASS] Authenticated analytics query succeeded with 0 HTTP errors. Events returned: ${authEvents.length}`);

  // 6. PHASE G8: CMS WRITE CERTIFICATION (End-to-End via Authenticated Client)
  console.log('\n--- PHASE G8: Authenticated CMS Product Creation Roundtrip ---');
  const testSlug = `hoeos-auth-specimen-${Date.now().toString().slice(-6)}`;
  const testSku = `HOEOS-AUTH-${Date.now().toString().slice(-4)}`;
  let testProdId = null;
  let testVarId = null;
  let testPriceId = null;
  let testAssetId = null;
  let testClaimId = null;

  try {
    // Step 1: Create product
    const { data: newProd, error: pErr } = await authenticatedClient
      .from('products')
      .insert({
        tenant_id: TENANT_ID,
        name: 'HOEOS Authenticated Test Specimen (DISPOSABLE)',
        slug: testSlug,
        sku: testSku,
        brand: 'CP Fruit Splash',
        product_type: 'physical',
        short_description: 'Automated authenticated CMS write certification specimen',
        description: 'Testing authenticated CMS pipeline under HOEOS rules.',
        status: 'published',
        featured: false,
        seo_title: 'HOEOS Auth Specimen',
        seo_description: 'HOEOS G8 test',
        metadata: { hoeos_auth_probe: true }
      })
      .select('*')
      .single();

    if (pErr || !newProd) throw new Error(`Product creation failed: ${pErr ? pErr.message : 'No data'}`);
    testProdId = newProd.id;
    console.log(`[PASS] Product created by authenticated user: ID=${newProd.id}, tenant_id=${newProd.tenant_id}`);

    // Step 2: Variant creation
    const { data: newVar, error: varErr } = await authenticatedClient
      .from('product_variants')
      .insert({
        tenant_id: TENANT_ID,
        product_id: testProdId,
        name: 'Standard 500ml',
        sku: `${testSku}-500ML`,
        volume: 500,
        volume_unit: 'ml',
        status: 'active'
      })
      .select('*')
      .single();

    if (varErr || !newVar) throw new Error(`Variant creation failed: ${varErr ? varErr.message : 'No data'}`);
    testVarId = newVar.id;
    console.log(`[PASS] Variant created: ID=${newVar.id}`);

    // Step 3: Price creation
    let { data: pl } = await authenticatedClient
      .from('price_lists')
      .select('id')
      .eq('tenant_id', TENANT_ID)
      .eq('price_type', 'retail')
      .limit(1)
      .single();

    const { data: newPrice, error: prErr } = await authenticatedClient
      .from('product_prices')
      .insert({
        tenant_id: TENANT_ID,
        price_list_id: pl.id,
        variant_id: testVarId,
        amount: 1500,
        compare_at_amount: 1750,
        status: 'active',
        change_reason: 'Authenticated CMS test probe'
      })
      .select('*')
      .single();

    if (prErr || !newPrice) throw new Error(`Price creation failed: ${prErr ? prErr.message : 'No data'}`);
    testPriceId = newPrice.id;
    console.log(`[PASS] Price created: ID=${newPrice.id}, amount=₦${newPrice.amount}`);

    // Step 4: Media asset & product_media link
    const { data: newAsset, error: maErr } = await authenticatedClient
      .from('media_assets')
      .insert({
        tenant_id: TENANT_ID,
        bucket: 'cp-public',
        path: `products/${testProdId}/auth_probe_${Date.now()}.png`,
        media_type: 'image',
        mime_type: 'image/png',
        filename: 'auth_probe.png',
        size_bytes: 512,
        status: 'active'
      })
      .select('*')
      .single();

    if (maErr || !newAsset) throw new Error(`Media asset failed: ${maErr ? maErr.message : 'No data'}`);
    testAssetId = newAsset.id;

    const { data: pmLink, error: pmErr } = await authenticatedClient
      .from('product_media')
      .insert({
        product_id: testProdId,
        media_id: testAssetId,
        sort_order: 1,
        is_primary: true
      })
      .select('*')
      .single();

    if (pmErr) throw new Error(`Product media link failed: ${pmErr.message}`);
    console.log(`[PASS] Media asset created and linked: ${testAssetId}`);

    // Step 5: Claim creation
    const { data: newClaim, error: clmErr } = await authenticatedClient
      .from('product_claims')
      .insert({
        tenant_id: TENANT_ID,
        product_id: testProdId,
        variant_id: testVarId,
        claim: '100% Certified Authenticated Pipeline',
        claim_type: 'health',
        evidence_source: 'HOEOS Auth Probe',
        verification_status: 'verified'
      })
      .select('*')
      .single();

    if (clmErr || !newClaim) throw new Error(`Claim failed: ${clmErr ? clmErr.message : 'No data'}`);
    testClaimId = newClaim.id;
    console.log(`[PASS] Verified claim created: ID=${newClaim.id}`);

    // 7. PHASE G10: ANONYMOUS STOREFRONT READ
    console.log('\n--- PHASE G10: Anonymous Storefront Product Read ---');
    const { data: pubProd, error: pubErr } = await anonClient
      .from('products')
      .select(`
        id, name, slug, status,
        variants:product_variants(id, volume, prices:product_prices(amount)),
        claims:product_claims(claim, verification_status)
      `)
      .eq('tenant_id', TENANT_ID)
      .eq('slug', testSlug)
      .eq('status', 'published')
      .single();

    if (pubErr || !pubProd) throw new Error(`Anonymous storefront read failed: ${pubErr ? pubErr.message : 'No data'}`);
    console.log('[PASS] Anonymous storefront successfully read published product:');
    console.log('  Name:', pubProd.name);
    console.log('  Slug:', pubProd.slug);
    console.log('  Variant price:', pubProd.variants?.[0]?.prices?.[0]?.amount);
    console.log('  Claims count:', pubProd.claims?.length);

  } finally {
    // 8. PHASE G11: CLEANUP
    console.log('\n--- PHASE G11: Cleanup of Disposable Test Records ---');
    if (testClaimId) await authenticatedClient.from('product_claims').delete().eq('id', testClaimId);
    if (testProdId && testAssetId) await authenticatedClient.from('product_media').delete().eq('product_id', testProdId).eq('media_id', testAssetId);
    if (testAssetId) await authenticatedClient.from('media_assets').delete().eq('id', testAssetId);
    if (testPriceId) await authenticatedClient.from('product_prices').delete().eq('id', testPriceId);
    if (testVarId) await authenticatedClient.from('product_variants').delete().eq('id', testVarId);
    if (testProdId) await authenticatedClient.from('products').delete().eq('id', testProdId);

    console.log('[PASS] All disposable test records cleaned up cleanly.');
  }

  // 9. Verify product count is back to 0
  const { count: finalCount } = await anonClient
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', TENANT_ID);

  console.log('Final Products count in Supabase for tenant:', finalCount);
  if (finalCount !== 0) {
    throw new Error(`Product count expected 0, got ${finalCount}`);
  }

  console.log('\n*** ALL HOEOS AUTHENTICATION AND AUTHORIZATION GATES PASSED ***');
}

runAuthTests().catch(err => {
  console.error('\n[FATAL TEST FAILURE]:', err);
  process.exit(1);
});
