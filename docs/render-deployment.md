# Render Deployment

Status: hosted pairing is enabled only when `REMNOTE_BRIDGE_DEPLOYMENT_MODE=hosted` and `REMNOTE_BRIDGE_ENABLE_HOSTED_PAIRING=1` are both set. Real hosted ChatGPT + RemNote proof is still required before public launch.

## Public Hosted Env

```bash
REMNOTE_BRIDGE_PUBLIC_BASE_URL=https://your-service.onrender.com
MCP_SERVER_URL=https://your-service.onrender.com/mcp
OAUTH_ISSUER=https://your-service.onrender.com
SESSION_SECRET=...
ADMIN_DEBUG_SECRET=...
PAIRING_CODE_TTL_SECONDS=600
AUTHORIZATION_CODE_TTL_SECONDS=300
ACCESS_TOKEN_TTL_SECONDS=3600
REFRESH_TOKEN_TTL_SECONDS=2592000
REMNOTE_BRIDGE_DEPLOYMENT_MODE=hosted
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

Do not set `REMNOTE_BRIDGE_TOKEN` for hosted MCP access. Hosted MCP tool calls use ChatGPT OAuth/pairing bearer tokens. Local bridge tokens are local mode only.

If `REMNOTE_BRIDGE_DEPLOYMENT_MODE=hosted` is set without `REMNOTE_BRIDGE_ENABLE_HOSTED_PAIRING=1`, startup must fail.

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

Expected `/health` facts:

```json
{
  "deploymentMode": "hosted",
  "toolCallAuthMode": "hosted_oauth_required",
  "hostedPairingEnabled": true,
  "mcpEndpoint": "https://your-service.onrender.com/mcp",
  "bridgeEndpoint": "wss://your-service.onrender.com/remnote"
}
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
8. Dashboard WSS Plugin Connection changes from OFFLINE to CONNECTED.
9. Runtime matrix marks called tools runtime verified.
10. Plugin disconnect returns reconnect error without local-token 401.
11. Revocation blocks future calls.
