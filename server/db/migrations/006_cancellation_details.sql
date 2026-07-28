-- Cancellations now record who ended the appointment and why, so a student
-- sees an explanation and managers keep an accountable history.

ALTER TABLE bookings ADD COLUMN cancelled_by TEXT
  CHECK (cancelled_by IN ('student', 'tutor', 'manager', 'super_admin'));
ALTER TABLE bookings ADD COLUMN cancellation_reason TEXT NOT NULL DEFAULT '';

CREATE INDEX idx_bookings_cancelled_by ON bookings(cancelled_by);
