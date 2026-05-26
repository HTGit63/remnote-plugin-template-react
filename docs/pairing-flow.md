# Pairing Flow

Status: repo/local pairing smoke complete on 2026-05-26.

## Actors

```text
Dashboard user session
RemNote plugin device
Companion server storage
BridgeHub SessionRouter
```

## Flow

1. Plugin gets/creates local `deviceId`.
2. Plugin calls `POST /api/pair/start` with `deviceId` and device name.
3. Server creates short-lived numeric pairing code.
4. User opens dashboard pairing page.
5. Dashboard calls `POST /api/pair/confirm` with code and CSRF token.
6. Server binds code to dashboard user, creates plugin session ID/token, and marks code confirmed.
7. Dashboard response does not include `pluginSessionToken`.
8. Plugin calls `POST /api/pair/status` with code and same `deviceId`.
9. Server returns plugin credentials once.
10. Plugin stores credentials in RemNote local storage.
11. Plugin opens WSS and sends hosted hello with `deviceId`, `pluginSessionId`, and `pluginSessionToken`.
12. Server validates and registers connection for that user.

## Security Rules

- pairing code expires;
- code is one-time credential delivery;
- dashboard never receives plugin session token;
- plugin token stored in local plugin storage, not synced settings;
- revoke marks session unusable;
- invalid or revoked plugin WebSocket hello closes with policy violation;
- public-hosted tool calls route only to authenticated user's paired plugin.

## Test

```bash
npm run server:test:pairing
npm run server:test:routing
```

## Remaining External Proof

Run same flow with hosted dashboard + real RemNote plugin. Local smoke cannot prove browser/plugin runtime storage behavior inside production RemNote.
