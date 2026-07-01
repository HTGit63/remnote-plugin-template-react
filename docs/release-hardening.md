# Release Hardening

Status: Area 3 certification exists for local MCP tool breadth, hosted OAuth routing, diagnostics shape, safe dry-run/delete guards, and release command coverage.

## Modes

Local mode is for development only.

```text
REMNOTE_BRIDGE_DEPLOYMENT_MODE=local
MCP auth: Authorization: Bearer REMNOTE_BRIDGE_TOKEN
Plugin WebSocket auth: plugin_hello + REMNOTE_BRIDGE_TOKEN
ChatGPT hosted pairing: disabled
Expected missing-auth error: Missing or invalid bridge token.
```

Hosted mode is for Render and ChatGPT connector access.

```text
REMNOTE_BRIDGE_DEPLOYMENT_MODE=hosted
REMNOTE_BRIDGE_ENABLE_HOSTED_PAIRING=1
MCP auth: ChatGPT OAuth/pairing bearer token, optional Codex REMNOTE_CODEX_TOKEN bearer token
Plugin WebSocket auth: plugin_register + plugin session secret
Local bridge token for MCP: not required and not accepted as hosted OAuth
Expected missing-auth error: Missing bearer token.
```

Hosted startup intentionally fails if `REMNOTE_BRIDGE_ENABLE_HOSTED_PAIRING=1` is missing.

## Render Env

```bash
REMNOTE_BRIDGE_DEPLOYMENT_MODE=hosted
REMNOTE_BRIDGE_ENABLE_HOSTED_PAIRING=1
REMNOTE_BRIDGE_SINGLE_PORT=1
REMNOTE_BRIDGE_HOST=0.0.0.0
REMNOTE_BRIDGE_PUBLIC_BASE_URL=https://remnote-plugin-template-react.onrender.com
REMNOTE_BRIDGE_WS_PATH=/remnote
REMNOTE_BRIDGE_MCP_PATH=/mcp
REMNOTE_BRIDGE_STORAGE=postgres
DATABASE_URL=postgresql://...
SESSION_SECRET=...
ADMIN_DEBUG_SECRET=...
REMNOTE_CODEX_TOKEN=<strong random secret>
REMNOTE_BRIDGE_ALLOWED_ORIGINS=https://chatgpt.com,https://chat.openai.com,https://www.remnote.com,https://remnote-plugin-template-react.onrender.com
NODE_ENV=production
```

Do not set `REMNOTE_BRIDGE_TOKEN` for hosted MCP access. That token is local mode only.

## Health Proof

Hosted `/health` must show:

```json
{
  "deploymentMode": "hosted",
  "toolCallAuthMode": "hosted_oauth_required",
  "hostedPairingEnabled": true,
  "codexBearerAuthAvailable": true,
  "codexBearerAuthConfigured": true,
  "authModesSupported": ["hosted_pairing", "codex_bearer"],
  "mcpEndpoint": "https://remnote-plugin-template-react.onrender.com/mcp",
  "bridgeEndpoint": "wss://remnote-plugin-template-react.onrender.com/remnote"
}
```

`bridge.connected` must come from active `plugin_register` session routing in hosted mode. WebSocket open alone is not enough.

## Tool Tiers

The plugin can choose a tool tier:

```text
basic       read/status only
note_writer basic plus normal note writing, Markdown/tree imports, cards, verification
power_user  note_writer plus formatting, move, reorder, and mutation tools
developer   power_user plus diagnostics and raw debug tools
danger      developer plus destructive tools when explicitly enabled
```

Tier, access scope, and write-mode changes sync live through the hosted session and should not force reconnect. Connector refresh is reserved for server URL, token, or session-secret changes.

## Runtime Matrix

Diagnostics expose `runtimeVerificationMatrix` with stable fields:

```text
name
toolName
tier
category
riskLevel
registered
exposed
runtimeVerified
lastSuccessTimestamp
lastFailureTimestamp
lastErrorCode
averageLatencyMs
p95LatencyMs
supportsDryRun
supportsIdempotency
requiresWrite
requiresDelete
recommendedFallback
schemaWarningStatus
```

The matrix uses real bridge outcomes, not registry-only claims. Server-local tools are marked `server_local`; plugin tools become verified after a successful MCP-to-WebSocket round trip.

## Safe Writes

Normal note creation should prefer:

```text
create_polished_note_tree
create_or_replace_note_from_markdown
apply_structured_note_batch
apply_style_plan
verify_note_design
```

Use `create_or_replace_note_from_markdown` for long copied Markdown/source notes so one approved operation preserves headings, paragraphs, formulas, bullets, code, and source order. Use low-level write tools only as fallbacks or for explicit narrow edits. Dry-run capable tools should be dry-run first when target identity or scope is uncertain.

## Delete Safety

Only `delete_rem_by_id` can become public, and only when `REMNOTE_BRIDGE_ENABLE_DELETE_TOOL=1` and the active access tier is `danger`. Legacy focus/selection delete tools must not be exposed or kept as hidden/gated paths. `replace_rem` stays hidden until stronger guards are live-verified.

Real deletion requires:

```text
dryRun=false
expectedParentId or expectedAncestorId
optional confirmTitle when known
idempotencyKey for retry safety
```

Certification uses `dryRun=true` only.

## Required Gates

Run from the repo root before release:

```bash
npm run server:build
npm run server:test:auth
npm run server:test:routing
npm run server:smoke
npm run server:test:pairing
npm run server:test:security
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

Live hosted release still needs Render, RemNote sandbox, and ChatGPT Developer Mode proof against the public URL.

## Troubleshooting

`Missing or invalid bridge token` means local mode handled the MCP request. Render must be in hosted mode for ChatGPT connector calls.

`Missing bearer token` means hosted mode is active and the MCP call did not include OAuth/pairing auth.

`PLUGIN_NOT_CONNECTED` or `NO_PAIRED_PLUGIN_SESSION` in hosted mode means OAuth passed but no active plugin session is available for the authenticated ChatGPT user.

If `/health` shows `127.0.0.1`, set `REMNOTE_BRIDGE_PUBLIC_BASE_URL`.
