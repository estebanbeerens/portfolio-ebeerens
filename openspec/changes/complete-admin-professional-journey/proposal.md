## Why

The admin application exposes a Professional Journey navigation entry, but it currently routes to a placeholder page while the API already provides authenticated Organization and Role CRUD (roles nested under organizations, with multiple roles per organization supported) and has zero test coverage. Completing this workflow gives the portfolio owner a usable way to manage their career history and closes a test gap on an already-shipped API surface.

## What Changes

- Add missing backend test coverage for the already-implemented Organizations and Roles API (unit specs + api-e2e specs), mirroring the Profile module's test pattern.
- Add a new reusable `ui-select` component to `libs/ui` (no dropdown/select primitive exists yet), used for `EmploymentType` selection.
- Replace the admin Professional Journey placeholder with an authenticated, organization-grouped role list and editor: roles are created/edited via a form with an inline organization combobox (select an existing organization by name or create one on the fly), employment type, location, date range, and skills; a small inline affordance edits an organization's logo/website from the grouped list.
- Support creating, editing, and deleting roles, with an organization's roles always displayed grouped together (a single organization may have multiple roles/eras listed under it).
- Provide loading, empty, validation, conflict, authorization, and general error states, matching the Projects admin feature's patterns.
- Add focused Angular/API unit tests and an authenticated admin Playwright journey (including a case with two roles under one organization).
- **Non-goals:** changes to the public `web` app, a standalone Organizations CRUD page, an R2 logo-upload flow, resume/education/certification content, or any OpenAPI/schema changes (the contract is already correct).

## Capabilities

### New Capabilities

- `professional-journey/admin-management`: Authenticated administration of organizations and roles, including an organization-grouped list, create, edit, delete, validation, and user-facing state handling.

### Modified Capabilities

- None. The Organizations/Roles API behavior itself is unchanged; this change only adds test coverage and consumes the existing contract.

## Impact

- `apps/admin/src/app/app.routes.ts` and a new `apps/admin/src/app/professional-journey/` feature area replace the current placeholder route.
- `libs/ui` gains a new `Select` component (`libs/ui/src/lib/forms/select/`), exported from the barrel.
- `apps/api/src/app/organizations/` and `apps/api/src/app/roles/` gain `.spec.ts` unit tests; `apps/api-e2e/src/api/` gains `organizations.spec.ts` and `roles.spec.ts`. No production backend code changes are expected unless a concrete contract gap is found while writing tests.
- `libs/api-client` is unchanged (no OpenAPI diff expected).
- Admin unit tests (Vitest) and an admin Playwright journey are added; OpenSpec artifacts are archived into a durable `professional-journey` capability spec after implementation, per the `complete-admin-projects` precedent.
