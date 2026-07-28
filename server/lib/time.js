// All tutoring dates and times of day in this app are wall-clock values in
// America/New_York. Dates are "YYYY-MM-DD" strings, times "HH:MM" 24h strings.
// Appointment instants are additionally stored in UTC (bookings.starts_at_utc
// / ends_at_utc) so a session is anchored to a real moment even across a
// daylight saving transition.
//
// Zone conversion uses Luxon rather than manual arithmetic, because two hours
// a year do not behave the way naive date math assumes: on the spring-forward
// Sunday some wall-clock times do not exist, and on the fall-back Sunday some
// occur twice.
import { DateTime } from 'luxon';

export const APP_TIME_ZONE = 'America/New_York';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const nowIso = () => new Date().toISOString();

// Today's date in the app time zone, as YYYY-MM-DD.
export function todayInAppTz() {
  return DateTime.now().setZone(APP_TIME_ZONE).toFormat('yyyy-MM-dd');
}

// Current wall-clock time of day in the app time zone, as "HH:MM".
export function nowTimeInAppTz() {
  return DateTime.now().setZone(APP_TIME_ZONE).toFormat('HH:mm');
}

// Strict calendar validation. Date.parse alone is not enough: it happily
// normalizes 2026-02-31 into March, so an impossible date would be accepted
// and then silently mean a different day.
export function isValidDateString(s) {
  if (typeof s !== 'string') return false;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (month < 1 || month > 12) return false;
  if (day < 1) return false;
  return day <= daysInMonth(year, month);
}

export function daysInMonth(year, month) {
  const lengths = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return lengths[month - 1];
}

export const isLeapYear = (year) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

export const isValidTimeString = (s) =>
  typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);

// Weekday name for a YYYY-MM-DD date. A calendar date maps to a weekday
// independently of any clock shift within that day.
export function weekdayName(dateString) {
  const dt = DateTime.fromISO(dateString, { zone: APP_TIME_ZONE });
  return DAY_NAMES[dt.weekday % 7];
}

export function addDays(dateString, days) {
  return DateTime.fromISO(dateString, { zone: APP_TIME_ZONE })
    .plus({ days })
    .toFormat('yyyy-MM-dd');
}

export const timeToMinutes = (time) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

export const minutesToTime = (mins) =>
  `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

// Next date (>= from) that falls on the given weekday name.
export function nextDateForWeekday(fromDateString, dayName) {
  let d = fromDateString;
  for (let i = 0; i < 7; i += 1) {
    if (weekdayName(d) === dayName) return d;
    d = addDays(d, 1);
  }
  return d;
}

export const DST_NONEXISTENT = 'nonexistent';
export const DST_AMBIGUOUS = 'ambiguous';

// Resolve an Eastern Time wall clock (date + HH:MM) to a real instant,
// reporting the two daylight saving edge cases instead of guessing.
//
//  - nonexistent: the clock jumps 02:00 to 03:00 each spring, so a time in
//    that gap never happens. Luxon shifts it forward silently; we detect the
//    shift and refuse.
//  - ambiguous: the clock repeats 01:00 to 02:00 each autumn, so that wall
//    time happens twice. We resolve it deterministically to the first
//    occurrence (still daylight time) and report the ambiguity so callers can
//    decide whether to accept it.
export function resolveAppZoneInstant(dateString, timeString) {
  if (!isValidDateString(dateString) || !isValidTimeString(timeString)) {
    return { ok: false, problem: 'invalid' };
  }
  const [hour, minute] = timeString.split(':').map(Number);
  const dt = DateTime.fromObject(
    { year: Number(dateString.slice(0, 4)), month: Number(dateString.slice(5, 7)), day: Number(dateString.slice(8, 10)), hour, minute },
    { zone: APP_TIME_ZONE }
  );

  if (!dt.isValid) return { ok: false, problem: 'invalid' };

  // Luxon moves a nonexistent local time forward past the gap.
  if (dt.hour !== hour || dt.minute !== minute) {
    return { ok: false, problem: DST_NONEXISTENT, dateTime: dt };
  }

  // An hour that repeats reads the same on the clock an hour later.
  const anHourLater = dt.plus({ hours: 1 });
  const ambiguous = anHourLater.hour === dt.hour && anHourLater.offset !== dt.offset;

  return {
    ok: true,
    ambiguous,
    // First occurrence is what Luxon returns, which is the deterministic
    // choice this application makes for a repeated hour.
    dateTime: dt,
    utc: dt.toUTC().toISO(),
    offsetMinutes: dt.offset,
  };
}

// UTC instant for a session start plus its exact duration in real minutes.
// Adding minutes to the instant (not to the wall clock) keeps a 60-minute
// appointment 60 real minutes long even across a transition.
export function appointmentInstants(dateString, startTime, durationMinutes) {
  const start = resolveAppZoneInstant(dateString, startTime);
  if (!start.ok) return start;
  const end = start.dateTime.plus({ minutes: durationMinutes });
  return {
    ok: true,
    ambiguous: start.ambiguous,
    startsAtUtc: start.dateTime.toUTC().toISO(),
    endsAtUtc: end.toUTC().toISO(),
    // The wall-clock end can read as less than start + duration on a
    // transition day; that is expected and is why the UTC pair is stored.
    endWallClock: end.setZone(APP_TIME_ZONE).toFormat('HH:mm'),
    realMinutes: end.diff(start.dateTime, 'minutes').minutes,
  };
}

// Format a stored UTC instant for display in Eastern Time.
export function formatInAppZone(utcIso, format = "yyyy-MM-dd HH:mm") {
  return DateTime.fromISO(utcIso, { zone: 'utc' }).setZone(APP_TIME_ZONE).toFormat(format);
}
