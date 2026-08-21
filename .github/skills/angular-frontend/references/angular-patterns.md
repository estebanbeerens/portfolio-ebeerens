# Angular 22 Patterns (this repo)

## Standalone Components

No `NgModule` anywhere in `admin`/`web`. Every component declares its own `imports`:

```ts
@Component({
  selector: 'app-root',
  imports: [RouterModule, SomeOtherStandaloneComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected title = 'admin';
}
```

Note the class is `App`, not `AppComponent` — this repo follows the Angular style guide that drops the `Component`/`Service`/`Directive` type suffix from class names.

## Signals for State

```ts
export class Counter {
  protected readonly count = signal(0);
  protected readonly doubled = computed(() => this.count() * 2);

  increment() {
    this.count.update((v) => v + 1);
  }
}
```

Prefer this over a plain class field + manual change detection, or an RxJS `BehaviorSubject` for state that doesn't need operators.

## Signal-Based Inputs/Outputs

```ts
export class UserCard {
  readonly userId = input.required<string>();
  readonly nameFilter = input<string>('');
  readonly selected = output<string>();
}
```

Not `@Input()`/`@Output()` decorators — this repo targets Angular 22 where signal inputs/outputs are the standard API.

## New Control Flow

Templates use the built-in block syntax, not structural directives:

```html
@if (user(); as u) {
<p>{{ u.name }}</p>
} @else {
<p>No user</p>
} @for (item of items(); track item.id) {
<li>{{ item.name }}</li>
}
```

Not `*ngIf` / `*ngFor`. This also means `CommonModule` is usually unnecessary in `imports` — only add it if you need a specific pipe (`AsyncPipe`, `DatePipe`, etc.), and prefer importing that pipe directly instead of the whole module.

## `inject()` Over Constructor Injection

```ts
export class UserCard {
  private readonly http = inject(HttpClient);
}
```

Preferred for new code — especially useful when combined with `input()`/computed-based initialization that needs a dependency before the constructor body runs.

## `rxResource` for Async Reads

Prefer `rxResource` (from `@angular/core/rxjs-interop`) over a manual `.subscribe()` into a `signal()` whenever a component fetches/derives data from an `Observable` — it tracks loading/error state for you and re-fetches reactively when `params` changes:

```ts
import { rxResource } from '@angular/core/rxjs-interop';
import { ProjectsService } from '@portfolio-ebeerens/api-client';

export class ProjectDetail {
  private readonly projectsService = inject(ProjectsService);
  readonly projectId = input.required<string>();

  private readonly project = rxResource({
    params: () => ({ id: this.projectId() }),
    stream: ({ params }) => this.projectsService.projectsControllerFindOne(params.id),
  });

  protected readonly title = computed(() => this.project.value()?.title);
  protected readonly isLoading = this.project.isLoading;
}
```

- `params` is a reactive function — whenever the signals it reads change, the resource re-fetches automatically. Return `undefined` from `params` to skip the load entirely (e.g. gating a fetch on `isPlatformBrowser` — see [app.ts](../../../../apps/admin/src/app/app.ts) for a real example that skips the fetch during SSR this way, instead of an `isPlatformBrowser` early-return in the constructor).
- Read `.value()`, `.isLoading()`, `.error()`, `.status()` as signals; call `.reload()` to refetch on demand.
- Don't reach for `rxResource` for one-off imperative commands (a button's POST/DELETE) — a plain `.subscribe()` in the handler is still correct there, since there's no "current value" to track as state.

## `effect()` for Side Effects

Prefer `effect()` over a manual `.subscribe()` when the goal is reacting to a signal (including a resource's `value`) with an imperative side effect, not deriving a new value (that's `computed()`):

```ts
export class ThemePicker {
  private readonly platformId = inject(PLATFORM_ID);
  readonly theme = signal<'light' | 'dark'>('light');

  constructor() {
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      document.body.dataset['theme'] = this.theme();
    });
  }
}
```

- Effects run after the signals they read change, and clean up automatically when the component is destroyed — no manual `Subscription`/`takeUntilDestroyed` bookkeeping needed.
- Still SSR-guard any `window`/`document`/`localStorage` access inside the effect body.

## SSR Safety

Both `admin` and `web` render on the server ([app.config.server.ts](../../../../apps/admin/src/app/app.config.server.ts), [server.ts](../../../../apps/admin/src/server.ts)). Any direct browser global access must be guarded:

```ts
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';

export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);

  applyTheme() {
    if (!isPlatformBrowser(this.platformId)) return;
    document.body.classList.add('dark');
  }
}
```

Never reference `window`, `document`, `localStorage`, or `navigator` at module/class-field initialization time — only inside methods guarded this way, since that code path also runs during SSR.
