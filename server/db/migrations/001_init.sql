-- Core schema for the local Open Minds Studios backend.
-- Times of day are stored as 24h "HH:MM" strings and dates as "YYYY-MM-DD",
-- both interpreted in America/New_York (matches how the UI has always
-- displayed them). Timestamps (created_at etc.) are UTC ISO 8601.

CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL DEFAULT '',
  role          TEXT NOT NULL CHECK (role IN ('student_parent', 'tutor', 'manager', 'admin')),
  approved      INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE sessions (
  id         TEXT PRIMARY KEY,            -- sha256 hash of the cookie token
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_sessions_user ON sessions(user_id);

CREATE TABLE students (
  id                        TEXT PRIMARY KEY,
  user_id                   TEXT REFERENCES users(id) ON DELETE SET NULL,
  first_name                TEXT NOT NULL DEFAULT '',
  last_name                 TEXT NOT NULL DEFAULT '',
  full_name                 TEXT NOT NULL DEFAULT '',
  email                     TEXT NOT NULL UNIQUE COLLATE NOCASE,
  phone                     TEXT NOT NULL DEFAULT '',
  approved                  INTEGER NOT NULL DEFAULT 0,
  can_access_student_portal INTEGER NOT NULL DEFAULT 0,
  auth_provider             TEXT NOT NULL DEFAULT 'email' CHECK (auth_provider IN ('google', 'email')),
  notes                     TEXT NOT NULL DEFAULT '',
  created_at                TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at                TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_students_user ON students(user_id);

CREATE TABLE tutors (
  id                          TEXT PRIMARY KEY,
  user_id                     TEXT REFERENCES users(id) ON DELETE SET NULL,
  full_name                   TEXT NOT NULL,
  email                       TEXT NOT NULL UNIQUE COLLATE NOCASE,
  phone                       TEXT NOT NULL DEFAULT '',
  auth_provider               TEXT NOT NULL DEFAULT 'email' CHECK (auth_provider IN ('google', 'email')),
  approved                    INTEGER NOT NULL DEFAULT 0,
  bio                         TEXT NOT NULL DEFAULT '',
  can_access_manager_dashboard INTEGER NOT NULL DEFAULT 0,
  is_super_admin              INTEGER NOT NULL DEFAULT 0,
  created_at                  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at                  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_tutors_user ON tutors(user_id);

CREATE TABLE courses (
  id          TEXT PRIMARY KEY,
  course_code TEXT NOT NULL,
  course_name TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE tutor_courses (
  id         TEXT PRIMARY KEY,
  tutor_id   TEXT NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  course_id  TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (tutor_id, course_id)
);
CREATE INDEX idx_tutor_courses_tutor ON tutor_courses(tutor_id);
CREATE INDEX idx_tutor_courses_course ON tutor_courses(course_id);

CREATE TABLE availability_slots (
  id          TEXT PRIMARY KEY,
  tutor_id    TEXT NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
  start_time  TEXT NOT NULL CHECK (start_time GLOB '[0-2][0-9]:[0-5][0-9]'),
  end_time    TEXT NOT NULL CHECK (end_time GLOB '[0-2][0-9]:[0-5][0-9]'),
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (start_time < end_time)
);
CREATE INDEX idx_availability_tutor ON availability_slots(tutor_id);

CREATE TABLE bookings (
  id                     TEXT PRIMARY KEY,
  tutor_id               TEXT NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  student_id             TEXT REFERENCES students(id) ON DELETE SET NULL,
  student_first_name     TEXT NOT NULL DEFAULT '',
  student_last_name      TEXT NOT NULL DEFAULT '',
  student_email          TEXT NOT NULL COLLATE NOCASE,
  student_phone          TEXT NOT NULL DEFAULT '',
  course_id              TEXT REFERENCES courses(id) ON DELETE SET NULL,
  assignment_description TEXT NOT NULL DEFAULT '',
  -- session_date fixes a defect in the Base44 version, which stored only the
  -- weekday name and therefore could not distinguish one Monday from another.
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
CREATE INDEX idx_bookings_tutor ON bookings(tutor_id);
CREATE INDEX idx_bookings_student_email ON bookings(student_email);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date ON bookings(session_date);
-- Hard double-booking guard: at most one live booking per tutor/date/start.
-- Declined and cancelled bookings fall out of the index so the slot frees up.
CREATE UNIQUE INDEX ux_bookings_live_slot
  ON bookings(tutor_id, session_date, preferred_start_time)
  WHERE status IN ('pending', 'confirmed');

CREATE TABLE files (
  id             TEXT PRIMARY KEY,
  stored_name    TEXT NOT NULL UNIQUE,
  original_name  TEXT NOT NULL,
  mime_type      TEXT NOT NULL,
  size_bytes     INTEGER NOT NULL,
  uploader_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE modules (
  id                      TEXT PRIMARY KEY,
  tutor_id                TEXT NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
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
CREATE INDEX idx_modules_tutor ON modules(tutor_id);
CREATE INDEX idx_modules_student_email ON modules(student_email);
CREATE INDEX idx_modules_status ON modules(status);

CREATE TABLE inquiries (
  id                 TEXT PRIMARY KEY,
  parent_name        TEXT NOT NULL,
  email              TEXT NOT NULL,
  student_grade      TEXT NOT NULL DEFAULT '',
  subject_or_exam    TEXT NOT NULL DEFAULT '',
  goals              TEXT NOT NULL DEFAULT '',
  message            TEXT NOT NULL DEFAULT '',
  interested_program TEXT NOT NULL DEFAULT '',
  created_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Local substitute for a real email provider: every notification the app
-- would send is recorded here and previewed in the server terminal.
CREATE TABLE notification_outbox (
  id           TEXT PRIMARY KEY,
  channel      TEXT NOT NULL DEFAULT 'email',
  recipient    TEXT NOT NULL,
  subject      TEXT NOT NULL,
  body         TEXT NOT NULL,
  event_type   TEXT NOT NULL,
  related_type TEXT,
  related_id   TEXT,
  status       TEXT NOT NULL DEFAULT 'logged' CHECK (status IN ('logged','sent','failed')),
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_outbox_created ON notification_outbox(created_at);
