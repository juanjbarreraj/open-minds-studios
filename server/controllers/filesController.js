import db from '../db/database.js';
import { isManager } from '../middleware/auth.js';
import { badRequest, forbidden, notFound } from '../middleware/errors.js';
import { recordUpload, canAccessFile, absolutePathFor } from '../services/fileService.js';

export function uploadFile(req, res) {
  if (!req.file) throw badRequest('No file was uploaded.');
  res.status(201).json(recordUpload(req.file, req.user.id));
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
  res.download(absolutePathFor(fileRow), fileRow.original_name);
}
