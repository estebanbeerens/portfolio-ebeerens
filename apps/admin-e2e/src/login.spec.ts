import { expect, test } from '@playwright/test';
import { authenticate } from './support/authenticate';
import { resetAdminE2eDatabase } from './support/e2e-database';

test.beforeEach(async () => {
  await resetAdminE2eDatabase();
});

test('shows the GitHub login entry point', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByRole('link', { name: 'Log in with GitHub' })).toBeVisible();
});

test('redirects an unauthenticated visitor to login', async ({ page }) => {
  await page.goto('/dashboard');

  await expect(page).toHaveURL(/\/login$/);
});

test('reaches the dashboard once authenticated', async ({ page }) => {
  await authenticate(page);
  await page.goto('/dashboard');

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
