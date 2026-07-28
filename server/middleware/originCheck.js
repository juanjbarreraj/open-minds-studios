// Cookie authentication means a browser attaches the session automatically,
// so a state-changing request must prove it came from our own frontend.
// Requests without an Origin header (curl, the API test suite, server-side
// callers) are left alone: browsers always send one for cross-origin writes.
import { allowedOrigins } from '../lib/config.js';
import { forbidden } from './errors.js';

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function verifyOrigin(req, res, next) {
  if (!MUTATING.has(req.method)) return next();

  const origin = req.get('origin');
  if (!origin) return next();

  const allowed = allowedOrigins();
  // Same-origin requests through the Vite proxy carry the dev server origin,
  // which is exactly what CORS_ORIGIN describes.
  if (allowed.includes(origin)) return next();

  return next(forbidden('This request came from an unrecognized origin.'));
}
