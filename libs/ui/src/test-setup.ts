import '@angular/compiler';
import '@analogjs/vitest-angular/setup-snapshots';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';
import { expect } from 'vitest';
import { toHaveNoViolations } from 'vitest-axe/matchers';

// vitest-axe's own `extend-expect` entry point ships empty in 0.1.0; extend manually.
expect.extend({ toHaveNoViolations });

setupTestBed();
