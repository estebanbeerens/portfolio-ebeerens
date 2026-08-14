/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dump } from 'js-yaml';
import { AppModule } from './app/app.module';
import { createSwaggerConfig } from './app/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const swaggerDocument = SwaggerModule.createDocument(
    app,
    createSwaggerConfig(),
  );
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

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
  Logger.log(
    `📚 Swagger docs available at: http://localhost:${port}/${globalPrefix}/docs`,
  );
}

bootstrap();
