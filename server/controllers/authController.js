import bcrypt from 'bcryptjs';
import { z } from 'zod';
import db from '../db/database.js';
import { newId, newSessionToken, hashToken } from '../lib/ids.js';
import { serializeRow } from '../lib/serialize.js';
import { SESSION_COOKIE, SESSION_TTL_MS } from '../middleware/auth.js';
import { badRequest, unauthorized, conflict } from '../middleware/errors.js';

const credentialsSchema = z.object({
  email: z.string().trim().email('A valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  email: z.string().trim().email('A valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().trim().min(1, 'Name is required').max(120),
  account_type: z.enum(['student', 'tutor']),
  phone: z.string().trim().max(40).optional().default(''),
});

function startSession(res, userId) {
  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
    .run(hashToken(token), userId, expiresAt);
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    signed: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_TTL_MS,
  });
}

function mePayload(req) {
  return {
    user: req.user,
    student: req.student,
    tutor: req.tutor,
  };
}

function loadProfiles(req, user) {
  req.user = serializeRow({ ...user });
  delete req.user.password_hash;
  req.student = serializeRow(
    db.prepare('SELECT * FROM students WHERE user_id = ? OR email = ? COLLATE NOCASE').get(user.id, user.email)
  ) || null;
  req.tutor = serializeRow(
    db.prepare('SELECT * FROM tutors WHERE user_id = ? OR email = ? COLLATE NOCASE').get(user.id, user.email)
  ) || null;
}

export function register(req, res) {
  const data = registerSchema.parse(req.body);
  const email = data.email.toLowerCase();

  const existing = db.prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE').get(email);
  if (existing) throw conflict('An account with that email already exists. Try signing in instead.');

  const userId = newId();
  const role = data.account_type === 'tutor' ? 'tutor' : 'student_parent';
  const created = db.transaction(() => {
    db.prepare(`INSERT INTO users (id, email, password_hash, full_name, role, approved)
      VALUES (?, ?, ?, ?, ?, 0)`)
      .run(userId, email, bcrypt.hashSync(data.password, 10), data.full_name, role);

    const nameParts = data.full_name.split(' ');
    if (role === 'student_parent') {
      const profile = db.prepare('SELECT id FROM students WHERE email = ? COLLATE NOCASE').get(email);
      if (profile) {
        // Profile pre-created by a manager; link it to the new account.
        db.prepare('UPDATE students SET user_id = ? WHERE id = ?').run(userId, profile.id);
      } else {
        db.prepare(`INSERT INTO students (id, user_id, first_name, last_name, full_name, email, phone, approved, can_access_student_portal)
          VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)`)
          .run(newId(), userId, nameParts[0] || '', nameParts.slice(1).join(' ') || '', data.full_name, email, data.phone);
      }
    } else {
      const profile = db.prepare('SELECT id FROM tutors WHERE email = ? COLLATE NOCASE').get(email);
      if (profile) {
        db.prepare('UPDATE tutors SET user_id = ? WHERE id = ?').run(userId, profile.id);
      } else {
        db.prepare(`INSERT INTO tutors (id, user_id, full_name, email, phone, approved)
          VALUES (?, ?, ?, ?, ?, 0)`)
          .run(newId(), userId, data.full_name, email, data.phone);
      }
    }
    return db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  })();

  loadProfiles(req, created);
  startSession(res, userId);
  res.status(201).json(mePayload(req));
}

export function login(req, res) {
  const data = credentialsSchema.parse(req.body);
  const user = db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(data.email);
  if (!user || !bcrypt.compareSync(data.password, user.password_hash)) {
    throw unauthorized('Incorrect email or password.');
  }

  loadProfiles(req, user);
  startSession(res, user.id);
  res.json(mePayload(req));
}

export function logout(req, res) {
  const token = req.signedCookies?.[SESSION_COOKIE] || req.cookies?.[SESSION_COOKIE];
  if (token) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(hashToken(token));
  }
  res.clearCookie(SESSION_COOKIE);
  res.json({ ok: true });
}

export function me(req, res) {
  if (!req.user) throw unauthorized();
  res.json(mePayload(req));
}

export function changePassword(req, res) {
  if (!req.user) throw unauthorized();
  const schema = z.object({
    current_password: z.string().min(1),
    new_password: z.string().min(8, 'Password must be at least 8 characters'),
  });
  const data = schema.parse(req.body);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(data.current_password, user.password_hash)) {
    throw badRequest('Current password is incorrect.');
  }
  db.prepare("UPDATE users SET password_hash = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?")
    .run(bcrypt.hashSync(data.new_password, 10), user.id);
  res.json({ ok: true });
}
