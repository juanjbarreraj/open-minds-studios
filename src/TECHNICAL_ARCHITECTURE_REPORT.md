# Open Minds Studios — Technical Architecture & Implementation Report

**Document type:** Engineering-level technical documentation
**Audience:** Software engineering recruiters, hiring managers, technical interviewers, portfolio reviewers
**Platform:** Open Minds Studios — Online Tutoring & Academic Support Platform

---

## SECTION 1: PROJECT OVERVIEW

### Project Name
**Open Minds Studios** — a full-stack online tutoring and academic support platform.

### Business Purpose
Open Minds Studios is a web platform for a private tutoring business that provides one-on-one academic support (K–12 tutoring, ACT/SAT/Keystone test prep, and academic coaching). The platform serves three primary business goals:

1. **Lead generation** — convert prospective families (parents) into booked consultations via marketing pages and contact forms.
2. **Operations management** — let tutors and administrators manage student records, availability, appointments, and assigned learning modules.
3. **Student engagement** — give enrolled students a private portal to view their progress, upcoming sessions, and assigned coursework.

### User Types
- **Visitor (unauthenticated)** — browses marketing pages and submits inquiry/consultation forms.
- **Student** — authenticated learner with a private dashboard (sessions, modules, progress).
- **Parent** — submits inquiries and (in practice) manages a student's enrollment; represented in data via inquiry/booking contact fields rather than a separate authenticated role.
- **Tutor** — authenticated staff member who manages availability, reviews student submissions, and assigns modules.
- **Administrator / Manager** — elevated tutor with access to a Manager Dashboard for managing tutors, students, courses, bookings, and availability across the whole organization.

### Core Objectives
- Provide a polished, conversion-focused public marketing site.
- Provide secure, role-gated dashboards for students, tutors, and administrators.
- Support the full appointment lifecycle (availability → booking → confirmation → completion/cancellation).
- Support a learning-module lifecycle (assignment → submission → grading → feedback).
- Capture and route leads to both an internal database, an email notification system, and an external Google Sheet.

### Primary Workflows
1. **Lead capture:** Visitor submits the contact form → record persisted → email notifications sent → row appended to Google Sheet.
2. **Appointment scheduling:** Tutor publishes availability → student books a slot → tutor/admin confirms → session completed or cancelled.
3. **Module delivery:** Tutor assigns a module (with file) to a student → student submits work → tutor grades and gives feedback.
4. **Account provisioning:** New student/tutor logs in → profile auto-created → administrator approves access.

### Business vs. Technical Summary
From a **business** perspective, the platform is a self-serve front door + back-office operations tool for a tutoring company. From a **technical** perspective, it is a **single-page React application** backed by a **Backend-as-a-Service (BaaS)** layer providing authentication, a schema-driven entity database with row-level security, serverless functions, and built-in integrations (email, file storage, LLM). Custom server logic is implemented as Deno serverless functions; third-party data sync (Google Sheets) is handled via a Google Apps Script webhook.

---

## SECTION 2: SYSTEM ARCHITECTURE

### Frontend Architecture

**Stack:** React 18 + Vite, Tailwind CSS, shadcn/ui (Radix UI primitives), Framer Motion, React Router v6, TanStack React Query, Lucide icons.

**Page structure** (`src/pages/`):
- Public marketing: `Home`, `About`, `Services`, `SubscriptionPlans`, `Contact`
- Authenticated portals: `StudentDashboard`, `TutorDashboard`, `ManagerDashboard`
- Scheduling: `AppointmentScheduling`

**Routing & navigation:**
- All routes are declared centrally in `App.jsx` using React Router's `<Routes>`/`<Route>`.
- The `/` root redirects to `/Home`. Each portal has a dedicated path (`/student-dashboard`, `/tutor-dashboard`, `/manager-dashboard`).
- A catch-all `*` route renders a `PageNotFound` component.
- Navigation uses `<Link>` for page transitions and an anchor-scroll pattern (`/#sectionId`) for in-page navigation handled in `SiteHeader`. The header detects whether the user is on the home page and either smooth-scrolls to the section or navigates home with a hash that a `useEffect` in `Home` resolves with a retry-based scroll.

