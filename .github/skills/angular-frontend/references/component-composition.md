# Container vs. Presentational Components

## When to Split

Split a single component into a **container** + one or more **presentational** components when it's doing all of these at once: fetching/mutating data (`rxResource`, `libs/api-client` calls), owning a nontrivial reactive form or list, and rendering a large template. A component mixing data-fetching _and_ a form/list big enough to need its own validation/empty/loading states is the trigger — don't split a component that's just rendering static markup with a couple of signals.

## Responsibilities

**Container** (the routed component, e.g. `Projects`):

- Injects services (`ProjectsService`, `ToastService`, etc.), owns `rxResource`s and mutation state (`signal<'idle' | 'saving' | 'deleting'>`).
- Owns business rules: payload construction/mapping (e.g. omitting empty optional fields before a `CreateProjectDto` POST), error-message mapping from `HttpErrorResponse` status codes.
- Composes presentational children via `input()`/`output()` bindings — its own template has little markup beyond `@if`/`@for` wiring, no raw form fields or list markup.
- Keeps its original selector/class name and route wiring untouched by the split (only its internal template/logic shrinks).

**Presentational** (e.g. `ProjectList`, `ProjectForm`, `ProjectDeleteDialog`):

- Signal `input()`s for data to render, `output()`s for user intent (`create`, `edit`, `delete`, `saved`, `cancelled` — not `save`/`cancel`, see the naming note below).
- May inject **UI-only** services (`ThemeService`, `ToastService` is borderline — prefer keeping toast calls in the container since they're a side effect of a mutation, not rendering) but never `libs/api-client` services directly.
- May hold local UI-only state that isn't fetched from anywhere — e.g. a component-local signal for "which tab is active" (a markdown/preview toggle) is fine to live in a presentational component; it isn't business state.
- A presentational form component still owns its own `FormGroup`/validation _display_ (`fieldInvalid()`, `markAllAsTouched()`) — the container never reads `.form` directly. It emits the **raw form value** (a plain interface, e.g. `ProjectFormValue`) on submit; the container does any payload-shaping business logic (e.g. dropping empty optional fields) on that emitted value, not the form component.

## Output Naming: Avoid Native DOM Event Collisions

`@angular-eslint/no-output-native` flags output names that collide with a native DOM event. `save` and `cancel` are both native event names (form/dialog `cancel`, etc.) — this repo's existing convention (see `Sidenav.closed`) is to name outputs in the **past tense** to sidestep this: `saved`, `cancelled`, `dismissed`, `confirmed`. Check for collisions before naming a new output; the lint rule will catch it, but past-tense naming avoids the churn.

## Resetting a Presentational Form on Reopen

If a presentational form component derives its initial values from an `input()` (e.g. `project = input<ProjectDto>()`, `undefined` = create mode) via an `effect()`, that effect only re-runs when the **input's value changes**. Switching from editing project A to creating a new one re-triggers it fine (`ProjectDto` object → `undefined`), but re-opening "create" while already in "create" mode (`undefined` → `undefined`) does not, since nothing changed. Add a small `resetToken = input(0)` counter that the container increments on every "begin create"/"begin edit" call, and include it in the effect's dependencies, so the form always resets even when the "meaningful" input didn't change value.

## Worked Example

See the split of the admin Projects feature:

- Container: [projects.component.ts](../../../../apps/admin/src/app/projects/projects.component.ts) / [.html](../../../../apps/admin/src/app/projects/projects.component.html)
- Presentational list: [project-list.component.ts](../../../../apps/admin/src/app/projects/project-list/project-list.component.ts)
- Presentational form: [project-form.component.ts](../../../../apps/admin/src/app/projects/project-form/project-form.component.ts)
- Presentational dialog: [project-delete-dialog.component.ts](../../../../apps/admin/src/app/projects/project-delete-dialog/project-delete-dialog.component.ts)

## Folder Convention

Nest presentational children under the feature folder as sibling directories, not a separate top-level folder: `projects/project-list/`, `projects/project-form/`, `projects/project-delete-dialog/`, alongside the container's own `projects.component.ts`.

## Shared Form-Field Components

Reusable form fields (`ui-input`, `ui-textarea`, and the `ui-form-field` label/hint/error wrapper they compose) live in `libs/ui/src/lib/forms/`, following the `TagCombobox`'s `ControlValueAccessor` pattern. Don't name a component input `id` — Angular reflects static global HTML attribute names (`id`, `class`, `style`, etc.) onto the host element _in addition to_ binding them to a matching component input, which produces a duplicate/conflicting `id` in the rendered DOM. Use a distinct name instead (this repo uses `controlId`).
