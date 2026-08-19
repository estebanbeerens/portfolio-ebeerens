## Context

The Roles/Organizations API (`apps/api/src/app/roles/`, `apps/api/src/app/organizations/`) and its OpenAPI contract are already implemented and stable, but untested. The admin route `professional-journey` in `apps/admin/src/app/app.routes.ts` currently loads a shared `PlaceholderPage`. `apps/admin/src/app/projects/` is a complete, working reference for the three-layer admin CRUD pattern (smart container + presentational list/form/delete-dialog) this change follows. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**

- Close the existing test gap on the Roles/Organizations API before building on top of it.
- Ship an admin feature that groups roles by organization, supporting multiple roles per organization.
- Reuse the Projects feature's container/presentational/test structure rather than inventing a new pattern.
- Add a `ui-select` primitive to `libs/ui` for the one enum field (`EmploymentType`) this feature needs, since none exists yet.

**Non-Goals:**

- No standalone Organizations list/CRUD page — organizations are only created/edited in the context of a role.
- No changes to `openapi/api.yaml`, Prisma schema, or `libs/api-client` generation — the contract is already correct.
- No changes to the public `web` app or an R2 logo-upload flow.

## Decisions

- **Organization resolution in the container, not the API**: The role form's organization field is a `ui-select` populated with existing organization names plus a sentinel "+ New organization" option; choosing the sentinel reveals a `ui-input` for typing a new organization name. (`ui-tag-combobox` was considered and rejected here despite matching the Skills UX, because it normalizes all values to lowercase — unsuitable for a proper-noun organization name like "Acme Corp".) On submit, the container resolves the selection to an `organizationId`: if an existing organization was selected, its id is used directly; if "new" was selected, it calls `organizationsControllerCreate` first, then uses the returned id for `rolesControllerCreate`/`Update`.
- **Grouping computed client-side**: `GET /api/roles` returns a flat list with nested `organization`; the container's `computed()` groups by `organization.id` and sorts groups by each group's max `startDate`, reusing data already fetched rather than adding a new backend grouping endpoint.
- **New `ui-select` component**: Implemented as a `ControlValueAccessor` matching the existing `TextInput`/`Textarea` shape (`libs/ui/src/lib/forms/input/`), wrapping a native `<select>` for accessibility and no new JS behavior, styled with existing tokens only. Alternative considered: a custom listbox widget — rejected as unnecessary complexity for a small, fixed enum (`EmploymentType`).
- **Organization edit as inline affordance**: Editing logo/website happens through a small inline form on the group header (`organizationsControllerUpdate`), not a routed page, consistent with the "no standalone Organizations page" decision.
- **Backend tests added without behavior changes**: Unit specs mock Prisma per the `profile.service.spec.ts` pattern; api-e2e specs use `resetE2eDatabase`/`createAuthenticatedSession` per `profile.spec.ts`. If a genuine contract gap is found while writing tests (e.g. a missing error mapping), it will be fixed in the same change and called out explicitly rather than silently.
- **Figma fidelity check (node 29-454)**: The design shows an accordion — one organization expanded with its roles as sub-rows and icon-only edit/delete buttons, other organizations collapsed to a single summary row. Per the user's explicit note that the design is a guideline, the implementation instead renders every organization's group always expanded, with text `Edit`/`Delete` buttons matching the Projects admin feature's existing list pattern exactly. Rationale: (1) the Projects feature — the primary reuse target for this change — already establishes text buttons over icon-only controls for row actions, and no icon set is wired into any existing admin list item; (2) an always-expanded list avoids hiding roles behind an extra interaction and keeps all professional history scannable and keyboard-navigable without additional disclosure-widget accessibility work. The organization grouping and multi-role-per-organization structure central to the Figma design is preserved.

## Risks / Trade-offs

- [Organization name matching is case-sensitive and exact] → Mitigate by normalizing whitespace only (trim) before comparison, matching the API's `@unique` constraint on `name`; document the behavior in the combobox hint text so duplicate near-matches (casing/typos) are a known, acceptable limitation rather than a silent bug.
- [Two sequential requests (create organization, then create role) on the "new organization" path] → Mitigate with the existing mutation-guard/loading-state pattern from Projects so a failure between the two steps surfaces a clear error and does not leave the form in an inconsistent state; the created organization is not orphaned since it's a legitimate standalone entity even without the role, and can be reused on retry.
- [No existing `ui-select` means added surface area in a shared library] → Mitigate by keeping the API minimal (value/label pairs) and covering it with the same test rigor as `TextInput`.

## Migration Plan

No data migration required (no schema change). Deploy is a normal admin/API build; rollback is reverting the admin route to `PlaceholderPage` and dropping the new test files, since no production behavior depends on them.
