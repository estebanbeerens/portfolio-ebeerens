# Stage 1: build
FROM node:22-alpine AS build
WORKDIR /app
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
# Dependencies first so the (slow) install layer is only invalidated by lockfile changes.
# The prisma files are needed because `postinstall` runs `prisma generate`.
COPY package.json package-lock.json prisma.config.ts ./
COPY apps/api/prisma ./apps/api/prisma
RUN npm ci --no-audit --no-fund
COPY . .
RUN npx nx build api --configuration=production

# Migrate stage: reuses the build stage (full repo + devDependencies) since dist/apps/api
# only contains src/assets, not apps/api/prisma/{schema.prisma,migrations} or prisma.config.ts.
FROM build AS migrate
CMD ["npx", "prisma", "migrate", "deploy"]

# Stage 2: runtime
FROM node:22-alpine AS runtime
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
# The generated output includes the API's production package metadata.
COPY --from=build /app/dist/apps/api ./
RUN npm install --omit=dev --ignore-scripts --no-audit --no-fund
# Nx's generatePackageJson only detects direct static imports, missing the requires inside the
# generated Prisma client (apps/api/src/generated/prisma) for '@prisma/client/runtime/*' — so
# @prisma/client never lands in dist's package.json / gets installed above. Copy it (and its own
# runtime dependency) straight from the build stage instead of relying on that.
COPY --from=build /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=build /app/node_modules/@prisma/client-runtime-utils ./node_modules/@prisma/client-runtime-utils
USER app
ENV NODE_ENV=production
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "require('http').get('http://localhost:3000/api', r => process.exit(r.statusCode === 200 ? 0 : 1))"
CMD ["node", "main.js"]
