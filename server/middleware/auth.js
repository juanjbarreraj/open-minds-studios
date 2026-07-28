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

  // Signed cookies only. Accepting the raw value would defeat cookie signing
  // and allow session fixation by anyone able to set a cookie on the domain.
  const token = req.signedCookies?.[SESSION_COOKIE];
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
  // Profiles are resolved by explicit link only. Matching on email would let
  // anyone who registers with a known address inherit that profile's standing.
  const { student, tutor } = loadLinkedProfiles(user.id);
  req.student = student;
  req.tutor = tutor;
  return next();
}

// Shared by attachUser and the login/register controllers.
export function loadLinkedProfiles(userId) {
  return {
    student: serializeRow(db.prepare('SELECT * FROM students WHERE user_id = ?').get(userId)) || null,
    tutor: serializeRow(db.prepare('SELECT * FROM tutors WHERE user_id = ?').get(userId)) || null,
  };
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

// Route guard for the few actions reserved to super admins (audited booking
// overrides, orphan-file maintenance).
export function requireSuperAdminRoute(req, res, next) {
  if (!req.user) return next(unauthorized());
  if (req.user.role === 'admin' || req.tutor?.is_super_admin) return next();
  return next(forbidden('Super admin access required'));
}

export function requireApprovedTutor(req, res, next) {
  if (!req.user) return next(unauthorized());
  if (isManager(req)) return next();
  if (!req.tutor) return next(forbidden('Tutor profile required'));
  if (!req.tutor.approved) return next(forbidden('Tutor account is pending approval'));
  return next();
}

// Any account with active standing in the portal: a manager, an approved
// tutor, or an approved student. Suspending an account (clearing `approved`)
// must immediately stop it from reading or changing portal data.
export function requirePortalAccess(req, res, next) {
  if (!req.user) return next(unauthorized());
  if (isManager(req)) return next();
  if (req.tutor?.approved) return next();
  if (req.student?.approved && req.student?.can_access_student_portal) return next();
  return next(forbidden('Your account does not have portal access yet.'));
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
