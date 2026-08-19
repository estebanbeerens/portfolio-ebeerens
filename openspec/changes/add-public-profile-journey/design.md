## Context

See [proposal.md](../proposal.md) for motivation. The NestJS profile API is already a singleton public read/authenticated upsert backed by Prisma, while the Angular admin Basic Info route and the Angular web route table are placeholders. Roles already include organizations and skills in descending start-date order. `openapi/api.yaml` is the committed client contract, and both applications already configure `ngx-markdown` for sanitized rendering and SSR.

## Goals / Non-Goals

**Goals:**

- Keep one typed profile contract from persistence through API client to admin and public rendering.
- Allow safe Markdown editing and preview in admin, with identical sanitized public rendering.
- Render accessible, responsive public pages that are server-rendered and honor existing feature flags.
- Cover HTTP, component, and browser-visible behavior with focused tests.

**Non-Goals:**

- Direct avatar uploads, social-platform OAuth integrations, arbitrary social-platform collections, resume downloads, education/certification data, and unrelated public portfolio pages.

## Decisions

### Use explicit nullable storage columns and optional wire fields

Add separate nullable profile columns for residence and the five requested social platforms. The OpenAPI request and response shapes model each as an optional property rather than a nullable value; application services normalize API nulls to `undefined` and translate absence to Prisma null only at the storage boundary. This preserves simple generated Angular types and makes the fixed requested set discoverable. A JSON social-links map was considered, but it weakens platform validation and would make public rendering less explicit.

### Treat biography as raw Markdown source

The existing `bio` string remains raw Markdown. The admin form reuses the project form's editor/preview approach and `ngx-markdown`; the public page uses the same renderer. Default sanitization remains enabled for every preview and render path. A rich-text JSON or raw-HTML contract was considered and rejected because Markdown already fits the existing profile field and avoids introducing a second content format.

### Put profile loading and flags in public SSR-aware services

The web app will use generated API services through focused public data services built with signals and `rxResource`. Unlike admin protected data, public content loads during SSR to produce useful initial HTML. The feature-flag service provides a single source for navigation and page visibility. This avoids handwritten HTTP code and duplicate visibility checks in templates.

### Keep page composition in the web app

The public shell and the two page containers belong to `apps/web`; only existing shared UI primitives and semantic token utilities are reused. A new shared public-site library is not justified for two pages. The journey grouping is a pure helper that reduces consecutive records by `organization.id`, preserving the API's ordering. Grouping all roles by organization was considered and rejected because it loses chronological re-entry information.

### Treat Figma as visual guidance after contract work

Before web implementation, retrieve the supplied Figma nodes through Figma MCP and map their visual hierarchy and assets to the existing Angular and token system. The pages retain semantic flow and responsive constraints rather than reproducing fixed design coordinates.

## Risks / Trade-offs

- [No profile exists in a fresh environment] -> Render an explicit unavailable state and test it rather than fabricating public content.
- [API specification and Nest decorators drift] -> Edit `openapi/api.yaml` first, export the Swagger document, inspect the diff, and regenerate the API client in the same task.
- [Untrusted Markdown produces unsafe markup] -> Keep `ngx-markdown` sanitization enabled in both admin preview and public rendering; do not bind raw HTML.
- [Authenticated UI e2e cannot establish a session] -> Add a proper authenticated fixture or global setup without changing production session guards; treat it as a prerequisite, not a reason to skip coverage.
- [Figma assets or properties are unavailable] -> Use existing Lucide icons and shared tokens only where they preserve the intended role, and document any intentional asset substitution during implementation.

## Migration Plan

1. Add the profile columns and apply the Prisma migration before deploying API code that reads or writes them.
2. Deploy the synchronized API contract and regenerated client with backward-compatible optional fields.
3. Deploy admin and web UI; existing profiles remain valid because only name is required and all added fields are optional.
4. To roll back the UI/API, stop rendering or accepting the added fields while retaining the additive database columns; a destructive rollback is unnecessary.
