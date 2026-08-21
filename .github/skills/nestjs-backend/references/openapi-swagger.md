# OpenAPI/Swagger Conventions (this repo)

## Setup (already in main.ts)

```ts
const swaggerConfig = new DocumentBuilder()
  .setTitle('Portfolio API')
  .setDescription('API documentation for the portfolio backend')
  .setVersion('0.0.1')
  .build();
const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
SwaggerModule.setup(`${globalPrefix}/docs`, app, swaggerDocument);
```

- Docs are served at `/api/docs` (global prefix + `/docs`).
- Bump `.setVersion()` when the API contract changes meaningfully.

## Controller Decorators

- Tag every controller: `@ApiTags('<feature>')`.
- Document every route's response with the decorator matching its status code — `@ApiOkResponse`, `@ApiCreatedResponse`, `@ApiNoContentResponse`, `@ApiNotFoundResponse`, etc. — each with `{ description, type }`.
- For routes that can fail (404, 409, ...), add the matching `@Api...Response` so the OpenAPI doc reflects real failure modes, not just the happy path.

## DTOs

- Every field exposed over the wire gets `@ApiProperty()` (or `@ApiPropertyOptional()` for optional fields) with a `description` and a realistic `example`.
- One DTO class per shape — don't expose a Prisma model directly as a response type; DTOs are the single source of truth for the wire contract.
- Example (from [message.dto.ts](../../../../apps/api/src/app/dto/message.dto.ts)):
  ```ts
  export class MessageDto {
    @ApiProperty({ description: 'A greeting message returned by the API', example: 'Hello API' })
    message: string;
  }
  ```

## Auth / Security Docs

- For authenticated routes, add `@ApiBearerAuth()` / `@ApiSecurity()` on the controller or route, and register the matching scheme via `.addBearerAuth()` on the `DocumentBuilder` so Swagger UI can send credentials.

## Checklist for a New Endpoint

- [ ] Controller has `@ApiTags`
- [ ] Route has a success response decorator with `type` set to a DTO
- [ ] Route has decorators for realistic error responses
- [ ] Request body DTO (if any) has `@ApiProperty` plus validation decorators
- [ ] Verified in Swagger UI at `/api/docs` after `nx serve api`
