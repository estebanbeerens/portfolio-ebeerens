# Personal Portfolio — Learning-Oriented Build Guide

This is a hands-on, step-by-step execution guide for actually **building** the architecture
described in [personal-portfolio-architecture-plan.md](./personal-portfolio-architecture-plan.md).

It is optimized for **learning**, not for the shortest path to a deployed app. The order is
deliberately different from that document's Phase 1–8 list: here you build a fully working app
**locally** first (monorepo → database → API → auth → admin UI → public site), and only then layer
in infrastructure one piece at a time (containers → server → reverse proxy → edge/CDN → CI/CD →
backups/hardening). Each infrastructure piece is introduced right when you first need it, so you
never have to configure something abstract before you understand what it's for.

Throughout the guide, look for boxes like this:

> 💡 **B1 explainer:** These boxes explain a concept in plain, simple English — no jargon assumed.
> They show up most often in the infrastructure stages, since that's usually the least familiar
> territory for developers coming from an app-development background.

Every stage has the same five parts: **Goal**, **What you'll learn**, **Steps**, explainer boxes
where useful, and **Verify it worked** — a concrete way to check the step actually succeeded before
moving on.

---

## Stage 0 — Prerequisites & accounts

**Goal:** have every account and local tool ready before writing any code.

**What you'll learn:** what each external service is for, before you're deep in configuring it.

**Steps:**

1. Create/confirm accounts:
   - GitHub account (source control + GitHub Actions + OAuth provider + GHCR container registry)
   - Cloudflare account, with your domain's nameservers already delegated to Cloudflare
   - Oracle Cloud account (sign up for Always Free)
   - Cloudflare Turnstile widget registered for the contact form (Stage 3/6) — note the public site
     key and server-side secret key
2. Install local tooling:
   - Node.js **22.x** (Prisma 7, used from Stage 2, requires Node ≥20.19 and recommends 22.x)
   - Docker Desktop (for local Postgres in Stage 2, and later for building images)
   - A Postgres client (e.g. `psql` or a GUI like TablePlus) for peeking at data while developing
   - Nx CLI: `npm i -g nx`
3. When creating your Oracle Cloud account, pick a home region and check Arm (Ampere A1) capacity
   is available there before committing — see the explainer below.

> 💡 **B1 explainer — why does the Oracle region matter?**
> Oracle's free Arm servers are popular, and not every data center ("region") always has free ones
> ready to give out. If you pick a region that is full, you cannot create your free server there.
> You can normally switch regions during signup or soon after, but it's easier to check first than
> to fix it later.

**Verify it worked:** you can log into GitHub, Cloudflare, and Oracle Cloud in a browser; running
`node -v`, `docker -v`, and `nx --version` in a terminal all print a version number.

**Reference:** architecture doc §3 (Hosting Strategy), §12 (Cloudflare).

---

## Stage 1 — Nx monorepo + app scaffolding

**Goal:** a monorepo with three empty-but-running apps: `web` (public site), `admin`, and `api`.

**What you'll learn:** how Nx organizes a multi-app repo, and how to generate SSR-ready Angular
apps and a NestJS API inside it.

**Steps:**

1. Create the workspace:
   ```
   npx create-nx-workspace@latest portfolio --preset=apps
   cd portfolio
   ```
2. Add the Angular and NestJS plugins:
   ```
   nx add @nx/angular
   nx add @nx/nest
   ```
3. Generate the two Angular apps with SSR enabled:
   ```
   nx g @nx/angular:application web --ssr --routing
   nx g @nx/angular:application admin --ssr --routing
   ```
4. Generate the NestJS API:
   ```
   nx g @nx/nest:application api
   ```
5. Create `libs/models` (shared TypeScript types) and `libs/ui` (shared Angular components) now,
   even if they're nearly empty, so the folder structure matches the architecture doc from day one:
   ```
   nx g @nx/js:library models
   nx g @nx/angular:library ui
   ```

> 💡 **B1 explainer — what does Nx actually do?**
> Nx is a tool for repos that hold several apps and shared libraries at once ("monorepos"). Its two
> main jobs are: (1) it knows which apps depend on which libraries (the "project graph"), so it can
> figure out what needs rebuilding after a change, and (2) it caches build/test results, so it
> doesn't redo work that hasn't changed. You don't need to configure this — it works from the
> `apps/` and `libs/` structure and each project's config file.

**Verify it worked:** `nx serve web`, `nx serve admin`, and `nx serve api` each start without
errors and are reachable in a browser/`curl` on their local ports.

**Reference:** architecture doc §4 (Monorepo Structure), §5 (Frontend), §6 (Backend).

---

## Stage 2 — Local database: Postgres + Prisma

**Goal:** a Postgres database running in Docker on your machine, with Prisma migrations defined for
the `profile`, `projects`, `skills`, `organizations`, `roles`, `sessions`, `contact_messages`, and
`feature_flags` tables.

**What you'll learn:** what containers/images/volumes actually are, and how to run a throwaway local
database without installing Postgres directly on your machine.

**Steps:**

1. Create a `docker-compose.yml` at the repo root with a single `postgres` service, a named volume
   for data persistence, and a mapped port (e.g. `5432:5432`). Use environment variables for the
   user/password/database name — put the real values in a local `.env` file that is gitignored.
2. Start it:
   ```
   docker compose up -d postgres
   ```
3. There is no `setup-prisma` generator — install Prisma manually into the `api` app instead. Use
   **Prisma 7**, which requires a database driver adapter and ships as an ES module:
   ```
   npm install prisma@7 @prisma/client@7 @prisma/adapter-pg pg dotenv
   ```
4. Add a `prisma.config.ts` at the **repo root** (Prisma 7 looks for it next to `package.json`;
   since this is an Nx monorepo with a single root `package.json`, this one file configures Prisma
   CLI for the whole workspace even though the schema itself lives under `apps/api/prisma/`):

   ```ts
   import 'dotenv/config';
   import { defineConfig, env } from 'prisma/config';

   export default defineConfig({
     schema: 'apps/api/prisma/schema.prisma',
     migrations: { path: 'apps/api/prisma/migrations' },
     datasource: { url: env('DATABASE_URL') },
   });
   ```

