import { expect, test } from '@playwright/test';

test('shows the GitHub login entry point', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByRole('link', { name: 'Log in with GitHub' })).toBeVisible();
});
