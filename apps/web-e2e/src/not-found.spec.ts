import { expect, test } from '@playwright/test';
import { mockPortfolio } from './support/portfolio-mocks';

test.beforeEach(async ({ page }) => {
  await mockPortfolio(page);
});

test('renders the 404 page for an unknown route and links back home', async ({ page }) => {
  await page.goto('/this-route-does-not-exist');

  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to home' }).click();

  await expect(page).toHaveURL('/');
});
