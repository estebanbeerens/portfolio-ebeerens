---
name: infrastructure-deployment
description: 'Containerize and deploy this project to the Oracle Cloud arm64 VPS — multi-stage Dockerfiles, docker-compose services, Nginx reverse proxy, Cloudflare edge config, GitHub Actions CI/CD with SSH push-deploy, server hardening, Postgres backups, and basic observability. Use when writing Dockerfiles, production docker-compose config, nginx.conf, GitHub Actions workflows, deploy scripts, backup jobs, or VPS setup.'
---

# Infrastructure & Deployment

## When to Use

- Writing/editing a Dockerfile, the production `docker-compose.yml`, or `nginx.conf`
- Setting up the GitHub Actions CI/CD pipeline or the SSH deploy mechanism
- Wiring test coverage reporting, code-quality checks, or security scanning into CI
- Provisioning/hardening the Oracle VPS
- Setting up Postgres backups or basic observability

## Stack (architecture plan §3, §11–§17)

Oracle Cloud Always Free **Ampere A1 (arm64)** VPS, Docker + Docker Compose, Nginx, Cloudflare (DNS/CDN/TLS/WAF), GitHub Actions → GHCR → SSH push-deploy. No Kubernetes, no load balancer, no microservices — one VPS is the deliberate target (§3 "Important constraint").

The repo already has a local-dev-only [docker-compose.yml](../../../docker-compose.yml) (just `postgres`, for Stage 2 of the build guide) — production compose extends this pattern with `nginx`/`web`/`admin`/`api` services, not a from-scratch file.

## Workflows

### Containerize & Ship

Multi-stage Dockerfiles per app, arm64 cross-builds, GHCR push, SSH push-deploy. See [docker-and-cicd.md](./references/docker-and-cicd.md).

### CI Quality Gates

Test coverage artifacts, lint/typecheck/format checks, dependency/secret/container security scanning, and accessibility checks — all free tooling, wired into the same pipeline. See [docker-and-cicd.md](./references/docker-and-cicd.md#ci-quality-gates-all-free).

### Reverse Proxy & Edge

Nginx routing map, security headers, Cloudflare DNS/TLS/rate-limiting split. See [nginx-cloudflare.md](./references/nginx-cloudflare.md).

### Server Hardening, Backups, Observability

SSH/firewall hardening, `pg_dump` → R2 backup cron, basic logging/uptime monitoring. See [security-backups-observability.md](./references/security-backups-observability.md).

## Reference Files

- [Docker builds & CI/CD](./references/docker-and-cicd.md)
- [Nginx & Cloudflare](./references/nginx-cloudflare.md)
- [Security, backups & observability](./references/security-backups-observability.md)

## Best Practices Checklist

- Every image is built for **arm64** — verify with `docker buildx build --platform linux/arm64`, don't assume a locally-built amd64 image will run on the VPS
- Non-root user in every runtime image; `HEALTHCHECK` on every service
- Runtime images install each app's **own** `package.json` deps, not the root lockfile — keep `apps/web/package.json` and `apps/admin/package.json` in sync when adding/removing runtime imports (enforced by `@nx/dependency-checks`; run `nx lint <app> --fix`)
- Postgres is never exposed to the public internet — only reachable from other containers on the compose network
- The `deploy` SSH key can only run one forced command — never a general-purpose shell
- Secrets live in GitHub Actions encrypted secrets / the VPS's `.env`, never committed
- A backup is not "real" until a restore has actually been tested
- No new service (queue, cache, second VPS, etc.) without a genuine requirement — check against architecture plan §19 first
- CI runs coverage (`nx affected -t test --coverage`), lint/typecheck/format, `pnpm audit`, and e2e (incl. a11y) on every push — before adding any paid coverage/security SaaS, confirm the free GitHub-native option (Actions artifacts/step summary, Dependabot, secret scanning, CodeQL) doesn't already cover it
- Docker images are scanned with Trivy before being pushed to GHCR

## Keeping the Plan in Sync

If an infrastructure decision made while implementing this differs from what [personal-portfolio-architecture-plan.md](../../../docs/personal-portfolio-architecture-plan.md) or [personal-portfolio-build-guide.md](../../../docs/personal-portfolio-build-guide.md) describe, use the `portfolio-architecture` skill to update those docs — don't let them silently drift from the real setup.
