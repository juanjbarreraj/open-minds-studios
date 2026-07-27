// Single HTTP client for the app's own backend. All data access goes through
// here; components never talk to the database or third-party SDKs directly.
// The base URL defaults to /api (Vite dev proxy); set VITE_API_BASE_URL for a
// hosted backend later.

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(method, path, body, options = {}) {
  const init = {
    method,
    credentials: 'include',
    headers: {},
    ...options,
  };
  if (body instanceof FormData) {
    init.body = body;
  } else if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${path}`, init);
  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    throw new ApiError(res.status, data?.error || `Request failed (${res.status})`, data?.details);
  }
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  patch: (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),
};

// Resolve an API-relative file URL (e.g. /api/files/abc) against the
// configured base so it also works when the backend is hosted elsewhere.
export function fileUrl(url) {
  if (!url) return url;
  if (/^https?:\/\//.test(url)) return url;
  if (url.startsWith('/api/')) return `${BASE_URL}${url.slice(4)}`;
  return url;
}
