import crypto from 'node:crypto';

export const newId = () => crypto.randomUUID();

export const newSessionToken = () => crypto.randomBytes(32).toString('hex');

export const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');
