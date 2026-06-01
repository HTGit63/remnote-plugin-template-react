# Render Deployment

Status: repo config and local smoke tests exist; real hosted ChatGPT + RemNote proof still required.

## Public Hosted Env

```bash
PUBLIC_BASE_URL=https://your-service.onrender.com
REMNOTE_BRIDGE_PUBLIC_BASE_URL=https://your-service.onrender.com
MCP_SERVER_URL=https://your-service.onrender.com/mcp
OAUTH_ISSUER=https://your-service.onrender.com
SESSION_SECRET=...
ADMIN_DEBUG_SECRET=...
PAIRING_CODE_TTL_SECONDS=600
AUTHORIZATION_CODE_TTL_SECONDS=300
ACCESS_TOKEN_TTL_SECONDS=3600
REFRESH_TOKEN_TTL_SECONDS=2592000
REMNOTE_BRIDGE_DEPLOYMENT_MODE=public_hosted_oauth
REMNOTE_BRIDGE_ENABLE_HOSTED_PAIRING=1
REMNOTE_BRIDGE_STORAGE=postgres
DATABASE_URL=postgresql://...
REMNOTE_BRIDGE_SINGLE_PORT=1
REMNOTE_BRIDGE_HOST=0.0.0.0
PORT=10000
PLUGIN_WS_PATH=/remnote
REMNOTE_BRIDGE_WS_PATH=/remnote
REMNOTE_BRIDGE_MCP_PATH=/mcp
REMNOTE_BRIDGE_ALLOW_CORS=1
ALLOWED_ORIGINS=https://chatgpt.com,https://chat.openai.com,https://www.remnote.com,https://your-service.onrender.com
REMNOTE_BRIDGE_ENABLE_DELETE_TOOL=0
NODE_ENV=production
ALLOW_DEV_NO_AUTH=false
```

Do not set `REMNOTE_BRIDGE_TOKEN` in public-hosted OAuth mode.

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
GET /health
GET /.well-known/oauth-protected-resource
GET /.well-known/oauth-authorization-server
GET /connect
POST /mcp
WSS /remnote
```

Expected unauthenticated `/mcp` tool call:

```text
401 Unauthorized
WWW-Authenticate: Bearer resource_metadata="https://.../.well-known/oauth-protected-resource", scope="..."
```

## External Tests Before Launch

1. Render service starts with PostgreSQL.
2. `/health` and well-known metadata work over HTTPS.
3. ChatGPT connector opens Render `/connect`.
4. RemNote plugin approves code.
5. Plugin connects over WSS `/remnote`.
6. ChatGPT calls `get_bridge_status`.
7. ChatGPT calls a read tool with plugin open.
8. Plugin disconnect revokes access.
9. Offline plugin returns reconnect error.
