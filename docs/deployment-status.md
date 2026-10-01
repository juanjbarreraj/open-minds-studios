# Deployment status

**Verified 2026-09-09.** Every claim below was checked against the live site or
the deployed bundle on that date. Where something was inferred rather than
observed, it says so.

Supersedes the deployment guesses in `LOCAL_DEVELOPMENT.md` section 12 and any
earlier summary that described the frontend as calling a relative `/api`.

## Current shape

| Layer | Host | State |
|---|---|---|
| Frontend | Netlify, building branch `migration/remove-base44` | **Live** at https://openmindsstudios.com |
| API | Render (blueprint in `render.yaml`) | **Not provisioned** |
| DNS | Namecheap (`dns1/dns2.registrar-servers.com`) | Migration off Wix complete |
| Mail | Google Workspace | DNS records intact; subscription status unverified |

## What is verified working

- **Apex serves the current build.** `openmindsstudios.com` returns 200 and the
  deployed bundle contains the logo-first redesign. `www` 301-redirects to apex.
- **Apex A records** point at Netlify (`75.2.60.5`, `99.83.231.61`).
- **The contact form reaches Netlify Forms.** `/forms/success.html` returns 200
  carrying `data-inquiry-received="true"`, which is exactly the marker
  `src/api/inquirySubmit.js` checks for, and `/forms/inquiry.html` carries the
  netlify attribute. The full round trip was replayed separately and returned
  200 with the marker; this repo's check stopped short of POSTing so as not to
  put a fake lead in the production submission store.

## The one blocker: the API host does not exist

`api.openmindsstudios.com` returns **NXDOMAIN**.

**The failure mechanism, precisely.** The deployed bundle
(`index-tz1MztOF.js`) contains:

```js
const ly = "https://api.openmindsstudios.com/api".replace(/\/$/, "")
```

`VITE_API_BASE_URL` **is already set** in Netlify's dashboard (not in
`netlify.toml`, which is why it is invisible in the repo). Vite baked the value
in at build time and dead-code-eliminated the `|| '/api'` fallback from
`src/api/apiClient.js` — the fallback string is absent from the bundle.

So the browser calls an absolute cross-origin URL whose host does not resolve.
`fetch` rejects at DNS, and the user sees **"Failed to fetch"**.

> **Do not** debug this as a Netlify redirect problem. Probing
> `openmindsstudios.com/api/health` returns 200 with the SPA shell, and
> `POST openmindsstudios.com/api/auth/login` returns 404 — but the app never
> calls either URL. Those responses describe a build that is not live and will
> send you into the wrong layer.

**Consequence.** Every authenticated feature is non-functional in production:
both logins, all three dashboards, booking, modules, invitations, progress, and
the manager tools. The marketing pages work because they are static.

**Fix.** Provision `render.yaml` and add the `api` DNS record. No frontend
rebuild and no environment change are required.

## Mail

DNS is healthy, which rules out records being lost when the domain left Wix:

| Record | Value |
|---|---|
| MX | `aspmx.l.google.com` + the four Google alternates |
| SPF | `v=spf1 include:_spf.google.com ~all` |
| TXT | `google-site-verification=5CMrIcNhGnQt6d0yHxgN-...` |

**The mailbox is confirmed working (2026-09-30).** This was previously the one
thing DNS could not settle, because a suspended Workspace account keeps valid MX
and simply refuses delivery. Both checks passed: the owner signed in at
`mail.google.com` as `openminds@openmindsstudios.com`, and a test message sent
from an outside account arrived. No Wix cancellation had taken the subscription
down. The email provider is unblocked.

## Contact form: working stopgap, deliberate trade-off

Enquiries currently go to Netlify Forms, not to the app's own API. That is a
working lead path and must **not** be switched back until the API is live —
doing so earlier trades a working path for a broken one.

The cost of the stopgap: enquiries never reach the `inquiries` table, so the
manager dashboard's Inquiries tab stays empty while parents are submitting. The
swap is documented inline at the top of `src/api/inquirySubmit.js`.

**The replacement is built and held, not pushed.** Branch
`feat/contact-pipeline` (local only) switches the form to `inquiriesApi.create`,
adds the Google Sheets webhook, and adds Resend delivery behind the outbox. It
is held deliberately: Netlify auto-deploys `migration/remove-base44`, so merging
it before `api.openmindsstudios.com` resolves would point the live form at a
host that does not exist and break the only working enquiry path. Merge it after
steps 1 and 2 below, not before.

## Known red test

On this branch `npm run test:all` is **275 API passed / 71 of 72 browser
passed**. The failure is `contact form shows a success state`.

This is a test-environment mismatch, not a production defect: the stopgap posts
to `/`, and a local Vite dev server answers that with the SPA shell rather than
Netlify's success page, so the client's marker check fails and the form renders
an error. On `feat/contact-pipeline` it passes, 72 of 72, which is the
confirmation that the swap works.

## Continuous integration

`.github/workflows/verify.yml` runs `npm run test:all` on every push and pull
request: lint, typecheck, build, the API suite, then the browser suite against a
temporary stack it starts and tears down itself.

It runs that one command rather than restating the stages as separate YAML
steps, so there is only one definition of what "verified" means. No secrets are
configured and none are needed: with `SHEETS_WEBHOOK_URL`, `RESEND_API_KEY` and
`MAIL_FROM` all unset, CI exercises the degraded paths, which is exactly the
behaviour a missing variable in production must have.

It also installs `better-sqlite3` on Linux on every run, which is the same
native-module risk the Render deployment carries, in a place where failing is
free. The workflow never deploys anything; it only reports.

