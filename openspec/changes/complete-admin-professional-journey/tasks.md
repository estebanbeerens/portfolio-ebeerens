## 1. Backend test coverage (apps/api, apps/api-e2e)

- [x] 1.1 Add `apps/api/src/app/organizations/organizations.service.spec.ts` (mock Prisma): `findAll` ordering by name, `findOne` 404, `create`/`update`/`remove`, P2002 duplicate name → `ConflictException`, P2003 delete-with-roles → `ConflictException`.
- [x] 1.2 Add `apps/api/src/app/roles/roles.service.spec.ts` (mock Prisma): `findAll` ordering by `startDate` desc with organization+skills included, `findOne` 404, `create` with bad `organizationId` → `NotFoundException` (P2025), skill `connectOrCreate` normalization, `update` skill replace-set behavior, `remove`.
- [x] 1.3 Add `apps/api-e2e/src/api/organizations.spec.ts` (pattern: `apps/api-e2e/src/api/profile.spec.ts`, using `resetE2eDatabase`/`createAuthenticatedSession`): public GET list/one, authenticated create/update/delete, 401 without session, 409 on duplicate name, 409 on delete with roles referencing it, 404 on unknown id.
- [x] 1.4 Add `apps/api-e2e/src/api/roles.spec.ts`: public GET list/one with nested `organization`+`skills`, authenticated create/update/delete, 401 checks, 404 for unknown `organizationId`, and an explicit case creating two roles under the same `organizationId` and asserting both appear in `GET /api/roles`.
- [x] 1.5 Run `npx nx test api` and `npx nx e2e api-e2e` (requires `docker compose up -d postgres`); fix any real contract gap surfaced by the new tests and note it in the PR description.

## 2. `ui-select` shared component (libs/ui)

- [x] 2.1 Create `libs/ui/src/lib/forms/select/select.component.ts` + `.html`: standalone, `ChangeDetectionStrategy.OnPush`, `ControlValueAccessor` via `NG_VALUE_ACCESSOR` (mirror `libs/ui/src/lib/forms/input/input.component.ts`), reusing `FormField` for label/hint/error chrome. Inputs: `controlId`, `label`, `options: input<{ value: string; label: string }[]>()`, `placeholder`, `hint`, `error`, `required`.
- [x] 2.2 Style the native `<select>` with existing Tailwind tokens only (no new `tokens.css` entries expected); verify in both `.dark` and light theme.
- [x] 2.3 Add `libs/ui/src/lib/forms/select/select.component.spec.ts` (mirror `input.component.spec.ts`): default render, option selection emits via CVA, disabled state, required/error rendering.
- [x] 2.4 Export `Select` from `libs/ui/src/index.ts`.
- [x] 2.5 Run `npx nx test ui` and `npx nx lint ui`.

## 3. Admin Professional Journey feature (apps/admin)

- [x] 3.1 Pull Figma node `2qQ58w8v4r6PWIPJwJquYn` (node-id 29-454) via the `figma-mcp-ui` skill as a design guideline; confirm the organization-grouped layout and reconcile any token gaps.
- [x] 3.2 Create `apps/admin/src/app/professional-journey/professional-journey.component.ts` (+ `.html`) as the smart container: `rxResource` for `rolesControllerFindAll` and `organizationsControllerFindAll`; `computed()` grouping roles by `organization.id`, groups sorted by each group's max `startDate` desc, roles within a group sorted by `startDate` desc.
- [x] 3.3 Create `apps/admin/src/app/professional-journey/role-group-list/` (presentational): renders one section per organization (name/logo/website header + inline edit affordance) containing its role cards (job title, employment type, location, date range, skills); loading/error/empty states matching `apps/admin/src/app/projects/project-list/` patterns.
- [x] 3.4 Create `apps/admin/src/app/professional-journey/role-form/` (presentational): reactive form with `jobTitle`, organization `ui-select` (existing organizations + a "+ New organization" sentinel option that reveals a `ui-input` for the new name), `location`, `employmentType` (`ui-select`, `EmploymentType` enum options), `startDate`/`endDate` (`ui-input type="date"`), `skills` (`ui-tag-combobox`); form-reset-token and duplicate-submit-guard pattern from `apps/admin/src/app/projects/project-form/`.
- [x] 3.5 In the container, resolve the submitted organization selection to an `organizationId`: if an existing organization was selected, use its id directly; if the "new" sentinel was selected, call `organizationsControllerCreate` first, then create/update the role with the resulting id.
- [x] 3.6 Create `apps/admin/src/app/professional-journey/role-delete-dialog/` copying the confirm/cancel/Escape/backdrop-click pattern from `apps/admin/src/app/projects/project-delete-dialog/`.
- [x] 3.7 Add the inline organization logo/website edit affordance on the group header, calling `organizationsControllerUpdate`; surface conflict/401/general errors via `ToastService` consistent with the Projects feature.
- [x] 3.8 Update `apps/admin/src/app/app.routes.ts`: replace the `professional-journey` route's `PlaceholderPage` `loadComponent` with the new `ProfessionalJourney` container.
- [x] 3.9 Add Vitest specs: `professional-journey.component.spec.ts`, `role-group-list.component.spec.ts`, `role-form.component.spec.ts` covering loading/error/empty grouped states, multiple roles under one organization, create with existing org (no create-org call), create with new org name (create-org call then role create), edit resets form via token, delete confirm/cancel, required-field validation blocks submit, 401/409 error mapping.
- [x] 3.10 Run `npx nx test admin`, `npx nx build admin`, `npx nx lint admin`.

## 4. Admin e2e and wrap-up

- [x] 4.1 Add `apps/admin-e2e/src/professional-journey.spec.ts` (pattern: `apps/admin-e2e/src/basic-info.spec.ts`, using `authenticate(page)` and semantic `getByRole`/`getByLabel` locators): create an organization+role via the "+ New organization" option and verify the grouped rendering; add a second role under the same organization and assert both roles render nested under one group; edit a role; delete a role via the confirm dialog; run an `AxeBuilder` scan and assert zero violations.
- [x] 4.2 Run `npx nx e2e admin-e2e` (target the new spec) and fix any failures.
- [x] 4.3 Manually verify light/dark theme and mobile/desktop responsive behavior against the Figma reference (fidelity checklist from the `figma-mcp-ui` skill).
- [x] 4.4 Update `openapi/api.yaml`/`libs/api-client` only if task 1.5 surfaces a real contract gap; otherwise confirm no diff (`git status` on `openapi/api.yaml`).
