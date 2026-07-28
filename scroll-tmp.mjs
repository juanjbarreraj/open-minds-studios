import { chromium } from 'playwright';
const out = process.argv[2];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto('http://localhost:5173/Home', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
const height = await page.evaluate(() => document.body.scrollHeight);
console.log('page height', height);
let i = 0;
for (let y = 0; y < height; y += 850) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/scroll-${String(i).padStart(2,'0')}.png` });
  i++;
}
await browser.close();
console.log('captured', i, 'viewport shots');