5. In `schema.prisma`'s generator block, use the new Rust-free client provider and a custom output
   path (both required in v7):
   ```prisma
   generator client {
     provider = "prisma-client"
     output   = "../src/generated/prisma"
   }
   ```
6. Define the initial models: `Profile`, `Project` (with `description` as `Json`, matching
   architecture doc §9/§10, plus optional `client`/`jobRole`/`liveUrl`, a required `startDate` and
   optional `endDate` (absent = ongoing/present), and a many-to-many relation to `Skill`), `Skill`
   (`id`, unique `name`), `Organization` (`id`, unique `name`, optional `logoUrl`/`website`), `Role`
   (`id`, `jobTitle`, required `organizationId` FK, optional `location`, optional
   `employmentType` — the schema's first `enum`, values `FULL_TIME`/`PART_TIME`/`SELF_EMPLOYED`/
   `FREELANCE`/`INTERNSHIP`/`TRAINEE`/`APPRENTICESHIP`/`SEASONAL` — a required `startDate`,
   optional `endDate`, and a many-to-many relation to the same `Skill` table `Project` uses),
   `Session` (`id`, `tokenHash`, `githubUserId`, `expiresAt`, `createdAt`), `ContactMessage`
   (`id`, `fullName`, `email`, `subject`, `message`, `createdAt`), and `FeatureFlag` (`key` as the
   `@id` directly — a `FeatureFlagKey` enum with values `CONTACT`/`PROJECTS`/`ROLES`/`SKILLS`, no
   separate surrogate id since the enum already guarantees uniqueness — plus `enabled` defaulting
   to `false`). Do **not** put `url` in the `datasource` block — that now lives in
   `prisma.config.ts` only.
7. Run the first migration, then generate the client explicitly (v7's `migrate dev` no longer
   auto-generates or auto-seeds):
   ```
   npx prisma migrate dev --name init
   npx prisma generate
   ```
8. Instantiate `PrismaClient` in the api's `PrismaService` using the Postgres driver adapter (v7
   requires an adapter for every database, there's no built-in native engine anymore):

   ```ts
   import { PrismaClient } from '../generated/prisma/client';
   import { PrismaPg } from '@prisma/adapter-pg';

   const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
   export const prisma = new PrismaClient({ adapter });
   ```

> 💡 **B1 explainer — containers, images, and volumes.**
> A **container** is like a small, isolated box that runs one program (here, Postgres) with
> everything it needs already inside — you don't have to install Postgres yourself. An **image**
> is the blueprint the container is built from (downloaded once, reused every time you start the
> container). A **volume** is a folder that lives outside the container and survives even if you
> delete and recreate the container — this is where Postgres's actual data lives, so you don't lose
> it every time you restart.

> 💡 **B1 explainer — why does Prisma 7 need an "adapter", and does the api app need to become ESM?**
> Prisma 7 dropped its old Rust query engine binary in favor of a thin TypeScript client that talks
> to your database through the same JS driver everyone else uses (`pg` for Postgres) — the
> "adapter" is just the translator between Prisma's API and that driver. The generated client itself
> ships as an ES module, which technically wants `"type": "module"` in the nearest `package.json`.
> Because this repo has one root `package.json` shared by `web`, `admin`, and `api`, flipping it to
> `"module"` would force Angular/webpack/Jest configs across _all three_ apps to deal with ESM, not
> just `api`. Pinning Node to ≥22.12 avoids that: recent Node versions can `require()` an ES module
> synchronously, so the NestJS app can stay CommonJS and still load the generated Prisma client
> without a repo-wide ESM migration. Confirm this works for you in Stage 3 before relying on it — if
> it doesn't, the fallback is converting just `apps/api`'s tsconfig/webpack/Jest config to ESM output.

**Verify it worked:** `docker compose ps` shows the `postgres` container as healthy/running;
`npx prisma studio` opens a browser UI showing the three empty tables.

**Reference:** architecture doc §6 (Backend, Prisma 7 notes), §9 (Database), §13 (Docker, for the
concepts — production containerization comes later in Stage 7).

---

## Stage 3 — OpenAPI contract + basic CRUD

**Goal:** working REST endpoints for `profile` and `projects`, backed by Prisma, documented via
Swagger.

**What you'll learn:** generating an OpenAPI spec straight from NestJS decorators, and wiring a
service/controller/repository layered structure.

**Steps:**

1. Add `@nestjs/swagger` and decorate your DTOs and controllers with `@ApiProperty`/`@ApiTags`/etc.
2. Implement `GET/PUT /api/profile` and `GET/POST/PUT/DELETE /api/projects[/:id]` per architecture
   doc §7, using a service layer that calls Prisma (don't call Prisma directly from controllers).
   Accept project `skills` as a list of names and `connectOrCreate` them against the `Skill` table
   so the same skill is reused across projects instead of duplicated.
3. Add a read-only `GET /api/skills` endpoint (list all skills, ordered by name) so the full set of
   skills used across projects can be queried on its own.
4. Implement `GET/POST/PUT/DELETE /api/organizations[/:id]` and `GET/POST/PUT/DELETE
/api/roles[/:id]` per architecture doc §7/§9 — the same public-GET/admin-mutation split as
   `projects`. A `Role`'s `organizationId` is wired with a Prisma `connect` (not
   `connectOrCreate` — organizations carry `logoUrl`/`website`, so they're created explicitly via
   their own endpoint first); map a failed connect (Prisma `P2025`) to a 404, and map deleting an
   `Organization` that still has `Role`s referencing it (Prisma `P2003`) to a 409 instead of a raw 500. `Role.skills` reuses the same `connectOrCreate`-by-name helper as `projects`.
