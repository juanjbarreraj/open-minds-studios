-- Real, per-student progress records replacing the hardcoded dashboard
-- placeholders. Every row belongs to exactly one student.

CREATE TABLE student_progress_metrics (
  id            TEXT PRIMARY KEY,
  student_id    TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  label         TEXT NOT NULL,
  value         TEXT NOT NULL,
  numeric_value REAL,
  unit          TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_progress_metrics_student ON student_progress_metrics(student_id, display_order);

CREATE TABLE student_focus (
  id               TEXT PRIMARY KEY,
  student_id       TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  active           INTEGER NOT NULL DEFAULT 1,
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_student_focus_student ON student_focus(student_id, active);
