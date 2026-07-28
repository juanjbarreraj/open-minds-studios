// End-to-end UI verification against the running dev stack (localhost:5173).
import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
let passed = 0;
const failures = [];
const netErrors = [];
const consoleErrors = [];

function check(name, cond, detail = '') {
  if (cond) { passed++; console.log(`  ok   ${name}`); }
  else { failures.push(`${name} ${detail}`); console.log(`  FAIL ${name} ${detail}`); }
}

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

const base44Requests = [];
page.on('request', (r) => {
  const u = r.url();
  if (/base44/i.test(u)) base44Requests.push(u);
});
page.on('requestfailed', (r) => {
  if (!/favicon/.test(r.url())) netErrors.push(`${r.url()} :: ${r.failure()?.errorText}`);
});
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});
page.on('pageerror', (e) => consoleErrors.push(`PAGEERROR: ${e.message}`));

const goto = async (path) => {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
};

console.log('\n== Public pages render without authentication ==');
for (const [path, expect] of [
  ['/Home', /Open Minds|Tutoring|tutoring/i],
  ['/about', /About/i],
  ['/services', /Services|Support/i],
  ['/subscription-plans', /Program|Plan/i],
  ['/contact', /Contact|Get in touch|inquiry|Parent/i],
  ['/guide', /Guide|Journey/i],
  ['/privacy-policy', /Privacy/i],
  ['/terms-of-service', /Terms/i],
  ['/payment-policy', /Payment/i],
]) {
  await goto(path);
  const body = await page.textContent('body');
  const rendered = body && body.trim().length > 400;
  check(`${path} renders content`, rendered && expect.test(body), rendered ? '' : `(len ${body?.trim().length})`);
}

console.log('\n== Direct navigation / refresh works ==');
await goto('/contact');
await page.reload({ waitUntil: 'networkidle' });
check('refresh on /contact keeps the page', (await page.textContent('body')).includes('Contact') || (await page.textContent('body')).length > 400);

console.log('\n== Subscription program carries to contact form ==');
await goto('/subscription-plans');
const planButtons = await page.locator('button', { hasText: /Get Started|Choose|Select|Start/i }).all();
check('subscription plan CTA buttons exist', planButtons.length > 0, `found ${planButtons.length}`);
if (planButtons.length > 0) {
  await planButtons[0].click();
  await page.waitForURL(/\/contact\?program=/, { timeout: 10000 }).catch(() => {});
  check('clicking a plan navigates to /contact with program param', /\/contact\?program=/.test(page.url()), page.url());
  await page.waitForLoadState('networkidle');
  const selected = await page.locator('select').first().inputValue().catch(() => null);
  const programText = decodeURIComponent((page.url().split('program=')[1] || ''));
  check('program preselected in the form', Boolean(selected) && selected.includes(programText.split(' ')[0]), `select="${selected}" url="${programText}"`);
}

console.log('\n== Contact form submits to the local API ==');
await goto('/contact');
const stamp = Date.now();
await page.fill('input[name="parentName"], input[placeholder*="name" i]', 'Playwright Parent');
await page.fill('input[type="email"]', `pw${stamp}@example.com`);
const textareas = await page.locator('textarea').all();
for (const ta of textareas) await ta.fill('Automated UI test submission.');
const inputs = await page.locator('input[type="text"]').all();
for (const inp of inputs) {
  const val = await inp.inputValue();
  if (!val) await inp.fill('Automated test');
}
await page.locator('button[type="submit"], button:has-text("Send"), button:has-text("Submit")').first().click();
await page.waitForTimeout(2500);
const afterSubmit = await page.textContent('body');
check('contact form shows a success state', /thank|received|touch|success|sent/i.test(afterSubmit), afterSubmit.slice(0, 0));

