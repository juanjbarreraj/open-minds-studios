# Open Minds Studios

Tutoring platform for Open Minds Studios: a public marketing site plus student,
tutor, and manager portals.

- Frontend: React 18, Vite, Tailwind CSS, Radix/shadcn components
- Backend: Node.js, Express, SQLite (local development)

## Quick start

```bash
npm install
npm run db:seed   # create the local database and demo data
npm run dev       # starts the Express API and the Vite dev server together
```

Then open http://localhost:5173.

Full setup, demo login credentials, database commands, and testing notes are in
[LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md). Migration history and the current
state of the move off the previous hosted backend are in
[MIGRATION_STATUS.md](MIGRATION_STATUS.md).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Runs backend and frontend together |
| `npm run dev:client` | Vite dev server only (port 5173) |
| `npm run dev:server` | Express API only (port 3001) |
| `npm run build` | Production build of the frontend into `dist/` |
| `npm run lint` | ESLint over the project |
| `npm run typecheck` | TypeScript checkJs pass |
| `npm run db:migrate` | Apply pending SQL migrations |
| `npm run db:seed` | Reset application data and load demo records |
| `npm run db:reset` | Delete the database file, then migrate and seed |
| `npm run test:api` | Automated backend test suite against a temporary database |
