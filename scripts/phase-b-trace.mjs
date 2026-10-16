import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const dir = path.resolve(`evidence/phase-b-${timestamp}`);
fs.mkdirSync(dir, { recursive: true });

const BASE = 'http://localhost:3000';
const report = { timestamp, base: BASE, tests: {} };

const browser = await chromium.launch({
  headless: true
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordHar: { path: path.join(dir, 'session.har'), content: 'embed' }
});
const page = await context.newPage();

// Global collectors
const consoleLogs = [];
const networkRequests = [];
const networkResponses = [];
const pageErrors = [];

page.on('console', m => consoleLogs.push({ type: m.type(), text: m.text() }));
page.on('pageerror', e => pageErrors.push(e.message));
page.on('request', r => networkRequests.push({ url: r.url(), method: r.method(), resourceType: r.resourceType() }));
page.on('response', async r => {
  const url = r.url();
  if (url.includes('/rest/v1/') || url.includes('/storage/v1/')) {
    let body = '';
    try { body = await r.text(); } catch {}
    networkResponses.push({ url, status: r.status(), ct: r.headers()['content-type'] || null, body: body.slice(0, 8000) });
  }
});

// ================================================================
// B1: Homepage hero trace
// ================================================================
console.log('\n=== B1: Homepage hero ===');
await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(3000);
await page.screenshot({ path: path.join(dir, 'B1-homepage-full.png'), fullPage: true });

report.tests.B1 = await page.evaluate(() => {
  const all = [...document.querySelectorAll('img')];
  return {
    totalImages: all.length,
    heroArea: all.filter(i => {
      const sec = i.closest('section');
      return sec && /hero|slider/i.test(sec.className || '');
    }).map(i => ({
      src: i.src || '(empty)',
      alt: i.alt || '(no alt)',
      naturalWidth: i.naturalWidth,
      naturalHeight: i.naturalHeight,
      complete: i.complete,
      parentClass: i.parentElement?.className?.slice(0, 100) || ''
    })),
    allImages: all.map(i => ({
      src: i.src || '(empty)',
      alt: i.alt,
      naturalWidth: i.naturalWidth,
      parentTag: i.parentElement?.tagName
    })),
    anyCpPublic: all.some(i => i.src?.includes('cp-public')),
    anyTestProduct: all.some(i => i.src?.includes('test-product.png')),
    anyPlaceholder: all.some(i =>
      i.src?.includes('placeholder') ||
      i.src?.startsWith('data:image/svg')
    )
  };
});

// Dump the hero section HTML for inspection
report.tests.B1.heroHtml = await page.evaluate(() => {
  const hero = document.querySelector('section') ||
               document.querySelector('[class*="hero"]');
  return hero ? hero.outerHTML.slice(0, 5000) : '(no hero section found)';
});

// ADDITIONAL: Browser decode assertion
report.tests.B1_DECODE = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll('img')].filter(i =>
    i.src?.includes('cp-public')
  );
  return {
    totalCpPublicImgs: imgs.length,
    decoded: imgs.filter(i => i.naturalWidth > 0).length,
    failed: imgs.filter(i => i.naturalWidth === 0 && i.complete).map(i => ({
      src: i.src,
      alt: i.alt
    }))
  };
});

// ================================================================
// B2: Product fetch response
// ================================================================
console.log('\n=== B2: Product fetch ===');
report.tests.B2 = networkResponses
  .filter(r => r.url.includes('/rest/v1/products'))
  .map(r => ({
    url: r.url,
    status: r.status,
    hasMediaKey: r.body.includes('"media"'),
    hasTestProduct: r.body.includes('test-product.png'),
    hasCpPublic: r.body.includes('cp-public'),
    bodySnippet: r.body.slice(0, 4000)
  }));

// ================================================================
// B3: Hero DOM inspection for test-product.png
// ================================================================
console.log('\n=== B3: Hero DOM ===');
report.tests.B3 = await page.evaluate(() => {
  const all = [...document.querySelectorAll('img')];
  const match = all.find(i => i.src?.includes('test-product.png'));
  if (match) {
    return {
      found: true,
      outerHTML: match.outerHTML,
      computedStyle: {
        display: getComputedStyle(match).display,
        visibility: getComputedStyle(match).visibility,
        opacity: getComputedStyle(match).opacity,
        width: getComputedStyle(match).width,
        height: getComputedStyle(match).height
      }
    };
  }
  return { found: false };
});

// ================================================================
// B4: Product menu / catalog grid
// ================================================================
console.log('\n=== B4: Product catalog ===');
await page.evaluate(() => {
  document.querySelector('#catalog, [class*="catalog"], [class*="grid"]')
    ?.scrollIntoView({ behavior: 'instant' });
});
await page.waitForTimeout(2000);
await page.screenshot({ path: path.join(dir, 'B4-catalog.png'), fullPage: false });

report.tests.B4 = await page.evaluate(() => {
  const cards = [...document.querySelectorAll('[class*="card"], [class*="product"]')];
  const imgs = [...document.querySelectorAll('img')].filter(i =>
    i.closest('[class*="catalog"], [class*="grid"], [class*="carousel"]')
  );
  return {
    catalogImages: imgs.length,
    images: imgs.map(i => ({
      src: i.src || '(empty)',
      alt: i.alt,
      naturalWidth: i.naturalWidth
    })),
    anyCpPublic: imgs.some(i => i.src?.includes('cp-public'))
  };
});

