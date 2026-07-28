// Automated API tests against a throwaway database. Run with: npm run test:api
// Covers authentication, role enforcement, data scoping, scheduling rules,
// module workflow, uploads, and inquiries.
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

const stamp = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
process.env.DATABASE_PATH = path.join(os.tmpdir(), `oms-test-${stamp}.db`);
process.env.UPLOADS_DIR = path.join(os.tmpdir(), `oms-test-uploads-${stamp}`);
process.env.SESSION_SECRET = 'test-secret';

const { runSeed } = await import('../db/seed.js');
const { createApp } = await import('../app.js');
const { default: db } = await import('../db/database.js');
const { todayInAppTz, addDays, nextDateForWeekday } = await import('../lib/time.js');

runSeed();
const app = createApp({ sessionSecret: 'test-secret' });
const server = await new Promise((resolve) => {
  const s = app.listen(0, () => resolve(s));
});
const BASE = `http://localhost:${server.address().port}/api`;

let passed = 0;
const failures = [];
function check(name, cond, detail = '') {
  if (cond) {
    passed += 1;
    console.log(`  ok   ${name}`);
  } else {
    failures.push({ name, detail });
    console.log(`  FAIL ${name} ${detail}`);
  }
}

function client() {
  let cookie = '';
  const call = async (method, url, body, opts = {}) => {
    const headers = { ...(opts.headers || {}) };
    if (cookie) headers.Cookie = cookie;
    let payload;
    if (body instanceof FormData) {
      payload = body;
    } else if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }
    const res = await fetch(`${BASE}${url}`, { method, headers, body: payload });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    let data = null;
    const text = await res.text();
    try { data = JSON.parse(text); } catch { data = text; }
    return { status: res.status, data, headers: res.headers };
  };
  return {
    get: (url) => call('GET', url),
    post: (url, body) => call('POST', url, body),
    patch: (url, body) => call('PATCH', url, body),
    del: (url) => call('DELETE', url),
    clear: () => { cookie = ''; },
  };
}

const student = client();
const tutor = client();
const manager = client();
const pending = client();
const anon = client();
const second = client();

console.log('\n== Auth ==');
{
  const r = await anon.get('/health');
  check('health endpoint', r.status === 200 && r.data.ok === true);

  const meAnon = await anon.get('/auth/me');
  check('me without session reports nobody signed in', meAnon.status === 200 && meAnon.data.user === null);

  const bad = await student.post('/auth/login', { email: 'student@demo.local', password: 'wrong' });
  check('wrong password rejected 401', bad.status === 401);

  const s = await student.post('/auth/login', { email: 'student@demo.local', password: 'student123' });
  check('student login works', s.status === 200 && s.data.user.email === 'student@demo.local');
  check('student profile attached', s.data.student?.can_access_student_portal === true);

  const t = await tutor.post('/auth/login', { email: 'tutor@demo.local', password: 'tutor123' });
  check('tutor login works', t.status === 200 && t.data.tutor?.approved === true);

  const m = await manager.post('/auth/login', { email: 'manager@demo.local', password: 'manager123' });
  check('manager login works', m.status === 200 && m.data.tutor?.can_access_manager_dashboard === true);

  const p = await pending.post('/auth/login', { email: 'pending@demo.local', password: 'pending123' });
  check('unapproved user can log in (sees pending screen)', p.status === 200 && p.data.student?.approved === false);

  const me = await student.get('/auth/me');
  check('session cookie persists', me.status === 200 && me.data.user.email === 'student@demo.local');
}

console.log('\n== Role enforcement ==');
{
  const r1 = await student.get('/students');
  check('student blocked from manager list (403)', r1.status === 403);
  const r2 = await tutor.get('/students');
  check('plain tutor blocked from manager list (403)', r2.status === 403);
  const r3 = await manager.get('/students');
  check('manager can list students', r3.status === 200 && Array.isArray(r3.data));
  const r4 = await pending.post('/bookings', { tutor_id: 'x', session_date: '2030-01-01', preferred_start_time: '09:00' });
  check('unapproved student cannot book (403)', r4.status === 403);
  const r5 = await anon.get('/bookings');
  check('anonymous blocked from bookings (401)', r5.status === 401);
  const r6 = await student.post('/tutors', { full_name: 'X', email: 'x@x.com' });
  check('student cannot create tutors (403)', r6.status === 403);
}

