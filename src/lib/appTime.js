// Tutoring dates and times are always Eastern Time, regardless of where the
// browser is. The server validates in America/New_York, so the UI has to
// decide "today", "past", and the 30-day window the same way or it will offer
// slots the API then rejects.

export const APP_TIME_ZONE = 'America/New_York';
export const APP_TIME_ZONE_LABEL = 'Eastern Time';

// Today in the app time zone as YYYY-MM-DD (en-CA formats that way).
export function todayInAppTz() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

// Current wall-clock time in the app time zone as HH:MM (24h).
export function nowTimeInAppTz() {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
}

// A Date formatted as YYYY-MM-DD using its own local parts. Grid cells are
// built from ymdToDate below, so their local parts are the ET calendar date.
export function toYmd(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Midday local Date for a YYYY-MM-DD string: midday keeps the calendar date
// stable across daylight saving shifts.
export function ymdToDate(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function addDaysToYmd(ymd, days) {
  const d = ymdToDate(ymd);
  d.setDate(d.getDate() + days);
  return toYmd(d);
}

// Monday of the week containing the given YYYY-MM-DD.
export function mondayOfYmd(ymd) {
  const d = ymdToDate(ymd);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return toYmd(d);
}
