---
name: tailwindcss4-tokens
description: "Build and review Angular UI with Tailwind CSS 4 using this workspace's shared design tokens. Use when styling components, adding utilities, extending @theme, implementing light/dark mode, choosing semantic colors, or debugging Tailwind token generation."
argument-hint: 'Describe the component, page, or token you need to style.'
user-invocable: true
---

# Tailwind CSS 4 Token Styling

Use this skill for user-facing styling in `apps/admin`, `apps/web`, and shared UI code in `libs/ui`. The source of truth is [tokens.css](../../../libs/ui/src/theme/tokens.css). Keep the CSS-first Tailwind 4 setup intact and prefer existing semantic tokens over new one-off values.

## Workspace Setup

- Tailwind CSS `4.x` is installed with `@tailwindcss/postcss`.
- Global app styles import Tailwind with `@import 'tailwindcss' source('./app');`.
- Both apps import `libs/ui/src/theme/index.css`, which defines the class-based `dark` variant and imports the shared tokens.
- App styles include `@source '../../../libs/ui';` so Tailwind scans shared UI templates.
- `prettier-plugin-tailwindcss` is installed and should sort utility classes.
- Dark mode is class based: use or preserve the `.dark` class on an ancestor. Do not replace this with media-query dark mode.

## Token Contract

### Typography

Use the theme font utilities rather than arbitrary font-family values:

| Token                        | Tailwind utility examples |
| ---------------------------- | ------------------------- |
| `--font-sans` (`Geist`)      | `font-sans`               |
| `--font-display` (`Outfit`)  | `font-display`            |
| `--font-mono` (`Geist Mono`) | `font-mono`               |

Use `font-display` for prominent headings and `font-sans` for interface and body text. Keep `font-mono` for code, metadata, or numeric readouts.

Use `text-base` (`1rem`, 16px) for body and ordinary interface text. Use `text-sm` (`0.875rem`, 14px) for compact supporting text, metadata, and dense controls. When translating Figma, map both 13px and 14px text to `text-sm`; do not add a 13px text size or arbitrary font-size value.

### Iconography

Use `size-4` (16px) as the default icon box. Use another size only when the icon's visual hierarchy or interaction role deliberately calls for it; do not introduce arbitrary icon dimensions for ordinary interface controls.

### Primitive colors

Use these when a component needs a deliberate scale value:

- Neutral: `neutral-950`, `neutral-900`, `neutral-800`, `neutral-700`, `neutral-600`, `neutral-500`, `neutral-400`, `neutral-300`, `neutral-200`, `neutral-100`, `neutral-50`, `neutral-0`
- Cyan: `cyan-100`, `cyan-300`, `cyan-400`, `cyan-500`, `cyan-700`, `cyan-900`
- Violet: `violet-100`, `violet-300`, `violet-500`, `violet-700`
- Blue: `blue-100`, `blue-300`, `blue-500`, `blue-700`

Examples: `bg-neutral-950`, `text-cyan-500`, `border-violet-300`. Do not invent a nearby shade such as `cyan-600`; add a token to `tokens.css` only when the design genuinely requires it and the token is reusable.

### Semantic colors

Prefer these for application UI because their values change between light and dark themes:

| Purpose              | Utilities                                                                |
| -------------------- | ------------------------------------------------------------------------ |
| Page background      | `bg-bg`                                                                  |
| Surface or panel     | `bg-surface`                                                             |
| Primary text         | `text-text`                                                              |
| Secondary text       | `text-text-muted`                                                        |
| Default border       | `border-border`                                                          |
| Subtle border        | `border-border-subtle`                                                   |
| Strong border        | `border-border-strong`                                                   |
| Primary action       | `bg-accent`, `text-accent`                                               |
| Primary action hover | `hover:bg-accent-hover`, `hover:text-accent-hover`                       |
| Error state          | `text-error`, `border-error`, `bg-error`                                 |
| Success state        | `text-success`, `border-success`, `bg-success`                           |
| Secondary accent     | `text-accent-secondary`, `bg-accent-secondary`                           |
| Tertiary accent      | `text-accent-tertiary`, `bg-accent-tertiary`                             |
| Glass treatment      | `bg-glass`, `hover:bg-glass-hover`, `data-[active=true]:bg-glass-active` |
| Overlay              | `bg-overlay`                                                             |

