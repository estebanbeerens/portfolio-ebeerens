# Manual steps — CI/CD deploy setup

Everything Copilot could do in-repo (compose files, Dockerfile migrate stage, Nginx config, the
GitHub Actions workflows, the deploy script) is already committed. These are the remaining steps
_only you_ can do — they touch the VPS, GitHub repo settings, and GHCR, none of which are
reachable from this workspace.

The pipeline is split into two workflows: `.github/workflows/checks.yml` (lint/typecheck/
test/build, runs on every PR and on pushes to `main`) and `.github/workflows/deploy.yml` (build/
scan/push images + SSH deploy). Deploy triggers via `workflow_run` once checks succeeds on
`main` — so a merge to `main` shows up as two separate workflow runs in the Actions tab, the second
starting only after the first goes green.

Replace `<public-ip>` and `deploy@<public-ip>` below with your real VPS address throughout.

---

## 1. Put the repo + deploy files on the VPS

```bash
ssh deploy@<public-ip>
sudo mkdir -p /opt/portfolio
sudo chown deploy:deploy /opt/portfolio
exit
```

From your own machine, clone straight onto the VPS (simplest — avoids copying your local working
tree, including anything gitignored):

```bash
ssh deploy@<public-ip> "git clone https://github.com/<you>/portfolio-ebeerens.git /opt/portfolio"
```

Or, if the VPS doesn't have outbound access to GitHub / you'd rather push from local:

```bash
scp -r docker-compose.yml docker-compose.prod.yml nginx deploy@<public-ip>:/opt/portfolio/
```

## 2. Create the production `.env` on the VPS

Copy the template up and edit it in place — **never commit this file**:

```bash
scp .env.example deploy@<public-ip>:/opt/portfolio/.env
ssh deploy@<public-ip>
nano /opt/portfolio/.env   # fill in real secrets: DB password, GitHub OAuth, Turnstile, R2 creds
exit
```

Fields that must change from the example's placeholders: `POSTGRES_PASSWORD`, `GITHUB_CLIENT_ID`,
`GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL` (your real domain/IP), `ADMIN_GITHUB_ID`,
`ADMIN_APP_URL`, `TURNSTILE_SECRET_KEY`, and all `R2_*` values.

For this routing setup, use values like:

- `ADMIN_APP_URL=https://admin.ebeerens.com`
- `GITHUB_CALLBACK_URL=https://admin.ebeerens.com/api/auth/github/callback`

## 3. Install the forced-command deploy script on the VPS

```bash
scp deploy/pull-and-restart.sh deploy@<public-ip>:~/pull-and-restart.sh
ssh deploy@<public-ip>
sudo mkdir -p /opt/deploy
sudo mv ~/pull-and-restart.sh /opt/deploy/pull-and-restart.sh
sudo chown deploy:deploy /opt/deploy/pull-and-restart.sh
chmod +x /opt/deploy/pull-and-restart.sh
exit
```

