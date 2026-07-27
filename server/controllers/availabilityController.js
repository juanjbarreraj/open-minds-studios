import { z } from 'zod';
import db from '../db/database.js';
import { newId } from '../lib/ids.js';
import { serializeRow, serializeRows } from '../lib/serialize.js';
import { isManager } from '../middleware/auth.js';
import { badRequest, notFound, forbidden } from '../middleware/errors.js';

const slotSchema = z.object({
  tutor_id: z.string().min(1).optional(),
  day_of_week: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
  start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:MM'),
  end_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:MM'),
  is_active: z.boolean().optional().default(true),
});

// Managers see every slot; tutors additionally see their own inactive slots;
// everyone else (students booking sessions) sees only active slots.
export function listSlots(req, res) {
  const { tutor_id } = req.query;
  let rows;
  if (isManager(req)) {
    rows = tutor_id
      ? db.prepare('SELECT * FROM availability_slots WHERE tutor_id = ?').all(tutor_id)
      : db.prepare('SELECT * FROM availability_slots').all();
  } else if (req.tutor && (!tutor_id || tutor_id === req.tutor.id)) {
    rows = db.prepare('SELECT * FROM availability_slots WHERE tutor_id = ?').all(req.tutor.id);
  } else {
    rows = tutor_id
      ? db.prepare('SELECT * FROM availability_slots WHERE tutor_id = ? AND is_active = 1').all(tutor_id)
      : db.prepare('SELECT * FROM availability_slots WHERE is_active = 1').all();
  }
  res.json(serializeRows(rows));
}

function assertCanManageSlot(req, tutorId) {
  if (isManager(req)) return;
  if (req.tutor && req.tutor.id === tutorId) {
    if (!req.tutor.approved) throw forbidden('Tutor account is pending approval');
    return;
  }
  throw forbidden('You can only manage your own availability');
}

export function createSlot(req, res) {
  const data = slotSchema.parse(req.body);
  const tutorId = isManager(req) ? (data.tutor_id || req.tutor?.id) : req.tutor?.id;
  if (!tutorId) throw badRequest('A tutor is required for the slot.');
  assertCanManageSlot(req, tutorId);
  if (!db.prepare('SELECT id FROM tutors WHERE id = ?').get(tutorId)) throw notFound('Tutor not found');
  if (data.start_time >= data.end_time) throw badRequest('End time must be after start time.');

  const id = newId();
  db.prepare(`INSERT INTO availability_slots (id, tutor_id, day_of_week, start_time, end_time, is_active)
    VALUES (?, ?, ?, ?, ?, ?)`)
    .run(id, tutorId, data.day_of_week, data.start_time, data.end_time, data.is_active ? 1 : 0);
  res.status(201).json(serializeRow(db.prepare('SELECT * FROM availability_slots WHERE id = ?').get(id)));
}

export function updateSlot(req, res) {
  const existing = db.prepare('SELECT * FROM availability_slots WHERE id = ?').get(req.params.id);
  if (!existing) throw notFound('Slot not found');
  assertCanManageSlot(req, existing.tutor_id);

  const data = slotSchema.partial().parse(req.body);
  const merged = {
    id: existing.id,
    tutor_id: isManager(req) ? (data.tutor_id ?? existing.tutor_id) : existing.tutor_id,
    day_of_week: data.day_of_week ?? existing.day_of_week,
    start_time: data.start_time ?? existing.start_time,
    end_time: data.end_time ?? existing.end_time,
    is_active: (data.is_active ?? Boolean(existing.is_active)) ? 1 : 0,
  };
  if (merged.start_time >= merged.end_time) throw badRequest('End time must be after start time.');

  db.prepare(`UPDATE availability_slots SET tutor_id=@tutor_id, day_of_week=@day_of_week,
      start_time=@start_time, end_time=@end_time, is_active=@is_active,
      updated_at=strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id=@id`)
    .run(merged);
  res.json(serializeRow(db.prepare('SELECT * FROM availability_slots WHERE id = ?').get(req.params.id)));
}

export function deleteSlot(req, res) {
  const existing = db.prepare('SELECT * FROM availability_slots WHERE id = ?').get(req.params.id);
  if (!existing) throw notFound('Slot not found');
  assertCanManageSlot(req, existing.tutor_id);
  db.prepare('DELETE FROM availability_slots WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
}
