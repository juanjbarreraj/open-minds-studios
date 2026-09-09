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
no changes. Production is not: the frontend is on Netlify and the API on
Render, so every call is cross-site, which requires all of:

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
`admin_overrides`, `module_grade_revisions`, `invitations`.

Migrations are additive and ordered; earlier ones are never edited:

| File | Adds |
|---|---|
| `001_init.sql` | The original schema |
| `002_preserve_history.sql` | Restricted tutor deletes, unique course codes |
| `003_security_and_integrity.sql` | Student double-booking index, one profile per account, `admin_overrides` |
| `004_student_progress.sql` | `student_progress_metrics`, `student_focus` |
| `005_inquiry_workflow.sql` | Inquiry `status`, `manager_notes`, `updated_at` |
| `006_cancellation_details.sql` | Booking `cancelled_by`, `cancellation_reason` |
| `007_grade_revisions.sql` | `module_grade_revisions` |
| `008_invitations.sql` | `invitations` (hashed tokens) |
| `009_booking_utc_instants.sql` | Booking `starts_at_utc`, `ends_at_utc` |

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
demo student, one assigned module, demo progress metrics and a focus item, two
sample inquiries (one `new`, one `contacted`), and one approved student profile
with no portal account (`riley.invite@demo.local`) so the invitation flow has
something to invite.

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

### Backups, restore, and export

```bash
npm run db:backup                                   # timestamped copy
npm run db:restore -- <backup-file> --confirm       # replace the database
npm run data:export                                 # portable JSON of the records
```

**Backup** writes a timestamped copy to `server/backups/` (override with
`BACKUP_DIR`), outside the active database directory, and never overwrites an
existing file. It uses SQLite's own backup API, so the copy is transactionally
consistent: **the development server does not need to be stopped.**

**Restore** requires an explicit path and `--confirm`. Before replacing
anything it verifies that the file is a readable SQLite database with this
application's tables, then takes an automatic `pre-restore` backup of the
current database. Without `--confirm` it refuses and prints the exact command
to re-run. Restart the API server afterwards so it reopens the restored file.

**Export** writes JSON to `server/exports/` (override with `EXPORT_DIR`)
covering students, tutors, courses, tutor-course assignments, availability,
bookings, modules, grade revisions, inquiries, progress metrics and focus, the
notification outbox, and the admin override log. It lists columns explicitly
rather than dumping tables, so password hashes, sessions, and invitation token
hashes cannot leak into an export even if a column is added later.

`server/backups/` and `server/exports/` are git-ignored. A backup contains
password hashes: treat it like a credential store and never commit one.

## 8. Testing roles

