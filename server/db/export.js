// Portable JSON export of the business records, for inspection, reporting, or
// migrating into a hosted database later.
//
// Credentials and anything that could be replayed are excluded by
// construction: this file lists the columns to export rather than dumping
// tables, so a future column cannot leak by accident.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db from './database.js';
import { sourceHasSchema } from './backup.js';
import { serializeRows } from '../lib/serialize.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const EXPORT_DIR = process.env.EXPORT_DIR || path.join(__dirname, '..', 'exports');

// Never exported: users.password_hash, sessions (cookie material),
// invitations.token_hash, and any raw invitation token.
const DATASETS = {
  students: `SELECT id, user_id, first_name, last_name, full_name, email, phone, approved,
    can_access_student_portal, notes, created_at, updated_at FROM students ORDER BY created_at`,
  tutors: `SELECT id, user_id, full_name, email, phone, approved, bio,
    can_access_manager_dashboard, is_super_admin, created_at, updated_at FROM tutors ORDER BY created_at`,
  courses: 'SELECT id, course_code, course_name, created_at, updated_at FROM courses ORDER BY course_code',
  tutor_courses: 'SELECT id, tutor_id, course_id, created_at FROM tutor_courses ORDER BY created_at',
  availability_slots: `SELECT id, tutor_id, day_of_week, start_time, end_time, is_active,
    created_at, updated_at FROM availability_slots ORDER BY tutor_id, day_of_week, start_time`,
  bookings: `SELECT id, tutor_id, student_id, student_first_name, student_last_name, student_email,
    student_phone, course_id, assignment_description, session_date, preferred_day,
    preferred_start_time, preferred_end_time, starts_at_utc, ends_at_utc, slot_id, meeting_type,
    meeting_link, status, cancelled_by, cancellation_reason, cancelled_at, declined_at,
    created_at, updated_at FROM bookings ORDER BY session_date, preferred_start_time`,
  modules: `SELECT id, tutor_id, student_id, student_email, tutor_name, student_name, name,
    description, file_name, status, student_submission_name, submitted_at, grade, feedback,
    graded_at, created_at, updated_at FROM modules ORDER BY created_at`,
  module_grade_revisions: `SELECT id, module_id, previous_grade, new_grade, previous_feedback,
    new_feedback, correction_reason, changed_by_name, changed_at
    FROM module_grade_revisions ORDER BY module_id, changed_at`,
  inquiries: `SELECT id, parent_name, email, student_grade, subject_or_exam, goals, message,
    interested_program, status, manager_notes, created_at, updated_at FROM inquiries ORDER BY created_at`,
  student_progress_metrics: `SELECT id, student_id, label, value, numeric_value, unit,
    display_order, created_at, updated_at FROM student_progress_metrics ORDER BY student_id, display_order`,
  student_focus: `SELECT id, student_id, title, description, progress_percent, active,
    created_at, updated_at FROM student_focus ORDER BY student_id, created_at`,
  notification_outbox: `SELECT id, channel, recipient, subject, event_type, related_type,
    related_id, status, created_at FROM notification_outbox ORDER BY created_at`,
  admin_overrides: `SELECT id, actor_email, action, target_type, target_id, reason, details,
    created_at FROM admin_overrides ORDER BY created_at`,
};

export function buildExport() {
  // Same trap as the backup path: importing database.js creates the file when
  // it is missing, so an existence check proves nothing. Without this the
  // failure is a raw SQLITE_ERROR that does not name the cause.
  if (!sourceHasSchema()) {
    throw new Error(
      'The database has no tables, so there is nothing to export. If this is a ' +
      'hosted environment, the process probably cannot see the persistent disk.'
    );
  }
  const data = {};
  for (const [name, sql] of Object.entries(DATASETS)) {
    data[name] = serializeRows(db.prepare(sql).all());
  }
  return {
    exported_at: new Date().toISOString(),
    note: 'Business records only. Password hashes, sessions, and invitation tokens are never exported.',
    counts: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length])),
    data,
  };
}

export function writeExport() {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const target = path.join(EXPORT_DIR, `openminds-export-${stamp}.json`);
  const payload = buildExport();
  fs.writeFileSync(target, JSON.stringify(payload, null, 2));
  return { path: target, counts: payload.counts };
}

if (process.argv[1] && process.argv[1].endsWith('export.js')) {
  const result = writeExport();
  console.log(`[db] export written to ${result.path}`);
  for (const [name, count] of Object.entries(result.counts)) {
    console.log(`       ${String(count).padStart(4)}  ${name}`);
  }
}
