#!/usr/bin/env bash
# Creates a compressed Postgres dump and uploads it to a separate Cloudflare R2 bucket.
# Intended for the production VPS once the app is deployed behind Nginx.
set -euo pipefail

# Cron and non-login shells do not automatically load the app's .env file, so source it when it
# exists. This makes the script work both when invoked manually by the deploy user and by cron.
if [[ -f /opt/portfolio/.env ]]; then
  set -a
  # shellcheck disable=SC1091
  source /opt/portfolio/.env
  set +a
fi

: "${POSTGRES_DB:?POSTGRES_DB is required}"
: "${POSTGRES_USER:?POSTGRES_USER is required}"
: "${R2_ACCOUNT_ID:?R2_ACCOUNT_ID is required}"
: "${R2_ACCESS_KEY_ID:?R2_ACCESS_KEY_ID is required}"
: "${R2_SECRET_ACCESS_KEY:?R2_SECRET_ACCESS_KEY is required}"
: "${R2_BACKUPS_BUCKET:?R2_BACKUPS_BUCKET is required}"

if ! command -v aws >/dev/null 2>&1; then
  echo "aws CLI is required to upload backups to R2. Install it on the VPS before running this script." >&2
  exit 1
fi

container_name="${POSTGRES_CONTAINER_NAME:-portfolio-postgres}"
backup_file="backup-$(date -u +%Y%m%dT%H%M%SZ).sql.gz"
tmp_path="/tmp/${backup_file}"

if [[ -n "${R2_JURISDICTION:-}" ]]; then
  r2_endpoint="https://${R2_ACCOUNT_ID}.${R2_JURISDICTION}.r2.cloudflarestorage.com"
else
  r2_endpoint="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
fi

export AWS_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID}"
export AWS_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY}"
export AWS_DEFAULT_REGION="auto"
export AWS_EC2_METADATA_DISABLED=true

echo "Dumping ${POSTGRES_DB} from ${container_name} to ${tmp_path}..."
docker exec "${container_name}" pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" | gzip > "${tmp_path}"

echo "Uploading ${tmp_path} to s3://${R2_BACKUPS_BUCKET}/${backup_file}..."
aws --endpoint-url "${r2_endpoint}" s3 cp "${tmp_path}" "s3://${R2_BACKUPS_BUCKET}/${backup_file}" --only-show-errors

rm -f "${tmp_path}"
echo "Backup complete: s3://${R2_BACKUPS_BUCKET}/${backup_file}"
