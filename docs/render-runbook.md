# Render provisioning runbook

Everything that could be validated without Render credentials has been, on
2026-09-09 (see the rehearsal results at the bottom). This is the sequence to
run once you have dashboard access.

Blocked on: a Render account, and the Namecheap login for step 3.

## 1. Provision the blueprint

Render dashboard → **New** → **Blueprint** → connect
`juanjbarreraj/open-minds-studios` → branch **`migration/remove-base44`**.

Confirm the remote actually has what you expect before provisioning — check
the remote, not the local log, because a local commit that has not been pushed
will not appear to Render:

```bash
git ls-remote --heads origin
```

`main` is the pre-migration Base44 baseline (`c28485e`) and is **not pushed at
all**, so it should not appear in Render's branch list. If it ever is pushed,
do not select it.

Render reads `render.yaml` and creates `openminds-api` with a 1 GB disk at
`/var/data`. Confirm before applying:

- **Region is `virginia`** and matches `render.yaml`. This is **permanent** —
  Render cannot move a service between regions, only recreate it. Oregon is the
  default when the key is absent, which would put ~75ms of latency between the
  studio's Pittsburgh families and the API instead of ~20ms.
- Plan is **Starter**, not Free. Free instances sleep and cold-start ~30s on
  the login page.
- `SESSION_SECRET` shows as *generated* — never paste one in. Note the
  consequence: the value lives with the service, so tearing the service down
  and recreating it mints a **new** secret and invalidates every existing
  session cookie. Everyone is silently logged out and has to sign in again.
  Not a bug, but do not recreate the service casually once families are using
  it, and expect support questions if you do.
- Disk mount path is `/var/data`, matching `DATABASE_PATH`, `UPLOADS_DIR`,
  `BACKUP_DIR`, and `EXPORT_DIR`.

Build is `npm ci`, start is `npm start`. No separate migrate step: the server
applies all 9 migrations on boot against an empty disk.

## 2. Confirm health on the Render URL

```bash
curl -s https://openminds-api.onrender.com/api/health
# expect: {"ok":true}
```

If this fails, read the deploy log before changing anything.

**The most likely failure, and it will not look like one.** `better-sqlite3`
(13.0.1) compiles a native binding during `npm ci`. Render builds on Linux; the
rehearsal below ran on macOS, so this specific step has never been exercised
for this project. A failure here surfaces as a **build error** — node-gyp,
Python, or a prebuild download — not as a configuration problem, so resist the
urge to start adjusting environment variables. If the prebuilt binary is
unavailable for Render's Node 22 image it falls back to compiling from source,
which needs build tooling present in the image.

**Migrations run on every boot, not as a separate step.** `createApp()` calls
`runMigrations()` (`server/app.js:13`), so deploy and migrate are coupled: a
migration that throws means the service does not start at all, rather than a
separate step failing while the old version keeps serving. That is what makes
the empty-disk rehearsal below meaningful, and it is why a new migration should
never be deployed without running it locally against a copy of the data first.

## 3. Custom domain and DNS  ← needs the Namecheap login

Render → service → **Settings → Custom Domains** → add
`api.openmindsstudios.com`. Render shows a CNAME target, typically
`openminds-api.onrender.com`.

At Namecheap → Advanced DNS, add:

| Type | Host | Value |
|---|---|---|
| CNAME | `api` | *(the target Render shows)* |

Do not guess the target; use the one Render prints. Wait for Render to report
the certificate as issued before step 5.

## 4. Bootstrap the first manager

Render → service → **Shell**:

```bash
MANAGER_EMAIL='<owner address>' MANAGER_PASSWORD='<strong, one-time>' \
  MANAGER_NAME='<name>' npm run db:create-manager
```

Change the password after the first sign-in. The script deletes nothing and
inserts no demo data, and refuses to run twice unless passed `--force`.

## 5. Verify login end to end  ← the real test

In a normal browser at https://openmindsstudios.com:

1. Sign in through **Student / Parent Login** with the manager account.
2. **Refresh the page.** The session must survive. This is the whole point:
   it is the only moment `SameSite=None` with
   `COOKIE_DOMAIN=.openmindsstudios.com` is genuinely exercised.
3. Open the manager dashboard and confirm the tabs load.

If the session does not survive a refresh, check in this order: the cookie was
actually set (DevTools → Application → Cookies), `CORS_ORIGIN` contains the
exact apex origin, and both hosts are on HTTPS. `Secure` cookies are dropped
over HTTP.

## 6. Backups — do NOT use a Render cron job

**A cron job cannot do this.** Render's docs are explicit: *"You can't add a
disk to a cron job service,"* and *"A persistent disk is accessible by only a
single service instance... You can't access a service's disk from any other
service."* A cron job runs in its own container with no view of
`/var/data`.

Verified what that would actually have done, before the guard below existed:
the job **exited 0**, printed "backup written", and produced a **4 KB file
containing zero tables**. Importing `database.js` opens a better-sqlite3
connection, which *creates* the missing file, so the old existence check
passed against a database SQLite had just conjured. Green cron job, nothing to
restore, and no way to notice until the day it mattered.

`createBackup()` now refuses to write a backup when the source has no tables,
and verifies the finished copy carries the schema. If this is ever wired
somewhere that cannot see the disk, it fails loudly and names the likely cause.

### The bigger problem: this is not a backup

`render.yaml` puts both on the same 1 GB volume:

| | Path |
|---|---|
| Database | `/var/data/openminds.db` |
| Backups | `/var/data/backups` |

A timestamped copy beside the original protects against *application* mistakes
— a bad migration, an accidental delete — and against nothing else. Disk
corruption, an accidental service teardown, or a region incident takes the
database and every backup together. **Until the R2 variables below are set,
there is no off-site copy of any student or tutor record.**

### The off-site copy: built, needs credentials

The code is in place. What is missing is a Cloudflare account, which is an
ownership decision rather than a technical one.

| Piece | File |
|---|---|
| Daily schedule, alerting, weekly report | `server/jobs/backupJob.js` |
| R2 upload | `server/db/offsite.js` |
| Manual run, for proving credentials | `npm run db:backup:offsite` |

It runs **inside the web service** (started from `server/index.js`, never from
`app.js`, so importing the app for tests cannot start timers or write files).
That placement is forced: the web service is the only process that can see the
disk. A Render background worker can mount a disk, unlike cron, but a disk is
single-instance, so a worker cannot attach to *this* disk either; it would need
an authenticated export endpoint to call, which is more moving parts for no
gain.

The schedule is catch-up, not wall clock: every hour it asks how old the newest
backup is and acts if that is over 23 hours. A deploy at 03:00 therefore cannot
skip a day, and two restarts in an hour cannot produce two backups.

**Variables.** All four are needed; with any missing, the schedule still takes
local backups and logs plainly that there is no off-site copy. It does not alert
on that, deliberately: it is a known state, and a daily alert about something
nobody intends to change today is an alert that gets ignored when it finally
matters. `GET /api/maintenance/backup-status` reports it instead.

| Variable | Value |
|---|---|
| `R2_ACCOUNT_ID` | From the Cloudflare dashboard; the endpoint is derived from it |
| `R2_ACCESS_KEY_ID` | R2 API token, **Object Read & Write**, scoped to the one bucket |
| `R2_SECRET_ACCESS_KEY` | Shown once at token creation |
| `R2_BUCKET` | For example `openminds-backups` |
| `R2_PREFIX` | Optional, default `db`. Keys are `<prefix>/YYYY-MM-DD/<filename>` |
| `BACKUP_ALERT_EMAIL` | Optional, default `openminds@openmindsstudios.com` |
| `BACKUP_SCHEDULE` | Optional, `on` or `off`. Default: on when `NODE_ENV=production` |

