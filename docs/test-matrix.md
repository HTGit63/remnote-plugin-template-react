# Test Matrix

Status: hosted-auth Phases 7-12 repo/local checks added.

## Automated Gates

| Gate | Purpose |
|---|---|
| `npm run check-types` | plugin TypeScript |
| `npm run validate` | RemNote plugin manifest/package validation |
| `npm run build` | plugin build |
| `npm run server:build` | server TypeScript |
| `npm run server:smoke` | local bridge/MCP regression |
| `npm run server:test:auth` | OAuth metadata, DCR, PKCE, bearer, revoke, scope checks |
| `npm run server:test:pairing` | pairing start/confirm/status/revoke and token non-leak |
| `npm run server:test:routing` | public-hosted plugin session routing |
| `npm run server:test:security` | OAuth security smoke alias |
| `npm audit` | dependency advisory scan |
| `npm audit --omit=dev` | production dependency advisory scan |
| `git diff --check` | whitespace/diff hygiene |

## Manual Hosted Gates

| Gate | Required Before Public Launch |
|---|---|
| Render deploy | service boots with PostgreSQL |
| OAuth provider | dashboard login works with real provider |
| ChatGPT Developer Mode | OAuth flow and `/mcp` tool calls work |
| RemNote sandbox | plugin pairs and connects over WSS |
| Safe write | high-level note write works in disposable sandbox |
| Reconnect | plugin survives restart/redeploy |
| Revocation | token/session revoke blocks future calls |
| Wrong-user routing | user A cannot hit user B plugin |

## Known Non-Code Blockers

- provider credentials;
- Render service URL;
- PostgreSQL `DATABASE_URL`;
- live RemNote plugin session;
- ChatGPT Developer Mode connector setup;
- privacy policy URL;
- support URL;
- screenshots/submission assets.
