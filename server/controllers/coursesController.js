import { z } from 'zod';
import db from '../db/database.js';
import { newId } from '../lib/ids.js';
import { serializeRow, serializeRows } from '../lib/serialize.js';
import { firstQueryValue } from '../lib/query.js';
import { notFound, conflict } from '../middleware/errors.js';

const courseSchema = z.object({
  course_code: z.string().trim().min(1).max(40),
  course_name: z.string().trim().min(1).max(160),
});

export function listCourses(req, res) {
  res.json(serializeRows(db.prepare('SELECT * FROM courses ORDER BY course_code').all()));
}

export function createCourse(req, res) {
  const data = courseSchema.parse(req.body);
  const id = newId();
  db.prepare('INSERT INTO courses (id, course_code, course_name) VALUES (?, ?, ?)')
    .run(id, data.course_code, data.course_name);
  res.status(201).json(serializeRow(db.prepare('SELECT * FROM courses WHERE id = ?').get(id)));
}

export function updateCourse(req, res) {
  const existing = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  if (!existing) throw notFound('Course not found');
  const data = courseSchema.partial().parse(req.body);
  db.prepare(`UPDATE courses SET course_code = ?, course_name = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`)
    .run(data.course_code ?? existing.course_code, data.course_name ?? existing.course_name, req.params.id);
  res.json(serializeRow(db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id)));
}

export function deleteCourse(req, res) {
  const info = db.prepare('DELETE FROM courses WHERE id = ?').run(req.params.id);
  if (info.changes === 0) throw notFound('Course not found');
  res.json({ ok: true });
}

// --- Tutor-course assignments ---

const tutorCourseSchema = z.object({
  tutor_id: z.string().min(1),
  course_id: z.string().min(1),
});

export function listTutorCourses(req, res) {
  const tutor_id = firstQueryValue(req.query.tutor_id);
  const rows = tutor_id
    ? db.prepare('SELECT * FROM tutor_courses WHERE tutor_id = ?').all(tutor_id)
    : db.prepare('SELECT * FROM tutor_courses').all();
  res.json(serializeRows(rows));
}

export function createTutorCourse(req, res) {
  const data = tutorCourseSchema.parse(req.body);
  if (!db.prepare('SELECT id FROM tutors WHERE id = ?').get(data.tutor_id)) throw notFound('Tutor not found');
  if (!db.prepare('SELECT id FROM courses WHERE id = ?').get(data.course_id)) throw notFound('Course not found');
  const id = newId();
  try {
    db.prepare('INSERT INTO tutor_courses (id, tutor_id, course_id) VALUES (?, ?, ?)')
      .run(id, data.tutor_id, data.course_id);
  } catch (err) {
    if (err?.code === 'SQLITE_CONSTRAINT_UNIQUE') throw conflict('That tutor already has that course.');
    throw err;
  }
  res.status(201).json(serializeRow(db.prepare('SELECT * FROM tutor_courses WHERE id = ?').get(id)));
}

export function deleteTutorCourse(req, res) {
  const info = db.prepare('DELETE FROM tutor_courses WHERE id = ?').run(req.params.id);
  if (info.changes === 0) throw notFound('Assignment not found');
  res.json({ ok: true });
}
