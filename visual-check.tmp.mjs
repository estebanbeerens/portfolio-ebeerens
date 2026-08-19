import { chromium } from '@playwright/test';
import { createHash, randomBytes } from 'node:crypto';
import { Client } from 'pg';

const token = randomBytes(32).toString('hex');
const tokenHash = createHash('sha256').update(token).digest('hex');
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
await client.query(
  'INSERT INTO "Session" ("id", "tokenHash", "githubUserId", "displayName", "expiresAt", "createdAt") VALUES ($1,$2,$3,$4,$5,$6)',
  [
    randomBytes(16).toString('hex'),
    tokenHash,
    'visual-check',
    'Visual Check',
    new Date(Date.now() + 3600000),
    new Date(),
  ]
);
await client.end();

const browser = await chromium.launch();

async function shot(name, viewport, colorScheme) {
  const context = await browser.newContext({ viewport, colorScheme, baseURL: 'http://localhost:4300' });
  await context.addCookies([
    { name: 'session', value: token, domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax' },
  ]);
  const page = await context.newPage();
  await page.goto('/professional-journey');
  await page.getByRole('button', { name: 'New role' }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `/tmp/pj-${name}.png`, fullPage: true });
  await context.close();
}

await shot('light-desktop', { width: 1440, height: 900 }, 'light');
await shot('dark-desktop', { width: 1440, height: 900 }, 'dark');
await shot('light-mobile', { width: 390, height: 844 }, 'light');
await shot('dark-mobile', { width: 390, height: 844 }, 'dark');

await browser.close();
console.log('done');
