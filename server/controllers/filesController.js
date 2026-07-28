import fs from 'node:fs';
import db from '../db/database.js';
import { isManager } from '../middleware/auth.js';
import { badRequest, forbidden, notFound } from '../middleware/errors.js';
import { z } from 'zod';
import { recordUpload, canAccessFile, absolutePathFor, removeOrphanFiles } from '../services/fileService.js';

export function uploadFile(req, res) {
  if (!req.file) throw badRequest('No file was uploaded.');
  res.status(201).json(recordUpload(req.file, req.user.id));
}

// Maintenance utility: drop upload records and blobs that no module
// references. Files attached to a module are never touched.
export function cleanupOrphans(req, res) {
  const { older_than_hours } = z
    .object({ older_than_hours: z.number().int().min(0).max(24 * 365).optional() })
    .parse(req.body ?? {});
  const result = removeOrphanFiles(
    older_than_hours === undefined ? {} : { olderThanHours: older_than_hours }
  );
  console.log(`[files] orphan cleanup by ${req.user.email}: ${result.recordsRemoved} record(s), ${result.blobsRemoved} blob(s)`);
  res.json({ ok: true, ...result });
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
