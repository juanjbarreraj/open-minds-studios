-- Local invitations replace the manual link step without needing an email
-- provider. Only a hash of the token is stored, so the database never holds a
-- credential that could be replayed.

CREATE TABLE invitations (
  id             TEXT PRIMARY KEY,
  token_hash     TEXT NOT NULL UNIQUE,
  intended_role  TEXT NOT NULL CHECK (intended_role IN ('student_parent', 'tutor')),
  profile_type   TEXT NOT NULL CHECK (profile_type IN ('student', 'tutor')),
  profile_id     TEXT NOT NULL,
  email          TEXT COLLATE NOCASE,
  created_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  expires_at     TEXT NOT NULL,
  accepted_at    TEXT,
  accepted_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  revoked_at     TEXT,
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_invitations_profile ON invitations(profile_type, profile_id);
CREATE INDEX idx_invitations_email ON invitations(email);
