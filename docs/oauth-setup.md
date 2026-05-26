# OAuth Setup

Status: ChatGPT-facing OAuth server is implemented and smoke-tested locally. Dashboard provider login still needs real provider credentials for hosted use.

## ChatGPT MCP OAuth

Public-hosted MCP uses this flow:

```text
MCP call without bearer
-> 401 Bearer challenge
-> protected resource metadata
-> authorization server metadata
-> dynamic client registration
-> authorization-code + PKCE S256
-> token exchange
-> bearer MCP call
```

Supported endpoints:

```text
GET  /.well-known/oauth-protected-resource
GET  /.well-known/oauth-authorization-server
POST /oauth/register
GET  /oauth/authorize
POST /oauth/token
POST /oauth/revoke
```

Supported scopes:

```text
bridge:read
bridge:write
bridge:trusted_write
bridge:delete
bridge:admin
bridge:pair
```

Default ChatGPT scopes:

```text
bridge:read bridge:write
```

## Required Env

```bash
REMNOTE_BRIDGE_DEPLOYMENT_MODE=public_hosted_oauth
REMNOTE_BRIDGE_PUBLIC_BASE_URL=https://your-service.onrender.com
REMNOTE_BRIDGE_MCP_RESOURCE=https://your-service.onrender.com
REMNOTE_BRIDGE_OAUTH_ISSUER=https://your-service.onrender.com
REMNOTE_BRIDGE_STORAGE=postgres
DATABASE_URL=postgresql://...
```

## Dashboard Login Provider

Dashboard routes support OAuth provider config:

```bash
REMNOTE_BRIDGE_OAUTH_PROVIDER=google
REMNOTE_BRIDGE_OAUTH_CLIENT_ID=...
REMNOTE_BRIDGE_OAUTH_CLIENT_SECRET=...
REMNOTE_BRIDGE_OAUTH_AUTH_URL=https://accounts.google.com/o/oauth2/v2/auth
REMNOTE_BRIDGE_OAUTH_TOKEN_URL=https://oauth2.googleapis.com/token
REMNOTE_BRIDGE_OAUTH_USERINFO_URL=https://openidconnect.googleapis.com/v1/userinfo
```

Hosted deployment must verify provider callback with a real provider account before public launch.

Dashboard login uses the provider token endpoint and userinfo endpoint. It does not trust decoded unsigned `id_token` payloads as identity.

## Local Smoke Shortcut

`server:test:auth` uses loopback public-hosted mode with memory storage and local-dev login hints. That proves the server flow, not real provider login.

```bash
npm run server:test:auth
```
