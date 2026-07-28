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
const { todayInAppTz, addDays, nextDateForWeekday, weekdayName } = await import('../lib/time.js');
const { newId: newIdForTest } = await import('../lib/ids.js');

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
  check('student-facing tutor directory hides contact details',
    tutors.data.every((t) => t.email === undefined),
    JSON.stringify(tutors.data[0] || {}));
  tutorId = tutors.data.find((t) => t.full_name === 'Jordan Blake')?.id;
  check('demo tutor visible by name', Boolean(tutorId));

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

console.log('\n== Strict calendar dates ==');
{
  const { isValidDateString } = await import('../lib/time.js');
  const invalid = ['2026-02-30', '2026-02-31', '2026-13-01', '2026-00-10', '2026-04-31',
    '2026-1-01', '20260101', 'not-a-date', '', '2026-12-32'];
  check('impossible calendar dates are rejected',
    invalid.every((d) => isValidDateString(d) === false),
    invalid.filter((d) => isValidDateString(d)).join(','));

  const valid = ['2024-02-29', '2000-02-29', '2026-02-28', '2026-12-31', '2026-01-01', '2026-04-30'];
  check('real calendar dates are accepted',
    valid.every((d) => isValidDateString(d) === true),
    valid.filter((d) => !isValidDateString(d)).join(','));
  check('non-leap February 29 is rejected', isValidDateString('2026-02-29') === false);
  check('century non-leap year is rejected', isValidDateString('1900-02-29') === false);

  const apiRejects = await student.post('/bookings', {
    tutor_id: tutorId, session_date: '2026-02-31', preferred_start_time: '10:00',
  });
  check('the booking API rejects an impossible date', apiRejects.status === 400);
}

console.log('\n== Elevated profile protection ==');
{
  // A manager with dashboard access but no super admin rights. The profile is
  // created first: registration never adopts an elevated profile by itself.
  const plainProfile = await manager.post('/tutors', {
    full_name: 'Guard Manager', email: 'guard-mgr@demo.local', approved: true, can_access_manager_dashboard: true,
  });
  const plainMgr = client();
  await plainMgr.post('/auth/register', {
    email: 'guard-mgr@demo.local', password: 'guardmgr-123', full_name: 'Guard Manager', account_type: 'tutor',
  });
  await manager.post(`/tutors/${plainProfile.data.id}/link`, { link: true });
  check('a plain manager account exists', (await plainMgr.get('/students')).status === 200);

  const allTutors = await manager.get('/tutors');
  const superAdmin = allTutors.data.find((t) => t.email === 'manager@demo.local');

  check('regular manager cannot change a super admin email',
    (await plainMgr.patch(`/tutors/${superAdmin.id}`, { email: 'hijack@demo.local' })).status === 403);
  check('regular manager cannot unapprove a super admin',
    (await plainMgr.patch(`/tutors/${superAdmin.id}`, { approved: false })).status === 403);
  check('regular manager cannot rename a super admin',
    (await plainMgr.patch(`/tutors/${superAdmin.id}`, { full_name: 'Taken Over' })).status === 403);
  check('regular manager cannot unlink a super admin',
    (await plainMgr.post(`/tutors/${superAdmin.id}/link`, { link: false })).status === 403);
  check('regular manager cannot relink a super admin',
    (await plainMgr.post(`/tutors/${superAdmin.id}/link`, { link: true })).status === 403);
  check('regular manager cannot delete a super admin',
    (await plainMgr.del(`/tutors/${superAdmin.id}`)).status === 403);

  // Another manager-level profile is equally protected from a peer manager.
  check('regular manager cannot edit another elevated profile',
    (await plainMgr.patch(`/tutors/${plainProfile.data.id}`, { full_name: 'Escalated' })).status === 403);
  check('regular manager cannot transfer elevated access to a new profile',
    (await plainMgr.post('/tutors', {
      full_name: 'Puppet Admin', email: 'puppet@demo.local', approved: true, is_super_admin: true,
    })).status === 403);

  const stillSuper = (await manager.get('/tutors')).data.find((t) => t.email === 'manager@demo.local');
  check('super admin survived every attempt untouched',
    stillSuper.is_super_admin === true && stillSuper.approved === true &&
    stillSuper.email === 'manager@demo.local' && stillSuper.full_name === superAdmin.full_name);

  // The last reachable super admin cannot remove their own access.
  check('the last super admin cannot drop their own flag',
    (await manager.patch(`/tutors/${superAdmin.id}`, { is_super_admin: false })).status === 400);
  check('the last super admin cannot unlink themselves',
    (await manager.post(`/tutors/${superAdmin.id}/link`, { link: false })).status === 400);

  // With a second super admin present, the change is allowed again.
  const secondProfile = await manager.post('/tutors', {
    full_name: 'Second Admin', email: 'second-admin@demo.local', approved: true, is_super_admin: true,
  });
  const secondAdmin = client();
  await secondAdmin.post('/auth/register', {
    email: 'second-admin@demo.local', password: 'secondadmin-1', full_name: 'Second Admin', account_type: 'tutor',
  });
  await manager.post(`/tutors/${secondProfile.data.id}/link`, { link: true });
  const nowAllowed = await manager.patch(`/tutors/${secondProfile.data.id}`, { is_super_admin: false });
  check('a super admin flag can be dropped while another remains', nowAllowed.status === 200);
  await manager.patch(`/tutors/${secondProfile.data.id}`, { is_super_admin: true });
}

