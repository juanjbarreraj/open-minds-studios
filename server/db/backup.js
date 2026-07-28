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
  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`No database found at ${DB_PATH}. Run "npm run db:migrate" first.`);
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

  const { size } = fs.statSync(target);
  return { path: target, bytes: size };
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
