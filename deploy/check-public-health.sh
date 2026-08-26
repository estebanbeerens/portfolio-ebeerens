#!/usr/bin/env bash
# Lightweight HTTP health check for the live site or admin host.
# Usage: ./deploy/check-public-health.sh https://example.com
set -euo pipefail

if [[ -f /opt/portfolio/.env ]]; then
  set -a
  # shellcheck disable=SC1091
  source /opt/portfolio/.env
  set +a
fi

url="${1:-${PUBLIC_URL:-https://localhost}}"

curl -fsS --max-time 15 "${url}" >/dev/null

echo "Health check passed: ${url}"
