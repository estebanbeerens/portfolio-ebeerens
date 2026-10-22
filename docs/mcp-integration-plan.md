# Portfolio MCP Integration Plan

## Purpose

Make public portfolio information available as tools to VS Code Copilot and other compatible
MCP clients, while requiring authorization to call the MCP endpoint. Implement this as a feature of
the existing NestJS API, not as a second data service.

The portfolio content remains public. MCP authentication makes the tool endpoint private to
authorized clients; it does not make the returned information confidential or prevent an agent
from sharing it with its model provider.

## Recommended Architecture

```text
VS Code / other MCP clients
          │ Streamable HTTP + OAuth authorization code / PKCE
          ▼
https://mcp.ebeerens.com/mcp
          │
          ▼
Cloudflare DNS / proxy / TLS / edge policy
          │
          ▼
Existing Nginx reverse proxy
          │
          ▼
Existing NestJS API
  ├── MCP transport + OAuth authorization/resource server
  ├── Read-only MCP tools
  └── Existing domain services / public data projections
          │
          ▼
Existing Prisma / private PostgreSQL

OAuth sign-in: MCP client → API authorization endpoint → admin.ebeerens.com
               → existing GitHub OAuth → configured admin identity → client redirect
```

There is no new VPS, database, container, or public database port. `mcp.ebeerens.com` is the
recommended hostname for clear routing and policy boundaries; it is not itself a privacy control.
The MCP route should bypass public caching and receive its own rate limits. Authentication and
authorization must be enforced by the API even if Cloudflare adds another access layer.

The OAuth flow authorizes the configured GitHub administrator, not any GitHub user. It reuses the
existing GitHub OAuth app credentials and callback. The MCP OAuth server stores registered
public-client metadata and only hashes authorization codes and access/refresh tokens. It issues
short-lived access tokens and rotates refresh tokens; it does not expose a static shared bearer
secret to clients.

## Initial Scope

Expose only published/public portfolio information through bounded, read-only tools:

- `get_profile`
- `search_projects` and `get_project`
- `list_experience` and `get_experience`
- `list_skills`
- `list_education`
- `search_portfolio`

Reuse existing NestJS services and the same public-data rules as the website. Tool inputs must be
validated, result sizes bounded, and responses limited to fields that are intentionally public.
Do not expose contact messages, admin-only fields, unpublished data, mutations, arbitrary SQL,
or arbitrary URL fetching.

## Ownership Legend

- **AGENT** — can be implemented and verified in the repository by the coding agent.
- **MANUAL** — requires your Cloudflare/VPS/account/client access or an explicit operational
  decision; the agent can document the steps but cannot safely complete them independently.
- **SHARED** — agent prepares/tests the change; you perform an external action or verify the
  result in your own environment.

## Tasks

