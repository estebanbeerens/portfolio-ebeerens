import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { authenticate } from './support/authenticate';

test.beforeEach(async ({ page }) => {
  await authenticate(page);
});

test('updates public Basic Info with semantic controls', async ({ page }) => {
  await page.goto('/basic-info');

  await expect(page.getByRole('heading', { name: 'Basic Info' })).toBeVisible();
  await page.getByLabel('Name').fill('Jane Doe');
  await page.getByLabel('Professional headline').fill('Frontend engineer');
  await page.getByLabel('Residence location').fill('Amsterdam, Netherlands');
  await page.getByLabel('GitHub URL').fill('https://github.com/jane-doe');
  await page.getByRole('tab', { name: 'Preview' }).click();
  await page.getByRole('tab', { name: 'Markdown' }).click();
  await page.locator('#profile-biography').fill('## Biography\n\nBuilding accessible interfaces.');
  await page.getByRole('button', { name: 'Save Basic Info' }).click();

  await expect(page.getByText('Basic Info saved.')).toBeVisible();
  await expect(page.getByLabel('GitHub URL')).toHaveValue('https://github.com/jane-doe');
  const accessibility = await new AxeBuilder({ page }).include('main').analyze();
  expect(accessibility.violations).toEqual([]);
});
