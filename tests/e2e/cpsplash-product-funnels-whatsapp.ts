import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseUrl = process.env.CP_SPLASH_E2E_BASE_URL;
if (!baseUrl) {
  throw new Error('Set CP_SPLASH_E2E_BASE_URL to an isolated staging or preview URL. Do not point this test at production.');
}

const funnels = [
  '/sports',
  '/parties-events',
  '/hotels-hospitality',
  '/schools',
  '/individuals',
];

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();

  // Protected Vercel previews can be tested with a local automation bypass secret.
  // Public isolated staging URLs continue to work without this optional variable.
  const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (bypassSecret) {
    await page.setExtraHTTPHeaders({
      'x-vercel-protection-bypass': bypassSecret,
      'x-vercel-set-bypass-cookie': 'true',
    });
  }
  let referenceProductName = '';

  for (const route of funnels) {
    await page.goto(new URL(route, baseUrl).toString(), { waitUntil: 'domcontentloaded' });
    const orderButton = page.locator('button[title="Order directly on WhatsApp"]').first();
    await orderButton.waitFor({ state: 'visible', timeout: 30000 });

    const card = orderButton.locator('xpath=ancestor::div[contains(@class,"group")][1]');
    const productName = (await card.locator('h3').innerText()).trim();
    assert.ok(productName, `No product name rendered on ${route}`);
    if (!referenceProductName) referenceProductName = productName;
    assert.equal(productName, referenceProductName, `Funnel ${route} did not render the same first published product`);

    const imageReady = await card.locator('img').first().evaluate((image: HTMLImageElement) =>
      image.complete && image.naturalWidth > 0
    );
    assert.equal(imageReady, true, `Published product image did not load on ${route}`);

    await orderButton.click();
    const handoff = page.getByRole('link', { name: /Continue to WhatsApp/i });
    await handoff.waitFor({ state: 'visible' });
    const href = await handoff.getAttribute('href');
    assert.ok(href, `WhatsApp handoff URL missing on ${route}`);

    const url = new URL(href);
    assert.equal(url.hostname, 'wa.me');
    const message = url.searchParams.get('text') || '';
    assert.match(message, new RegExp(`Product: ${productName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
    assert.match(message, /Quantity: 1/);
    assert.match(message, /Unit price: ₦[\d,]+/);
    assert.match(message, /Total: ₦[\d,]+/);
    assert.match(message, /Product link: https?:\/\//);
    console.log(`[PASS] ${route}: shared product, loaded image, active price and WhatsApp handoff`);
  }
} finally {
  await browser.close();
}
