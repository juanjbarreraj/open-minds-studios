-- Appointments now carry the real instant alongside the Eastern Time wall
-- clock. The wall-clock columns stay because that is what the UI displays and
-- what availability windows are defined in; the UTC pair anchors the session
-- to an unambiguous moment across daylight saving transitions.

ALTER TABLE bookings ADD COLUMN starts_at_utc TEXT;
ALTER TABLE bookings ADD COLUMN ends_at_utc TEXT;

CREATE INDEX idx_bookings_starts_at_utc ON bookings(starts_at_utc);
