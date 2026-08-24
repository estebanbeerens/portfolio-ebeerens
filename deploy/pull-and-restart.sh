#!/usr/bin/env bash
# Installed at /opt/deploy/pull-and-restart.sh on the VPS. Invoked only via the `deploy` user's
# forced-command SSH key (see .github/workflows/checks.yml + Stage 12 of the build guide) — this is
# the *only* command that key is allowed to run.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/portfolio}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
LOCK_FILE="${LOCK_FILE:-/tmp/portfolio-deploy.lock}"

exec 9>"${LOCK_FILE}"
flock -n 9 || {
	echo "Another portfolio deploy is already running; exiting."
	exit 1
}

cd "${APP_DIR}"

compose=(docker compose -f docker-compose.yml -f docker-compose.prod.yml)
compose_with_migrate_profile=(docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile migrate)

echo "Checking Git repository..."
git rev-parse --is-inside-work-tree >/dev/null

echo "Updating ${APP_DIR} from origin/${DEPLOY_BRANCH}..."
git fetch --prune origin "${DEPLOY_BRANCH}"
git reset --hard "origin/${DEPLOY_BRANCH}"

echo "Validating Docker Compose configuration..."
"${compose[@]}" config >/dev/null

echo "Refreshing Cloudflare real-IP trust list..."
"${APP_DIR}/deploy/update-cloudflare-ips.sh"

echo "Pulling Docker images..."
"${compose_with_migrate_profile[@]}" pull

# Run pending Prisma migrations before swapping the api container over.
echo "Running database migrations..."
"${compose[@]}" run --rm migrate

echo "Restarting services..."
"${compose[@]}" up -d --remove-orphans

echo "Pruning unused Docker images..."
docker image prune -f

echo "Deployment complete. Current service status:"
"${compose[@]}" ps
