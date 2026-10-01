// The daily backup, scheduled inside the web service.
//
// It lives here rather than in a Render cron job because a cron container has
// its own filesystem and cannot mount the web service's disk: it would open a
// path that does not exist, better-sqlite3 would create an empty database at
// it, and the job would report success while backing up nothing. The process
// that can see the data is the only process that can back it up.
//
// Two failures are being defended against, and they are not the same:
//
//   1. A backup that fails. Loud by nature once anything watches for it, and
//      this emails on failure.
//   2. A backup that never runs at all. Silent by nature. No error is raised
//      because no code executes. Emailing only on failure cannot catch this,
//      because the symptom is the absence of mail. The weekly summary below
//      exists for exactly this: a message you expect to receive turns silence
//      into a signal.
//
// Catch-up rather than a wall-clock cron: on boot, and every hour after, it
// asks how old the newest backup is and acts if that is more than a day. A
// deploy at 03:00 therefore cannot skip the day, and two restarts in an hour
// cannot produce two backups.
import fs from 'node:fs';
import path from 'node:path';
import { createBackup, latestBackupAge, BACKUP_DIR } from '../db/backup.js';
import { uploadBackup, isOffsiteConfigured } from '../db/offsite.js';
import { enqueueNotification } from '../services/notificationService.js';

const CHECK_INTERVAL_MS = 60 * 60 * 1000;
// Slightly under 24h so a check that lands a few minutes late cannot push the
// backup into the following day, one hour at a time.
const BACKUP_DUE_HOURS = 23;
const ALERT_THROTTLE_HOURS = 6;
const HEARTBEAT_DAYS = 7;

const STATE_FILE = () => path.join(BACKUP_DIR, 'schedule-state.json');

// State on the disk rather than in the database, because the database is the
// thing being protected: recording "the backup worked" inside it would be
// unreadable in precisely the situation where the answer matters.
export function readState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE(), 'utf8'));
  } catch {
    return { last_offsite_at: null, last_offsite_key: null, last_error: null, last_alert_at: null, last_heartbeat_at: null };
  }
}

function writeState(patch) {
  const next = { ...readState(), ...patch };
  try {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    fs.writeFileSync(STATE_FILE(), JSON.stringify(next, null, 2));
  } catch (err) {
    console.error('[backup-job] could not write schedule state:', err.message);
  }
  return next;
}

const hoursSince = (iso) => (iso ? (Date.now() - new Date(iso).getTime()) / 3_600_000 : Infinity);

const alertEmail = () => process.env.BACKUP_ALERT_EMAIL || 'openminds@openmindsstudios.com';

/**
 * Whether a backup is due. Pure, so the decision can be tested without
 * touching a disk or waiting a day.
 *
 * @param {number|null} ageHours age of the newest backup, null when there is none
 */
export function backupIsDue(ageHours, dueHours = BACKUP_DUE_HOURS) {
  return ageHours === null || ageHours >= dueHours;
}

function alert(subject, body) {
  const state = readState();
  if (hoursSince(state.last_alert_at) < ALERT_THROTTLE_HOURS) {
    // A broken disk would otherwise send one email an hour, which gets a rule
    // written against it and then nobody sees the next real one.
    console.error(`[backup-job] suppressing a repeat alert (last one ${Math.round(hoursSince(state.last_alert_at))}h ago): ${subject}`);
    return;
  }
  enqueueNotification({
    recipient: alertEmail(),
    subject,
    body,
    eventType: 'backup.alert',
  });
  writeState({ last_alert_at: new Date().toISOString() });
}

function maybeHeartbeat() {
  const state = readState();
  if (hoursSince(state.last_heartbeat_at) < HEARTBEAT_DAYS * 24) return;

  const local = latestBackupAge();
  enqueueNotification({
    recipient: alertEmail(),
    subject: 'Weekly backup report: Open Minds Studios',
    body: [
      'The weekly automatic check on the Open Minds Studios database backups.',
      '',
      `Local backups kept:  ${local.count}`,
      `Newest backup:       ${local.latest_at || '(none)'}`,
      `Off-site copy:       ${state.last_offsite_at ? `${state.last_offsite_at} (${state.last_offsite_key})` : 'none yet'}`,
      '',
      'This message is the point of the exercise. If a week goes by and it does',
      'not arrive, the backups are not running and nobody has been told, which',
      'is the failure that no error message can report. Treat a missing report',
      'the same way you would treat a failure notice.',
    ].join('\n'),
    eventType: 'backup.heartbeat',
  });
  writeState({ last_heartbeat_at: new Date().toISOString() });
}

