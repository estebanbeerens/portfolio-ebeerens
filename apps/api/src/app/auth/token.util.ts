import { createHash, randomBytes } from 'node:crypto';

// Raw token goes in the cookie only; the hash is what's persisted.
export function generateSessionToken() {
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  return { token, tokenHash };
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
