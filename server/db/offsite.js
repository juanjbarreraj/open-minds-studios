// Off-site copies of the database, in Cloudflare R2.
//
// Why this exists at all: `BACKUP_DIR` on Render points at `/var/data/backups`,
// the same 1 GB disk the live database sits on. A copy beside the original
// protects against a bad migration or a mistaken delete and against nothing
// else. Lose the disk, lose the region, or lose the account, and every student
// record goes with it. A backup is only a backup once it is somewhere else.
//
// R2 and not S3 for one reason that matters here: R2 charges nothing for egress,
// so a restore in an emergency has no cost attached to it. The free tier covers
// 10 GB, and this database is a few hundred kilobytes a day.
//
// Not a Render cron job. Cron containers get their own filesystem and cannot
// mount the web service's disk, so a cron backup would have run against an
// empty database and reported success. This runs inside the web service, which
// is the only process that can see the data. See `server/jobs/backupJob.js`.
//
// Credentials live in Render's environment and the studio's password manager,
// in the client's own Cloudflare account. With any of them missing this is a
// no-op that says so: an unconfigured deployment keeps working and keeps local
// backups, it just has no off-site copy, and the status endpoint reports that.
import fs from 'node:fs';
import path from 'node:path';
import { AwsClient } from 'aws4fetch';

const UPLOAD_TIMEOUT_MS = 60_000;

export function offsiteConfig() {
  const {
    R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET,
    R2_ENDPOINT, R2_PREFIX,
  } = process.env;

  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) return null;
  // R2_ENDPOINT is an override for testing against a local stand-in; normally
  // the account id is enough to derive it.
  const endpoint = R2_ENDPOINT || (R2_ACCOUNT_ID && `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`);
  if (!endpoint) return null;

  return {
    endpoint: endpoint.replace(/\/+$/, ''),
    bucket: R2_BUCKET,
    prefix: (R2_PREFIX || 'db').replace(/^\/+|\/+$/g, ''),
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  };
}

export const isOffsiteConfigured = () => offsiteConfig() !== null;

/**
 * Upload one backup file to R2.
 *
 * Returns `{ skipped: true }` when storage is not configured, so callers can
 * treat an unconfigured deployment as a normal state rather than an error.
 * Anything else that goes wrong throws: a failed off-site copy is a real
 * failure and the caller is expected to report it.
 */
export async function uploadBackup(filePath) {
  const config = offsiteConfig();
  if (!config) {
    return { skipped: true, reason: 'R2 is not configured (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET)' };
  }
  if (!fs.existsSync(filePath)) throw new Error(`Nothing to upload: ${filePath} does not exist`);

  const body = fs.readFileSync(filePath);
  if (body.length === 0) throw new Error(`Refusing to upload an empty file: ${filePath}`);

  // Keyed by date so the bucket browses chronologically, and by the original
  // filename so a key always identifies which local backup it came from.
  const key = `${config.prefix}/${new Date().toISOString().slice(0, 10)}/${path.basename(filePath)}`;
  const url = `${config.endpoint}/${config.bucket}/${key}`;

  const client = new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    service: 's3',
    // R2 ignores the region but SigV4 requires one in the signature.
    region: 'auto',
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
  try {
    const res = await client.fetch(url, {
      method: 'PUT',
      body,
      headers: { 'Content-Type': 'application/x-sqlite3', 'Content-Length': String(body.length) },
      signal: controller.signal,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`R2 rejected the upload (${res.status}): ${detail.slice(0, 300)}`);
    }
    return { ok: true, key, bytes: body.length };
  } finally {
    clearTimeout(timer);
  }
}

if (process.argv[1] && process.argv[1].endsWith('offsite.js')) {
  // Take a fresh backup and push it, which is also the way to prove
  // credentials work before trusting the schedule with them.
  const { createBackup } = await import('./backup.js');
  const backup = await createBackup({ label: 'offsite' });
  console.log(`[db] backup written to ${backup.path} (${(backup.bytes / 1024).toFixed(1)} KB, ${backup.tables} tables)`);

  let result;
  try {
    result = await uploadBackup(backup.path);
  } catch (err) {
    // A stack trace is not a diagnosis. Print what R2 said, which is usually
    // specific enough to act on: SignatureDoesNotMatch means the keys, 403 on
    // the bucket means the token's scope, NoSuchBucket means the name.
    console.error(`[db] OFF-SITE UPLOAD FAILED: ${err.message}`);
    console.error('[db] the local backup above is intact. What is missing is the copy that survives losing the server.');
    process.exit(1);
  }
  if (result.skipped) {
    console.log(`[db] off-site upload skipped: ${result.reason}`);
    console.log('[db] the local backup above is still a real backup, it is just on the same disk as the database.');
    process.exit(1);
  }
  console.log(`[db] uploaded to R2 as ${result.key} (${(result.bytes / 1024).toFixed(1)} KB)`);
}
