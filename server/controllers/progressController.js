import { z } from 'zod';
import db from '../db/database.js';
import { newId } from '../lib/ids.js';
import { serializeRow, serializeRows } from '../lib/serialize.js';
import { isManager } from '../middleware/auth.js';
import { badRequest, forbidden, notFound } from '../middleware/errors.js';

// A tutor may maintain progress only for students they actually work with:
// someone who has a booking with them, or a module they assigned.
function tutorWorksWithStudent(tutorId, student) {
  const booking = db
    .prepare(`SELECT id FROM bookings WHERE tutor_id = ?
      AND (student_id = ? OR student_email = ? COLLATE NOCASE) LIMIT 1`)
    .get(tutorId, student.id, student.email);
  if (booking) return true;
  const mod = db
    .prepare(`SELECT id FROM modules WHERE tutor_id = ?
      AND (student_id = ? OR student_email = ? COLLATE NOCASE) LIMIT 1`)
    .get(tutorId, student.id, student.email);
  return Boolean(mod);
}

function loadStudentOr404(studentId) {
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
  if (!student) throw notFound('Student not found');
  return student;
}

// Students read their own record. Tutors read and write for their roster.
// Managers read and write for anyone.
function assertMayRead(req, student) {
  if (isManager(req)) return;
  if (req.student && req.student.id === student.id) return;
  if (req.tutor?.approved && tutorWorksWithStudent(req.tutor.id, student)) return;
  throw forbidden('You do not have access to that student\'s progress.');
}

function assertMayWrite(req, student) {
  if (isManager(req)) return;
  if (req.tutor?.approved && tutorWorksWithStudent(req.tutor.id, student)) return;
  if (req.student && req.student.id === student.id) {
    throw forbidden('Progress is maintained by your tutor. You have read-only access.');
  }
  throw forbidden('You cannot update that student\'s progress.');
}

// Resolve the student a request is about: an explicit id for staff, or the
// caller's own profile when no id is given.
function targetStudent(req) {
  const requested = req.query.student_id || req.params.studentId;
  if (requested) return loadStudentOr404(requested);
  if (!req.student) throw badRequest('A student must be specified.');
  return req.student;
}

export function getProgress(req, res) {
  const student = targetStudent(req);
  assertMayRead(req, student);

  const metrics = db
    .prepare('SELECT * FROM student_progress_metrics WHERE student_id = ? ORDER BY display_order, created_at')
    .all(student.id);
  const focus = db
    .prepare('SELECT * FROM student_focus WHERE student_id = ? AND active = 1 ORDER BY updated_at DESC')
    .all(student.id);

  res.json({
    student_id: student.id,
    metrics: serializeRows(metrics),
    focus: serializeRows(focus),
  });
}

const metricSchema = z.object({
  label: z.string().trim().min(1).max(80),
  value: z.string().trim().min(1).max(80),
  numeric_value: z.number().nullable().optional(),
  unit: z.string().trim().max(20).nullable().optional(),
  display_order: z.number().int().min(0).max(999).optional().default(0),
});

export function createMetric(req, res) {
  const student = loadStudentOr404(req.params.studentId);
  assertMayWrite(req, student);
  const data = metricSchema.parse(req.body);

  const id = newId();
  db.prepare(`INSERT INTO student_progress_metrics
      (id, student_id, label, value, numeric_value, unit, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(id, student.id, data.label, data.value, data.numeric_value ?? null, data.unit ?? null, data.display_order);
  res.status(201).json(serializeRow(db.prepare('SELECT * FROM student_progress_metrics WHERE id = ?').get(id)));
}

export function updateMetric(req, res) {
  const existing = db.prepare('SELECT * FROM student_progress_metrics WHERE id = ?').get(req.params.id);
  if (!existing) throw notFound('Metric not found');
  const student = loadStudentOr404(existing.student_id);
  assertMayWrite(req, student);

  const data = metricSchema.partial().parse(req.body);
  db.prepare(`UPDATE student_progress_metrics SET
      label = COALESCE(@label, label),
      value = COALESCE(@value, value),
      numeric_value = COALESCE(@numeric_value, numeric_value),
      unit = COALESCE(@unit, unit),
      display_order = COALESCE(@display_order, display_order),
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = @id`)
    .run({
      id: existing.id,
      label: data.label ?? null,
      value: data.value ?? null,
      numeric_value: data.numeric_value ?? null,
      unit: data.unit ?? null,
      display_order: data.display_order ?? null,
    });
  res.json(serializeRow(db.prepare('SELECT * FROM student_progress_metrics WHERE id = ?').get(existing.id)));
}

export function deleteMetric(req, res) {
  const existing = db.prepare('SELECT * FROM student_progress_metrics WHERE id = ?').get(req.params.id);
  if (!existing) throw notFound('Metric not found');
  assertMayWrite(req, loadStudentOr404(existing.student_id));
  db.prepare('DELETE FROM student_progress_metrics WHERE id = ?').run(existing.id);
  res.json({ ok: true });
}

const focusSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).optional().default(''),
  progress_percent: z.number().int().min(0).max(100).optional().default(0),
  active: z.boolean().optional().default(true),
});

export function createFocus(req, res) {
  const student = loadStudentOr404(req.params.studentId);
  assertMayWrite(req, student);
  const data = focusSchema.parse(req.body);

  const id = newId();
  db.prepare(`INSERT INTO student_focus (id, student_id, title, description, progress_percent, active)
      VALUES (?, ?, ?, ?, ?, ?)`)
    .run(id, student.id, data.title, data.description, data.progress_percent, data.active ? 1 : 0);
  res.status(201).json(serializeRow(db.prepare('SELECT * FROM student_focus WHERE id = ?').get(id)));
}

export function updateFocus(req, res) {
  const existing = db.prepare('SELECT * FROM student_focus WHERE id = ?').get(req.params.id);
  if (!existing) throw notFound('Focus item not found');
  const student = loadStudentOr404(existing.student_id);
  assertMayWrite(req, student);

  const data = focusSchema.partial().parse(req.body);
  db.prepare(`UPDATE student_focus SET
      title = COALESCE(@title, title),
      description = COALESCE(@description, description),
      progress_percent = COALESCE(@progress_percent, progress_percent),
      active = COALESCE(@active, active),
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = @id`)
    .run({
      id: existing.id,
      title: data.title ?? null,
      description: data.description ?? null,
      progress_percent: data.progress_percent ?? null,
      active: data.active === undefined ? null : (data.active ? 1 : 0),
    });
  res.json(serializeRow(db.prepare('SELECT * FROM student_focus WHERE id = ?').get(existing.id)));
}

export function deleteFocus(req, res) {
  const existing = db.prepare('SELECT * FROM student_focus WHERE id = ?').get(req.params.id);
  if (!existing) throw notFound('Focus item not found');
  assertMayWrite(req, loadStudentOr404(existing.student_id));
  db.prepare('DELETE FROM student_focus WHERE id = ?').run(existing.id);
  res.json({ ok: true });
}
