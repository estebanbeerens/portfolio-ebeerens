import { expect, test } from '@playwright/test';
import { authenticate } from './support/authenticate';
import { resetAdminE2eDatabase, seedContactMessage } from './support/e2e-database';

test.beforeEach(async ({ page }) => {
  await resetAdminE2eDatabase();
  await authenticate(page);
});

test('lists a submitted contact message, auto-marks it read on selection, and can toggle it back to unread', async ({
  page,
}) => {
  await seedContactMessage({ subject: 'Project inquiry' });

  await page.goto('/messages');

  await expect(page.getByRole('heading', { name: 'Messages' })).toBeVisible();
  await page.getByRole('button', { name: /Jamie Rivera/ }).click();

  await expect(page.getByRole('heading', { name: 'Project inquiry' })).toBeVisible();
  await expect(page.getByRole('paragraph').filter({ hasText: 'Would love to talk about a project.' })).toBeVisible();

  // Selecting an unread message marks it read automatically.
  await expect(page.getByRole('button', { name: 'Mark as unread' })).toBeVisible();

  await page.getByRole('button', { name: 'Mark as unread' }).click();
  await expect(page.getByRole('button', { name: 'Mark as read' })).toBeVisible();
});
