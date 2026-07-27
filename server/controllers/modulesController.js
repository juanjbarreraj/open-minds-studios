import { z } from 'zod';
import db from '../db/database.js';
import { newId } from '../lib/ids.js';
import { serializeRow, serializeRows } from '../lib/serialize.js';
import { isManager } from '../middleware/auth.js';
import { badRequest, forbidden, notFound } from '../middleware/errors.js';

function fileInfo(fileId) {
  if (!fileId) return { url: null, name: null };
  const row = db.prepare('SELECT * FROM files WHERE id = ?').get(fileId);
  if (!row) throw badRequest('Uploaded file not found. Try uploading again.');
  return { url: `/api/files/${row.id}`, name: row.original_name };
}

const isOwnModule = (req, mod) =>
  (req.tutor && mod.tutor_id === req.tutor.id) ||
  (req.student &&
    (mod.student_id === req.student.id || mod.student_email.toLowerCase() === req.student.email.toLowerCase()));

export function listModules(req, res) {
  const { status } = req.query;
  let rows;
  if (isManager(req)) {
    rows = db.prepare('SELECT * FROM modules ORDER BY created_at DESC').all();
  } else if (req.tutor) {
    rows = db.prepare('SELECT * FROM modules WHERE tutor_id = ? ORDER BY created_at DESC').all(req.tutor.id);
  } else if (req.student) {
    rows = db.prepare('SELECT * FROM modules WHERE student_id = ? OR student_email = ? COLLATE NOCASE ORDER BY created_at DESC')
      .all(req.student.id, req.student.email);
  } else {
    rows = [];
  }
  if (status) rows = rows.filter((m) => m.status === status);
  res.json(serializeRows(rows));
}

const createSchema = z.object({
  student_email: z.string().trim().email(),
  student_id: z.string().optional().default(''),
  student_name: z.string().trim().max(160).optional().default(''),
  name: z.string().trim().min(1).max(200),
  description: z.string().max(8000).optional().default(''),
  file_id: z.string().optional().nullable(),
});

export function createModule(req, res) {
  if (!req.tutor && !isManager(req)) throw forbidden('Only tutors can assign modules.');
  const data = createSchema.parse(req.body);
  const tutor = req.tutor;
  if (!tutor) throw badRequest('A tutor profile is required to assign modules.');

  const student = data.student_id
    ? db.prepare('SELECT * FROM students WHERE id = ?').get(data.student_id)
    : db.prepare('SELECT * FROM students WHERE email = ? COLLATE NOCASE').get(data.student_email);

  const file = fileInfo(data.file_id);
  const id = newId();
  db.prepare(`INSERT INTO modules
      (id, tutor_id, student_id, student_email, tutor_name, student_name, name, description,
       file_id, file_url, file_name, status)
      VALUES (@id, @tutor_id, @student_id, @student_email, @tutor_name, @student_name, @name,
       @description, @file_id, @file_url, @file_name, 'assigned')`)
    .run({
      id,
      tutor_id: tutor.id,
      student_id: student?.id || null,
      student_email: data.student_email,
      tutor_name: tutor.full_name || '',
      student_name: data.student_name || student?.full_name || '',
      name: data.name,
      description: data.description,
      file_id: data.file_id || null,
      file_url: file.url,
      file_name: file.name,
    });
  res.status(201).json(serializeRow(db.prepare('SELECT * FROM modules WHERE id = ?').get(id)));
}

const submitSchema = z.object({
  file_id: z.string().min(1),
});

// Student submits work for grading.
export function submitModule(req, res) {
  const mod = db.prepare('SELECT * FROM modules WHERE id = ?').get(req.params.id);
  if (!mod) throw notFound('Module not found');
  const ownsAsStudent =
    req.student &&
    (mod.student_id === req.student.id || mod.student_email.toLowerCase() === req.student.email.toLowerCase());
  if (!ownsAsStudent) throw forbidden('You can only submit your own modules.');
  if (mod.status === 'graded') throw badRequest('This module has already been graded.');

  const data = submitSchema.parse(req.body);
  const file = fileInfo(data.file_id);
  db.prepare(`UPDATE modules SET submission_file_id = @file_id, student_submission_url = @url,
      student_submission_name = @name, status = 'submitted',
      submitted_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = @id`)
    .run({ id: mod.id, file_id: data.file_id, url: file.url, name: file.name });
  res.json(serializeRow(db.prepare('SELECT * FROM modules WHERE id = ?').get(mod.id)));
}

const gradeSchema = z.object({
  grade: z.string().trim().min(1).max(60),
  feedback: z.string().max(8000).optional().default(''),
});

// Tutor grades a submitted module.
export function gradeModule(req, res) {
  const mod = db.prepare('SELECT * FROM modules WHERE id = ?').get(req.params.id);
  if (!mod) throw notFound('Module not found');
  const owns = (req.tutor && mod.tutor_id === req.tutor.id) || isManager(req);
  if (!owns) throw forbidden('You can only grade modules you assigned.');
  if (mod.status !== 'submitted') throw badRequest('Only submitted modules can be graded.');

  const data = gradeSchema.parse(req.body);
  db.prepare(`UPDATE modules SET grade = @grade, feedback = @feedback, status = 'graded',
      graded_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = @id`)
    .run({ id: mod.id, grade: data.grade, feedback: data.feedback });
  res.json(serializeRow(db.prepare('SELECT * FROM modules WHERE id = ?').get(mod.id)));
}
