---
name: angular-frontend
description: 'Build and modify Angular frontend code in this Nx workspace (admin, web apps) following Angular 22 best practices — standalone components, signals, new control flow, OnPush — with SSR awareness, and write unit tests with Vitest. Use when creating or editing Angular components, services, or routes; adding SSR-aware code; or writing/updating component unit tests.'
---

# Angular Frontend Development

## When to Use

- Creating or editing a component, service, directive, or route in `admin` or `web`
- Deciding between signals vs RxJS, or which control-flow syntax to use in a template
- Fetching async data (HTTP calls) or reacting to signal changes with a side effect
- Writing or updating a Vitest unit test for a component/service
- Reviewing Angular code for adherence to this repo's conventions

## Stack in This Repo

- Angular 22, both `admin` and `web` apps are standalone (no `NgModule`) with SSR configured (`app.config.server.ts`, `app.routes.server.ts`, `server.ts`, `main.server.ts`)
- Unit tests run via Vitest, wired through the `test` target (`@angular/build:unit-test` executor) — there's no standalone `vitest.config.ts`; config comes from `tsconfig.spec.json`'s `types: ["vitest/globals"]`, so `describe`/`it`/`expect` are globals, not imports
- ESLint (`eslint.config.mjs`) enforces `app` prefix: components `kebab-case` (e.g. `app-nx-welcome`), directives `camelCase`
- Component class names drop the `Component` suffix (e.g. `App`, not `AppComponent`) — follow this in new components

## Workflow: Add/Edit a Component

1. **Scaffold.** Use the `nx-generate` skill to scaffold a new component, or create manually following [app.ts](../../../apps/admin/src/app/app.ts) as the reference pattern.
2. **Standalone only.** Never add an `NgModule`; use the `imports` array directly on `@Component`.
3. **OnPush change detection.** Set `changeDetection: ChangeDetectionStrategy.OnPush` on every new component.
4. **Signals for state.** Use `signal()`/`computed()` for local component state instead of plain class fields or RxJS `BehaviorSubject` for simple cases.
5. **Signal-based inputs/outputs.** Use `input()`/`output()` functions instead of `@Input()`/`@Output()` decorators.
6. **`inject()` over constructor injection** for new code, unless the constructor pattern is clearer for a small set of deps.
7. **`rxResource` for async reads.** Always prefer `rxResource` (from `@angular/core/rxjs-interop`) over a manual `.subscribe()` + `signal()` pair when a component needs to fetch/derive data from an `Observable` (e.g. an `libs/api-client` call). Gate SSR-unsafe or conditional fetches by having `params` return `undefined` (skips the load) instead of an `isPlatformBrowser` early-return in the constructor.
8. **`effect()` for side effects.** Always prefer `effect()` over a manual `.subscribe()` when the goal is reacting to a signal (including a resource's `value`/`status`) with an imperative side effect (DOM/`window`/`localStorage` access, logging, syncing to a non-signal API) — not for deriving a value, that's what `computed()` is for. Reserve raw `.subscribe()` for one-off imperative commands that aren't modeled as state (e.g. a logout button's POST call).
9. **New control-flow syntax.** Use `@if`/`@for`/`@switch` in templates — never `*ngIf`/`*ngFor`. Drop `CommonModule` from `imports` if nothing else in it is used.
10. **File conventions.** `templateUrl`/`styleUrl` (singular — this repo doesn't use inline templates or `styleUrls` arrays).
11. **SSR-safety.** Since both apps render on the server, never touch `window`/`document`/`localStorage` directly in a component/service without an `isPlatformBrowser()` guard (`@angular/common`) — it will crash SSR rendering.
12. **Write the spec.** See [Vitest testing conventions](./references/vitest-testing.md) — every component/service gets a co-located `*.spec.ts`.
13. **Verify:** `npx nx test <admin|web>`, `npx nx build <admin|web>`, `npx nx lint <admin|web>`

## Reference Files

- [Angular 22 patterns](./references/angular-patterns.md) — signals, control flow, inputs/outputs, SSR guards with code examples
- [Vitest testing conventions](./references/vitest-testing.md) — TestBed setup, globals, async rendering, running tests

## Related Skills

- **`openapi-client-generation`** — call the generated `libs/api-client` service via `inject()`, don't write raw `HttpClient` calls for API endpoints.
- **`web-accessibility`** — WCAG 2.2 conformance for any user-facing component.
- **`image-storage-r2`** — TipTap editor wiring and safe rendering of rich-text project descriptions.

## Best Practices Checklist

- Standalone components only — no `NgModule`
- `ChangeDetectionStrategy.OnPush` everywhere
- Signals (`signal`, `computed`, `input`, `output`) over decorators and ad-hoc RxJS state
- `rxResource` over manual `.subscribe()` + `signal()` for async data fetches
- `effect()` over manual `.subscribe()` for reacting to signal/resource changes with a side effect
- New control-flow (`@if`/`@for`/`@switch`) over structural directives
- SSR-guard any direct browser API access — prefer gating a resource's `params` to `undefined` over an `isPlatformBrowser` early-return where the SSR-unsafe work is itself an async fetch
- Selector prefix/casing must match `eslint.config.mjs` (`app-*` kebab-case elements, `app*` camelCase attributes) — don't fight the lint config, fix the name instead
- Every component/service ships with a co-located spec file
