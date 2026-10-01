import 'dotenv/config';
import { createApp } from './app.js';
import { startBackupSchedule } from './jobs/backupJob.js';

const PORT = Number(process.env.PORT || 3001);
if (!process.env.SESSION_SECRET) {
  console.warn('[server] SESSION_SECRET not set; using a development-only default. Set it in .env for anything beyond local dev.');
}

const app = createApp();
const server = app.listen(PORT, () => {
  console.log(`[server] Open Minds Studios local API listening on http://localhost:${PORT}`);
  // Started here and not in app.js: the test suites import the app directly,
  // and importing an application must never start timers or write to a disk.
  startBackupSchedule();
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[server] Port ${PORT} is already in use. Stop the other process or set PORT in .env.`);
  } else {
    console.error('[server] Failed to start:', err);
  }
  process.exit(1);
});