**Expect it to be red on this branch,** on the one test described above and
nothing else. That is the honest state of the branch rather than a broken
pipeline: the stopgap cannot pass that test by construction. It goes green when
`feat/contact-pipeline` merges. If anything *other* than `contact form shows a
success state` fails, that is a real regression.

## Remaining work, in dependency order

Step-by-step commands, with the pre-flight rehearsal results, are in
[`render-runbook.md`](render-runbook.md).

1. **Provision Render** from `render.yaml`, branch `migration/remove-base44`.
   Verify the remote has your latest work with `git ls-remote --heads origin`
   before provisioning; a local commit that has not been pushed is invisible to
   Render. `main` is the pre-migration baseline (`c28485e`) and is not pushed.
2. **Add `api.openmindsstudios.com`** at Namecheap as a CNAME to Render's
   target; wait for TLS.
3. **Bootstrap the first manager**: `npm run db:create-manager` in a Render
   shell. There is deliberately no self-service path to a manager account.
4. **Verify login end to end on the real domain.** The highest-risk unknown in
   the list, and the only place `SameSite=None` with
   `COOKIE_DOMAIN=.openmindsstudios.com` is genuinely exercised. A session must
   survive a page refresh before anything else proceeds.
5. **Merge and push `feat/contact-pipeline`**, then submit the live form once and
   check three places: the Inquiries tab, the Google Sheet, and the mailbox. Not
   before step 2 resolves. Set `SHEETS_WEBHOOK_URL`, `RESEND_API_KEY` and
   `MAIL_FROM` in Render first (see the table at the end of this document);
   unset, each one degrades rather than fails, so a missing value costs the row
   or the email but never the enquiry.
6. **Off-site backups.** *Not* a Render cron job: cron containers cannot mount
   a disk, so the job would have run against an empty database. Worse,
   `render.yaml` currently keeps the database and its backups on the same 1 GB
   volume, so there is no off-site copy of any student record today. The
   backup must run inside the web service and push to object storage
   (Cloudflare R2's free tier is ample). See the runbook.
7. **Backup monitoring is OPEN.** `GET /api/maintenance/backup-status`
   (manager-only) reports age and a `stale` flag, but nothing polls it yet, so
   a backup that stops running is still unnoticed. Now that mail works, the
   cheapest close is email-on-failure through the same outbox, which needs step
   6 to exist first so there is a real failure to report.
8. **Merge the branch to `main`.** Housekeeping *after* provisioning: merging
   mid-provision means a failed deploy could be the blueprint, the branch, or
   the merge. Note `main` does not exist on the remote at all yet; locally it is
   still the pre-migration baseline `c28485e`.

## Audit: the create-on-open trap (2026-09-09)

`server/db/database.js` opens with `new Database(DB_PATH)` and no
`fileMustExist`, so **importing the module creates an empty database** at
whatever `DATABASE_PATH` points to. 23 modules import it. Any consumer that
checks `fs.existsSync` is therefore checking a file its own import just
created.

That behaviour is **correct and required** for the bootstrap paths — a fresh
Render disk has no database, and `db:migrate`, `db:seed`, `db:create-manager`,
and `db:reset` all legitimately create one. Making `database.js` refuse to
create would break first deploy. The exposure is confined to the *read-only*
consumers, which were audited individually:

| Entry point | Behaviour on an empty database | Status |
|---|---|---|
| `db:migrate` | Creates and migrates | Correct by design |
| `db:seed` | Migrates, then seeds | Correct by design |
| `db:create-manager` | Migrates, then inserts | Correct by design |
| `db:reset` | Deletes and recreates | Correct by design |
| `db:backup` | **Wrote a 4 KB empty file and exited 0** | Fixed: refuses, names the likely cause |
| `db:restore` | Aborted (the fix above over-corrected) | Fixed: an empty source is expected during recovery, so the safety copy is skipped |
| `data:export` | Threw a raw `SQLITE_ERROR` | Fixed: same guard, with a message that names the cause |

The shared predicate is `sourceHasSchema()` in `server/db/backup.js`. Anything
added later that reads the database rather than creating it should use it.

## Environment variables for the contact pipeline

These three belong in Render's environment **before** `feat/contact-pipeline` is
merged (step 5 above). All three are optional by design: unset means the feature
degrades to a logged record rather than failing, so a missing value never costs
an enquiry.

| Variable | Purpose | Unset behaviour |
|---|---|---|
| `SHEETS_WEBHOOK_URL` | The client's Apps Script webhook URL. The server POSTs the enquiry as JSON, 5s timeout, non-blocking. | Logs the payload it would have sent and continues |
| `RESEND_API_KEY` | Resend API key for transactional email. | Outbox rows stay `logged` and print to the service log; nothing is sent |
| `MAIL_FROM` | Sender address, for example `openminds@openmindsstudios.com`. Must be a domain verified in Resend. | Treated as unconfigured, same as no API key |

Both `RESEND_API_KEY` and `MAIL_FROM` must be present for mail to send:
`isMailConfigured()` requires both, so a half-configured deployment logs rather
than failing at send time.

**Deliverability.** `MAIL_FROM` needs its domain verified in Resend, which means
adding Resend's DKIM and SPF records at Namecheap. The existing SPF record is
`v=spf1 include:_spf.google.com ~all`, and Resend's include has to be merged
into that single record rather than added as a second TXT: a domain with two SPF
records fails SPF entirely. Test with Resend's sandbox sender
(`onboarding@resend.dev`) to a personal address before pointing `MAIL_FROM` at
the studio address.

Delivery outcomes are recorded on `notification_outbox`: `status` moves from
`logged` to `sent` or `failed`, alongside `sent_at`, `provider_message_id` and
`delivery_error` (migration `010_outbox_delivery.sql`). A failed send never
fails the request that triggered it, and never loses the message.