console.log('\n== Data scoping ==');
let tutorId;
{
  const tutors = await student.get('/tutors');
  check('student sees only approved tutors with safe fields', tutors.status === 200 &&
    tutors.data.every((t) => t.approved) && tutors.data.every((t) => t.phone === undefined));
  tutorId = tutors.data.find((t) => t.email === 'tutor@demo.local')?.id;
  check('demo tutor visible', Boolean(tutorId));

  const own = await student.get('/bookings');
  check('student sees only own bookings', own.status === 200 &&
    own.data.length > 0 && own.data.every((b) => b.student_email === 'student@demo.local'));

  const tb = await tutor.get('/bookings');
  check('tutor sees only own assigned bookings', tb.status === 200 &&
    tb.data.length > 0 && tb.data.every((b) => b.tutor_id === tutorId));

  const all = await manager.get('/bookings');
  check('manager sees all bookings', all.status === 200 && all.data.length >= tb.data.length);
}

console.log('\n== Scheduling rules ==');
const today = todayInAppTz();
const monday = nextDateForWeekday(addDays(today, 1), 'Monday');
let acceptedId;
let declinedTargetId;
{
  const late = await student.post('/bookings', {
    tutor_id: tutorId, session_date: monday, preferred_start_time: '17:00',
  });
  check('17:00 start rejected for 9-to-5 window', late.status === 400);

  const overflow = await student.post('/bookings', {
    tutor_id: tutorId, session_date: monday, preferred_start_time: '16:30',
  });
  check('16:30 start rejected (not on 60-minute grid)', overflow.status === 400);

  const early = await student.post('/bookings', {
    tutor_id: tutorId, session_date: monday, preferred_start_time: '08:00',
  });
  check('08:00 start rejected (before window)', early.status === 400);

  const lastSlot = await student.post('/bookings', {
    tutor_id: tutorId, session_date: monday, preferred_start_time: '16:00',
    course_id: null, assignment_description: 'Final slot test', meeting_type: 'Online',
  });
  check('16:00 is the last bookable start for 9-to-5', lastSlot.status === 201);
  check('new booking starts as pending', lastSlot.data.status === 'pending');
  check('booking is exactly one hour', lastSlot.data.preferred_end_time === '17:00');
  check('booking stores real session date', lastSlot.data.session_date === monday);
  acceptedId = lastSlot.data.id;

  const past = await student.post('/bookings', {
    tutor_id: tutorId, session_date: addDays(today, -7), preferred_start_time: '10:00',
  });
  check('past date rejected', past.status === 400);

  const farMonday = nextDateForWeekday(addDays(today, 31), 'Monday');
  const tooFar = await student.post('/bookings', {
    tutor_id: tutorId, session_date: farMonday, preferred_start_time: '09:00',
  });
  check('booking beyond 30 days rejected', tooFar.status === 400);

  const wrongDay = await student.post('/bookings', {
    tutor_id: tutorId, session_date: nextDateForWeekday(addDays(today, 1), 'Friday'), preferred_start_time: '10:00',
  });
  check('day without availability rejected', wrongDay.status === 400);
}

console.log('\n== Double booking ==');
{
  // Register and approve a second student, then contest the same slot.
  const reg = await second.post('/auth/register', {
    email: 'second@demo.local', password: 'second123', full_name: 'Riley Second', account_type: 'student',
  });
  check('registration works', reg.status === 201 && reg.data.student?.approved === false);

  const students = await manager.get('/students');
  const secondProfile = students.data.find((s) => s.email === 'second@demo.local');
  const approve = await manager.patch(`/students/${secondProfile.id}`, {
    approved: true, can_access_student_portal: true,
  });
  check('manager can approve a student', approve.status === 200 && approve.data.approved === true);

  const clash = await second.post('/bookings', {
    tutor_id: tutorId, session_date: monday, preferred_start_time: '16:00',
  });
  check('double booking rejected (409)', clash.status === 409);

  const free = await second.post('/bookings', {
    tutor_id: tutorId, session_date: monday, preferred_start_time: '11:00',
  });
  check('different slot still bookable', free.status === 201);
  declinedTargetId = free.data.id;
}

