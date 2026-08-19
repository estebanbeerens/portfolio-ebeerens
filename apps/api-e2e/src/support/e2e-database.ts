import { createHash, randomBytes } from 'node:crypto';
import { Client } from 'pg';

const E2E_DATABASE_URL = 'postgresql://portfolio_e2e:portfolio_e2e@localhost:5434/portfolio_e2e';

export async function resetE2eDatabase() {
  const client = new Client({ connectionString: E2E_DATABASE_URL });
  await client.connect();
  await client.query('DELETE FROM "ActivityLog"');
  await client.query('DELETE FROM "Role"');
  await client.query('DELETE FROM "Organization"');
  await client.query('DELETE FROM "Skill"');
  await client.query('DELETE FROM "Profile"');
  await client.query('DELETE FROM "Session"');
  await client.end();
}

export async function createAuthenticatedSession() {
  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const client = new Client({ connectionString: E2E_DATABASE_URL });
  await client.connect();
  await client.query(
    'INSERT INTO "Session" ("id", "tokenHash", "githubUserId", "displayName", "expiresAt", "createdAt") VALUES ($1, $2, $3, $4, $5, $6)',
    ['session-e2e', tokenHash, 'e2e-admin', 'E2E Admin', new Date(Date.now() + 60 * 60 * 1000), new Date()]
  );
  await client.end();
  return { Cookie: `session=${token}` };
}
