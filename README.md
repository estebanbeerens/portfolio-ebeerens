# Personal Portfolio

This repository contains my personal portfolio website and the systems behind it. It is both a public portfolio and a hands-on full-stack project for exploring modern web development, API design, authentication, content management, and production-style deployment.

**Live site:** <https://ebeerens.com>

## What it includes

- A server-side rendered portfolio site for projects, experience, skills, and profile information.
- English and Dutch content on the public site.
- A private admin application for managing portfolio content.
- GitHub OAuth with an opaque, server-side session for the single administrator.
- A contact form protected by Cloudflare Turnstile.
- Cloudflare R2 storage for project images and documents, using presigned URLs.
- Server-side feature flags for optional portfolio sections.
- Activity logging for administrative changes.
- A typed Angular API client generated from the committed OpenAPI contract.

## Technology

| Area                  | Technologies                                 |
| --------------------- | -------------------------------------------- |
| Workspace             | Nx monorepo, TypeScript                      |
| Public site and admin | Angular 22, Angular SSR, Tailwind CSS 4      |
| API                   | NestJS 11, Prisma 7, OpenAPI                 |
| Database              | PostgreSQL 16                                |
| Storage and edge      | Cloudflare R2, Cloudflare, Nginx             |
| Testing               | Vitest, Jest, Playwright, axe-core           |
| Deployment            | Docker Compose, Oracle Cloud, GitHub Actions |

## Repository structure

```text
apps/
  web/                  Public portfolio website with SSR and localization
  admin/                Authenticated content management interface
  api/                  NestJS REST API and Prisma schema
  web-e2e/              Playwright tests for the public site
  admin-e2e/            Playwright tests for the admin application
  api-e2e/              HTTP tests for the API

libs/
  ui/                   Shared Angular UI components
  api-client/           Generated Angular client for the API

openapi/
  api.yaml              Source-of-truth API contract

docs/                   Architecture, build, and deployment documentation
deploy/                 Deployment scripts
docker-compose*.yml     Local and production service definitions
nginx/                  Reverse-proxy configuration
```

## Local development

### Prerequisites

- Node.js 22.x, as specified in `.nvmrc`
- npm
- Docker Desktop with Docker Compose
- GitHub OAuth application credentials for administrator login
- Cloudflare Turnstile credentials for the contact form
- Cloudflare R2 credentials for image and document storage

The database is the only external service required to start the core application locally. OAuth, Turnstile, and R2-backed features need their corresponding credentials before they can be used. Never commit real credentials to the repository.

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file and fill in the values you need:

   ```bash
   cp .env.example .env
   ```

3. Start the local PostgreSQL instance:

   ```bash
   docker compose up -d postgres
   ```

   PostgreSQL is available on `localhost:5433` by default.

4. Apply the Prisma migrations:

   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

5. Start the applications:

   ```bash
   npm run serve
   ```

   The local applications are available at:

   - Public site: <http://localhost:4200>
   - Admin application: <http://localhost:4300>

   To run a smaller slice of the workspace, use `npm run serve:web` for the public site and API, or `npm run serve:admin` for the admin application and API.

## Development commands

Run Nx targets for an individual project with `npx nx run <project>:<target>`. Common examples:

```bash
# Run checks for a project
npx nx lint web
npx nx typecheck web
npx nx test web

# Run all configured tests
npx nx run-many --target=test --all

# Explore the local database
npm run studio

# Export the API contract and regenerate the Angular client
npm run build:openapispec
npm run build:api-client
```

The generated client lives in `libs/api-client/src/generated`. Update the backend contract through `openapi/api.yaml` and use the repository scripts when regenerating it.

End-to-end tests are opt-in because they start application and database services:

```bash
npx nx e2e web-e2e
npx nx e2e admin-e2e
npx nx e2e api-e2e
```

## Deployment

The production setup uses Docker Compose on an Oracle Cloud Arm64 VPS, with Nginx behind Cloudflare and PostgreSQL alongside the application services. GitHub Actions builds and deploys the containers.

The existing documentation explains the decisions and operational steps in more detail:

- [Architecture and infrastructure plan](docs/personal-portfolio-architecture-plan.md)
- [Build guide](docs/personal-portfolio-build-guide.md)
- [Deployment manual steps](docs/deploy-manual-steps.md)
- [Deployment script](deploy/pull-and-restart.sh)

Production credentials belong in the deployment environment or secret store, not in tracked files. Review `.env.example` for the required variable names and keep `.env` local.

## License

This project is licensed under the [MIT License](LICENSE).
