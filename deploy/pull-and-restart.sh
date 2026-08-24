#!/usr/bin/env bash
# Installed at /opt/deploy/pull-and-restart.sh on the VPS. Invoked only via the `deploy` user's
# forced-command SSH key (see .github/workflows/checks.yml + Stage 12 of the build guide) — this is
# the *only* command that key is allowed to run.
set -euo pipefail

cd /opt/portfolio

# Compose files, nginx.conf and this script's inputs are versioned, so refresh them before pulling
# images. --ff-only rather than a hard reset: local drift should abort the deploy, not be wiped.
git fetch --prune origin
git merge --ff-only origin/main

docker compose -f docker-compose.yml -f docker-compose.prod.yml pull

# Run pending Prisma migrations before swapping the api container over.
docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm migrate

docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --remove-orphans

docker image prune -f
