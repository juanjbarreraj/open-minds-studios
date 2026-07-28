export class ApiError extends Error {
  constructor(status, message, extra = undefined) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

export const badRequest = (msg, extra) => new ApiError(400, msg, extra);
export const unauthorized = (msg = 'Authentication required') => new ApiError(401, msg);
export const forbidden = (msg = 'You do not have access to this resource') => new ApiError(403, msg);
export const notFound = (msg = 'Not found') => new ApiError(404, msg);
export const conflict = (msg) => new ApiError(409, msg);

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message, ...(err.extra ? { details: err.extra } : {}) });
  }
  if (err?.name === 'ZodError') {
    return res.status(400).json({ error: 'Invalid request data', details: err.issues });
  }
  if (err?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({ error: 'That record conflicts with an existing one.' });
  }
  // SQLite reports ON DELETE RESTRICT violations as CONSTRAINT_TRIGGER.
  if (err?.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' || err?.code === 'SQLITE_CONSTRAINT_TRIGGER') {
    return res.status(400).json({
      error: 'That request references a record that no longer exists, or one that still has related records.',
    });
  }
  if (err?.code === 'LIMIT_FILE_SIZE' || err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Upload is too large.' });
  }
  // Remaining multer rejections (unexpected field, too many files, ...).
  if (typeof err?.code === 'string' && err.code.startsWith('LIMIT_')) {
    return res.status(400).json({ error: 'That upload could not be accepted. Send a single file in the "file" field.' });
  }
  // Body-parser and other libraries attach their own HTTP status (e.g. a
  // malformed JSON body is a 400, not a server fault).
  const libraryStatus = err?.status || err?.statusCode;
  if (Number.isInteger(libraryStatus) && libraryStatus >= 400 && libraryStatus < 500) {
    return res.status(libraryStatus).json({ error: libraryStatus === 400 ? 'Invalid request body' : err.message });
  }
  console.error('[api] unexpected error:', err);
  return res.status(500).json({ error: 'Internal server error' });
}
