import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('http://localhost:5173/Home', { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
await p.screenshot({ path: process.argv[2] });
await b.close();
