# Plan: Codex Hosted MCP Plugin Routing

**Generated**: 2026-07-01  
**Estimated Complexity**: High
**Mode**: root-cause-first, staged, no fake hosted success

## Overview

Current root cause: valid `REMNOTE_CODEX_TOKEN` authenticates at `/mcp`, but the Codex principal has no stable token hash and no explicit Module for linking that principal to a live RemNote plugin session. `BridgeHub` treats Codex like connector compatibility and only tries single-active-plugin routing. That works only by accident and returns `PLUGIN_NOT_CONNECTED` when no safe target exists.

Target design: deepen the Codex routing Module. Its interface: stable Codex client hash in auth principal, explicit Codex pairing/link storage, server-local diagnostics, and `BridgeHub` routing that chooses linked plugin session first, safe single-active fallback second, pairing-required errors otherwise.

No blocking questions: pasted instruction + `Agents.md` + conductor docs define scope. No external docs needed; work stays inside existing TypeScript/Node/MCP patterns.

## Prerequisites

- Preserve ChatGPT hosted OAuth/pairing behavior.
- Preserve local-token behavior.
- Do not grant `bridge:delete` to Codex by default.
- Do not use IP address as authorization.
- Do not bypass focused Rem, trusted-write, or existing tool permission checks.
- Keep live proof separate from local proof.

## Sprint 1: Codex Identity And Storage

**Goal**: make Codex bearer auth addressable without storing raw tokens.

**Demo/Validation**:
- `npm run server:test:codex-bearer`
- focused typecheck after files compile

### Task 1.1: Stable Codex Principal
- **Location**: `server/src/auth/codex-token.ts`, `server/src/auth/types.ts`, `server/src/server/create-http-server.ts`
- **Description**: derive `codexClientHash = sha256(token)`, set `subject/userId = codex:<hash-prefix>`, attach `codexClientHash`, `codexRoutingMode`, optional `codexLinkId`.
- **Dependencies**: none
- **Acceptance Criteria**:
  - Missing/wrong token still 401.
  - Valid token never appears in logs/responses.
  - Principal has stable Codex identity and no delete scope.

### Task 1.2: Codex Link Storage
- **Location**: `server/src/storage/types.ts`, `server/src/storage/memory-store.ts`, `server/src/storage/postgres-store.ts`
- **Description**: add `CodexPairingSession` and `CodexClientLink` with hash-only token/client id fields.
- **Dependencies**: Task 1.1
- **Acceptance Criteria**:
  - Pending/approved/expired/revoked pairing sessions persist.
  - Revoked links do not route.
  - Postgres schema initializes without migration tooling.

## Sprint 2: Routing And Pairing

**Goal**: route Codex calls to the correct live plugin or return actionable pairing-required diagnostics.

**Demo/Validation**:
- `npm run server:test:codex-routing`
- `npm run server:test:codex-pairing`

### Task 2.1: BridgeHub Codex Routing
- **Location**: `server/src/bridge/session-router.ts`, `server/src/bridge-hub.ts`
- **Description**: add linked-session lookup, stale-link handling, single-active fallback, multiple-active refusal.
- **Dependencies**: Sprint 1
- **Acceptance Criteria**:
  - Linked Codex routes to linked `pairingId` user.
  - Zero active plugins returns structured `PLUGIN_NOT_CONNECTED`/pairingRequired.
  - Multiple active plugins returns `DEVICE_CONFLICT`/pairingRequired.
  - No IP-based authorization.

### Task 2.2: HTTP Pairing Flow
- **Location**: `server/src/auth/codex-pairing-routes.ts`, `server/src/server/create-http-server.ts`
- **Description**: add `POST /codex/pair/start`, `GET /codex/pair/:pairingId`, `GET /codex/connect?code=...`, `POST /codex/pair/approve`, `GET /codex/pair/status`.
- **Dependencies**: Sprint 1
- **Acceptance Criteria**:
  - Start requires valid Codex bearer.
  - Approval requires plugin session secret or an approved/connected hosted pairing.
  - Approved link points to hosted pairing/plugin session.
  - Expired/revoked pairing cannot route.

