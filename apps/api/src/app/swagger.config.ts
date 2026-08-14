import { DocumentBuilder } from '@nestjs/swagger';

// Shared by main.ts (live docs) and tools/export-openapi.ts (openapi/api.yaml) so they can't drift apart.
export function createSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('Portfolio API')
    .setDescription('API documentation for the portfolio backend')
    .setVersion('0.0.1')
    .build();
}
