import { expect } from 'vitest';
import 'vitest-axe/extend-expect';
import * as matchers from 'vitest-axe/matchers';

// vitest-axe's public `matchers.d.ts` re-exports everything as type-only even though the
// runtime export is a real function, so the named import must go through the namespace object.
// `extend-expect` provides the `Assertion` type augmentation (its runtime export is empty).
expect.extend(matchers as unknown as Parameters<typeof expect.extend>[0]);

class TestIntersectionObserver {
  observe(): void {
    void 0;
  }
  disconnect(): void {
    void 0;
  }
  unobserve(): void {
    void 0;
  }
}

globalThis.IntersectionObserver = TestIntersectionObserver as unknown as typeof IntersectionObserver;
