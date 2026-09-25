import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { authenticate } from './support/authenticate';
import { resetAdminE2eDatabase } from './support/e2e-database';

test.beforeEach(async ({ page }) => {
  await resetAdminE2eDatabase();
  await authenticate(page);
});

test('creates and lists a project', async ({ page }) => {
  await page.goto('/projects');

  await expect(page.getByRole('heading', { name: 'Projects', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'New project' }).click();

  await page.getByLabel('Title').fill('Aether Dashboard');
  await page.getByLabel('Slug').fill('aether-dashboard');
  await page.getByLabel('Short description (English)').fill('A real-time analytics cockpit.');
  await page.locator('#project-description').fill('Long form project description.');
  await page.getByLabel('Start date').fill('2024-01-01');
  await page.getByRole('button', { name: 'Save project' }).click();

  await expect(page.getByText('Project created.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Aether Dashboard', level: 2 })).toBeVisible();

  const accessibility = await new AxeBuilder({ page }).include('main').analyze();
  expect(accessibility.violations).toEqual([]);
});