console.log('\n== Student login and dashboard ==');
await goto('/Home');
const studentBtn = page.locator('button, a').filter({ hasText: /student|parent/i }).first();
await studentBtn.click().catch(() => {});
await page.waitForTimeout(800);
let modalVisible = await page.locator('input[type="password"]').isVisible().catch(() => false);
if (!modalVisible) {
  await goto('/student-dashboard');
  await page.locator('button', { hasText: /sign in/i }).first().click().catch(() => {});
  await page.waitForTimeout(800);
  modalVisible = await page.locator('input[type="password"]').isVisible().catch(() => false);
}
check('local sign-in form appears (no hosted redirect)', modalVisible);
check('no redirect away from localhost', page.url().startsWith(BASE), page.url());

if (modalVisible) {
  await page.fill('input[type="email"]', 'student@demo.local');
  await page.fill('input[type="password"]', 'student123');
  await page.locator('button[type="submit"]').last().click();
  await page.waitForTimeout(2500);
  await goto('/student-dashboard');
  const dash = await page.textContent('body');
  check('student dashboard loads with data', /Alex|Session|Module|Dashboard|Upcoming/i.test(dash), dash.slice(0, 120));
  check('student dashboard is not showing pending-approval', !/pending approval/i.test(dash));

  console.log('\n== Scheduling grid ==');
  await goto('/appointment-scheduling');
  await page.waitForTimeout(1500);
  const sched = await page.textContent('body');
  check('scheduling page loads for approved student', /Book|Schedule|Available|slot/i.test(sched));
  const dayCells = await page.locator('button').filter({ hasText: /^(MON|TUE|WED|THU|FRI|SAT|SUN)/i }).all();
  check('seven-day navigation rendered', dayCells.length === 7, `day cells=${dayCells.length}`);

  // Today's remaining hours depend on the clock, so move to the next week
  // where a whole 9:00 to 17:00 window is bookable. This keeps the slot-rule
  // assertions below deterministic whatever day and time the suite runs at.
  await page.locator('button', { hasText: /^Next/ }).first().click();
  await page.waitForTimeout(700);
  const futureDayCells = await page.locator('button').filter({ hasText: /^(MON|TUE|WED|THU|FRI|SAT|SUN)/i }).all();
  check('week navigation moves forward in 7-day groups', futureDayCells.length === 7, `day cells=${futureDayCells.length}`);

  // Find a day with availability and verify the 60-minute slot rules in the UI.
  let slotTexts = [];
  let etNote = false;
  for (const cell of futureDayCells) {
    await cell.click();
    await page.waitForTimeout(700);
    const body = await page.textContent('body');
    if (/Eastern Time/i.test(body)) etNote = true;
    const texts = await page.locator('button').filter({ hasText: /\d+:\d+ (am|pm) to \d+:\d+ (am|pm)/i }).allTextContents();
    if (texts.length > slotTexts.length) slotTexts = texts;
  }
  check('Eastern Time note shown on the day panel', etNote);
  check('bookable 1-hour slots rendered', slotTexts.length > 0, `${slotTexts.length} slots`);
  check('every slot is exactly one hour', slotTexts.every((t) => {
    const m = t.match(/(\d+):(\d+) (am|pm) to (\d+):(\d+) (am|pm)/i);
    if (!m) return false;
    const to24 = (h, mm, ap) => ((Number(h) % 12) + (ap.toLowerCase() === 'pm' ? 12 : 0)) * 60 + Number(mm);
    return to24(m[1], m[2], m[3]) + 60 === to24(m[4], m[5], m[6]);
  }), slotTexts.join(' | '));
  check('9:00 to 17:00 window ends with a 4:00 pm start', slotTexts.some((t) => /^4:00 pm to 5:00 pm/i.test(t.trim())), slotTexts.join(' | '));
  check('no slot starts at or after 5:00 pm', !slotTexts.some((t) => /^5:00 pm|^6:00 pm/i.test(t.trim())), slotTexts.join(' | '));

  // Back on the current week: hours that already started today are still
  // listed, but must not be clickable.
  await page.locator('button', { hasText: /Previous/ }).first().click();
  await page.waitForTimeout(700);
  const etNow = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date());
  const etWeekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', weekday: 'short',
  }).format(new Date()).toUpperCase();

  const todayCell = page.locator('button')
    .filter({ hasText: new RegExp(`^${etWeekday}`, 'i') }).first();
  await todayCell.click();
  await page.waitForTimeout(700);

  const to24 = (label) => {
    const m = label.match(/(\d+):(\d+) (am|pm) to/i);
    if (!m) return null;
    const h = (Number(m[1]) % 12) + (m[3].toLowerCase() === 'pm' ? 12 : 0);
    return `${String(h).padStart(2, '0')}:${m[2]}`;
  };
  const clickableToday = await page.locator('button')
    .filter({ hasText: /\d+:\d+ (am|pm) to \d+:\d+ (am|pm)/i }).allTextContents();
  const stillOfferedPastHours = clickableToday
    .map((t) => to24(t))
    .filter((start) => start && start < etNow);
  check(
    'hours that already started today are not clickable',
    stillOfferedPastHours.length === 0,
    `now=${etNow} offered=${stillOfferedPastHours.join(',')}`
  );

  console.log('\n== Student sign out ==');
  const signOut = page.locator('button', { hasText: /sign out|log out/i }).first();
  if (await signOut.count()) {
    await signOut.click();
    await page.waitForTimeout(2000);
    check('sign out returns to a public page', page.url().startsWith(BASE));
  } else {
    check('sign out control present', false, 'no sign out button found');
  }
}

