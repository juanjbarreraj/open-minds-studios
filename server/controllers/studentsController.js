import { z } from 'zod';
import db from '../db/database.js';
import { newId } from '../lib/ids.js';
import { serializeRow, serializeRows } from '../lib/serialize.js';
import { notFound, conflict } from '../middleware/errors.js';

const studentSchema = z.object({
  first_name: z.string().trim().max(80).optional().default(''),
  last_name: z.string().trim().max(80).optional().default(''),
  full_name: z.string().trim().max(160).optional().default(''),
  email: z.string().trim().email(),
  phone: z.string().trim().max(40).optional().default(''),
  approved: z.boolean().optional().default(false),
  can_access_student_portal: z.boolean().optional().default(false),
  notes: z.string().max(4000).optional().default(''),
});

export function listStudents(req, res) {
  const rows = db.prepare('SELECT * FROM students ORDER BY created_at DESC').all();
  res.json(serializeRows(rows));
}

export function createStudent(req, res) {
  const data = studentSchema.parse(req.body);
  if (db.prepare('SELECT id FROM students WHERE email = ? COLLATE NOCASE').get(data.email)) {
    throw conflict('A student with that email already exists.');
  }
  const id = newId();
  db.prepare(`INSERT INTO students (id, first_name, last_name, full_name, email, phone, approved, can_access_student_portal, notes)
    VALUES (@id, @first_name, @last_name, @full_name, @email, @phone, @approved, @can_access_student_portal, @notes)`)
    .run({ ...data, id, approved: data.approved ? 1 : 0, can_access_student_portal: data.can_access_student_portal ? 1 : 0 });
  res.status(201).json(serializeRow(db.prepare('SELECT * FROM students WHERE id = ?').get(id)));
}

export function updateStudent(req, res) {
  const existing = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!existing) throw notFound('Student not found');
  const data = studentSchema.partial().parse(req.body);

  const merged = {
    ...existing,
    ...data,
    approved: (data.approved ?? Boolean(existing.approved)) ? 1 : 0,
    can_access_student_portal: (data.can_access_student_portal ?? Boolean(existing.can_access_student_portal)) ? 1 : 0,
  };
  db.prepare(`UPDATE students SET first_name=@first_name, last_name=@last_name, full_name=@full_name,
      email=@email, phone=@phone, approved=@approved, can_access_student_portal=@can_access_student_portal,
      notes=@notes, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id=@id`)
    .run(merged);
  res.json(serializeRow(db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id)));
}

export function deleteStudent(req, res) {
  const info = db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
  if (info.changes === 0) throw notFound('Student not found');
  res.json({ ok: true });
}

// Returns the caller's own student profile, creating an unapproved one on
// first use (mirrors the old dashboard's auto-create behavior).
export function myStudentProfile(req, res) {
  if (req.student) return res.json(serializeRow(req.student));
  if (req.user.role !== 'student_parent') throw notFound('No student profile for this account');

  const id = newId();
  const nameParts = (req.user.full_name || '').split(' ');
  db.prepare(`INSERT INTO students (id, user_id, first_name, last_name, full_name, email, approved, can_access_student_portal)
    VALUES (?, ?, ?, ?, ?, ?, 0, 0)`)
    .run(id, req.user.id, nameParts[0] || '', nameParts.slice(1).join(' ') || '', req.user.full_name || '', req.user.email);
  return res.status(201).json(serializeRow(db.prepare('SELECT * FROM students WHERE id = ?').get(id)));
}
