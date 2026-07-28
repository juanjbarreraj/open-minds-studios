import { z } from 'zod';
import db from '../db/database.js';
import { serializeRow, serializeRows } from '../lib/serialize.js';
import { isManager } from '../middleware/auth.js';
import { forbidden, notFound } from '../middleware/errors.js';
import { createBooking, transitionBooking, overrideBookingStatus } from '../services/bookingService.js';
import { notifyBookingEvent } from '../services/notificationService.js';

function tutorFor(booking) {
  return db.prepare('SELECT * FROM tutors WHERE id = ?').get(booking.tutor_id);
}

// Scoped list: students see their own bookings, tutors see bookings assigned
// to them, managers see everything.
export function listBookings(req, res) {
  let rows;
  if (isManager(req)) {
    rows = db.prepare('SELECT * FROM bookings ORDER BY created_at DESC').all();
  } else if (req.tutor) {
    rows = db.prepare('SELECT * FROM bookings WHERE tutor_id = ? ORDER BY created_at DESC').all(req.tutor.id);
  } else if (req.student) {
    rows = db.prepare('SELECT * FROM bookings WHERE student_email = ? COLLATE NOCASE OR student_id = ? ORDER BY created_at DESC')
      .all(req.student.email, req.student.id);
  } else {
    rows = [];
  }
  res.json(serializeRows(rows));
}

// Anonymous busy-slot feed for the scheduling grid. Full booking details are
// included only for the caller's own bookings; other students' bookings are
// reduced to tutor/date/time so the grid can mark them taken without leaking
// personal data.
export function listBusySlots(req, res) {
  const rows = db.prepare(`SELECT * FROM bookings WHERE status IN ('pending', 'confirmed')`).all();
  const own = (b) =>
    (req.student && (b.student_email.toLowerCase() === req.student.email.toLowerCase() || b.student_id === req.student.id)) ||
    (req.tutor && b.tutor_id === req.tutor.id) ||
    isManager(req);
  res.json(rows.map((b) => {
    if (own(b)) return { ...serializeRow(b), is_own: true };
    return {
      id: b.id,
      tutor_id: b.tutor_id,
      session_date: b.session_date,
      preferred_day: b.preferred_day,
      preferred_start_time: b.preferred_start_time,
      preferred_end_time: b.preferred_end_time,
      status: b.status,
      is_own: false,
    };
  }));
}

const createSchema = z.object({
  tutor_id: z.string().min(1),
  session_date: z.string(),
  preferred_start_time: z.string(),
  course_id: z.string().optional().nullable(),
  assignment_description: z.string().max(8000).optional().default(''),
  meeting_type: z.enum(['Online', 'In-Person']).optional().default('Online'),
  student_phone: z.string().trim().max(40).optional().default(''),
});

export function create(req, res) {
  const payload = createSchema.parse(req.body);
  const tutor = db.prepare('SELECT * FROM tutors WHERE id = ? AND approved = 1').get(payload.tutor_id);
  if (!tutor) throw notFound('Tutor not found or not approved');
  if (!req.student) throw forbidden('A student profile is required to book.');

  const booking = createBooking({ tutor, student: req.student, payload });
  notifyBookingEvent('booking.requested', booking, { tutorEmail: tutor.email, tutorName: tutor.full_name });
  res.status(201).json(serializeRow(booking));
}

const statusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'declined', 'cancelled', 'completed']),
});

export function updateStatus(req, res) {
  const { status } = statusSchema.parse(req.body);
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!booking) throw notFound('Booking not found');

  let actor;
  if (isManager(req)) {
    actor = 'manager';
  } else if (req.tutor && booking.tutor_id === req.tutor.id) {
    actor = 'tutor';
  } else if (
    req.student &&
    (booking.student_email.toLowerCase() === req.student.email.toLowerCase() || booking.student_id === req.student.id)
  ) {
    actor = 'student';
  } else {
    throw forbidden('You cannot modify this booking.');
  }

  const updated = transitionBooking({ bookingId: booking.id, actor, nextStatus: status });

  const t = tutorFor(updated);
  const eventByStatus = { confirmed: 'booking.confirmed', declined: 'booking.declined', cancelled: 'booking.cancelled' };
  if (eventByStatus[status]) {
    notifyBookingEvent(eventByStatus[status], updated, { tutorEmail: t?.email, tutorName: t?.full_name });
  }
  res.json(serializeRow(updated));
}

// Manager-only edit of status and/or meeting link (mirrors BookingManager UI).
const managerUpdateSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'declined', 'cancelled', 'completed']).optional(),
  meeting_link: z.string().trim().max(1000).optional(),
});

export function managerUpdate(req, res) {
  const data = managerUpdateSchema.parse(req.body);
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!booking) throw notFound('Booking not found');

  if (data.meeting_link !== undefined) {
    db.prepare(`UPDATE bookings SET meeting_link = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`)
      .run(data.meeting_link, booking.id);
  }

  if (data.status && data.status !== booking.status) {
    // Route through the same state machine as everyone else: it revalidates
    // date, availability, tutor approval, and both tutor and student
    // conflicts whenever a dead booking is brought back to life.
    const updated = transitionBooking({ bookingId: booking.id, actor: 'manager', nextStatus: data.status });
    const t = tutorFor(updated);
    const eventByStatus = { confirmed: 'booking.confirmed', declined: 'booking.declined', cancelled: 'booking.cancelled' };
    if (eventByStatus[data.status]) {
      notifyBookingEvent(eventByStatus[data.status], updated, { tutorEmail: t?.email, tutorName: t?.full_name });
    }
  }

  res.json(serializeRow(db.prepare('SELECT * FROM bookings WHERE id = ?').get(booking.id)));
}

// Explicit, audited escape hatch for the rare case a super admin must force a
// booking into a state the scheduler forbids (for example reopening a session
// marked completed by mistake). Requires a written reason.
const overrideSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'declined', 'cancelled', 'completed']),
  reason: z.string().trim().min(10, 'Explain why this override is needed (at least 10 characters).').max(1000),
});

export function overrideStatus(req, res) {
  const data = overrideSchema.parse(req.body);
  const updated = overrideBookingStatus({
    bookingId: req.params.id,
    nextStatus: data.status,
    actor: req.user,
    reason: data.reason,
  });
  console.warn(
    `[override] ${req.user.email} forced booking ${updated.id} to ${data.status}. Reason: ${data.reason}`
  );
  res.json(serializeRow(updated));
}

export function remove(req, res) {
  const info = db.prepare('DELETE FROM bookings WHERE id = ?').run(req.params.id);
  if (info.changes === 0) throw notFound('Booking not found');
  res.json({ ok: true });
}
