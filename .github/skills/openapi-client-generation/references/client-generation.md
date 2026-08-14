# Client Generation Setup

## Prerequisite: Java
`openapi-generator-cli` wraps a Java-based generator (the JAR). It requires a Java runtime ≥11 installed locally and in CI — this isn't installed by npm alone. Verify with `java -version` before relying on it; if missing, install a JDK (e.g. via `brew install openjdk` on macOS) or use CI's `actions/setup-java`.

## Install
```
npm install -D @openapitools/openapi-generator-cli
```

## Scaffold the Shared Library
`libs/api-client` is a **plain buildable TS library** via `@nx/js:library`, not `@nx/angular:library` — the generated code is plain `@Injectable` classes with no components/templates, so Angular's component compiler (`ng-packagr`) isn't needed and only adds overhead. `@nx/angular:library` also always scaffolds a demo component or `NgModule` entry point that doesn't apply here.
```
npx nx generate @nx/js:library --directory=libs/api-client --name=api-client \
  --bundler=tsc --unitTestRunner=none \
  --importPath=@portfolio-ebeerens/api-client --useProjectJson --no-interactive
```
Don't name the project `api` — that collides with the existing `apps/api` project name (Nx project names must be unique workspace-wide, not just per-directory).

Delete the placeholder `src/lib/api-client.ts` this generates; the library's only export is the generated client (see below).

## Config File
Pass generator options via a committed config file rather than long inline flags, so every regeneration is identical:
```json
// libs/api-client/openapi-generator-config.json
{
  "npmName": "@portfolio-ebeerens/api-client",
  "ngVersion": "22.0.0",
  "providedInRoot": true,
  "supportsES6": true,
  "useSquareBracketsInArrayNames": true
}
```
- `typescript-angular` is the idiomatic generator for this stack — it produces injectable Angular services per API tag, matching `HttpClient`-based DI patterns already used in `admin`/`web`.
- `providedInRoot: true` lets the generated services be injected via `inject()` without extra module wiring, consistent with the `angular-frontend` skill's standalone-everywhere approach.

## Generate the Client
```
npm run generate:api-client
```
which runs:
```
openapi-generator-cli generate -i openapi/api.yaml -g typescript-angular \
  -o libs/api-client/src/generated -c libs/api-client/openapi-generator-config.json
```
The generator also emits its own `package.json`, `tsconfig.json`, `ng-package.json`, and `git_push.sh` — meant for standalone npm publishing, and they conflict with the library's own config in a nested-folder setup like this. The `generate:api-client` script deletes them in the same run (see the actual command in [package.json](../../../../package.json)); don't remove that cleanup step when touching the script.

Re-export the generated output from the library's `src/index.ts`:
```ts
// libs/api-client/src/index.ts
export * from './generated';
```

## Lint
The generated code doesn't conform to this repo's ESLint rules (unused imports, `@ts-ignore` vs `@ts-expect-error`, etc.) — exclude it rather than fixing generated output by hand:
```js
// libs/api-client/eslint.config.mjs
export default [
  { ignores: ['src/generated/**'] },
  ...baseConfig,
];
```

## Treat Generated Output as Fully Generated
- Never hand-edit anything under `libs/api-client/src/generated` — regenerate instead. If the generated shape doesn't fit a use case, that's a signal to adjust `openapi/api.yaml`, not to patch the output.
- **Commit the generated output** rather than regenerating it as part of every build — this avoids requiring a Java runtime just to run `nx build web`/`nx build admin`. Regenerate explicitly via `npm run build:api-client` (as its own step, ideally checked by the drift-detection script from [spec-first-workflow.md](./spec-first-workflow.md)) whenever `openapi/api.yaml` changes.

## Consuming the Client
In `web`/`admin`, inject the generated service directly rather than writing raw `HttpClient` calls:
```ts
import { inject } from '@angular/core';
import { ProjectsService } from '@portfolio-ebeerens/api-client';

export class ProjectList {
  private readonly projectsService = inject(ProjectsService);
  protected readonly projects = toSignal(this.projectsService.projectsControllerFindAll());
}
```
Both apps import from the **same** library path — don't let one app grow a second, slightly different hand-written API layer alongside the generated one.
