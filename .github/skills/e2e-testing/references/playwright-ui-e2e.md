# Playwright UI E2E Conventions (admin-e2e, web-e2e)

## Config
- Each project has its own `playwright.config.mts`, built on `nxE2EPreset()` from `@nx/playwright/preset`.
- The `.mts` extension is intentional — it forces ESM regardless of the workspace's `type`, so Playwright's config loader and Nx's native TS strip both handle it correctly. Don't rename it to `.ts`.
- `baseURL` defaults to `http://localhost:4200`, overridable via the `BASE_URL` env var (useful for pointing at a deployed environment in CI).
- `webServer` auto-starts the app under test (`npx nx run <app>:serve`) with `reuseExistingServer: true` — don't manually start the dev server before running tests.
- `trace: 'on-first-retry'` — traces are only captured on retry, not on every run.

## Writing Specs
- Location: `apps/<app>-e2e/src/*.spec.ts`
- Import from `@playwright/test`: `import { test, expect } from '@playwright/test';`
- Navigate relative to `baseURL`: `await page.goto('/')`, not an absolute URL.
- Prefer semantic locators in this order: `getByRole`, `getByLabel`, `getByText`, then `locator()` with a `data-testid` as a last resort.
- Existing pattern (from `example.spec.ts`, identical in both `admin-e2e` and `web-e2e`):
  ```ts
  test('has title', async ({ page }) => {
    await page.goto('/');
    expect(await page.locator('h1').innerText()).toContain('Welcome');
  });
  ```
  Prefer `page.getByRole('heading', { name: /welcome/i })` over `page.locator('h1')` once real content replaces the placeholder.

## Running
- `npx nx e2e admin-e2e` / `npx nx e2e web-e2e` — the target is inferred by `@nx/playwright/plugin`, not declared explicitly in `project.json`.
- Add `--ui` for the interactive Playwright UI runner, `--debug` to step through, `--headed` to watch the browser.
- `implicitDependencies` in `project.json` (e.g. `admin-e2e` depends on `admin`) ensures Nx builds the app first.

## Adding a New Assertion/Page Flow
1. Identify the user-facing flow (not an implementation detail).
2. Add one `test()` block per flow/scenario, not per element.
3. Assert on visible, user-observable outcomes (text, visibility, navigation), not internal state.
