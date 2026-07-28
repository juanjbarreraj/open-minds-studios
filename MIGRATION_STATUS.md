# Base44 Migration Status

Migration of Open Minds Studios from Base44 to a fully local Express + SQLite stack.

Branch: `migration/remove-base44` (repo was not under git; initialized with baseline commit on `main` first).

## Baseline (before any changes)

| Check | Result |
|---|---|
| `npm install` | Succeeds |
| `npm run build` | Succeeds (one ambiguous Tailwind class warning: `duration-[250ms]`) |
| `npm run lint` | 18 pre-existing errors, all `unused-imports/no-unused-imports` (AssignModuleModal, About, Services, SubscriptionPlans, and others) |
| `npm run typecheck` | Pre-existing TS errors in AvailabilityManager, app-params.js, ManagerDashboard, Services, TutorDashboard (checkJs on JSX props and untyped params) |
| `npm run dev` | Starts on :5173. Base44 vite plugin logs "Proxy not enabled (VITE_BASE44_APP_BASE_URL not set)" and injects sandbox/HMR/navigation/analytics scripts into the served HTML. Favicon is Base44's logo, title is "Base44 APP", and a nonexistent `/manifest.json` is referenced. |

## Notable pre-existing defects found during audit (audit complete 2026-07-27)

1. **Bookings do not store a calendar date.** `BookingModal` persists `preferred_day` (weekday name like "Monday"), `preferred_start_time`, `preferred_end_time`. The concrete date the student picked is shown in the UI but never saved. `SchedulingGrid.isSlotBooked` matches on weekday name, so a booking blocks that weekday/time slot for every week. The local schema adds a real `session_date` to fix this while keeping the existing UI flow.
2. **Status vocabulary mismatch confirmed.** Tutor accept writes `'Appointment Confirmed'` (AppointmentsSection.jsx), BookingManager writes `'Confirmed'`, student views check both strings; tutor decline writes `'Cancelled'`, indistinguishable from a student cancel. Local backend normalizes stored values to `pending / confirmed / declined / cancelled / completed`; UI shows friendly labels ("Pending", "Appointment Confirmed", "Completed").
3. **Privacy hole in scheduling grid.** `SchedulingGrid` calls `Booking.list()` for ALL students' bookings (names, emails, phone, assignment text) so any logged-in student downloads everyone's data. Local API returns anonymized busy-slot info (tutor, date, time, `is_own`) for others' bookings; full detail only for the requester's own bookings.
4. Sorting/display uses Base44 system fields (`created_date`, `-created_date` sort). Local API serves `created_date` / `updated_date` aliases of `created_at` / `updated_at` for compatibility.
5. `ProtectedRoute.jsx` is dead code: not referenced by any route and destructures `authChecked` / `checkUserAuth`, which AuthContext never provides.
6. Base44's `notifyNewInquiry` email templates use em dashes as empty-value placeholders; these will not be carried into visible platform text. `TutorModuleReview.jsx` renders a literal em dash when `submitted_at` is missing; replaced during migration.

## Confirmed current auth flow (to be replaced)

- `AuthContext.checkAppState()` fetches Base44 app public settings before rendering ANY page (public pages included), then `base44.auth.me()` if a token exists in localStorage (`base44_access_token`, captured from a `?access_token=` URL param after Base44-hosted login).
- StudentDashboard: `isAuthenticated()` then `me()` then `Student.filter({email})`; auto-creates unapproved Student if none; gates on `approved` + `can_access_student_portal`.
- TutorDashboard: `me()` then `Tutor.filter({email})`; states loading / no-auth / no-tutor / pending / approved.
- ManagerDashboard: `me()` then `Tutor.filter({email})`; gates on `can_access_manager_dashboard` / `is_super_admin`.
- AppointmentScheduling: same student lookup as StudentDashboard.
- Local replacement: cookie-session auth; `GET /api/auth/me` returns user + linked profiles; dashboards keep the same gate UX but the API enforces authorization server-side.

## Feature-by-feature migration table

Statuses: `not started` / `in progress` / `migrated` / `verified`

