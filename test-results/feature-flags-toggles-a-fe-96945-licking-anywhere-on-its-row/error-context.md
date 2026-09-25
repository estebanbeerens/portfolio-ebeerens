# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: feature-flags.spec.ts >> toggles a feature flag by clicking anywhere on its row
- Location: feature-flags.spec.ts:11:5

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/feature-flags", waiting until "load"

```

# Test source

```ts
  1  | import AxeBuilder from '@axe-core/playwright';
  2  | import { expect, test } from '@playwright/test';
  3  | import { authenticate } from './support/authenticate';
  4  | import { resetAdminE2eDatabase } from './support/e2e-database';
  5  |
  6  | test.beforeEach(async ({ page }) => {
  7  |   await resetAdminE2eDatabase();
  8  |   await authenticate(page);
  9  | });
  10 |
  11 | test('toggles a feature flag by clicking anywhere on its row', async ({ page }) => {
> 12 |   await page.goto('/feature-flags');
     |              ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  13 |
  14 |   await expect(page.getByRole('heading', { name: 'Feature Flags' })).toBeVisible();
  15 |   const contactSwitch = page.getByRole('switch', { name: 'Contact feature flag' });
  16 |   await expect(contactSwitch).toHaveAttribute('aria-checked', 'false');
  17 |
  18 |   // Click the row's label text, not the switch control itself, to prove the whole row is clickable.
  19 |   // The toggle stretches an invisible overlay across the row by design, so it's the element that
  20 |   // actually receives the click — force it through rather than fighting Playwright's actionability check.
  21 |   await page.getByRole('heading', { name: 'Contact', exact: true }).click({ force: true });
  22 |
  23 |   await expect(page.getByText('Contact enabled.')).toBeVisible();
  24 |   await expect(contactSwitch).toHaveAttribute('aria-checked', 'true');
  25 |
  26 |   const accessibility = await new AxeBuilder({ page }).include('main').analyze();
  27 |   expect(accessibility.violations).toEqual([]);
  28 | });
  29 |
```
