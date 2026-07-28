// Every rule about who may act on an elevated profile lives here, so the
// checks cannot drift apart across controllers.
import db from '../db/database.js';
import { forbidden, badRequest, conflict } from '../middleware/errors.js';

// A profile is elevated when it grants manager-level reach. Editing, linking,
// unlinking, or deleting one is equivalent to handing out that reach, so it is
// restricted to super admins regardless of which field is being touched.
export const isElevatedTutorRow = (tutor) =>
  Boolean(tutor && (tutor.is_super_admin || tutor.can_access_manager_dashboard));

// Super admin: either the explicit `admin` user role, or a linked tutor
// profile carrying is_super_admin.
export const isSuperAdmin = (req) =>
  Boolean(req?.user && (req.user.role === 'admin' || req.tutor?.is_super_admin));

export function requireSuperAdmin(req, action) {
  if (!isSuperAdmin(req)) {
    throw forbidden(`Only a super admin can ${action}.`);
  }
}

// Guard for any write that targets an existing elevated tutor profile.
export function assertMayActOnTutor(req, tutorRow, action) {
  if (isElevatedTutorRow(tutorRow)) requireSuperAdmin(req, action);
}

// Elevated flags may only be changed by a super admin in either direction:
// granting them is escalation, revoking them would let one manager lock the
// super admin out.
export function assertMayChangeElevatedFlags(req, data, existing = null) {
  const changes = (field) =>
    data[field] !== undefined && data[field] !== Boolean(existing?.[field]);
  if (changes('can_access_manager_dashboard') || changes('is_super_admin')) {
    requireSuperAdmin(req, 'change manager or super admin access');
  }
}

// Count the super admins who can actually sign in: an elevated tutor profile
// linked to a portal account, plus any user holding the `admin` role.
export function countReachableSuperAdmins({ excludeTutorId = null } = {}) {
  const linkedSuperAdmins = db
    .prepare(`SELECT COUNT(*) AS n FROM tutors
      WHERE is_super_admin = 1 AND user_id IS NOT NULL AND id IS NOT ?`)
    .get(excludeTutorId).n;
  const adminRoleUsers = db
    .prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'")
    .get().n;
  return linkedSuperAdmins + adminRoleUsers;
}

// Refuse any change that would leave nobody able to administer the system.
export function assertKeepsASuperAdmin(tutorRow, { removingProfile = false, removingLink = false, removingFlag = false } = {}) {
  if (!tutorRow?.is_super_admin) return;
  if (!removingProfile && !removingLink && !removingFlag) return;
  if (countReachableSuperAdmins({ excludeTutorId: tutorRow.id }) === 0) {
    throw badRequest(
      'This is the last account with super admin access. Grant super admin to another linked account before changing this one.'
    );
  }
}

// --- Profile linking rules (roles must match the profile type) ---

export function assertUserMayHoldStudentProfile(user) {
  if (user.role !== 'student_parent') {
    throw badRequest(
      `That portal account is registered as ${describeRole(user.role)}, so it cannot own a student profile.`
    );
  }
}

export function assertUserMayHoldTutorProfile(user) {
  // Managers and admins legitimately hold a tutor profile: the manager
  // dashboard is reached through one.
  if (!['tutor', 'manager', 'admin'].includes(user.role)) {
    throw badRequest(
      `That portal account is registered as ${describeRole(user.role)}, so it cannot own a tutor profile.`
    );
  }
}

// One account must never own both profile types, which would make its
// identity ambiguous everywhere data is scoped.
export function assertNoConflictingProfile(user, { wants }) {
  const other = wants === 'student'
    ? db.prepare('SELECT id FROM tutors WHERE user_id = ?').get(user.id)
    : db.prepare('SELECT id FROM students WHERE user_id = ?').get(user.id);
  if (other) {
    throw conflict(
      `That portal account is already linked to a ${wants === 'student' ? 'tutor' : 'student'} profile. Unlink it first.`
    );
  }
}

function describeRole(role) {
  return {
    student_parent: 'a student or parent',
    tutor: 'a tutor',
    manager: 'a manager',
    admin: 'an administrator',
  }[role] || role;
}