console.log('\n== Role-safe profile linking ==');
{
  // A student account must not be able to hold a tutor profile.
  const studentSide = client();
  await studentSide.post('/auth/register', {
    email: 'linkstudent@demo.local', password: 'linkstudent-1', full_name: 'Link Student', account_type: 'student',
  });
  const tutorProfileForStudent = await manager.post('/tutors', {
    full_name: 'Link Student', email: 'linkstudent@demo.local',
  });
  check('a student account cannot be linked to a tutor profile',
    (await manager.post(`/tutors/${tutorProfileForStudent.data.id}/link`, { link: true })).status === 400);

  // A tutor account must not be able to hold a student profile.
  const tutorSide = client();
  await tutorSide.post('/auth/register', {
    email: 'linktutor@demo.local', password: 'linktutor-1', full_name: 'Link Tutor', account_type: 'tutor',
  });
  const studentProfileForTutor = await manager.post('/students', {
    first_name: 'Link', last_name: 'Tutor', email: 'linktutor@demo.local',
  });
  check('a tutor account cannot be linked to a student profile',
    (await manager.post(`/students/${studentProfileForTutor.data.id}/link`, { link: true })).status === 400);

  // One account must never hold both profile types. An approved profile is
  // never auto-adopted at registration, so this link is the explicit one.
  const studentProfile = await manager.post('/students', {
    first_name: 'Both', last_name: 'Profiles', email: 'bothprofiles@demo.local',
    approved: true, can_access_student_portal: true,
  });
  const both = client();
  await both.post('/auth/register', {
    email: 'bothprofiles@demo.local', password: 'bothprofiles-1', full_name: 'Both Profiles', account_type: 'student',
  });
  const firstLink = await manager.post(`/students/${studentProfile.data.id}/link`, { link: true });
  check('the matching profile type links normally', firstLink.status === 200 && Boolean(firstLink.data.user_id));

  // Promote that account so the role check would pass, leaving the
  // one-profile-type rule as the only thing standing in the way.
  db.prepare("UPDATE users SET role = 'manager' WHERE email = ?").run('bothprofiles@demo.local');
  const tutorProfileSameEmail = await manager.post('/tutors', {
    full_name: 'Both Profiles', email: 'bothprofiles@demo.local',
  });
  const mixed = await manager.post(`/tutors/${tutorProfileSameEmail.data.id}/link`, { link: true });
  check('one account cannot own both a student and a tutor profile',
    mixed.status === 409, `status=${mixed.status}`);

  // A manager account legitimately owns a tutor profile.
  const mgrProfile = await manager.post('/tutors', {
    full_name: 'Link Manager', email: 'linkmanager@demo.local', approved: true,
  });
  const mgrSide = client();
  await mgrSide.post('/auth/register', {
    email: 'linkmanager@demo.local', password: 'linkmanager-1', full_name: 'Link Manager', account_type: 'tutor',
  });
  db.prepare("UPDATE users SET role = 'manager' WHERE email = ?").run('linkmanager@demo.local');
  const mgrLink = await manager.post(`/tutors/${mgrProfile.data.id}/link`, { link: true });
  check('manager to tutor profile linking still works', mgrLink.status === 200 && Boolean(mgrLink.data.user_id));

  // Relinking an already-linked profile must be explicit, never silent.
  check('an already-linked profile is not silently relinked',
    (await manager.post(`/tutors/${mgrProfile.data.id}/link`, { link: true })).status === 409);
}

