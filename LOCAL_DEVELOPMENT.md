# Local development guide

Open Minds Studios runs entirely on your machine: a React/Vite frontend and a
Node/Express API backed by SQLite. Nothing calls a hosted service.

## 1. Requirements

- Node.js 20 or newer (developed and verified on Node 26)
- npm 10 or newer

No database server to install. SQLite lives in a single file inside the repo
(ignored by git).

## 2. Installation

```bash
npm install
```

`better-sqlite3` compiles a native binding during install. If your npm setup
blocks install scripts, allow it with `npm approve-scripts better-sqlite3` and
reinstall.

## 3. Environment setup

Environment configuration is optional for local work; every value has a working
default. To customize, copy the template:

```bash
cp .env.example .env
```

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3001` | Express API port (the Vite proxy targets it) |
| `SESSION_SECRET` | development-only fallback | Signs session cookies. Set a strong random value anywhere other than your own machine. |
| `DATABASE_PATH` | `server/db/data/openminds.db` | SQLite file location |
| `UPLOADS_DIR` | `server/uploads` | Where uploaded files are stored |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed browser origin |
| `VITE_API_BASE_URL` | `/api` | Frontend API base. Leave unset locally; set a full URL when the backend is hosted separately. |

`.env` is git-ignored. No secret belongs in a `VITE_`-prefixed variable, because
Vite inlines those into the browser bundle.

## 4. Database setup

```bash
npm run db:migrate   # apply schema migrations
npm run db:seed      # wipe application data and load demo records
npm run db:reset     # delete the database file, then migrate and seed
```

`npm run db:seed` is destructive: it clears every application table before
inserting demo data. Migrations are plain SQL files in
`server/db/migrations/`, applied in filename order and tracked in a
`schema_migrations` table, so re-running is safe.

Tables: `users`, `sessions`, `students`, `tutors`, `courses`, `tutor_courses`,
`availability_slots`, `bookings`, `files`, `modules`, `inquiries`,
`notification_outbox`.

## 5. Demo accounts (local only)

> These are LOCAL DEMONSTRATION ACCOUNTS created by the seed script. The
> passwords are public knowledge in this repository. Never create them in a
> production environment, and never reuse these passwords anywhere real.

| Email | Password | Role | State |
|---|---|---|---|
| `student@demo.local` | `student123` | Student / parent | Approved, portal access on |
| `tutor@demo.local` | `tutor123` | Tutor | Approved |
| `manager@demo.local` | `manager123` | Manager | Approved, manager dashboard + super admin |
| `pending@demo.local` | `pending123` | Student / parent | Not approved, for access-control testing |

The seed also creates three courses, four availability windows (including a
Monday 9:00 to 17:00 window used by the scheduling tests), two bookings for the
demo student, one assigned module, and one sample inquiry.

## 6. Running the app

```bash
npm run dev
```

That starts both processes:

- Express API on http://localhost:3001
- Vite dev server on http://localhost:5173

Open http://localhost:5173. The frontend calls `/api/...`, which the Vite dev
server proxies to Express, so the browser sees one origin and session cookies
work without any CORS or localhost URLs in the code.

Run them separately when useful:

```bash
npm run dev:server   # API only
npm run dev:client   # frontend only
```

## 7. Resetting local data

```bash
npm run db:reset
```

Deletes the SQLite file (and its WAL/SHM siblings), re-applies migrations, and
re-seeds. Uploaded files are not removed by this command; clear them with
`rm -rf server/uploads/*` if you want a completely clean slate.

## 8. Testing roles

```bash
npm run test:api
```

Runs 69 automated backend checks against a temporary database in your system
temp directory, covering login, role enforcement, per-role data scoping,
scheduling rules, double booking, the booking lifecycle, module workflow, upload
permissions, inquiries, and the notification outbox. It leaves your development
database untouched.

Manual role walkthrough:

1. Sign in as `student@demo.local`. The student dashboard shows sessions and
   modules; the scheduling page books a 1-hour slot inside a tutor's window.
2. Sign in as `tutor@demo.local`. Accept or decline pending requests, manage
   availability, assign a module, and grade a submission.
3. Sign in as `manager@demo.local`. Manage students, tutors, courses,
   tutor-course assignments, availability, and bookings; approve portal access.
4. Sign in as `pending@demo.local`. You reach the pending-approval screen, and
   the API rejects protected calls with 403 even if the UI is bypassed.

Authorization is enforced by the backend, not the browser. Every scoped
endpoint filters by the session identity, so a student cannot read another
student's records by editing frontend code.

## 9. Local uploads

- Tutors attach a file when assigning a module; students upload submissions.
- Files are written to `server/uploads/` with random names; the original
  filename, MIME type, size, and uploader are recorded in the `files` table.
- Downloads go through `GET /api/files/:id`, which requires a session and
  checks that the caller is the uploader, a participant in the related module,
  or a manager.
- Allowed types: PDF, Word, Excel, PowerPoint, text, CSV, PNG, JPEG, GIF, WebP,
  and zip. Size limit is 15 MB.
- `server/uploads/` is git-ignored, so user files never enter version control.

## 10. Notifications

No email is sent. Every message the app would send (new inquiry, booking
requested, confirmed, declined, cancelled) is written to the
`notification_outbox` table and printed in the API terminal with a clear
"not actually sent" marker. `server/services/notificationService.js` is the
seam where a real provider gets implemented later.

## 11. Known limitations

- **No email delivery.** Notifications only reach the outbox table and the
  terminal.
- **No Google Sheets sync.** `server/services/inquiryIntegrationService.js`
  logs the exact payload it would send and is the single place to implement it.
- **No payments.** Stripe packages remain in `package.json` from the original
  scaffold but nothing in the app calls them.
- **No password reset or email verification.** Managers create and approve
  accounts; there is no self-service recovery flow yet.
- **Sessions are database-backed cookies** with a 7-day lifetime and no refresh
  or revocation UI beyond signing out.
- **Single-process SQLite.** Fine for development; a hosted deployment should
  move to a managed database.
- **Google sign-in is gone.** The old hosted login offered it; local auth is
  email and password only. The `auth_provider` column is preserved for when a
  provider is added back.
- **Rate limiting and CAPTCHA are absent** on the public inquiry endpoint.
- **Tutors are matched to user accounts by email** when no `user_id` link
  exists, preserving the previous behavior; new accounts link by ID.
- Pre-existing `npm run typecheck` errors remain in a few JSX files (implicit
  prop types under `checkJs`). They are unrelated to data access and predate
  this migration. `npm run lint` is clean.

## 12. Future production migration

The intended production shape:

- **Frontend on static hosting (for example GitHub Pages):** build with
  `npm run build` and deploy `dist/`. Set `VITE_API_BASE_URL` to the hosted API
  origin at build time. All API access already flows through
  `src/api/apiClient.js`, so no other file needs changing.
- **Backend hosted separately:** Express and SQLite cannot run on GitHub Pages.
  Deploy `server/` to a Node host and swap SQLite for a managed database by
  reworking `server/db/`. Routes, controllers, and services stay as they are.

Checklist before going live:

1. Set a strong `SESSION_SECRET` and run behind HTTPS (cookies switch to
   `secure` automatically when `NODE_ENV=production`).
2. Set `CORS_ORIGIN` to the deployed frontend origin, since the frontend and
   API will no longer share an origin through a dev proxy.
3. Replace the notification service with a real email provider.
4. Implement the Google Sheets adapter in the inquiry integration service if
   still wanted.
5. Move uploads to object storage by reimplementing `server/services/fileService.js`.
6. Delete the demo accounts. They exist only in the seed script.
7. Add rate limiting to `/api/inquiries` and `/api/auth/login`.

### Routing note for GitHub Pages

The app uses `BrowserRouter`, so deep links like `/contact` require the host to
serve `index.html` for unknown paths. The Vite dev server does this
automatically, which is why refreshing any route works locally. GitHub Pages
does not, and returns 404 for direct navigation to a client route. Options when
that deployment happens:

- Copy `dist/index.html` to `dist/404.html` at deploy time (simplest, keeps
  clean URLs), or
- Switch `BrowserRouter` to `HashRouter` in `src/App.jsx` (URLs gain a `#`), or
- Serve the frontend from a host with SPA fallback support.

If the app is served from a subpath (for example `/OpenMinds/`), also set Vite's
`base` option and the router `basename` to match.
