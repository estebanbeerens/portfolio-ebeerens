# Spec-First Workflow & Drift Detection

## Why Spec-First

Per the architecture plan §7, the intended flow is:

```
OpenAPI specification (openapi/api.yaml)
        │
        ├──► Backend implementation
        │
        └──► Generated frontend API client
```

Without a committed, authoritative file, "the OpenAPI contract" is just whatever `@nestjs/swagger`'s decorators happen to produce at any given moment — drift between what the backend does and what the frontend client was generated from goes unnoticed until something breaks at runtime.

## Exporting `openapi/api.yaml`

Don't use a standalone `ts-node` script — Prisma 7's generated client ([client.ts](../../../../apps/api/src/generated/prisma/client.ts)) uses `import.meta.url` and is ESM-only. `ts-node`'s per-file CommonJS transpile can't load it (Node's synchronous ESM-from-CJS interop chokes on the mixed output). Webpack's bundler _can_ resolve this correctly, so the export logic lives in [main.ts](../../../../apps/api/src/main.ts) itself, gated by an env var, and is run from the already-built bundle:

```ts
// apps/api/src/main.ts (excerpt)
if (process.env.EXPORT_OPENAPI === 'true') {
  mkdirSync('openapi', { recursive: true });
  writeFileSync('openapi/api.yaml', dump(swaggerDocument));
  await app.close();
  return;
}
```

Run via the `export-openapi` Nx target (depends on `build`, then runs `node dist/apps/api/main.js` with `EXPORT_OPENAPI=true`):

```
npx nx run api:export-openapi
```

Commit the resulting `openapi/api.yaml` — from this point on, it's the contract, not just an export.

## Drift Check

Re-run `npx nx run api:export-openapi`, then diff the working tree:

```bash
npx nx run api:export-openapi
git diff --exit-code openapi/api.yaml
```

A non-empty diff means the backend's decorators and the committed spec have diverged, and the PR should fix one or the other before merging. Wire this as a CI step once CI exists (see the `infrastructure-deployment` skill).

## Practical Discipline

- If you changed `openapi/api.yaml` by hand first (true spec-first), the diff check confirms you actually implemented what you designed.
- If you changed a decorator first out of habit, the diff check catches it — go back and update the spec file so it still reflects the one true contract, then re-run the diff.
- Either direction is fine as a starting point for a single change; what matters is that the diff is clean before the change is considered done.
