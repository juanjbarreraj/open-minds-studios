// Restore the local database from a backup file. Deliberately awkward: it
// requires an explicit path and --confirm, and it always takes a safety
// backup of the current database first.
import fs from 'node:fs';
import path from 'node:path';
import { DB_PATH, db } from './database.js';
import { createBackup, verifyBackup } from './backup.js';

const args = process.argv.slice(2);
const confirm = args.includes('--confirm');
const source = args.find((a) => !a.startsWith('--'));

if (!source) {
  console.error('Usage: npm run db:restore -- <backup-file> --confirm');
  console.error('       npm run db:restore -- server/backups/openminds-manual-....db --confirm');
  process.exit(1);
}

const resolved = path.resolve(source);

let info;
try {
  info = verifyBackup(resolved);
} catch (err) {
  console.error(`[db] ${err.message}`);
  process.exit(1);
}
console.log(`[db] backup verified: ${resolved} (${info.tables} tables)`);

if (!confirm) {
  console.error('[db] refusing to restore without --confirm. This replaces the current database.');
  console.error(`[db] re-run: npm run db:restore -- ${source} --confirm`);
  process.exit(1);
}

// Never destroy the current database without keeping a copy of it. Restoring
// onto a fresh, empty database is the primary disaster-recovery case, so
// "nothing to copy" is expected there, not a failure.
db.close();
const safety = await createBackup({ label: 'pre-restore', allowEmpty: true });
if (safety.skipped) {
  console.log(`[db] no pre-restore backup taken: ${safety.reason}`);
} else {
  console.log(`[db] current database saved to ${safety.path}`);
}

for (const suffix of ['-wal', '-shm']) {
  fs.rmSync(`${DB_PATH}${suffix}`, { force: true });
}
fs.copyFileSync(resolved, DB_PATH);
console.log(`[db] restored ${resolved} into ${DB_PATH}`);
console.log('[db] restart the API server so it reopens the restored file.');
