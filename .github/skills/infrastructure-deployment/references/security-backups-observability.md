# Security, Backups & Observability

## Server Hardening (architecture plan §15)

- SSH: key-only authentication (`PasswordAuthentication no`), `PermitRootLogin no` in `/etc/ssh/sshd_config`, then `systemctl restart sshd`.
- Firewall: only 22 (SSH), 80, 443 open — both at Oracle's cloud-level security list _and_ the OS-level firewall (`ufw allow 22,80,443 && ufw enable`) as defense in depth.
- Keep OS packages, Docker, and application dependencies updated.
- Never expose the Postgres port (5432) to the public internet — it should only be reachable from other containers on the compose network.
- Restrict the GitHub OAuth callback URL to the real production domain.
- Validate uploaded images server-side (content-type/size) — see the `image-storage-r2` skill.
- Enforce auth/authorization server-side always — never rely on the UI hiding something as the actual control (see the `oauth-session-auth` skill).

## Backups (architecture plan §16)

```bash
#!/usr/bin/env bash
set -euo pipefail
DUMP_FILE="backup-$(date +%Y%m%d-%H%M%S).sql.gz"
docker exec portfolio-postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "/tmp/$DUMP_FILE"
aws s3 cp "/tmp/$DUMP_FILE" "s3://portfolio-backups/$DUMP_FILE" --endpoint-url "$R2_ENDPOINT"
rm "/tmp/$DUMP_FILE"
```

- Upload to a **separate** R2 bucket from the one used for project images.
- Schedule via a VPS cron job (e.g. daily, off-peak).
- Apply a retention policy (e.g. keep the last 7 daily + 4 weekly dumps) — via R2 lifecycle rules or logic in the script — so storage doesn't grow unbounded.
- **Test a restore periodically**: `gunzip -c backup.sql.gz | psql` against a throwaway local Postgres container. A backup that's never been restored isn't verified to work.
- The VPS disk is not a backup location — "it's on the server" doesn't count; the whole point is surviving loss of the server itself.

## Observability (architecture plan §17)

Keep this lightweight initially:

- Application logs, Nginx access/error logs, Postgres logs — know where each lives and that they're retained somewhere readable later (e.g. `docker compose logs`, or a mounted log volume).
- `HEALTHCHECK` on every container; confirm `docker compose ps` reflects real health, not just "running".
- A free external uptime monitor (simple HTTP/ping check) against the public URL.
- Defer error tracking, metrics, centralized logging, and tracing until there's a real problem to solve or a genuine learning goal — don't add them by default (architecture plan §19, "avoid premature abstraction").
