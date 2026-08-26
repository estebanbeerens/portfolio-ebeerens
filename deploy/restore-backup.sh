#!/usr/bin/env bash
# Restores a compressed Postgres dump into the target database pointed to by DATABASE_URL.
set -euo pipefail

caller_database_url="${DATABASE_URL:-}"

if [[ -f /opt/portfolio/.env ]]; then
  set -a
  # shellcheck disable=SC1091
  source /opt/portfolio/.env
  set +a
fi

# An explicitly provided DATABASE_URL must win, otherwise a restore drill would target production.
if [[ -n "${caller_database_url}" ]]; then
  DATABASE_URL="${caller_database_url}"
  export DATABASE_URL
fi

backup_path="${1:-}"
if [[ -z "${backup_path}" ]]; then
  echo "Usage: $0 <backup.sql.gz>" >&2
  exit 1
fi

if [[ ! -f "${backup_path}" ]]; then
  echo "Backup file not found: ${backup_path}" >&2
  exit 1
fi

: "${DATABASE_URL:?DATABASE_URL is required (for example: postgres://user:password@localhost:5432/db)}"

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required. Install it on the VPS: sudo apt-get install -y postgresql-client" >&2
  exit 1
fi

echo "Restoring ${backup_path} into the target database..."
gunzip -c "${backup_path}" | psql "${DATABASE_URL}"
echo "Restore complete."
