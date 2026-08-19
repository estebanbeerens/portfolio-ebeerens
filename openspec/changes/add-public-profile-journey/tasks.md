## 1. Profile Contract and Persistence

- [x] 1.1 Update `openapi/api.yaml` ProfileDto and UpdateProfileDto schemas for optional location and named social URL fields, preserving required name and optional avatar, headline, and biography fields.
- [x] 1.2 Extend the Prisma `Profile` model, add and review an additive migration, and regenerate Prisma client types.
- [x] 1.3 Update NestJS profile request/response DTOs and service mapping to validate nonblank name, bounded text, and HTTP/HTTPS avatar/social URLs while converting absent values between API and Prisma boundaries.
- [x] 1.4 Add focused API unit and API e2e coverage for valid profile round-trips, omitted optional fields, invalid name/URLs, and Markdown biography input.
- [x] 1.5 Export OpenAPI from the API, reconcile the committed specification, regenerate `libs/api-client`, and build the generated client.

## 2. Admin Basic Info Management

- [x] 2.1 Replace the admin Basic Info placeholder route with a lazy standalone profile management feature using the generated profile client and authenticated resource/mutation states.
- [x] 2.2 Implement an accessible profile form for avatar URL, required name, headline, residence, social URLs, and biography Markdown editor/preview with default sanitizer enabled.
- [x] 2.3 Add co-located admin Vitest and accessibility coverage for loaded, loading, error, validation, save, optional-field, and Markdown preview states.
- [x] 2.4 Add an authenticated `admin-e2e` Playwright journey that loads and updates Basic Info with semantic locators while retaining production session guards.

## 3. Public Profile and Journey

- [ ] 3.1 Retrieve Figma nodes `29:360` and `29:419`, then implement the responsive public shell with semantic landmarks, skip link, theme control, and visibility-aware navigation.
- [ ] 3.2 Add lazy `/basic-info` and `/professional-journey` routes with SSR-safe generated-client data and feature-flag services, page metadata, and public loading/error/empty states.
- [ ] 3.3 Implement the Basic Info page with sanitized Markdown biography, optional avatar/location/headline, accessible social links, and profile-unavailable behavior.
- [ ] 3.4 Implement the Professional Journey page with consecutive organization grouping, accessible organization/role details, `Present` date handling, and ROLES/SKILLS feature-flag behavior.
- [ ] 3.5 Add co-located web Vitest and accessibility coverage for profile rendering, social-link omission/presence, role grouping, date labels, and feature-flag states.
- [ ] 3.6 Replace the web Playwright scaffold with semantic-locator coverage for public navigation and both pages, including deterministic API states and accessibility validation.

## 4. Integrated Validation

- [ ] 4.1 Run affected API, admin, web, and API-client lint, test, and build targets; fix issues introduced by this change.
- [ ] 4.2 Run `api-e2e`, `admin-e2e`, and `web-e2e`; verify public route SSR responses contain initial profile/journey content and complete a keyboard, light/dark, desktop/mobile review.
- [ ] 4.3 Run `openspec validate --change add-public-profile-journey --strict --json`, review every specified scenario against the implementation, and mark completed tasks.
