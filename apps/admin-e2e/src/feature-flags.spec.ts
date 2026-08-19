import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { authenticate } from './support/authenticate';

test.beforeEach(async ({ page }) => {
  await authenticate(page);
});

test('toggles a feature flag by clicking anywhere on its row', async ({ page }) => {
  await page.goto('/feature-flags');

  await expect(page.getByRole('heading', { name: 'Feature Flags' })).toBeVisible();
  const contactSwitch = page.getByRole('switch', { name: 'Contact feature flag' });
  await expect(contactSwitch).toHaveAttribute('aria-checked', 'false');

  // Click the row's label text, not the switch control itself, to prove the whole row is clickable.
  await page.getByRole('heading', { name: 'Contact', exact: true }).click();

  await expect(page.getByText('Contact enabled.')).toBeVisible();
  await expect(contactSwitch).toHaveAttribute('aria-checked', 'true');

  const accessibility = await new AxeBuilder({ page }).include('main').analyze();
  expect(accessibility.violations).toEqual([]);
});
