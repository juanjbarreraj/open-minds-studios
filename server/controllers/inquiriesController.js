import { z } from 'zod';
import db from '../db/database.js';
import { newId } from '../lib/ids.js';
import { serializeRow, serializeRows } from '../lib/serialize.js';
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
  res.json(serializeRows(db.prepare('SELECT * FROM inquiries ORDER BY created_at DESC').all()));
}
