-- Integrity guards that belong in the database rather than only in controllers.

-- A student must not hold two live appointments at the same moment. Exact
-- duplicate starts are caught here; partial overlaps are rejected by
-- bookingService inside the same transaction that inserts the booking.
CREATE UNIQUE INDEX ux_bookings_student_live_slot
  ON bookings(student_email, session_date, preferred_start_time)
  WHERE status IN ('pending', 'confirmed');

-- Booking lookups by student now happen per date as well as per email.
CREATE INDEX idx_bookings_student_date ON bookings(student_email, session_date);

-- One portal account owns at most one student profile and at most one tutor
-- profile. Partial indexes so the many unlinked profiles stay allowed.
CREATE UNIQUE INDEX ux_students_user ON students(user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX ux_tutors_user ON tutors(user_id) WHERE user_id IS NOT NULL;

-- Audit trail for administrative overrides (currently: super-admin booking
-- revival that bypasses the normal scheduling rules).
CREATE TABLE admin_overrides (
  id             TEXT PRIMARY KEY,
  actor_user_id  TEXT REFERENCES users(id) ON DELETE SET NULL,
  actor_email    TEXT NOT NULL,
  action         TEXT NOT NULL,
  target_type    TEXT NOT NULL,
  target_id      TEXT NOT NULL,
  reason         TEXT NOT NULL,
  details        TEXT,
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_admin_overrides_target ON admin_overrides(target_type, target_id);
CREATE INDEX idx_admin_overrides_created ON admin_overrides(created_at);
