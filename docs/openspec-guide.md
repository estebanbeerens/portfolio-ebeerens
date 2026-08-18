# OpenSpec Guide

OpenSpec is the planning layer for changes in this repository. It records what the system should do, why the change is needed, how it will fit the codebase, and which tasks remain.

OpenSpec does not replace the API contract, generated client, or Nx tasks:

- OpenSpec describes behavior and change intent.
- `openapi/api.yaml` remains the API contract.
- `libs/api-client/src/generated/` remains generated output.
- Nx remains the task runner for builds, tests, linting, and e2e checks.

## One-Time Setup

OpenSpec is installed globally and initialized for GitHub Copilot in this repository.

```sh
npm install -g @fission-ai/openspec@1.9.0
openspec --version
openspec doctor --json
```

The Copilot commands are generated under `.github/prompts/` and the supporting skills are under `.github/skills/`. Do not edit those generated files by hand. Run `openspec update` after upgrading the CLI.

## The Normal Workflow

Use this order for a real feature or behavior change:

```text
explore -> propose -> apply -> sync -> archive
```

### 1. Explore when the request is unclear

Use `/opsx-explore` to investigate an idea, existing behavior, or possible approach before creating a change. This is optional for small, well-understood changes.

### 2. Propose the change

Start a new change with Copilot:

```text
/opsx-propose Add project filtering to the admin dashboard
```

Or create the change from the terminal:

```sh
openspec new change "add-project-filtering"
openspec status --change "add-project-filtering" --json
```

The default `spec-driven` workflow creates these artifacts:

| Artifact                     | Purpose                                                   |
| ---------------------------- | --------------------------------------------------------- |
| `proposal.md`                | Why the change is needed, what changes, scope, and impact |
| `specs/<capability>/spec.md` | Observable requirements and testable scenarios            |
| `design.md`                  | Technical approach, decisions, risks, and migration notes |
| `tasks.md`                   | Ordered implementation checklist                          |

A spec is a behavior contract, not a list of classes or functions. Use normative requirements and concrete `GIVEN`/`WHEN`/`THEN` scenarios.

### 3. Review the artifacts

Before coding, check the change status:

```sh
openspec status --change "add-project-filtering"
openspec validate --all --strict --json
```

Do not start implementation until `proposal.md`, the capability delta, `design.md`, and `tasks.md` are present and valid. Resolve questions that would change behavior, scope, or compatibility before applying the change.

### 4. Implement the change

Start the apply workflow explicitly:

```text
/opsx-apply add-project-filtering
```

Or inspect the apply state from the terminal:

```sh
openspec instructions apply --change "add-project-filtering" --json
```

Work through the tasks in order. After each substantive edit:

1. Run the narrowest relevant test, lint, build, or type check.
2. Mark the completed checkbox in `tasks.md`.
3. Continue only when the result is understood.

For any change affecting `apps/api`, `apps/admin`, or `apps/web`, include the relevant e2e work in the same OpenSpec task list. Run Playwright for admin/web behavior and the API e2e target for HTTP behavior. An authenticated UI flow needs a test fixture or test-only session setup; never bypass the production auth guard.

Preserve unrelated worktree changes. Keep implementation details in the code and design artifact; keep user-visible behavior in the spec.

### 5. Sync or archive the completed change

Use `/opsx-sync` when the implementation is complete but the change should remain active. Use `/opsx-archive` when the work is complete and its requirements should become a durable capability spec.

Before archiving:

```sh
openspec validate --all --strict --json
openspec status --change "add-project-filtering" --json
```

A change should not be archived while required tasks are incomplete or validation is failing.

## Rules For This Repository

### API changes

When an endpoint, request, response, or authorization requirement changes:

1. Update `openapi/api.yaml` first.
2. Align the NestJS DTOs, controllers, and Swagger decorators.
3. Export the generated backend contract:

   ```sh
   npx nx run api:export-openapi
   ```

4. Inspect the OpenAPI diff.
5. Regenerate and build the Angular client:

   ```sh
   npm run build:api-client
   npx nx build api-client
   ```

6. Update `admin` or `web` through the generated client.

Never hand-edit files under `libs/api-client/src/generated/`.

### Angular changes

For `admin` and `web`:

- Use standalone components and `ChangeDetectionStrategy.OnPush`.
- Prefer signals and `rxResource` for async reads.
- Use `@if`, `@for`, and `@switch` in templates.
- Keep browser-only APIs SSR-safe.
- Use `undefined` for absent values; reserve `null` for deliberate JSON nulls or framework/storage boundaries.
- Include focused co-located Vitest tests.
- Meet WCAG 2.2 AA for user-facing behavior.

### Validation

Use Nx through npm/npx:

```sh
npx nx test <project>
npx nx lint <project>
npx nx build <project>
npx nx e2e <project-e2e>
```

For UI changes, the e2e command is a required Playwright validation step, not an optional smoke test:

```sh
npx nx e2e admin-e2e
npx nx e2e web-e2e
```

For API changes, run:

```sh
npx nx e2e api-e2e
```

For repository-level OpenSpec validation, use:

```sh
npm run spec:doctor
npm run spec:validate
```

CI runs the strict OpenSpec validation, installs Playwright browsers, and runs affected Nx lint, test, build, and e2e tasks.

## What Not To Do

- Do not create a giant OpenSpec backfill of the architecture or build guides.
- Do not use OpenSpec specs as a replacement for `openapi/api.yaml`.
- Do not hand-edit generated Copilot integration files or generated API client files.
- Do not create a spec just to satisfy validation for a tooling-only or documentation-only change; use `skip_specs: true` only when there is genuinely no behavior change.
- Do not archive a change that still has unverified scenarios or incomplete tasks.

## Current Example

The repository's first pilot is `complete-admin-projects`. Its artifacts are in:

```text
openspec/changes/complete-admin-projects/
```

Use it as a reference for the relationship between a proposal, capability delta, design, tasks, implementation, and validation.
