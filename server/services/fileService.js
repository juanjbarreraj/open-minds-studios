// Local file storage for development. Files land in server/uploads with
// random names; originals are preserved in the files table. A future
// production adapter (S3 etc.) replaces storeUpload/absolutePathFor without
// touching routes.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import db from '../db/database.js';
import { newId } from '../lib/ids.js';
import { badRequest } from '../middleware/errors.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOADS_DIR =
  process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/zip',
]);

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).slice(0, 12).replace(/[^.\w-]/g, '');
    cb(null, `${crypto.randomBytes(16).toString('hex')}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(badRequest('That file type is not allowed. Upload a document, image, or zip.'));
    }
    return cb(null, true);
  },
});

export function recordUpload(file, userId) {
  const id = newId();
  try {
    db.prepare(`INSERT INTO files (id, stored_name, original_name, mime_type, size_bytes, uploader_user_id)
      VALUES (?, ?, ?, ?, ?, ?)`)
      .run(id, file.filename, path.basename(file.originalname), file.mimetype, file.size, userId);
  } catch (err) {
    // Multer already wrote the blob. If the row cannot be created the blob is
    // unreachable, so remove it instead of leaving litter on disk.
    try {
      fs.rmSync(path.resolve(UPLOADS_DIR, file.filename), { force: true });
    } catch (cleanupErr) {
      console.error('[files] could not remove orphaned blob after a failed insert:', cleanupErr);
    }
    throw err;
  }
  return {
    id,
    file_url: `/api/files/${id}`,
    file_name: path.basename(file.originalname),
  };
}

// Files are uploaded before the module that references them is created, so an
// abandoned form leaves a row nothing points at. A file attached to any module
// is never an orphan and is never returned here.
export function findOrphanFiles({ olderThanHours = 24 } = {}) {
  const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000).toISOString();
  return db
    .prepare(`SELECT * FROM files
      WHERE created_at < ?
      AND id NOT IN (SELECT file_id FROM modules WHERE file_id IS NOT NULL)
      AND id NOT IN (SELECT submission_file_id FROM modules WHERE submission_file_id IS NOT NULL)`)
    .all(cutoff);
}

// Removes those orphans, never touching a file any module still uses.
export function removeOrphanFiles({ olderThanHours = 24 } = {}) {
  const orphans = findOrphanFiles({ olderThanHours });

  let blobsRemoved = 0;
  for (const row of orphans) {
    try {
      const abs = path.resolve(UPLOADS_DIR, row.stored_name);
      if (abs.startsWith(path.resolve(UPLOADS_DIR) + path.sep) && fs.existsSync(abs)) {
        fs.rmSync(abs, { force: true });
        blobsRemoved += 1;
      }
    } catch (err) {
      console.error(`[files] could not remove ${row.stored_name}:`, err);
    }
    db.prepare('DELETE FROM files WHERE id = ?').run(row.id);
  }
  return { recordsRemoved: orphans.length, blobsRemoved };
}

// stored_name is generated server-side (hex + short extension), but resolve
// defensively anyway so a tampered DB row cannot escape the uploads dir.
export function absolutePathFor(fileRow) {
  const abs = path.resolve(UPLOADS_DIR, fileRow.stored_name);
  if (!abs.startsWith(path.resolve(UPLOADS_DIR) + path.sep)) {
    throw badRequest('Invalid file path');
  }
  return abs;
}

// A user may download a file if they uploaded it, they are a manager, or the
// file is attached to a module they are part of (as tutor or student).
export function canAccessFile(fileId, { user, student, tutor, manager }) {
  if (manager) return true;
  const fileRow = db.prepare('SELECT * FROM files WHERE id = ?').get(fileId);
  if (!fileRow) return false;
  if (fileRow.uploader_user_id === user.id) return true;

  // A file can be attached to several modules (one worksheet assigned to a
  // whole roster), so every module it belongs to has to be considered.
  const mods = db
    .prepare('SELECT * FROM modules WHERE file_id = ? OR submission_file_id = ?')
    .all(fileId, fileId);
  return mods.some((mod) => {
    if (tutor && mod.tutor_id === tutor.id) return true;
    if (student && (mod.student_id === student.id || mod.student_email.toLowerCase() === student.email.toLowerCase())) {
      return true;
    }
    return false;
  });
}