console.log('\n== Tutor dashboard ==');
const tctx = await browser.newContext();
const tpage = await tctx.newPage();
tpage.on('request', (r) => { if (/base44/i.test(r.url())) base44Requests.push(r.url()); });
tpage.on('pageerror', (e) => consoleErrors.push(`TUTOR PAGEERROR: ${e.message}`));
await tpage.goto(`${BASE}/tutor-dashboard`, { waitUntil: 'networkidle' });
await tpage.locator('button', { hasText: /sign in/i }).first().click().catch(() => {});
await tpage.waitForTimeout(800);
if (await tpage.locator('input[type="password"]').isVisible().catch(() => false)) {
  await tpage.fill('input[type="email"]', 'tutor@demo.local');
  await tpage.fill('input[type="password"]', 'tutor123');
  await tpage.locator('button[type="submit"]').last().click();
  await tpage.waitForTimeout(3000);
  await tpage.goto(`${BASE}/tutor-dashboard`, { waitUntil: 'networkidle' });
  const tbody = await tpage.textContent('body');
  check('tutor dashboard loads', /Jordan|Appointment|Availability|Student/i.test(tbody), tbody.slice(0, 120));
  check('tutor sees appointments section', /Appointment/i.test(tbody));
  check('tutor dashboard not stuck on approval screen', !/pending approval/i.test(tbody));
} else {
  check('tutor sign-in form appears', false);
}

