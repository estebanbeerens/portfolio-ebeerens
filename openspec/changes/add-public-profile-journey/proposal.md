## Why

The portfolio currently has profile and career data in the API but no admin experience to manage the full public identity and no public pages that present it. A structured profile and accessible public journey let visitors understand the portfolio owner and their professional progression.

## What Changes

- Extend the profile contract with optional residence location and named social URLs for LinkedIn, GitHub, Instagram, X, and YouTube, while retaining required name, optional avatar URL, professional headline, and Markdown biography.
- Add authenticated admin Basic Info management with a Markdown editor and sanitized preview for the profile biography.
- Add public `/basic-info` and `/professional-journey` pages, including responsive public navigation, SSR rendering, metadata, loading/error/empty states, and feature-flag-aware visibility.
- Present public roles as organization groups, with accessible role details, date ranges, and skill visibility controlled by the existing feature flags.
- Add API, admin, and public end-to-end coverage for the new behavior.

## Capabilities

### New Capabilities

- `profile-management`: Manage the structured public profile through the authenticated API and admin application.
- `public-profile-journey`: Render profile information and organization-grouped professional history for public visitors.

### Modified Capabilities

- None.

## Impact

- Affects the Prisma Profile model and migration, `openapi/api.yaml`, NestJS profile DTOs and tests, and regenerated `libs/api-client` types.
- Adds Angular admin and web profile/journey routes, components, services, tests, and Playwright coverage.
- Reuses existing `ngx-markdown` sanitization and shared UI/Tailwind tokens; no R2 avatar-upload flow, resume download, projects/contact pages, education, or certification content is included.
