# Final Polish Phase 5

Status: complete for personal hosted readiness at repo and mock-runtime level on 2026-05-17.

## Completed

- Added single-port server mode with `REMNOTE_BRIDGE_SINGLE_PORT=1`.
- Added `PORT` / `REMNOTE_BRIDGE_PORT` support for one shared HTTP server.
- Attached the RemNote WebSocket bridge and MCP Streamable HTTP endpoint to the same server in single-port mode.
- Kept two-port localhost mode as the default local behavior.
- Added `REMNOTE_BRIDGE_TOOL_PROFILE`, single-port, path, and port examples to `.env.example`.
- Added root `npm run server:start`.
- Added `render.yaml` for personal hosted Render deployment with one web service, token auth, CORS allowlist, simple tool profile, and `/health` health check.
- Kept `REMNOTE_BRIDGE_HOSTED_MODE=1` blocked for public multi-user OAuth/pairing mode.

## Local Hosted Shape

```text
GET    /health
GET    /diagnostics
POST   /mcp
GET    /mcp
DELETE /mcp
WS     /remnote-bridge
```

## Validation

- `npm run server:build`: passed.
- `npm run server:smoke`: passed, including single-port mock WebSocket + MCP coverage and simple-profile discovery.

## Remaining Operator Proof

Render deployment was not executed in this local coding run because it needs the user's Render account and secret token. Public hosted mode is still not production-ready until OAuth, pairing, per-user sessions, revocation, privacy policy, and support assets exist.
