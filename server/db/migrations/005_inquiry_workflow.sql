-- Managers work inquiries through a simple local pipeline. Existing rows keep
-- their data and start at 'new'.

ALTER TABLE inquiries ADD COLUMN status TEXT NOT NULL DEFAULT 'new'
  CHECK (status IN ('new', 'contacted', 'closed'));
ALTER TABLE inquiries ADD COLUMN manager_notes TEXT NOT NULL DEFAULT '';
ALTER TABLE inquiries ADD COLUMN updated_at TEXT;

CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_inquiries_created ON inquiries(created_at);