console.log('\n== Booking lifecycle ==');
{
  const notMine = await second.patch(`/bookings/${acceptedId}/status`, { status: 'cancelled' });
  check('student cannot touch another student\'s booking', notMine.status === 403);

  const wrongTutorAction = await second.patch(`/bookings/${acceptedId}/status`, { status: 'confirmed' });
  check('student cannot confirm a booking', wrongTutorAction.status === 403);

  const accept = await tutor.patch(`/bookings/${acceptedId}/status`, { status: 'confirmed' });
  check('tutor can accept (pending -> confirmed)', accept.status === 200 && accept.data.status === 'confirmed');

  const decline = await tutor.patch(`/bookings/${declinedTargetId}/status`, { status: 'declined' });
  check('tutor can decline (pending -> declined)', decline.status === 200 && decline.data.status === 'declined');
  check('decline is timestamped for audit', Boolean(decline.data.declined_at));

  const rebook = await student.post('/bookings', {
    tutor_id: tutorId, session_date: monday, preferred_start_time: '11:00',
  });
  check('declined slot becomes bookable again', rebook.status === 201);

  const cancel = await student.patch(`/bookings/${rebook.data.id}/status`, { status: 'cancelled' });
  check('student can cancel own booking', cancel.status === 200 && cancel.data.status === 'cancelled');
  check('cancel is timestamped for audit', Boolean(cancel.data.cancelled_at));

  const rebook2 = await second.post('/bookings', {
    tutor_id: tutorId, session_date: monday, preferred_start_time: '11:00',
  });
  check('cancelled slot becomes bookable again', rebook2.status === 201);

  const mine = await student.get('/bookings');
  const cancelledRow = mine.data.find((b) => b.id === rebook.data.id);
  check('cancelled booking preserved as audit record', cancelledRow?.status === 'cancelled');

  const invalid = await tutor.patch(`/bookings/${acceptedId}/status`, { status: 'pending' });
  check('invalid transition rejected', invalid.status === 400);
}

console.log('\n== Busy feed privacy ==');
{
  const busy = await second.get('/bookings/busy');
  const foreign = busy.data.filter((b) => !b.is_own);
  check('busy feed marks foreign bookings', busy.status === 200 && foreign.length > 0);
  check('foreign bookings carry no personal data', foreign.every(
    (b) => b.student_email === undefined && b.student_first_name === undefined && b.assignment_description === undefined
  ));
  check('own bookings carry full data', busy.data.filter((b) => b.is_own).every((b) => b.student_email !== undefined));
}

