// All scheduling rules live here, enforced server-side:
//  - every appointment is exactly 60 minutes
//  - a start is valid only if start + 60 min fits inside an active
//    availability window on that weekday, at a 60-minute step from the
//    window start (09:00-17:00 -> last valid start 16:00)
//  - bookings allowed from today through 30 days ahead (America/New_York)
//  - one live (pending/confirmed) booking per tutor/date/start, enforced by
//    a transaction plus the ux_bookings_live_slot unique index
import db from '../db/database.js';
import { newId } from '../lib/ids.js';
import {
  todayInAppTz, nowTimeInAppTz, addDays, weekdayName, isValidDateString, isValidTimeString, timeToMinutes,
} from '../lib/time.js';
import { badRequest, conflict, notFound } from '../middleware/errors.js';

export const APPOINTMENT_MINUTES = 60;
export const MAX_ADVANCE_DAYS = 30;
export const LIVE_STATUSES = ['pending', 'confirmed'];

export function findCoveringSlot(tutorId, dayName, startTime) {
  const startMins = timeToMinutes(startTime);
  const slots = db
    .prepare('SELECT * FROM availability_slots WHERE tutor_id = ? AND day_of_week = ? AND is_active = 1')
    .all(tutorId, dayName);
  return (
    slots.find((s) => {
      const windowStart = timeToMinutes(s.start_time);
      const windowEnd = timeToMinutes(s.end_time);
      return (
        startMins >= windowStart &&
        startMins + APPOINTMENT_MINUTES <= windowEnd &&
        (startMins - windowStart) % APPOINTMENT_MINUTES === 0
      );
    }) || null
  );
}

export function createBooking({ tutor, student, payload }) {
  const { session_date, preferred_start_time } = payload;

  if (!isValidDateString(session_date)) throw badRequest('A valid session date is required.');
  if (!isValidTimeString(preferred_start_time)) throw badRequest('A valid start time is required.');

  const today = todayInAppTz();
  if (session_date < today) throw badRequest('Past dates cannot be booked.');
  if (session_date === today && preferred_start_time <= nowTimeInAppTz()) {
    throw badRequest('That start time has already passed today. Pick a later time.');
  }
  if (session_date > addDays(today, MAX_ADVANCE_DAYS)) {
    throw badRequest(`Sessions can be booked at most ${MAX_ADVANCE_DAYS} days in advance.`);
  }

  const dayName = weekdayName(session_date);
  const slot = findCoveringSlot(tutor.id, dayName, preferred_start_time);
  if (!slot) {
    throw badRequest('That time is not within the tutor\'s availability for a full 1-hour session.');
  }

  const startMins = timeToMinutes(preferred_start_time);
  const endMins = startMins + APPOINTMENT_MINUTES;
  const preferred_end_time = `${String(Math.floor(endMins / 60)).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`;

  const insert = db.transaction(() => {
    // Overlap, not just an identical start: availability windows can be
    // defined off the hour, so two sessions could otherwise collide partially.
    const existing = db
      .prepare(`SELECT id FROM bookings
        WHERE tutor_id = ? AND session_date = ?
        AND preferred_start_time < ? AND preferred_end_time > ?
        AND status IN ('pending', 'confirmed')`)
      .get(tutor.id, session_date, preferred_end_time, preferred_start_time);
    if (existing) throw conflict('That time slot has just been booked by someone else.');

    const id = newId();
    db.prepare(`INSERT INTO bookings
      (id, tutor_id, student_id, student_first_name, student_last_name, student_email, student_phone,
       course_id, assignment_description, session_date, preferred_day, preferred_start_time,
       preferred_end_time, slot_id, meeting_type, status)
      VALUES (@id, @tutor_id, @student_id, @student_first_name, @student_last_name, @student_email,
       @student_phone, @course_id, @assignment_description, @session_date, @preferred_day,
       @preferred_start_time, @preferred_end_time, @slot_id, @meeting_type, 'pending')`)
      .run({
        id,
        tutor_id: tutor.id,
        student_id: student.id,
        student_first_name: student.first_name || (student.full_name || '').split(' ')[0] || '',
        student_last_name: student.last_name || (student.full_name || '').split(' ').slice(1).join(' ') || '',
        student_email: student.email,
        student_phone: payload.student_phone || student.phone || '',
        course_id: payload.course_id || null,
        assignment_description: payload.assignment_description || '',
        session_date,
        preferred_day: dayName,
        preferred_start_time,
        preferred_end_time,
        slot_id: slot.id,
        meeting_type: payload.meeting_type === 'In-Person' ? 'In-Person' : 'Online',
      });
    return id;
  });

  let bookingId;
  try {
    bookingId = insert();
  } catch (err) {
    if (err?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw conflict('That time slot has just been booked by someone else.');
    }
    throw err;
  }
  return db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
}

// Allowed transitions per actor role.
const TRANSITIONS = {
  tutor: {
    pending: ['confirmed', 'declined'],
    confirmed: ['completed'],
  },
  student: {
    pending: ['cancelled'],
    confirmed: ['cancelled'],
  },
  // Managers are the escape hatch for every situation the student and tutor
  // flows cannot resolve, so any status is reachable; the caller still runs
  // the double-booking check before reviving a booking into a live status.
  manager: Object.fromEntries(
    ['pending', 'confirmed', 'declined', 'cancelled', 'completed'].map((from) => [
      from,
      ['pending', 'confirmed', 'declined', 'cancelled', 'completed'].filter((to) => to !== from),
    ])
  ),
};

export function transitionBooking({ bookingId, actor, nextStatus }) {
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
  if (!booking) throw notFound('Booking not found');

  const allowed = TRANSITIONS[actor]?.[booking.status] || [];
  if (!allowed.includes(nextStatus)) {
    throw badRequest(`Cannot change a ${booking.status} booking to ${nextStatus}.`);
  }

  // Audit stamps: keep the first one recorded for a given outcome, and record
  // it whichever actor performed the change.
  const stamps = {};
  if (nextStatus === 'cancelled' && !booking.cancelled_at) stamps.cancelled_at = new Date().toISOString();
  if (nextStatus === 'declined' && !booking.declined_at) stamps.declined_at = new Date().toISOString();

  db.prepare(`UPDATE bookings SET status = @status,
      cancelled_at = COALESCE(@cancelled_at, cancelled_at),
      declined_at = COALESCE(@declined_at, declined_at),
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = @id`)
    .run({
      id: bookingId,
      status: nextStatus,
      cancelled_at: stamps.cancelled_at || null,
      declined_at: stamps.declined_at || null,
    });
  return db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
}
