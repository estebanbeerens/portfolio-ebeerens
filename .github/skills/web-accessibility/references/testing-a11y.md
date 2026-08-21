# Testing Accessibility (this repo)

## Automated E2E: `@axe-core/playwright`

Installed as a root devDependency. Use in a Playwright e2e spec (`admin-e2e`/`web-e2e` — see the `e2e-testing` skill for the surrounding spec conventions):

```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('home page has no automatic a11y violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
  expect(results.violations).toEqual([]);
});
```

- Scope `.withTags()` to the WCAG version/level being enforced (`wcag22aa` for the 2.2 AA rules) so results map directly to the conformance bar.
- Treat this as a floor: axe/automated tools catch structural/contrast/name-role-value issues, not focus order, keyboard traps, or whether an error message is actually helpful.

## Automated Unit Test: `vitest-axe`

Installed as a root devDependency (a Vitest-compatible fork of `jest-axe`). It adds a `toHaveNoViolations()` matcher.

One-time setup — extend Vitest's `expect` with the matchers. Add to the app's test setup file (create `src/test-setup.ts` if one doesn't exist yet) and register it via the `test` target's `runnerConfig` in `project.json` (the `@angular/build:unit-test` executor doesn't expose a `setupFiles` option directly; `runnerConfig` points at a Vitest config that can set it):

```ts
// apps/admin/src/test-setup.ts (or apps/web/src/test-setup.ts)
import 'vitest-axe/extend-expect';
```

Then in a component spec (see the `angular-frontend` skill for the surrounding TestBed pattern):

```ts
import { axe } from 'vitest-axe';

it('has no accessibility violations', async () => {
  const fixture = TestBed.createComponent(Dropdown);
  await fixture.whenStable();
  const results = await axe(fixture.nativeElement);
  expect(results).toHaveNoViolations();
});
```

- If the setup file isn't wired up yet for a given app, `import 'vitest-axe/extend-expect'` directly at the top of the spec file works as a one-off without changing project config.
- Use this for individual component-level checks; use `@axe-core/playwright` for whole-page/route-level checks where layout, routing, and real CSS are in play.

## Manual Keyboard Pass

For every new interactive component/page:

1. Unplug the mouse (mentally). Tab through the whole flow.
2. Confirm: every control is reachable, focus is visible at every stop, order matches visual layout.
3. Trigger the component's core interaction with keyboard only (`Enter`/`Space`/arrow keys for custom widgets like menus/tabs/comboboxes).
4. Confirm `Escape` closes anything dismissible (modal, menu, popover) and returns focus to the trigger.
5. Confirm no keyboard trap — you can always Tab/Shift+Tab away.

## Manual Screen Reader Spot Check

Not required for every change, but for new non-trivial widgets (custom dropdowns, modals, live-updating regions):

- macOS: VoiceOver (`Cmd+F5`)
- Confirm the element's announced role/name/state matches its visual behavior (e.g. a custom toggle announces "button, pressed" not just "button").

## Manual ARIA State Assertions (Vitest)

For quick checks that don't need a full axe run, assert on ARIA attributes/roles directly against the rendered DOM (see the `angular-frontend` skill for the Vitest/TestBed pattern):

```ts
it('exposes expanded state to assistive tech', async () => {
  const fixture = TestBed.createComponent(Dropdown);
  await fixture.whenStable();
  const trigger = fixture.nativeElement.querySelector('[data-testid="dropdown-trigger"]');
  expect(trigger?.getAttribute('aria-expanded')).toBe('false');
});
```

This is narrower than `vitest-axe` — it locks in one specific state transition rather than running a full ruleset. Prefer `vitest-axe`'s `axe()`/`toHaveNoViolations()` for general coverage, and use this style only when asserting a specific state transition matters more than a full scan.

## When Reviewing Existing UI

1. Run the automated axe check first — fix anything it flags.
2. Do the manual keyboard pass.
3. Check contrast against actual computed styles (browser DevTools contrast checker), not the design file — rendered colors can drift from tokens.
4. Record any AAA criterion that's intentionally not met, with the reason, rather than leaving it unaddressed and unstated.
