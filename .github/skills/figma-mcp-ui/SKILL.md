---
name: figma-mcp-ui
description: 'Implement Figma designs in this Angular Nx workspace using Figma MCP, existing components, and the shared Tailwind CSS 4 token system. Use when mapping Figma components to code, creating new components in libs/ui, translating Figma screens, inspecting design-system assets, updating Figma Code Connect, or reconciling Figma variables with tokens.css.'
argument-hint: 'Provide a Figma node URL and describe the component or screen to implement.'
user-invocable: true
---

# Figma MCP UI Implementation

Use this workspace skill for Figma-to-Angular work in `apps/admin`, `apps/web`, and `libs/ui`. The goal is production code that preserves the Figma design intent while fitting the existing Angular, Nx, accessibility, and Tailwind CSS 4 conventions.

The implementation source of truth is the combination of:

- The selected Figma node and its design context
- Existing components and APIs in `libs/ui`
- Shared Tailwind tokens in [tokens.css](../../../libs/ui/src/theme/tokens.css)
- Angular conventions in [angular-frontend](../angular-frontend/SKILL.md)
- Accessibility requirements in [web-accessibility](../web-accessibility/SKILL.md)
- Tailwind usage and token-extension rules in [tailwindcss4-tokens](../tailwindcss4-tokens/SKILL.md)

## When to Use

- Implement a Figma component, frame, page, or screen as Angular code.
- Decide whether a Figma component maps to an existing UI-library component.
- Create a new reusable component in `libs/ui` from a Figma design.
- Map Figma variants, text properties, booleans, slots, and instance swaps to Angular inputs and outputs.
- Reconcile Figma colors, typography, spacing, radii, shadows, or modes with Tailwind `@theme` tokens.
- Update or create Code Connect mappings after a component has a stable code API.
- Review an existing Figma-to-code implementation for visual fidelity, token usage, accessibility, or responsive behavior.

## Required Inputs and Branching

1. Require a node-specific Figma URL for design-to-code work. Parse the file key and convert a URL node ID such as `123-456` to `123:456`. If the URL has no `node-id`, ask for the exact frame or component node; never guess it.
2. Identify whether the target is a component, component set, instance, frame, or composed screen.
3. For a single component, choose the existing-component or new-component branch after the reuse check.
4. For a composed screen or multi-section layout, keep the page composition in the owning app and extract only reusable primitives or repeated patterns into `libs/ui`.
5. If Figma and code disagree on behavior or public API, surface the conflict before changing the contract. Preserve the existing API unless the user explicitly approves a breaking change.

## MCP Call Order

Follow this order for every Figma-to-code task:

1. **Load the official Figma guidance.** Before using MCP, load `figma-design-to-code`. Also load `figma-use` for any Figma JavaScript read or write, and `figma-code-connect` only when creating or updating a Code Connect template.
2. **Search the design system first.** Call `search_design_system` with one focused query at a time for likely components, variables, and styles. Reuse a matching published design-system asset when its API, variants, and token model fit.
3. **Fetch design context.** Call `get_design_context` for the exact node before writing application code. Include the required `skillNames` value, using `resource:figma-design-to-code` when the guidance was loaded from the MCP skill resource.
4. **Inspect the codebase locally.** Check the likely `libs/ui` component and index/export paths, then the consuming app only as needed. Search for existing token names and component APIs before creating equivalents.
5. **Implement and validate.** Adapt the returned reference code to Angular; never paste React or generated Tailwind markup verbatim.

Do not use shell commands such as `curl` or `wget` to access Figma URLs. Use Figma MCP tools for Figma data and assets.

## Gate Checks

Use these checkpoints internally before moving forward:

- **G1: Design context.** The target node, screenshot/reference output, and relevant Figma properties are available.
- **G2-G4: Pre-edit.** The target stack is Angular 22; likely existing components and exports have been checked; design hints, Code Connect data, annotations, and token information have been applied in priority order.
- **G5: Fidelity.** Images and icons use the intended assets or a clearly matching existing icon component; dimensions and aspect ratios are preserved; the rendered result has been checked at representative viewport sizes.

Do not write application code before G1 and G2-G4 are satisfied. Do not finish with unresolved asset, token, or accessibility gaps.

## Reuse Branch: Map to an Existing Component

Choose this branch when an existing `libs/ui` component has a compatible public API and visual role.

1. Compare Figma properties with the component API:
   - `TEXT` to a string `input()`
   - `BOOLEAN` to a boolean `input()`
   - `VARIANT` to a typed union input
   - `INSTANCE_SWAP` to an icon or content input
   - `SLOT` to projected content or an explicitly supported content input
   - Figma actions to Angular `output()` events
2. Confirm every Figma variant value has a code representation. Do not silently drop a state or emit an input that is not part of the component API.
3. Reuse the existing component and add only the composition, bindings, or styles needed for the target design.
4. If visual differences require a new prop or variant, first determine whether that behavior is reusable. Add a typed API and tests rather than a page-specific class escape hatch.
5. Update Code Connect only after the code component API is stable. Code Connect templates are `.figma.ts`, never `.figma.tsx`; map all Figma variants exhaustively.

## New Component Branch: Create in `libs/ui`

Choose this branch when no existing component matches, the component API is incompatible, or the design introduces a reusable interaction.

