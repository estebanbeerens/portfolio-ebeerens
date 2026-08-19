import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { authenticate } from './support/authenticate';

test.beforeEach(async ({ page }) => {
  await authenticate(page);
});

test('manages an organization-grouped professional journey', async ({ page }) => {
  await page.goto('/professional-journey');

  await expect(page.getByRole('heading', { name: 'Professional Journey', exact: true })).toBeVisible();

  // Create the first role under a brand-new organization.
  await page.getByRole('button', { name: 'New role' }).click();
  await page.getByLabel('Job title').fill('Engineer');
  await page.getByLabel('Organization').selectOption({ label: '+ New organization' });
  await page.getByLabel('New organization name').fill('Acme Corp');
  await page.getByLabel('Start date').fill('2022-01-01');
  await page.getByLabel('End date').fill('2023-12-31');
  await page.getByRole('button', { name: 'Save role' }).click();

  await expect(page.getByText('Role created.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Acme Corp' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Engineer', exact: true })).toBeVisible();

  // Add a second role under the same organization; both should render under one group.
  await page.getByRole('button', { name: 'New role' }).click();
  await page.getByLabel('Job title').fill('Senior Engineer');
  await page.getByLabel('Organization').selectOption({ label: 'Acme Corp' });
  await page.getByLabel('Start date').fill('2024-01-01');
  await page.getByRole('button', { name: 'Save role' }).click();

  await expect(page.getByText('Role created.')).toBeVisible();
  const acmeGroup = page.locator('section', { has: page.getByRole('heading', { name: 'Acme Corp' }) });
  await expect(acmeGroup.getByRole('heading', { name: 'Engineer', exact: true })).toBeVisible();
  await expect(acmeGroup.getByRole('heading', { name: 'Senior Engineer' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Acme Corp' })).toHaveCount(1);

  // Edit the senior role.
  await acmeGroup
    .locator('article', { has: page.getByRole('heading', { name: 'Senior Engineer' }) })
    .getByRole('button', { name: 'Edit' })
    .click();
  await page.getByLabel('Job title').fill('Staff Engineer');
  await page.getByRole('button', { name: 'Save role' }).click();

  await expect(page.getByText('Role updated.')).toBeVisible();
  await expect(acmeGroup.getByRole('heading', { name: 'Staff Engineer' })).toBeVisible();

  // Delete the original role, requiring confirmation.
  await acmeGroup
    .locator('article', { has: page.getByRole('heading', { name: 'Engineer', exact: true }) })
    .getByRole('button', { name: 'Delete' })
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(acmeGroup.getByRole('heading', { name: 'Engineer', exact: true })).toBeVisible();

  await acmeGroup
    .locator('article', { has: page.getByRole('heading', { name: 'Engineer', exact: true }) })
    .getByRole('button', { name: 'Delete' })
    .click();
  await page.getByRole('button', { name: 'Delete role' }).click();

  await expect(page.getByText('Role deleted.')).toBeVisible();
  await expect(acmeGroup.getByRole('heading', { name: 'Engineer', exact: true })).toBeHidden();
  await expect(acmeGroup.getByRole('heading', { name: 'Staff Engineer' })).toBeVisible();

  const accessibility = await new AxeBuilder({ page }).include('main').analyze();
  expect(accessibility.violations).toEqual([]);
});
