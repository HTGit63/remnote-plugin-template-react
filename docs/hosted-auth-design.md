# Hosted Auth Design

Status: repo/local smoke complete for hosted-auth Phases 7-12 on 2026-05-26.

## Modes

| Mode | Env | Auth | Storage | Use |
|---|---|---|---|---|
| Local dev | `REMNOTE_BRIDGE_DEPLOYMENT_MODE=local_dev` | local bridge token or explicit no-token dev flag | memory | local development |
| Personal hosted | `REMNOTE_BRIDGE_DEPLOYMENT_MODE=personal_hosted_token` | static `REMNOTE_BRIDGE_TOKEN` | memory or external | one user |
| Public hosted OAuth | `REMNOTE_BRIDGE_DEPLOYMENT_MODE=public_hosted_oauth` | OAuth bearer + plugin pairing | PostgreSQL | multi-user hosted |

`REMNOTE_BRIDGE_HOSTED_MODE=1` is legacy compatibility and maps to personal token mode. Use `public_hosted_oauth` for public multi-user mode.

## Public Hosted Flow

```text
ChatGPT
-> /mcp without bearer
-> 401 WWW-Authenticate with oauth protected resource metadata
-> OAuth authorization-code + PKCE
-> short-lived access token
-> /mcp with bearer
-> server validates token, issuer, audience/resource, expiry, revocation, scopes
-> authenticated user id
-> SessionRouter
-> paired plugin WebSocket for same user
-> RemNote SDK
```

## OAuth Endpoints

```text
GET  /.well-known/oauth-protected-resource
GET  /.well-known/oauth-authorization-server
POST /oauth/register
GET  /oauth/authorize
POST /oauth/token
POST /oauth/revoke
```

Implemented token model:

- opaque random tokens;
- SHA-256 hash at rest;
- access-token expiry;
- refresh-token rotation;
- revocation by access or refresh token;
- resource/audience validation;
- issuer validation;
- per-tool scope checks.

Dashboard login is separate from ChatGPT MCP OAuth. It exchanges the provider authorization code, then reads identity from the provider userinfo endpoint. It must not trust decoded unsigned `id_token` payloads as identity.

## Pairing Flow

Plugin starts pairing with `POST /api/pair/start`. Dashboard confirms with `POST /api/pair/confirm`. The dashboard response does not include the plugin session token. The plugin polls `POST /api/pair/status` with its code and device id, receives credentials once, and stores the token in RemNote local storage.

## Routing Boundary

Public-hosted `BridgeHub.callPlugin` requires an authenticated OAuth principal. It routes only to the active plugin connection registered for that principal's `userId`. Invalid plugin session tokens, expired sessions, revoked sessions, and mismatched device IDs are rejected before a socket can route calls.

## Trusted Writes

Plugin remains final authority for RemNote scope. Server OAuth scopes can grant `bridge:trusted_write`, but the plugin still enforces `permissionMode` and `permissionScope`. Destructive tools still require approval.

## Idempotency

High-level write tools with `idempotencyKey` create storage records with user id, tool, key, request hash, status, created/updated IDs, and error code. Records do not store note body or markdown.

## Security Controls

- rate limits on OAuth, pairing, and MCP;
- CSRF on dashboard mutations;
- CSP and standard security headers;
- request body limits;
- WebSocket payload limits;
- no static public `REMNOTE_BRIDGE_TOKEN` in public OAuth mode;
- PostgreSQL required for public OAuth mode;
- audit events exclude tokens and note content.

## External Proof Still Required

Repo/local smoke does not prove public launch. Before submission, run a real Render deployment with PostgreSQL, real dashboard OAuth credentials, live RemNote sandbox plugin, and ChatGPT Developer Mode OAuth/MCP.
