---
name: e2e-testing
description: "Write, modify, and run end-to-end tests across this Nx workspace's e2e projects: admin-e2e and web-e2e (Playwright UI tests against the Angular apps) and api-e2e (Jest + axios HTTP tests against the NestJS API). Use when adding or updating e2e specs, choosing locators/selectors, wiring webServer/global-setup, or running e2e tests via Nx."
---

# End-to-End Testing

## When to Use

- Treat e2e coverage as part of implementation, not a follow-up task. Changes affecting `api`, `admin`, or `web` must add or update the relevant e2e spec and run that target before completion.
- Admin and web behavior requires a Playwright spec and Playwright validation; API HTTP behavior requires `api-e2e` validation.
- Authenticated flows require a test fixture or test-only session setup. Never weaken the production auth guard to make e2e pass.
- A unit test, lint, or build does not replace e2e validation for an affected application boundary.

- Writing or modifying an e2e spec in `admin-e2e`, `web-e2e`, or `api-e2e`
- Deciding how to structure a new e2e test (locators, fixtures, HTTP assertions)
- Running e2e tests, debugging failures, or wiring up test infra (webServer, global-setup)

## Test Pyramid — What Belongs in e2e vs. Not

E2e is the thin, expensive top layer, not where every assertion lives. One e2e spec per affected app boundary is mandatory (see above) — that does not mean every scenario needs its own e2e test.

**Put in e2e (Playwright or api-e2e):**

- One full happy-path user journey per feature (e.g. create → edit → delete an entity), including the specific behavior the feature exists for (e.g. two roles rendering under one organization group).
- Auth/session boundaries: redirect-to-login, 401 on unauthenticated mutation, session-guard behavior.
- Cross-boundary wiring: does the form actually call the right generated API client method with the right shape end to end.
- One accessibility scan (`AxeBuilder`) per new admin/web page.

**Leave in Vitest (component) / Jest (service unit) specs instead:**

- Field-level form validation (required/pattern/maxLength messages), one test per rule.
- Every loading/error/empty state permutation of a list or resource.
- Service-level error mapping (404/409/401 branches, Prisma error code handling) — unit-test the service directly with a mocked `PrismaService` rather than forcing every HTTP status through a live Playwright/api-e2e run.
- Presentational component states/outputs (button disabled while saving, cancel doesn't call the API, dialog keyboard/backdrop dismiss).

Quick test: if a scenario can be verified without a real browser/HTTP round trip, it belongs in a unit/component spec, not e2e. Reserve e2e for the things only a real render or real request can catch.

## Stack in This Repo — Two Different Tools

| Project     | Target                                          | Tool         | Specs                           | Runs against                    |
| ----------- | ----------------------------------------------- | ------------ | ------------------------------- | ------------------------------- |
| `admin-e2e` | inferred `e2e` (via `@nx/playwright/plugin`)    | Playwright   | `apps/admin-e2e/src/*.spec.ts`  | `admin` app (served at `:4200`) |
| `web-e2e`   | inferred `e2e`                                  | Playwright   | `apps/web-e2e/src/*.spec.ts`    | `web` app (served at `:4200`)   |
| `api-e2e`   | explicit `e2e` target, `@nx/jest:jest` executor | Jest + axios | `apps/api-e2e/src/**/*.spec.ts` | `api` app (served at `:3000`)   |

Pick the pattern based on the target app:

- Testing a page/UI flow in `admin` or `web` → Playwright workflow
- Testing an HTTP endpoint in `api` → Jest + axios workflow

## Workflow: Playwright UI E2E (admin-e2e, web-e2e)

Full pattern: [playwright-ui-e2e.md](./references/playwright-ui-e2e.md) (config, locators, running/debugging).

Quick steps:

1. Add a spec file under `apps/<app>-e2e/src/`.
2. `await page.goto('/')` then assert with role/label/text locators — avoid brittle CSS selectors when a semantic locator exists.
3. Run: `npx nx e2e <app>-e2e` (the app's dev server starts automatically via `webServer`).

## Workflow: API E2E (api-e2e)

Full pattern: [api-e2e-jest.md](./references/api-e2e-jest.md) (global-setup/teardown, axios baseURL, assertions).

Quick steps:

1. Add or modify a `*.spec.ts` under `apps/api-e2e/src/`.
2. Use the pre-configured `axios` instance (baseURL already set in `test-setup.ts`) with relative paths, e.g. `axios.get('/api')`.
3. Run: `npx nx e2e api-e2e` — depends on `api:build` + `api:serve`, so the real server is running during tests.

## Running & Debugging

- Single project: `npx nx e2e admin-e2e` / `npx nx e2e web-e2e` / `npx nx e2e api-e2e`
- All e2e projects: `npx nx run-many -t e2e`
- Playwright: add `--ui` for the interactive runner, `--debug` to step through, `--headed` to watch the browser
- Playwright traces are captured `on-first-retry`; view with `npx playwright show-trace <trace.zip>`
- Unsure of a flag or run syntax? Use the `nx-run-tasks` skill instead of guessing.

## Best Practices Checklist

- Prefer Playwright's `getByRole`/`getByLabel`/`getByText` over CSS selectors
- Keep UI e2e specs behavior-focused (user flows), not implementation details — see the Test Pyramid section above before adding another e2e case
- API e2e specs assert on status code **and** response shape, not just "2xx"
- Don't hardcode ports/hosts — reuse `process.env.HOST`/`PORT` (already wired in `api-e2e`'s setup) or Playwright's `baseURL`
- Scaffolding a brand-new e2e project? Use the `nx-generate` skill rather than hand-rolling config
- CI runs `nx affected -t e2e` on every push after the required services and Playwright browsers are installed — keep specs green locally before pushing, since a flaky e2e spec blocks the pipeline for everyone.
- Locally, run against a single browser project first (`--project=chromium`) — the full chromium/firefox/webkit matrix is for CI; firefox/webkit binaries may not even be installed locally (`npx playwright install` if needed).
- Pass `CI=1` (or `--reporter=list`) when running Playwright locally from a script/terminal — the default HTML reporter opens a server and blocks on failure otherwise, which looks like a hang.
- `api-e2e` specs that call `resetE2eDatabase()`/mutate shared tables must run serially (`maxWorkers: 1` in `jest.config.cts`) — they share one stateful Postgres instance across spec files, and parallel workers will race resets against each other.

## Reference Files

- [Playwright UI e2e conventions](./references/playwright-ui-e2e.md)
- [API e2e (Jest + axios) conventions](./references/api-e2e-jest.md)
