# Test Matrix

Status: Areas 1-3 repo/local checks added. Hosted public launch still needs live Render, RemNote sandbox, and ChatGPT Developer Mode proof.

## Automated Gates

| Gate | Purpose |
|---|---|
| `npm run check-types` | plugin TypeScript |
| `npm run validate` | RemNote plugin manifest/package validation |
| `npm run build` | plugin build |
| `npm run server:build` | server TypeScript |
| `npm run server:smoke` | local bridge/MCP regression |
| `npm run server:test:auth` | OAuth metadata, DCR, PKCE, bearer, revoke, scope checks |
| `npm run server:test:codex-bearer` | hosted Codex bearer auth, loopback redirect DCR, discovery, delete hiding, secret redaction |
| `npm run server:test:pairing` | pairing start/confirm/status/revoke and token non-leak |
| `npm run server:test:routing` | public-hosted plugin session routing |
| `npm run server:test:security` | OAuth security smoke alias |
| `npm run server:test:tools-core` | legacy core alias registry/schema checks plus basic MCP certification |
| `npm run server:test:tools-advanced` | legacy advanced alias registry/schema checks plus note_writer MCP certification |
| `npm run server:test:tools-diagnostics` | legacy diagnostics alias registry/schema checks plus developer MCP certification |
| `npm run server:test:tool-profile` | all access-tier registry/tool-count/profile consistency certification |
| `npm run server:test:health-check-routing` | local/direct health-check routing certification |
| `npm run server:test:structured-depth` | 5-level study tree and safe extreme-depth rejection |
| `npm run server:test:style-schema` | canonical style schema and no style-control Rem pollution |
| `npm run server:test:nuclear-physics-style-preset` | global Nuclear Physics note style preset parser/schema regression |
| `npm run server:test:markdown-importer` | one-call Markdown importer parser/schema/MCP certification |
| `npm run server:test:source-fidelity` | source-fidelity failure detection |
| `npm run server:test:direct-write-trusted-mode-regression` | direct safe writes do not get server-blocked by stale trusted-write scope |
| `npm run server:test:tool-schemas` | schema quality, metadata, unsupported-tool exposure checks |
| `npm run server:test:hosted-diagnostics` | hosted plugin API diagnostics/health/tier smoke |
| `npm run server:test:tier-switching` | hosted plugin tier switch and stale-session smoke |
| `npm run server:test:idempotency` | idempotency metadata plus MCP dry-run/delete guard certification |
| `npm run server:test:performance` | registry cache checks plus MCP p95 latency report |
| `npm run server:test:e2e-hosted-smoke` | hosted OAuth, Codex bearer, plugin_register routing, hosted diagnostics, hosted matrix smoke |
| `npm run server:test:area3` | danger-tier MCP certification for every public supported tool |
| `npm audit` | dependency advisory scan |
| `npm audit --omit=dev` | production dependency advisory scan |
| `git diff --check` | whitespace/diff hygiene |

## Required Release Command Set

Run from the repo root:

```bash
npm run server:build
npm run server:test:auth
npm run server:test:routing
npm run server:smoke
npm run server:test:pairing
npm run server:test:security
npm run server:test:tool-profile
npm run server:test:health-check-routing
npm run server:test:structured-depth
npm run server:test:style-schema
npm run server:test:nuclear-physics-style-preset
npm run server:test:markdown-importer
npm run server:test:source-fidelity
npm run server:test:direct-write-trusted-mode-regression
npm run server:test:tools-core
npm run server:test:tools-advanced
npm run server:test:tools-diagnostics
npm run server:test:tool-schemas
npm run server:test:hosted-diagnostics
npm run server:test:tier-switching
npm run server:test:idempotency
npm run server:test:performance
npm run server:test:e2e-hosted-smoke
npm run server:test:area3
npm run check-types
npm run build
git diff --check
```

## Manual Hosted Gates

| Gate | Required Before Public Launch |
|---|---|
| Render deploy | service boots with PostgreSQL |
| OAuth provider | dashboard login works with real provider |
| ChatGPT Developer Mode | OAuth flow and `/mcp` tool calls work |
| RemNote sandbox | plugin pairs and connects over WSS |
| Health diagnostics | `/health` shows `deploymentMode="hosted"`, `toolCallAuthMode="hosted_oauth_required"`, public `/mcp`, and public WSS `/remnote` |
| Runtime matrix | diagnostics show registered/exposed/runtime fields for every public supported tool |
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
