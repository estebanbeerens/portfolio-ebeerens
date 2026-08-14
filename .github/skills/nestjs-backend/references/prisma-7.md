# Prisma 7 Conventions (this repo)

## Generator & Client
- The generator uses `provider = "prisma-client"` (not the older `prisma-client-js`), with `output = "../src/generated/prisma"`.
- Import the generated client from the app's own generated folder, not `@prisma/client` directly:
  ```ts
  import { PrismaClient } from '../generated/prisma/client';
  ```
- Regenerate after any schema change: `npx prisma generate` (also runs automatically via the root `postinstall` script).

## Driver Adapters
- This project connects through `@prisma/adapter-pg` (`PrismaPg`) rather than passing a bare connection string to `PrismaClient`.
- Pattern used in [prisma.service.ts](../../../../apps/api/src/app/prisma.service.ts):
  ```ts
  super({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  ```
- Keep a single injectable `PrismaService` extending `PrismaClient` and implementing `OnModuleInit`/`OnModuleDestroy` to hook `$connect`/`$disconnect` into Nest's lifecycle. Don't create additional `PrismaClient` instances elsewhere.

## Schema Location & Config
- Schema: `apps/api/prisma/schema.prisma`
- Migrations: `apps/api/prisma/migrations`
- [prisma.config.ts](../../../../prisma.config.ts) at the repo root defines the schema/migrations paths and loads `DATABASE_URL` via `dotenv/config`.
- Because config lives at the repo root, run Prisma CLI commands from the repo root, not from `apps/api`.

## Migration Workflow
1. Edit `apps/api/prisma/schema.prisma`.
2. `npx prisma migrate dev --name <change-description>` — creates a migration, applies it, and regenerates the client.
3. Commit the generated migration folder under `apps/api/prisma/migrations/`.
4. For CI/production: `npx prisma migrate deploy` (applies pending migrations without prompting).
5. If only the client needs regenerating (no schema change), run `npx prisma generate`.

## Modeling Conventions Used in This Schema
- `id String @id @default(cuid())`
- `createdAt DateTime @default(now())` / `updatedAt DateTime @updatedAt` on models that track history
- Business-unique fields get `@unique` (e.g. `Project.slug`, `Session.tokenHash`)
