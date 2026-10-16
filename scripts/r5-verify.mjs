import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext()).newPage();
await page.goto('http://localhost:3000/blog/hoeos-seo-test', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
await page.screenshot({ path: 'evidence/R5-blog.png', fullPage: true });

const meta = await page.evaluate(() => ({
  ogImage: document.querySelector('meta[property="og:image"]')?.content,
  ogTitle: document.querySelector('meta[property="og:title"]')?.content,
  canonical: document.querySelector('link[rel="canonical"]')?.href,
  title: document.title
}));
console.log('Meta:', JSON.stringify(meta, null, 2));

const imgs = await page.evaluate(() =>
  [...document.querySelectorAll('img')].map(i => ({ src: i.src.slice(-40), w: i.naturalWidth }))
);
console.log('Images:', JSON.stringify(imgs, null, 2));

await browser.close();