console.log('\n== Module student identity ==');
{
  const students = await manager.get('/students');
  const studentA = students.data.find((s) => s.email === 'student@demo.local');
  const studentB = students.data.find((s) => s.email === 'second@demo.local');
  check('two distinct demo students exist', Boolean(studentA && studentB) && studentA.id !== studentB.id);

  const before = (await manager.get('/modules')).data.length;

  const mismatch = await tutor.post('/modules', {
    student_id: studentA.id, student_email: studentB.email, name: 'Mismatched identity',
  });
  check('student A id with student B email is rejected', mismatch.status === 400);

  const unknownEmail = await tutor.post('/modules', {
    student_id: studentA.id, student_email: 'nobody@demo.local', name: 'Unknown email',
  });
  check('student A id with an unknown email is rejected', unknownEmail.status === 400);

  const badId = await tutor.post('/modules', {
    student_id: 'not-a-real-id', student_email: studentA.email, name: 'Bad id',
  });
  check('an unknown student id is rejected', badId.status === 400);

  const after = (await manager.get('/modules')).data.length;
  check('no module was created by any mismatched request', after === before);

  const matching = await tutor.post('/modules', {
    student_id: studentA.id, student_email: studentA.email, student_name: 'Someone Else Entirely',
    name: 'Matching identity',
  });
  check('a matching id and email is accepted', matching.status === 201);
  check('canonical student values are stored, not client-supplied ones',
    matching.data.student_id === studentA.id &&
    matching.data.student_email.toLowerCase() === studentA.email.toLowerCase() &&
    matching.data.student_name === studentA.full_name);

  const bVisible = (await second.get('/modules')).data.some((m) => m.id === matching.data.id);
  check('the other student cannot see that module', bVisible === false);
}

console.log('\n== Student schedule conflicts ==');
{
  // A second approved tutor so the student can attempt a parallel booking.
  const otherTutor = await manager.post('/tutors', {
    full_name: 'Parallel Tutor', email: 'parallel@demo.local', approved: true,
  });
  const otherTutorId = otherTutor.data.id;
  await manager.post('/availability', {
    tutor_id: otherTutorId, day_of_week: 'Monday', start_time: '09:00', end_time: '17:00',
  });

  const nextMonday = nextDateForWeekday(addDays(monday, 7), 'Monday');
  const first = await student.post('/bookings', {
    tutor_id: tutorId, session_date: nextMonday, preferred_start_time: '09:00',
  });
  check('student books a first session', first.status === 201);

  const sameTime = await student.post('/bookings', {
    tutor_id: otherTutorId, session_date: nextMonday, preferred_start_time: '09:00',
  });
  check('same student, same time, different tutor is rejected', sameTime.status === 409);

  // Overlap without an identical start: a 30-minute window offset.
  await manager.post('/availability', {
    tutor_id: otherTutorId, day_of_week: 'Tuesday', start_time: '09:30', end_time: '17:00',
  });
  const tuesday = nextDateForWeekday(addDays(monday, 1), 'Tuesday');
  const tuesdayFirst = await student.post('/bookings', {
    tutor_id: otherTutorId, session_date: tuesday, preferred_start_time: '09:30',
  });
  check('student books a session on another day', tuesdayFirst.status === 201);
  await manager.post('/availability', {
    tutor_id: tutorId, day_of_week: 'Tuesday', start_time: '10:00', end_time: '17:00',
  });
  const partialOverlap = await student.post('/bookings', {
    tutor_id: tutorId, session_date: tuesday, preferred_start_time: '10:00',
  });
  check('same student, partially overlapping time, different tutor is rejected',
    partialOverlap.status === 409, `status=${partialOverlap.status}`);

  const nonOverlapping = await student.post('/bookings', {
    tutor_id: otherTutorId, session_date: nextMonday, preferred_start_time: '11:00',
  });
  check('same student, non-overlapping time is accepted', nonOverlapping.status === 201);

  // Cancelling frees the student's own calendar.
  await student.patch(`/bookings/${first.data.id}/status`, { status: 'cancelled' });
  const afterCancel = await student.post('/bookings', {
    tutor_id: otherTutorId, session_date: nextMonday, preferred_start_time: '09:00',
  });
  check('a cancelled appointment no longer blocks the student', afterCancel.status === 201);

  // As does a decline.
  await manager.patch(`/bookings/${afterCancel.data.id}`, { status: 'declined' });
  const afterDecline = await student.post('/bookings', {
    tutor_id: tutorId, session_date: nextMonday, preferred_start_time: '09:00',
  });
  check('a declined appointment no longer blocks the student', afterDecline.status === 201);
}

