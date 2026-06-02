# Deploy on Render

Render config source:

```text
render.yaml
```

Current Render strategy:

```text
rootDir: server
buildCommand: npm ci && npm run build
startCommand: npm start
```

Server package has its own `package-lock.json`. Use `npm ci` for deterministic hosted installs.

## Required Environment Variables

```text
REMNOTE_BRIDGE_SINGLE_PORT=1
REMNOTE_BRIDGE_HOST=0.0.0.0
REMNOTE_BRIDGE_ALLOW_REMOTE=1
REMNOTE_BRIDGE_ALLOW_CORS=1
REMNOTE_BRIDGE_DEPLOYMENT_MODE=public_hosted_oauth
REMNOTE_BRIDGE_ENABLE_HOSTED_PAIRING=1
REMNOTE_BRIDGE_STORAGE=postgres
PLUGIN_WS_PATH=/remnote
REMNOTE_BRIDGE_MCP_PATH=/mcp
REMNOTE_BRIDGE_TOOL_PROFILE=core
REMNOTE_BRIDGE_ENABLE_DELETE_TOOL=0
REMNOTE_BRIDGE_AUDIT_LOG=1
ALLOWED_ORIGINS=https://chatgpt.com,https://chat.openai.com,https://remnote.com,https://www.remnote.com
SESSION_SECRET
ADMIN_DEBUG_SECRET
DATABASE_URL
PUBLIC_BASE_URL
MCP_SERVER_URL
OAUTH_ISSUER
```

## Build Verification

Before deploying:

```bash
npm run server:build
npm run server:test:boundaries
cd server
npm install
npm run build
```

The server build must emit only `server/dist/server/**` and `server/dist/shared/**`. It must not emit plugin runtime files under `server/dist/src/remnote/**`, `server/dist/src/widgets/**`, or plugin bridge handler/client/pairing files.

## Troubleshooting

- Hosted startup fails with hosted pairing guard: set `REMNOTE_BRIDGE_ENABLE_HOSTED_PAIRING=1` intentionally.
- `PLUGIN_NOT_PAIRED`: ChatGPT is using hosted/stale connector path; local mode should use `http://127.0.0.1:47392/mcp`.
- `PLUGIN_NOT_CONNECTED`: MCP server is reachable but local plugin WebSocket is absent.
- `TRUSTED_WRITE_REQUIRED`: approve trusted write mode and `bridge:trusted_write`.
- `INSUFFICIENT_SCOPE`: reconnect with broader scope.
- Markdown import partial failure: inspect `rootRemId`, `createdRemIds`, `rollbackStatus`, and `verification`.
