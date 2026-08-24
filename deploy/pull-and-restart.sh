#!/usr/bin/env bash
# Installed at /opt/deploy/pull-and-restart.sh on the VPS and pinned as the deploy key's forced
# command (see docs/deploy-manual-steps.md) — this is the *only* command that key is allowed to run.
#
# Kept intentionally tiny and stable: it just takes the deploy lock, fast-forwards the checkout, and
# hands off to the repo-versioned deploy steps (deploy/run-deploy.sh). Keeping the real logic in the
# repo means deploy changes ship with a normal push instead of a manual re-copy to the VPS; this
# bootstrap should almost never need to change.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/portfolio}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
LOCK_FILE="${LOCK_FILE:-/tmp/portfolio-deploy.lock}"

# fd 9 has no close-on-exec flag, so the lock is still held after we exec run-deploy.sh below.
exec 9>"${LOCK_FILE}"
flock -n 9 || {
	echo "Another portfolio deploy is already running; exiting."
	exit 1
}

cd "${APP_DIR}"

echo "Checking Git repository..."
git rev-parse --is-inside-work-tree >/dev/null

echo "Updating ${APP_DIR} from origin/${DEPLOY_BRANCH}..."
git fetch --prune origin "${DEPLOY_BRANCH}"
git reset --hard "origin/${DEPLOY_BRANCH}"

exec "${APP_DIR}/deploy/run-deploy.sh"