**Reusable components** (`src/components/`), organized by domain:
- `landing/` — marketing sections (`HeroSection`, `ServicesSection`, `AboutSection`, `TestimonialsSection`, `ContactSection`, `ConsultationCTA`, `PortalSection`, `SiteHeader`, `SiteFooter`, `AuthModal`, etc.)
- `student/` — `StudentDashboardView`, `MetricCards`, `TodaysFocus`, `UpcomingSessions`, `AssignedModules`, `BookingModal`, `SchedulingGrid`, `AppointmentDetailModal`
- `tutor/` — `AppointmentsSection`, `AvailabilityManager`, `MyStudentsSection`, `TutorModuleReview`, `AssignModuleModal`, `TutorProfile`
- `manager/` — `TutorManager`, `StudentManager`, `CourseManager`, `BookingManager`, `AvailabilityAdminManager`, `TutorCourseManager`
- `shared/` — `SiteLogo`, `ProtectedRoute`, `UserNotRegisteredError`
- `ui/` — the full shadcn/ui component library (buttons, dialogs, forms, tables, etc.)

The codebase follows a **small, single-responsibility component** convention — pages compose domain sections, and sections compose primitives.

**Responsive design:** Tailwind's mobile-first breakpoint utilities (`sm:`, `md:`, `lg:`) are used throughout. Layouts default to single-column on mobile and expand to multi-column grids on larger viewports. The site header collapses to a hamburger menu on mobile.

### Backend Architecture

The backend is a **Backend-as-a-Service (Base44)** platform providing:

- **Authentication** — managed identity (Google OAuth + email), token issuance, and session handling. The frontend never implements auth backend logic; it consumes an SDK.
- **Authorization** — declarative **Row-Level Security (RLS)** rules attached to each entity schema, evaluated server-side on every read/write.
- **User management** — a built-in `User` entity (id, email, full_name, role) plus domain entities `Student` and `Tutor` for richer profile data and approval flags.
- **Data persistence** — schema-defined JSON entities stored in a managed database, accessed via a typed SDK (`base44.entities.<Entity>`).
- **Appointment management** — `Booking` and `AvailabilitySlot` entities + client orchestration.
- **Module management** — `Module` entity capturing the full assignment → submission → grading lifecycle, with file-URL fields for uploads.
- **Serverless functions** — Deno-based HTTP handlers (e.g., `notifyNewInquiry`) for custom server logic and integrations.

### Application Architecture

- **Client-side state:** React local state (`useState`/`useEffect`/`useCallback`) for component data; TanStack React Query is available/used for server-state caching; a global `AuthContext` provides authentication state app-wide.
- **Server-side operations:** Persistence, RLS enforcement, email sending, and file storage all execute server-side via the SDK or serverless functions.
- **API interactions:** The frontend talks to the backend through the Base44 SDK (`base44.entities`, `base44.auth`, `base44.integrations`, `base44.functions.invoke`). Custom functions return Axios-style responses (`response.data`).
- **Data flow (example — student dashboard):** `StudentDashboard` authenticates the user → finds/creates a `Student` profile → renders `StudentDashboardView`, which fetches `Booking`, `Course`, `Tutor`, and `Module` records in parallel via `Promise.all`, derives upcoming/past sessions client-side, and renders domain sections.

---

## SECTION 3: USER ROLES & PERMISSIONS

### Visitor (Unauthenticated)
- **Permissions:** View all public marketing pages; submit the contact/inquiry form.
- **Restrictions:** No access to any dashboard; cannot read student/tutor/booking data.
- **Features:** Marketing content, program/pricing tiers, lead-capture form, free-consultation CTA.

### Student
- **Permissions:** View own profile, own bookings, own assigned modules; submit module work; cancel own bookings.
- **Restrictions:** Cannot view other students' data; gated behind an admin **approval flag** (`approved` / `can_access_student_portal`) before the full portal renders.
- **Features:** Progress metrics, today's focus, upcoming/past sessions, assigned modules with submission upload.

### Parent
- **Permissions:** Submit inquiries and consultation requests; serves as the booking contact.
- **Restrictions:** No dedicated authenticated portal in the current implementation — parent identity is captured as data fields (`parent_name`, contact info) on `Inquiry`/`Booking`.
- **Features:** Lead forms, program selection, email confirmations.

### Tutor
- **Permissions:** Manage own availability slots; view/confirm/complete bookings assigned to them; create and grade modules for their students; edit own profile/bio.
- **Restrictions:** Gated behind tutor `approved` flag; scoped to their own students/bookings via RLS (`tutor_id`, `student_email` conditions).
- **Features:** Appointments section, availability manager, my-students view, module review/assignment.

### Administrator / Manager
- **Permissions:** Full CRUD over tutors, students, courses, bookings, and availability across the organization.
- **Restrictions:** Access gated by `can_access_manager_dashboard` / `is_super_admin` flags and `role === 'admin'` RLS conditions.
- **Features:** Manager Dashboard with `TutorManager`, `StudentManager`, `CourseManager`, `BookingManager`, `AvailabilityAdminManager`, `TutorCourseManager`.