console.log('\n== Modules and uploads ==');
{
  const created = await tutor.post('/modules', {
    student_email: 'student@demo.local', student_name: 'Alex Rivera',
    name: 'Quadratics Review', description: 'Practice problems 1-20.',
  });
  check('tutor can assign a module', created.status === 201 && created.data.status === 'assigned');
  const moduleId = created.data.id;

  const visible = await student.get('/modules');
  check('student sees assigned module', visible.data.some((m) => m.id === moduleId));

  const fd = new FormData();
  fd.append('file', new Blob(['my homework answers'], { type: 'text/plain' }), 'homework.txt');
  const uploaded = await student.post('/files', fd);
  check('student can upload a file', uploaded.status === 201 && uploaded.data.file_url.startsWith('/api/files/'));

  const badType = new FormData();
  badType.append('file', new Blob(['#!/bin/sh'], { type: 'application/x-sh' }), 'evil.sh');
  const rejected = await student.post('/files', badType);
  check('disallowed file type rejected', rejected.status === 400);

  const submitted = await student.post(`/modules/${moduleId}/submit`, { file_id: uploaded.data.id });
  check('student can submit module', submitted.status === 200 && submitted.data.status === 'submitted');
  check('submission timestamped', Boolean(submitted.data.submitted_at));

  const otherSubmit = await second.post(`/modules/${moduleId}/submit`, { file_id: uploaded.data.id });
  check('other student cannot submit someone else\'s module', otherSubmit.status === 403);

  const download = await tutor.get(`/files/${uploaded.data.id}`);
  check('tutor can download student submission', download.status === 200);

  const otherDownload = await second.get(`/files/${uploaded.data.id}`);
  check('unrelated student cannot download the file', otherDownload.status === 403);

  const graded = await tutor.post(`/modules/${moduleId}/grade`, { grade: 'A', feedback: 'Nice work.' });
  check('tutor can grade submission', graded.status === 200 && graded.data.status === 'graded' && graded.data.grade === 'A');
  check('grading timestamped', Boolean(graded.data.graded_at));

  const studentGrade = await student.post(`/modules/${moduleId}/grade`, { grade: 'F' });
  check('student cannot grade (403)', studentGrade.status === 403);
}

console.log('\n== Inquiries and notification outbox ==');
{
  const inquiry = await anon.post('/inquiries', {
    parent_name: 'Pat Tester', email: 'pat@example.com', student_grade: '10th Grade',
    subject_or_exam: 'SAT', goals: 'Improve reading score', message: 'Looking for weekly help.',
    interested_program: 'Foundation Program',
  });
  check('public inquiry stored without auth', inquiry.status === 201);

  const invalid = await anon.post('/inquiries', { parent_name: '', email: 'not-an-email' });
  check('invalid inquiry rejected', invalid.status === 400);

  const list = await manager.get('/inquiries');
  check('manager can list inquiries', list.status === 200 &&
    list.data.some((i) => i.email === 'pat@example.com' && i.interested_program === 'Foundation Program'));

  const anonList = await anon.get('/inquiries');
  check('anonymous cannot list inquiries', anonList.status === 401);

  const outbox = db.prepare("SELECT * FROM notification_outbox WHERE event_type LIKE 'inquiry.%'").all();
  check('inquiry produced admin + parent outbox rows', outbox.length >= 2);
  check('outbox rows contain no em dashes', outbox.every((o) => !o.body.includes('—') && !o.subject.includes('—')));

  const bookingOutbox = db.prepare("SELECT * FROM notification_outbox WHERE event_type LIKE 'booking.%'").all();
  check('booking events recorded in outbox', bookingOutbox.length >= 3);
}

console.log('\n== Identity and privilege boundaries ==');
{
  // A manager pre-creates an elevated tutor profile. Registering with that
  // email must not inherit the profile or any of its standing.
  const elevated = await manager.post('/tutors', {
    full_name: 'Future Director', email: 'director@demo.local',
    approved: true, can_access_manager_dashboard: true,
  });
  check('manager can pre-create an elevated tutor profile', elevated.status === 201);

  const attacker = client();
  const claim = await attacker.post('/auth/register', {
    email: 'director@demo.local', password: 'attacker-pw-1', full_name: 'Mallory', account_type: 'tutor',
  });
  check('registration with a pre-created email succeeds but claims nothing', claim.status === 201 && !claim.data.tutor);
  const escalated = await attacker.get('/students');
  check('claimed-email account gets no manager access', escalated.status === 403);
  const asTutor = await attacker.post('/modules', { student_email: 'student@demo.local', name: 'x' });
  check('claimed-email account gets no tutor access', asTutor.status === 403);

  // Manager links the profile explicitly; only then does standing apply.
  const link = await manager.post(`/tutors/${elevated.data.id}/link`, { link: true });
  check('manager can link a profile to a registered account', link.status === 200);
  const afterLink = await attacker.get('/auth/me');
  check('linked account now carries the tutor profile', afterLink.data.tutor?.id === elevated.data.id);
  const managerNow = await attacker.get('/students');
  check('linked elevated profile grants manager access', managerNow.status === 200);

  // A manager who is not a super admin cannot strip the super admin's flags.
  const plainManagerUser = client();
  await plainManagerUser.post('/auth/register', {
    email: 'plainmgr@demo.local', password: 'plainmgr-123', full_name: 'Plain Manager', account_type: 'tutor',
  });
  const plainProfile = await manager.post('/tutors', {
    full_name: 'Plain Manager', email: 'plainmgr@demo.local', approved: true, can_access_manager_dashboard: true,
  });
  await manager.post(`/tutors/${plainProfile.data.id}/link`, { link: true });
  const allTutors = await manager.get('/tutors');
  const superAdminRow = allTutors.data.find((t) => t.email === 'manager@demo.local');
  const strip = await plainManagerUser.patch(`/tutors/${superAdminRow.id}`, {
    is_super_admin: false, can_access_manager_dashboard: false,
  });
  check('non-super-admin cannot revoke super admin flags', strip.status === 403);
  const grant = await plainManagerUser.patch(`/tutors/${plainProfile.data.id}`, { is_super_admin: true });
  check('non-super-admin cannot grant itself super admin', grant.status === 403);
}

