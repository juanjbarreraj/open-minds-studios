// Deletes the local SQLite database, then re-runs migrations and seed.
import fs from 'node:fs';
import { DB_PATH, db } from './database.js';

db.close();
for (const suffix of ['', '-wal', '-shm']) {
  const p = `${DB_PATH}${suffix}`;
  if (fs.existsSync(p)) fs.rmSync(p);
}
console.log(`[db] removed ${DB_PATH}`);

// Re-import in a fresh process so database.js reopens the file cleanly.
const { spawnSync } = await import('node:child_process');
const seed = spawnSync(process.execPath, [new URL('./seed.js', import.meta.url).pathname], {
  stdio: 'inherit',
  env: process.env,
});
process.exit(seed.status ?? 0);
