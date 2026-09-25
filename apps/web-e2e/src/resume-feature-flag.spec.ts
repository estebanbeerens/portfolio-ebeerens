import { expect, test } from '@playwright/test';
import { allFlagsEnabled, mockPortfolio } from './support/portfolio-mocks';

test('hides the resume route and nav link when the RESUME flag is disabled', async ({ page }) => {
  await mockPortfolio(page, {
    featureFlags: allFlagsEnabled().map((flag) => (flag.key === 'RESUME' ? { ...flag, enabled: false } : flag)),
  });

  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Primary navigation' });
  await expect(nav.getByRole('link', { name: 'Resume' })).toHaveCount(0);

  await page.goto('/resume');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});

test('renders the resume page when the RESUME flag is enabled', async ({ page }) => {
  await mockPortfolio(page);

  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Primary navigation' });
  await nav.getByRole('link', { name: 'Resume' }).click();

  await expect(page).toHaveURL(/\/resume$/);
  await expect(page.getByRole('heading', { name: 'Professional Journey' })).toBeVisible();
});