---

## SECTION 4: AUTHENTICATION & SECURITY

### Login System
Authentication is delegated to the Base44 managed auth service (Google OAuth and email). The client uses `base44.auth.redirectToLogin()` to start login and `base44.auth.me()` to fetch the current user. A token is read from app params and attached to API calls.

### Auth State Management (`AuthContext`)
A global `AuthProvider` bootstraps app state on mount (`checkAppState`):
1. Fetches **app public settings** to determine whether auth is required.
2. If a token exists, calls `checkUserAuth()` → `base44.auth.me()` to hydrate the user.
3. Distinguishes error states: `auth_required` (redirect to login) and `user_not_registered` (render `UserNotRegisteredError`).
4. Exposes `user`, `isAuthenticated`, loading flags, `logout`, and `navigateToLogin` via context.

`App.jsx` consumes this to show a loading spinner during bootstrap, auto-redirect on `auth_required`, and render the not-registered screen when appropriate.

### Protected Routes & Role-Based Access Control
- Dashboards perform **in-component guards**: each portal checks authentication, loads/creates the relevant profile, and conditionally renders a login prompt, a "pending approval" screen, or the full dashboard.
- A reusable `ProtectedRoute` component exists for route-level gating.
- **RBAC is enforced server-side** via per-entity RLS rules (the client guards are UX, not the security boundary).

### Session Management
Token-based sessions handled by the SDK; `logout()` clears the token and optionally redirects. The provider re-validates the session on load and handles 401/403 by surfacing an `auth_required` state.

### Password Handling
No passwords are stored or handled in application code — credential management is fully delegated to the managed auth provider (OAuth/managed email), which is a security best practice (no custom password storage, hashing, or reset flows to get wrong).

### Account Authorization (Approval Workflow)
New `Student`/`Tutor` records default to `approved: false`. Until an administrator flips the approval/access flags, the user sees a pending-approval screen instead of the portal — a manual gate preventing unauthorized access to operational data.

### Security Considerations
- **Defense in depth:** client guards + server-side RLS; the database refuses cross-tenant reads even if the UI is bypassed.
- **Least privilege:** RLS conditions scope reads/writes to the owning user (`{{user.id}}` / `{{user.email}}`) or to admins.
- **Server-only secrets:** integrations and privileged operations run in serverless functions using a service role; access tokens are never exposed to the browser.
- **No client-trust for authorization** — the frontend assumes nothing it renders is authoritative.

---

## SECTION 5: DATABASE DESIGN

The implemented data model is schema-driven JSON entities. Every entity automatically includes system fields: `id` (PK), `created_date`, `updated_date`, `created_by_id`.

### Implemented Entities

**User** (built-in)
- Fields: `id` (PK), `email`, `full_name`, `role` (admin | user)
- Relationships: referenced by `Student.email`, `Tutor.email`, and ownership via `created_by_id`.

**Student**
- Fields: `id` (PK), `first_name`, `last_name`, `full_name`, `email`, `phone`, `approved` (bool), `can_access_student_portal` (bool), `auth_provider` (google | email), `notes`
- Relationships: linked to `User` by email; referenced by `Booking.student_email` and `Module.student_email`.
- RLS: owner-or-admin read/write; admin-only delete.

**Tutor**
- Fields: `id` (PK), `full_name`, `email`, `phone`, `auth_provider`, `approved`, `bio`, `can_access_manager_dashboard`, `is_super_admin`
- Relationships: referenced by `Booking.tutor_id`, `AvailabilitySlot.tutor_id`, `Module.tutor_id`, `TutorCourse.tutor_id`.

**Course**
- Fields: `id` (PK), `course_code`, `course_name`
- Relationships: referenced by `Booking.course_id` and `TutorCourse.course_id`.
- RLS: admin-only writes; authenticated read.

**TutorCourse** (junction / many-to-many)
- Fields: `id` (PK), `tutor_id` (FK → Tutor), `course_id` (FK → Course)
- Purpose: maps which tutors can teach which courses.

**AvailabilitySlot**
- Fields: `id` (PK), `tutor_id` (FK → Tutor), `day_of_week` (enum Mon–Sun), `start_time`, `end_time`, `is_active`
- RLS: owner (`created_by`) or admin write; authenticated read.

