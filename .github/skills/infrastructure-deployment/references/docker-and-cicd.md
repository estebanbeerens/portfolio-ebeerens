# Docker Builds & CI/CD

## Multi-Stage Dockerfile Pattern (per app)
```dockerfile
# Stage 1: build
FROM node:22-alpine AS build
WORKDIR /app
COPY . .
RUN npm ci
RUN npx nx build api --configuration=production

# Stage 2: runtime
FROM node:22-alpine AS runtime
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/dist/apps/api ./
COPY --from=build /app/dist/apps/api/package.json ./
RUN npm ci --omit=dev
USER app
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "require('http').get('http://localhost:3000/api', r => process.exit(r.statusCode === 200 ? 0 : 1))"
ENV NODE_ENV=production
CMD ["node", "main.js"]
```
- Build stage has the full toolchain; runtime stage only has what's needed to run the already-built output — keeps the final image small and reduces attack surface.
- `USER app` — never run the production process as root.
- Read all config (`DATABASE_URL`, `GITHUB_CLIENT_SECRET`, etc.) via environment variables passed at `docker run`/compose time — nothing baked into the image.

## arm64 Cross-Build
The Oracle VPS is **Ampere A1 (arm64)**; GitHub's hosted runners are amd64. Build with `buildx` + QEMU emulation:
```
docker buildx build --platform linux/arm64 -t ghcr.io/<owner>/api:<sha> -f apps/api/Dockerfile --push .
```
In GitHub Actions:
```yaml
- uses: docker/setup-qemu-action@v3
- uses: docker/setup-buildx-action@v3
- uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}
- uses: docker/build-push-action@v6
  with:
    context: .
    file: apps/api/Dockerfile
    platforms: linux/arm64
    push: true
    tags: ghcr.io/${{ github.repository }}/api:${{ github.sha }}
```
Cross-emulated builds are slower than native — expect this, don't treat slow CI as a bug.

## SSH Push-Deploy (not a self-hosted runner)
A self-hosted GitHub Actions runner on an internet-facing VPS is an RCE-adjacent risk — it must fetch and execute arbitrary workflow code with the runner's own privileges. Push from GitHub Actions to the VPS instead:

1. Create a dedicated `deploy` user on the VPS with no interactive shell.
2. Add its public key to `~deploy/.ssh/authorized_keys` with a forced command:
   ```
   command="/opt/deploy/pull-and-restart.sh",no-port-forwarding,no-agent-forwarding,no-pty ssh-ed25519 AAAA...
   ```
   No matter what the connecting side requests, only that script ever runs.
3. `/opt/deploy/pull-and-restart.sh`:
   ```bash
   #!/usr/bin/env bash
   set -euo pipefail
   cd /opt/portfolio
   docker compose pull
   docker compose up -d
   ```
4. In the deploy job, use the private key from a GitHub Actions encrypted secret (never commit it) to run only that forced command — e.g. via `appleboy/ssh-action` or a plain `ssh deploy@<host>` step (no explicit command needed; the server ignores whatever is sent and runs the forced one).
5. Only trigger the deploy job on `main`, after lint/test/build/image-push have all succeeded.

## Pipeline Shape
```
lint → unit tests → build → buildx (arm64) → push GHCR → ssh deploy (main only)
```
Use the `monitor-ci` skill once this pipeline exists to watch it run.