| Existing feature | Current Base44 dependency | Files involved | Local replacement | Migration status | Testing status |
|---|---|---|---|---|---|
| Local backend (Express + SQLite) | n/a (new) | server/** | 12 tables incl. sessions, files, notification_outbox; migrations, seed, reset; API + UI test suites | migrated | 69/69 API tests |
| App bootstrap and public-settings gate | `@base44/vite-plugin` injections; AuthContext fetched Base44 app public settings before rendering anything | vite.config.js, index.html, src/App.jsx, src/lib/AuthContext.jsx | Public pages render immediately; `GET /api/auth/me` runs in the background; Vite proxies `/api` to Express | migrated | 9 public pages render signed out (UI tests) |
| Authentication (login, logout, current user) | `base44.auth.me/logout/redirectToLogin`, token in localStorage | src/lib/AuthContext.jsx, src/components/landing/AuthModal.jsx | bcryptjs + signed HTTP-only cookie sessions; `/api/auth/login|logout|me|register|change-password`; inline login form in AuthModal | migrated | login/logout/session tested (API + UI) |
| Role and approval gating | frontend-only checks on Base44 flags | src/components/ProtectedRoute.jsx, dashboards | Server middleware: requireAuth / requireManager / requireApprovedTutor / requireApprovedStudent; roles student_parent, tutor, manager, admin; 401 and 403 responses | migrated | 6 role-enforcement + 4 scoping tests |
| Student dashboard | `base44.entities.*` | src/pages/StudentDashboard.jsx, src/components/student/* | studentsApi / bookingsApi / modulesApi / coursesApi / tutorsApi | migrated | loads with seeded data (UI) |
| Tutor dashboard | `base44.entities.*` | src/pages/TutorDashboard.jsx, src/components/tutor/* | tutorsApi / bookingsApi / availabilityApi / modulesApi | migrated | loads, appointments visible (UI) |
| Manager dashboard | `base44.entities.*` CRUD | src/pages/ManagerDashboard.jsx, src/components/manager/* | Manager-scoped REST endpoints | migrated | all 6 tabs render seeded data (UI) |
| Scheduling grid (7-day view, 60-min slots, 30-day cap) | `Tutor.filter`, `AvailabilitySlot.list`, `Booking.list` (leaked every student's data) | src/components/student/SchedulingGrid.jsx, src/pages/AppointmentScheduling.jsx | availabilityApi + `GET /api/bookings/busy` (anonymized); slot fits fully inside window | migrated | 7-day nav, 1-hour slots, 4:00 pm last start verified in browser |
| Booking creation | `Booking.create` without a calendar date | src/components/student/BookingModal.jsx | `POST /api/bookings` with `session_date`; server validates window, 60-min grid, past dates, 30-day cap, conflicts | migrated | 9 scheduling tests incl. rejections |
| Booking lifecycle (accept/decline/cancel/complete) | `Booking.update` with inconsistent status strings | tutor, student, manager components | `PATCH /api/bookings/:id/status` with per-actor transition rules; declined and cancelled preserved with timestamps | migrated | 11 lifecycle tests incl. slot re-release |
| Double-booking prevention | frontend check only | SchedulingGrid | Transaction + partial unique index on (tutor_id, session_date, preferred_start_time) for live statuses | migrated | conflict returns 409 (test) |
| Modules (assign, submit, grade) | `Module.*` + Base44 UploadFile | tutor and student module components | modulesApi + multer local uploads, protected `/api/files/:id`, statuses assigned/submitted/graded | migrated | 12 module and upload tests |
| Contact form and inquiries | `Inquiry.create` + `functions.invoke('notifyNewInquiry')` + duplicated Google Sheets webhook in 2 files | src/pages/Contact.jsx, src/components/landing/ContactSection.jsx | Single `POST /api/inquiries`; `server/services/inquiryIntegrationService.js` holds the Sheets seam | migrated | submits and stores (API + UI) |
| Email notifications | Base44 SendEmail inside a Deno function | base44/functions/notifyNewInquiry | `notification_outbox` table + terminal preview behind `notificationService.js` | migrated | outbox rows asserted, em dash free |
| Program selection carry-over to Contact | `?program=` query param via full page reload | src/pages/SubscriptionPlans.jsx, src/pages/Contact.jsx | Same param, now client-side navigate; preselects the field | migrated | verified in browser |
| Base44-hosted assets | media.base44.com (2 logos, about image, guide PDF), base44.com favicon | index.html, SiteLogo.jsx, About.jsx, HeroSection.jsx, guideData.js | Downloaded to `public/assets/`; all components repointed | migrated | all four assets return 200 |
| Base44 packages/config | `@base44/sdk`, `@base44/vite-plugin`, base44Client.js, app-params.js, base44/ | package.json, vite.config.js | Uninstalled; plugin removed; `@` alias declared explicitly in vite.config.js; schemas archived to `docs/legacy-base44/` | migrated | build succeeds, no Base44 in dist |

## Asset inventory (all Base44-hosted URLs found and resolved)

| Original URL | Local replacement | Used by | Status |
|---|---|---|---|
| media.base44.com/.../2008f0116_logonobackground.png | `/assets/logo-no-background.png` | HeroSection.jsx | migrated |
| media.base44.com/.../7f0d63852_logo1.png | `/assets/logo1.png` | SiteLogo.jsx, favicon | migrated |
| media.base44.com/.../32869e03e_image1.png | `/assets/about-image1.png` | About.jsx | migrated |
| media.base44.com/.../2eb1928c4_Open_Minds_Studios_Journeys.pdf | `/assets/open-minds-studios-journeys.pdf` | guideData.js, Guide.jsx | migrated |
| base44.com/logo_v2.svg | `/assets/logo1.png` | index.html favicon | migrated |
| /manifest.json (referenced, never existed) | removed | index.html | removed |

No asset failed to download. Nothing at runtime points to a Base44 host.

## Final repository search

Run after completing every phase, excluding `node_modules`, `.git`, and the
archived `docs/legacy-base44/` folder:

| Search term | Matches in runtime code |
|---|---|
| `@base44` | none |
| `base44.` | none |
| `media.base44.com` | none |

The word Base44 remains only in this document, in `LOCAL_DEVELOPMENT.md`, in two
explanatory source comments (`server/db/migrations/001_init.sql` noting which
defect the `session_date` column fixes, and `server/services/notificationService.js`
noting where the email templates were ported from), and inside the archived
reference files under `docs/legacy-base44/`.

## Post-migration hardening round

After the phases above completed, the migrated code was reviewed adversarially
and the confirmed defects were fixed. Grouped by what they affected:

### Authorization and identity

| Defect | Fix |
|---|---|
| Registering with a manager-created profile's email silently inherited that profile, including manager and super admin flags (full takeover) | Profiles resolve by `user_id` only, never by email. Registration adopts a pre-created profile only when it carries no standing at all; anything approved or elevated must be linked by a manager (`POST /api/students/:id/link`, `POST /api/tutors/:id/link`, surfaced in the manager UI as "Portal account: Linked / Not linked"). |
| Booking status changes, booking reads, module reads, and uploads required only a session, so a suspended account kept working | New `requirePortalAccess` middleware on those routes: manager, approved tutor, or approved student. Removing approval takes effect on the next request. |
| A non-super-admin manager could strip the super admin's flags (only granting was guarded) | `guardElevatedFlags` now fires on any change to the elevated flags, in either direction. |
| Any authenticated account, including a throwaway registration, could enumerate every approved tutor's email | Listing tutors now requires portal standing. |
| The session cookie fell back to its unsigned value, allowing session fixation | Signed cookies only. |
| Changing a password left other sessions active; expired sessions were never purged | Password change revokes all other sessions; expired rows are cleaned on login. |
| Editing a profile's email could re-point it at a different login | Email changes are refused while a portal account is linked. |

### Data integrity

| Defect | Fix |
|---|---|
| Deleting a tutor cascade-deleted every booking and module, including graded student work | Migration `002_preserve_history.sql` rebuilds both tables with `ON DELETE RESTRICT`; the API explains that approval should be turned off instead. |
| A module could reference any file id, granting its student and tutor access to a file they never had | Attaching a file requires the caller to be its uploader (or a manager). |
| A file attached to more than one module was readable by only one of them | File access considers every module the file belongs to. |
| Duplicate course codes were silently allowed | Unique index on `course_code`. |
| Manager booking edits bypassed the state machine and never stamped `cancelled_at` / `declined_at` | Manager edits route through `transitionBooking` (with every status reachable for that role) and keep the audit stamps. |

### Scheduling correctness

| Defect | Fix |
|---|---|
| The grid computed today, past days, and the 30-day window in the browser's time zone while the server validated in America/New_York | `src/lib/appTime.js` anchors the grid to Eastern Time; the booking payload uses the same calendar date. |
| Slots earlier today were still offered and accepted | The server rejects a start time that already passed today; the grid renders those hours disabled. |
| Days past the 30-day limit were reachable inside the last navigable week | Individual day cells and their slots are checked against the limit, not just the Next button. |
| Overlapping availability windows let two sessions collide | Overlapping windows are rejected on create and update, and the booking conflict check compares time ranges rather than identical start times. |

### Error handling

| Defect | Fix |
|---|---|
| Foreign-key violations, malformed JSON bodies, and most multer rejections returned 500 | Mapped to 400, 404, 409, or 413 as appropriate. |
| Repeated query parameters crashed list endpoints | Query values are collapsed to a single string. |
| Downloading a file whose blob was missing returned 500 | Returns 404 with a clear message. |
| Every action button in the app (accept, decline, cancel, save, delete, upload, grade, assign) stayed disabled forever when the server rejected the request, and several loaders spun forever on failure | Each handler now releases its state and surfaces the server's message in the component's existing error area. |
| `npm run db:reset` broke on paths with spaces after deleting the database | Uses `fileURLToPath` instead of `URL.pathname`. |
| Notification failures could surface as a failed inquiry after the inquiry was already saved | The integration service guards both adapters. |

### Product behavior

| Defect | Fix |
|---|---|
| Declined and cancelled bookings vanished from the student's view entirely, so a decline was invisible in-app | Active lists stay clean, but session history now shows them with their status label. |
| The tutor's student roster dropped anyone whose only session was completed, making them unassignable | The roster counts confirmed and completed sessions. |
| The Tutor form's Auth Provider dropdown discarded its value | Replaced with the portal-account link control described above. |
| A duplicate `style` prop silently dropped the testimonial cards' glass treatment | Merged into one style object, restoring the intended design. |
| The user guide still walked people through the removed hosted login, including "Continue to Sign In" and Google sign-in, neither of which exists now | Sign-in steps rewritten for the local email and password modal, including where approval fits. |
| Seven em dashes remained in visible platform text, against the platform text rule | Replaced with commas or colons; no em dash remains anywhere in `src/` or `index.html`. |

## Final independent audit and hardening pass

A further independent audit of the migrated application found privilege,
identity, scheduling, and security gaps that the earlier passes had not
covered, plus two areas still showing placeholder data. All were fixed on
branch `migration/remove-base44`. No hosted service was introduced: the stack
is still React/Vite, Express, SQLite, and local uploads.

### Privilege boundaries around elevated profiles

Blocking only the `is_super_admin` and `can_access_manager_dashboard` fields
left every other route to the same outcome open. A regular manager could edit
an elevated profile's email, unapprove it, unlink it, relink it, or delete it,
each of which moves or destroys manager access just as effectively as flipping
the flag.

| Defect | Fix |
|---|---|
| A regular manager could edit, rename, or change the email of an elevated tutor profile | Every write targeting an elevated profile now requires a super admin |
| A regular manager could unapprove, unlink, relink, or delete an elevated profile | Same guard applied to approval, linking, unlinking, and deletion |
| Revoking elevated flags was unguarded (only granting was checked) | `assertMayChangeElevatedFlags` fires on any change in either direction |
| The system could be left with zero reachable super admins | `assertKeepsASuperAdmin` refuses the last one dropping their flag, unapproving, unlinking, or being deleted; counting linked super admins plus `admin` role accounts |
| Privilege logic was scattered across the controller | Extracted to `server/lib/privileges.js` with named helpers |

### Role-safe profile linking

| Defect | Fix |
|---|---|
| A student account could be linked to a tutor profile and vice versa | The account's role must match the profile type; managers and admins may still hold a tutor profile because the manager dashboard is reached through one |
| One account could own both a student and a tutor profile, making its identity ambiguous | Rejected with 409, and enforced by unique indexes on `students.user_id` and `tutors.user_id` |
| An already-linked profile could be silently relinked | Rejected with 409; unlink first |

### Module student identity

Module access is checked against both `student_id` and `student_email`, so a
request supplying one student's id with another's email produced a module
visible to two unrelated students, and a file readable by both.

| Defect | Fix |
|---|---|
| Mismatched id and email created a dual-identity module | Rejected with 400; the module is not created |
| An unknown student id was silently ignored, falling back to the email | Rejected with 400 |
| Client-supplied name and email were stored verbatim | The stored id, email, and name always come from the database row |
| Assignment by email before the family registers | Preserved deliberately: the module holds the email until a profile exists, documented in `LOCAL_DEVELOPMENT.md` |

### Scheduling correctness

| Defect | Fix |
|---|---|
| One student could book two different tutors at overlapping times | Range-overlap check inside the booking transaction, plus the `ux_bookings_student_live_slot` partial unique index; returns 409 "You already have another appointment during that time." |
| A booking could name a course its tutor does not teach | The course must exist and have a `tutor_courses` row for that tutor; a tutor with no assigned courses can still be booked with `course_id` null |
| Managers could revive a booking after only a tutor-slot check, producing appointments in the past, beyond 30 days, outside availability, with an unapproved tutor, or clashing with the student | Revival runs the full validator inside the transaction |
| A completed session could be silently reopened | Not reachable normally; `POST /api/bookings/:id/override-status` requires super admin plus a written reason and records an `admin_overrides` row |
| `Date.parse` normalized impossible dates, so 2026-02-31 became March 3 | Strict calendar validation with leap-year handling |

### Session and HTTP security

| Defect | Fix |
|---|---|
| Production could start with the development session secret | Startup fails when `NODE_ENV=production` and the secret is missing or a known placeholder |
| Logout accepted the unsigned cookie and cleared without matching attributes | Signed cookie only; cleared with the same attributes it was set with |
| Cookie attributes were hardcoded | Centralized in `server/lib/config.js` behind `COOKIE_SAME_SITE`, `COOKIE_SECURE`, `COOKIE_DOMAIN` |
| No security headers | Helmet, with CSP deliberately off because this process serves JSON only and the app is served by Vite |
| No abuse limits on login, registration, or the public inquiry form | In-memory per-IP limiters, environment-configurable and stricter in production |
| Cookie auth with no cross-site write protection | Origin verified on POST, PUT, PATCH, DELETE when an Origin header is present; header-less callers such as the test suite are unaffected |

### Privacy and file hygiene

| Defect | Fix |
|---|---|
| Every authenticated account could read every approved tutor's email | Removed from the student-facing directory, which now exposes name and bio; the booking UI already rendered contact details conditionally, so it degrades cleanly |
| A failed database insert left an unreachable blob on disk | The blob is removed when recording fails |
| Abandoned uploads accumulated forever | `POST /api/maintenance/orphan-files` (super admin) removes records and blobs no module references, never touching an attached file |

### Placeholder data replaced

| Defect | Fix |
|---|---|
| The student dashboard displayed invented metrics and a hardcoded "SAT Math, 75% complete" focus | Real `student_progress_metrics` and `student_focus` records, scoped per student, with professional empty states when nothing is recorded |
| No way to maintain that data | Tutors update focus and metrics from My Students; managers may do so for any student; students are read-only |
| Contact inquiries were stored but invisible to staff | Manager dashboard Inquiries tab with the full submission, a new/contacted/closed workflow, and internal notes |

### Migrations added

`003_security_and_integrity.sql`, `004_student_progress.sql`, and
`005_inquiry_workflow.sql`. Migrations 001 and 002 were not modified.

## Final local product-completeness pass

The last pass before production deployment planning. It closed the functional
gaps the hardening passes had documented as limitations, replaced the manual
account-linking step, and added the operational commands the application now
warrants. Still no hosted service: React/Vite, Express, SQLite, local uploads,
notification outbox.

### Features added

| Feature | What it does |
|---|---|
| Tutor cancellation | A tutor releases their own future confirmed session with a required reason. The booking keeps `cancelled_by`, `cancellation_reason`, and `cancelled_at`; the slot frees immediately; the student is notified through the outbox and sees the reason in their session history; managers keep the record. |
| Grade corrections | Grading is no longer terminal. `module_grade_revisions` preserves every value a grade has held, starting with the first one. A reason is required. Staff see the full history with author and reason; students see that a grade changed and when, but not the internal reason. |
| DST-safe time handling | Luxon replaces manual date arithmetic. Appointments store UTC instants alongside the Eastern Time wall clock. Nonexistent spring-forward times are rejected; repeated fall-back hours resolve deterministically to the first occurrence; 60 minutes means 60 real minutes. |
| Local invitations | Managers issue one-time links (`/register?invite=<token>`) tied to a role, profile, and email. Only a SHA-256 hash is stored, the raw token is shown once and never logged, and registration through the link performs the profile link automatically. Expiry, revocation, reuse, alteration, and role or email mismatch are all rejected, and elevated profiles can never be invited. |
| Super-admin UI | The API-only booking override and orphan-file cleanup now have a guarded Admin Tools tab: the override requires a reason and is audited; the cleanup previews count, size, and file list, then requires confirmation, and never touches a file a module references. |
| Backup, restore, export | `db:backup` (consistent copy, no downtime, never overwrites), `db:restore` (verifies the file, auto-backs-up first, demands `--confirm`), `data:export` (portable JSON with credentials excluded by construction). |

### Defects fixed

| Defect | Fix |
|---|---|
| A tutor could not release a confirmed session at all | Tutor cancellation workflow, restricted to their own future confirmed appointments |
| A grade was permanently wrong once submitted | Correction workflow with full audit history |
| The spring-forward gap and the fall-back repeat were unmodeled, so a booking could be stored against a time that never happened | Rejected and resolved respectively, with UTC instants stored |
| Managers could revive declined, cancelled, and completed appointments, which the state machine was never meant to allow | Terminal states are terminal for every actor; the audited super-admin override is the only way past |
| Pre-approved profiles needed a manual manager link after registration | Invitation links do it automatically, with the manual link retained as a fallback |
| 18 unused packages, including Stripe, shipped in `package.json` | Audited and removed |

### Dependency audit

Every package was checked for a real import or a script or config reference.
Removed: `@stripe/react-stripe-js`, `@stripe/stripe-js`, `@hello-pangea/dnd`,
`@hookform/resolvers`, `@radix-ui/react-toast`, `canvas-confetti`, `date-fns`,
`html2canvas`, `jspdf`, `lodash`, `moment`, `react-hot-toast`, `react-leaflet`,
`react-markdown`, `react-quill`, `three`, `baseline-browser-mapping`,
`eslint-plugin-react-refresh`.

Retained despite having no direct import, because the toolchain needs them:
`postcss` and `autoprefixer` (referenced by `postcss.config.js` and Vite's CSS
pipeline), `concurrently` (used by the `dev` script), `eslint`, `typescript`,
and `@types/node`, `@types/react`, `@types/react-dom` (used by the `lint` and
`typecheck` scripts). Added: `luxon`.

### Migrations added

`006_cancellation_details.sql`, `007_grade_revisions.sql`,
`008_invitations.sql`, `009_booking_utc_instants.sql`. Migrations 001 to 005
were not modified.

## Verification summary

| Check | Result |
|---|---|
| `npm install` | Succeeds |
| `npm run db:reset` | Applies all nine migrations and seeds |
| `npm run build` | Succeeds; `dist/` contains no Base44 reference |
| `npm run lint` | Clean (baseline had 18 errors) |
| `npm run typecheck` | Clean (baseline had 15 errors) |
| `npm run test:api` | 275 passed, 0 failed |
| `npm run test:ui` | 72 passed, 0 failed, 0 console errors |
| `npm test` / `npm run test:all` | Passes end to end on a temporary stack |
| Network requests to any Base44 host during a full browser session | zero |
