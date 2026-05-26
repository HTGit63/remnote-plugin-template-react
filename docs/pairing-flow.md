# Pairing Flow

Status: ChatGPT-started pairing is implemented. Legacy dashboard pairing routes under `/api/pair/*` remain for compatibility.

## ChatGPT-Started Flow

1. ChatGPT starts OAuth at `/oauth/authorize`.
2. Server creates `ChatGptPairingSession` with hashed pairing code.
3. Browser lands on `/connect?pairing_id=...`.
4. `/connect` displays the one-time code, for example `482-913`.
5. User opens RemNote plugin and enters the code.
6. Plugin sends `POST /pairing/approve` with:
   - plugin instance ID
   - plugin connection ID
   - selected access scope
   - selected write mode
   - workspace label
7. Server hashes plugin session secret and returns raw secret once to the plugin.
8. `/connect` polls `/pairing/status`, receives OAuth redirect URL, and returns to ChatGPT.
9. ChatGPT exchanges code at `/oauth/token`.
10. Plugin opens WebSocket and sends `plugin_register`.
11. Server routes MCP calls only to that pairing/plugin instance.

## Security Rules

- Pairing code expires in 10 minutes by default.
- Pairing code is one-time use.
- Raw pairing code is shown only on initial connect page.
- Authorization code, access token, refresh token, and plugin session secret are stored hashed.
- Wrong code attempts are rate-limited.
- Plugin instance ID must match approved pairing.
- Stale/offline plugin connections do not receive calls.
- Display labels are not identity.

## Plugin Offline Error

```text
RemNote plugin is not connected. Open RemNote and reconnect the ChatGPT Bridge plugin.
```

## Tests

```bash
npm run server:test:auth
npm run server:test:routing
```