console.log('\n== Course and tutor relationship ==');
{
  const courses = await manager.get('/courses');
  const satMath = courses.data.find((c) => c.course_code === 'SAT-MATH');
  const actEnglish = courses.data.find((c) => c.course_code === 'ACT-ENG');
  const wednesday = nextDateForWeekday(addDays(monday, 1), 'Wednesday');

  const valid = await student.post('/bookings', {
    tutor_id: tutorId, session_date: wednesday, preferred_start_time: '13:00', course_id: satMath.id,
  });
  check('a course the tutor teaches is accepted', valid.status === 201);

  const wrongTutor = await student.post('/bookings', {
    tutor_id: tutorId, session_date: wednesday, preferred_start_time: '14:00', course_id: actEnglish.id,
  });
  check('a course assigned to a different tutor is rejected', wrongTutor.status === 400);

  const missingCourse = await student.post('/bookings', {
    tutor_id: tutorId, session_date: wednesday, preferred_start_time: '15:00', course_id: 'no-such-course',
  });
  check('a nonexistent course id is rejected', missingCourse.status === 400);

  const noCourse = await student.post('/bookings', {
    tutor_id: tutorId, session_date: wednesday, preferred_start_time: '16:00', course_id: null,
  });
  check('booking without a course is allowed', noCourse.status === 201);
}

