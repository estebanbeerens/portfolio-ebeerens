import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { mockPortfolio, mockProjectsList } from './support/portfolio-mocks';

test.beforeEach(async ({ page }) => {
  await mockPortfolio(page);
  await mockProjectsList(page);
});

test('renders the home page content and passes an accessibility scan', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Crafting fluid/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Professional Journey' })).toBeVisible();
  await expect(page.getByText('Nebula Labs')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Engineered Artifacts' })).toBeVisible();
  await expect(page.getByText('Aether Dashboard')).toBeVisible();

  const accessibility = await new AxeBuilder({ page }).include('main').analyze();
  expect(accessibility.violations).toEqual([]);
});

test('navigates from home to the project directory and into a project detail page', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Projects' }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByRole('heading', { name: 'Project Directory' })).toBeVisible();

  await page.getByRole('heading', { name: 'Aether Dashboard' }).click();
  await expect(page).toHaveURL(/\/projects\/aether-dashboard$/);
  await expect(page.getByRole('heading', { name: 'Aether Dashboard' })).toBeVisible();

  await page.getByRole('link', { name: 'Go back to project directory' }).click();
  await expect(page).toHaveURL(/\/projects$/);
});
