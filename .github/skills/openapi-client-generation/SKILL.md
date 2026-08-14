---
name: openapi-client-generation
description: 'Maintain openapi/api.yaml as the single source of truth for the API contract, generate a typed Angular API client from it into a shared library, and keep the NestJS backend conformant with it. Use when adding or changing an API endpoint/schema, wiring web or admin to a new API call, scaffolding the shared API client library, or checking whether the backend has drifted from the committed spec.'
---

# OpenAPI Contract & Client Generation

## When to Use

- Adding or changing any API endpoint, request/response schema, or auth requirement
- Wiring `web` or `admin` to call an API endpoint
- Setting up or regenerating the shared API client library
- Checking whether the backend's actual behavior has drifted from `openapi/api.yaml`

## Why This Is Separate From `nestjs-backend`

`nestjs-backend` covers writing NestJS modules/controllers/DTOs decorated with `@nestjs/swagger`. This skill covers the cross-cutting contract discipline sitting above that: per the architecture plan (§7), **`openapi/api.yaml` is the single source of truth** — not the live, in-memory Swagger document alone. Everything downstream (the generated frontend client, drift detection) is derived from or checked against that one committed file.

`openapi/api.yaml` exists and is committed — bootstrapped via `npx nx run api:export-openapi`, which boots the built app and dumps its Swagger document to YAML (see [spec-first-workflow.md](./references/spec-first-workflow.md) for why this runs from the webpack build rather than a standalone `ts-node` script). From here it's the frozen baseline everything else works from.

## Workflow: Adding or Changing an Endpoint (Spec-First)

1. **Edit `openapi/api.yaml` first** — the endpoint, request/response schemas, auth requirement. Treat this edit as the actual API design step, not paperwork done after the fact.
2. **Implement/update the NestJS side** (controller, DTOs, `@nestjs/swagger` decorators) to match what you just wrote — see the `nestjs-backend` skill for those conventions.
3. **Diff-check.** Run `npx nx run api:export-openapi` again and `git diff openapi/api.yaml`. If it's non-empty, either fix the backend decorators or amend the spec and redo step 2 — see [spec-first-workflow.md](./references/spec-first-workflow.md).
4. **Regenerate the frontend client.** `libs/api-client` exists — run `npm run build:api-client` (regenerates from `openapi/api.yaml` then builds the lib) — see [client-generation.md](./references/client-generation.md).
5. **Update `web`/`admin` call sites** to use the regenerated client methods.

## Reference Files

- [Spec-first workflow & drift detection](./references/spec-first-workflow.md)
- [Client generation setup](./references/client-generation.md)

## Best Practices Checklist

- Every PR that changes an endpoint also changes `openapi/api.yaml` in the same diff — never let them fall out of sync
- Never hand-edit generated client output — regenerate instead
- `web` and `admin` both import from the **one** shared `libs/api-client` library — no duplicated hand-written HTTP call code for API endpoints
- The drift check (backend Swagger doc vs. committed `openapi/api.yaml`) should eventually run in CI, not just locally
- Direct-to-storage requests (e.g. presigned R2 uploads from the `image-storage-r2` skill) are **not** part of this client — those aren't your API's endpoints
