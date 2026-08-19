import { createHash, randomBytes } from 'node:crypto';
import { Page } from '@playwright/test';
import { Client } from 'pg';

const E2E_DATABASE_URL = 'postgresql://portfolio_e2e:portfolio_e2e@localhost:5434/portfolio_e2e';

export async function authenticate(page: Page): Promise<void> {
  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const client = new Client({ connectionString: E2E_DATABASE_URL });
  await client.connect();
  await client.query(
    'INSERT INTO "Session" ("id", "tokenHash", "githubUserId", "displayName", "expiresAt", "createdAt") VALUES ($1, $2, $3, $4, $5, $6)',
    [
      randomBytes(16).toString('hex'),
      tokenHash,
      'admin-e2e',
      'Admin E2E',
      new Date(Date.now() + 60 * 60 * 1000),
      new Date(),
    ]
  );
  await client.end();
  await page.context().addCookies([
    {
      name: 'session',
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}