console.log('\n== Manager booking revival is revalidated ==');
{
  // Build a cancelled booking, then make it invalid to revive.
  const thursday = nextDateForWeekday(addDays(monday, 1), 'Thursday');
  await manager.post('/availability', {
    tutor_id: tutorId, day_of_week: 'Thursday', start_time: '09:00', end_time: '12:00',
  });
  const target = await second.post('/bookings', {
    tutor_id: tutorId, session_date: thursday, preferred_start_time: '09:00',
  });
  check('a booking to revive exists', target.status === 201);
  await second.patch(`/bookings/${target.data.id}/status`, { status: 'cancelled' });

  // Remove the availability that made it valid.
  const slots = await manager.get(`/availability?tutor_id=${tutorId}`);
  const thursdaySlot = slots.data.find((s) => s.day_of_week === 'Thursday');
  await manager.del(`/availability/${thursdaySlot.id}`);
  const outsideAvailability = await manager.patch(`/bookings/${target.data.id}`, { status: 'confirmed' });
  check('reviving a booking outside availability is rejected', outsideAvailability.status === 400);

  // A past booking cannot be revived either.
  const pastId = newIdForTest();
  db.prepare(`INSERT INTO bookings
      (id, tutor_id, student_id, student_first_name, student_last_name, student_email,
       course_id, assignment_description, session_date, preferred_day, preferred_start_time,
       preferred_end_time, meeting_type, status)
      VALUES (?, ?, NULL, 'Past', 'Booking', 'student@demo.local', NULL, '', ?, ?, '09:00', '10:00', 'Online', 'cancelled')`)
    .run(pastId, tutorId, addDays(today, -3), weekdayName(addDays(today, -3)));
  const pastRevival = await manager.patch(`/bookings/${pastId}`, { status: 'confirmed' });
  check('reviving a past booking is rejected', pastRevival.status === 400);

  // Reviving into a slot the student now occupies is rejected.
  const friday = nextDateForWeekday(addDays(monday, 1), 'Friday');
  await manager.post('/availability', {
    tutor_id: tutorId, day_of_week: 'Friday', start_time: '09:00', end_time: '12:00',
  });
  const toCancel = await student.post('/bookings', {
    tutor_id: tutorId, session_date: friday, preferred_start_time: '09:00',
  });
  await student.patch(`/bookings/${toCancel.data.id}/status`, { status: 'cancelled' });
  const otherTutors = await manager.get('/tutors');
  const parallelTutor = otherTutors.data.find((t) => t.email === 'parallel@demo.local');
  await manager.post('/availability', {
    tutor_id: parallelTutor.id, day_of_week: 'Friday', start_time: '09:00', end_time: '12:00',
  });
  const conflicting = await student.post('/bookings', {
    tutor_id: parallelTutor.id, session_date: friday, preferred_start_time: '09:00',
  });
  check('the student takes that time with another tutor', conflicting.status === 201);
  const studentClash = await manager.patch(`/bookings/${toCancel.data.id}`, { status: 'confirmed' });
  check('reviving a booking that clashes with the student schedule is rejected',
    studentClash.status === 409 || studentClash.status === 400, `status=${studentClash.status}`);

  // Completed sessions are history.
  const completed = await manager.get('/bookings');
  const anyLive = completed.data.find((b) => b.status === 'confirmed');
  await manager.patch(`/bookings/${anyLive.id}`, { status: 'completed' });
  const reopen = await manager.patch(`/bookings/${anyLive.id}`, { status: 'confirmed' });
  check('a completed booking cannot be reopened normally', reopen.status === 400);

  const noReason = await manager.post(`/bookings/${anyLive.id}/override-status`, { status: 'confirmed' });
  check('an override without a reason is rejected', noReason.status === 400);

  const override = await manager.post(`/bookings/${anyLive.id}/override-status`, {
    status: 'confirmed', reason: 'Session was marked completed by mistake during the demo.',
  });
  check('a super admin can override with a reason', override.status === 200 && override.data.status === 'confirmed');
  const audit = db.prepare("SELECT * FROM admin_overrides WHERE target_id = ?").get(anyLive.id);
  check('the override is recorded in the audit table',
    Boolean(audit) && audit.reason.includes('marked completed by mistake'));

  const tutorOverride = await tutor.post(`/bookings/${anyLive.id}/override-status`, {
    status: 'cancelled', reason: 'Tutors must not be able to do this at all.',
  });
  check('a non super admin cannot use the override endpoint', tutorOverride.status === 403);
}

console.log('\n== Student progress ==');
{
  const students = await manager.get('/students');
  const studentA = students.data.find((s) => s.email === 'student@demo.local');
  const studentB = students.data.find((s) => s.email === 'second@demo.local');

  const own = await student.get('/progress');
  check('student reads their own progress', own.status === 200 && own.data.student_id === studentA.id);
  check('seeded demo metrics are present', own.data.metrics.length >= 3);
  check('seeded demo focus is present', own.data.focus.length >= 1);

  const foreign = await student.get(`/progress/${studentB.id}`);
  check('a student cannot read another student\'s progress', foreign.status === 403);

  const readOnly = await student.post(`/progress/${studentA.id}/metrics`, { label: 'Self', value: '100' });
  check('a student cannot write their own progress', readOnly.status === 403);

  const tutorWrites = await tutor.post(`/progress/${studentA.id}/metrics`, {
    label: 'Homework streak', value: '3 weeks', numeric_value: 3, unit: 'weeks',
  });
  check('a tutor can add a metric for a student on their roster', tutorWrites.status === 201);

  const strangerStudent = await manager.post('/students', {
    first_name: 'No', last_name: 'Roster', email: 'noroster@demo.local', approved: true, can_access_student_portal: true,
  });
  const offRoster = await tutor.post(`/progress/${strangerStudent.data.id}/metrics`, {
    label: 'Should not exist', value: 'x',
  });
  check('a tutor cannot write progress for a student they do not teach', offRoster.status === 403);

  const managerWrites = await manager.post(`/progress/${strangerStudent.data.id}/focus`, {
    title: 'Intake review', description: 'Manager set this up.', progress_percent: 10,
  });
  check('a manager can write progress for any student', managerWrites.status === 201);

  const focusUpdate = await tutor.patch(`/progress/focus/${own.data.focus[0].id}`, { progress_percent: 75 });
  check('a tutor can update a focus item', focusUpdate.status === 200 && focusUpdate.data.progress_percent === 75);

  const emptyStudent = await manager.get(`/progress/${strangerStudent.data.id}`);
  check('a student with no metrics returns an empty list, not invented numbers',
    emptyStudent.status === 200 && emptyStudent.data.metrics.length === 0);

  const anonProgress = await anon.get('/progress');
  check('anonymous visitors cannot read progress', anonProgress.status === 401);
}

