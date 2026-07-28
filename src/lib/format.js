// Shared display formatting. Times and dates are Eastern Time business
// values; these helpers keep every screen showing them the same friendly way
// instead of leaking raw 24-hour strings into the interface.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "14:00" -> "2:00 PM" */
export function formatTime(time) {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h)) return time;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m || 0).padStart(2, '0')} ${period}`;
}

/** "14:00", "15:00" -> "2:00 PM to 3:00 PM" */
export function formatTimeRange(start, end) {
  if (!start) return 'Time to be confirmed';
  return end ? `${formatTime(start)} to ${formatTime(end)}` : formatTime(start);
}

/** "2026-08-03" -> "Mon, Aug 3" */
export function formatSessionDate(dateString) {
  if (!dateString) return '';
  const [y, mo, d] = dateString.split('-').map(Number);
  if (!y || !mo || !d) return dateString;
  const dt = new Date(y, mo - 1, d, 12);
  const weekday = dt.toLocaleDateString('en-US', { weekday: 'short' });
  return `${weekday}, ${MONTHS[mo - 1]} ${d}`;
}

/**
 * The full line a session card shows, for example
 * "Mon, Aug 3 · 2:00 PM to 3:00 PM". Falls back to the weekday name for
 * older records saved before a real calendar date was stored.
 */
export function formatSessionWhen(booking) {
  const when = formatTimeRange(booking?.preferred_start_time, booking?.preferred_end_time);
  const day = booking?.session_date
    ? formatSessionDate(booking.session_date)
    : booking?.preferred_day || '';
  return day ? `${day} · ${when}` : when;
}

/** ISO timestamp -> "Aug 3, 2026" */
export function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** ISO timestamp -> "Aug 3, 2026 at 2:14 PM" */
export function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
}