The semantic aliases resolve to `--*-value` variables. Those values are defined in `:root` and `.dark`; do not bypass them with `dark:` overrides unless a genuinely different component treatment is required.

### Effects

- Glass blur: `blur-glass`
- Glow blur: `blur-glow`
- Shared elevation: `shadow-elevation`

Use effects sparingly. A glass surface should normally combine a glass background, a border, and `backdrop-blur-glass`; do not use blur as a substitute for hierarchy or contrast.

## Procedure

1. **Locate the owning surface.** Identify the Angular component or shared UI primitive that controls the markup and its stylesheet. Reuse the existing component pattern and keep styles close to that surface.
2. **Choose semantic tokens first.** Start with `bg-bg`, `bg-surface`, `text-text`, `text-text-muted`, and border tokens. Select a primitive cyan, violet, blue, or neutral scale only for intentional emphasis, status, or illustration.
3. **Build states explicitly.** Add visible `hover:`, `focus-visible:`, `active:`, `disabled:`, and validation states where the control supports them. Use the class-based `dark:` variant only when the semantic token itself cannot express the needed contrast.
4. **Keep utility classes readable.** Use Tailwind utilities in templates for local styling. Use component CSS for selectors, pseudo-elements, animations, or repeated compositions that become less clear as a class string. Do not recreate `@theme` tokens in component styles.
5. **Preserve layout stability.** Give controls and repeated UI stable dimensions with `min-h`, `min-w`, `size-*`, `aspect-*`, grid tracks, or flex constraints where dynamic labels and states could shift layout.
6. **Check accessibility.** Verify text and control contrast in both themes, preserve a visible `focus-visible` indicator, use a real interactive element where possible, and ensure error/success is not conveyed by color alone. Follow the workspace `web-accessibility` skill for detailed WCAG checks.
7. **Format and verify.** Run Prettier on touched files when needed, then run the narrowest relevant Nx target. For app styling, build the owning app; for shared UI changes, test or build `ui` as appropriate.

## Extending Tokens

Only edit [tokens.css](../../../libs/ui/src/theme/tokens.css) when a value is shared, named, and needed by more than one surface or when it completes an existing token family.

1. Add the stable Tailwind-facing alias inside `@theme`, for example `--color-focus-ring: var(--color-focus-ring-value);`.
2. Add matching `--color-focus-ring-value` declarations to both `:root` and `.dark`.
3. Keep light and dark values semantically equivalent and check contrast in each theme.
4. Consume the generated utility, such as `ring-focus-ring`, in the component.
5. Do not add a legacy `tailwind.config.js` or `tailwind.config.ts` to configure this token system.

For a new primitive scale value, add it directly under the appropriate existing color family in `@theme`; do not duplicate it as a semantic value unless the role truly differs from the scale.

## Common Patterns

```html
<section class="bg-bg text-text">
  <div class="border-border-subtle bg-surface shadow-elevation">
    <h2 class="font-display text-text">Project title</h2>
    <p class="text-text-muted">Supporting information</p>
    <button
      type="button"
      class="bg-accent text-neutral-0 hover:bg-accent-hover focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      Open project
    </button>
  </div>
</section>
```

```html
<div class="border-border bg-glass backdrop-blur-glass hover:bg-glass-hover">
  <span class="text-cyan-700 dark:text-cyan-300">Featured</span>
</div>
```

Use `dark:` sparingly in the second pattern: a primitive color is appropriate when the label is intentionally cyan in both themes and needs a theme-specific readable shade. For ordinary text and surfaces, use semantic tokens instead.

## Validation

Run the smallest useful check after editing:

- `npx nx build web` for web app styles
- `npx nx build admin` for admin app styles
- `npx nx test ui` for shared UI behavior
- `npx nx lint web`, `npx nx lint admin`, or `npx nx lint ui` for touched project linting

When a generated utility is missing, first confirm the token is imported before the component is scanned and that the relevant source path is covered by `source()` or `@source`. Then check the utility name against the exact `@theme` variable. Do not solve generation problems by adding arbitrary values or a legacy config file.

## Completion Checklist

- Styling uses the shared theme rather than duplicated hex or `rgb()` values.
- Semantic tokens are used for ordinary surfaces, text, borders, actions, and states.
- Both `:root` and `.dark` remain functional when tokens are changed.
- Interactive states and focus visibility are present.
- Layout does not shift when labels, errors, or loading states appear.
- The owning Nx build, test, or lint target passes.
