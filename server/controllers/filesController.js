import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import db from '../db/database.js';
import { isManager } from '../middleware/auth.js';
import { badRequest, forbidden, notFound } from '../middleware/errors.js';
import { z } from 'zod';
import { recordUpload, canAccessFile, absolutePathFor, removeOrphanFiles, findOrphanFiles } from '../services/fileService.js';

export function uploadFile(req, res) {
  if (!req.file) throw badRequest('No file was uploaded.');
  res.status(201).json(recordUpload(req.file, req.user.id));
}

// What a cleanup would remove, so a super admin can look before deleting.
export function previewOrphans(req, res) {
  const hours = Number(req.query.older_than_hours);
  const orphans = findOrphanFiles(Number.isFinite(hours) && hours >= 0 ? { olderThanHours: hours } : {});
  res.json({
    count: orphans.length,
    total_bytes: orphans.reduce((sum, f) => sum + (f.size_bytes || 0), 0),
    files: orphans.map((f) => ({
      id: f.id,
      original_name: f.original_name,
      mime_type: f.mime_type,
      size_bytes: f.size_bytes,
      created_at: f.created_at,
    })),
  });
}

// Maintenance utility: drop upload records and blobs that no module
// references. Files attached to a module are never touched.
export function cleanupOrphans(req, res) {
  const { older_than_hours } = z
    .object({ older_than_hours: z.number().int().min(0).max(24 * 365).optional() })
    .parse(req.body ?? {});
  const options = older_than_hours === undefined ? {} : { olderThanHours: older_than_hours };
  const targets = findOrphanFiles(options);
  const totalBytes = targets.reduce((sum, f) => sum + (f.size_bytes || 0), 0);
  const result = removeOrphanFiles(options);

  // Who ran the cleanup, when, and what it covered.
  db.prepare(`INSERT INTO admin_overrides
      (id, actor_user_id, actor_email, action, target_type, target_id, reason, details)
      VALUES (?, ?, ?, 'files.orphan_cleanup', 'files', 'orphan-sweep', ?, ?)`)
    .run(
      randomUUID(), req.user.id, req.user.email,
      'Routine cleanup of uploads that no module references',
      JSON.stringify({ ...result, totalBytes, olderThanHours: older_than_hours ?? 24 })
    );

  console.log(`[files] orphan cleanup by ${req.user.email}: ${result.recordsRemoved} record(s), ${result.blobsRemoved} blob(s)`);
  res.json({ ok: true, ...result, total_bytes: totalBytes });
}

export function downloadFile(req, res) {
  const fileRow = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.id);
  if (!fileRow) throw notFound('File not found');
  if (!canAccessFile(fileRow.id, {
    user: req.user,
    student: req.student,
    tutor: req.tutor,
    manager: isManager(req),
  })) {
    throw forbidden('You do not have access to this file.');
  }
  const absolutePath = absolutePathFor(fileRow);
  if (!fs.existsSync(absolutePath)) {
    // The row survived but the blob is gone (a wiped uploads directory, or a
    // database restored without its files).
    throw notFound('That file is no longer stored on this server.');
  }
  res.download(absolutePath, fileRow.original_name);
}
