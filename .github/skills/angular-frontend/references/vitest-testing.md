# Vitest Testing Conventions (admin, web)

## Config

- No standalone `vitest.config.ts` — the `test` target uses the `@angular/build:unit-test` executor (see `project.json`), which wires Vitest under the hood.
- `tsconfig.spec.json` sets `"types": ["vitest/globals"]` — `describe`, `it`, `expect`, `beforeEach`, etc. are **globals**. Don't `import { describe, it, expect } from 'vitest'` — this repo relies on the global types.

## Writing a Component Spec

Co-locate `<name>.spec.ts` next to the component. Pattern from [app.spec.ts](../../../../apps/admin/src/app/app.spec.ts):

```ts
import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Welcome');
  });
});
```

Key points:

- Since components are standalone, put the component itself (and any standalone deps it needs) in `imports`, not `declarations`.
- Use `await fixture.whenStable()` before asserting on rendered DOM — this accounts for async rendering (zoneless change detection / signals), not `fixture.detectChanges()` alone.
- Assert against `fixture.nativeElement` for DOM output; assert against the component instance (`fixture.componentInstance`) for signal/state values.

## Testing Signals and Inputs

```ts
const fixture = TestBed.createComponent(UserCard);
fixture.componentRef.setInput('userId', 'abc123');
await fixture.whenStable();
expect(fixture.componentInstance.userId()).toBe('abc123');
```

Use `componentRef.setInput()` to set signal inputs in tests — you can't assign directly to an `input()` signal.

## Testing Services with Dependencies

```ts
describe('SomeService', () => {
  let service: SomeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SomeService, { provide: HttpClient, useValue: mockHttp }],
    });
    service = TestBed.inject(SomeService);
  });
});
```

## Accessibility Assertions

For components with ARIA state or non-trivial markup, add an accessibility check alongside the normal render assertions using `vitest-axe` — see the `web-accessibility` skill's [testing-a11y.md](../../web-accessibility/references/testing-a11y.md) for setup and usage.

## Running

- Single app: `npx nx test admin` / `npx nx test web`
- Watch mode isn't the default (`options.watch: false` in `project.json`) — pass `--watch` explicitly if needed during development
- All frontend unit tests: `npx nx run-many -t test -p admin web`
