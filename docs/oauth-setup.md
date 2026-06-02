# OAuth Setup

Status: ChatGPT MCP OAuth + RemNote plugin pairing is implemented and smoke-tested locally.

This is not RemNote OAuth. Render never receives a standalone RemNote account grant. Render receives ChatGPT MCP OAuth requests and waits for the active RemNote plugin to approve a short-lived pairing code.

## ChatGPT MCP OAuth

```text
MCP call without bearer
-> 401 Bearer challenge
-> protected resource metadata
-> authorization server metadata
-> dynamic client registration
-> /oauth/authorize
-> /connect pairing page
-> RemNote plugin approves pairing code
-> authorization-code + PKCE token exchange
-> bearer MCP calls routed to approved plugin only
```

## Endpoints

```text
GET  /.well-known/oauth-protected-resource
GET  /.well-known/oauth-authorization-server
POST /oauth/register
GET  /oauth/authorize
POST /oauth/token
POST /oauth/revoke
GET  /connect
POST /pairing/approve
POST /pairing/deny
GET  /pairing/status
POST /pairing/disconnect
```

## Required Env

```bash
PUBLIC_BASE_URL=https://your-service.onrender.com
REMNOTE_BRIDGE_PUBLIC_BASE_URL=https://your-service.onrender.com
MCP_SERVER_URL=https://your-service.onrender.com/mcp
OAUTH_ISSUER=https://your-service.onrender.com
SESSION_SECRET=...
REMNOTE_BRIDGE_DEPLOYMENT_MODE=hosted
REMNOTE_BRIDGE_ENABLE_HOSTED_PAIRING=1
REMNOTE_BRIDGE_STORAGE=postgres
DATABASE_URL=postgresql://...
ALLOW_DEV_NO_AUTH=false
```

Do not set `REMNOTE_BRIDGE_TOKEN` for hosted MCP access. If hosted mode is set without `REMNOTE_BRIDGE_ENABLE_HOSTED_PAIRING=1`, startup must fail.

## Smoke

```bash
npm run server:test:auth
```
