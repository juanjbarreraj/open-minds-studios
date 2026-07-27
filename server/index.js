import 'dotenv/config';
import { createApp } from './app.js';

const PORT = Number(process.env.PORT || 3001);
if (!process.env.SESSION_SECRET) {
  console.warn('[server] SESSION_SECRET not set; using a development-only default. Set it in .env for anything beyond local dev.');
}

const app = createApp();
app.listen(PORT, () => {
  console.log(`[server] Open Minds Studios local API listening on http://localhost:${PORT}`);
});
