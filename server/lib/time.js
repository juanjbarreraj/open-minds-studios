// All tutoring dates and times of day in this app are wall-clock values in
// America/New_York. Dates are "YYYY-MM-DD" strings, times "HH:MM" 24h strings.

export const APP_TIME_ZONE = 'America/New_York';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const nowIso = () => new Date().toISOString();

// Today's date in the app time zone, as YYYY-MM-DD (en-CA locale formats that way).
export function todayInAppTz() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

// Current wall-clock time of day in the app time zone, as "HH:MM".
export function nowTimeInAppTz() {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
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

// Weekday name for a YYYY-MM-DD date. Calendar dates map to weekdays
// independently of time zone, so UTC noon is safe here.
export function weekdayName(dateString) {
  const d = new Date(`${dateString}T12:00:00Z`);
  return DAY_NAMES[d.getUTCDay()];
}

export function addDays(dateString, days) {
  const d = new Date(`${dateString}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
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
