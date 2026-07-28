// One command that verifies the whole local application: lint, types, build,
// the API suite, then a browser suite against a temporary stack it starts and
// stops itself. Nothing here touches the normal development database.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const stamp = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

// A throwaway database and uploads directory for the browser stack.
const TEST_DB = path.join(os.tmpdir(), `oms-e2e-${stamp}.db`);
const TEST_UPLOADS = path.join(os.tmpdir(), `oms-e2e-uploads-${stamp}`);
const API_PORT = 3101;
const CLIENT_PORT = 5199;

const started = [];
let failed = false;

function runStep(name, command, args, options = {}) {
  process.stdout.write(`\n=== ${name}\n`);
  const result = spawnSync(command, args, { cwd: ROOT, stdio: 'inherit', shell: false, ...options });
  if (result.status !== 0) {
    failed = true;
    process.stdout.write(`\n=== ${name} FAILED (exit ${result.status})\n`);
  }
  return result.status === 0;
}

function startBackground(name, command, args, env) {
  const child = spawn(command, args, {
    cwd: ROOT,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  started.push(child);
  const prefix = `[${name}] `;
  child.stdout.on('data', (d) => process.stdout.write(prefix + d.toString().replace(/\n(?!$)/g, `\n${prefix}`)));
  child.stderr.on('data', (d) => process.stderr.write(prefix + d.toString().replace(/\n(?!$)/g, `\n${prefix}`)));
  return child;
}

async function waitFor(url, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

function cleanup() {
  for (const child of started) {
    if (!child.killed) {
      try { process.kill(-child.pid, 'SIGTERM'); } catch { child.kill('SIGTERM'); }
    }
  }
  for (const suffix of ['', '-wal', '-shm']) {
    fs.rmSync(`${TEST_DB}${suffix}`, { force: true });
  }
  fs.rmSync(TEST_UPLOADS, { recursive: true, force: true });
}

process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(130); });

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

runStep('lint', npm, ['run', 'lint']);
runStep('typecheck', npm, ['run', 'typecheck']);
runStep('build', npm, ['run', 'build']);
runStep('api tests', npm, ['run', 'test:api']);

process.stdout.write('\n=== starting temporary local stack for browser tests\n');
const stackEnv = {
  DATABASE_PATH: TEST_DB,
  UPLOADS_DIR: TEST_UPLOADS,
  SESSION_SECRET: `e2e-${stamp}`,
  PORT: String(API_PORT),
  CORS_ORIGIN: `http://localhost:${CLIENT_PORT}`,
};

// Seed the throwaway database before the API opens it.
const seeded = spawnSync(process.execPath, [path.join(ROOT, 'server', 'db', 'seed.js')], {
  cwd: ROOT,
  env: { ...process.env, ...stackEnv },
  stdio: 'inherit',
});
if (seeded.status !== 0) {
  failed = true;
  process.stdout.write('\n=== seeding the temporary database FAILED\n');
}

if (!failed) {
  startBackground('api', process.execPath, [path.join(ROOT, 'server', 'index.js')], stackEnv);
  startBackground('web', npm, ['run', 'dev:client', '--', '--port', String(CLIENT_PORT), '--strictPort'], stackEnv);

  const apiUp = await waitFor(`http://localhost:${API_PORT}/api/health`);
  const webUp = apiUp && await waitFor(`http://localhost:${CLIENT_PORT}/api/health`);

  if (!apiUp || !webUp) {
    failed = true;
    process.stdout.write('\n=== the temporary stack did not become ready in time\n');
  } else {
    runStep('browser tests', process.execPath, [path.join(ROOT, 'server', 'test', 'uiTests.mjs')], {
      env: { ...process.env, UI_TEST_BASE_URL: `http://localhost:${CLIENT_PORT}` },
    });
  }
}

cleanup();
process.stdout.write(failed ? '\n=== test:all FAILED\n' : '\n=== test:all passed\n');
process.exit(failed ? 1 : 0);
