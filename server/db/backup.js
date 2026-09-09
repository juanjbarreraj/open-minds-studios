// Timestamped copy of the local SQLite database, written outside the active
// database directory. Uses SQLite's own backup API, so the copy is consistent
// even while the dev server is running: no need to stop it first.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { DB_PATH } from './database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '..', 'backups');

// Filesystem-safe UTC stamp: 2026-07-28T14-31-05-123Z
const stamp = () => new Date().toISOString().replace(/[:.]/g, '-');

/**
 * @param {{ label?: string, allowEmpty?: boolean }} [options]
 *   `allowEmpty` is for the safety copy taken before a restore, where an empty
 *   source is the normal disaster-recovery case rather than a fault. It skips
 *   the copy instead of writing a useless empty file.
 */
export async function createBackup({ label = 'manual', allowEmpty = false } = {}) {
  // An existence check is not enough. Importing database.js opens a
  // better-sqlite3 connection, and that CREATES the file when it is missing,
  // so by the time this runs the path always exists. Backing up the empty
  // database it just created would report success and produce a 4 KB file
  // with no tables, which is the worst possible failure for a backup tool:
  // green output, nothing to restore. Check for actual content instead.
  if (!sourceHasSchema()) {
    if (allowEmpty) return { skipped: true, reason: 'the current database is empty, so there was nothing to copy' };
    throw new Error(
      `The database at ${DB_PATH} is empty (no tables). Refusing to write an ` +
      'empty backup. On a hosted deployment this usually means the process ' +
      'cannot see the persistent disk: Render cron jobs, for example, run in ' +
      "their own container and cannot mount the web service's disk."
    );
  }
  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const target = path.join(BACKUP_DIR, `openminds-${label}-${stamp()}.db`);
  if (fs.existsSync(target)) {
    // Existing backups are never overwritten.
    throw new Error(`Backup ${target} already exists.`);
  }

  const source = new Database(DB_PATH, { readonly: true });
  try {
    await source.backup(target);
  } finally {
    source.close();
  }

  // Confirm the copy carries the schema before calling it a backup.
  const { tables } = verifyBackup(target);
  const { size } = fs.statSync(target);

  // Prune only after the new copy is verified, so a pruning fault can never
  // cost us the backup we just took.
  let pruned = { removed: [], kept: 0 };
  try {
    pruned = pruneBackups();
  } catch (err) {
    console.error('[db] backup retention failed (the new backup is safe):', err.message);
  }

  return { path: target, bytes: size, tables, pruned: pruned.removed.length };
}

// True when the source is a populated database rather than a file SQLite
// conjured into existence the moment database.js was imported.
export function sourceHasSchema(file = DB_PATH) {
  if (!fs.existsSync(file)) return false;
  const probe = new Database(file, { readonly: true, fileMustExist: true });
  try {
    return probe
      .prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table'")
      .get().n > 0;
  } finally {
    probe.close();
  }
}

// A usable backup must be a real SQLite file with this application's schema.
export function verifyBackup(file) {
  if (!fs.existsSync(file)) throw new Error(`Backup file not found: ${file}`);
  const probe = new Database(file, { readonly: true, fileMustExist: true });
  try {
    const integrity = probe.pragma('integrity_check', { simple: true });
    if (integrity !== 'ok') throw new Error(`Backup failed its integrity check: ${integrity}`);
    const tables = probe
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all()
      .map((r) => r.name);
    for (const required of ['users', 'students', 'tutors', 'bookings', 'schema_migrations']) {
      if (!tables.includes(required)) {
        throw new Error(`That file is not an Open Minds Studios database (missing table "${required}").`);
      }
    }
    return { tables: tables.length };
  } finally {
    probe.close();
  }
}

if (process.argv[1] && process.argv[1].endsWith('backup.js')) {
  const result = await createBackup();
  console.log(`[db] backup written to ${result.path} (${(result.bytes / 1024).toFixed(1)} KB)`);
  if (result.pruned) console.log(`[db] retention removed ${result.pruned} older backup(s)`);
  console.log('[db] the development server does not need to be stopped: the copy is transactionally consistent.');
}

/**
 * Age of the most recent backup, for health reporting.
 *
 * A scheduled backup that silently stops running is invisible by design: no
 * error, no output, just an absence. Surfacing the age turns that absence into
 * something monitorable. Read from the directory rather than a written
 * timestamp, so it cannot claim success for a file that is not there.
 */
export function latestBackupAge() {
  if (!fs.existsSync(BACKUP_DIR)) return { count: 0, latest_at: null, age_hours: null };
  const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith('.db'));
  if (files.length === 0) return { count: 0, latest_at: null, age_hours: null };

  const newest = files
    .map((f) => fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs)
    .reduce((a, b) => Math.max(a, b), 0);

  return {
    count: files.length,
    latest_at: new Date(newest).toISOString(),
    age_hours: Math.round(((Date.now() - newest) / 3_600_000) * 10) / 10,
  };
}

/**
 * Retention. Backups share the volume with the database they protect, so
 * unbounded growth eventually fills the disk and takes down the very thing
 * they exist to safeguard. At ~316 KB a day that is years away on a 1 GB
 * disk, but the failure mode is a slow self-inflicted outage, so it is worth
 * bounding.
 *
 * Policy: keep everything from the last `keepDays`, and beyond that keep only
 * the earliest backup in each calendar month. Pre-restore copies are never
 * pruned: each one is the undo for a specific destructive restore, they are
 * rare, and losing one costs far more than the bytes it occupies.
 *
 * Returns what it removed rather than logging directly, so callers decide how
 * loud to be. Set BACKUP_RETENTION_DAYS=0 to disable.
 */
export function pruneBackups({ keepDays = Number(process.env.BACKUP_RETENTION_DAYS ?? 30) } = {}) {
  if (!keepDays || !fs.existsSync(BACKUP_DIR)) return { removed: [], kept: 0 };

  const entries = fs.readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith('.db'))
    .map((f) => ({ name: f, mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs }))
    .sort((a, b) => a.mtime - b.mtime);

  const cutoff = Date.now() - keepDays * 86_400_000;
  const monthlyKept = new Set();
  const removed = [];

  for (const entry of entries) {
    // Never prune the safety copy taken before a restore.
    if (entry.name.includes('-pre-restore-')) continue;
    if (entry.mtime >= cutoff) continue;

    const month = new Date(entry.mtime).toISOString().slice(0, 7);
    if (!monthlyKept.has(month)) {
      // Oldest survivor in this month becomes the monthly.
      monthlyKept.add(month);
      continue;
    }
    fs.rmSync(path.join(BACKUP_DIR, entry.name), { force: true });
    removed.push(entry.name);
  }

  return { removed, kept: entries.length - removed.length };
}
