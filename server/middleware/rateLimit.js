// Small in-memory rate limiter. Deliberately local: no Redis, no hosted
// service. A multi-process deployment would need a shared store, which is
// noted in LOCAL_DEVELOPMENT.md.
import { rateLimits } from '../lib/config.js';
import { ApiError } from './errors.js';

const buckets = new Map();

function hitCount(key, windowMs) {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || now >= entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return 1;
  }
  entry.count += 1;
  return entry.count;
}

// Keep the map from growing without bound in a long-running process.
function sweep() {
  const now = Date.now();
  for (const [key, entry] of buckets) {
    if (now >= entry.resetAt) buckets.delete(key);
  }
}

export function createRateLimiter(name, { windowMs, max }) {
  return function rateLimiter(req, res, next) {
    if (buckets.size > 5000) sweep();
    const key = `${name}:${req.ip || 'unknown'}`;
    const count = hitCount(key, windowMs);
    if (count > max) {
      const retryAfter = Math.ceil((buckets.get(key).resetAt - Date.now()) / 1000);
      res.setHeader('Retry-After', String(Math.max(retryAfter, 1)));
      return next(new ApiError(429, 'Too many attempts. Please wait a moment and try again.'));
    }
    return next();
  };
}

// Exported for tests that need a clean slate between runs.
export const resetRateLimits = () => buckets.clear();

export const loginLimiter = createRateLimiter('login', rateLimits.login);
export const registerLimiter = createRateLimiter('register', rateLimits.register);
export const inquiryLimiter = createRateLimiter('inquiry', rateLimits.inquiry);
