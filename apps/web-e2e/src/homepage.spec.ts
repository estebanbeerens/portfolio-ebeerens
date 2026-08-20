import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/profile', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
        id: 'profile-1',
        name: 'Alex Mercer',
        headline: 'Full-Stack & Creative Tech',
        bio: 'Designing and engineering polished software with a physical sense of light, shadow, and tactical interactions.',
        location: 'Amsterdam, Netherlands',
        githubUrl: 'https://github.com/alex',
        linkedinUrl: 'https://linkedin.com/in/alex',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    });
  });

  await page.route('**/api/feature-flags', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: [
        { key: 'ROLES', enabled: true, updatedAt: '2026-01-01T00:00:00.000Z' },
        { key: 'PROJECTS', enabled: true, updatedAt: '2026-01-01T00:00:00.000Z' },
      ],
    });
  });

  await page.route('**/api/roles', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: [
        {
          id: 'role-1',
          jobTitle: 'Senior Developer',
          organization: { id: 'org-1', name: 'Nebula Labs', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
          startDate: '2023-01-01',
          skills: [{ id: 'skill-1', name: 'Angular' }],
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
        {
          id: 'role-2',
          jobTitle: 'Frontend Engineer',
          organization: { id: 'org-1', name: 'Nebula Labs', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
          startDate: '2021-01-01',
          endDate: '2022-12-31',
          skills: [{ id: 'skill-3', name: 'TypeScript' }],
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
    });
  });

  await page.route('**/api/projects', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: [
        {
          id: 'project-1',
          title: 'Aether Dashboard',
          slug: 'aether-dashboard',
          shortDescription: 'A real-time analytics cockpit.',
          description: 'Long description',
          startDate: '2024-01-01',
          skills: [{ id: 'skill-2', name: 'TypeScript' }],
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
    });
  });
});

test('renders the API-backed homepage sections accessibly', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Crafting fluid/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Professional Journey' })).toBeVisible();
  await expect(page.getByText('Nebula Labs')).toBeVisible();
  await expect(page.getByText('Frontend Engineer')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Engineered Artifacts' })).toBeVisible();
  await expect(page.getByText('Aether Dashboard')).toBeVisible();

  const accessibility = await new AxeBuilder({ page }).include('main').analyze();
  expect(accessibility.violations).toEqual([]);
});

test('navigates with routed header links and project slug cards', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'Resume' }).click();
  await expect(page).toHaveURL(/\/resume$/);
  await expect(page.getByRole('heading', { name: 'Resume' })).toBeVisible();

  await page.getByRole('link', { name: 'Projects' }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByRole('heading', { name: 'Engineered Artifacts' })).toBeVisible();

  await page.getByRole('link', { name: 'View project Aether Dashboard' }).click();
  await expect(page).toHaveURL(/\/projects\/aether-dashboard$/);
  await expect(page.getByRole('heading', { name: 'Aether Dashboard' })).toBeVisible();

  const detailAccessibility = await new AxeBuilder({ page }).include('main').analyze();
  expect(detailAccessibility.violations).toEqual([]);

  await page.getByRole('link', { name: 'Contact' }).click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.getByRole('heading', { name: 'Get In Touch' })).toBeVisible();
});
