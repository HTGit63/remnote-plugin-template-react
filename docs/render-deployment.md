# Render Deployment

Status: repo config exists; real external deployment still required.

## Public Hosted Required Env

```bash
REMNOTE_BRIDGE_DEPLOYMENT_MODE=public_hosted_oauth
REMNOTE_BRIDGE_STORAGE=postgres
DATABASE_URL=postgresql://...
REMNOTE_BRIDGE_PUBLIC_BASE_URL=https://your-service.onrender.com
REMNOTE_BRIDGE_MCP_RESOURCE=https://your-service.onrender.com
REMNOTE_BRIDGE_OAUTH_ISSUER=https://your-service.onrender.com
REMNOTE_BRIDGE_SINGLE_PORT=1
REMNOTE_BRIDGE_HOST=0.0.0.0
PORT=10000
REMNOTE_BRIDGE_WS_PATH=/remnote-bridge
REMNOTE_BRIDGE_MCP_PATH=/mcp
REMNOTE_BRIDGE_ALLOW_CORS=1
REMNOTE_BRIDGE_ALLOWED_ORIGINS=https://www.remnote.com,https://chat.openai.com
REMNOTE_BRIDGE_AUDIT_LOG=true
```

Do not set `REMNOTE_BRIDGE_TOKEN` in public-hosted OAuth mode. Startup rejects it.

## Build/Start

```bash
npm install
npm run server:install
npm run build
npm run server:build
npm run server:start
```

## Smoke URLs

```text
GET /
GET /health
GET /.well-known/oauth-protected-resource
GET /.well-known/oauth-authorization-server
POST /oauth/register
POST /mcp
WSS /remnote-bridge
```

Expected public `/mcp` without bearer:

```text
401 Unauthorized
WWW-Authenticate: Bearer resource_metadata="https://.../.well-known/oauth-protected-resource", scope="..."
```

## Required External Tests

1. Confirm Render service starts with PostgreSQL.
2. Confirm `/health` and well-known OAuth metadata.
3. Pair a RemNote plugin from a real browser session.
4. Connect plugin over WSS.
5. Run ChatGPT Developer Mode OAuth flow.
6. Call `get_bridge_status`.
7. Run safe-write health check in disposable RemNote sandbox.
8. Revoke token/session and verify calls fail.

## Not Launch-Ready Until

- real provider credentials work;
- PostgreSQL persists sessions across redeploy;
- WSS reconnect works after Render deploy;
- ChatGPT Developer Mode succeeds against hosted `/mcp`;
- live RemNote sandbox proof is recorded.
