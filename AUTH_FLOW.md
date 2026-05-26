# ChatGPT MCP OAuth + RemNote Plugin Pairing

This is not official RemNote OAuth. Render cannot access RemNote notes by itself. Note access comes through the active RemNote plugin and the RemNote Plugin SDK.

## Flow

```text
ChatGPT MCP connector
-> GET /oauth/authorize
-> Render /connect page shows short-lived pairing code
-> user opens RemNote ChatGPT Bridge plugin
-> plugin approves or denies pairing code
-> Render creates one-time OAuth authorization code
-> /connect redirects back to ChatGPT
-> ChatGPT POST /oauth/token with PKCE verifier
-> MCP tool calls use bearer token
-> server routes only to approved plugin WebSocket
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
GET  /connected
GET  /denied
GET  /expired
POST /pairing/create
POST /pairing/approve
POST /pairing/deny
GET  /pairing/status
POST /pairing/disconnect
GET  /health
GET  /debug/status
```

`/debug/status` works only in development or with `ADMIN_DEBUG_SECRET`.

## Security Model

Security identity is:

```text
OAuth token binding
+ pairing session ID
+ plugin instance ID
+ plugin session secret
+ active WebSocket connection
```

Display names such as `ChatGPT session`, `My ChatGPT`, or a client name are user-facing labels only. They are not identity.

Stored server-side values are hashed for pairing codes, authorization codes, access tokens, refresh tokens, and plugin session secrets. Raw values are delivered once and are not logged.

## Tool Access

Default approval:

```text
Access scope: focused-rem-only
Write mode: ask-every-write
```

Broader scopes:

```text
current-rem-tree
full-kb
```

Write modes:

```text
ask-every-write
trusted-inside-scope
```

Destructive tools remain disabled or require explicit plugin approval. Broad delete is not enabled.

## Reconnect/Disconnect

If the plugin is offline, MCP tool calls return:

```text
RemNote plugin is not connected. Open RemNote and reconnect the ChatGPT Bridge plugin.
```

Disconnect from the plugin calls `/pairing/disconnect`, revokes server-side access, and stops routing tool calls to the plugin.

## Tests

```bash
npm run server:test:auth
npm run server:test:routing
npm run server:test:pairing
npm run server:smoke
```

