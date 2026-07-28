import bcrypt from 'bcryptjs';
import { z } from 'zod';
import db from '../db/database.js';
import { newId, newSessionToken, hashToken } from '../lib/ids.js';
import { serializeRow } from '../lib/serialize.js';
import { SESSION_COOKIE, SESSION_TTL_MS, loadLinkedProfiles } from '../middleware/auth.js';
import { cookieOptions, clearCookieOptions } from '../lib/config.js';
import { findUsableInvitation, acceptInvitation } from './invitationsController.js';
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
  // Optional invitation token; when present it links the new account to the
  // profile a manager prepared, replacing the manual link step.
  invite: z.string().trim().optional(),
});

function startSession(res, userId) {
  // Opportunistic cleanup so expired rows do not accumulate forever.
  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(new Date().toISOString());
  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
    .run(hashToken(token), userId, expiresAt);
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions(), maxAge: SESSION_TTL_MS });
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
  const { student, tutor } = loadLinkedProfiles(user.id);
  req.student = student;
  req.tutor = tutor;
}

export function register(req, res) {
  const data = registerSchema.parse(req.body);
  const email = data.email.toLowerCase();

  const existing = db.prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE').get(email);
  if (existing) throw conflict('An account with that email already exists. Try signing in instead.');

  // An invitation proves a manager intended this person to hold this profile,
  // which is what email verification would otherwise establish.
  let invited = null;
  if (data.invite) {
    const result = findUsableInvitation(data.invite);
    if (!result.ok) throw badRequest(result.reason);
    const expectedRole = result.invitation.intended_role;
    const requestedRole = data.account_type === 'tutor' ? 'tutor' : 'student_parent';
    if (expectedRole !== requestedRole) {
      throw badRequest('This invitation is for a different kind of account.');
    }
    if (result.invitation.email && result.invitation.email.toLowerCase() !== email) {
      throw badRequest('This invitation was issued for a different email address.');
    }
    invited = result;
  }

  const userId = newId();
  const role = data.account_type === 'tutor' ? 'tutor' : 'student_parent';
  const created = db.transaction(() => {
    db.prepare(`INSERT INTO users (id, email, password_hash, full_name, role, approved)
      VALUES (?, ?, ?, ?, ?, 0)`)
      .run(userId, email, bcrypt.hashSync(data.password, 10), data.full_name, role);

    if (invited) {
      // The manager already said which profile this is; adopt it and burn the
      // invitation so the link cannot be reused.
      acceptInvitation({ invitation: invited.invitation, userId });
      return db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    }

    const nameParts = data.full_name.split(' ');
    // A pre-created profile is adopted only when it carries no standing at
    // all. Anything a manager has already approved or elevated must be linked
    // deliberately by a manager, because self-service registration cannot
    // prove ownership of an email address without a verification step.
    if (role === 'student_parent') {
      const profile = db.prepare('SELECT * FROM students WHERE email = ? COLLATE NOCASE').get(email);
      if (profile) {
        if (!profile.user_id && !profile.approved && !profile.can_access_student_portal) {
          db.prepare('UPDATE students SET user_id = ? WHERE id = ?').run(userId, profile.id);
        }
        // Otherwise the account is created unlinked; a manager links it.
      } else {
        db.prepare(`INSERT INTO students (id, user_id, first_name, last_name, full_name, email, phone, approved, can_access_student_portal)
          VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)`)
          .run(newId(), userId, nameParts[0] || '', nameParts.slice(1).join(' ') || '', data.full_name, email, data.phone);
      }
    } else {
      const profile = db.prepare('SELECT * FROM tutors WHERE email = ? COLLATE NOCASE').get(email);
      if (profile) {
        if (!profile.user_id && !profile.approved && !profile.can_access_manager_dashboard && !profile.is_super_admin) {
          db.prepare('UPDATE tutors SET user_id = ? WHERE id = ?').run(userId, profile.id);
        }
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
  // Signed cookie only, matching how the session is read everywhere else.
  const token = req.signedCookies?.[SESSION_COOKIE];
  if (token) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(hashToken(token));
  }
  // Clearing only works when the attributes match the ones used to set it.
  res.clearCookie(SESSION_COOKIE, clearCookieOptions());
  res.json({ ok: true });
}

// Session probe. Public pages call this on every load, so an anonymous
// visitor gets a plain "nobody is signed in" answer rather than an error;
// protected endpoints still answer 401.
export function me(req, res) {
  res.json(req.user ? mePayload(req) : { user: null, student: null, tutor: null });
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
  const currentToken = req.signedCookies?.[SESSION_COOKIE];
  db.transaction(() => {
    db.prepare("UPDATE users SET password_hash = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?")
      .run(bcrypt.hashSync(data.new_password, 10), user.id);
    // Changing the password revokes every other session for this account.
    db.prepare('DELETE FROM sessions WHERE user_id = ? AND id != ?')
      .run(user.id, currentToken ? hashToken(currentToken) : '');
  })();
  res.json({ ok: true });
}
