import { z } from 'zod';
import db from '../db/database.js';
import { newId } from '../lib/ids.js';
import { serializeRow, serializeRows } from '../lib/serialize.js';
import { isManager } from '../middleware/auth.js';
import { notFound, conflict, forbidden } from '../middleware/errors.js';

const tutorSchema = z.object({
  full_name: z.string().trim().min(1).max(160),
  email: z.string().trim().email(),
  phone: z.string().trim().max(40).optional().default(''),
  bio: z.string().max(4000).optional().default(''),
  approved: z.boolean().optional().default(false),
  can_access_manager_dashboard: z.boolean().optional().default(false),
  is_super_admin: z.boolean().optional().default(false),
});

// Fields safe to show non-managers (students picking a tutor).
const PUBLIC_FIELDS = ['id', 'full_name', 'email', 'bio', 'approved', 'created_at', 'created_date'];

export function listTutors(req, res) {
  const rows = serializeRows(db.prepare('SELECT * FROM tutors ORDER BY created_at DESC').all());
  if (isManager(req)) return res.json(rows);
  const approvedOnly = rows.filter((t) => t.approved);
  return res.json(approvedOnly.map((t) => Object.fromEntries(PUBLIC_FIELDS.map((f) => [f, t[f]]))));
}

// Only a super admin may grant elevated flags (mirrors the old UI rule).
function guardElevatedFlags(req, data) {
  if ((data.can_access_manager_dashboard || data.is_super_admin) && !req.tutor?.is_super_admin && req.user.role !== 'admin') {
    throw forbidden('Only a super admin can grant manager or super admin access.');
  }
}

export function createTutor(req, res) {
  const data = tutorSchema.parse(req.body);
  guardElevatedFlags(req, data);
  if (db.prepare('SELECT id FROM tutors WHERE email = ? COLLATE NOCASE').get(data.email)) {
    throw conflict('A tutor with that email already exists.');
  }
  const id = newId();
  db.prepare(`INSERT INTO tutors (id, full_name, email, phone, bio, approved, can_access_manager_dashboard, is_super_admin)
    VALUES (@id, @full_name, @email, @phone, @bio, @approved, @can_access_manager_dashboard, @is_super_admin)`)
    .run({
      ...data,
      id,
      approved: data.approved ? 1 : 0,
      can_access_manager_dashboard: data.can_access_manager_dashboard ? 1 : 0,
      is_super_admin: data.is_super_admin ? 1 : 0,
    });
  res.status(201).json(serializeRow(db.prepare('SELECT * FROM tutors WHERE id = ?').get(id)));
}

export function updateTutor(req, res) {
  const existing = db.prepare('SELECT * FROM tutors WHERE id = ?').get(req.params.id);
  if (!existing) throw notFound('Tutor not found');
  const data = tutorSchema.partial().parse(req.body);
  guardElevatedFlags(req, data);

  const merged = {
    id: existing.id,
    full_name: data.full_name ?? existing.full_name,
    email: data.email ?? existing.email,
    phone: data.phone ?? existing.phone,
    bio: data.bio ?? existing.bio,
    approved: (data.approved ?? Boolean(existing.approved)) ? 1 : 0,
    can_access_manager_dashboard: (data.can_access_manager_dashboard ?? Boolean(existing.can_access_manager_dashboard)) ? 1 : 0,
    is_super_admin: (data.is_super_admin ?? Boolean(existing.is_super_admin)) ? 1 : 0,
  };
  db.prepare(`UPDATE tutors SET full_name=@full_name, email=@email, phone=@phone, bio=@bio,
      approved=@approved, can_access_manager_dashboard=@can_access_manager_dashboard,
      is_super_admin=@is_super_admin, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id=@id`)
    .run(merged);
  res.json(serializeRow(db.prepare('SELECT * FROM tutors WHERE id = ?').get(req.params.id)));
}

export function deleteTutor(req, res) {
  const info = db.prepare('DELETE FROM tutors WHERE id = ?').run(req.params.id);
  if (info.changes === 0) throw notFound('Tutor not found');
  res.json({ ok: true });
}

export function myTutorProfile(req, res) {
  if (!req.tutor) throw notFound('No tutor profile for this account');
  res.json(serializeRow(req.tutor));
}