console.log('\n== Session integrity ==');
{
  const probe = client();
  const login = await probe.post('/auth/login', { email: 'student@demo.local', password: 'student123' });
  check('probe login works', login.status === 200);

  // Replaying the inner token without the signature must be rejected.
  const signed = login.headers.get('set-cookie').split(';')[0].split('=')[1];
  const raw = decodeURIComponent(signed).replace(/^s:/, '').split('.')[0];
  const replay = await (await fetch(`${BASE}/auth/me`, { headers: { Cookie: `oms_session=${raw}` } })).json();
  check('unsigned cookie value does not authenticate', replay.user === null);

  const tampered = await (await fetch(`${BASE}/auth/me`, { headers: { Cookie: `oms_session=s:${raw}.badsignature` } })).json();
  check('tampered cookie signature does not authenticate', tampered.user === null);
}

console.log('\n== Suspension takes effect immediately ==');
{
  const tutors = await manager.get('/tutors');
  const demoTutor = tutors.data.find((t) => t.email === 'tutor@demo.local');
  const suspend = await manager.patch(`/tutors/${demoTutor.id}`, { approved: false });
  check('manager can suspend a tutor', suspend.status === 200 && suspend.data.approved === false);

  const read = await tutor.get('/bookings');
  check('suspended tutor cannot read bookings', read.status === 403);
  const act = await tutor.patch(`/bookings/${acceptedId}/status`, { status: 'completed' });
  check('suspended tutor cannot change booking status', act.status === 403);
  const uploadBlocked = await tutor.post('/files', (() => {
    const fd = new FormData();
    fd.append('file', new Blob(['x'], { type: 'text/plain' }), 'x.txt');
    return fd;
  })());
  check('suspended tutor cannot upload files', uploadBlocked.status === 403);

  const restore = await manager.patch(`/tutors/${demoTutor.id}`, { approved: true });
  check('manager can restore the tutor', restore.status === 200 && restore.data.approved === true);
}

console.log('\n== History preservation ==');
{
  const tutors = await manager.get('/tutors');
  const demoTutor = tutors.data.find((t) => t.email === 'tutor@demo.local');
  const del = await manager.del(`/tutors/${demoTutor.id}`);
  check('deleting a tutor with history is refused, not cascaded', del.status === 400);
  const stillThere = await manager.get('/bookings');
  check('bookings survive the refused delete', stillThere.data.length > 0);
}

