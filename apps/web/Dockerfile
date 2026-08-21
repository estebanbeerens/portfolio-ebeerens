# Stage 1: build
FROM node:22-alpine AS build
WORKDIR /app
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
# Absolute API origin reachable at build time, used only for prerendering (see app.routes.server.ts).
# Pass --build-arg API_URL=http://<host-or-service>:3000 with --network so this can actually resolve.
ARG API_URL=http://localhost:3000
ENV API_URL=$API_URL
COPY . .
RUN npm ci
RUN npx nx build web --configuration=production

# Stage 2: runtime
FROM node:22-alpine AS runtime
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=build /app/dist/apps/web ./dist/apps/web
USER app
ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "require('http').get('http://localhost:4000/', r => process.exit(r.statusCode === 200 ? 0 : 1))"
CMD ["node", "dist/apps/web/server/server.mjs"]
