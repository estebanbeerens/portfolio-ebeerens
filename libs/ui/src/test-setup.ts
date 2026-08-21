import '@angular/compiler';
import '@analogjs/vitest-angular/setup-snapshots';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';
import { expect } from 'vitest';
// vitest-axe's package-root `matchers.d.ts` re-exports via `export type *`, which makes
// `toHaveNoViolations` unimportable as a value there — import from the underlying dist file instead.
import { toHaveNoViolations } from 'vitest-axe/dist/matchers';
import type { AxeMatchers } from 'vitest-axe/matchers';

// vitest-axe's own `extend-expect` entry point ships empty in 0.1.0; extend manually.
expect.extend({ toHaveNoViolations });

setupTestBed();

// vitest-axe doesn't ship a Vitest `Assertion` augmentation (it's a jest-axe fork) — declared here
// instead so `expect(results).toHaveNoViolations()` type-checks across every spec in this project.
declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-empty-interface, @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  interface Assertion<T = any> extends AxeMatchers {}
}
