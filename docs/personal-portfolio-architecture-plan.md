# Personal Portfolio — Full-Stack Architecture & Infrastructure Plan

## 1. Project Goal

Build a personal portfolio as a full-stack passion/learning project rather than optimizing purely for the lowest hosting cost or minimum operational complexity.

The application should include:

- A public personal portfolio
- Server-side rendering (SSR)
- A dedicated backend API
- OpenAPI specification as the API contract
- GitHub OAuth authentication
- A private admin interface for the sole administrator
- CRUD management of personal profile data and projects
- PostgreSQL persistence
- Image storage outside PostgreSQL
- Dockerized deployment
- Nginx as a reverse proxy
- Cloudflare as the public-facing DNS/CDN/TLS/WAF layer
- Oracle Cloud Always Free VPS as the primary server
- CI/CD for deployments

The infrastructure should be intentionally production-like, but not unnecessarily complex.

---

## 2. Recommended High-Level Architecture

```text
                         Internet
                            │
                            ▼
                    ┌───────────────┐
                    │   Cloudflare  │
                    │ DNS / CDN     │
                    │ TLS / WAF     │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │    Nginx      │
                    │ reverse proxy │
                    └───────┬───────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
       ┌─────────────┐             ┌─────────────┐
       │  Frontend   │             │   Backend   │
       │ Angular     │             │ NestJS      │
       │ native SSR  │             │ OpenAPI     │
       └─────────────┘             └──────┬──────┘
                                         │
                                         ▼
                                  ┌─────────────┐
                                  │ PostgreSQL  │
                                  └─────────────┘
```

Run the application components using Docker Compose on the Oracle VPS.

Cloudflare should provide the public edge layer. Nginx should provide local reverse proxying. A load balancer is not needed because there is initially only one server.

---

## 3. Hosting Strategy

### Primary recommendation

Use:

- Oracle Cloud Always Free VPS
- Linux server
- Docker
- Docker Compose
- Nginx
- Cloudflare
- PostgreSQL

The VPS is not necessary because of traffic requirements. It is chosen because infrastructure and learning are part of the project's goals.

### Instance shape

Oracle Always Free compute comes in two shapes:

| Shape | Resources | Architecture |
|---|---|---|
| Ampere A1 (Arm) | Up to 4 OCPU + 24 GB RAM total, usable as 1–4 VMs (1,500 OCPU-hours + 9,000 GB-hours/month) | arm64 |
| AMD micro (E2.1.Micro) | 2 VMs, 1/8 OCPU + 1 GB RAM each | amd64 |

Use a single **Ampere A1 Arm VM** (e.g. 2 OCPU / 12 GB RAM, leaving headroom under the always-free cap). The AMD micro shape is too small to run Postgres, the API, the SSR frontend, and Nginx together on one box.

**Consequence:** all Docker images deployed to this VPS must be built for **arm64**. GitHub Actions' hosted runners are amd64, so the CI pipeline needs QEMU emulation + `docker buildx` to cross-build arm64 images (see [§13 Docker](#13-docker) and [§14 Deployment](#14-deployment)).

### Why not only use Firebase/Cloudflare Pages?

For a simple static portfolio, managed static hosting would be preferable.

However, this project deliberately includes:

- SSR
- backend development
- authentication
- database persistence
- API design
- deployment infrastructure
- system administration

Therefore, the VPS provides useful hands-on experience.

### Important constraint

Do not over-engineer the infrastructure.

Avoid introducing:

- Kubernetes
- multiple VPS instances
- an Oracle load balancer
- microservices
- API gateways
- database clusters
- Redis without a real use case
- unnecessary queues
- complex service meshes

A single VPS with Docker Compose should be the initial target.

---

## 4. Monorepo Structure

An Nx monorepo is a good fit given the project's frontend architecture and shared code requirements.

Suggested structure:

```text
portfolio/
├── apps/
│   ├── web/              # Public portfolio + SSR
│   ├── admin/            # Admin interface
│   └── api/              # Backend API
│
├── libs/
│   ├── ui/               # Shared UI components
│   ├── models/           # Shared domain models/types
│   ├── api-client/       # Generated API client
│   └── ...
│
├── openapi/
│   └── api.yaml          # API specification
│
├── infrastructure/
│   ├── docker/
│   ├── nginx/
│   └── ...
│
├── docker-compose.yml
├── nx.json
└── ...
```

