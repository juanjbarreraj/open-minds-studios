// Screenshot harness for the visual review. Usage:
//   node shoot.mjs <outDir> [--routes a,b,c]
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.SHOT_BASE || 'http://localhost:5173';
const outDir = process.argv[2];
fs.mkdirSync(outDir, { recursive: true });

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
];

const PUBLIC_ROUTES = [
  ['home', '/Home'],
  ['about', '/about'],
  ['services', '/services'],
  ['subscription-plans', '/subscription-plans'],
  ['contact', '/contact'],
  ['guide', '/guide'],
  ['register', '/register'],
];

const browser = await chromium.launch();

async function shoot(page, name, vp) {
  await page.screenshot({ path: path.join(outDir, `${name}-${vp.name}.png`), fullPage: vp.full !== false });
}

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log(`PAGEERROR ${vp.name}: ${e.message}`));

  for (const [name, route] of PUBLIC_ROUTES) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    await shoot(page, name, vp);
  }

  // Auth modal on the landing page.
  await page.goto(`${BASE}/Home`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const loginBtn = page.locator('button', { hasText: /student.*(login|parent)/i }).first();
  if (await loginBtn.count()) {
    await loginBtn.click();
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(outDir, `auth-modal-${vp.name}.png`) });
  }

  await ctx.close();
}

// Dashboards need a session each.
const dashboards = [
  ['student-dashboard', '/student-dashboard', 'student@demo.local', 'student123'],
  ['tutor-dashboard', '/tutor-dashboard', 'tutor@demo.local', 'tutor123'],
  ['manager-dashboard', '/manager-dashboard', 'manager@demo.local', 'manager123'],
  ['booking', '/appointment-scheduling', 'student@demo.local', 'student123'],
];

for (const vp of VIEWPORTS) {
  for (const [name, route, email, password] of dashboards) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => console.log(`PAGEERROR ${name} ${vp.name}: ${e.message}`));
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
    await page.locator('button', { hasText: /sign in/i }).first().click().catch(() => {});
    await page.waitForTimeout(700);
    if (await page.locator('input[type="password"]').isVisible().catch(() => false)) {
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', password);
      await page.locator('button[type="submit"]').last().click();
      await page.waitForTimeout(2600);
      await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1600);
      // Open a day on the booking grid so slots are visible.
      if (name === 'booking') {
        const day = page.locator('button').filter({ hasText: /^(MON|TUE|WED|THU|FRI|SAT|SUN)/i }).nth(1);
        if (await day.count()) { await day.click(); await page.waitForTimeout(900); }
      }
      await shoot(page, name, vp);
    }
    await ctx.close();
  }
}

await browser.close();
console.log(`screenshots written to ${outDir}`);
