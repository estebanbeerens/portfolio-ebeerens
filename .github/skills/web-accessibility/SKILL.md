---
name: web-accessibility
description: 'Build and review accessible UI components and pages against WCAG 2.2 in the Angular apps (admin, web). AA is the minimum bar for every component; strive for AAA where feasible. Use when creating or editing any user-facing component/page, adding forms/modals/menus/custom widgets, reviewing color/contrast choices, or writing accessibility checks into tests.'
---

# Web Accessibility (WCAG 2.2)

## When to Use

- Building or editing any user-facing component, page, form, or interactive widget in `admin`/`web`
- Choosing colors, focus styles, or custom keyboard interactions
- Reviewing existing UI for accessibility gaps
- Adding accessibility assertions to unit or e2e tests

## Conformance Bar

- **AA is the minimum** — nothing ships below this.
- **AAA is the target** wherever it doesn't conflict with a real product/design constraint. If an AAA criterion is skipped, that's a deliberate tradeoff to call out, not a default.
- WCAG 2.2 organizes criteria under four principles — Perceivable, Operable, Understandable, Robust (POUR). See [wcag-checklist.md](./references/wcag-checklist.md) for the criteria that matter most for this stack, split by AA vs AAA.

## Workflow: Building an Accessible Component

1. **Start with semantic HTML.** Use `<button>`, `<a>`, `<nav>`, `<label>`, `<dialog>`, etc. before reaching for ARIA. A native element gets keyboard support, focus handling, and semantics for free — ARIA is a patch for when semantic HTML can't express the pattern.
2. **Label everything interactive.** Every form control has a `<label for>` (or wraps it); every icon-only button has an accessible name (`aria-label` or visually-hidden text); every image has meaningful `alt` (or `alt=""` if purely decorative).
3. **Design/verify keyboard operability.** Everything reachable by mouse must be reachable and operable by keyboard alone: logical tab order, visible focus indicator (WCAG 2.2 adds `2.4.11 Focus Not Obscured` — don't let sticky headers/footers hide focused elements), `Escape` closes dismissible UI, `Enter`/`Space` activate custom controls.
4. **Give every interactive element distinct hover, active, and focus-visible states.** Never rely on the browser default for any of the three — buttons, links, toggles, form fields, and custom widgets each need their own visible `hover:`/`active:`/`focus-visible:` treatment, and a `cursor-pointer` (or the correct native cursor) so it reads as clickable before the user commits to a click.
5. **Manage focus for dynamic UI.** Opening a modal/menu moves focus into it; closing it returns focus to the triggering element. Route changes in the Angular SPA should move focus to the new view's heading (don't leave focus stranded on a removed element).
6. **Check color and contrast.** Text vs background meets **4.5:1 (AA)** / aim for **7:1 (AAA)** for normal text, **3:1 (AA)** / **4.5:1 (AAA)** for large text. Never convey state/meaning by color alone (error fields need text/icon, not just a red border).
7. **Target size (new in WCAG 2.2).** Interactive targets are at least **24×24px (AA, `2.5.8`)** — aim for **44×44px (AAA, `2.5.5`)** on touch-oriented UI.
8. **Write/verify with assistive tech in mind.** Use ARIA live regions (`aria-live`) for async status updates (form errors, toasts) so screen reader users aren't silently left behind after an SSR/CSR update.
9. **Test it.** See [testing-a11y.md](./references/testing-a11y.md) — automated checks (`@axe-core/playwright` for e2e, `vitest-axe` for unit tests) plus manual keyboard/screen-reader passes. Automated tools only catch ~30-40% of issues; they're a floor, not a substitute for the checks above.

## Angular-Specific Notes

- This repo already follows standalone components + OnPush + signals (see the `angular-frontend` skill) — accessibility attributes are just template bindings, e.g. `[attr.aria-expanded]="isOpen()"`, no extra pattern needed.
- Prefer Angular CDK's `A11yModule` (`FocusTrap`, `LiveAnnouncer`, `cdkTrapFocus`) over hand-rolled focus-trapping/live-region code once a component needs it — check whether `@angular/cdk` is already a dependency before introducing custom focus-management logic.
- Angular's template control flow (`@if`/`@for`) doesn't affect accessibility semantics by itself — the underlying rendered HTML still needs the same landmark/labeling treatment as any other markup.

## Reference Files

- [WCAG 2.2 checklist (AA vs AAA)](./references/wcag-checklist.md)
- [Testing accessibility](./references/testing-a11y.md) — axe automation, Playwright integration, manual passes

## Completion Checklist

- [ ] Semantic HTML used wherever possible; ARIA only fills real gaps
- [ ] Every interactive element has an accessible name and is keyboard-operable
- [ ] Every interactive element has distinct hover, active, and focus-visible states, plus an indicative cursor (`cursor-pointer` or the correct native cursor)
- [ ] Focus order is logical; focus is managed on open/close/navigate
- [ ] Color contrast meets AA at minimum (checked against real design tokens, not eyeballed)
- [ ] Target sizes meet AA (24×24px) minimum
- [ ] Dynamic/async updates are announced (`aria-live`) where relevant
- [ ] Automated a11y check (`vitest-axe` and/or `@axe-core/playwright`) passes with zero violations
- [ ] At least one manual keyboard-only pass done
- [ ] Any AAA criterion knowingly skipped is called out with a reason
