# Stage 1: build
FROM node:22-alpine AS build
WORKDIR /app
COPY . .
RUN npm ci
RUN npx nx build api --configuration=production
RUN npx nx prune api

# Stage 2: runtime
FROM node:22-alpine AS runtime
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
# pruned output already includes package.json/package-lock.json/workspace_modules for api's deps only
COPY --from=build /app/dist/apps/api ./
RUN npm ci --omit=dev
USER app
ENV NODE_ENV=production
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "require('http').get('http://localhost:3000/api', r => process.exit(r.statusCode === 200 ? 0 : 1))"
CMD ["node", "main.js"]
