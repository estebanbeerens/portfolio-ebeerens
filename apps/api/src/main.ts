/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { getOAuthProtectedResourceMetadataUrl, mcpAuthRouter } from '@modelcontextprotocol/sdk/server/auth/router.js';
import { requireBearerAuth } from '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js';
import cookieParser from 'cookie-parser';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dump } from 'js-yaml';
import { AppModule } from './app/app.module';
import { McpOAuthService } from './app/mcp/mcp-oauth.service';
import { createSwaggerConfig } from './app/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3000;
  const configuredMcpUrl =
    process.env.MCP_PUBLIC_URL ?? (process.env.NODE_ENV === 'production' ? undefined : `http://localhost:${port}`);
  if (!configuredMcpUrl) {
    throw new Error('MCP_PUBLIC_URL must be configured in production');
  }
  const mcpBaseUrl = new URL(configuredMcpUrl);
  if (mcpBaseUrl.pathname !== '/' || mcpBaseUrl.search || mcpBaseUrl.hash) {
    throw new Error('MCP_PUBLIC_URL must contain only the public origin, without a path, query, or fragment');
  }
  if (process.env.NODE_ENV === 'production' && mcpBaseUrl.protocol !== 'https:') {
    throw new Error('MCP_PUBLIC_URL must use HTTPS in production');
  }
  const mcpResourceUrl = new URL('/mcp', mcpBaseUrl);
  const mcpOAuth = app.get(McpOAuthService);

  app.use(
    mcpAuthRouter({
      provider: mcpOAuth,
      issuerUrl: mcpBaseUrl,
      resourceServerUrl: mcpResourceUrl,
      resourceName: 'ebeerens.com portfolio',
      scopesSupported: ['portfolio:read'],
    })
  );
  app.use(
    '/mcp',
    requireBearerAuth({
      verifier: mcpOAuth,
      requiredScopes: ['portfolio:read'],
      resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(mcpResourceUrl),
    })
  );

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix, {
    exclude: [{ path: 'mcp', method: RequestMethod.ALL }],
  });
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const swaggerDocument = SwaggerModule.createDocument(app, createSwaggerConfig());
  SwaggerModule.setup(`${globalPrefix}/docs`, app, swaggerDocument);

  // EXPORT_OPENAPI=true dumps openapi/api.yaml and exits instead of serving —
  // see the openapi-client-generation skill. Reuses the real webpack build so
  // the ESM-only generated Prisma client resolves correctly (ts-node can't load it).
  if (process.env.EXPORT_OPENAPI === 'true') {
    mkdirSync('openapi', { recursive: true });
    writeFileSync('openapi/api.yaml', dump(swaggerDocument));
    Logger.log('Wrote openapi/api.yaml');
    await app.close();
    return;
  }

  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
  Logger.log(`📚 Swagger docs available at: http://localhost:${port}/${globalPrefix}/docs`);
}

bootstrap();