1. Define the component boundary and public API before styling. Use a standalone Angular component with `ChangeDetectionStrategy.OnPush`, signal-based `input()`/`output()`, and Angular 22 control flow.
2. Put the reusable component under `libs/ui/src/lib/<component-name>/` following the library's existing naming and export conventions. Keep app-only composition in the app.
3. Create a co-located Vitest spec. Cover default rendering, each meaningful variant/state, keyboard interaction, and emitted outputs.
4. Resolve the token mapping before finalizing markup or CSS. Do not leave Figma hex values, arbitrary font families, or duplicated spacing values in the component when an existing token can express them.
5. Export the component through the appropriate `libs/ui` barrel so both Angular apps can consume it.
6. Add Code Connect only when the component is published or otherwise eligible for the repository's Code Connect workflow, and only after the code API and variants are stable.

## Tailwind Token Reconciliation

Every Figma implementation must perform this check, even when no token change is ultimately needed.

1. Map Figma values to existing utilities first:
   - Surfaces and page backgrounds: `bg-bg`, `bg-surface`
   - Text: `text-text`, `text-text-muted`
   - Body and interface text: `text-base` (`1rem`, 16px); compact supporting text: `text-sm` (`0.875rem`, 14px). Treat Figma's 13px and 14px text as `text-sm`; do not introduce a 13px text size.
   - Icons: `size-4` (16px) by default. Use a different size only when the icon has a distinct, intentional design role.
   - Borders: `border-border`, `border-border-subtle`, `border-border-strong`
   - Actions: `bg-accent`, `hover:bg-accent-hover`
   - Status: `text-error`, `text-success`
   - Type: `font-sans`, `font-display`, `font-mono`
   - Effects: `blur-glass`, `blur-glow`, `shadow-elevation`
2. Use primitive scales such as `neutral-*`, `cyan-*`, `violet-*`, and `blue-*` only when the visual role is intentionally tied to that scale rather than a semantic application role.
3. Preserve the class-based `.dark` variant and verify the component in both `:root` and `.dark`. Prefer semantic aliases whose values already swap between themes; do not add ad hoc `dark:` overrides for ordinary surfaces or text.
4. If Figma introduces a genuinely shared value with no suitable token, update [tokens.css](../../../libs/ui/src/theme/tokens.css) before calling the component complete:
   - Add the Tailwind-facing alias inside `@theme`.
   - Add matching `--*-value` declarations in both `:root` and `.dark`.
   - Keep the light and dark values semantically equivalent and check contrast.
   - Consume the generated utility in the component.
5. Never add `tailwind.config.js` or `tailwind.config.ts` for this system. Do not solve missing utilities with arbitrary values before checking imports and source scanning.
6. If a Figma token has no code equivalent and is only a one-off geometry value, keep it local rather than inventing a global token. Record the rationale in the implementation summary when it affects fidelity.

## Angular Adaptation Rules

- Use standalone components and `ChangeDetectionStrategy.OnPush`.
- Use `input()`, `output()`, `signal()`, and `computed()` according to the existing Angular patterns.
- Use `@if`, `@for`, and `@switch`; do not introduce `*ngIf` or `*ngFor`.
- Use `templateUrl` and `styleUrl` for non-trivial components.
- Guard direct `window`, `document`, and `localStorage` access for SSR.
- Use existing Lucide Angular icons when the glyph clearly matches. If the Figma asset is materially different, preserve the exported asset rather than substituting a generic icon.
- Use `size-4` for icons by default; choose a different size only for an intentional visual hierarchy or interaction need.
- Use responsive layout primitives and stable dimensions. Avoid hard-coded absolute positioning copied from Figma unless the design genuinely requires it.
- Preserve the Figma hierarchy, typography, spacing rhythm, and state behavior while adapting the layout to content and responsive widths.

## Asset and Fidelity Rules

- Render every meaningful image and icon from the intended exported asset or a verified existing project asset.
- Preserve outer asset boxes, inner artwork dimensions, aspect ratios, and designed padding independently.
- Do not use screenshots as production assets.
- Prefer auto-layout and normal responsive flow over absolute coordinates.
- Verify one representative of each shared sizing rule and every exception.
- Check the implementation in light and dark themes and at desktop and mobile widths. When a dev server is available, use the workspace's browser/e2e tooling for a screenshot or focused visual check.

## Accessibility Review

Before completion, verify:

- Text and controls meet WCAG AA contrast in both themes.
- Keyboard focus is visible with `focus-visible` styling.
- Interactive elements use semantic HTML and have accessible names.
- Icon-only controls have an accessible label and a tooltip where the icon is unfamiliar.
- Errors, selection, and status are not communicated by color alone.
- Touch targets and hit areas remain usable on mobile.
- Motion respects reduced-motion preferences when the Figma design includes animation.

Use the workspace [web-accessibility](../web-accessibility/SKILL.md) skill for the full audit and test guidance.

## Validation

Run the narrowest relevant Nx checks after implementation:

- Shared component: `npx nx test ui`, `npx nx lint ui`
- Web consumer: `npx nx build web`, `npx nx lint web`
- Admin consumer: `npx nx build admin`, `npx nx lint admin`
- Screen-level behavior: the relevant `web-e2e` or `admin-e2e` target when configured

Before finishing, confirm that Tailwind generated every token utility used by the component, both theme modes render, tests cover the public API and states, and exports resolve from `libs/ui`.

## Completion Checklist

- Figma node context was fetched before code changes.
- Existing `libs/ui` components and design-system assets were searched first.
- The implementation is Angular-native and follows workspace conventions.
- Reuse versus new-component reasoning is explicit.
- Every Figma property and variant that matters has a code mapping.
- Tailwind values use existing tokens, or `tokens.css` was updated correctly in both themes.
- No legacy Tailwind configuration or unexplained arbitrary colors were added.
- Assets, responsive behavior, focus states, and accessibility were checked.
- Shared components are exported and covered by focused tests.
- The relevant Nx validation targets pass.
