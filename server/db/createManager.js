// One-off bootstrap for the first manager account.
//
// A fresh production database has no users, and there is deliberately no way to
// create a manager through the public site: self-service registration can only
// produce student_parent or tutor accounts, and issuing invitations requires an
// existing manager. That is the right security posture, but it leaves a
// chicken-and-egg problem on first deploy, which this script exists to break.
//
// Unlike seed.js, this NEVER deletes anything and inserts no demo data. Run it
// once against production, then do everything else from the manager dashboard.
//
// Usage with environment variables (e.g. in a Render shell):
//   MANAGER_EMAIL=you@example.com MANAGER_PASSWORD='...' MANAGER_NAME='Your Name' \
//     npm run db:create-manager
//
// Usage with arguments:
//   node server/db/createManager.js you@example.com '...' 'Your Name'
//
// Pass --force to add a second super admin when one already exists.

import bcrypt from 'bcryptjs';
import db from './database.js';
import { runMigrations } from './migrate.js';
import { newId } from '../lib/ids.js';

const force = process.argv.includes('--force');
const args = process.argv.slice(2).filter((a) => a !== '--force');

const email = (args[0] || process.env.MANAGER_EMAIL || '').trim().toLowerCase();
const password = args[1] || process.env.MANAGER_PASSWORD || '';
const fullName = (args[2] || process.env.MANAGER_NAME || '').trim();

function fail(message) {
  console.error(`\n  ${message}\n`);
  process.exit(1);
}

if (!email || !email.includes('@')) {
  fail('A valid email is required. Set MANAGER_EMAIL or pass it as the first argument.');
}
if (password.length < 12) {
  fail('Password must be at least 12 characters. This account can read and change every student record.');
}
if (!fullName) {
  fail('A full name is required. Set MANAGER_NAME or pass it as the third argument.');
}

runMigrations();

const existingAdmin = db
  .prepare('SELECT email FROM tutors WHERE is_super_admin = 1 AND user_id IS NOT NULL LIMIT 1')
  .get();

if (existingAdmin && !force) {
  fail(
    `A super admin already exists (${existingAdmin.email}).\n` +
    '  Create further managers from the manager dashboard, or re-run with --force\n' +
    '  if you are certain you want a second one.'
  );
}

if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) {
  fail(`A user with the email ${email} already exists.`);
}

const userId = newId();
const tutorId = newId();
const passwordHash = bcrypt.hashSync(password, 10);

db.transaction(() => {
  db.prepare(
    `INSERT INTO users (id, email, password_hash, full_name, role, approved)
     VALUES (?, ?, ?, ?, 'manager', 1)`
  ).run(userId, email, passwordHash, fullName);

  db.prepare(
    `INSERT INTO tutors
       (id, user_id, full_name, email, phone, approved, bio,
        can_access_manager_dashboard, is_super_admin, auth_provider)
     VALUES (?, ?, ?, ?, '', 1, '', 1, 1, 'email')`
  ).run(tutorId, userId, fullName, email);
})();

console.log(`\n  Manager account created for ${email}`);
console.log('  Sign in on the site, then open the manager dashboard.');
console.log('  Change this password after the first login.\n');