| ID  | Task                                                                                                                                                                                                                                | Owner      | Depends on   | Status / completion criteria                                                                                                                                 |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Confirm the public fields and existing public service methods for profile, projects, roles/experience, skills, and education; document the tool-to-service mapping.                                                                 | **AGENT**  | —            | **Complete.** Mapping is recorded below; public getters are used and outputs are explicitly projected.                                                       |
| 2   | Choose and verify supported client/authentication modes. OAuth was selected because bearer credentials are not consistently available to portable Copilot sessions.                                                                 | **SHARED** | —            | **In progress.** OAuth is implemented; live VS Code/Copilot dynamic registration and browser-flow compatibility still requires manual verification.          |
| 3   | Add an MCP module to the existing NestJS API using the supported MCP SDK and Streamable HTTP transport, without another service or database connection.                                                                             | **AGENT**  | 1, 2         | **Complete locally.** API build and typecheck pass; `/mcp` is mounted on the existing API.                                                                   |
| 4   | Require OAuth authorization-code flow with PKCE, authorize only the configured GitHub administrator, persist only hashes of codes/tokens, rotate refresh tokens, and support token revocation. Never reuse the admin session token. | **AGENT**  | 2, 3         | **Complete locally.** Provider tests cover admin-only authorization, code exchange/hashed tokens, refresh rotation, invalid/revoked access tokens.           |
| 5   | Implement the initial read-only tools using public service methods/projections; validate inputs, cap results, and return useful structured output.                                                                                  | **AGENT**  | 1, 3         | **Complete locally.** Eight tools expose bounded public projections; protocol tests cover listings, tool calls, validation, and field filtering.             |
| 6   | Add focused OAuth and MCP protocol tests for authorization, token lifecycle, schemas, result bounds, public-field filtering, and service errors.                                                                                    | **AGENT**  | 4, 5         | **Complete locally.** API unit-test target passes, including protocol and OAuth provider tests.                                                              |
| 7   | Route `mcp.ebeerens.com` through Nginx to the API, forward authorization, disable buffering/caching, and apply origin rate limits.                                                                                                  | **AGENT**  | 3, 4         | **Configured; partially validated.** Merged Compose configuration parses; `nginx -t` and live routing remain pending because Docker is not running.          |
| 8   | Add deployment configuration and operator instructions for public URL, DNS/TLS, migration, diagnostics, and token revocation.                                                                                                       | **AGENT**  | 4, 7         | **In progress.** Compose requires `MCP_PUBLIC_URL`; this plan documents DNS, deployment/migration sequence, and global revocation. Production checks remain. |
| 9   | Add the `mcp.ebeerens.com` DNS record in Cloudflare, ensure origin certificate coverage, configure TLS and MCP cache bypass/rate limits.                                                                                            | **MANUAL** | 7, 8         | **Pending manual action.** Perform in Cloudflare after the code is ready to deploy.                                                                          |
| 10  | Set `MCP_PUBLIC_URL=https://mcp.ebeerens.com` in the VPS environment, deploy the API/Nginx image, and apply the OAuth database migration.                                                                                           | **SHARED** | 4, 8, 9      | **Pending.** Migration file is prepared; deploying requires your VPS access and a maintenance/deploy window.                                                 |
| 11  | Configure VS Code to use `https://mcp.ebeerens.com/mcp`; verify OAuth dynamic registration, GitHub sign-in, tools, and token refresh in the intended VS Code/Copilot modes.                                                         | **SHARED** | 2, 10        | **Pending manual action.** Do not commit workspace credentials or weaken authentication if a client flow fails.                                              |
| 12  | Test additional intended MCP clients and record their OAuth support and limitations.                                                                                                                                                | **MANUAL** | 10           | **Pending.** Only claim support for clients that complete the real OAuth flow.                                                                               |
| 13  | Run deployment acceptance checks and document actual endpoint/client behavior and revocation procedure.                                                                                                                             | **SHARED** | 6, 9, 10, 11 | **Pending.** Finish after DNS, migration, deployment, and client testing.                                                                                    |

### Implemented tool-to-service mapping

| MCP tool                            | Existing public service              | Output boundary                                       |
| ----------------------------------- | ------------------------------------ | ----------------------------------------------------- |
| `get_profile`                       | `ProfileService.findPublicPortfolio` | Profile fields and public links only                  |
| `search_projects`, `get_project`    | `ProjectsService.findPublicAll`      | Public project fields and skill names                 |
| `list_experience`, `get_experience` | `ProfileService.findPublicPortfolio` | Role details, public organization fields, skill names |
| `list_skills`                       | `SkillsService.findAll`              | Skill IDs and names                                   |
| `list_education`                    | `ProfileService.findPublicPortfolio` | Education details and public institution fields       |
| `search_portfolio`                  | Profile and project public services  | Bounded match summaries only                          |

## Remaining Manual Actions

The implementation is ready for your deployment steps, but it is not live yet:

