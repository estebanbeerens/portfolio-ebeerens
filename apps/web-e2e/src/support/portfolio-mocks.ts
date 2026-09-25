import { Page } from '@playwright/test';

const now = '2026-01-01T00:00:00.000Z';

export const mockProfile = {
  id: 'profile-1',
  name: 'Alex Mercer',
  headline: 'Full-Stack & Creative Tech',
  bio: 'Designing and engineering polished software.',
  bioHtml: '<p>Designing and engineering polished software.</p>',
  location: 'Amsterdam, Netherlands',
  githubUrl: 'https://github.com/alex',
  linkedinUrl: 'https://linkedin.com/in/alex',
  updatedAt: now,
};

export const mockOrganization = { id: 'org-1', name: 'Nebula Labs', createdAt: now, updatedAt: now };

export const mockRoles = [
  {
    id: 'role-1',
    jobTitle: 'Senior Developer',
    organization: mockOrganization,
    startDate: '2023-01-01',
    skills: [{ id: 'skill-1', name: 'Angular' }],
    createdAt: now,
    updatedAt: now,
  },
];

export const mockProject = {
  id: 'project-1',
  title: 'Aether Dashboard',
  slug: 'aether-dashboard',
  shortDescription: 'A real-time analytics cockpit.',
  description: 'Long description',
  descriptionHtml: '<p>Long description</p>',
  startDate: '2024-01-01',
  skills: [{ id: 'skill-2', name: 'TypeScript' }],
  createdAt: now,
  updatedAt: now,
};

export function allFlagsEnabled() {
  return [
    { key: 'ROLES', enabled: true, updatedAt: now },
    { key: 'PROJECTS', enabled: true, updatedAt: now },
    { key: 'CONTACT', enabled: true, updatedAt: now },
    { key: 'RESUME', enabled: true, updatedAt: now },
  ];
}

/** Mocks the single bundled endpoint the home/resume pages read from. */
export async function mockPortfolio(page: Page, overrides: { featureFlags?: unknown[] } = {}) {
  await page.route('**/api/profile/public-portfolio', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
        profile: mockProfile,
        roles: mockRoles,
        projects: [mockProject],
        featureFlags: overrides.featureFlags ?? allFlagsEnabled(),
      },
    });
  });
}

/** Mocks the projects list/detail endpoints used by /projects and /projects/:slug. */
export async function mockProjectsList(page: Page) {
  await page.route('**/api/projects/public', async (route) => {
    await route.fulfill({ contentType: 'application/json', json: [mockProject] });
  });
  await page.route('**/api/projects/*/related', async (route) => {
    await route.fulfill({ contentType: 'application/json', json: [] });
  });
}
