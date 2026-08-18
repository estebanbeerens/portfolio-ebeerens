import { expect, test } from '@playwright/test';

test('renders the global theme control', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('button', { name: 'Toggle dark mode' })).toBeVisible();
});