**Ownership.** The Cloudflare account and API token go in the **client's** name,
with credentials in the shared password manager. Not in a developer's personal
account, or the studio loses its backups the day that person is unavailable.

**What is tested and what is not.** The test suite runs the whole cycle against
a local stand-in for R2 and checks that one object is PUT into the bucket under
its prefix, that it is signed `AWS4-HMAC-SHA256`, and that the uploaded *bytes*
are a valid Open Minds database with its schema — not merely that a local file
was written. Also covered: the local backup still happens when the upload fails,
a failure emails an alert, repeat failures are throttled, and an unconfigured
deployment stays quiet and succeeds locally.

**Not covered: whether Cloudflare accepts the signature.** Only real
credentials can show that, so the first `npm run db:backup:offsite` from the
Render shell is a required step, not a formality. A signing or permission
problem shows up as a 403 naming the bucket.

### Monitoring: the silent failure, and what now listens

Silent success is fixed. The harder failure is **"never ran at all"**: a
schedule that stops firing after a deploy, a restart, or a crash produces no
error, no output, just an absence. Emailing on failure cannot catch it, because
the symptom *is* the absence of mail.

So there are two signals, and the second is the one that matters:

1. **On failure, an email.** Subject begins `ACTION NEEDED`, to
   `BACKUP_ALERT_EMAIL`. Throttled to one per six hours, because a broken disk
   would otherwise send one an hour until someone writes a filter rule that
   also hides the next real one. Backup failures and upload failures are
   reported separately: a failed upload says plainly that the local backup is
   fine and what is missing is the copy that survives losing the server.
2. **Weekly, a report whether or not anything is wrong.** Subject `Weekly
   backup report`, listing the local count, the newest backup, and the last
   off-site key. **This is the listener for "never ran at all."** A message you
   expect to receive converts silence into a signal: if a week passes with no
   report, the backups are not running and nothing is going to tell you.
   **Treat a missing report exactly like a failure notice.**

Both go through the existing outbox, so with `RESEND_API_KEY` unset they are
recorded and logged rather than lost, and nothing about them can fail a request.

`GET /api/maintenance/backup-status` (**manager-only**) reports:

```json
{"count":12,"latest_at":"2026-09-09T04:40:27.144Z","age_hours":6.2,"stale":false,
 "offsite":{"configured":true,"last_upload_at":"2026-09-09T04:40:28.001Z",
            "last_key":"db/2026-09-09/openminds-scheduled-....db","last_error":null}}
```

`stale` is true past 26 hours — a day plus room for a late run — **or when no
backup exists at all**. Age is read from the backup directory rather than a
recorded timestamp, so it cannot report success for a file that is not there.
`offsite.configured: false` is the plain statement that local copies are all
there is.

`GET /api/health` stays deliberately minimal (`{"ok":true}`) and public.
Render's health check reads the status code, not the body, so there is nothing
to gain by publishing more — and operational detail there would tell an
anonymous caller when backups run and whether the operator is currently blind.
In an application holding minors' records that is not a trade worth making.

**Still worth adding later:** an external uptime monitor, so that losing the
whole service is noticed by something other than a human expecting an email. The
status endpoint needs a manager session, so such a monitor needs either
credentials or a token-scoped variant of the route.

### Rehearsing a restore, specifically

An untested backup is a hypothesis, and it is easy to rehearse the wrong
thing. The criteria:

1. **Download from the off-site copy**, never the one on the disk. Restoring
   from the disk copy tests the path that will not exist on the day you need
   it.
2. **Restore into a fresh path**, never over the live database. Set
   `DATABASE_PATH` somewhere new for the drill.
3. **Compare per-table row counts** against the source. `npm run data:export`
   on both prints a count per dataset, which is the quickest diff.
4. **Confirm a known record survives** — a specific booking, a specific
   student — not merely that tables exist. Row counts can match while content
   is wrong.

