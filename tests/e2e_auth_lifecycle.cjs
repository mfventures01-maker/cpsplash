const { chromium } = require('playwright');

const BASE_URL = (process.env.CP_SPLASH_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const EMAIL = process.env.CP_SPLASH_TEST_EMAIL;
const PASSWORD = process.env.CP_SPLASH_TEST_PASSWORD;
const PROJECT_REF = 'efvvczmopacoroudzfnl';

if (!EMAIL || !PASSWORD) {
  console.error('Missing CP_SPLASH_TEST_EMAIL or CP_SPLASH_TEST_PASSWORD. Set both in the current shell; do not commit them.');
  process.exit(2);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const pageErrors = [];

  page.on('pageerror', error => pageErrors.push(error.message));

  try {
    console.log('CP Splash Supabase Auth E2E');
    console.log('Target:', BASE_URL);
    console.log('Credentials: supplied via environment; values suppressed');

    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded', timeout: 30000 });

    if (/deployment protection|vercel authentication/i.test(await page.locator('body').innerText())) {
      throw new Error('Target is blocked by Vercel Deployment Protection. Run this test against localhost with Preview env vars, or provide an authenticated browser path.');
    }

    // Client initialisation must succeed before the login form can be used.
    await page.locator('input[type="email"]').waitFor({ state: 'visible', timeout: 20000 });
    const clientReady = await page.evaluate(() => Boolean(window.supabase && window.supabase.auth));
    if (!clientReady) throw new Error('window.supabase client was not initialised.');

    await page.locator('input[type="email"]').fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.getByRole('button', { name: /Sign In to Admin CMS/i }).click();

    // This verifies both password authentication and tenant-role authorisation.
    await page.getByRole('button', { name: /Sign Out from CMS/i }).waitFor({ state: 'visible', timeout: 30000 });

    const firstSession = await page.evaluate(async () => {
      const { data, error } = await window.supabase.auth.getSession();
      if (error) throw new Error(error.message);
      return data.session ? { userId: data.session.user.id, email: data.session.user.email } : null;
    });
    if (!firstSession || firstSession.email?.toLowerCase() !== EMAIL.toLowerCase()) {
      throw new Error('Login did not produce the expected authenticated browser session.');
    }

    const authStorageKey = `sb-${PROJECT_REF}-auth-token`;
    const storedAfterLogin = await page.evaluate(key => Boolean(localStorage.getItem(key)), authStorageKey);
    if (!storedAfterLogin) throw new Error('Supabase session was not persisted in browser storage.');

    // Reload proves the persisted session is restored, not merely held in React state.
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.getByRole('button', { name: /Sign Out from CMS/i }).waitFor({ state: 'visible', timeout: 30000 });

    const restoredSession = await page.evaluate(async () => {
      const { data, error } = await window.supabase.auth.getSession();
      if (error) throw new Error(error.message);
      return data.session ? data.session.user.id : null;
    });
    if (restoredSession !== firstSession.userId) {
      throw new Error('Session did not survive page reload with the same user identity.');
    }

    // Exercise the actual UI logout action and verify the SDK session is cleared.
    await page.getByRole('button', { name: /Sign Out from CMS/i }).click();
    await page.locator('input[type="email"]').waitFor({ state: 'visible', timeout: 20000 });

    const finalState = await page.evaluate(async key => {
      const { data, error } = await window.supabase.auth.getSession();
      if (error) throw new Error(error.message);
      return { hasSession: Boolean(data.session), hasStoredSession: Boolean(localStorage.getItem(key)) };
    }, authStorageKey);

    if (finalState.hasSession || finalState.hasStoredSession) {
      throw new Error('Logout did not clear the Supabase session and persisted auth token.');
    }

    if (pageErrors.length) {
      throw new Error(`Browser runtime errors detected: ${pageErrors.join(' | ')}`);
    }

    console.log('[PASS] Supabase client initialisation');
    console.log('[PASS] Password login + tenant role authorisation');
    console.log('[PASS] Session persisted in browser storage');
    console.log('[PASS] Session restored after full page reload');
    console.log('[PASS] UI logout cleared session and storage');
    console.log('[PASS] No uncaught browser page errors');
  } finally {
    await browser.close();
  }
}

run().catch(error => {
  console.error('[FAIL]', error.message || error);
  process.exit(1);
});
