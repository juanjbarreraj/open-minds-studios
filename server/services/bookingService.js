// All scheduling rules live here, enforced server-side:
//  - every appointment is exactly 60 minutes
//  - a start is valid only if start + 60 min fits inside an active
//    availability window on that weekday, at a 60-minute step from the
//    window start (09:00-17:00 -> last valid start 16:00)
//  - bookings allowed from today through 30 days ahead (America/New_York)
//  - one live (pending/confirmed) booking per tutor/date/start and per
//    student/date/start, enforced by a transaction plus the
//    ux_bookings_live_slot and ux_bookings_student_live_slot unique indexes
//  - a chosen course must actually be taught by the chosen tutor
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

export function endTimeFor(startTime) {
  const endMins = timeToMinutes(startTime) + APPOINTMENT_MINUTES;
  return `${String(Math.floor(endMins / 60)).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`;
}

// A course may only be chosen when the selected tutor actually teaches it.
// A tutor with no assigned courses can still be booked, with course_id null,
// so that scheduling is never blocked by incomplete manager setup.
function assertCourseTaughtByTutor(tutorId, courseId) {
  if (!courseId) return;
  const course = db.prepare('SELECT id FROM courses WHERE id = ?').get(courseId);
  if (!course) throw badRequest('That course does not exist.');
  const assigned = db
    .prepare('SELECT id FROM tutor_courses WHERE tutor_id = ? AND course_id = ?')
    .get(tutorId, courseId);
  if (!assigned) throw badRequest('That tutor does not teach the selected course.');
}

function assertNoTutorConflict({ tutorId, sessionDate, startTime, endTime, excludeBookingId = null }) {
  const clash = db
    .prepare(`SELECT id FROM bookings
      WHERE tutor_id = ? AND session_date = ?
      AND preferred_start_time < ? AND preferred_end_time > ?
      AND status IN ('pending', 'confirmed') AND id IS NOT ?`)
    .get(tutorId, sessionDate, endTime, startTime, excludeBookingId);
  if (clash) throw conflict('That time slot has just been booked by someone else.');
}

// A student cannot be in two places at once, even with two different tutors.
function assertNoStudentConflict({ studentEmail, sessionDate, startTime, endTime, excludeBookingId = null }) {
  const clash = db
    .prepare(`SELECT id FROM bookings
      WHERE student_email = ? COLLATE NOCASE AND session_date = ?
      AND preferred_start_time < ? AND preferred_end_time > ?
      AND status IN ('pending', 'confirmed') AND id IS NOT ?`)
    .get(studentEmail, sessionDate, endTime, startTime, excludeBookingId);
  if (clash) throw conflict('You already have another appointment during that time.');
}

// Every rule a booking must satisfy to be live. Used both when a student
// books and when a manager revives a cancelled or declined appointment, so
// the two paths cannot drift apart.
export function validateBookingIsSchedulable({
  tutorId, studentEmail, sessionDate, startTime, courseId = null, excludeBookingId = null,
}) {
  if (!isValidDateString(sessionDate)) throw badRequest('A valid session date is required.');
  if (!isValidTimeString(startTime)) throw badRequest('A valid start time is required.');

  const tutor = db.prepare('SELECT * FROM tutors WHERE id = ?').get(tutorId);
  if (!tutor) throw notFound('Tutor not found');
  if (!tutor.approved) throw badRequest('That tutor is not currently approved for appointments.');

  const today = todayInAppTz();
  if (sessionDate < today) throw badRequest('Past dates cannot be booked.');
  if (sessionDate === today && startTime <= nowTimeInAppTz()) {
    throw badRequest('That start time has already passed today. Pick a later time.');
  }
  if (sessionDate > addDays(today, MAX_ADVANCE_DAYS)) {
    throw badRequest(`Sessions can be booked at most ${MAX_ADVANCE_DAYS} days in advance.`);
  }

  const dayName = weekdayName(sessionDate);
  const slot = findCoveringSlot(tutorId, dayName, startTime);
  if (!slot) {
    throw badRequest('That time is not within the tutor\'s availability for a full 1-hour session.');
  }

  assertCourseTaughtByTutor(tutorId, courseId);

  const endTime = endTimeFor(startTime);
  assertNoTutorConflict({ tutorId, sessionDate, startTime, endTime, excludeBookingId });
  assertNoStudentConflict({ studentEmail, sessionDate, startTime, endTime, excludeBookingId });

  return { tutor, slot, dayName, endTime };
}