The exact directory structure can be adjusted based on the chosen framework.

---

## 5. Frontend

Use **Angular** with its native SSR support (`@angular/ssr`, built into the Angular CLI since v17), generated via the Nx `@nx/angular` plugin.

Requirements:

- SSR
- Accessible UI
- Responsive design
- Strong UX
- SEO-friendly public pages
- Admin UI
- API-driven data
- Generated API client from OpenAPI

Potential frontend responsibilities:

### Public site

- Home
- About/profile
- Projects
- Individual project pages
- Project images
- Experience/resume section (organizations and the roles held at each)
- Contact page (public inquiry form, reCAPTCHA-protected)
- Other portfolio content

### Admin site

- GitHub login
- Profile editing
- Project list
- Create project
- Edit project
- Delete project
- Image management
- Manage organizations (create/edit/delete)
- Manage roles (create/edit/delete, assigned to an organization)
- Toggle feature flags
- Review/delete submitted contact messages

The public frontend should be read-only from the perspective of normal visitors, aside from
submitting the contact form.

Feature flags are fetched once from `GET /api/feature-flags` at application init and used to
decide whether to render the corresponding section/nav item in both `web` and `admin`. The actual
frontend fetch-at-init mechanism (e.g. an `APP_INITIALIZER`-style hook and a shared flags service)
is intentionally not designed yet — `web`/`admin` don't have real feature pages to gate until
Phase 3/5 build them; only the backend contract (§7, §9) exists so far.

---

## 6. Backend

Build a dedicated REST API using **NestJS** (Node/TypeScript), generated via the Nx `@nx/nest` plugin. NestJS keeps the whole monorepo in TypeScript, has first-class Nx support, generates the OpenAPI spec directly from decorators via `@nestjs/swagger`, and integrates cleanly with Passport for GitHub OAuth.

Use **Prisma** as the ORM/migration tool (TypeORM is a viable alternative, but Prisma's migration workflow is more ergonomic for a small solo project). Target **Prisma 7**: it requires a database driver adapter (`@prisma/adapter-pg` for Postgres) instead of a bundled native query engine, requires Node ≥20.19 (22.x recommended), and ships as an ES module — see the build guide's Stage 2 for how this is reconciled with the monorepo's single, CommonJS-friendly root `package.json`. The v7 client also has no native engine binary to match to the arm64 host (see §13), which simplifies the Docker story from earlier Prisma versions.

The API should own:

- Authentication/session handling
- Authorization
- Profile data
- Project CRUD (including the skills used on each project)
- Organization and role CRUD (work experience/resume, sharing the same skills pool as projects)
- Feature flag configuration (enum-backed toggles gating the contact/projects/roles/skills sections)
- Contact message intake (reCAPTCHA-verified) and admin review
- Image metadata
- Database access
- Validation
- Business rules

The frontend should not access PostgreSQL directly.

Architecture:

```text
Frontend
   │
   ▼
OpenAPI-generated client
   │
   ▼
REST API
   │
   ▼
Service/domain layer
   │
   ▼
Repository/data access
   │
   ▼
PostgreSQL
```

Keep the backend modular, but avoid premature microservices.

---

## 7. OpenAPI

Use OpenAPI as the contract between frontend and backend.

Suggested flow:

```text
OpenAPI specification
        │
        ├──► Backend implementation
        │
        └──► Generated frontend API client
```

The OpenAPI specification should define:

- Endpoints
- Request schemas
- Response schemas
- Authentication requirements
- Error responses
- Validation constraints
- Pagination where needed

For example:

```text
GET    /api/profile
PUT    /api/profile

GET    /api/projects
GET    /api/projects/{id}
POST   /api/projects
PUT    /api/projects/{id}
DELETE /api/projects/{id}

GET    /api/skills

GET    /api/organizations
GET    /api/organizations/{id}
POST   /api/organizations
PUT    /api/organizations/{id}
DELETE /api/organizations/{id}

GET    /api/roles
GET    /api/roles/{id}
POST   /api/roles
PUT    /api/roles/{id}
DELETE /api/roles/{id}

GET    /api/feature-flags
PUT    /api/feature-flags/{key}

POST   /api/contact
GET    /api/contact
DELETE /api/contact/{id}
```

Admin-only endpoints should explicitly require authentication. `GET /api/skills`,
`GET /api/organizations[/{id}]`, `GET /api/roles[/{id}]`, `GET /api/feature-flags`, and
`POST /api/contact` are public; mutating `organizations`/`roles` routes,
`PUT /api/feature-flags/{key}`, and `GET`/`DELETE /api/contact[/{id}]` are admin-only.

---

## 8. Authentication

Use GitHub OAuth rather than implementing username/password authentication.

Authentication flow:

```text
Browser
   │
   ▼
"Login with GitHub"
   │
   ▼
GitHub OAuth
   │
   ▼
OAuth callback
   │
   ▼
Backend (Passport `passport-github2` strategy)
   │
   ├── Verify GitHub identity
   ├── Check authorized GitHub user ID
   └── Create authenticated session
```

There is only one administrator.

A simple authorization model is therefore sufficient:

```text
authenticated
    AND
githubUserId === configuredAdminGithubId
```

Store the administrator's GitHub ID in configuration/secrets rather than hardcoding it.

Do not build a full multi-user role/permission system unless there is a genuine learning reason to do so.

### Session mechanism

Use an **opaque, server-side session token** rather than a JWT:

```text
GitHub OAuth success
        │
        ▼
Backend generates a random opaque token
        │
        ├── Stores token hash + githubUserId + expiresAt in a `sessions` table (Postgres)
        └── Sets the token as a cookie: HttpOnly, Secure, SameSite=Strict
```

Rationale: a stateless JWT can't be revoked before it expires without adding a blocklist (which is
stateful anyway), and it carries a bigger attack surface (algorithm confusion, key handling). An
opaque, server-side-verified session:

