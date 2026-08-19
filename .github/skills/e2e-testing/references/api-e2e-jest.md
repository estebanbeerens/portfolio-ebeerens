# API E2E (Jest + axios) Conventions (api-e2e)

## Why This Differs From admin-e2e/web-e2e

`api-e2e` tests HTTP behavior of the NestJS API directly — there's no browser/UI involved, so it uses Jest + `axios` instead of Playwright, driven by the `@nx/jest:jest` executor with an explicit `e2e` target in `project.json` (it's also excluded from the `@nx/jest/plugin`'s inferred `test` target).

## Test Infra

`jest.config.cts` wires:

- `globalSetup` → `src/support/global-setup.ts`: waits for the API port to be open (`waitForPortOpen`) before any test runs
- `globalTeardown` → `src/support/global-teardown.ts`: kills the port after the run, logs `__TEARDOWN_MESSAGE__`
- `setupFiles` → `src/support/test-setup.ts`: sets `axios.defaults.baseURL` to `http://<HOST>:<PORT>` (defaults to `localhost:3000`)

`project.json`'s `e2e` target has `dependsOn: ["api:build", "api:serve"]` — Nx builds and serves the real API before running specs. Don't mock the server.

## Writing Specs

- Location: `apps/api-e2e/src/**/*.spec.ts`, grouped by route/feature (see `src/api/api.spec.ts`)
- Use the shared `axios` instance — baseURL is already configured, so call routes with relative paths: `axios.get('/api')`, not a full URL
- Assert on both `res.status` and `res.data` shape — a 200 with the wrong body should still fail
- Existing pattern:
  ```ts
  import axios from 'axios';

  describe('GET /api', () => {
    it('should return a message', async () => {
      const res = await axios.get(`/api`);
      expect(res.status).toBe(200);
      expect(res.data).toEqual({ message: 'Hello API' });
    });
  });
  ```

## Running

- `npx nx e2e api-e2e` — builds and serves `api` first (via `dependsOn`), so expect it to take longer than a unit test run.
- `passWithNoTests: true` is set, so an empty `describe` block won't fail the run — don't rely on that as a substitute for real coverage.
- Any spec file using `resetE2eDatabase()`/`createAuthenticatedSession()` shares one stateful Postgres instance with every other spec file in the run. Jest runs spec files across multiple workers by default, so two files resetting/seeding concurrently will race each other (a session row disappearing mid-request, a 401 where you expected 200). Set `maxWorkers: 1` in `jest.config.cts` once more than one spec file touches shared state — don't try to work around it with per-test unique IDs alone.
- `resetE2eDatabase()` must delete every table a new spec seeds, in FK-safe order (children before parents, e.g. `Role` before `Organization`) — a spec that seeds a table the helper doesn't clear will pass in isolation and fail (or silently drift) once run after another spec.

## Adding a New Endpoint's Tests

1. Add a `describe('<METHOD> <path>')` block mirroring the controller route.
2. Cover the happy path plus at least one realistic failure case (404/400/etc.) if the endpoint documents one via Swagger — see the `nestjs-backend` skill for where those come from.
3. Keep specs independent — no shared mutable state between `it()` blocks unless explicitly seeded and cleaned up.
4. Don't try to exhaustively cover every DTO validation rule here — that belongs in a `*.service.spec.ts` unit test with a mocked `PrismaService` (fast, no server/DB required). Use api-e2e for the request/response contract: status codes, auth boundary, and one or two representative error shapes end to end.