Verified on 2026-09-09 that restoring onto a fresh, empty `DATABASE_PATH`
works: the pre-restore safety copy is skipped (correctly, there is nothing to
copy) and 18 tables with 4 users land. That is the mechanism; it still needs
rehearsing against a real off-site copy, which means downloading an object R2
actually holds. Do that drill the same day the credentials go in, while the
sequence is fresh, rather than discovering a gap during an incident.

Until then, `npm run db:backup` from the Render shell before any risky change
is the honest interim. Treat it as a pre-change snapshot, not disaster
recovery.

### Retention

Backups live on the same 1 GB volume as the database, so unbounded growth is a
slow-motion self-DoS: eventually the backups fill the disk and take down the
thing they exist to protect. At ~316 KB a day that is years away, but the
policy is cheap so it is already in place.

`createBackup()` prunes after each successful run — never before, so a pruning
fault cannot cost you the copy just taken. The policy keeps everything from the
last 30 days, then only the earliest backup in each calendar month. **Pre-restore
copies are never pruned**: each is the undo for a specific destructive restore,
they are rare, and losing one costs far more than the bytes.

Verified against a synthetic year: 365 daily plus 2 pre-restore copies reduced
to 44 files — 30 recent dailies, 12 monthlies, and both pre-restore copies
intact. That is roughly 14 MB steady state instead of 115 MB a year.

Set `BACKUP_RETENTION_DAYS=0` to disable pruning entirely.

## 7. Then, and only then

- Point the contact form back at the API (`src/api/inquirySubmit.js`, swap
  documented inline). This also clears the one red browser test.
- Implement an email provider behind `enqueue()` in
  `server/services/notificationService.js` — after the Workspace mailbox is
  confirmed alive.
- Merge `migration/remove-base44` into `main`. Not before: a failed deploy
  mid-merge leaves three candidate causes.

---

## Rehearsal results, 2026-09-09

Run locally with Render's exact `startCommand` and environment
(`NODE_ENV=production`, generated secret, production cookie and CORS values,
disk-style paths) against a throwaway database, since Render itself was not
reachable. The development database was verified untouched afterwards.

| Check | Result |
|---|---|
| `npm start` under `NODE_ENV=production` | Boots; logs "running with production cookie and secret rules" |
| Migrations on an empty database | All 9 applied automatically at boot |
| `GET /api/health` | `{"ok":true}`, 200 |
| `npm run db:create-manager` | Creates the account; reports success |
| `POST /api/auth/login` | 200; `role: manager`, `is_super_admin: true` |
| `Set-Cookie` | `Domain=.openmindsstudios.com; Path=/; HttpOnly; Secure; SameSite=None` — correct for cross-site |
| CORS headers | `Access-Control-Allow-Origin: https://openmindsstudios.com` (exact, not wildcard) + `Allow-Credentials: true` |
| Session reuse | `GET /api/auth/me` authenticates from the cookie |
| Manager authorization | `GET /api/inquiries` returns 200 for that session |
| `npm run db:backup` | Writes a consistent 316 KB copy without stopping the server |
| `npm run db:backup:offsite` | Backs up, then uploads to R2. Exits 1 and says so when R2 is unconfigured, so it cannot look like success |

**What this does not prove.**

- **Cross-site cookie acceptance.** The server emits correct attributes, but
  whether a *browser* honours them needs both hosts on real HTTPS. That is
  step 5 and cannot be faked locally.
- ~~**The Linux native build.**~~ **Now covered, by CI rather than by the
  rehearsal.** `.github/workflows/verify.yml` runs `npm ci` on
  `ubuntu-latest` with Node 22 on every push. On 2026-10-01 that install
  succeeded and the entire API suite passed on Linux — every one of those tests
  reads and writes through `better-sqlite3`, so the native module is exercised,
  not merely installed. (That run was still red overall, on the single known
  contact-form test and nothing else.) This was the largest remaining unknown
  about Render's build step and it is no longer one.
- **Anything about Render itself** — the disk mount, the region, the health
  check wiring, or cold-start behaviour. The rehearsal validates the
  application under Render's environment, not the platform.
