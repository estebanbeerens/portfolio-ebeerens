## Context

The admin route currently maps `projects` to the shared placeholder page. The API already owns project CRUD in `apps/api/src/app/projects/`, including DTO validation, session protection for mutations, skill reuse, and conflict/not-found mapping. The generated Angular client is derived from `openapi/api.yaml`; no endpoint change is expected for this pilot unless implementation reveals a mismatch. See `proposal.md` and `specs/projects/admin-management/spec.md` for motivation and observable behavior.

## Goals / Non-Goals

**Goals:**

- Add a focused admin project-management feature that consumes the existing project API.
- Reuse the admin shell, shared UI components, auth guard, generated API client, and existing design tokens.
- Model list/form state with Angular signals and SSR-safe async reads.
- Provide accessible validation, confirmation, loading, success, and failure states.
- Cover behavior with focused Vitest tests and an authenticated admin Playwright flow.

**Non-Goals:**

- Changing the project database model or adding new project endpoints without a demonstrated contract gap.
- Implementing GitHub OAuth/session behavior, R2 uploads, TipTap editing, or public project rendering.
- Replacing the generated API client or hand-editing generated files.

## Decisions

1. **Use the existing project API as the boundary.** The feature will call the generated project service from `libs/api-client`, preserving the repository rule that `openapi/api.yaml` is the contract and that generated output is regenerated rather than manually edited. If a contract mismatch is found, update the YAML first, align NestJS Swagger decorators, export and inspect the spec, then regenerate the client.

2. **Keep the feature inside the admin application.** Add a lazy-loaded `apps/admin/src/app/projects/` area and replace the existing route-level placeholder. This keeps project state out of the shell and follows the app's current route and standalone-component structure.

3. **Separate read state from imperative mutations.** Use `rxResource` for the project collection read and signals for selected project, form mode, validation/submission state, and feedback. Use one-off observable subscriptions only for create, update, and delete commands, with duplicate-action guards and reload after successful mutations.

4. **Use a shared form model for create and edit.** The form maps API response fields into editable values and omits absent optional values as `undefined`. It validates required fields and the API's slug/URL/date constraints before calling the generated client. Description remains a JSON editor-compatible field or a clearly scoped structured input for this pilot; rich-text authoring is deliberately deferred.

5. **Use explicit confirmation for destructive actions.** Delete confirmation will be a semantic dialog or existing shared dialog primitive if available, with focus handling, keyboard escape/cancel behavior, and clear confirm/cancel labels. A canceled confirmation makes no HTTP request.

6. **Test at the owning boundaries.** Component tests cover state transitions and client calls with mocks. API tests are changed only if the implementation changes backend behavior. The admin Playwright test covers the user journey with the repository's authenticated fixture/setup rather than bypassing the route guard in production code.

## Risks / Trade-offs

- **[Risk] The current admin e2e setup may not provide an authenticated session.** -> Inspect the existing fixture and add only the smallest test-only authentication arrangement needed for this flow; do not weaken production guards.
- **[Risk] Project descriptions are ProseMirror JSON but rich-text editing is out of scope.** -> Preserve the API shape and use a bounded structured input or fixture-friendly editor representation, documenting the limitation in the UI until the image-storage/Tiptap work is implemented.
- **[Risk] Existing user changes may overlap route, auth, or generated-client files.** -> Review current content before edits and limit changes to the pilot files; never revert unrelated worktree changes.
- **[Risk] API export requires the local database environment.** -> Do not regenerate unless the contract changes; if it does, start the required Postgres service and run the documented export/client sequence.

## Migration Plan

1. Implement the admin route and feature behind the existing authenticated shell.
2. Run focused unit tests, lint, and admin build.
3. Run the authenticated admin Playwright journey and any affected API tests.
4. If the API contract changes, export OpenAPI and regenerate/build the client before merging.
5. No database migration or runtime data migration is expected. Rollback is a route/UI revert because the existing API remains backward compatible.

## Open Questions

- None that change the specified behavior or implementation approach. The exact existing shared dialog and authenticated e2e fixture should be selected from the current code during task execution.
