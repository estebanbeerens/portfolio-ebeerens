## Why

The admin application exposes a Projects navigation entry, but it currently routes to a placeholder page while the API already provides authenticated project CRUD. Completing this workflow now gives the portfolio owner a usable content-management path and exercises the repository's OpenSpec, OpenAPI, generated-client, Angular, and testing boundaries with a real feature.

## What Changes

- Replace the admin Projects placeholder with an authenticated project list and editor.
- Support creating, editing, and deleting projects through the existing project API and generated Angular client.
- Provide loading, empty, validation, conflict, authorization, and general error states.
- Preserve the existing session guard and project API contract unless implementation exposes a concrete contract gap.
- Add focused Angular/API tests and an authenticated admin Playwright journey.
- **Non-goals:** redesign authentication, add image upload or rich-text editing, change public portfolio rendering, or backfill unrelated roadmap capabilities.

## Capabilities

### New Capabilities

- `projects/admin-management`: Authenticated administration of portfolio projects, including list, create, edit, delete, validation, and user-facing state handling.

### Modified Capabilities

None.

## Impact

- `apps/admin/src/app/app.routes.ts` and a new admin projects feature area replace the current placeholder route.
- `libs/api-client` is the only frontend API boundary; generated files change only if the committed OpenAPI contract changes.
- `apps/api/src/app/projects/` remains the owning backend boundary and may need contract-alignment changes only if required by the pilot scenarios.
- `openapi/api.yaml` remains the API source of truth for any endpoint or schema change.
- Admin unit and Playwright tests, plus focused API coverage, will be added or updated.
- OpenSpec artifacts will be archived into the durable projects capability spec after implementation.