**Booking**
- Fields: `id` (PK), `tutor_id` (FK), `student_first_name`, `student_last_name`, `student_email` (FK → Student), `student_phone`, `course_id` (FK → Course), `assignment_description`, `preferred_day`, `preferred_start_time`, `preferred_end_time`, `slot_id` (FK → AvailabilitySlot), `meeting_type` (Online | In-Person), `meeting_link`, `status` (Pending | Confirmed | Completed | Cancelled)
- Relationships: ties a student, tutor, course, and availability slot together.

**Module**
- Fields: `id` (PK), `tutor_id` (FK), `student_id` (FK), `student_email` (FK), `tutor_name`, `student_name`, `name`, `description`, `file_url`, `file_name`, `status` (Assigned | Submitted for grading | Graded), `student_submission_url`, `student_submission_name`, `submitted_at`, `grade`, `feedback`, `graded_at`
- RLS: tutor (owner), student (by id/email), and admin scoped access for each operation.

**Inquiry** (Contact Requests / Leads)
- Fields: `id` (PK), `parent_name`, `email`, `student_grade`, `subject_or_exam`, `goals`, `message`, `interested_program`

### Proposed Extensions (for a fuller relational design)
- **Parent** entity (`id`, `name`, `email`, `phone`) with a one-to-many relationship to `Student`, normalizing the parent contact currently denormalized onto `Inquiry`/`Booking`.
- **Program** entity (`id`, `name`, `price`, `sessions_per_week`, `description`) to replace the hard-coded pricing tiers, referenced by `Inquiry.interested_program` and `Booking`.
- **Notification** entity (`id`, `user_id` FK, `type`, `payload`, `read`, `created_date`) to persist in-app notifications instead of only emailing.

### Relationship Summary
- `Tutor 1—* AvailabilitySlot`, `Tutor 1—* Booking`, `Tutor 1—* Module`
- `Student 1—* Booking`, `Student 1—* Module`
- `Course 1—* Booking`, `Tutor *—* Course` (via `TutorCourse`)
- `Booking *—1 AvailabilitySlot`

---

## SECTION 6: APPOINTMENT MANAGEMENT SYSTEM

### Tutor Availability
Tutors publish recurring weekly availability as `AvailabilitySlot` records (day of week + start/end time + `is_active`). The `AvailabilityManager` (tutor) and `AvailabilityAdminManager` (manager) components provide CRUD over these slots. RLS ensures tutors only edit their own slots.

### Scheduling Workflow
1. A student (or admin) opens the scheduling UI (`SchedulingGrid` / `BookingModal`).
2. Active availability slots are surfaced; the student selects a slot and provides course + assignment context.
3. A `Booking` is created with `status: 'Pending'`, linking `tutor_id`, `student_email`, `course_id`, and `slot_id`.

### Pending Appointments
New bookings default to **Pending**. Tutors/admins see pending requests in `AppointmentsSection` / `BookingManager`.

### Confirmation
Confirming transitions the booking `status` to **Confirmed** (`Booking.update(id, { status: 'Confirmed' })`). A meeting link / meeting type can be attached for online sessions.

### Rejection / Cancellation
Cancellation sets `status: 'Cancelled'`. The student dashboard, for example, calls `Booking.update(id, { status: 'Cancelled' })` and optimistically removes the booking from local state. Cancelled bookings are filtered out of dashboard views.

### Completion
After a session, the booking is marked **Completed**, moving it into the "Past Sessions" list on the student dashboard.

### Calendar Synchronization
Currently sessions are managed in-app via the `Booking` status state machine. The architecture supports calendar sync via a connector automation (e.g., Google Calendar) or by writing booking events to an external calendar from a serverless function — a documented extension point rather than a current dependency.

### Business Logic Summary
The booking lifecycle is a finite state machine: **Pending → Confirmed → Completed**, with **Cancelled** reachable from Pending/Confirmed. State is derived client-side for views (`upcoming` = Pending/Confirmed, `past` = Completed) and enforced for access via RLS.

---

## SECTION 7: LEARNING MODULE SYSTEM

### Tutor Module Assignment
A tutor uses `AssignModuleModal` to create a `Module` record for a specific student. The module captures `name`, `description`, an attached resource (`file_url` + `file_name`), and denormalized `tutor_name` / `student_name` for fast display. New modules start at `status: 'Assigned'`.

### Student Module Visibility
Students see modules scoped to their email via `Module.filter({ student_email })` (RLS-enforced) in the `AssignedModules` component on the student dashboard, ordered by most recent.

### Document & Image Uploads
File uploads (assignment documents, student submissions, images) are handled by the platform's file-storage integration (`UploadFile`), which returns a stable `file_url`. Only the URL/filename is stored on the entity — never the binary — keeping records small and storage scalable.

