#!/usr/bin/env bash
set -euo pipefail

if [[ -f /opt/portfolio/.env ]]; then
  set -a
  source /opt/portfolio/.env
  set +a
fi

: "${R2_ACCOUNT_ID:?R2_ACCOUNT_ID is required}"
: "${R2_ACCESS_KEY_ID:?R2_ACCESS_KEY_ID is required}"
: "${R2_SECRET_ACCESS_KEY:?R2_SECRET_ACCESS_KEY is required}"
: "${R2_DOCUMENTS_BUCKET:?R2_DOCUMENTS_BUCKET is required}"
: "${R2_BACKUPS_BUCKET:?R2_BACKUPS_BUCKET is required}"
command -v aws >/dev/null
command -v jq >/dev/null
export AWS_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID}"
export AWS_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY}"
export AWS_DEFAULT_REGION=auto
export AWS_EC2_METADATA_DISABLED=true
endpoint="https://${R2_ACCOUNT_ID}${R2_JURISDICTION:+.${R2_JURISDICTION}}.r2.cloudflarestorage.com"

configure_bucket() {
  local bucket="$1" rules="$2" current merged
  if current="$(aws --no-cli-pager --endpoint-url "${endpoint}" s3api get-bucket-lifecycle-configuration --bucket "${bucket}" 2>&1)"; then
    :
  elif [[ "${current}" == *NoSuchLifecycleConfiguration* ]]; then
    current='{"Rules":[]}'
  else
    echo "Unable to read existing bucket lifecycle; no rules were changed." >&2
    return 1
  fi
  merged="$(jq --argjson managed "${rules}" '.Rules = ((.Rules // [] | map(select(.ID as $id | $managed | map(.ID) | index($id) | not))) + $managed)' <<< "${current}")"
  aws --no-cli-pager --endpoint-url "${endpoint}" s3api put-bucket-lifecycle-configuration --bucket "${bucket}" --lifecycle-configuration "${merged}"
  aws --no-cli-pager --endpoint-url "${endpoint}" s3api get-bucket-lifecycle-configuration --bucket "${bucket}"
}

configure_bucket "${R2_DOCUMENTS_BUCKET}" '[{"ID":"portfolio-cv-30-days","Status":"Enabled","Filter":{"Prefix":"cv/"},"Expiration":{"Days":30}}]'
configure_bucket "${R2_BACKUPS_BUCKET}" '[{"ID":"portfolio-backups-30-days","Status":"Enabled","Filter":{"Prefix":"backup-"},"Expiration":{"Days":30}},{"ID":"portfolio-erasures-31-days","Status":"Enabled","Filter":{"Prefix":"erasures/"},"Expiration":{"Days":31}}]'