console.log('\n== File attachment ownership ==');
{
  const tutorFd = new FormData();
  tutorFd.append('file', new Blob(['tutor worksheet'], { type: 'text/plain' }), 'worksheet.txt');
  const tutorFile = await tutor.post('/files', tutorFd);
  check('tutor can upload a worksheet', tutorFile.status === 201);

  const steal = await second.post(`/modules`, { student_email: 'student@demo.local', name: 'steal' });
  check('student cannot create modules at all', steal.status === 403);

  const studentFd = new FormData();
  studentFd.append('file', new Blob(['private notes'], { type: 'text/plain' }), 'private.txt');
  const studentFile = await second.post('/files', studentFd);
  const reshare = await tutor.post('/modules', {
    student_email: 'student@demo.local', name: 'reshared', file_id: studentFile.data.id,
  });
  check('tutor cannot attach a file uploaded by someone else', reshare.status === 403);

  // The same worksheet assigned to two students stays readable by both.
  const m1 = await tutor.post('/modules', {
    student_email: 'student@demo.local', name: 'shared worksheet A', file_id: tutorFile.data.id,
  });
  const m2 = await tutor.post('/modules', {
    student_email: 'second@demo.local', name: 'shared worksheet B', file_id: tutorFile.data.id,
  });
  check('one file can back two module assignments', m1.status === 201 && m2.status === 201);
  const d1 = await student.get(`/files/${tutorFile.data.id}`);
  const d2 = await second.get(`/files/${tutorFile.data.id}`);
  check('both assigned students can download the shared file', d1.status === 200 && d2.status === 200);
}

console.log('\n== Scheduling edge cases ==');
{
  const overlap = await manager.post('/availability', {
    tutor_id: (await manager.get('/tutors')).data.find((t) => t.email === 'tutor@demo.local').id,
    day_of_week: 'Monday', start_time: '10:00', end_time: '12:00',
  });
  check('overlapping availability window is rejected', overlap.status === 400);

  const nonOverlap = await manager.post('/availability', {
    tutor_id: (await manager.get('/tutors')).data.find((t) => t.email === 'tutor@demo.local').id,
    day_of_week: 'Thursday', start_time: '09:00', end_time: '12:00',
  });
  check('non-overlapping window is accepted', nonOverlap.status === 201);

  // A start time earlier today must be refused even though the date is valid.
  const nowEt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date());
  const todayName = new Date(`${today}T12:00:00Z`).toUTCString().slice(0, 3);
  const dayNames = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' };
  const tutorsNow = await manager.get('/tutors');
  const demoTutorId = tutorsNow.data.find((t) => t.email === 'tutor@demo.local').id;
  await manager.post('/availability', {
    tutor_id: demoTutorId, day_of_week: dayNames[todayName], start_time: '00:00', end_time: '23:00',
  }).catch(() => null);
  if (nowEt > '01:00') {
    const pastToday = await student.post('/bookings', {
      tutor_id: demoTutorId, session_date: today, preferred_start_time: '00:00',
    });
    check('a start time earlier today is rejected', pastToday.status === 400);
  } else {
    check('a start time earlier today is rejected (skipped near midnight ET)', true);
  }
}

console.log('\n== Request robustness ==');
{
  const malformed = await fetch(`${BASE}/inquiries`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{not json',
  });
  check('malformed JSON body returns 400, not 500', malformed.status === 400);

  const repeated = await manager.get('/availability?tutor_id=a&tutor_id=b');
  check('repeated query parameters do not crash the API', repeated.status === 200);

  const badFk = await student.post('/bookings', {
    tutor_id: 'does-not-exist', session_date: monday, preferred_start_time: '09:00',
  });
  check('booking against a missing tutor returns 404, not 500', badFk.status === 404);

  const missingFile = await student.get('/files/00000000-0000-4000-8000-000000000000');
  check('unknown file id returns 404', missingFile.status === 404);
}

console.log('\n== Logout ==');
{
  const out = await student.post('/auth/logout');
  check('logout succeeds', out.status === 200);
  const after = await student.get('/auth/me');
  check('session invalidated after logout', after.status === 200 && after.data.user === null);
}

server.close();
db.close();
fs.rmSync(process.env.UPLOADS_DIR, { recursive: true, force: true });
for (const suffix of ['', '-wal', '-shm']) {
  fs.rmSync(`${process.env.DATABASE_PATH}${suffix}`, { force: true });
}

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length > 0) {
  for (const f of failures) console.log(`FAILED: ${f.name} ${f.detail}`);
  process.exit(1);
}
