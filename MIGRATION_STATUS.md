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
| App bootstrap and public-settings gate | `@base44/vite-plugin` injections; `AuthContext` fetches `/api/apps/public/prod/public-settings` before rendering anything | vite.config.js, index.html, src/App.jsx, src/lib/AuthContext.jsx, src/lib/app-params.js, src/api/base44Client.js | Local AuthContext that calls `GET /api/auth/me` without blocking public pages; Vite proxy to local Express | not started | not tested |
| Authentication (login, logout, current user) | `base44.auth.me/logout/redirectToLogin`, token in localStorage via app-params | src/lib/AuthContext.jsx, src/lib/app-params.js, src/components/landing/AuthModal.jsx, src/components/ProtectedRoute.jsx | Express session auth: bcryptjs + HTTP-only signed cookie; `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`; login form in AuthModal | not started | not tested |
| Role and approval gating | `User.role` (admin/user), `Student.approved` + `can_access_student_portal`, `Tutor.approved` + `can_access_manager_dashboard` + `is_super_admin`, checked in frontend | src/components/ProtectedRoute.jsx, dashboards | Server-side role middleware (student_parent / tutor / manager / admin) + `approved` flag; 401/403 from API; frontend redirects only for UX | not started | not tested |
| Student dashboard | `base44.entities.*` for Student, Booking, Module, Tutor, Course | src/pages/StudentDashboard.jsx, src/components/student/* | `studentsApi` / `bookingsApi` / `modulesApi` over `/api` | not started | not tested |
| Tutor dashboard | `base44.entities.*` for Tutor, Booking, AvailabilitySlot, Module, TutorCourse | src/pages/TutorDashboard.jsx, src/components/tutor/* | `tutorsApi` / `bookingsApi` / `availabilityApi` / `modulesApi` | not started | not tested |
| Manager dashboard | `base44.entities.*` CRUD for all entities | src/pages/ManagerDashboard.jsx, src/components/manager/* | Manager-scoped REST endpoints | not started | not tested |
| Scheduling grid (7-day view, 60-min slots, 30-day cap) | `Tutor.filter`, `AvailabilitySlot.list`, `Booking.list`, `Course.list` | src/components/student/SchedulingGrid.jsx, src/pages/AppointmentScheduling.jsx | `GET /api/availability` + `GET /api/bookings`; slot generation stays 60-min-fit-inside-window; double-booking enforced by DB constraint per (tutor, date, start) | not started | not tested |
| Booking creation | `Booking.create` (no date stored, see defect 1) | src/components/student/BookingModal.jsx | `POST /api/bookings` with `session_date`; server validates window, 30-day cap, past dates, conflicts | not started | not tested |
| Booking lifecycle (accept/decline/cancel/complete) | `Booking.update` with status strings | tutor + student + manager components | Status transition endpoints with normalized statuses and audit-preserving cancel/decline | not started | not tested |
| Modules (assign, submit, grade) | `Module.*` + Base44 `UploadFile` integration | src/components/tutor/AssignModuleModal.jsx, TutorModuleReview.jsx, src/components/student/AssignedModules.jsx | `modulesApi` + multer local uploads under `server/uploads/`, protected download routes, statuses `assigned/submitted/graded` | not started | not tested |
| Contact form and inquiries | `Inquiry.create` + `base44.functions.invoke('notifyNewInquiry')` (sends 2 emails via Base44 SendEmail) | src/pages/Contact.jsx, src/components/landing/ContactSection.jsx, base44/functions/notifyNewInquiry/entry.ts | `POST /api/inquiries`; `inquiryIntegrationService` abstraction; notification_outbox rows + console preview instead of real email | not started | not tested |
| Program selection carry-over to Contact | Route state/query param (exact mechanism being audited) | src/pages/SubscriptionPlans.jsx, src/pages/Contact.jsx | Preserved as-is over local API | not started | not tested |
| Base44-hosted assets | media.base44.com (2 logos, about image, guide PDF), base44.com favicon | index.html, SiteLogo.jsx, About.jsx, HeroSection.jsx, guideData.js | Downloaded to `public/assets/` (already done: logo-no-background.png, logo1.png, about-image1.png, open-minds-studios-journeys.pdf); components to be repointed | in progress | not tested |
| Base44 packages/config | `@base44/sdk`, `@base44/vite-plugin`, base44Client.js, app-params.js, base44/ folder | package.json, vite.config.js | Removed after all features migrated; entity schemas archived to `docs/legacy-base44/` | not started | not tested |

## Asset inventory (Base44-hosted URLs found)

| URL | Local replacement | Status |
|---|---|---|
| https://media.base44.com/images/public/.../2008f0116_logonobackground.png | /assets/logo-no-background.png | downloaded |
| https://media.base44.com/images/public/.../7f0d63852_logo1.png | /assets/logo1.png | downloaded |
| https://media.base44.com/images/public/.../32869e03e_image1.png | /assets/about-image1.png | downloaded |
| https://media.base44.com/files/public/.../2eb1928c4_Open_Minds_Studios_Journeys.pdf | /assets/open-minds-studios-journeys.pdf | downloaded |
| https://base44.com/logo_v2.svg (favicon in index.html) | local favicon | not started |
| https://app.base44.com/support, https://docs.base44.com/..., https://my-to-do-list-81bfaad7.base44.app | Links inside Base44-branded error/404 components that get replaced entirely | not started |
