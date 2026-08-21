# WCAG 2.2 Checklist — AA vs AAA

Scoped to what's most relevant for Angular SPA/SSR components (forms, navigation, dynamic widgets), not the full spec. When in doubt, treat AA as non-negotiable and AAA as the stretch goal.

## Perceivable

| Criterion                     | AA                                                                                  | AAA                                       |
| ----------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------- |
| 1.1.1 Non-text Content        | All images/icons have text alternatives                                             | (same — no AAA tier)                      |
| 1.3.1 Info and Relationships  | Semantic structure conveys relationships (headings, lists, labels) programmatically | —                                         |
| 1.4.3 / 1.4.6 Contrast        | Normal text **4.5:1**, large text **3:1**                                           | Normal text **7:1**, large text **4.5:1** |
| 1.4.10 Reflow                 | No horizontal scroll at 320px width / 400% zoom                                     | —                                         |
| 1.4.11 Non-text Contrast      | UI components/graphics **3:1** against adjacent colors                              | —                                         |
| 1.4.13 Content on Hover/Focus | Tooltips/popovers are dismissible, hoverable, persistent                            | —                                         |

## Operable

| Criterion                                        | AA                                                            | AAA                                                                   |
| ------------------------------------------------ | ------------------------------------------------------------- | --------------------------------------------------------------------- |
| 2.1.1 Keyboard                                   | All functionality available via keyboard                      | —                                                                     |
| 2.1.2 No Keyboard Trap                           | Focus can always move away                                    | —                                                                     |
| 2.4.3 Focus Order                                | Tab order matches visual/logical order                        | —                                                                     |
| 2.4.7 Focus Visible                              | Visible focus indicator                                       | 2.4.12 requires the indicator itself meets contrast/size              |
| 2.4.11 Focus Not Obscured (Minimum) — new in 2.2 | Focused element not entirely hidden by sticky headers/footers | 2.4.12 (AAA): not even partially hidden                               |
| 2.5.8 Target Size (Minimum) — new in 2.2         | Touch targets **≥24×24px** (or adequate spacing)              | 2.5.5 (AAA): **≥44×44px**                                             |
| 2.4.9 Link Purpose                               | —                                                             | Link text alone (no surrounding context needed) describes destination |
| 2.2.1 Timing Adjustable                          | Time limits can be extended/disabled                          | 2.2.3 (AAA): no time limits at all, with narrow exceptions            |

## Understandable

| Criterion                                     | AA                                                     | AAA                                    |
| --------------------------------------------- | ------------------------------------------------------ | -------------------------------------- |
| 3.1.1/3.1.2 Language                          | Page and any language-switched sections declare `lang` | —                                      |
| 3.2.1/3.2.2 Predictable                       | Focus/input doesn't trigger unexpected context changes | —                                      |
| 3.3.1 Error Identification                    | Errors are described in text, tied to the field        | —                                      |
| 3.3.2 Labels or Instructions                  | Every input has a label/instructions                   | —                                      |
| 3.3.3 Error Suggestion                        | Suggest a fix for the error where feasible             | —                                      |
| 3.3.4 Error Prevention (legal/financial/data) | Confirm/review/undo before irreversible submission     | —                                      |
| 3.3.5 Help                                    | —                                                      | Context-sensitive help available (AAA) |

## Robust

| Criterion               | AA                                                                                                              | AAA |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- | --- |
| 4.1.2 Name, Role, Value | Custom widgets expose name/role/state via ARIA                                                                  | —   |
| 4.1.3 Status Messages   | Status updates (form success/error, loading) are announced via `role="status"`/`aria-live` without moving focus | —   |

## Practical Notes for This Stack

- New-in-2.2 criteria (`2.4.11`, `2.5.8`) are easy to regress on with sticky nav bars and small icon buttons — check these explicitly, they're not covered by most linters yet.
- AAA contrast (7:1) is achievable for body text with most neutral dark-on-light palettes; it gets harder for brand-color accents on colored backgrounds — flag those as deliberate AA-only exceptions rather than silently missing them.
- `4.1.3` status messages matter for SSR'd apps especially — an error toast that appears via signal/state change after hydration needs `aria-live`, since there's no page reload to re-announce content.