```bash
npm test           # everything: lint, typecheck, build, API, browser
npm run test:all   # same as npm test
npm run test:api   # 275 backend checks, temporary database, no dev stack needed
npm run test:ui    # 72 browser checks, requires `npm run dev` running
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

### Time zones and daylight saving

The business time zone is `America/New_York`, and that is what every screen
shows. Conversion is handled by Luxon rather than manual date arithmetic,
because two hours a year do not behave the way naive math assumes.

- **Storage.** Each appointment stores its Eastern Time wall clock
  (`session_date`, `preferred_start_time`, `preferred_end_time`, which is what
  availability windows are defined in and what the UI displays) *and* the real
  instants `starts_at_utc` / `ends_at_utc`. The UTC pair is what anchors a
  session to an actual moment.
- **Spring forward.** On the March transition the clock jumps 02:00 to 03:00,
  so times in that gap never happen. A booking at a nonexistent time is
  **rejected** with an explanation, rather than silently sliding to 03:00.
- **Fall back.** On the November transition 01:00 to 02:00 happens twice. The
  application resolves such a time **deterministically to the first
  occurrence** (still daylight time) and records the resulting UTC instant, so
  a booking is never ambiguous once stored. It is not rejected, because the
  hour is a legitimate business hour.
- **Duration.** The 60-minute rule is 60 *real* minutes: the end instant is the
  start instant plus an hour, computed on the timeline rather than on the wall
  clock. On a transition day the displayed end time can therefore differ from
  start + 1 hour on the clock, which is correct.
- **Navigation.** Day and week arithmetic is calendar arithmetic in the app
  time zone, so seven-day navigation lands on the same weekday and the 30-day
  limit stays exact across both transitions.

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

### Appointment lifecycle

The state machine lives in one place, `CANONICAL_TRANSITIONS` in
`server/services/bookingService.js`:

```
pending    -> confirmed | declined | cancelled
confirmed  -> cancelled | completed
declined   -> (final)
cancelled  -> (final)
completed  -> (final)
```

Each actor gets a subset. A student cancels their own pending or confirmed
session. A tutor confirms, declines, completes, and cancels their own
confirmed session. A manager may make any canonical move. Nothing brings a
terminal appointment back to life through the normal flow, including for
managers; that is what the super admin override is for.

### Tutor cancellation

A tutor who cannot attend releases the session themselves from the tutor
dashboard, on any confirmed appointment that has not started yet. A reason is
required, and it goes to the student:

- The booking becomes `cancelled` with `cancelled_by = 'tutor'`, the reason,
  and a timestamp.
- The time is immediately bookable again.
- It leaves the active student and tutor lists and appears in the student's
  session history with the tutor's reason, and in the manager's Bookings tab.
- A `booking.cancelled_by_tutor` message is written to the notification outbox
  addressed to the student. Nothing is emailed; see the notifications section.

A tutor cannot cancel another tutor's appointment (403), a completed one, or
one that has already started. Those are manager territory.

### Grade corrections

Grading is no longer terminal. On the tutor dashboard, module review has an
**Awaiting grading** tab and a **Graded** tab; a graded module offers
**Correct this grade** and **Grade history**.

- A correction reason is required.
- The module row always holds the current grade and feedback.
- `module_grade_revisions` holds every value the grade has ever had, including
  the first one, in chronological order with who changed it and why.
- A tutor may correct grades on modules they assigned; a manager may correct
  any; students are read-only.
- A student can see their own history, including that a grade was corrected
  and when, but not the internal correction reason or who made it.

### Invitations

Because no email provider is connected, invitations are local links rather than
emails. In the manager dashboard, **Invitations**:

1. Create an invitation for an unlinked student or tutor profile.
2. Copy the link that appears once, for example
   `http://localhost:5173/register?invite=<token>`.
3. Pass it to the person however you normally reach them.

The token is shown exactly once, at creation. Only a SHA-256 hash is stored, so
the database never holds anything replayable, and the raw value is never
logged or included in any listing. An invitation:

- expires (14 days by default, configurable per invitation),
- works once, then is marked accepted,
- can be revoked while unused,
- must match the intended account type and, when the profile has an email, that
  address,
- is refused when altered, expired, revoked, already used, or when the profile
  has since been linked,
- can never be issued for a manager or super admin profile, so it cannot
  become a route to elevated access.

Registering through the link creates the account already linked to the intended
profile, so the family or tutor keeps whatever approval the manager had already
set. The manual **Link** button remains as a fallback.

### Super admin tools

Super admins get an extra **Admin Tools** tab. Regular managers never see it,
and the API refuses them regardless of what the browser sends.

- **Force an appointment status** performs a move the lifecycle forbids, for
  example reopening a session marked completed by mistake. A reason of at
  least 10 characters is required and the action is written to
  `admin_overrides` with the actor, the reason, and the before and after
  status.
- **Unreferenced uploads** scans for files no module points at, shows the count,
  the total size, and each file, and requires a separate confirmation before
  deleting. Files attached to a module are never listed and never removed. Who
  ran the cleanup and what it covered is recorded in `admin_overrides`.

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
- **No payments.** There is no payment code and no payment dependency: the
  unused Stripe packages from the original scaffold have been removed.
- **No password reset.** Managers create and approve accounts; there is no
  self-service recovery flow yet.