// Map a unique-index violation onto the rule it actually represents.
function translateUniqueViolation(err) {
  const message = String(err?.message || '');
  if (message.includes('ux_bookings_student_live_slot')) {
    return conflict('You already have another appointment during that time.');
  }
  return conflict('That time slot has just been booked by someone else.');
}

export function createBooking({ tutor, student, payload }) {
  const { session_date, preferred_start_time } = payload;

  const insert = db.transaction(() => {
    // Validated inside the transaction so a competing booking committed a
    // moment ago is visible to these checks.
    const { slot, dayName, endTime } = validateBookingIsSchedulable({
      tutorId: tutor.id,
      studentEmail: student.email,
      sessionDate: session_date,
      startTime: preferred_start_time,
      courseId: payload.course_id || null,
    });

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
        preferred_end_time: endTime,
        slot_id: slot.id,
        meeting_type: payload.meeting_type === 'In-Person' ? 'In-Person' : 'Online',
      });
    return id;
  });

  let bookingId;
  try {
    bookingId = insert();
  } catch (err) {
    if (err?.code === 'SQLITE_CONSTRAINT_UNIQUE') throw translateUniqueViolation(err);
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
  // Managers resolve what the student and tutor flows cannot. Reviving a
  // dead booking into a live status is allowed but revalidated against every
  // scheduling rule; a completed session is history and is not revivable
  // without an explicit super admin override.
  manager: {
    pending: ['confirmed', 'declined', 'cancelled', 'completed'],
    confirmed: ['pending', 'declined', 'cancelled', 'completed'],
    declined: ['pending', 'confirmed', 'cancelled'],
    cancelled: ['pending', 'confirmed', 'declined'],
    completed: [],
  },
};

const isRevival = (fromStatus, toStatus) =>
  !LIVE_STATUSES.includes(fromStatus) && LIVE_STATUSES.includes(toStatus);

export function transitionBooking({ bookingId, actor, nextStatus }) {
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
  if (!booking) throw notFound('Booking not found');

  const allowed = TRANSITIONS[actor]?.[booking.status] || [];
  if (!allowed.includes(nextStatus)) {
    if (booking.status === 'completed' && LIVE_STATUSES.includes(nextStatus)) {
      throw badRequest(
        'A completed session cannot be reopened. A super admin can force it through the override endpoint with a reason.'
      );
    }
    throw badRequest(`Cannot change a ${booking.status} booking to ${nextStatus}.`);
  }

  const apply = db.transaction(() => {
    // Bringing a booking back to life means it has to satisfy every rule a
    // new booking would, not just the tutor slot check.
    if (isRevival(booking.status, nextStatus)) {
      validateBookingIsSchedulable({
        tutorId: booking.tutor_id,
        studentEmail: booking.student_email,
        sessionDate: booking.session_date,
        startTime: booking.preferred_start_time,
        courseId: booking.course_id,
        excludeBookingId: booking.id,
      });
    }
    writeStatus(booking, nextStatus);
  });

  try {
    apply();
  } catch (err) {
    if (err?.code === 'SQLITE_CONSTRAINT_UNIQUE') throw translateUniqueViolation(err);
    throw err;
  }
  return db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
}

// Deliberate, audited bypass of the scheduling rules. Reserved for super
// admins; the database uniqueness guards still apply.
export function overrideBookingStatus({ bookingId, nextStatus, actor, reason }) {
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
  if (!booking) throw notFound('Booking not found');
  if (booking.status === nextStatus) throw badRequest(`That booking is already ${nextStatus}.`);

  const apply = db.transaction(() => {
    writeStatus(booking, nextStatus);
    db.prepare(`INSERT INTO admin_overrides
        (id, actor_user_id, actor_email, action, target_type, target_id, reason, details)
        VALUES (?, ?, ?, 'booking.status_override', 'booking', ?, ?, ?)`)
      .run(
        newId(), actor.id, actor.email, booking.id, reason,
        JSON.stringify({ from: booking.status, to: nextStatus, session_date: booking.session_date })
      );
  });

  try {
    apply();
  } catch (err) {
    if (err?.code === 'SQLITE_CONSTRAINT_UNIQUE') throw translateUniqueViolation(err);
    throw err;
  }
  return db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
}

function writeStatus(booking, nextStatus) {
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
      id: booking.id,
      status: nextStatus,
      cancelled_at: stamps.cancelled_at || null,
      declined_at: stamps.declined_at || null,
    });
}
