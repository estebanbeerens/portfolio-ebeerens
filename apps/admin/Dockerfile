# Stage 1: build
FROM node:22-alpine AS build
WORKDIR /app
COPY . .
RUN npm ci
RUN npx nx build admin --configuration=production

# Stage 2: runtime
FROM node:22-alpine AS runtime
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist/apps/admin ./dist/apps/admin
USER app
ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "require('http').get('http://localhost:4000/', r => process.exit(r.statusCode === 200 ? 0 : 1))"
CMD ["node", "dist/apps/admin/server/server.mjs"]
