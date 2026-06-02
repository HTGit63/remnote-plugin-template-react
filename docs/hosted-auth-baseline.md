# Hosted Auth Baseline Document

Recorded on: 2026-05-25 (Current Local Time: 2026-05-25T18:57:04+03:00)

2026-05-26 update: this file is the pre-implementation baseline. Public-hosted OAuth, pairing, session storage, revocation, and per-user routing now exist at repo/local smoke level. See `docs/hosted-auth-design.md`.

## 1. Branch & Commit Context
- **Active Branch**: `feature/hosted-auth-pairing` (checked out from `release/final-polish`)
- **Commit SHA**: `caa8b6eec7c053a5fb408a9dbd36743077636eec`

## 2. Tool & Profile Registry Metrics
- **Total Registered MCP Tools (Registry)**: 50
- **Public Tool Count in Full Profile**: 47
- **Public Tool Count in Simple Profile**: 23
- **Removed Legacy Delete Tools**: legacy focus/selection/direct delete paths are no longer public or gated.

## 3. Environment & Deployment Specs
- **Render Deployment Shape**: Single-port personal companion server running WebSocket bridge client/companion hub and MCP server concurrently.
- **Current Authorization Method**: Static token security (`server/src/auth/local-token.ts`) using token verified via HTTP header `x-remnote-bridge-token` or query parameters.

## 4. Known Repository Limitations
1. Baseline: auth was purely local-token based, unsuitable for public multi-tenant hosted setup.
2. Baseline: hosted mode (`REMNOTE_BRIDGE_HOSTED_MODE=1`) was hard-blocked.
3. Baseline: auth/session types were structural placeholders.
4. Baseline: BridgeHub held exactly one active WebSocket plugin connection.
5. Baseline: Render service had no user-facing UI dashboard.
6. Baseline: plugin sent a static token in the WebSocket hello protocol.
7. Baseline: plugin messaging UI assumed a "local companion server".