/** One cycle: back up if due, push it off-site, report what happened. */
export async function runBackupCycle({ force = false } = {}) {
  const { age_hours: ageHours } = latestBackupAge();
  if (!force && !backupIsDue(ageHours)) {
    maybeHeartbeat();
    return { skipped: true, reason: `the newest backup is ${ageHours}h old` };
  }

  let backup;
  try {
    backup = await createBackup({ label: 'scheduled' });
    console.log(`[backup-job] wrote ${backup.path} (${(backup.bytes / 1024).toFixed(1)} KB, ${backup.tables} tables)`);
  } catch (err) {
    writeState({ last_error: `backup: ${err.message}` });
    alert(
      'ACTION NEEDED: the Open Minds Studios backup failed',
      `The scheduled database backup could not be written.\n\n${err.message}\n\n` +
      'Until this is fixed there is no new copy of any student, tutor, or ' +
      'session record. The usual cause is the persistent disk not being ' +
      'visible to the process, or being full.'
    );
    return { ok: false, stage: 'backup', error: err.message };
  }

  if (!isOffsiteConfigured()) {
    // Deliberately not an alert. It is a known, documented state, and an alert
    // that fires every day on something nobody intends to change today is an
    // alert that gets ignored when it finally means something.
    console.log('[backup-job] no off-site copy: R2 is not configured, so this backup is on the same disk as the database.');
    writeState({ last_error: null });
    maybeHeartbeat();
    return { ok: true, offsite: false, path: backup.path };
  }

  try {
    const uploaded = await uploadBackup(backup.path);
    console.log(`[backup-job] off-site copy at ${uploaded.key}`);
    writeState({ last_offsite_at: new Date().toISOString(), last_offsite_key: uploaded.key, last_error: null });
    maybeHeartbeat();
    return { ok: true, offsite: true, key: uploaded.key };
  } catch (err) {
    writeState({ last_error: `offsite: ${err.message}` });
    alert(
      'ACTION NEEDED: the Open Minds Studios off-site backup failed',
      `The database was backed up locally, but the copy could not be uploaded ` +
      `to Cloudflare R2.\n\n${err.message}\n\nThe local backup is fine. What is ` +
      'missing is the copy that survives losing the server, so this is worth ' +
      'fixing promptly rather than urgently. Check the R2 credentials in ' +
      "Render's environment and that the bucket still exists."
    );
    return { ok: false, stage: 'offsite', error: err.message };
  }
}

/**
 * Start the hourly schedule. Called from server/index.js only, never from
 * app.js: importing the app to run tests must not start timers or write files.
 *
 * Enabled in production and off everywhere else, so no local or CI run ever
 * writes a backup by surprise. `BACKUP_SCHEDULE=on` forces it on, `off` forces
 * it off.
 */
export function startBackupSchedule() {
  const setting = process.env.BACKUP_SCHEDULE;
  const enabled = setting ? setting === 'on' : process.env.NODE_ENV === 'production';
  if (!enabled) return null;

  const cycle = () => {
    runBackupCycle().catch((err) => console.error('[backup-job] cycle threw:', err));
  };

  // Not immediately on boot: let the server finish coming up and pass its
  // health check first, so a slow backup cannot look like a failed deploy.
  const first = setTimeout(cycle, 60_000);
  const repeat = setInterval(cycle, CHECK_INTERVAL_MS);
  // Timers must not hold the process open during a restart or a shutdown.
  first.unref?.();
  repeat.unref?.();

  console.log(
    `[backup-job] scheduled: checking hourly, backing up when the newest copy is over ${BACKUP_DUE_HOURS}h old` +
    `${isOffsiteConfigured() ? ' with an off-site copy to R2' : ', LOCAL ONLY (R2 not configured)'}`
  );
  return { first, repeat };
}
