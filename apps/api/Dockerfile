# Stage 1: build
FROM node:22-alpine AS build
WORKDIR /app
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
COPY . .
RUN npm ci
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
RUN npm install --omit=dev --ignore-scripts
USER app
ENV NODE_ENV=production
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "require('http').get('http://localhost:3000/api', r => process.exit(r.statusCode === 200 ? 0 : 1))"
CMD ["node", "main.js"]
