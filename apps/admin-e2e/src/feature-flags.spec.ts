import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { authenticate } from './support/authenticate';
import { resetAdminE2eDatabase } from './support/e2e-database';

test.beforeEach(async ({ page }) => {
  await resetAdminE2eDatabase();
  await authenticate(page);
});

test('toggles a feature flag by clicking anywhere on its row', async ({ page }) => {
  await page.goto('/feature-flags');

  await expect(page.getByRole('heading', { name: 'Feature Flags' })).toBeVisible();
  const contactSwitch = page.getByRole('switch', { name: 'Contact feature flag' });
  await expect(contactSwitch).toHaveAttribute('aria-checked', 'false');

  // Click the row's label text, not the switch control itself, to prove the whole row is clickable.
  // The toggle stretches an invisible overlay across the row by design, so it's the element that
  // actually receives the click — force it through rather than fighting Playwright's actionability check.
  await page.getByRole('heading', { name: 'Contact', exact: true }).click({ force: true });

  await expect(page.getByText('Contact enabled.')).toBeVisible();
  await expect(contactSwitch).toHaveAttribute('aria-checked', 'true');

  const accessibility = await new AxeBuilder({ page }).include('main').analyze();
  expect(accessibility.violations).toEqual([]);
});
