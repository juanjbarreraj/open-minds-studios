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

export async function createBackup({ label = 'manual' } = {}) {
  // An existence check is not enough. Importing database.js opens a
  // better-sqlite3 connection, and that CREATES the file when it is missing,
  // so by the time this runs the path always exists. Backing up the empty
  // database it just created would report success and produce a 4 KB file
  // with no tables, which is the worst possible failure for a backup tool:
  // green output, nothing to restore. Check for actual content instead.
  assertSourceHasSchema();
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
  return { path: target, bytes: size, tables };
}

// The source must be a populated database, not a file SQLite conjured on open.
function assertSourceHasSchema() {
  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`No database found at ${DB_PATH}.`);
  }
  const probe = new Database(DB_PATH, { readonly: true, fileMustExist: true });
  try {
    const { n } = probe
      .prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table'")
      .get();
    if (n === 0) {
      throw new Error(
        `The database at ${DB_PATH} is empty (no tables). Refusing to write an ` +
        'empty backup. On a hosted deployment this usually means the process ' +
        'cannot see the persistent disk: Render cron jobs, for example, run in ' +
        'their own container and cannot mount the web service\'s disk.'
      );
    }
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
  console.log('[db] the development server does not need to be stopped: the copy is transactionally consistent.');
}