### Submission & Progress Tracking
- Student uploads work → `student_submission_url`, `student_submission_name`, `submitted_at` are set and `status` → **Submitted for grading**.
- Tutor reviews in `TutorModuleReview`, sets `grade`, `feedback`, `graded_at`, and `status` → **Graded**.
- The three-state status field (Assigned → Submitted for grading → Graded) is the progress tracker.

### Learning Resources
Each module can carry a downloadable resource; the system can be extended with a dedicated resources entity, but currently resources ride on the module.

### Complete Workflow
Assign (tutor) → View (student) → Submit (student upload) → Grade + Feedback (tutor) → Graded (visible to student).

---

## SECTION 8: DASHBOARD SYSTEMS

### Student Dashboard (`StudentDashboard` → `StudentDashboardView`)
- **Guarding:** authenticates the user, finds or auto-creates the `Student` profile, and shows a pending-approval screen until access is granted.
- **Data load:** parallel `Promise.all` fetch of `Booking`, `Course`, `Tutor`; separate `Module` fetch via a memoized `loadModules` callback.
- **Widgets/metrics:** `MetricCards` (progress KPIs), `TodaysFocus` (daily focus), `UpcomingSessions` (with tutor/course resolution + cancel action), `AssignedModules` (with refresh), and a "Past Sessions" history list.
- **Derived state:** upcoming vs. past sessions computed from booking status; helper functions resolve tutor and course names from id.

### Tutor Dashboard (`TutorDashboard`)
- **Guarding:** authentication + tutor approval check; supports login prompt, pending-approval, and full views.
- **Sections:** `AppointmentsSection` (manage bookings), `AvailabilityManager` (weekly slots), `MyStudentsSection` (student roster), `TutorModuleReview` (grade submissions), `TutorProfile` (bio/profile), plus navigation to the Manager Dashboard for elevated tutors and sign-out.

### Manager Dashboard (`ManagerDashboard`)
- Organization-wide CRUD surfaces: `TutorManager`, `StudentManager`, `CourseManager`, `BookingManager`, `AvailabilityAdminManager`, `TutorCourseManager`.

---

## SECTION 9: FORM SYSTEMS

### Contact / Lead Generation Forms
Two entry points — the `Contact` page and the `ContactSection` landing component — capture parent name, email, student grade, subject/exam, interested program, main goal, and a free-text needs message.

### Program Selection
The form reads a `?program=` URL query parameter (set by CTAs on `SubscriptionPlans` and `About`) to pre-select the program of interest and auto-scroll to the form, tightening the marketing-to-lead funnel.

### Submission → Storage Workflow
On submit the handler performs three operations:
1. **Persist to database:** create an `Inquiry` record via `base44.entities.Inquiry.create(...)`.
2. **Notify via serverless function:** invoke `notifyNewInquiry`, which sends an admin notification email and a parent confirmation email using the platform's `SendEmail` integration (executed with a service role inside a Deno handler).
3. **Sync to Google Sheets:** POST the submission to a Google Apps Script Web App URL (`GOOGLE_SHEETS_WEBHOOK_URL`) that appends a row to a spreadsheet.

The Google Sheets call runs in parallel and is non-blocking — if the URL is unset or the request fails, the rest of the submission still succeeds. UI provides sending/success/error states.

### Data Validation
Required fields (parent name, email) are enforced at the entity-schema level and via form-level checks; the UI gives inline feedback and a success confirmation state after submission.

---

## SECTION 10: UI/UX ENGINEERING

- **Responsive, mobile-first:** Tailwind breakpoint utilities; single-column mobile layouts that expand to multi-column grids; a collapsible mobile nav in `SiteHeader`.
- **Accessibility:** shadcn/ui is built on Radix primitives, which provide accessible roles, focus management, and keyboard interaction for dialogs, menus, and form controls; semantic headings and labeled inputs throughout.
- **Navigation structure:** central route table in `App.jsx`; `<Link>` for page nav; hash-anchor smooth scrolling for in-page sections with a retry mechanism to handle late-mounting content.
- **Animation system:** Framer Motion drives scroll-triggered reveals (`whileInView` with `viewport={{ once: true }}`), staggered list entrances (per-index delays), hero parallax, and tasteful looping accents (e.g., the "Most Popular" badge).
- **Hover interactions:** card lift/scale and shadow transitions, gradient buttons with glow on hover, and inline color transitions for nav links — implemented with Tailwind transitions and inline style handlers.
- **Visual hierarchy:** a consistent brand palette (teal `rgb(98,191,161)` + blue `rgb(58,154,202)` + amber accent), gradient headline text, uppercase tracked eyebrow labels, and a deliberate pricing-card "staircase" sizing strategy to direct attention to the recommended tier.
- **Implementation considerations:** design tokens centralized in `index.css`/`tailwind.config.js`; consistent typography to keep copy clean (a site-wide pass removed em dashes for grammatical consistency).

