-- Deleting a tutor used to cascade away every booking and every graded module
-- attached to them, destroying student history. Rebuild both tables so a tutor
-- who still has records cannot be deleted at all; managers unapprove instead.
-- Nothing references bookings or modules, so a plain rebuild is safe.

CREATE TABLE bookings_new (
  id                     TEXT PRIMARY KEY,
  tutor_id               TEXT NOT NULL REFERENCES tutors(id) ON DELETE RESTRICT,
  student_id             TEXT REFERENCES students(id) ON DELETE SET NULL,
  student_first_name     TEXT NOT NULL DEFAULT '',
  student_last_name      TEXT NOT NULL DEFAULT '',
  student_email          TEXT NOT NULL COLLATE NOCASE,
  student_phone          TEXT NOT NULL DEFAULT '',
  course_id              TEXT REFERENCES courses(id) ON DELETE SET NULL,
  assignment_description TEXT NOT NULL DEFAULT '',
  session_date           TEXT NOT NULL CHECK (session_date GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
  preferred_day          TEXT NOT NULL CHECK (preferred_day IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
  preferred_start_time   TEXT NOT NULL CHECK (preferred_start_time GLOB '[0-2][0-9]:[0-5][0-9]'),
  preferred_end_time     TEXT NOT NULL CHECK (preferred_end_time GLOB '[0-2][0-9]:[0-5][0-9]'),
  slot_id                TEXT REFERENCES availability_slots(id) ON DELETE SET NULL,
  meeting_type           TEXT NOT NULL DEFAULT 'Online' CHECK (meeting_type IN ('Online', 'In-Person')),
  meeting_link           TEXT NOT NULL DEFAULT '',
  status                 TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','declined','cancelled','completed')),
  cancelled_at           TEXT,
  declined_at            TEXT,
  created_at             TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at             TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
INSERT INTO bookings_new SELECT
  id, tutor_id, student_id, student_first_name, student_last_name, student_email,
  student_phone, course_id, assignment_description, session_date, preferred_day,
  preferred_start_time, preferred_end_time, slot_id, meeting_type, meeting_link,
  status, cancelled_at, declined_at, created_at, updated_at
FROM bookings;
DROP TABLE bookings;
ALTER TABLE bookings_new RENAME TO bookings;

CREATE INDEX idx_bookings_tutor ON bookings(tutor_id);
CREATE INDEX idx_bookings_student_email ON bookings(student_email);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date ON bookings(session_date);
CREATE UNIQUE INDEX ux_bookings_live_slot
  ON bookings(tutor_id, session_date, preferred_start_time)
  WHERE status IN ('pending', 'confirmed');

CREATE TABLE modules_new (
  id                      TEXT PRIMARY KEY,
  tutor_id                TEXT NOT NULL REFERENCES tutors(id) ON DELETE RESTRICT,
  student_id              TEXT REFERENCES students(id) ON DELETE SET NULL,
  student_email           TEXT NOT NULL COLLATE NOCASE,
  tutor_name              TEXT NOT NULL DEFAULT '',
  student_name            TEXT NOT NULL DEFAULT '',
  name                    TEXT NOT NULL,
  description             TEXT NOT NULL DEFAULT '',
  file_id                 TEXT REFERENCES files(id) ON DELETE SET NULL,
  file_url                TEXT,
  file_name               TEXT,
  status                  TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned','submitted','graded')),
  submission_file_id      TEXT REFERENCES files(id) ON DELETE SET NULL,
  student_submission_url  TEXT,
  student_submission_name TEXT,
  submitted_at            TEXT,
  grade                   TEXT,
  feedback                TEXT,
  graded_at               TEXT,
  created_at              TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at              TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
INSERT INTO modules_new SELECT
  id, tutor_id, student_id, student_email, tutor_name, student_name, name, description,
  file_id, file_url, file_name, status, submission_file_id, student_submission_url,
  student_submission_name, submitted_at, grade, feedback, graded_at, created_at, updated_at
FROM modules;
DROP TABLE modules;
ALTER TABLE modules_new RENAME TO modules;

CREATE INDEX idx_modules_tutor ON modules(tutor_id);
CREATE INDEX idx_modules_student_email ON modules(student_email);
CREATE INDEX idx_modules_status ON modules(status);

-- Course codes identify a course to managers and students; duplicates make the
-- booking course picker ambiguous.
CREATE UNIQUE INDEX ux_courses_code ON courses(course_code COLLATE NOCASE);
