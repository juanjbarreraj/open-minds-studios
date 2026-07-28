import { z } from 'zod';
import db from '../db/database.js';
import { newId } from '../lib/ids.js';
import { serializeRow, serializeRows } from '../lib/serialize.js';
import { firstQueryValue } from '../lib/query.js';
import { badRequest, notFound } from '../middleware/errors.js';
import { processNewInquiry } from '../services/inquiryIntegrationService.js';

const inquirySchema = z.object({
  parent_name: z.string().trim().min(1, 'Parent name is required').max(160),
  email: z.string().trim().email('A valid email is required'),
  student_grade: z.string().trim().max(80).optional().default(''),
  subject_or_exam: z.string().trim().max(200).optional().default(''),
  goals: z.string().trim().max(4000).optional().default(''),
  message: z.string().trim().max(8000).optional().default(''),
  interested_program: z.string().trim().max(120).optional().default(''),
});

export async function createInquiry(req, res) {
  const data = inquirySchema.parse(req.body);
  const id = newId();
  db.prepare(`INSERT INTO inquiries (id, parent_name, email, student_grade, subject_or_exam, goals, message, interested_program)
    VALUES (@id, @parent_name, @email, @student_grade, @subject_or_exam, @goals, @message, @interested_program)`)
    .run({ ...data, id });

  const inquiry = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(id);
  await processNewInquiry(inquiry);
  res.status(201).json({ ok: true, inquiry: serializeRow(inquiry) });
}

export function listInquiries(req, res) {
  const status = firstQueryValue(req.query.status);
  const rows = status
    ? db.prepare('SELECT * FROM inquiries WHERE status = ? ORDER BY created_at DESC').all(status)
    : db.prepare('SELECT * FROM inquiries ORDER BY created_at DESC').all();
  res.json(serializeRows(rows));
}

// Managers work an inquiry through new -> contacted -> closed and keep private
// notes. Inquiries are never deleted here: they are the record of a lead.
const workflowSchema = z.object({
  status: z.enum(['new', 'contacted', 'closed']).optional(),
  manager_notes: z.string().max(8000).optional(),
});

export function updateInquiry(req, res) {
  const existing = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(req.params.id);
  if (!existing) throw notFound('Inquiry not found');

  const data = workflowSchema.parse(req.body);
  if (data.status === undefined && data.manager_notes === undefined) {
    throw badRequest('Provide a status or a note to update.');
  }

  db.prepare(`UPDATE inquiries SET
      status = COALESCE(@status, status),
      manager_notes = COALESCE(@manager_notes, manager_notes),
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = @id`)
    .run({
      id: existing.id,
      status: data.status ?? null,
      manager_notes: data.manager_notes ?? null,
    });
  res.json(serializeRow(db.prepare('SELECT * FROM inquiries WHERE id = ?').get(existing.id)));
}
