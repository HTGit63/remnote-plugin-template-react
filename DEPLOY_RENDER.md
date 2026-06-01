# Deploy On Render

## Required Environment

```env
PUBLIC_BASE_URL=https://your-render-service.onrender.com
REMNOTE_BRIDGE_PUBLIC_BASE_URL=https://your-render-service.onrender.com
MCP_SERVER_URL=https://your-render-service.onrender.com/mcp
OAUTH_ISSUER=https://your-render-service.onrender.com
SESSION_SECRET=replace-with-strong-random-secret
ADMIN_DEBUG_SECRET=replace-with-admin-secret
PAIRING_CODE_TTL_SECONDS=600
AUTHORIZATION_CODE_TTL_SECONDS=300
ACCESS_TOKEN_TTL_SECONDS=3600
REFRESH_TOKEN_TTL_SECONDS=2592000
DATABASE_URL=postgresql://...
NODE_ENV=production
ALLOW_DEV_NO_AUTH=false
REMNOTE_BRIDGE_DEPLOYMENT_MODE=public_hosted_oauth
REMNOTE_BRIDGE_ENABLE_HOSTED_PAIRING=1
REMNOTE_BRIDGE_STORAGE=postgres
REMNOTE_BRIDGE_SINGLE_PORT=1
REMNOTE_BRIDGE_HOST=0.0.0.0
PORT=47392
ALLOWED_ORIGINS=https://chatgpt.com,https://chat.openai.com,https://www.remnote.com,https://your-render-service.onrender.com
REMNOTE_BRIDGE_ALLOW_CORS=1
PLUGIN_WS_PATH=/remnote
REMNOTE_BRIDGE_WS_PATH=/remnote
REMNOTE_BRIDGE_MCP_PATH=/mcp
REMNOTE_BRIDGE_ENABLE_DELETE_TOOL=0
LOG_LEVEL=info
REDACT_SECRETS_IN_LOGS=true
```

Do not set `REMNOTE_BRIDGE_TOKEN` in `public_hosted_oauth` production mode.

## Commands

```bash
npm install
npm run server:install
npm run build
npm run server:build
npm run server:start
```

## URLs

```text
ChatGPT MCP connector URL:
https://your-render-service.onrender.com/mcp

RemNote plugin WebSocket URL:
wss://your-render-service.onrender.com/remnote
```

## Required Checks

```bash
curl https://your-render-service.onrender.com/health
curl https://your-render-service.onrender.com/.well-known/oauth-protected-resource
curl https://your-render-service.onrender.com/.well-known/oauth-authorization-server
```

Then run manual flow:

```text
Add MCP connector in ChatGPT
Authorize connector
Open Render /connect page
Copy pairing code
Open RemNote plugin
Enter code
Choose focused scope + ask-every-write
Approve
Return to ChatGPT
Call get_bridge_status
Call get_focused_rem with plugin open
Disconnect from plugin
Verify tool calls fail
```

If Render restarts while using memory storage, pending pairings disappear. Production must use PostgreSQL through `DATABASE_URL`.
