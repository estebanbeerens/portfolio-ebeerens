---
name: oauth-session-auth
description: 'Implement GitHub OAuth login and the opaque, server-side session (not JWT) for the single-administrator auth model in this project. Use when implementing "Login with GitHub", the Passport strategy, the session/auth guard, logout, or the expired-session cleanup job.'
---

# GitHub OAuth + Opaque Session Auth

## When to Use

- Implementing "Login with GitHub" end-to-end
- Writing the Passport strategy, auth guard, or session cookie handling
- Implementing logout or the expired-session cleanup job
- Reviewing auth code for adherence to the single-admin authorization model

## Why This Is Its Own Skill

`nestjs-backend` covers general module/controller/DTO/Prisma conventions. Auth is security-sensitive enough, and specific enough (opaque tokens, not JWT; single hardcoded admin, not roles/permissions), to warrant its own explicit checklist rather than being improvised per the generic backend workflow.

## The Model (from the architecture plan, §8)

- **One administrator.** Authorization is `authenticated AND githubUserId === configuredAdminGithubId` — nothing more elaborate. Don't build roles/permissions.
- **Opaque session token, not JWT.** A random token is generated on login; only its **hash** is stored server-side (in the `Session` Prisma model already defined in [schema.prisma](../../../apps/api/prisma/schema.prisma): `tokenHash`, `githubUserId`, `expiresAt`, `createdAt`). The raw token only ever lives in an `HttpOnly`/`Secure`/`SameSite=Strict` cookie.
- **No Redis, no JWT blocklist.** Logout is a single row delete. A leaked cookie reveals nothing (it's a random ID, not a signed payload).

## Workflow

1. Register a GitHub OAuth App; store `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET`/callback URL and `ADMIN_GITHUB_ID` in env, never in code.
2. Implement the Passport `passport-github2` strategy — see [passport-strategy.md](./references/passport-strategy.md).
3. On successful GitHub callback, reject immediately if `githubUserId !== ADMIN_GITHUB_ID` — don't create a session for anyone else.
4. On success, generate the opaque token, hash it, store the hash + `githubUserId` + `expiresAt` via `PrismaService`, set the cookie — see [session-mechanics.md](./references/session-mechanics.md).
5. Add an auth guard that reads the cookie, hashes it, looks up the session, and rejects if missing/expired. Apply it to every admin-only route.
6. Implement logout: delete the session row, clear the cookie.
7. Add a scheduled cleanup job that purges expired session rows.

## Reference Files

- [Passport strategy setup](./references/passport-strategy.md)
- [Session token mechanics](./references/session-mechanics.md)

## Best Practices Checklist

- Never store the raw session token anywhere — only its hash
- Reject non-admin GitHub users at the earliest point (in the strategy's `validate`, before any session is created)
- Cookie flags are non-negotiable: `HttpOnly`, `Secure`, `SameSite=Strict`
- No JWT, no Redis — the `sessions` table in the existing Postgres instance is sufficient for one admin
- Logout must actually delete the row, not just clear the cookie client-side
- The cleanup job runs on a schedule — expired rows shouldn't accumulate forever
- All secrets (`GITHUB_CLIENT_SECRET`, `ADMIN_GITHUB_ID`) come from `process.env`, never hardcoded