### Task 2.3: Site Architecture For Pairing UX
- **Location**: `server/src/auth/codex-pairing-routes.ts`
- **Description**: keep URL hierarchy shallow and predictable:
  - `/codex/pair/start`
  - `/codex/connect?code=USERCODE`
  - `/codex/pair/:pairingId`
  - `/codex/pair/approve`
  - `/codex/pair/status`
- **Dependencies**: Task 2.2
- **Acceptance Criteria**:
  - Browser page explains explicit approval.
  - Status route never exposes secrets.
  - Error copy distinguishes token auth from plugin routing.

## Sprint 3: Diagnostics, Tool Tier, Docs

**Goal**: Codex can debug server state without plugin routing.

**Demo/Validation**:
- `npm run server:test:hosted-diagnostics`
- `npm run server:test:tool-profile`

### Task 3.1: Server-Local Diagnostics
- **Location**: `server/src/tools/register-status-tools.ts`, `server/src/tools/register-diagnostic-tools.ts`, `server/src/server/create-http-server.ts`
- **Description**: add Codex fields: routing mode, pairing supported/required, active plugin count, link status, last request reached plugin.
- **Dependencies**: Sprint 2
- **Acceptance Criteria**:
  - `get_bridge_status` works with Codex when no plugin connected.
  - `get_bridge_diagnostics` works with Codex when no plugin connected.
  - `/health` and `GET /mcp` expose safe routing fields.

### Task 3.2: Tool Tier Safety
- **Location**: `server/src/server/create-http-server.ts`, `server/src/tool-policy.ts`
- **Description**: preserve `/mcp?tool_tier=mass_note_writer`, keep Codex default at configured safe tier, keep delete/danger off by default.
- **Dependencies**: Sprint 1
- **Acceptance Criteria**:
  - `tools/list` respects query tier.
  - Codex pairing never expands to danger profile by accident.

### Task 3.3: Documentation
- **Location**: `CODEX_MCP_SETUP.md`, `README.md`, `render.yaml`
- **Description**: document bearer-token mode, live/linked plugin requirement, pairing flow, smoke commands, required env vars.
- **Dependencies**: Sprint 2
- **Acceptance Criteria**:
  - Config uses `bearer_token_env_var = "REMNOTE_CODEX_TOKEN"`.
  - Docs say not to run `codex mcp login` for bearer mode.
  - Docs explain `PLUGIN_NOT_CONNECTED`, `CODEX_PAIRING_REQUIRED`, `DEVICE_CONFLICT`.

## Sprint 4: Regression Gates

**Goal**: prove local behavior and keep live boundary honest.

**Demo/Validation**:
- `npm run check-types`
- `npm run validate`
- `npm run build`
- `npm run server:build`
- `npm run server:smoke`
- `npm test`
- `npm run server:test:codex-bearer`
- `npm run server:test:codex-routing`
- `npm run server:test:codex-pairing`
- `npm run server:test:routing`
- `npm run server:test:hosted-diagnostics`
- `npm run server:test:tool-profile`
- `git diff --check`

## Testing Strategy

- Start with smoke tests that reproduce current gap: Codex auth reaches MCP but cannot route explicitly.
- Add dedicated Codex routing/pairing smoke scripts using fake hosted plugin sockets.
- Keep ChatGPT OAuth routing smoke green.
- Keep local no-plugin proof separate from live RemNote proof.

## Potential Risks And Gotchas

- Postgres schema changes must be additive and safe on existing Render DB.
- Expired links must not silently fall back to wrong active plugin.
- Multiple active plugin connections must never be guessed.
- Single-active fallback is only safe as explicit personal-mode fallback and must be visible in diagnostics.
- Tool permission logic must keep write/trusted-write gates unchanged.

## Rollback Plan

- Revert Codex route/storage/routing files only.
- Leave ChatGPT pairing and local bridge code untouched unless tests require a small compatibility hook.
- If live plugin still returns `PLUGIN_NOT_CONNECTED`, inspect `/health`, `get_bridge_status`, `get_codex_pairing_status`, and active plugin socket count before rerunning writes.