console.log('\n== Manager inquiry workflow ==');
{
  const list = await manager.get('/inquiries');
  check('manager lists inquiries', list.status === 200 && list.data.length > 0);
  check('inquiries carry a workflow status', list.data.every((i) => ['new', 'contacted', 'closed'].includes(i.status)));

  const target = list.data.find((i) => i.status === 'new');
  const updated = await manager.patch(`/inquiries/${target.id}`, {
    status: 'contacted', manager_notes: 'Called the family, consultation booked.',
  });
  check('manager updates status and notes', updated.status === 200 &&
    updated.data.status === 'contacted' && updated.data.manager_notes.includes('consultation'));

  const closed = await manager.patch(`/inquiries/${target.id}`, { status: 'closed' });
  check('manager closes an inquiry', closed.status === 200 && closed.data.status === 'closed');
  check('closing keeps the earlier note', closed.data.manager_notes.includes('consultation'));

  const filtered = await manager.get('/inquiries?status=closed');
  check('inquiries filter by status', filtered.status === 200 && filtered.data.every((i) => i.status === 'closed'));

  const badStatus = await manager.patch(`/inquiries/${target.id}`, { status: 'archived' });
  check('an unknown status is rejected', badStatus.status === 400);

  check('a student cannot read inquiries', (await student.get('/inquiries')).status === 403);
  check('a tutor cannot read inquiries', (await tutor.get('/inquiries')).status === 403);
  check('a student cannot change an inquiry',
    (await student.patch(`/inquiries/${target.id}`, { status: 'new' })).status === 403);
  check('inquiries are never deleted through the API',
    (await manager.del(`/inquiries/${target.id}`)).status === 404);
}

console.log('\n== Origin and upload hygiene ==');
{
  const foreignOrigin = await fetch(`${BASE}/inquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://evil.example' },
    body: JSON.stringify({ parent_name: 'Cross Site', email: 'xs@example.com' }),
  });
  check('a mutation from an unknown origin is refused', foreignOrigin.status === 403);

  const goodOrigin = await fetch(`${BASE}/inquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' },
    body: JSON.stringify({ parent_name: 'Same Site', email: 'ss@example.com' }),
  });
  check('a mutation from the configured origin is allowed', goodOrigin.status === 201);

  const noOrigin = await anon.post('/inquiries', { parent_name: 'No Origin', email: 'no@example.com' });
  check('a request without an Origin header still works', noOrigin.status === 201);

  const headers = await fetch(`${BASE}/health`);
  check('security headers are present', Boolean(headers.headers.get('x-content-type-options')));

  // Orphan cleanup removes an abandoned upload but never a referenced one.
  const fd = new FormData();
  fd.append('file', new Blob(['abandoned'], { type: 'text/plain' }), 'abandoned.txt');
  const orphan = await tutor.post('/files', fd);
  const referencedModules = (await manager.get('/modules')).filter ? [] : (await manager.get('/modules')).data;
  const referencedFileId = referencedModules.find((m) => m.file_id)?.file_id;
  const cleanup = await manager.post('/maintenance/orphan-files', { older_than_hours: 0 });
  check('orphan cleanup runs for a super admin', cleanup.status === 200 && cleanup.data.recordsRemoved >= 1);
  check('the abandoned upload is gone', (await tutor.get(`/files/${orphan.data.id}`)).status === 404);
  if (referencedFileId) {
    check('a file attached to a module survives cleanup',
      (await tutor.get(`/files/${referencedFileId}`)).status === 200);
  } else {
    check('a file attached to a module survives cleanup (no attached file in fixture)', true);
  }
  check('a non super admin cannot run cleanup',
    (await tutor.post('/maintenance/orphan-files', {})).status === 403);
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