console.log('\n== Manager dashboard ==');
const mctx = await browser.newContext();
const mpage = await mctx.newPage();
mpage.on('request', (r) => { if (/base44/i.test(r.url())) base44Requests.push(r.url()); });
mpage.on('pageerror', (e) => consoleErrors.push(`MANAGER PAGEERROR: ${e.message}`));
await mpage.goto(`${BASE}/manager-dashboard`, { waitUntil: 'networkidle' });
await mpage.locator('button', { hasText: /sign in/i }).first().click().catch(() => {});
await mpage.waitForTimeout(800);
if (await mpage.locator('input[type="password"]').isVisible().catch(() => false)) {
  await mpage.fill('input[type="email"]', 'manager@demo.local');
  await mpage.fill('input[type="password"]', 'manager123');
  await mpage.locator('button[type="submit"]').last().click();
  await mpage.waitForTimeout(3000);
  await mpage.goto(`${BASE}/manager-dashboard`, { waitUntil: 'networkidle' });
  const mbody = await mpage.textContent('body');
  check('manager dashboard loads', /Tutor|Course|Student|Booking/i.test(mbody), mbody.slice(0, 120));
  check('manager not denied access', !/access denied/i.test(mbody), mbody.slice(0, 200));
  // Click through management tabs and confirm each renders real seeded data.
  const tabExpectations = [
    ['Tutors', /Jordan Blake/],
    ['Courses', /SAT Math Preparation/],
    ['Tutor Courses', /SAT-MATH/],
    ['Availability', /09:00/],
    ['Bookings', /Appointment Confirmed/],
    ['Students', /Alex Rivera/],
  ];
  for (const [tab, expected] of tabExpectations) {
    const t = mpage.locator('button').filter({ hasText: new RegExp(`^${tab}$`) }).first();
    if (await t.count()) {
      await t.click();
      await mpage.waitForTimeout(1200);
      const tabBody = await mpage.textContent('body');
      check(`manager ${tab} tab shows data`, expected.test(tabBody), tabBody.replace(/\s+/g, ' ').slice(150, 300));
    } else {
      check(`manager ${tab} tab exists`, false);
    }
  }
  // Re-open Bookings and assert the display details on that panel.
  await mpage.locator('button').filter({ hasText: /^Bookings$/ }).first().click();
  await mpage.waitForTimeout(1200);
  const mgrBody = await mpage.textContent('body');
  check('booking status shows friendly label', /Appointment Confirmed/.test(mgrBody), mgrBody.replace(/\s+/g, ' ').slice(150, 350));
  check('no raw lowercase status leaks into the UI', !/\b(pending|confirmed|declined|cancelled|completed)\b/.test(mgrBody.replace(/Appointment Confirmed/g, '')), mgrBody.replace(/\s+/g, ' ').slice(150, 350));
  check('booking row shows the real session date', /\d{4}-\d{2}-\d{2}/.test(mgrBody), mgrBody.replace(/\s+/g, ' ').slice(150, 350));
  check('no em dash in manager dashboard text', !mgrBody.includes('—'));
} else {
  check('manager sign-in form appears', false);
}

console.log('\n== Unapproved account is blocked ==');
const pctx = await browser.newContext();
const ppage = await pctx.newPage();
ppage.on('pageerror', (e) => consoleErrors.push(`PENDING PAGEERROR: ${e.message}`));
await ppage.goto(`${BASE}/student-dashboard`, { waitUntil: 'networkidle' });
await ppage.locator('button', { hasText: /sign in/i }).first().click().catch(() => {});
await ppage.waitForTimeout(800);
if (await ppage.locator('input[type="password"]').isVisible().catch(() => false)) {
  await ppage.fill('input[type="email"]', 'pending@demo.local');
  await ppage.fill('input[type="password"]', 'pending123');
  await ppage.locator('button[type="submit"]').last().click();
  await ppage.waitForTimeout(3000);
  await ppage.goto(`${BASE}/student-dashboard`, { waitUntil: 'networkidle' });
  const pbody = await ppage.textContent('body');
  check('unapproved user sees pending/approval screen', /pending|approval|access/i.test(pbody), pbody.slice(0, 150));
}

console.log('\n== Base44 network check ==');
check('zero requests to any base44 host', base44Requests.length === 0, base44Requests.join(', '));

await browser.close();

console.log(`\nConsole/page errors observed (${consoleErrors.length}):`);
for (const e of consoleErrors.slice(0, 15)) console.log(`  - ${e}`);
console.log(`Failed network requests (${netErrors.length}):`);
for (const e of netErrors.slice(0, 10)) console.log(`  - ${e}`);

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.log(`FAILED: ${f}`);
  process.exit(1);
}