- **No email verification.** Invitation links stand in for it: a manager vouches
  for who should hold a profile. Registration without an invitation still never
  adopts an approved profile on its own (see below).
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
- **Bookings made before this release have no UTC instants.** `starts_at_utc`
  is null on those rows and the code falls back to the Eastern Time wall clock,
  which is correct except in the two transition hours. New bookings always
  store both.
- **A repeated fall-back hour is resolved, not surfaced.** The first occurrence
  is chosen automatically; nobody is asked which one they meant.
- **Rate limits are per process and in memory.** They reset when the server
  restarts and are not shared across processes; a clustered deployment needs a
  shared store.
- **Terminal appointments need an override to change.** Declined, cancelled,
  and completed are final in the normal flow, for managers too. A super admin
  can force a status from Admin Tools with a written reason, recorded in
  `admin_overrides`.
- **Orphan upload cleanup is manual.** The Admin Tools tab scans and deletes on
  demand. Nothing runs it on a schedule.
- **Backups are manual.** `npm run db:backup` is run by hand; there is no
  scheduled job and no offsite copy.
- **Progress metrics are free-text label and value pairs.** There are no charts
  or trend analytics, by design for this pass.
- **Tutors with history cannot be deleted.** Deleting would take student
  appointment and module records with it, so the API refuses and asks the
  manager to turn off approval instead.

## 12. Production deployment

> **Status as of 2026-09-09:** the frontend is live at
> https://openmindsstudios.com (Netlify); the API is **not deployed**, so every
> authenticated feature is non-functional in production. The verified state,
> the exact failure mechanism, and the remaining work live in
> [`docs/deployment-status.md`](docs/deployment-status.md). Read that before
> touching deployment.

The shape in production:

- **Frontend on Netlify.** `netlify.toml` sets the build (`npm run build`,
  publish `dist`), the www-to-apex redirect, the SPA fallback, and cache
  headers. `VITE_API_BASE_URL` is set in the Netlify dashboard, not in the
  repo, and is baked into the bundle at build time.
- **API on Render.** `render.yaml` declares the service with a persistent disk
  at `/var/data` holding the database, uploads, backups, and exports. SQLite
  needs a filesystem that survives restarts, which rules out serverless hosting.
  The blueprint sets `NODE_ENV=production`, generates `SESSION_SECRET`, and
  configures the cross-site cookie attributes.

Because the two live on different hosts, every API call is cross-site. That is
why the blueprint sets `COOKIE_SAME_SITE=none`, `COOKIE_SECURE=true`, and
`COOKIE_DOMAIN=.openmindsstudios.com`, and lists both apex and www in
`CORS_ORIGIN`. This is the part most likely to misbehave, so verify a real
login survives a page refresh before trusting it.

### First manager account

A fresh production database has no users, and there is deliberately no public
route to a manager account: self-service registration produces only
`student_parent` or `tutor`, and issuing invitations requires an existing
manager. Break the chicken-and-egg once, in a Render shell:

```bash
MANAGER_EMAIL=you@example.com MANAGER_PASSWORD='...' MANAGER_NAME='Your Name' \
  npm run db:create-manager
```

Unlike `db:seed`, it deletes nothing and inserts no demo data.

### Still outstanding

1. Replace the notification service with a real email provider. Nothing is
   emailed today; messages only land in `notification_outbox`.
2. Point the contact form back at the API (see `src/api/inquirySubmit.js`).
3. Off-site backups. Nothing runs `npm run db:backup` automatically, and in
   production it writes to the *same* Render disk as the database, so it is a
   pre-change snapshot rather than disaster recovery. A Render cron job cannot
   fill the gap: cron containers cannot mount a disk. See
   `docs/render-runbook.md`.
4. Rate limits are per process and in memory; a second instance needs a shared
   store.
5. Uploads live on the Render disk. Object storage means reimplementing
   `server/services/fileService.js`.
6. No password reset exists; a locked-out user needs a manager.
