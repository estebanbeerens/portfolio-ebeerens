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

## Runtime Dependencies: per-app `package.json` (not the root lockfile)

Each runtime image installs **only the deps that app actually uses**, never the whole monorepo tree. The mechanism differs by bundler:

- **api** (`@nx/webpack`): `generatePackageJson: true` emits a complete `dist/apps/api/package.json` from the import graph. The hand-written [apps/api/package.json](../../../apps/api/package.json) only _supplements_ it — e.g. `@prisma/client`, whose generated client import is gitignored so Nx can't detect it. The runtime stage copies `dist/apps/api` and runs `npm install --omit=dev`.
- **web / admin** (`@angular/build:application`): the Angular builder does **not** generate a per-app `package.json`, so [apps/web/package.json](../../../apps/web/package.json) and [apps/admin/package.json](../../../apps/admin/package.json) are **hand-maintained**, and the runtime stage copies just that file and runs `npm install --omit=dev` against it. The Angular SSR bundle inlines almost everything (only `iconv-lite`, pulled in transitively by `express`, is externalized), but the manifest still lists the app's full source-dependency set so the image stays correct if the bundler externalizes more later.

**When you add or remove a runtime import in `web`/`admin`, update that app's `package.json`.** This is enforced by the `@nx/dependency-checks` ESLint rule — added to each app's `eslint.config.mjs`, scoped to `**/package.json`:

- `nx lint web` / `nx lint admin` fail on a missing or obsolete dependency.
- `nx lint web --fix` auto-syncs the manifest from the import graph (versions come from the root `package.json`).
- Bundled workspace libs (e.g. `@portfolio-ebeerens/api-client`) go under the rule's `ignoredDependencies` because they're inlined, not installed from a registry — **never** add them to the manifest or the runtime `npm install` will 404.

Runtime install uses `npm install` (not `npm ci`): these sub-manifests have no lockfile — the same trade-off api already makes.

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
   ```

git fetch --prune origin main
git reset --hard origin/main
docker compose -f docker-compose.yml -f docker-compose.prod.yml config >/dev/null
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile migrate pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm migrate
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --remove-orphans

```
4. In the deploy job, use the private key from a GitHub Actions encrypted secret (never commit it) to run only that forced command — e.g. via `appleboy/ssh-action` or a plain `ssh deploy@<host>` step (no explicit command needed; the server ignores whatever is sent and runs the forced one).
5. Only trigger the deploy job on `main`, after lint/test/build/image-push have all succeeded.

## Pipeline Shape

```

lint/typecheck/format → unit tests + coverage → security audit → e2e (incl. a11y) → build → buildx (arm64) → image scan (Trivy) → push GHCR → ssh deploy (main only)

````

Use `nx affected` for every quality-gate step (`nx affected -t lint,typecheck,test,e2e`) so CI only re-checks what actually changed, not the whole workspace on every push.

Use the `monitor-ci` skill once this pipeline exists to watch it run.

## CI Quality Gates (all free)

All of the following are free — either bundled with tools already in the workspace, a free GitHub-native feature, or a free open-source CLI/Action. Don't reach for a paid SaaS (Codecov, Coveralls, Snyk, etc.) before confirming the free option doesn't already cover the need.

**Test coverage**

```yaml
- name: Test with coverage
  run: npx nx affected -t test --coverage

- name: Publish coverage summary
  run: |
    echo "## Coverage" >> "$GITHUB_STEP_SUMMARY"
    # parse coverage/**/coverage-summary.json and append a table

- uses: actions/upload-artifact@v4
  with:
    name: coverage-report
    path: coverage/
````

Vitest (`admin`, `web`) and Jest (`api`, `api-e2e`) both support `--coverage` natively — no extra dependency needed. `actions/upload-artifact` + `$GITHUB_STEP_SUMMARY` are both free, built into GitHub Actions.

**Code quality**

- `npx nx affected -t lint,typecheck` — ESLint + `tsc --noEmit`.
- `npx prettier --check .` — fails the build on unformatted code.
- `@nx/enforce-module-boundaries` (already configured in the workspace's ESLint config) keeps `apps`/`libs` import boundaries honest without extra setup.

**Security**

- `pnpm audit` (or `npm audit`) — free, built into the package manager.
- `.github/dependabot.yml` for automated dependency-update PRs — free, native to GitHub.
- GitHub secret scanning + push protection — free, enable in repo Settings → Code security.
- GitHub CodeQL (`github/codeql-action`) — free for public repos; verify current plan entitlements before adding it to a private repo.
- Trivy (`aquasecurity/trivy-action`, free) — scan the built arm64 image for known CVEs before pushing to GHCR:
  ```yaml
  - uses: aquasecurity/trivy-action@master
    with:
      image-ref: ghcr.io/${{ github.repository }}/api:${{ github.sha }}
      exit-code: '1'
      severity: 'CRITICAL,HIGH'
  ```

**Accessibility**

- Already implemented via `vitest-axe` (unit tests) and `@axe-core/playwright` (e2e) — see the `web-accessibility` skill. This pipeline just needs to actually run `nx affected -t test,e2e` on every push so those checks execute in CI, not only locally.