1. In Cloudflare, create the proxied DNS record for `mcp.ebeerens.com` to the VPS, ensure the
   origin certificate includes that hostname, use Full (strict) TLS, bypass caching for the
   hostname, and configure an edge rate limit appropriate for MCP clients.
2. In the VPS deployment environment, set `MCP_PUBLIC_URL=https://mcp.ebeerens.com`. Confirm
   `ADMIN_APP_URL` points to `https://admin.ebeerens.com` and `ADMIN_GITHUB_ID` is the administrator
   account's GitHub ID. The existing GitHub OAuth callback is reused; no new callback registration
   is required.
3. Deploy the code. The existing `deploy/run-deploy.sh` runs the pending Prisma migration before
   restarting the API; confirm that this deployment path is used and check container health/logs.
4. In VS Code, add the remote HTTP MCP server URL and complete its OAuth flow. Confirm client
   registration, GitHub sign-in as the administrator, tool calls, and token refresh. If the client
   flow is not supported, stop and investigate compatibility—do not disable OAuth.
5. Test the live endpoint anonymously and through the authenticated client, check that Nginx and
   API logs contain no raw tokens, and verify Cloudflare cache/rate-limit behavior.

For emergency revocation of every MCP grant, revoke all records in `McpOAuthToken` in the
production database; the next authenticated MCP request will fail. Individual grants can be
revoked through the OAuth revocation endpoint. Restore access by completing OAuth authorization
again.

## Security and Privacy Requirements

1. Require authentication at the NestJS MCP endpoint. Cloudflare Access is optional defense in
   depth and must not be the only check.
2. Use OAuth with public-client PKCE, a single `portfolio:read` scope, short-lived access tokens,
   rotating refresh tokens, and authorization restricted to the configured GitHub administrator.
   Never issue a static shared credential or reuse the admin session token.
3. Store only hashes of authorization codes and access/refresh tokens. Raw OAuth tokens are
   returned to the client and must not appear in application or proxy logs.
4. Support token revocation through OAuth revocation. For emergency global revocation, revoke or
   delete rows in the `McpOAuthToken` table; this does not require rebuilding portfolio data.
5. Use HTTPS, bypass caches for MCP requests, bound input and output sizes, and apply Cloudflare
   and Nginx rate limits.
6. Do not expose database credentials, contact submissions, admin-only data, unpublished content,
   write tools, arbitrary SQL, or arbitrary network access through MCP.
7. Treat tool output as public: OAuth controls access to the MCP endpoint, not
   downstream model retention or sharing.
8. Test the selected VS Code/Copilot OAuth flow specifically, including client registration,
   browser sign-in, and refresh. Do not fall back to a committed token or an unauthenticated
   endpoint if a client is incompatible.

## Acceptance Checklist

- [x] MCP uses Streamable HTTP in the existing API; no direct PostgreSQL access is available to clients.
- [x] Tool inventory is read-only, input-validated, bounded, and limited to intended public fields.
- [x] Focused tests pass, including tool protocol/public projection and OAuth provider coverage.
- [ ] Anonymous requests are rejected; only the configured GitHub administrator can authorize.
- [ ] `https://mcp.ebeerens.com/mcp` is live through Cloudflare and Nginx with cache bypass and rate limiting.
- [ ] Tokens and authorization headers are absent from application/Nginx logs and shared workspace configuration.
- [ ] VS Code Copilot completes OAuth registration/sign-in/refresh in the intended configuration mode.
- [ ] Migration is applied and existing API/admin behavior is verified in the deployed environment.
- [ ] Token revocation and emergency global revocation are documented and tested.

## Related Architecture and Execution Docs

- [Architecture plan §22 — MCP](./personal-portfolio-architecture-plan.md#22-model-context-protocol-mcp)
- [Build guide Stage 15 — Read-only portfolio MCP](./personal-portfolio-build-guide.md#stage-15--read-only-portfolio-mcp)
