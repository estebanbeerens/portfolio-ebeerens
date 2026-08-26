# Backup, restore, and uptime validation runbook

This runbook covers the remaining production checks for Stage 13 and Stage 14.

## 1. Restore test: verify a real backup works

Use a real backup object from the private R2 bucket, then restore it into a throwaway local Postgres database.

### Prerequisite: Postgres client on the VPS

`deploy/restore-backup.sh` pipes the dump into `psql`, which is not installed by default (the backup
script only needs `pg_dump` from inside the Postgres container). Install it once:

```bash
sudo apt-get update
sudo apt-get install -y postgresql-client
psql --version
```

The `Restore backup` GitHub Actions workflow runs `/opt/portfolio/deploy/restore-backup.sh` from the
Git checkout, so script changes ship with a normal deploy — no manual re-copy to `/opt/deploy`.

### Local restore test

```bash
# 1) Create a disposable local Postgres instance
 docker run --rm -d \
   --name portfolio-restore-test \
   -e POSTGRES_USER=testuser \
   -e POSTGRES_PASSWORD=testpass \
   -e POSTGRES_DB=portfolio_restore \
   -p 5434:5432 \
   postgres:16-alpine

# 2) Download one backup from the R2 bucket (example using AWS CLI)
export AWS_ACCESS_KEY_ID="<backup-r2-access-key>"
export AWS_SECRET_ACCESS_KEY="<backup-r2-secret>"
export AWS_DEFAULT_REGION="auto"
BACKUP_KEY="backup-20260826T020000Z.sql.gz"
mkdir -p /tmp/portfolio-backups
aws --endpoint-url "https://<account-id>.r2.cloudflarestorage.com" \
  s3 cp "s3://portfolio-backups/${BACKUP_KEY}" "/tmp/portfolio-backups/${BACKUP_KEY}"

# 3) Restore it into the throwaway DB
export DATABASE_URL="postgresql://testuser:testpass@localhost:5434/portfolio_restore"
gunzip -c "/tmp/portfolio-backups/${BACKUP_KEY}" | psql "${DATABASE_URL}"

# 4) Verify a table exists and some data is present
psql "${DATABASE_URL}" -c '\dt'
psql "${DATABASE_URL}" -c 'SELECT COUNT(*) FROM profiles;'

# 5) Tear down the throwaway instance when done
 docker rm -f portfolio-restore-test
```

### What counts as a valid restore test

- the dump loads without SQL errors
- the expected tables exist
- core rows are present (for example, `profiles` or `projects`)
- the restored DB is functional enough to query it

A backup that has never been restored is not considered proven.

---

## 2. Live site uptime check

Use an external HTTP check against the public site, or a simple local curl against the same domain.

### Quick manual check

```bash
curl -I https://ebeerens.com
curl -I https://www.ebeerens.com
curl -I https://admin.ebeerens.com
```

Expected result:

- HTTP 200 or 3xx responses
- no connection errors
- no TLS or certificate issues

### External monitor option

Use any free uptime service (for example, an external HTTP checker) to hit:

- `https://ebeerens.com`
- `https://admin.ebeerens.com`

This should trigger an alert if the site is down.

---

## 3. Docker health status

Check the real health state of the production stack on the VPS.

```bash
cd /opt/portfolio
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

Look for each service reporting as `healthy` rather than only `running`.

For deeper checks:

```bash
docker inspect --format '{{json .State.Health}}' portfolio-api
docker inspect --format '{{json .State.Health}}' portfolio-web
docker inspect --format '{{json .State.Health}}' portfolio-admin
docker inspect --format '{{json .State.Health}}' portfolio-postgres
```

You can also view container logs if one service is unhealthy:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail=100 api
 docker compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail=100 web
 docker compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail=100 nginx
```

---

## 4. Combined validation checklist

Run these after deploying the latest image and before treating the stack as healthy:

```bash
cd /opt/portfolio
docker compose -f docker-compose.yml -f docker-compose.prod.yml config >/dev/null
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
curl -fsS https://ebeerens.com >/dev/null
curl -fsS https://admin.ebeerens.com >/dev/null
```

If all of the above succeed, the site is serving and the stack is operational.

---

## 5. Recommended cron and script usage

On the VPS, run the backup job manually as a smoke test:

```bash
/opt/deploy/backup-db.sh
```

Then install the nightly cron entry:

```bash
sudo install -o root -g root -m 0644 /opt/portfolio/deploy/backup-db.cron /etc/cron.d/portfolio-backup
sudo systemctl reload cron
```

This runs the database dump every night at 02:00.
