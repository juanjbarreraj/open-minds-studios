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

## Verification summary

| Check | Result |
|---|---|
| `npm run build` | Succeeds; `dist/` contains no Base44 reference |
| `npm run lint` | Clean (baseline had 18 errors) |
| `npm run typecheck` | 4 pre-existing errors remain, down from 15; none in migrated data-access code |
| `npm run test:api` | 69 passed, 0 failed |
| Browser suite (`server/test/uiTests.mjs`) | 43 passed, 0 failed |
| Network requests to any Base44 host during a full browser session | zero |

## Pre-existing issues left untouched (not migration defects)

- `src/components/landing/TestimonialsSection.jsx:38` has a duplicate `style`
  attribute, so the glass-effect style object is silently dropped by JSX. Fixing
  it would change the rendered design, so it was left alone and reported here.
- `src/pages/Services.jsx` passes no `children` to a component that destructures
  it (3 call sites), and Tailwind warns that `duration-[250ms]` is ambiguous.
  Both predate the migration.