---

## SECTION 11: FILE MANAGEMENT

- **Document uploads:** module resources and student submissions are uploaded through the platform `UploadFile` integration, returning a durable `file_url`.
- **Image uploads:** handled by the same upload mechanism; marketing imagery is referenced via hosted URLs.
- **Storage model:** binaries live in managed object storage; entities store only the URL + filename, keeping records lightweight and queries fast.
- **Retrieval:** public files via their URL; private files via signed, time-limited URLs (`CreateFileSignedUrl`) for controlled access.
- **Permissions:** file references are attached to RLS-protected entities (`Module`), so access to a file's metadata is governed by the same owner/admin rules; private storage + signed URLs provide an additional access boundary.

---

## SECTION 12: API REQUIREMENTS

The platform consumes a managed SDK rather than hand-rolled REST controllers, but the logical API surface is:

### Authentication API
- `auth.me()` → current user (GET-equivalent)
- `auth.redirectToLogin()`, `auth.logout()` → session lifecycle
- `auth.isAuthenticated()` → boolean session check

### Entity / Data APIs (per entity: Student, Tutor, Course, TutorCourse, AvailabilitySlot, Booking, Module, Inquiry)
- `Entity.list(sort, limit)` → read collection (GET)
- `Entity.filter(query, sort)` → scoped read (GET)
- `Entity.create(data)` → insert (POST)
- `Entity.update(id, data)` → patch (PUT/PATCH)
- `Entity.delete(id)` → remove (DELETE)

### Appointment API (Booking + AvailabilitySlot)
- Create booking (POST), update status (PATCH: Pending/Confirmed/Completed/Cancelled), list by tutor/student (GET).
- Availability CRUD (POST/GET/PATCH/DELETE).

### Module API
- Create/assign (POST), list by student/tutor (GET), update for submission and grading (PATCH).

### Contact / Lead API
- `Inquiry.create(data)` (POST)
- `functions.invoke('notifyNewInquiry', { inquiry })` → serverless email notifications (POST; returns `{ ok: true }`).
- External POST to Google Apps Script Web App (Google Sheets append).

### Program API (proposed)
- CRUD over a `Program` entity to replace hard-coded tiers.

**Request/response conventions:** SDK calls return parsed data directly; serverless functions return `Response.json(...)` and surface as Axios responses (`response.data`). Errors propagate as thrown exceptions / non-2xx statuses handled in the UI.

---

## SECTION 13: THIRD-PARTY INTEGRATIONS

- **Google Sheets (lead sync):** a Google Apps Script `doPost` Web App appends each inquiry as a spreadsheet row. Set-up is documented in `GOOGLE_SHEETS_SETUP.md`; the webhook URL is configured in the contact components. Runs in parallel and degrades gracefully.
- **Email notifications:** the `notifyNewInquiry` Deno function uses the platform `SendEmail` integration (service role) to send an admin alert and a parent confirmation, with New-York-timezone-formatted timestamps.
- **Managed authentication:** Google OAuth + email identity via the BaaS auth service.
- **File storage:** managed object storage via `UploadFile` / signed-URL integrations.
- **Calendar integration (extension point):** Google Calendar connector + connector automations can be added to sync confirmed bookings.
- **LLM integration (available):** the platform exposes an `InvokeLLM` integration for future AI features (e.g., study recommendations).

---

## SECTION 14: PERFORMANCE CONSIDERATIONS

- **Parallel data fetching:** dashboards batch independent reads with `Promise.all` to minimize round-trip latency.
- **Caching:** TanStack React Query provides client-side server-state caching and revalidation; `viewport={{ once: true }}` avoids re-running scroll animations.
- **Optimistic UI:** booking cancellation updates local state immediately for responsiveness.
- **Lazy loading / pagination:** list reads accept `sort` + `limit`; the architecture supports pagination/`skip` for large collections, and route-level code-splitting (`React.lazy`) is a straightforward extension.
- **Lightweight records:** files stored as URLs (not blobs) keep documents small and queries fast.
- **Database indexing:** entity queries filter on high-selectivity fields (`student_email`, `tutor_id`, `status`) that should be indexed for scale.
- **Scalability:** serverless functions scale horizontally and statelessly; the BaaS data layer and managed storage scale independently of the frontend; the SPA is served as static assets via CDN.

