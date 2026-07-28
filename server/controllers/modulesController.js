import { z } from 'zod';
import db from '../db/database.js';
import { newId } from '../lib/ids.js';
import { serializeRow, serializeRows } from '../lib/serialize.js';
import { isManager } from '../middleware/auth.js';
import { firstQueryValue } from '../lib/query.js';
import { badRequest, forbidden, notFound } from '../middleware/errors.js';

// Only the account that uploaded a file may attach it to a module. Without
// this, any known file id could be re-shared with an unrelated student.
function fileInfo(fileId, req) {
  if (!fileId) return { url: null, name: null };
  const row = db.prepare('SELECT * FROM files WHERE id = ?').get(fileId);
  if (!row) throw badRequest('Uploaded file not found. Try uploading again.');
  if (!isManager(req) && row.uploader_user_id !== req.user.id) {
    throw forbidden('You can only attach files you uploaded.');
  }
  return { url: `/api/files/${row.id}`, name: row.original_name };
}

export function listModules(req, res) {
  const status = firstQueryValue(req.query.status);
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
  student_id: z.string().trim().optional().default(''),
  student_name: z.string().trim().max(160).optional().default(''),
  name: z.string().trim().min(1).max(200),
  description: z.string().max(8000).optional().default(''),
  file_id: z.string().optional().nullable(),
});

// Module access is checked against both student_id and student_email, so the
// two must describe the same person or a module would be readable by two
// unrelated students. Whichever identifier the client sends, the stored
// identity comes from the database row, never from the request body.
function resolveModuleStudent(data) {
  if (data.student_id) {
    const byId = db.prepare('SELECT * FROM students WHERE id = ?').get(data.student_id);
    if (!byId) throw badRequest('That student profile does not exist.');
    if (data.student_email && byId.email.toLowerCase() !== data.student_email.toLowerCase()) {
      throw badRequest('The student id and email address refer to different students.');
    }
    return byId;
  }

  const byEmail = db.prepare('SELECT * FROM students WHERE email = ? COLLATE NOCASE').get(data.student_email);
  // Assigning by email alone before the family has a profile is the
  // pre-registration case the original app supported. It is kept, with the
  // module holding only the email until a profile exists.
  return byEmail || null;
}

export function createModule(req, res) {
  if (!req.tutor && !isManager(req)) throw forbidden('Only tutors can assign modules.');
  const data = createSchema.parse(req.body);
  const tutor = req.tutor;
  if (!tutor) throw badRequest('A tutor profile is required to assign modules.');

  const student = resolveModuleStudent(data);

  const file = fileInfo(data.file_id, req);
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
      // Canonical values win over anything the client supplied.
      student_email: student?.email || data.student_email,
      tutor_name: tutor.full_name || '',
      student_name: student?.full_name || data.student_name || '',
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
  const file = fileInfo(data.file_id, req);
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

// Who may put a grade on this module: the tutor who assigned it, or a manager.
function assertMayGrade(req, mod) {
  const owns = (req.tutor && mod.tutor_id === req.tutor.id) || isManager(req);
  if (!owns) throw forbidden('You can only grade modules you assigned.');
}

// Tutor grades a submitted module.
export function gradeModule(req, res) {
  const mod = db.prepare('SELECT * FROM modules WHERE id = ?').get(req.params.id);
  if (!mod) throw notFound('Module not found');
  assertMayGrade(req, mod);
  if (mod.status !== 'submitted') {
    if (mod.status === 'graded') {
      throw badRequest('This module is already graded. Use the grade correction endpoint to change it.');
    }
    throw badRequest('Only submitted modules can be graded.');
  }

  const data = gradeSchema.parse(req.body);
  const apply = db.transaction(() => {
    db.prepare(`UPDATE modules SET grade = @grade, feedback = @feedback, status = 'graded',
        graded_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
        updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE id = @id`)
      .run({ id: mod.id, grade: data.grade, feedback: data.feedback });
    // The first grade is revision one, so the history is complete rather than
    // starting only once someone makes a correction.
    recordRevision(req, mod, {
      previousGrade: null,
      previousFeedback: null,
      newGrade: data.grade,
      newFeedback: data.feedback,
      reason: 'Initial grade',
    });
  });
  apply();
  res.json(serializeRow(db.prepare('SELECT * FROM modules WHERE id = ?').get(mod.id)));
}

const correctionSchema = z.object({
  grade: z.string().trim().min(1).max(60),
  feedback: z.string().max(8000).optional(),
  correction_reason: z.string().trim().min(5, 'Explain why the grade is being corrected.').max(1000),
});

// A grade may be corrected, but the earlier value is never destroyed: the
// module row carries the current grade and module_grade_revisions carries
// every value it has ever had.
export function correctGrade(req, res) {
  const mod = db.prepare('SELECT * FROM modules WHERE id = ?').get(req.params.id);
  if (!mod) throw notFound('Module not found');
  assertMayGrade(req, mod);
  if (mod.status !== 'graded') throw badRequest('Only a graded module can have its grade corrected.');

  const data = correctionSchema.parse(req.body);
  const newFeedback = data.feedback === undefined ? mod.feedback || '' : data.feedback;

  const apply = db.transaction(() => {
    recordRevision(req, mod, {
      previousGrade: mod.grade,
      previousFeedback: mod.feedback,
      newGrade: data.grade,
      newFeedback,
      reason: data.correction_reason,
    });
    db.prepare(`UPDATE modules SET grade = @grade, feedback = @feedback,
        graded_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
        updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE id = @id`)
      .run({ id: mod.id, grade: data.grade, feedback: newFeedback });
  });
  apply();
  res.json(serializeRow(db.prepare('SELECT * FROM modules WHERE id = ?').get(mod.id)));
}

function recordRevision(req, mod, { previousGrade, previousFeedback, newGrade, newFeedback, reason }) {
  db.prepare(`INSERT INTO module_grade_revisions
      (id, module_id, previous_grade, new_grade, previous_feedback, new_feedback,
       correction_reason, changed_by_user_id, changed_by_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(
      newId(), mod.id, previousGrade, newGrade, previousFeedback, newFeedback,
      reason, req.user.id, req.tutor?.full_name || req.user.full_name || ''
    );
}

// Grade history. Staff see the full record including who changed what and
// why; a student sees only that their grade changed and when, because the
// correction reason is internal.
export function listGradeRevisions(req, res) {
  const mod = db.prepare('SELECT * FROM modules WHERE id = ?').get(req.params.id);
  if (!mod) throw notFound('Module not found');

  const isStaff = isManager(req) || (req.tutor && mod.tutor_id === req.tutor.id);
  const isTheStudent = req.student &&
    (mod.student_id === req.student.id || mod.student_email.toLowerCase() === req.student.email.toLowerCase());
  if (!isStaff && !isTheStudent) throw forbidden('You do not have access to that module.');

  const rows = db
    .prepare('SELECT * FROM module_grade_revisions WHERE module_id = ? ORDER BY changed_at, rowid')
    .all(mod.id);

  if (isStaff) return res.json(serializeRows(rows));

  return res.json(rows.map((r) => ({
    id: r.id,
    module_id: r.module_id,
    new_grade: r.new_grade,
    new_feedback: r.new_feedback,
    changed_at: r.changed_at,
    is_correction: r.previous_grade !== null,
  })));
}
