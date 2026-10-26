#!/usr/bin/env bash
# The actual deploy steps, versioned in the repo and executed by deploy/pull-and-restart.sh once it
# has fast-forwarded /opt/portfolio to origin/main and while it still holds the deploy lock (fd 9).
# Because this script ships in the repo, changes to the deploy steps take effect on the next push —
# no manual re-copy to the VPS required (only the thin bootstrap needs installing there).
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/portfolio}"

cd "${APP_DIR}"

compose=(docker compose -f docker-compose.yml -f docker-compose.prod.yml)
compose_with_migrate_profile=(docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile migrate)

# Pin every service to the exact commit's images (CI pushes a <sha> tag alongside `latest`) so the
# deployed code and images can't drift, and a rollback is a re-run with an older checkout.
IMAGE_TAG="$(git rev-parse HEAD)"
export IMAGE_TAG
echo "Deploying image tag: ${IMAGE_TAG}"

echo "Validating Docker Compose configuration..."
"${compose[@]}" config >/dev/null

echo "Refreshing Cloudflare real-IP trust list..."
"${APP_DIR}/deploy/update-cloudflare-ips.sh"

# Remove images not used by running containers before pulling the next release. Keeping every
# commit-tagged image can otherwise exhaust the VPS disk before Docker has room for new layers.
echo "Pruning unused Docker images before pull..."
docker image prune --all --force

echo "Pulling Docker images..."
"${compose_with_migrate_profile[@]}" pull

# Run pending Prisma migrations before swapping the api container over.
echo "Running database migrations..."
"${compose[@]}" run --rm migrate

echo "Recreating Nginx to load the checked-out bind-mounted config..."
# Git replaces tracked files during checkout, but a single-file bind mount can remain attached to
# the previous inode. Compose does not hash bind-mounted file contents, so a normal `up` may leave
# Nginx using its old config even though /opt/portfolio/nginx/nginx.conf has changed.
"${compose[@]}" up -d --force-recreate nginx

echo "Restarting services..."
# `up -d` alone succeeds even when a container immediately crash-loops. Wait for services with a
# healthcheck (notably the API) to become healthy before declaring the deployment successful.
"${compose[@]}" up -d --remove-orphans --wait --wait-timeout 120

echo "Pruning unused Docker images..."
docker image prune -f

echo "Deployment complete. Current service status:"
"${compose[@]}" ps
