import { z } from 'zod';
import db from '../db/database.js';
import { newId, newSessionToken, hashToken } from '../lib/ids.js';
import { serializeRow, serializeRows } from '../lib/serialize.js';
import { isElevatedTutorRow } from '../lib/privileges.js';
import { badRequest, conflict, notFound } from '../middleware/errors.js';

const DEFAULT_TTL_DAYS = 14;

// The raw token is shown once, at creation, and never stored or logged: only
// its hash is kept, so a leaked database cannot be used to accept invitations.
const createSchema = z.object({
  profile_type: z.enum(['student', 'tutor']),
  profile_id: z.string().min(1),
  expires_in_days: z.number().int().min(1).max(90).optional().default(DEFAULT_TTL_DAYS),
});

function loadProfile(profileType, profileId) {
  const table = profileType === 'student' ? 'students' : 'tutors';
  const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(profileId);
  if (!row) throw notFound(`${profileType === 'student' ? 'Student' : 'Tutor'} profile not found`);
  return row;
}

export function createInvitation(req, res) {
  const data = createSchema.parse(req.body);
  const profile = loadProfile(data.profile_type, data.profile_id);

  if (profile.user_id) {
    throw conflict('That profile is already linked to a portal account.');
  }
  // An invitation is a self-service path, so it must never be able to hand out
  // manager or super admin reach. Those profiles are linked by a super admin.
  if (data.profile_type === 'tutor' && isElevatedTutorRow(profile)) {
    throw badRequest(
      'Manager and super admin profiles cannot be invited. A super admin links those accounts directly.'
    );
  }

  const token = newSessionToken();
  const id = newId();
  const expiresAt = new Date(Date.now() + data.expires_in_days * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(`INSERT INTO invitations
      (id, token_hash, intended_role, profile_type, profile_id, email, created_by_user_id, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(
      id, hashToken(token),
      data.profile_type === 'student' ? 'student_parent' : 'tutor',
      data.profile_type, profile.id, profile.email || null, req.user.id, expiresAt
    );

  const row = db.prepare('SELECT * FROM invitations WHERE id = ?').get(id);
  // The only time the raw token leaves the server. It is deliberately absent
  // from every listing and from the logs.
  res.status(201).json({
    ...serializeRow(row),
    token,
    invite_path: `/register?invite=${token}`,
  });
}

export function listInvitations(req, res) {
  const rows = db.prepare('SELECT * FROM invitations ORDER BY created_at DESC').all();
  // token_hash never leaves the server, not even to a manager.
  res.json(serializeRows(rows).map(({ token_hash, ...rest }) => ({
    ...rest,
    status: invitationState(rest),
  })));
}

export function revokeInvitation(req, res) {
  const row = db.prepare('SELECT * FROM invitations WHERE id = ?').get(req.params.id);
  if (!row) throw notFound('Invitation not found');
  if (row.accepted_at) throw badRequest('That invitation has already been used.');
  if (row.revoked_at) return res.json({ ok: true, already_revoked: true });

  db.prepare("UPDATE invitations SET revoked_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?")
    .run(row.id);
  res.json({ ok: true });
}

function invitationState(row) {
  if (row.accepted_at) return 'accepted';
  if (row.revoked_at) return 'revoked';
  if (row.expires_at <= new Date().toISOString()) return 'expired';
  return 'pending';
}

// Resolve a raw token to a usable invitation, or explain precisely why not.
// Shared by the public preview endpoint and by registration.
export function findUsableInvitation(rawToken) {
  if (typeof rawToken !== 'string' || rawToken.length < 16) {
    return { ok: false, reason: 'This invitation link is not valid.' };
  }
  const row = db.prepare('SELECT * FROM invitations WHERE token_hash = ?').get(hashToken(rawToken));
  // An altered token simply does not hash to a stored value.
  if (!row) return { ok: false, reason: 'This invitation link is not valid.' };
  if (row.revoked_at) return { ok: false, reason: 'This invitation has been revoked.' };
  if (row.accepted_at) return { ok: false, reason: 'This invitation has already been used.' };
  if (row.expires_at <= new Date().toISOString()) return { ok: false, reason: 'This invitation has expired.' };

  const table = row.profile_type === 'student' ? 'students' : 'tutors';
  const profile = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(row.profile_id);
  if (!profile) return { ok: false, reason: 'The profile for this invitation no longer exists.' };
  if (profile.user_id) return { ok: false, reason: 'That profile is already linked to an account.' };
  if (row.profile_type === 'tutor' && isElevatedTutorRow(profile)) {
    return { ok: false, reason: 'This invitation is no longer valid for that profile.' };
  }

  return { ok: true, invitation: row, profile };
}

// Public: lets the registration page show who the invitation is for without
// revealing anything beyond the intended role and email.
export function previewInvitation(req, res) {
  const result = findUsableInvitation(req.query.token);
  if (!result.ok) throw badRequest(result.reason);
  res.json({
    intended_role: result.invitation.intended_role,
    profile_type: result.invitation.profile_type,
    email: result.invitation.email,
    full_name: result.profile.full_name || `${result.profile.first_name || ''} ${result.profile.last_name || ''}`.trim(),
    expires_at: result.invitation.expires_at,
  });
}

// Called from the registration transaction once the account exists.
export function acceptInvitation({ invitation, userId }) {
  const table = invitation.profile_type === 'student' ? 'students' : 'tutors';
  db.prepare(`UPDATE ${table} SET user_id = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`)
    .run(userId, invitation.profile_id);
  db.prepare(`UPDATE invitations SET accepted_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), accepted_user_id = ?
      WHERE id = ?`)
    .run(userId, invitation.id);
}
