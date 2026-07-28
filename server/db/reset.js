// Deletes the local SQLite database, then re-runs migrations and seed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { DB_PATH, db } from './database.js';

db.close();
for (const suffix of ['', '-wal', '-shm']) {
  const p = `${DB_PATH}${suffix}`;
  if (fs.existsSync(p)) fs.rmSync(p);
}
console.log(`[db] removed ${DB_PATH}`);

// Re-seed in a fresh process so database.js reopens the file cleanly.
// fileURLToPath (not URL.pathname) so paths with spaces or non-ASCII work.
const seedPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'seed.js');
const seed = spawnSync(process.execPath, [seedPath], { stdio: 'inherit', env: process.env });
process.exit(seed.status ?? 0);
