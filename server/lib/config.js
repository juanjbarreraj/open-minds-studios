// Central runtime configuration. Local defaults are the ones that work
// through the Vite proxy; every production-shaped value is an environment
// variable so nothing has to change in code when the backend moves to its own
// domain.

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Values that must never be used to sign real sessions.
const PLACEHOLDER_SECRETS = new Set([
  'local-dev-only-secret',
  'change-me-for-anything-beyond-local-dev',
  '',
]);

export function resolveSessionSecret() {
  const provided = process.env.SESSION_SECRET;
  if (IS_PRODUCTION) {
    if (!provided || PLACEHOLDER_SECRETS.has(provided.trim())) {
      throw new Error(
        'SESSION_SECRET must be set to a strong unique value when NODE_ENV=production. Refusing to start with the development placeholder.'
      );
    }
    return provided;
  }
  if (!provided) {
    console.warn('[server] SESSION_SECRET not set; using a development-only default. Set it in .env for anything beyond local dev.');
    return 'local-dev-only-secret';
  }
  return provided;
}

// Origins allowed to make credentialed browser requests. Local development
// serves the app through the Vite proxy, so this is the dev server origin.
export function allowedOrigins() {
  const raw = process.env.CORS_ORIGIN || 'http://localhost:5173';
  return raw.split(',').map((o) => o.trim()).filter(Boolean);
}

// A GitHub Pages frontend talking to a backend on another domain is a
// cross-site request, which requires SameSite=None and Secure=true; both are
// environment-driven so local HTTP keeps working unchanged.
export function cookieOptions() {
  const sameSite = (process.env.COOKIE_SAME_SITE || 'lax').toLowerCase();
  const secure = process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE === 'true'
    : IS_PRODUCTION;
  return {
    httpOnly: true,
    signed: true,
    sameSite,
    secure,
    path: '/',
    ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
  };
}

// Clearing a cookie only works when the attributes match the ones it was set
// with, so both come from the same place.
export function clearCookieOptions() {
  const { maxAge, ...rest } = cookieOptions();
  void maxAge;
  return rest;
}

const intFromEnv = (name, fallback) => {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw > 0 ? raw : fallback;
};

export const rateLimits = {
  login: {
    windowMs: intFromEnv('RATE_LIMIT_LOGIN_WINDOW_MS', 15 * 60 * 1000),
    max: intFromEnv('RATE_LIMIT_LOGIN_MAX', IS_PRODUCTION ? 10 : 50),
  },
  register: {
    windowMs: intFromEnv('RATE_LIMIT_REGISTER_WINDOW_MS', 60 * 60 * 1000),
    max: intFromEnv('RATE_LIMIT_REGISTER_MAX', IS_PRODUCTION ? 5 : 50),
  },
  inquiry: {
    windowMs: intFromEnv('RATE_LIMIT_INQUIRY_WINDOW_MS', 60 * 60 * 1000),
    max: intFromEnv('RATE_LIMIT_INQUIRY_MAX', IS_PRODUCTION ? 10 : 100),
  },
};