5. Add the public `POST /api/contact` endpoint. Verify the submitted Cloudflare Turnstile token
   against Cloudflare's `siteverify` API server-side before storing the message — reject with 400 if
   verification fails. Keep the secret key server-side, validate the expected `contact` action, and
   avoid forwarding the visitor IP by default to reduce personal data sharing. Add admin-only
   `GET /api/contact` and `DELETE /api/contact/{id}` (guarded by the Stage 4 session guard) to
   review and clear submissions.
6. Implement `GET /api/feature-flags` (public) and `PUT /api/feature-flags/{key}` (admin-only).
   On module init, upsert a row for every `FeatureFlagKey` enum value that doesn't already exist
   (defaulting `enabled` to `false`) so the table is always complete, even right after adding a new
   flag — no separate seed script. Validate the `:key` path param with Nest's built-in
   `ParseEnumPipe` (auto-returns 400 for an unknown key), and add an explicit `@ApiParam({ name:
'key', enum: FeatureFlagKey })` on the route — without it, `nest/swagger` won't document the
   path parameter and the generated spec fails validation (`needs to be defined as a path
parameter`) when the Angular client is generated from it.
7. Add request validation with `class-validator`/`class-transformer` (NestJS's `ValidationPipe`).
8. Serve Swagger UI at `/api/docs` for manual testing while you build.

**Verify it worked:** open `/api/docs` in a browser, create a project (with skills) through the
Swagger UI, and confirm the row (and its linked skills) appears via `npx prisma studio`; submit
`POST /api/contact` with a valid Turnstile token and confirm the row appears in `contact_messages`;
restart the API and confirm `GET /api/feature-flags` always returns exactly one row per
`FeatureFlagKey` value, each `enabled: false` until toggled.

**Reference:** architecture doc §6 (Backend), §7 (OpenAPI), §9 (Database).

---

## Stage 4 — GitHub OAuth + opaque session

**Goal:** "Login with GitHub" works end-to-end, and only your configured GitHub user ID is treated
as an admin.

**What you'll learn:** the OAuth redirect flow, and why this project uses a database-backed opaque
session token instead of a JWT.

**Steps:**

1. Register a GitHub OAuth App (Settings → Developer settings), set the callback URL to your local
   dev URL for now (you'll add the production one in Stage 11).
2. Install `passport`, `passport-github2`, and NestJS's `@nestjs/passport`.
3. Implement the GitHub strategy: on successful callback, check `githubUserId === configuredAdminGithubId`
   from architecture doc §8. If it doesn't match, reject — don't create a session.
4. On success, generate a random token (e.g. `crypto.randomBytes(32)`), store its **hash** (not the
   raw value) plus `githubUserId` and `expiresAt` in the `Session` table, and set it as a cookie:
   `HttpOnly`, `Secure`, `SameSite=Strict`.
5. Add an auth guard that reads the cookie, hashes it, looks up the session, and rejects expired/
   missing sessions. Apply it to all admin-only routes.
6. Implement `/api/auth/logout` that deletes the session row and clears the cookie.

> 💡 **B1 explainer — what happens when you click "Login with GitHub"?**
> Your browser is sent to GitHub with a request that says "this app wants to know who you are."
> GitHub asks you to approve it, then sends your browser back to your app's server with a one-time
> code. Your server exchanges that code (secretly, server-to-server) for confirmed identity info
> about you. Nothing about your GitHub password is ever seen by your app.
>
> 💡 **B1 explainer — why not just use a JWT?**
> A JWT is a signed piece of data the server can verify without a database lookup — fast, but hard
> to cancel: once issued, it stays valid until it expires, even if you "log out," unless you build
> extra machinery to track cancelled ones. Since this app only ever needs one logged-in admin, it's
> simpler and safer to store a small random token in the database instead: logging out just deletes
> the row, and the token itself carries no information a leaked cookie could exploit.

**Verify it worked:** clicking "Login with GitHub" locally redirects, approves, and lands you back
authenticated; an admin-only endpoint returns 401 without the cookie and 200 with it; logging out
and retrying the same cookie returns 401.

**Reference:** architecture doc §8 (Authentication, including the full session design rationale).

---

## Stage 5 — Admin UI: CRUD forms, Markdown editor, image upload

**Goal:** a working admin screen to edit the profile and manage projects, including rich-text
descriptions and image uploads.

**What you'll learn:** integrating a Markdown editor/preview safely, and uploading files directly to object
storage instead of through your API.

**Steps:**

1. Build the profile-edit form and project list/create/edit/delete screens in the `admin` app,
   calling the API endpoints from Stage 3, gated behind the login flow from Stage 4. Include the
   optional `client`/`jobRole`/`liveUrl` fields and a tag-style input for `skills` (autocompleting
   against `GET /api/skills`).
2. Add a Markdown editor for `project.description`: a plain textarea bound to the markdown source,
   with a live preview pane rendered via `ngx-markdown` (`provideMarkdown()`) — this is what gets
   stored in the `String`/`text` column.
3. Build a simple admin screen listing submitted contact messages (`GET /api/contact`) with a way
   to delete them once handled (`DELETE /api/contact/{id}`).
4. Build organization list/create/edit/delete screens (`GET/POST/PUT/DELETE /api/organizations[/:id]`)
   and role list/create/edit/delete screens (`GET/POST/PUT/DELETE /api/roles[/:id]`), with an
   organization picker (populated from `GET /api/organizations`) and an employment-type select
   backed by the `EmploymentType` enum. Deleting an organization that still has roles will return
   409 — surface that as a clear error rather than a generic failure.
5. Build a simple feature-flags screen: list all flags (`GET /api/feature-flags`) with a toggle
   switch per row that calls `PUT /api/feature-flags/{key}`. This is admin-only config, not
   content the public site fetches at build time — every page load re-checks it (see Stage 6's
   note on the still-unbuilt frontend consumption piece).
6. Create the Cloudflare R2 buckets you'll need for this stage — one for project images, one for
   the resume/CV document — following the **R2 setup walkthrough** below. Add a presign endpoint
   per resource (`POST /api/projects/upload-url`, `POST /api/resume/upload-url`) that validates the
   requested content-type/size against an explicit allowlist and returns a short-lived presigned PUT
   URL using the S3-compatible R2 API.
7. In the admin UI, upload the selected file directly to the presigned URL (not through your API).
   For project images, include the returned object key alongside the resulting public URL in the
   project's create/update payload. For the resume, call the `PUT /api/resume` confirm endpoint with
   the object key/filename/size once the direct upload finishes.
8. When rendering the project description anywhere (admin preview or later, the public site), parse
   the stored Markdown to HTML with `ngx-markdown`/`marked` and rely on its built-in sanitizer
   (Angular's `DomSanitizer`) — never bypass sanitization to render stored markdown as trusted HTML.

> 💡 **B1 explainer — what is a "presigned URL"?**
> Normally, uploading a file means: browser → your server → storage. A presigned URL lets you skip
> the middle step safely: your server creates a special, temporary link that says "whoever has this
> exact link is allowed to upload one file, for the next few minutes, to this exact spot in storage."
> Your server hands that link to the browser, and the browser uploads straight to storage. Your
> server never has to receive or forward the file's bytes, which keeps it fast and light.

> 📦 **R2 setup walkthrough — creating the buckets and filling in `.env`**
>
> 1. **Create the buckets.** Cloudflare dashboard → **R2 Object Storage** → **Create bucket**.
>    Create two buckets, named to match the env vars below exactly: `portfolio-images` and
>    `portfolio-documents`. (A third, `portfolio-backups`, is created the same way in Stage 13.)
>    If data residency matters to you (e.g. GDPR), under **Location** choose **Specify jurisdiction**
>    and pick the same jurisdiction (e.g. `eu`) for every bucket — see the jurisdiction note in step 6;
>    this choice **cannot be changed later** without deleting and recreating the bucket.
> 2. **Get your account ID.** Still on the R2 overview page, copy the **Account ID** shown in the
>    right-hand sidebar → this is `R2_ACCOUNT_ID`.
> 3. **Create an API token.** R2 → **Manage API tokens** → **Create API token**. Scope permissions to
>    **Object Read & Write**, restricted to the buckets you just created (don't grant account-wide
>    access). Copy the **Access Key ID** and **Secret Access Key** immediately — the secret is only
>    shown once → these become `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`.
> 4. **Make the images bucket public; keep the documents bucket private.** Project images need to be
>    loadable directly in a browser `<img>` tag, so open the `portfolio-images` bucket → **Settings**
>    → **Public access** → enable the r2.dev subdomain (or connect a custom domain/subdomain once
>    Stage 11 sets up Cloudflare DNS for this project). Whichever base URL you get becomes
>    `R2_PUBLIC_BASE_URL`. Leave `portfolio-documents` **without** public access — the resume is only
>    ever served through the API's short-lived signed download link (`GET /api/resume/download`),
>    never a public URL.
> 5. **Add a CORS policy so the browser can PUT directly to R2.** Presigned uploads happen straight
>    from the admin UI's origin to R2, so both buckets need a CORS policy allowing that. On each
>    bucket: **Settings** → **CORS Policy** → add:
>    ```json
>    [
>      {
>        "AllowedOrigins": ["http://localhost:4300", "https://admin.yourdomain.com"],
>        "AllowedMethods": ["PUT"],
>        "AllowedHeaders": ["*"],
>        "MaxAgeSeconds": 3000
>      }
>    ]
>    ```
>    Add the images bucket's actual public base URL/origin too if you ever fetch images through
>    something other than a plain `<img src>` (a plain image request doesn't need CORS).
> 6. **Fill in `.env`** (copy from `.env.example`):
>
>    ```env
>    R2_ACCOUNT_ID=<from step 2>
>    R2_ACCESS_KEY_ID=<from step 3>
>    R2_SECRET_ACCESS_KEY=<from step 3>
>    R2_DOCUMENTS_BUCKET=portfolio-documents
>    R2_IMAGES_BUCKET=portfolio-images
>    R2_PUBLIC_BASE_URL=<the r2.dev or custom-domain base URL from step 4>
>    R2_JURISDICTION=<only if you picked a jurisdiction in step 1, e.g. "eu" — otherwise leave unset>
>    ```
>
>    The first five `R2_*` vars must be set together — the API's `R2Service` treats R2 as unconfigured
>    (returning 503 on upload/download routes) until `R2_ACCOUNT_ID`/`R2_ACCESS_KEY_ID`/
>    `R2_SECRET_ACCESS_KEY` are all present.
>
>    > 💡 **B1 explainer — why does jurisdiction need its own env var?** A bucket created under a
>    > jurisdiction (e.g. `eu`) physically only exists at a jurisdiction-specific S3 endpoint —
>    > `https://<account_id>.eu.r2.cloudflarestorage.com` instead of the default
>    > `https://<account_id>.r2.cloudflarestorage.com`. Hitting the default endpoint for a
>    > jurisdiction-restricted bucket fails outright (the bucket doesn't exist there), so
>    > `R2Service` needs to know which endpoint to build. This also means all your R2 buckets must
>    > share one jurisdiction (or none) — you can't mix them with a single client/env config.

**Verify it worked:** creating a project with a rich-text description and an image in the admin UI
results in a new row in `projects` with a Markdown `description` and a real `R2_PUBLIC_BASE_URL`-backed
image URL; the image loads directly from that URL in a browser. Uploading a resume in the admin UI's
Basic Info page shows it as the active file and downloads correctly from the public site.

**Reference:** architecture doc §10 (Image Storage, including the WYSIWYG/sanitization design).

---

## Stage 6 — Public SSR site

**Goal:** the public-facing site renders profile + project data, prerendered at build time (SSG)
for good SEO, in both English and Dutch, with accessibility basics covered. `admin` intentionally
stays client-rendered — see the explainer below for why the two apps make different choices here.

**What you'll learn:** using Angular's SSR/prerender output for a content-driven, read-only public
site, and why "SSR" isn't a single one-size-fits-all choice across apps in the same monorepo.

**Steps:**

1. Fetch `GET /api/feature-flags` once at application init via `provideAppInitializer`, guarded
   with `isPlatformBrowser` (skipped server-side — see explainer), and expose the result via
   `PortfolioContentService` so pages/nav items can check `CONTACT`/`PROJECTS`/`ROLES`/`SKILLS`
   before rendering. `apps/web/src/app/layout/header/header.component.html` gates the
   Projects/Resume/Contact nav links on their respective flags.
2. Build the home/projects/project-detail pages in `web`, fetching data from the read-only API
   endpoints (no auth needed for these). Show a project's skills, client, job role, live URL, and
   start/end date where present.
3. Build a real `/resume` page (`apps/web/src/app/pages/resume/resume-page.component.ts`) reusing
   `ProfessionalJourneySection` fed from `PortfolioContentService.roleCompanyGroups()` — roles are
   grouped by organization (LinkedIn-style) and render "Present" when a role's `endDate` is absent.
4. Build a contact page with a Cloudflare Turnstile widget. Serve the public site key through
   `apps/web/public/runtime-config.json` as `turnstileSiteKey`, keep `TURNSTILE_SECRET_KEY`
   server-side only, submit the resulting `turnstileToken` to `POST /api/contact`, show a clear
   success/error state, and don't reveal server-side details on failure.
5. Configure per-page `<title>`/meta description tags via Angular's `Title`/`Meta` services
   (`@angular/platform-browser`) — static per-page for home/resume/projects/contact, dynamic (via
   an `effect()` watching the loaded project) for the project-detail page.
6. Add `@angular/localize` for English/Dutch, with dedicated `/en/` and `/nl/` builds — see the
   `angular-frontend` skill and `apps/web/src/locale/` for the extraction/translation workflow.
7. Switch `apps/web/src/app/app.routes.server.ts` to `RenderMode.Prerender` (static routes) plus
   `getPrerenderParams` for `projects/:slug` (fetches all project slugs from the API at build time
   via a plain `fetch()` with an absolute `API_URL`, falling back to `PrerenderFallback.Server` for
   any project added after the last build). Requires the API to be reachable at build time (locally
   or in CI) — see the explainer below.
8. Add accessibility tests with `vitest-axe` (`apps/web/src/test-setup.ts` registers the matcher)
   alongside functional specs — see `header.component.spec.ts`, `home-page.component.spec.ts`, and
   `footer.component.spec.ts` for the pattern.
9. Confirm SSG is actually producing real content: view page source (not devtools' rendered DOM)
   on a built/served page and confirm project/profile content and the correct `<title>` are already
   present in the raw HTML — not just an empty `<app-root>` shell.

> 💡 **B1 explainer — why does `admin` stay client-rendered while `web` uses SSG?**
> SSR/SSG exist to make server-rendered HTML available to search engines and first-paint
> performance. `admin` is a single-administrator, auth-gated tool — nothing on it needs to rank in
> search results, and its session cookie is HttpOnly, so Angular can only learn the real auth state
> via a browser-side round-trip to `/api/auth/me`. Making `admin` render server-side would mean
> forwarding that cookie into every SSR request and validating the session on the server too — a
> real, security-sensitive refactor for a page that gets no SEO benefit from it. `web` has neither
> problem (public, read-only, no auth), so it can safely commit to full build-time prerendering.

> 💡 **B1 explainer — why did Prerender need an absolute API URL?**
> A relative API URL (`basePath: ''`) works fine once your app is running for real: in the browser
> it resolves against the page's own origin, and during a genuine per-request SSR render Angular
> can resolve it against the incoming request. But build-time prerendering has no request at
> all — there's nothing to resolve a relative URL against, so those HTTP calls just hang forever
> until the build times out. The fix is to give the **server** bundle (used for both prerendering
> and any later per-request SSR) an absolute URL instead — `apps/web/src/app/app.config.server.ts`
> re-provides `provideApi(...)` with `process.env['API_URL'] ?? 'http://localhost:3000'`, which
> only takes effect server-side; the browser bundle keeps using the relative URL.

**Verify it worked:**

- With the API running locally, `API_URL=http://localhost:3000 nx build web --configuration=production`
  completes and logs "Prerendered N static routes."
- `grep -o '<title>[^<]*</title>' dist/apps/web/browser/en/projects/<a-real-slug>/index.html` shows
  the real project title, not a placeholder — confirms per-page dynamic titles are baked in.
- `nx test web` passes, including the `vitest-axe` "has no accessibility violations" specs.

**Reference:** architecture doc §5 (Frontend).

---

## Stage 7 — Containerize for production

**Goal:** production-ready, multi-stage Dockerfiles for `web`, `admin`, and `api`, built for arm64,
plus a production Compose overlay (`docker-compose.prod.yml`) layered on the local base
`docker-compose.yml`.

**What you'll learn:** multi-stage builds, minimal production images, and why the Oracle VPS's CPU
architecture matters for how you build images.

**Steps:**

1. Write a multi-stage Dockerfile per app: a build stage (full Node image, installs deps, runs
   `nx build <app>`) and a slim runtime stage (copies only the built output, runs as a non-root
   user).
2. Add `HEALTHCHECK` instructions and read config via environment variables (no secrets baked into
   images).
3. Write the production Compose overlay with `web`, `admin`, `api`, and `postgres`, using the named
   Postgres volume from the base file and without publishing Postgres's port to the host. Add the
   `nginx` service and its config/certificate mounts in Stage 10, when its routing configuration is
   introduced. Validate the merged files with `docker compose -f docker-compose.yml
-f docker-compose.prod.yml config`.
4. Build each app locally for arm64 to confirm the Dockerfiles work, using Docker's built-in
   `buildx`:
   ```
   docker buildx build --platform linux/arm64 -t portfolio-api:test -f apps/api/Dockerfile .
   ```

> 💡 **B1 explainer — what's a "multi-stage build" and why arm64?**
> A multi-stage Dockerfile has two parts: one stage that has all the heavy tools needed to _build_
> your app (compilers, full dependency trees), and a second, much smaller stage that only contains
> the finished, already-built app. You throw away the first stage's bulk, so the final image is
> small and has less attack surface. Separately: your own computer is probably an "amd64/x86"
> chip, but the free Oracle server uses an "arm64" chip (the same processor family as phones and
> Apple Silicon Macs) — like the difference between two languages that look similar but aren't
> identical. An image built for one won't run on the other, so you must explicitly build an arm64
> version, even from a non-arm64 machine.

**Verify it worked:** `docker buildx build --platform linux/arm64 ...` completes without errors for
each app; `docker compose -f docker-compose.yml -f docker-compose.prod.yml config` validates the
merged Compose configuration with no syntax errors and shows no published Postgres port.

**Reference:** architecture doc §13 (Docker, including the arm64/multi-arch section).

---

## Stage 8 — Provision the Oracle VPS

**Goal:** a running Ampere A1 (Arm) VM, reachable only via SSH key, with a firewall and a
non-root, least-privilege deploy user.

**What you'll learn:** the basics of provisioning and locking down a Linux server.

**Steps:**

1. In the Oracle Cloud console, create a compute instance using the Ampere A1 shape (e.g. 2 OCPU /
   12 GB RAM), Ubuntu or Oracle Linux, and upload your SSH public key during creation.
2. Configure Oracle's cloud-level firewall ("security list"/"network security group") to allow only
   ports 22 (SSH), 80, and 443 inbound.
3. SSH in, then harden the OS-level firewall too (e.g. `ufw allow 22,80,443` + `ufw enable`) —
   defense in depth in case the cloud-level rule is ever misconfigured. Do not allow application or
   database ports such as 3000, 4000, 5432, or 5434; production exposes only Nginx on 80/443, and
   the `postgres-e2e` service is development-only and profile-gated.
4. Disable SSH password authentication and root login in `/etc/ssh/sshd_config`
   (`PasswordAuthentication no`, `PermitRootLogin no`), then restart `sshd`.
5. Create a dedicated `deploy` user for Stage 12's CI/CD to use later. Choose one Docker access
   model explicitly: rootless Docker for the least privilege, or membership in the `docker` group
   for simpler setup (the latter grants root-equivalent access and must not be described as a
   fully unprivileged user). Lock its CI key down with a forced command once you reach Stage 12.
6. Install the arm64-compatible Docker Engine and Docker Compose plugin on the VM, then verify the
   deploy user can run the chosen Docker setup without interactive sudo.

> 💡 **B1 explainer — SSH keys vs. passwords.**
> An SSH key pair is two matched files: a private key (stays only on your computer, never shared)
> and a public key (safe to give to any server). The server stores your public key and will only
> let someone in if they can prove — mathematically, without ever sending the private key over the
> network — that they hold the matching private key. This is much harder to break into than a
> password, which can be guessed, reused, or leaked from another breach.
>
> 💡 **B1 explainer — what does a firewall actually do?**
> A firewall is a set of rules that says which "doors" (network ports) into your server are open,
> and to whom. Your server might be capable of running a database, a web server, etc., each
> listening on its own port — a firewall makes sure the outside world can only ever knock on the
> doors you intentionally left open (here: 22 for SSH, 80/443 for web traffic), and every other
> port stays shut even if something on the server is (accidentally) listening on it.

**Verify it worked:** you can SSH in using only your key (`ssh deploy@<vps-ip>` fails cleanly if you
try a password); `sudo ufw status` shows only 22/80/443 allowed; `docker run hello-world` succeeds
on the VM; and after the production Compose stack is installed, `docker compose ps` shows no
`postgres-e2e` service and no published ports other than Nginx's 80/443.

**Reference:** architecture doc §3 (Instance shape), §15 (Server Security).

---

## Stage 9 — First manual deploy

**Goal:** the full stack running on the actual VPS, deployed by hand once, before any automation
exists — so you understand exactly what the automation will later do for you.

**What you'll learn:** what "deploying" concretely means at this stage: copying files and running a
command over SSH.

**Steps:**

1. Copy the production `docker-compose.yml` and a `.env` file with real secrets (GitHub OAuth
   secret, R2 credentials, DB password, admin GitHub ID) to the VPS, e.g. via `scp`. Never commit
   this `.env` file to Git.
2. Build and push the three arm64 images somewhere reachable from the VPS for now — either build
   directly on the Arm VPS itself (simplest for this one manual run) or push to GHCR from your own
   machine using `buildx`.
3. On the VPS: pull the latest images and restart with
   `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --remove-orphans`
   after validating the Compose config.
4. Run the Prisma migration against the production database from the VPS (or via a one-off
   container) so the schema exists.

**Verify it worked:** `curl http://<vps-ip>:<api-port>/api/profile` (or whichever port is exposed
pre-Nginx) returns a real response from the VPS's public IP; `docker compose ps` on the VPS shows
all services healthy.

**Reference:** architecture doc §14 (Deployment).

---

## Stage 10 — Nginx reverse proxy

**Goal:** a single entry point on the VPS (port 80/443) that routes to the right container based on
hostname + path, instead of exposing each app's port directly.

**What you'll learn:** what a reverse proxy is for, and why you still need one even with Cloudflare
in front of everything.

**Steps:**

1. Add an `nginx` service to the compose file (or install Nginx directly on the VPS — a container is
   more consistent with the rest of the stack).
2. Write the Nginx config routing host `ebeerens.com`/`www.ebeerens.com` (`/` → `web`, `/api` → `api`)
   and host `admin.ebeerens.com` (`/` → `admin`, `/api` → `api`), per architecture doc §11. Keep an
   optional 301 redirect from `ebeerens.com/admin` to `admin.ebeerens.com` for backwards compatibility.
3. Add basic security headers and a `limit_req` zone as a defense-in-depth rate limit (Cloudflare's
   edge rules are the primary defense — see Stage 11).
4. Stop publishing the app containers' ports directly to the host; only Nginx should be reachable
   from outside Docker's internal network.

> 💡 **B1 explainer — why do I need Nginx if Cloudflare is already "in front"?**
> Cloudflare sits between the whole internet and _your server as a whole_ — it doesn't know that
> your one server is actually running three separate apps inside Docker. Nginx's job is _inside_
> your server: when a request arrives, Nginx looks at both the hostname (`ebeerens.com` vs
> `admin.ebeerens.com`) and the path (`/`, `/api`) and forwards it to the correct container. Think
> of Cloudflare as the building's front security desk, and Nginx as the receptionist on your specific
> floor who knows which office door to send you to.

**Verify it worked:** with DNS pointed at the VPS, `http://ebeerens.com/` reaches `web`,
`http://admin.ebeerens.com/` reaches `admin`, and `http://admin.ebeerens.com/api/profile` reaches
the API; hitting the old direct app ports (e.g. the API's raw port) no longer works from outside.

**Reference:** architecture doc §11 (Nginx).

---

## Stage 11 — Cloudflare: DNS, TLS, R2, WAF

**Goal:** your domain is served through Cloudflare with proper HTTPS end-to-end, and R2 buckets are
in active use for images and backups.

**What you'll learn:** how Cloudflare fits between users and your origin server, and why
origin-to-Cloudflare TLS needs its own certificate.

**Steps:**

1. In Cloudflare DNS, point your domain and `www` at the VPS's public IP, and add
   `admin.yourdomain.com` to the same origin (proxied "orange cloud" on for all of them, so
   traffic routes through Cloudflare).
2. Under SSL/TLS, set the mode to **Full (strict)**, then generate a Cloudflare **Origin CA**
   certificate and install it in Nginx (this is different from a normal publicly-trusted cert —
   see the explainer below).
3. Confirm the R2 buckets from Stage 5 (`portfolio-images`, `portfolio-documents`) and Stage 13
   (`portfolio-backups`) exist, and that all six `R2_*` vars (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`,
   `R2_SECRET_ACCESS_KEY`, `R2_DOCUMENTS_BUCKET`, `R2_IMAGES_BUCKET`, `R2_PUBLIC_BASE_URL`) are set
   in the VPS's `.env`. If you connect a custom domain/subdomain (e.g. `cdn.yourdomain.com`) to the
   images bucket for public access instead of the default `r2.dev` subdomain, add that DNS record
   here and update `R2_PUBLIC_BASE_URL` to match.
4. Add a couple of free-tier rate limiting rules (e.g. throttle repeated POSTs to `/api/auth/*`).
5. Optionally enable basic WAF managed rules available on the free plan.

> 💡 **B1 explainer — what is Cloudflare actually doing?**
> Cloudflare runs a large network of servers around the world ("the edge"). When someone visits your
> domain, they connect to whichever Cloudflare server is nearest to them, not directly to your VPS.
> Cloudflare then forwards the request on to your real server ("the origin") behind the scenes. This
> hides your server's real IP address from attackers, lets Cloudflare absorb large floods of
> malicious traffic before it ever reaches you, and lets Cloudflare handle the "public" HTTPS
> certificate that browsers check.
>
> 💡 **B1 explainer — why a separate "Origin" certificate?**
> Cloudflare already gives visitors a trusted HTTPS certificate for your domain — that's the
> "browser-to-Cloudflare" leg. But the "Cloudflare-to-your-server" leg is a separate connection that
> also needs to be encrypted; otherwise the trip from Cloudflare to your VPS would be unprotected.
> The Origin CA certificate is a certificate that only Cloudflare trusts (not the wider internet) —
> it's for that second, private leg only.

**Verify it worked:** visiting `https://yourdomain.com` in a browser shows a valid padlock; setting
the SSL mode away from "Full (strict)" temporarily and back confirms the origin cert is actually
being used (mismatched certs cause an error in strict mode).

**Reference:** architecture doc §12 (Cloudflare), §10 (Image Storage / R2).

---

## Stage 12 — CI/CD

**Goal:** pushing to your main branch automatically tests, builds arm64 images, and deploys to the
VPS — no more manual `scp`/SSH steps.

**What you'll learn:** cross-building images in CI, using a container registry, and deploying over
SSH without giving CI full access to your server.

**Steps:**

1. Add a GitHub Actions workflow that runs `nx affected -t lint,typecheck,test,e2e` on every
   push/PR — pass `--coverage` on the `test` target so Vitest/Jest emit a coverage report for
   every affected project without re-checking untouched ones.
2. Publish coverage as a free artifact: `actions/upload-artifact` the `coverage/` output, and write
   a short summary table to `$GITHUB_STEP_SUMMARY` so coverage is visible directly on the Actions
   run — no third-party coverage service (Codecov/Coveralls) needed for this repo's size.
3. Add a code-quality step: `prettier --check .` (fails the build on unformatted code) alongside
   the lint/typecheck step from step 1 — both are free, no new tooling to install beyond what's
   already in the workspace.
4. Add a security step: `pnpm audit` on every run (free, built into the package manager). Add a
   `.github/dependabot.yml` for automated dependency-update PRs, and enable GitHub's secret
   scanning + push protection in the repo's settings (both free, no workflow file required for the
   latter).
5. Optionally add a GitHub CodeQL workflow (`github/codeql-action`) for static security analysis —
   free for public repos; if this repo is private, check current GitHub plan entitlements before
   assuming it's free.
6. Add a build job that uses `docker/setup-qemu-action` + `docker/setup-buildx-action` to cross-build
   each app's arm64 image, scans it with Trivy (`aquasecurity/trivy-action`, free) for known CVEs,
   then pushes it to GHCR (`ghcr.io/<you>/<app>:<sha>`), authenticated via the automatically
   provided `GITHUB_TOKEN`.
7. Finish locking down the `deploy` user from Stage 8: add its SSH key to `authorized_keys` with a
   forced command, e.g.
   ```
   command="/opt/deploy/pull-and-restart.sh",no-port-forwarding,no-agent-forwarding,no-pty ssh-ed25519 AAAA...
   ```
   so that key can only ever run that one script.
8. Install `/opt/deploy/pull-and-restart.sh` on the VPS. It should update `/opt/portfolio` from
   `origin/main`, validate Compose, pull the normal and migration images, run migrations, restart
   services, prune old images, and print `docker compose ps`.
9. Add a deploy job (e.g. using `appleboy/ssh-action` or a plain `ssh` step) that connects as
   `deploy` using a private key stored in GitHub Actions encrypted secrets, running only the forced
   command. Gate this job so it only runs on `main`, and only after the lint/test/security/build
   jobs have all succeeded.

> 💡 **B1 explainer — why no Codecov/Coveralls/paid scanner?**
> All of this pipeline's checks are either already bundled with tools you have (Vitest/Jest's
> `--coverage` flag, `pnpm audit`) or a free GitHub-native feature (Actions artifacts and step
> summaries, Dependabot, secret scanning, CodeQL on public repos) or a free open-source CLI/Action
> (Trivy). A third-party SaaS coverage/security dashboard adds real value once a project has many
> contributors and needs its own review UI — for a solo portfolio repo, GitHub's own Actions tab
> already shows everything you need.

> 💡 **B1 explainer — what is a container registry, and why GHCR?**
> A container registry is like a storage locker for Docker images — CI builds an image and uploads
> ("pushes") it there; your server later downloads ("pulls") that exact same image to run it. This
> guarantees the server runs precisely what CI tested, not a slightly different local build. GHCR
> (GitHub Container Registry) is convenient here because it's free for personal projects and
> already authenticated inside GitHub Actions with no extra setup.
>
> 💡 **B1 explainer — what does QEMU do here?**
> GitHub's free build machines use the same "amd64" chip family as most laptops — not the "arm64"
> family your VPS uses. QEMU is a tool that lets one type of computer pretend to be another kind
> long enough to run programs meant for it. `setup-qemu-action` turns this on so `buildx` can
> produce a genuine arm64 image, even though the machine building it is amd64. It's slower than
> building natively, but it works and costs nothing extra.
>
> 💡 **B1 explainer — what does that "forced command" SSH key do?**
> Normally, an SSH key lets you run _anything_ on the server. A forced command overrides that: no
> matter what the connecting side asks to run, the server always runs the one fixed command instead.
> So even if this specific key/secret ever leaked, whoever has it could only ever trigger your
> pull-and-restart script — not open a shell, read files, or do anything else.

**Verify it worked:** pushing a small change to main triggers the workflow in GitHub's Actions tab,
ends green, shows a coverage summary in the run's step summary with a downloadable coverage
artifact, and the change is visible on the live site within a couple of minutes without you
touching SSH yourself. A PR with a deliberately introduced lint error, failing test, or known-
vulnerable dependency fails the corresponding job instead of merging silently.

**Reference:** architecture doc §13 (arm64 builds), §14 (Deployment / SSH push-deploy / CI quality
gates).

---

## Stage 13 — Backups

**Goal:** automated, tested Postgres backups stored off the VPS.

**What you'll learn:** why "it's on the server's disk" is not a backup strategy.

**Steps:**

1. Write a small script that runs `pg_dump` against the production database, compresses the output,
   and uploads it to a **separate** `portfolio-backups` R2 bucket (not the images/documents buckets —
   create it the same way as in the Stage 5 R2 setup walkthrough, with its own scoped API token) using
   the R2 S3-compatible API (e.g. via the `aws` CLI configured against R2, or `rclone`). This bucket
   stays private; there's no need for public access or CORS on it.
2. Schedule it with a cron job on the VPS (e.g. daily at a quiet hour).
3. Add a retention policy in the script or via R2 lifecycle rules (e.g. keep the last 7 daily + 4
   weekly dumps) so storage stays inside the free tier.
4. Actually test a restore: spin up a throwaway local Postgres container, download a backup, and run
   `pg_restore`/`psql` against it to confirm the dump is valid and complete.

> 💡 **B1 explainer — why isn't the server's disk a backup?**
> A backup's whole purpose is to survive the _original_ being lost, damaged, or deleted. If your
> only copy of the database sits on the same disk as the database itself, then anything that takes
> out that disk (hardware failure, a bad command, the whole VPS being deleted) takes out your "backup"
> at the same time. A real backup lives somewhere physically and logically separate — here, a
> different storage service (R2) entirely, not just a different folder on the same machine.

**Verify it worked:** a fresh dump appears in the backup R2 bucket after the cron job runs; the
manual restore test in step 4 produces a working database with your real data in it.

**Reference:** architecture doc §16 (Backups).

---

## Stage 14 — Hardening, health checks & observability

**Goal:** a final pass to make sure the system is genuinely production-like, not just "working."

**What you'll learn:** the operational checklist items that don't need deep explanation individually
but matter collectively.

**Steps:**

1. Re-review architecture doc §15 (Server Security) as a checklist: SSH hardening, no exposed
   Postgres port, secrets never committed, OAuth callback URLs restricted to your real domain,
   uploaded images validated (type/size) both client- and server-side.
2. Add `HEALTHCHECK` instructions to any container missing one, and confirm `docker compose ps`
   reflects real health, not just "running."
3. Confirm where logs live for each layer (application logs, Nginx access/error logs, Postgres
   logs) and that they're retained somewhere you can actually read them later.
4. Set up a free basic uptime monitor (e.g. an external ping/HTTP check) against your public URL.
5. Do a final read-through of the whole live system against the architecture doc's §19
   (Architecture Principles) — confirm you haven't accidentally introduced complexity (extra
   services, unneeded queues, etc.) beyond what's documented.

**Verify it worked:** all containers show `healthy`; you can locate and read a real log line from
each of the three log sources; the uptime monitor reports your site as up.

**Reference:** architecture doc §15 (Server Security), §17 (Observability), §19 (Architecture
Principles).

---

## After this guide

At this point every element in the architecture plan is built, deployed, automated, and backed up.
From here, treat further work (project tags/links/technologies, error tracking, metrics, etc.) as
optional additions — per the architecture doc's "avoid premature abstraction" principle, only add
them when you hit a real need or a genuine learning goal, not by default.
