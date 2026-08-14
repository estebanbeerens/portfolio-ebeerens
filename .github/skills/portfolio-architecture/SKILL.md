---
name: portfolio-architecture
description: "Keep this project's architecture plan (docs/personal-portfolio-architecture-plan.md) and its companion build guide (docs/personal-portfolio-build-guide.md) authoritative and in sync. Use when proposing or evaluating an infrastructure/stack/architecture change, when implementation diverges from what the docs describe, when asked to update the phase/stage plan, or when reviewing the two docs for consistency."
---

# Portfolio Architecture Planning

## When to Use

- A change to the stack/infra/architecture is proposed or requested (e.g. swap a technology, add/remove a service, change the auth/session/storage approach)
- Implementation work reveals the docs are out of date (a decision changed mid-build but the docs weren't updated)
- Asked to review the two docs for internal consistency
- Deciding whether a new idea fits the project's stated principles (§19) before building it

## The Two Documents & Their Relationship

- [personal-portfolio-architecture-plan.md](../../../docs/personal-portfolio-architecture-plan.md) is the **source of truth** — the _what and why_ (decisions, rationale, tradeoffs, the final stack table in §20).
- [personal-portfolio-build-guide.md](../../../docs/personal-portfolio-build-guide.md) is the **derived execution plan** — the _how, in order_ (Stages 0–14, each ending in a "Reference: architecture doc §N" back-link).
- Every build-guide stage traces back to one or more architecture sections. Changing a decision in the architecture doc without updating the corresponding stage(s) leaves the guide teaching an outdated approach. See [section-map.md](./references/section-map.md) for the full cross-reference table.

## Workflow: Handling a Proposed Architecture Change

1. **Read both docs' relevant sections first** — don't propose or accept a change that silently contradicts an existing documented decision/rationale without addressing why the old rationale no longer holds.
2. **Locate every affected section/stage** using [section-map.md](./references/section-map.md) — architecture changes rarely touch just one section (e.g. swapping the database touches §6, §9, §13, §16, §20, and build-guide Stages 2, 7, 13).
3. **Check it against §19 Architecture Principles** before accepting: simple infrastructure over sophisticated infra, API-first, secure by default, IaC where practical, automated deploys, backups are part of the app, avoid premature abstraction. A proposal that violates one of these needs an explicit justification recorded in the doc, not a silent override.
4. **Update the architecture plan first.** Keep its style: short rationale paragraphs, explicit "why not X" call-outs where a real alternative was considered (see §3, §8, §10 for the existing pattern), and diagrams/tables kept in sync — especially the §20 stack table and the §2 architecture diagram if a layer changes.
5. **Propagate to the build guide.** Update the specific stage(s)' Steps, and any 💡 explainer boxes whose underlying concept changed. Keep the guide's structure intact (Goal / What you'll learn / Steps / Verify it worked / Reference) — don't drop a section.
6. **Re-check cross-references both ways.** Every "Reference: architecture doc §N" in the build guide must still point at a section that reflects the new decision; every meaningfully new architecture section should have at least one build-guide stage that acts on it.
7. **Flag downstream skills if the stack itself changed** (not just an internal detail) — `nestjs-backend`, `angular-frontend`, `e2e-testing`, and `web-accessibility` encode specifics (Prisma driver adapters, Angular version/patterns, Playwright/Jest setup) that can drift from the architecture doc. Don't edit those automatically — ask first, since that's a separate, larger change than updating the two planning docs.
8. **Verify:** re-read both docs end-to-end for the affected area; confirm no orphaned mention of the removed/changed technology remains anywhere else in either file (search both docs for the old term).

## Workflow: Consistency / Sync Check (no change requested)

1. Walk the build-guide stages in order; for each, confirm its steps still match the architecture doc's current decision for that area.
2. Confirm the §20 stack table has no contradictions with prose elsewhere in either doc.
3. Confirm §21's "Key Recommendation" framing still matches the current stack choices.
4. Report drift found, grouped by section/stage — don't silently fix unless asked; this mode is a review, not an edit.

## Style Conventions to Preserve

- **Architecture doc:** ASCII-art diagrams in ` ```text ` fenced blocks for flows/architecture, tables for option comparisons, and explicit "why not X" reasoning for major decisions.
- **Build guide:** each stage has exactly Goal → What you'll learn → Steps → (optional 💡 explainer boxes) → Verify it worked → Reference. Explainer boxes are plain-English, no-jargon-assumed asides ("B1 explainer") — match that tone for any new ones.
- Both docs number sections/stages sequentially — inserting a new one mid-document means renumbering everything after it, plus any internal references to the old numbers.

## Reference Files

- [Section map (architecture §§ ↔ build-guide stages)](./references/section-map.md)
