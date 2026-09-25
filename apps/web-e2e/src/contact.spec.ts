import { expect, test } from '@playwright/test';
import { mockPortfolio } from './support/portfolio-mocks';
import { mockTurnstile } from './support/mock-turnstile';

test.beforeEach(async ({ page }) => {
  await mockPortfolio(page);
  await mockTurnstile(page);
});

test('submits the contact form and shows a success message', async ({ page }) => {
  await page.route('**/api/contact', async (route) => {
    await route.fulfill({ status: 201, contentType: 'application/json', json: { id: 'message-1' } });
  });

  await page.goto('/contact');

  await expect(page.getByRole('heading', { name: 'Get In Touch' })).toBeVisible();
  await page.getByLabel('Full name').fill('Jamie Rivera');
  await page.getByLabel('Email').fill('jamie@example.com');
  await page.getByLabel('Subject').fill('Project inquiry');
  await page.getByLabel('Message').fill('Would love to talk about a project.');

  await expect(page.getByText('Verification complete.')).toBeVisible();
  await page.getByRole('button', { name: 'Send message' }).click();

  await expect(page.getByText('Message sent')).toBeVisible();
});

test('shows an error banner when the API rejects the submission', async ({ page }) => {
  await page.route('**/api/contact', async (route) => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      json: { message: 'Turnstile verification failed' },
    });
  });

  await page.goto('/contact');

  await page.getByLabel('Full name').fill('Jamie Rivera');
  await page.getByLabel('Email').fill('jamie@example.com');
  await page.getByLabel('Subject').fill('Project inquiry');
  await page.getByLabel('Message').fill('Would love to talk about a project.');

  await expect(page.getByText('Verification complete.')).toBeVisible();
  await page.getByRole('button', { name: 'Send message' }).click();

  await expect(page.getByRole('alert').filter({ hasText: 'Turnstile verification failed' })).toBeVisible();
});