---

## SECTION 15: DEPLOYMENT & INFRASTRUCTURE

- **Hosting / frontend deployment:** the Vite-built React SPA is served as static assets over a CDN by the Base44 platform; can additionally be packaged as iOS/Android apps from the same codebase.
- **Backend deployment:** serverless Deno functions are deployed and versioned by the platform; each function is an independent HTTP handler.
- **Database hosting:** managed, schema-driven entity database with built-in RLS — no self-managed DB servers.
- **Environment management:** secrets/environment variables (e.g., integration keys, the Google Sheets webhook URL) are managed via platform settings and injected at runtime; `BASE44_APP_ID` and auth tokens are provided by the platform.
- **Build tooling:** Vite for fast dev/build; Tailwind for styling; package management via npm with pinned versions.

---

## SECTION 16: SOFTWARE ENGINEERING SKILLS DEMONSTRATED

- Frontend development (React 18, Vite, component architecture)
- Backend development (Deno serverless functions, BaaS data layer)
- Database design & data modeling (8+ related entities, junction tables, normalization decisions)
- Authentication systems (OAuth/managed auth, session/token handling, auth context)
- Authorization systems & Role-Based Access Control (declarative row-level security)
- REST-style API design and SDK-driven data access
- File upload/storage systems (managed storage, signed URLs)
- Responsive, mobile-first design (Tailwind, breakpoint strategy)
- State management (React hooks + TanStack React Query + Context)
- Workflow automation (email notifications, lead sync, serverless triggers)
- Business logic development (booking & module state machines)
- Scheduling systems (availability + appointment lifecycle)
- Dashboard development (role-specific portals with metrics and widgets)
- Form validation & lead-capture funnels
- Third-party integration engineering (Google Apps Script, email, storage)
- UI/UX engineering (Framer Motion animation systems, accessibility via Radix, visual hierarchy)
- Component-driven design & separation of concerns
- Security engineering (defense-in-depth, least privilege, server-side trust boundary)

---

## SECTION 17: RESUME BULLETS

### 5 Concise Resume Bullets
1. Built a full-stack online tutoring platform (React, Tailwind, serverless Deno, BaaS) serving students, tutors, and admins.
2. Designed a relational data model of 8+ entities with row-level security enforcing role-based access.
3. Implemented an appointment-scheduling system with a Pending→Confirmed→Completed/Cancelled booking state machine.
4. Engineered a lead-capture funnel that persists to a database, triggers email notifications, and syncs to Google Sheets.
5. Developed role-specific dashboards with real-time data aggregation, progress metrics, and file-based module workflows.

### 10 Strong Resume Bullets
1. Architected a single-page React 18 application with centralized routing, a global auth context, and 25+ reusable, domain-scoped components.
2. Implemented role-based access control using declarative row-level security, scoping every read/write to the owning user or administrator.
3. Designed and shipped an appointment-management subsystem (availability slots + bookings) modeled as a finite state machine with optimistic UI updates.
4. Built a learning-module pipeline (assign → submit → grade) with document/image uploads stored as durable URLs via managed object storage and signed URLs for private files.
5. Developed a multi-channel lead-capture workflow that creates a database record, invokes a serverless email function, and POSTs to a Google Apps Script webhook in parallel with graceful degradation.
6. Authored Deno serverless functions using service-role credentials to send templated admin and parent emails with timezone-aware formatting.
7. Optimized dashboard performance by batching independent reads with `Promise.all` and caching server state with TanStack React Query.
8. Engineered a conversion-focused marketing site with Framer Motion scroll animations, accessible Radix-based UI, and a query-param-driven program-selection funnel.
9. Implemented an account-approval gating workflow that provisions profiles on first login and restricts portal access until administrator approval.
10. Established a defense-in-depth security posture combining client-side route guards with authoritative server-side authorization rules.

### 3 Portfolio Project Descriptions
1. **Open Minds Studios — Tutoring Platform:** A production-grade, full-stack web app for a tutoring business, featuring a marketing site, role-based dashboards for students/tutors/admins, an appointment-scheduling engine, and a file-based learning-module system. Built with React, Tailwind, and serverless functions on a BaaS backend with row-level security.
2. **Scheduling & Module Engine:** The operational core of the platform — a booking lifecycle state machine integrated with recurring tutor availability, plus an assignment→submission→grading module workflow backed by managed file storage.
3. **Lead-Capture & Integration Layer:** A conversion funnel that pre-selects programs from URL parameters, validates and persists inquiries, fires transactional emails via a serverless function, and mirrors every lead into Google Sheets through an Apps Script webhook.

