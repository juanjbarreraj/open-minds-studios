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
| `CORS_ORIGIN` | `http://localhost:5173` | Comma-separated browser origins allowed to send credentialed requests. Also the allowlist for the Origin check on state-changing calls. |
| `NODE_ENV` | unset | With `production`, the server refuses to start on a placeholder `SESSION_SECRET`, cookies become `Secure`, and rate limits tighten. |
| `COOKIE_SAME_SITE` | `lax` | Session cookie SameSite attribute. |
| `COOKIE_SECURE` | follows `NODE_ENV` | Force the `Secure` flag on or off. |
| `COOKIE_DOMAIN` | unset | Optional cookie domain for a shared parent domain. |
| `RATE_LIMIT_LOGIN_MAX` / `_WINDOW_MS` | 50 per 15 min locally | Login attempt limit. |
| `RATE_LIMIT_REGISTER_MAX` / `_WINDOW_MS` | 50 per hour locally | Registration limit. |
| `RATE_LIMIT_INQUIRY_MAX` / `_WINDOW_MS` | 100 per hour locally | Public contact form limit. |
| `VITE_API_BASE_URL` | `/api` | Frontend API base. Leave unset locally; set a full URL when the backend is hosted separately. |

### Cross-domain hosting note

Local development is same-origin through the Vite proxy, so the defaults need
no changes. A frontend on GitHub Pages calling a backend on an unrelated
domain is a cross-site request, which requires all of:

- `COOKIE_SAME_SITE=none` and `COOKIE_SECURE=true` (browsers reject
  `SameSite=None` without `Secure`)
- `CORS_ORIGIN` set to the exact frontend origin, not a wildcard
- HTTPS on both sides, since `Secure` cookies are not sent over HTTP

The same `CORS_ORIGIN` list drives the Origin check applied to every POST,
PATCH, PUT, and DELETE, so a forged cross-site write is refused even though
the browser attaches the session cookie automatically.

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
`notification_outbox`, `student_progress_metrics`, `student_focus`,
`admin_overrides`.

Migrations are additive and ordered; earlier ones are never edited:

| File | Adds |
|---|---|
| `001_init.sql` | The original schema |
| `002_preserve_history.sql` | Restricted tutor deletes, unique course codes |
| `003_security_and_integrity.sql` | Student double-booking index, one profile per account, `admin_overrides` |
| `004_student_progress.sql` | `student_progress_metrics`, `student_focus` |
| `005_inquiry_workflow.sql` | Inquiry `status`, `manager_notes`, `updated_at` |

