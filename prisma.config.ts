import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'apps/api/prisma/schema.prisma',
  migrations: { path: 'apps/api/prisma/migrations' },
  // `generate` (run via postinstall) never connects to a database, but prisma/config's `env()`
  // throws hard if the var is unresolved - isolated environments (Nx Cloud distributed agents,
  // a fresh clone with no .env) don't have DATABASE_URL set, so fall back to a dummy value instead.
  datasource: { url: process.env.DATABASE_URL ?? 'postgresql://build:build@localhost:5432/build' },
});