### 3 LinkedIn Project Descriptions
1. Designed and built **Open Minds Studios**, a full-stack tutoring platform (React + serverless + BaaS) with role-based dashboards, secure authentication, and a complete appointment-scheduling system. Implemented row-level authorization, file uploads, and a multi-channel lead pipeline.
2. Engineered the **scheduling and learning-module systems** powering an online tutoring business: tutor availability, a Pending→Confirmed→Completed booking state machine, and an assign→submit→grade module workflow with document uploads and progress tracking.
3. Built a **lead-generation and integrations layer** that captures consultation requests, persists them with validation, sends transactional admin/parent emails from a Deno serverless function, and syncs submissions to Google Sheets via a webhook — designed for graceful failure and zero data loss.

---

## SECTION 18: INTERVIEW PREPARATION

**Q1. How is authorization enforced, and why isn't client-side guarding enough?**
**A.** Authorization is enforced server-side with row-level security (RLS) rules attached to every entity. Each rule scopes operations to the owning user (`{{user.id}}`/`{{user.email}}`) or admins. Client-side route/dashboard guards exist purely for UX — they prevent rendering the wrong screen, but they're not a security boundary. Even if a user bypassed the UI and called the data API directly, the database would refuse unauthorized rows. This is defense in depth with the trust boundary on the server.

**Q2. Walk me through the booking lifecycle and how you modeled it.**
**A.** A `Booking` has a `status` enum: Pending, Confirmed, Completed, Cancelled — a finite state machine. Students create Pending bookings tied to a tutor, course, and availability slot. Tutors/admins move them to Confirmed (optionally attaching a meeting link), then Completed after the session; Cancelled is reachable from Pending or Confirmed. Views derive `upcoming` (Pending/Confirmed) and `past` (Completed) client-side, and cancellations use optimistic UI for responsiveness while RLS guarantees only authorized parties can mutate the record.

**Q3. Why store file URLs on entities instead of the files themselves?**
**A.** Storing binaries on records bloats the database, slows queries, and hits size limits. Instead, uploads go to managed object storage and return a durable URL; the entity stores only the URL and filename. Private files use signed, time-limited URLs so access stays controlled. This keeps records small, queries fast, and storage independently scalable.

**Q4. How does the lead-capture flow guarantee reliability?**
**A.** On submit it does three things: (1) create the `Inquiry` record (source of truth), (2) invoke a serverless function that sends admin + parent emails, and (3) POST to a Google Sheets webhook. The Sheets sync runs in parallel and is non-blocking with graceful degradation — if the webhook URL is unset or fails, the database write and emails still succeed, so a lead is never lost. The UI surfaces explicit sending/success/error states.

**Q5. Why a BaaS + serverless architecture instead of a custom server?**
**A.** It removes undifferentiated heavy lifting — auth, RLS, managed DB, file storage, and email are provided and battle-tested, so engineering effort focuses on product logic. Serverless functions handle the custom pieces (templated emails, integrations) and scale statelessly. Trade-offs: less low-level control and some platform coupling, mitigated by keeping business logic in well-isolated functions and a clean entity model that could be ported to a conventional Postgres + REST stack.

**Q6. How would you scale this and add calendar sync?**
**A.** Add indexes on the high-selectivity filter fields (`student_email`, `tutor_id`, `status`), paginate list reads (`limit`/`skip`), and code-split routes with `React.lazy`. For calendar sync, I'd add a Google Calendar connector and a connector/entity automation: when a booking is Confirmed, a serverless function creates/updates the corresponding calendar event, keeping the app the source of truth and the calendar a synced projection.

**Q7. How do you handle a brand-new user with no profile yet?**
**A.** Dashboards authenticate, then look up the domain profile (`Student`/`Tutor`) by email; if none exists, they auto-create one with `approved: false`. Until an admin approves, the user sees a pending-approval screen instead of the portal. This cleanly separates identity (managed `User`) from operational profile and access state.

**Architecture & Design-Decision Highlights to Discuss**
- Separation of identity (`User`) from domain profiles (`Student`/`Tutor`) and from authorization flags (`approved`, `can_access_*`).
- Junction table (`TutorCourse`) for many-to-many tutor↔course mapping.
- Denormalized display fields on `Module`/`Booking` (e.g., `tutor_name`) traded for fewer client-side joins, with ids kept for integrity.
- Component-driven structure with strict single-responsibility files grouped by domain.
- Centralized design tokens and a deliberate visual hierarchy (pricing "staircase") tied to conversion goals.

---

*End of report.*