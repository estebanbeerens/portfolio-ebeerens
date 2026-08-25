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
RUN npx nx build admin --configuration=production

# Stage 2: runtime
FROM node:22-alpine AS runtime
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
# Install only the admin app's own runtime deps (apps/admin/package.json, kept complete by
# @nx/dependency-checks) instead of the entire monorepo dependency tree. No lockfile for this
# sub-manifest, so `npm install` rather than `npm ci` — matches the api runtime stage.
COPY --from=build /app/apps/admin/package.json ./package.json
RUN npm install --omit=dev --ignore-scripts --no-audit --no-fund
COPY --from=build /app/dist/apps/admin ./dist/apps/admin
USER app
ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "require('http').get('http://localhost:4000/', r => process.exit(r.statusCode === 200 ? 0 : 1))"
CMD ["node", "dist/apps/admin/server/server.mjs"]
