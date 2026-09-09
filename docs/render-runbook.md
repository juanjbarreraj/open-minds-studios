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
database and every backup together. **Say it plainly: today there is no
off-site copy of any student or tutor record.**

### What to do instead

Run the backup inside the web service, which is the only process that can see
the disk, and push the copy off-site. Cloudflare R2 has a 10 GB free tier and
no egress charges; a 316 KB database will not approach it for years.

Two viable shapes:

1. **In-process schedule.** A small timer in the web service that calls
   `createBackup()` and uploads the result. Simplest, but it dies with the
   process and shares its memory.
2. **A Render background worker** *(workers can mount disks, unlike cron)* —
   but per the docs a disk is single-instance, so a worker cannot attach to
   the web service's disk either. It would need the API to expose an
   authenticated export endpoint the worker calls. More moving parts.

Option 1 is the right starting point.

**Ownership.** R2 needs a Cloudflare account and an API token. Like Render,
that is an ownership decision, not a technical one: it goes in the **client's**
name, with credentials in the shared password manager. Not in a developer's
personal account, or the studio loses its backups the day that person is
unavailable.

### Monitoring: OPEN, not done

Silent success is fixed. The remaining silent failure is **"never ran at
all"** — a scheduled backup that stops firing after a deploy, a restart, or a
crash produces no error, no output, just an absence.

**A signal exists. Nothing listens to it yet.** Do not tick "backup
monitoring" off the strength of the field below; a flag in a JSON response no
human ever reads is the same silence one level up.

`GET /api/maintenance/backup-status` (**manager-only**) reports:

```json
{"count":12,"latest_at":"2026-09-09T04:40:27.144Z","age_hours":6.2,"stale":false}
```

`stale` is true past 26 hours — a day plus room for a late run — **or when no
backup exists at all**. Age is read from the backup directory rather than a
recorded timestamp, so it cannot report success for a file that is not there.

`GET /api/health` stays deliberately minimal (`{"ok":true}`) and public.
Render's health check reads the status code, not the body, so there is nothing
to gain by publishing more — and operational detail there would tell an
anonymous caller when backups run and whether the operator is currently blind.
In an application holding minors' records that is not a trade worth making.

**To close this, pick one:**

1. **Stopgap:** a free uptime monitor with JSON keyword matching. Note the
   catch created by the fix above: the endpoint now needs a manager session,
   so a simple public poller cannot read it. Either give the monitor
   credentials or add a token-scoped variant.
2. **Better, and the real answer:** have the backup job email on failure once
   Resend lands (step 7 below). A push on failure beats a poll for absence,
   and it needs no extra service.

Until one of those exists, nobody finds out that backups stopped.

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
rehearsing against a real off-site copy once one exists.

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

**What this does not prove.**

- **Cross-site cookie acceptance.** The server emits correct attributes, but
  whether a *browser* honours them needs both hosts on real HTTPS. That is
  step 5 and cannot be faked locally.
- **The Linux native build.** The rehearsal ran on macOS with
  `better-sqlite3` already compiled. Render's `npm ci` compiles it fresh on
  Linux, and that path is untested here. See step 2.
- **Anything about Render itself** — the disk mount, the region, the health
  check wiring, or cold-start behaviour. The rehearsal validates the
  application under Render's environment, not the platform.