// ================================================================
// B5: Funnel runtime
// ================================================================
console.log('\n=== B5: Funnel /sports ===');
await page.goto(`${BASE}/sports`, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(3000);
await page.screenshot({ path: path.join(dir, 'B5-sports.png'), fullPage: true });

report.tests.B5 = await page.evaluate(() => ({
  totalImgs: document.querySelectorAll('img').length,
  totalVideos: document.querySelectorAll('video').length,
  videos: [...document.querySelectorAll('video')].map(v => ({
    src: v.src || v.currentSrc || '(empty)',
    poster: v.poster,
    videoWidth: v.videoWidth,
    videoHeight: v.videoHeight
  })),
  imgs: [...document.querySelectorAll('img')].map(i => ({
    src: i.src || '(empty)',
    alt: i.alt,
    naturalWidth: i.naturalWidth,
    inFunnelSection: !!i.closest('[class*="funnel"], section')
  })),
  anyCpPublicMedia: [
    ...document.querySelectorAll('img, video')
  ].some(el => (el.src || el.currentSrc || '').includes('cp-public'))
}));

// ================================================================
// B6: Blog runtime + head meta
// ================================================================
console.log('\n=== B6: Blog ===');
await page.goto(`${BASE}/blog`, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);
await page.screenshot({ path: path.join(dir, 'B6-blog.png'), fullPage: true });

report.tests.B6 = await page.evaluate(() => ({
  head: {
    ogImage: document.querySelector('meta[property="og:image"]')?.content || null,
    ogTitle: document.querySelector('meta[property="og:title"]')?.content || null,
    ogDescription: document.querySelector('meta[property="og:description"]')?.content || null,
    canonical: document.querySelector('link[rel="canonical"]')?.href || null,
    metaDescription: document.querySelector('meta[name="description"]')?.content || null,
    jsonLd: document.querySelector('script[type="application/ld+json"]')?.textContent?.slice(0, 500) || null
  },
  imgs: [...document.querySelectorAll('img')].map(i => ({
    src: i.src || '(empty)',
    alt: i.alt,
    naturalWidth: i.naturalWidth
  }))
}));

// ================================================================
// B7: Direct URL tests (via fetch in page)
// ================================================================
console.log('\n=== B7: Public URL tests ===');
report.tests.B7 = await page.evaluate(async () => {
  const urls = {
    productPublic: 'https://efvvczmopacoroudzfnl.supabase.co/storage/v1/object/public/cp-public/products/84ff8050-8c5c-4e5f-ad4d-25449f978b56/1792115800215_gpa7pi_test-product.png',
    mediaPublic: 'https://efvvczmopacoroudzfnl.supabase.co/storage/v1/object/public/cp-public/media/42d36cee-4cd6-43d1-af5d-334e5a07e37c/1792117400544_8n47c4_test-animated.webp',
    productObject: 'https://efvvczmopacoroudzfnl.supabase.co/storage/v1/object/cp-public/products/84ff8050-8c5c-4e5f-ad4d-25449f978b56/1792115800215_gpa7pi_test-product.png'
  };
  const out = {};
  for (const [k, url] of Object.entries(urls)) {
    try {
      const r = await fetch(url, { method: 'HEAD' });
      out[k] = { status: r.status, ok: r.ok, ct: r.headers.get('content-type') };
    } catch (e) {
      out[k] = { error: String(e) };
    }
  }
  return out;
});

// ================================================================
// B8: Raw HTML — SSR check
// ================================================================
console.log('\n=== B8: Raw HTML ===');
const rawHtml = await page.evaluate(() => document.documentElement.outerHTML);
report.tests.B8 = {
  hasTestProduct: rawHtml.includes('test-product.png'),
  hasCpPublic: rawHtml.includes('cp-public'),
  imgTagCount: (rawHtml.match(/<img/g) || []).length,
  htmlSize: rawHtml.length,
  firstImgs: [...rawHtml.matchAll(/<img[^>]*>/g)].slice(0, 5).map(m => m[0])
};

// ================================================================
// Emit consolidated report
// ================================================================
report.consoleLogs = consoleLogs.filter(l => l.type === 'error').slice(0, 30);
report.pageErrors = pageErrors;
report.networkSummary = networkResponses.map(r => ({
  url: r.url.slice(0, 150),
  status: r.status,
  ct: r.ct
}));

fs.writeFileSync(path.join(dir, 'phase-b-report.json'), JSON.stringify(report, null, 2));

console.log('\n========================================');
console.log('PHASE B COMPLETE');
console.log('========================================');
console.log(`Evidence folder: ${dir}`);
console.log(`Screenshots: B1, B4, B5, B6`);
console.log(`HAR: session.har`);
console.log(`JSON: phase-b-report.json`);
console.log('\nVerdict summary:');
console.log({
  B1: { totalImages: report.tests.B1.totalImages, anyTestProduct: report.tests.B1.anyTestProduct, anyCpPublic: report.tests.B1.anyCpPublic },
  B2: { fetches: report.tests.B2.length, hasMediaKey: report.tests.B2[0]?.hasMediaKey },
  B3: { found: report.tests.B3.found },
  B4: { catalogImages: report.tests.B4.catalogImages, anyCpPublic: report.tests.B4.anyCpPublic },
  B5: { totalImgs: report.tests.B5.totalImgs, totalVideos: report.tests.B5.totalVideos, anyCpPublicMedia: report.tests.B5.anyCpPublicMedia },
  B6: { ogImage: report.tests.B6.head.ogImage, canonical: report.tests.B6.head.canonical },
  B7: report.tests.B7,
  B8: { hasTestProduct: report.tests.B8.hasTestProduct, imgTagCount: report.tests.B8.imgTagCount }
});

await context.close();
await browser.close();
process.exit(0);
