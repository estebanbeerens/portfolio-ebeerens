---
name: nestjs-backend
description: 'Build and extend the NestJS backend in this Nx workspace (apps/api) using Prisma 7 with driver adapters and OpenAPI docs via @nestjs/swagger. Use when adding a NestJS module, controller, service, or DTO; wiring a Prisma model into the API; writing or running Prisma migrations; adding request validation; or documenting endpoints with Swagger/OpenAPI decorators.'
---

# NestJS Backend Development

## When to Use

- Adding a new feature/resource to `apps/api` (module + controller + service + DTOs)
- Adding or changing a Prisma model and wiring it into a NestJS service
- Running Prisma 7 migrations or regenerating the client
- Documenting endpoints with OpenAPI via `@nestjs/swagger`
- Reviewing NestJS code for adherence to this repo's conventions

## Stack in This Repo

- NestJS 11 app at `apps/api` (Nx-managed, webpack build, served via `nx serve api`)
- Prisma 7 (`prisma-client` generator) with the `@prisma/adapter-pg` driver adapter — `PrismaClient` never takes a raw connection string, only the adapter does
- `@nestjs/swagger` 11 for OpenAPI docs, mounted at `/api/docs` (see [main.ts](../../../apps/api/src/main.ts))
- Global route prefix `api` set in `main.ts`

## Workflow: Add a New Resource

1. **Scaffold structure.** Use the `nx-generate` skill to scaffold module/controller/service files, or create them manually following the pattern in [apps/api/src/app](../../../apps/api/src/app/). Don't look up Nx generator syntax yourself — `nx-generate` handles that discovery.
2. **Model the data.** Add or update the Prisma model in [schema.prisma](../../../apps/api/prisma/schema.prisma).
3. **Migrate.** Follow [Prisma 7 conventions](./references/prisma-7.md) for the generate/migrate workflow.
4. **Define DTOs.** One class per request/response shape in `<feature>/dto/`, decorated with `@ApiProperty()`. Add `class-validator` decorators to request DTOs (see checklist below).
5. **Implement the service.** Inject `PrismaService`; keep all Prisma calls out of controllers.
6. **Implement the controller.** Tag with `@ApiTags()` and document each route per [OpenAPI/Swagger conventions](./references/openapi-swagger.md).
7. **Register in the module.** Add the controller/service to the relevant `@Module`.
8. **Verify:**
   - `npx nx build api`
   - `npx nx test api`
   - `npx nx serve api`, then check `http://localhost:3000/api/docs` reflects the new routes

## Best Practices Checklist

- Controllers only orchestrate — no Prisma calls or business logic inline in controllers
- Inject the single `PrismaService`; never instantiate `PrismaClient` directly elsewhere
- Request DTOs combine `class-validator` decorators (`@IsString()`, `@IsOptional()`, ...) with `@ApiProperty()`; response DTOs are plain `@ApiProperty()` shapes
- A global `ValidationPipe({ whitelist: true, transform: true })` is already enabled in `main.ts` — every request DTO's `class-validator` decorators are enforced automatically
- Never return a Prisma model with sensitive fields directly from a controller (e.g. `Session.tokenHash`) — map it to a DTO
- Read secrets via `process.env`; never hardcode connection strings or tokens
- Every public route should carry Swagger decorators — an undocumented route is a review flag

## Reference Files

- [Prisma 7 conventions](./references/prisma-7.md) — driver adapters, migrations, generated client usage
- [OpenAPI/Swagger conventions](./references/openapi-swagger.md) — DocumentBuilder setup, decorator patterns, tagging

## Related Skills

- **`openapi-client-generation`** — `openapi/api.yaml` is the single source of truth for the API contract; use that skill (not ad hoc decorator changes) when adding/changing an endpoint's shape.
- **`oauth-session-auth`** — GitHub OAuth, Passport strategy, and the opaque session/auth guard live there, not here.
- **`image-storage-r2`** — presigned image uploads and rich-text (TipTap/ProseMirror) storage/sanitization live there.
