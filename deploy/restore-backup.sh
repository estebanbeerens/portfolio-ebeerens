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
: "${R2_ACCOUNT_ID:?R2_ACCOUNT_ID is required for erasure reconciliation}"
: "${R2_ACCESS_KEY_ID:?R2_ACCESS_KEY_ID is required}"
: "${R2_SECRET_ACCESS_KEY:?R2_SECRET_ACCESS_KEY is required}"
: "${R2_BACKUPS_BUCKET:?R2_BACKUPS_BUCKET is required}"

if [[ "${RESTORE_OFFLINE_CONFIRMED:-}" != true ]]; then
  echo "Stop application traffic first, then set RESTORE_OFFLINE_CONFIRMED=true." >&2
  exit 1
fi
if [[ ! -f prisma.config.ts ]]; then
  echo "Run this script from the repository root so current migrations can be applied." >&2
  exit 1
fi
command -v aws >/dev/null
command -v jq >/dev/null
if [[ -n "${RESTORE_MIGRATION_IMAGE:-}" ]]; then
  command -v docker >/dev/null
else
  command -v npx >/dev/null
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required. Install it on the VPS: sudo apt-get install -y postgresql-client" >&2
  exit 1
fi

backup_name="$(basename "${backup_path}")"
if [[ ! "${backup_name}" =~ ^backup-([0-9]{8})T([0-9]{6})Z\.sql\.gz$ ]]; then
  echo "Use the original timestamped backup filename." >&2
  exit 1
fi
backup_date="${BASH_REMATCH[1]}${BASH_REMATCH[2]}"
if ! backup_seconds="$(date -u -d "${backup_date:0:4}-${backup_date:4:2}-${backup_date:6:2}T${backup_date:8:2}:${backup_date:10:2}:${backup_date:12:2}Z" +%s 2>/dev/null)"; then
  backup_seconds="$(date -j -u -f '%Y%m%d%H%M%S' "${backup_date}" +%s)"
fi
age_seconds=$(( $(date -u +%s) - backup_seconds ))
if (( age_seconds < 0 || age_seconds > 30 * 24 * 60 * 60 )); then
  echo "Refusing a backup outside the thirty-day erasure reconciliation window." >&2
  exit 1
fi

export AWS_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID}"
export AWS_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY}"
export AWS_DEFAULT_REGION=auto
export AWS_EC2_METADATA_DISABLED=true
endpoint="https://${R2_ACCOUNT_ID}${R2_JURISDICTION:+.${R2_JURISDICTION}}.r2.cloudflarestorage.com"
keys="$(aws --no-cli-pager --endpoint-url "${endpoint}" s3api list-objects-v2 --bucket "${R2_BACKUPS_BUCKET}" --prefix erasures/ --output json)"
erasures='[]'
while IFS= read -r key; do
  marker="$(aws --no-cli-pager --endpoint-url "${endpoint}" s3 cp "s3://${R2_BACKUPS_BUCKET}/${key}" - --only-show-errors)"
  jq -e '(.table == "CvRequest" or .table == "ContactMessage") and (.id | type == "string") and (.id | test("^[A-Za-z0-9_-]+$"))' <<< "${marker}" >/dev/null
  erasures="$(jq --argjson marker "${marker}" '. + [$marker]' <<< "${erasures}")"
done < <(jq -r '.Contents[]?.Key' <<< "${keys}")

echo "Restoring the backup while application traffic is offline..."
gunzip -c "${backup_path}" | psql --set=ON_ERROR_STOP=on "${DATABASE_URL}"
if [[ -n "${RESTORE_MIGRATION_IMAGE:-}" ]]; then
  docker run --rm --network host -e "DATABASE_URL=${DATABASE_URL}" "${RESTORE_MIGRATION_IMAGE}"
else
  npx --no-install prisma migrate deploy
fi
psql --set=ON_ERROR_STOP=on "${DATABASE_URL}" <<'SQL'
BEGIN;
DELETE FROM "CvRequest" WHERE "createdAt" <= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') - INTERVAL '6 months';
DELETE FROM "ContactMessage" WHERE "createdAt" <= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') - INTERVAL '12 months';
DELETE FROM "ResumeDownload" WHERE "createdAt" <= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') - INTERVAL '12 months';
COMMIT;
SQL
while IFS=$'\t' read -r table record_id; do
  psql --set=ON_ERROR_STOP=on --set="erase_id=${record_id}" "${DATABASE_URL}" <<SQL
DELETE FROM "${table}" WHERE "id" = :'erase_id';
SQL
done < <(jq -r '.[] | [.table, .id] | @tsv' <<< "${erasures}")
echo "Restore, retention purge and erasure reconciliation complete. Verify before enabling traffic."