(If `/opt/deploy` doesn't exist yet or isn't owned by `deploy`, adjust the `mkdir`/`chown` above —
run those two lines as a sudo-capable user first if `deploy` itself doesn't have sudo.)

## 4. Generate a dedicated SSH key pair for CI to use

Do this on your own machine, **not** the VPS — the private half goes into a GitHub secret, never
onto the server itself:

```bash
ssh-keygen -t ed25519 -f ./portfolio-deploy-key -C "github-actions-deploy" -N ""
```

This produces `portfolio-deploy-key` (private) and `portfolio-deploy-key.pub` (public).

## 5. Lock that key to the forced command in `authorized_keys`

Copy the public key's contents up, then edit the `deploy` user's `authorized_keys` on the VPS so
this key can **only** ever run the pull-and-restart script — nothing else, even if the key leaks:

```bash
ssh deploy@<public-ip>
mkdir -p ~/.ssh && chmod 700 ~/.ssh
```

On the VPS, append a line to `~/.ssh/authorized_keys` in this exact form (paste your own public
key's content after `ssh-ed25519`):

```bash
echo 'command="/opt/deploy/pull-and-restart.sh",no-port-forwarding,no-agent-forwarding,no-pty ssh-ed25519 AAAA...your-public-key-content... github-actions-deploy' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
exit
```

Important: the deploy key must appear only once in `~/.ssh/authorized_keys`, and that one entry
must include the `command="/opt/deploy/pull-and-restart.sh"` prefix. If the same key also appears
as a plain `ssh-ed25519 ...` line, SSH can match that unrestricted line and your validation command
will print normally.

Keep a separate personal administrator key in `authorized_keys` for interactive maintenance. The
CI deploy key is intentionally not an interactive login key: connecting with it runs the deploy
script instead of opening a shell. Do not use the CI key to repair the server or edit this file.

Verify the restriction works before wiring up CI — this should print nothing but exit 0, since the
forced command runs instead of whatever you asked for:

```bash
ssh -i ./portfolio-deploy-key deploy@<public-ip> "echo this should never print"
```

Warning: because this key is locked directly to the real deploy script, this SSH command is not a
harmless authorization-only check — it starts an actual deployment. The deploy script may print
Docker output. The check passes when the requested `echo` text is not printed; it is not expected
to open a shell. Run it only after the GHCR login in Step 7 is configured, or use the personal
administrator key to inspect the server without triggering a deployment.

### If deploy SSH access is lost

If the personal administrator key is missing and the CI key is the only remaining key, use an
existing sudo-capable account or the VPS provider's serial/console access. As a sudo-capable user
on the VPS, append your personal public key and repair ownership and permissions:

```bash
sudo install -d -o deploy -g deploy -m 700 /home/deploy/.ssh
echo 'ssh-ed25519 YOUR_PERSONAL_PUBLIC_KEY your-admin-key' | sudo tee -a /home/deploy/.ssh/authorized_keys
sudo chown deploy:deploy /home/deploy/.ssh/authorized_keys
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

Then test the personal key interactively:

```bash
ssh -i ~/.ssh/YOUR_PERSONAL_PRIVATE_KEY deploy@<public-ip>
```

Do not remove the forced-command entry for the GitHub Actions key. If no sudo-capable SSH account
works, use the provider console to perform these same commands; a local SSH command cannot repair
an account when every usable authorized key has been removed or restricted.

## 6. Add GitHub Actions secrets

Repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret name      | Value                                                              |
| ---------------- | ------------------------------------------------------------------ |
| `DEPLOY_HOST`    | the VPS's IP or hostname                                           |
| `DEPLOY_USER`    | `deploy`                                                           |
| `DEPLOY_SSH_KEY` | full contents of the **private** key file (`portfolio-deploy-key`) |

```bash
cat ./portfolio-deploy-key   # copy this whole output (including BEGIN/END lines) into DEPLOY_SSH_KEY
```

Once added, delete the local key files (they're now only needed on the VPS/GitHub side):

```bash
rm ./portfolio-deploy-key ./portfolio-deploy-key.pub
```

## 7. Make sure the VPS can pull images from GHCR

If the repo (and therefore its GHCR packages) is **private**, the `deploy` user needs to
authenticate to pull images — GHCR pulls aren't covered by the Actions job's `GITHUB_TOKEN`, that
token only lets Actions _push_.

Create a GitHub **classic PAT** with just the `read:packages` scope
(Settings → Developer settings → Personal access tokens), then on the VPS:

```bash
ssh deploy@<public-ip>
echo '<your-pat>' | docker login ghcr.io -u <your-github-username> --password-stdin
exit
```

This only needs to run once — Docker persists the credential in `~/.docker/config.json` on the VPS.

Alternative: make the `api`/`web`/`admin` GHCR packages public (repo → Packages → each package →
Package settings → Change visibility), which skips this step entirely.

## 8. First real run

Trigger it by pushing to `main` (or manually re-running "Checks" from the Actions tab), then
watch both workflows in GitHub's Actions tab: "Checks" runs first, and "Deploy" starts
automatically once it succeeds (via `workflow_run` — it won't appear at all if "Checks" fails).
If the `deploy` job fails, SSH in directly to see what actually happened, since the forced
command's own output isn't streamed back to Actions on failure paths as clearly as running it by
hand:

```bash
ssh deploy@<public-ip> "cd /opt/portfolio && docker compose -f docker-compose.yml -f docker-compose.prod.yml ps"
ssh deploy@<public-ip> "cd /opt/portfolio && docker compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail=100 api"
```

## Verify it worked

```bash
curl -I -H 'Host: ebeerens.com' http://<public-ip>/        # web, via Nginx host routing
curl -I -H 'Host: admin.ebeerens.com' http://<public-ip>/  # admin, via Nginx host routing
curl http://<public-ip>/api/profile  # api, via Nginx
```

All three should respond (not connection-refused), and `docker compose ps` on the VPS should show
`nginx`, `api`, `web`, `admin`, and `postgres` all healthy/running — with nothing but Nginx's port
80 reachable from outside.