- is revoked instantly on logout (just delete the row)
- reveals nothing if the cookie leaks (it's a random ID, not a signed payload)
- needs no Redis — for a single admin, the `sessions` table in the existing Postgres instance is
  enough

Run a small scheduled job (e.g. a cron-triggered endpoint or a lightweight worker) to purge expired
sessions periodically.

---

## 9. Database

Use PostgreSQL.

Initial domain model can remain small.

### Profile

```text
profile
├── id
├── firstname
├── lastname
├── birthday
└── ...
```

### Projects

```text
projects
├── id
├── title
├── description   (jsonb — TipTap/ProseMirror document, see §10)
├── image
├── client        (optional)
├── jobRole       (optional)
├── liveUrl       (optional)
├── startDate
├── endDate       (optional — no end date means the project is still ongoing/present)
├── slug
├── createdAt
└── updatedAt
```

Projects relate to skills through a many-to-many join, so a skill can be reused across multiple
projects rather than re-typed per project.

### Skills

```text
skills
├── id
└── name   (unique, e.g. "React", "Angular", ".NET", "Figma")
```

Kept in their own table (rather than a free-text field on `projects`) specifically so skills can
be queried/aggregated across all projects (e.g. "every skill I've used") instead of re-typed and
inconsistently spelled per project. `roles` (below) reuse this same table, so it's one unified
skill pool across the whole portfolio, not a separate list per feature.

### Organizations

```text
organizations
├── id
├── name      (unique)
├── logoUrl    (optional)
├── website    (optional)
├── createdAt
└── updatedAt
```

### Roles

```text
roles
├── id
├── jobTitle
├── organizationId  (FK → organizations — multiple roles can share one organization)
├── location        (optional)
├── employmentType  (optional — fixed enum, see below)
├── startDate
├── endDate         (optional — no end date means the role is current/present)
├── createdAt
└── updatedAt
```

`roles` relate to `skills` through the same many-to-many join `projects` uses, and to
`organizations` through a required foreign key — this is the LinkedIn-style "experience" section:
multiple roles can sit under one organization. An organization cannot be deleted while roles still
reference it (a 409, not a cascading delete — consistent with not silently destroying data).
`employmentType` is a fixed enum (`FULL_TIME`, `PART_TIME`, `SELF_EMPLOYED`, `FREELANCE`,
`INTERNSHIP`, `TRAINEE`, `APPRENTICESHIP`, `SEASONAL`) — the first enum in this schema; everything
else so far has preferred a free-text field.

### Sessions

```text
sessions
├── id
├── tokenHash      (hash of the opaque session token, see §8)
├── githubUserId
├── expiresAt
└── createdAt
```

### Contact Messages

```text
contact_messages
├── id
├── fullName
├── email
├── subject
├── message
└── createdAt
```

Submitted through the public contact form. The reCAPTCHA token is verified against Google's
`siteverify` API at submission time and is not itself persisted — only the message content is
stored, for the admin to review.

### Feature Flags

```text
feature_flags
├── key        (primary key — fixed enum: CONTACT, PROJECTS, ROLES, SKILLS)
├── enabled    (defaults to false)
└── updatedAt
```

`key` is the primary key directly (no separate surrogate id) since the enum already guarantees
uniqueness. On every app boot, a row is upserted for each `FeatureFlagKey` enum value that doesn't
already exist yet, defaulting to `enabled: false` — so the table is always complete even right
after adding a new enum value, without a separate seed script. The frontend fetches the full list
once at application init and uses it to decide whether to show the corresponding section/page;
there is no `DELETE` endpoint since flags are fixed by the enum, not admin-creatable.

Potential future additions:

```text
project_links
```

Do not introduce these until they are actually required.

Use database migrations from the beginning.

---

## 10. Image Storage

Do not store image binaries directly inside PostgreSQL.

Instead:

```text
PostgreSQL
    │
    └── image metadata / URL
                 │
                 ▼
          Object storage
```

Use **Cloudflare R2**. Free tier (verified): 10 GB-month storage, 1 million Class A operations/month,
10 million Class B operations/month, and **no egress fees** at any tier — ideal for serving project
images publicly.

The backend should control image upload/delete authorization via short-lived **presigned URLs**
rather than proxying file bytes through the API:

```text
Admin
  │
  ▼
Admin UI requests an upload URL
  │
  ▼
Backend
  │
  ├── Validate requested content-type/size
  ├── Issue a short-lived presigned PUT URL for R2
  └── (Admin UI uploads the file directly to R2)
  │
  ▼
Admin UI confirms upload complete
  │
  ▼
Backend stores the object key + public URL in PostgreSQL
```

### Rich-text project descriptions

Store the project `description` as a **TipTap/ProseMirror JSON document** (`jsonb` column), not a
raw HTML string — schema-constrained content can't smuggle arbitrary tags or attributes the way a
free-form HTML string can. At render time (including SSR), the backend serializes the JSON to HTML
through a strict, allowlisted serializer, then still runs the result through a sanitizer (e.g.
`sanitize-html`/DOMPurify) as defense in depth before it reaches the public site.

---

## 11. Nginx

Use Nginx as a reverse proxy, not initially as a load balancer.

Potential routing:

```text
HTTPS :443
   │
   ▼
 Nginx
   ├── /       → frontend SSR
   ├── /admin  → admin application
   ├── /api    → backend
   └── /assets → static assets where appropriate
```

Nginx responsibilities may include:

- Reverse proxying
- Request routing
- Security headers
- Compression
- Connection handling
- Rate limiting as a defense-in-depth fallback (see below)
- Static asset serving
- Forwarding requests to Docker containers

TLS can be handled at Cloudflare, but configure the Cloudflare-to-origin connection securely as well
(e.g. a Cloudflare Origin CA certificate with SSL/TLS mode set to "Full (strict)").

### Rate limiting split

Rate limiting is handled in two layers, not duplicated effort:

- **Cloudflare** (edge, free-tier rate limiting rules) — first line of defense, stops abusive
  traffic before it ever reaches the VPS.
- **Nginx** (origin) — defense-in-depth fallback in case traffic reaches the origin directly or
  Cloudflare is bypassed.

---

## 12. Cloudflare

Use Cloudflare for:

- DNS
- CDN/caching where appropriate
- TLS
- DDoS protection
- WAF/security features where useful

Potential domains:

```text
example.com
www.example.com
api.example.com
```

Alternatively, serve the API under:

```text
example.com/api/*
```

Using `/api` keeps the initial architecture simple and avoids unnecessary cross-origin concerns.

---

## 13. Docker

Containerize the major application components.

Potential setup:

```text
docker-compose.yml

services:
  nginx
  web
  admin
  api
  postgres
```

The exact service split should follow the framework's SSR requirements.

Use:

- Multi-stage Docker builds
- Minimal production images
- Non-root application users where practical
- Environment variables/secrets
- Health checks
- Persistent PostgreSQL volume

Do not expose PostgreSQL directly to the public internet.

### Architecture: arm64

The Oracle VPS runs on Ampere A1 (Arm), so every image must be built for **arm64**, not the amd64
GitHub-hosted runners' native architecture. Use `docker/setup-qemu-action` + `docker buildx` in CI
to cross-build arm64 images (slower than a native build, but still free).

---

## 14. Deployment

Use CI/CD from GitHub.

Potential deployment flow:

```text
Developer
   │
   ▼
Git push
   │
   ▼
GitHub
   │
   ▼
CI
 ├── lint
 ├── unit tests
 ├── build
 └── optional integration tests
   │
   ▼
Build Docker images (arm64, via QEMU + buildx)
   │
   ▼
Push images to GitHub Container Registry (GHCR)
   │
   ▼
SSH into the Oracle VPS as a dedicated deploy user
   │
   ▼
Docker Compose pull && up -d
   │
   ▼
Application updated
```

### Deploy mechanism: SSH push-deploy

Deploy via **SSH push from GitHub Actions**, not a self-hosted Actions runner installed on the VPS.
A self-hosted runner on an internet-facing box is a known RCE-adjacent risk (it must fetch and
execute arbitrary workflow code with the runner's privileges). Instead:

- Create a dedicated, least-privilege `deploy` user on the VPS with no interactive shell.
- Restrict its SSH key with a forced `command="..."` in `authorized_keys` that only allows running
  the fixed `docker compose pull && docker compose up -d` script — nothing else.
- Store the private key in GitHub Actions encrypted secrets; never commit it.
- Rotate the deploy key periodically.

Deployment should eventually be automated rather than requiring manual SSH commands.

---

## 15. Server Security

The VPS should be treated as a real production server.

Minimum measures:

- SSH keys instead of password authentication
- Disable root SSH login where practical
- Firewall
- Only expose required ports
- Keep OS packages updated
- Keep Docker and application dependencies updated
- Never commit secrets
- Store secrets outside Git
- Do not expose PostgreSQL publicly
- Use HTTPS
- Restrict GitHub OAuth callback URLs
- Validate uploaded images
- Apply authentication and authorization server-side
- Add reasonable API rate limiting

---

## 16. Backups

The database is the most important persistent application data.

Implement automated PostgreSQL backups.

At minimum:

```text
PostgreSQL
    │
    ▼
pg_dump (scheduled cron job)
    │
    ▼
Upload to a separate Cloudflare R2 bucket (free tier, same account as image storage)
```

Apply a retention/rotation policy (e.g. keep the last 7 daily + 4 weekly dumps) so storage doesn't
grow unbounded.

Do not rely exclusively on the VPS disk.

Images stored in object storage should have their own durability/versioning/backup strategy depending on the provider.

Periodically test restoring a backup.

---

## 17. Observability

Keep this lightweight initially.

At minimum have:

- Application logs
- Nginx logs
- PostgreSQL logs
- Docker container health checks
- Basic uptime monitoring

Later, optionally add:

- Error tracking
- Metrics
- Centralized logs
- Performance monitoring
- Application tracing

Only add these when they provide a learning opportunity or solve a real problem.

---

## 18. Development Phases

### Phase 1 — Project foundation

- Set up Git repository
- Set up Nx monorepo
- Scaffold `web` and `admin` with `@nx/angular:application` (SSR enabled) and `api` with
  `@nx/nest:application`
- Configure SSR
- Set up shared libraries
- Establish coding/linting/testing conventions

### Phase 2 — Backend foundation

- Create backend application (NestJS)
- Add PostgreSQL
- Set up Prisma and its migrations
- Define initial data model, including the `sessions` table (§9) and the enum-backed
  `feature_flags` table (§9)
- Create OpenAPI specification (`@nestjs/swagger`)
- Implement basic API endpoints

### Phase 3 — Public portfolio

- Build public UI
- Implement SSR
- Connect to API
- Implement projects
- Implement profile
- Implement the experience/resume section (organizations and roles)
- Implement the contact page (reCAPTCHA-protected submission)
- Optimize SEO/accessibility/performance

### Phase 4 — Authentication

- Implement GitHub OAuth (Passport `passport-github2`)
- Create the opaque, server-side session (`sessions` table + HttpOnly/Secure/SameSite=Strict cookie, §8)
- Add the expired-session cleanup job
- Restrict admin functionality to the configured GitHub account

### Phase 5 — Admin interface

- Profile editing
- Project creation
- Project editing
- Project deletion
- Image upload
- Image deletion
- Organization creation/editing/deletion
- Role creation/editing/deletion
- Toggle feature flags
- Validation/error handling

### Phase 6 — Infrastructure

- Create Oracle VPS
- Install/configure Docker
- Configure Nginx
- Configure Cloudflare DNS
- Configure HTTPS
- Deploy PostgreSQL
- Deploy applications

### Phase 7 — CI/CD

- GitHub Actions
- Automated tests
- Production builds
- Docker image builds
- Automated deployment

### Phase 8 — Production hardening

- Firewall
- SSH hardening
- Secrets management
- Backups
- Health checks
- Monitoring
- Logging
- Security headers
- Rate limiting

---

## 19. Architecture Principles

Keep these principles throughout the project:

### Simple infrastructure, sophisticated application

The goal is not to build an enterprise infrastructure stack.

Aim for:

```text
1 VPS
+
Docker Compose
+
Nginx
+
PostgreSQL
+
Cloudflare
+
SSR frontend
+
REST API
```

This provides a large amount of useful engineering experience without unnecessary complexity.

### API-first

The backend should have a clear API contract.

### Secure by default

Authentication and authorization must be enforced by the backend, not merely hidden in the UI.

### Infrastructure as code where practical

Prefer reproducible configuration over manually configured servers.

### Automated deployments

The production environment should eventually be deployable from Git.

### Backups are part of the application

A database without tested backups is not a production-ready system.

### Avoid premature abstraction

Only introduce additional services or architectural patterns when there is a real requirement or a deliberate learning objective.

---

## 20. Suggested Final Technology Stack

The exact choices can still be evaluated, but the target architecture is:

| Layer | Technology |
|---|---|
| Frontend | Angular |
| SSR | `@angular/ssr` (native Angular SSR) |
| Backend | NestJS |
| ORM/migrations | Prisma |
| Monorepo | Nx (`@nx/angular`, `@nx/nest`) |
| API | REST |
| API contract | OpenAPI (generated via `@nestjs/swagger`) |
| API client | Generated from OpenAPI |
| Database | PostgreSQL |
| Authentication | GitHub OAuth (Passport) |
| Session | Opaque server-side token in Postgres `sessions` table, HttpOnly/Secure/SameSite=Strict cookie (no JWT, no Redis) |
| Rich text | TipTap, stored as ProseMirror JSON (`jsonb`), sanitized on render |
| Image storage | Cloudflare R2 (presigned uploads) |
| Contact form spam protection | Google reCAPTCHA (token verified server-side against Google's API) |
| Containers | Docker (arm64/multi-arch) |
| Orchestration | Docker Compose |
| Reverse proxy | Nginx |
| Cloud | Oracle Cloud Always Free — Ampere A1 (Arm) |
| Edge | Cloudflare (DNS/CDN/TLS/WAF + edge rate limiting) |
| CI/CD | GitHub Actions → GHCR → SSH push-deploy |
| Monitoring | Lightweight uptime/logging initially |

---

## 21. Key Recommendation

The project should deliberately balance **learning value and realistic engineering**.

Do not choose a VPS because the portfolio needs the performance.

Choose it because the project is intended to teach and demonstrate:

- Full-stack architecture
- Frontend architecture
- SSR
- API design
- OpenAPI
- OAuth
- Database design
- Docker
- Linux
- Nginx
- Cloud infrastructure
- CI/CD
- Security
- Backups
- Observability

The resulting portfolio is therefore both the **product** and a **demonstration of engineering capability**.

The target should be a small, maintainable production-like system—not an enterprise architecture scaled down to one visitor.