Deleting a tutor is restricted at the database level when appointments or
modules reference them, so student history cannot be destroyed by a single
delete. Managers turn off approval instead.

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
npm test           # everything: lint, typecheck, build, API, browser
npm run test:all   # same as npm test
npm run test:api   # 184 backend checks, temporary database, no dev stack needed
npm run test:ui    # 55 browser checks, requires `npm run dev` running
```

`npm test` is self-contained: it runs lint, typecheck, and build, then the API
suite, then starts a temporary API and Vite server on their own ports with a
throwaway database and uploads directory, runs the browser suite against them,
and shuts everything down. Your development database is never touched, and you
do not need `npm run dev` open in another terminal.

`npm run test:api` runs against a throwaway database in your system temp
directory and leaves your development data untouched. It covers login, role
enforcement, per-role data scoping, scheduling rules, double booking, the
booking lifecycle, module workflow, upload permissions, inquiries, the
notification outbox, identity and privilege boundaries, session integrity,
suspension, history preservation, and malformed-request handling.

`npm run test:ui` drives a real browser (Playwright) against
http://localhost:5173 with the dev stack running. It checks that public pages
render without authentication, the subscription program carries to the contact
form, the contact form submits, all three dashboards load, the scheduling grid
follows the 60-minute and Eastern Time rules, unapproved accounts are blocked,
and no request reaches any Base44 host.

Playwright downloads a browser on first use:

```bash
npx playwright install chromium
```

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
student's records by editing frontend code. Removing an account's approval
takes effect on the next request: portal reads and writes return 403
immediately, without waiting for the session to expire.

The scheduling grid shows other students' booked slots as taken, but the API
returns only the tutor, date, and time for bookings that are not yours. Names,
emails, phone numbers, and assignment text never leave the server for someone
else's booking. The student-facing tutor directory lists names and bios only:
staff email addresses are visible to managers, not to every account.

### Role and linking rules

A portal account and a profile are separate records, joined by an explicit
link. The rules the API enforces:

- A student profile links only to an account whose role is `student_parent`.
- A tutor profile links to a `tutor`, `manager`, or `admin` account. Managers
  hold a tutor profile by design: the manager dashboard is reached through one.
- No account may own both a student profile and a tutor profile.
- An already-linked profile is never silently relinked. Unlink first.
- Registration adopts a pre-created profile only when it carries no standing.
  Anything approved or elevated is linked deliberately by a manager.

### Elevated profiles and the last super admin

A tutor profile is "elevated" when it has `can_access_manager_dashboard` or
`is_super_admin`. Only a super admin (or an `admin` role account) may edit,
rename, change the email of, approve, unapprove, link, unlink, or delete one.
A regular manager receives 403 for every one of those actions, so no manager
can quietly transfer or revoke another manager's access.

The system also refuses any change that would leave zero reachable super
admins: the last one cannot drop their own flag, unapprove themselves, unlink
their account, or be deleted. Grant super admin to a second linked account
first, and the same action is allowed.

### Progress management

Progress is real data, not dashboard decoration:

- A tutor opens **My Students**, hovers a student, and clicks **Update
  Progress** to set this week's focus and add labelled metrics.
- A manager can do the same for any student through the API.
- The student sees their own progress read-only on their dashboard. With no
  records, the dashboard says so instead of showing invented percentages.
- A tutor may only maintain progress for students they actually work with, that
  is someone with a booking or a module from them.

### Inquiry management

The manager dashboard has an **Inquiries** tab listing every contact-form
submission with its submitted date, parent name, email, student grade, subject
or exam, interested program, goals, and message. Each inquiry moves through
`new` to `contacted` to `closed`, with an internal notes field. Inquiries are
never deleted through the API: they are the record of a lead. The Google
Sheets seam in `server/services/inquiryIntegrationService.js` is untouched.

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
  accounts; there is no self-service recovery flow yet. This is also why
  registration never adopts an approved profile on its own (see below).
- **Profiles link to accounts explicitly.** Registering with the same email as
  a manager-created profile does not inherit that profile when it is approved
  or has manager or super admin flags, because nothing proves the registrant
  owns the address. The manager links it from the Students or Tutors tab
  ("Portal account: Not linked" then "Link"). Adding email verification would
  let this become automatic again.
- **Sessions are database-backed cookies** with a 7-day lifetime. Changing a
  password revokes every other session; there is no other revocation UI beyond
  signing out.
- **Single-process SQLite.** Fine for development; a hosted deployment should
  move to a managed database.
- **Google sign-in is gone.** The old hosted login offered it; local auth is
  email and password only. The `auth_provider` column is preserved for when a
  provider is added back.
- **Rate limiting and CAPTCHA are absent** on the public inquiry endpoint.
- **Daylight saving edge cases are not modeled.** Times are Eastern Time
  wall-clock strings, so the hour that does not exist on the spring-forward
  Sunday (and the repeated hour in autumn) is not specially handled.
- **A tutor cannot release a session they already confirmed.** The tutor UI
  offers accept and decline only while a request is pending; a manager changes
  a confirmed booking from the Bookings tab.
- **A grade cannot be corrected once submitted.** Grading moves a module to
  `graded`, which is terminal, and the review queue only lists submitted work.
- **Rate limits are per process and in memory.** They reset when the server
  restarts and are not shared across processes; a clustered deployment needs a
  shared store.
- **Reopening a completed session needs an override.** Managers cannot revive
  one normally. A super admin can `POST /api/bookings/:id/override-status`
  with a written reason, which is recorded in `admin_overrides`. There is no
  UI for this yet; it is deliberately an API-level action.
- **Orphan upload cleanup is manual.** `POST /api/maintenance/orphan-files`
  (super admin) removes upload records and blobs that no module references.
  Nothing runs it on a schedule.
- **Progress metrics are free-text label and value pairs.** There are no charts
  or trend analytics, by design for this pass.
- **Tutors with history cannot be deleted.** Deleting would take student
  appointment and module records with it, so the API refuses and asks the
  manager to turn off approval instead.

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
7. Review the rate limits, which already exist but are per process and in
   memory; move them to a shared store if you run more than one instance.
8. Set `COOKIE_SAME_SITE=none` and `COOKIE_SECURE=true` if the frontend and
   API end up on unrelated domains, and serve both over HTTPS.

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
