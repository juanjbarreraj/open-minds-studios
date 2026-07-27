import db from '../db/database.js';
import { hashToken } from '../lib/ids.js';
import { serializeRow } from '../lib/serialize.js';
import { unauthorized, forbidden } from './errors.js';

export const SESSION_COOKIE = 'oms_session';
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Resolves the session cookie into req.user / req.student / req.tutor.
// Never rejects: public routes use it too and simply see req.user = null.
export function attachUser(req, res, next) {
  req.user = null;
  req.student = null;
  req.tutor = null;

  const token = req.signedCookies?.[SESSION_COOKIE] || req.cookies?.[SESSION_COOKIE];
  if (!token) return next();

  const session = db
    .prepare('SELECT * FROM sessions WHERE id = ?')
    .get(hashToken(token));
  if (!session) return next();
  if (session.expires_at <= new Date().toISOString()) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(session.id);
    return next();
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(session.user_id);
  if (!user) return next();

  req.user = serializeRow(user);
  delete req.user.password_hash;
  req.student = serializeRow(
    db.prepare('SELECT * FROM students WHERE user_id = ? OR email = ? COLLATE NOCASE').get(user.id, user.email)
  ) || null;
  req.tutor = serializeRow(
    db.prepare('SELECT * FROM tutors WHERE user_id = ? OR email = ? COLLATE NOCASE').get(user.id, user.email)
  ) || null;
  return next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return next(unauthorized());
  return next();
}

export const isManager = (req) =>
  Boolean(
    req.user &&
      (req.user.role === 'manager' ||
        req.user.role === 'admin' ||
        req.tutor?.can_access_manager_dashboard ||
        req.tutor?.is_super_admin)
  );

export function requireManager(req, res, next) {
  if (!req.user) return next(unauthorized());
  if (!isManager(req)) return next(forbidden('Manager access required'));
  return next();
}

export function requireApprovedTutor(req, res, next) {
  if (!req.user) return next(unauthorized());
  if (isManager(req)) return next();
  if (!req.tutor) return next(forbidden('Tutor profile required'));
  if (!req.tutor.approved) return next(forbidden('Tutor account is pending approval'));
  return next();
}

export function requireApprovedStudent(req, res, next) {
  if (!req.user) return next(unauthorized());
  if (isManager(req)) return next();
  if (!req.student) return next(forbidden('Student profile required'));
  if (!req.student.approved || !req.student.can_access_student_portal) {
    return next(forbidden('Student account is pending approval'));
  }
  return next();
}
