## 1. Inspect and establish the admin feature boundary

- [x] 1.1 Inspect the generated project API methods and existing shared UI/dialog/form primitives; no API mismatch or reusable dialog/form primitive was found, so the feature will use the existing generated client and semantic native controls.
- [x] 1.2 Add the lazy-loaded `apps/admin/src/app/projects/` feature entry and replace the `projects` placeholder route while preserving the existing auth guard.

## 2. Implement project list and state handling

- [x] 2.1 Implement the standalone OnPush Projects page with signals and `rxResource` for the authenticated project collection read.
- [x] 2.2 Render project title, slug, dates, skills, empty state, loading state, unauthorized state, general error state, and retry/create actions with semantic accessible controls.

## 3. Implement create and edit workflow

- [x] 3.1 Add a shared create/edit form model for all existing project API fields, using `undefined` for absent optional values and accessible labels/errors.
- [x] 3.2 Implement client-backed create and edit mutations with validation, duplicate-submit prevention, pending/success feedback, conflict handling, and recoverable form input.
- [x] 3.3 Add the bounded description input appropriate for the current JSON contract without introducing TipTap or rich-text/upload scope.

## 4. Implement delete workflow

- [x] 4.1 Add an accessible explicit delete confirmation flow with keyboard cancel/close behavior and no request on cancellation.
- [x] 4.2 Implement delete mutation handling, success removal, pending state, and actionable failure feedback.

## 5. Test and contract verification

- [x] 5.1 Add co-located admin Vitest coverage for list states, validation, create/edit/delete client calls, conflict/error handling, and confirmation cancellation.
- [x] 5.2 Add or update focused API tests only if backend behavior changes; existing project endpoints were reused without backend changes.
- [ ] 5.3 Add an authenticated `admin-e2e` Playwright journey for viewing, creating or editing, and deleting a project using semantic locators. Blocked: the repository has no authenticated admin-e2e fixture or session setup yet.
- [x] 5.4 If the API shape changed, run `npx nx run api:export-openapi`, inspect `openapi/api.yaml`, then run `npm run build:api-client` and `npx nx build api-client`; no API shape changed, and the existing generated client built as an admin dependency.
- [x] 5.5 Run focused validation: `npx nx test admin`, `npx nx lint admin`, and `npx nx build admin`; API and e2e execution were not expanded because the backend contract was unchanged and e2e lacks authentication setup.

## 6. Complete the OpenSpec change

- [ ] 6.1 Run `openspec validate --all --strict --json`, review the implementation against every scenario, and mark all completed tasks. Pending until the authenticated e2e prerequisite is resolved.
- [ ] 6.2 Sync and archive the completed change so `openspec/specs/projects/admin-management/spec.md` becomes the durable capability spec. Pending until task 5.3 is complete.
