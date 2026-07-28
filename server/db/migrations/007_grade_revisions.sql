-- A grade may be corrected, but the previous value is never lost: the module
-- carries the current grade and this table carries the full history.

CREATE TABLE module_grade_revisions (
  id                TEXT PRIMARY KEY,
  module_id         TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  previous_grade    TEXT,
  new_grade         TEXT NOT NULL,
  previous_feedback TEXT,
  new_feedback      TEXT NOT NULL DEFAULT '',
  correction_reason TEXT NOT NULL,
  changed_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  changed_by_name   TEXT NOT NULL DEFAULT '',
  changed_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_grade_revisions_module ON module_grade_revisions(module_id, changed_at);
