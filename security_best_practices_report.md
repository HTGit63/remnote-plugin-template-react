# RemNote MCP v0.1 Security and Finalization Audit

Date: 2026-07-17
Scope: local v0.1 candidate on `fix/remnote-mcp-mass-note-creation-stability`
Proof boundary: source inspection plus local automated regression. The candidate is not pushed, deployed, or live-retested.

## Outcome

No confirmed Critical or High severity issue remains open in the reviewed pairing, authorization, scope, bridge, and bulk-import paths. Four concrete findings were repaired. Auth, pairing, routing, boundary, security, build, and functional gates pass locally.

This is not a current dependency-vulnerability guarantee: both npm advisory requests were unable to reach the registry quick-audit service. It is also not a production penetration test or post-deploy TLS/edge audit.

| ID | Severity | Status | Result |
| --- | --- | --- | --- |
| `SEC-PAIR-001` | Medium | Fixed | Failed pairing-code throttling now keys on the actual socket peer, so a direct caller cannot reset the counter with spoofed `X-Forwarded-For` values. |
| `SEC-PAIR-002` | Medium | Fixed | Pairing metadata has explicit length limits and requested scopes must come from the supported four-scope allowlist. |
| `SEC-DOS-001` | Medium | Fixed | Environment values cannot raise HTTP bodies above 2 MiB, bridge messages above 8 MiB, or source files above 2 MiB. |
| `SEC-CONFIG-001` | Low | Fixed | The tracked development `.env` was removed. No production credential was found in that file; runtime configuration remains environment-owned and `.env` stays ignored. |

## Detailed findings

### `SEC-PAIR-001` — untrusted forwarding header bypassed pairing throttle

- Severity: Medium
- Location: `server/src/auth/chatgpt-pairing-routes.ts:160-185`
- Evidence: eight invalid codes using eight different forwarded IP headers are followed by a ninth request that must return HTTP 429 in `server/src/security-auth-regression-smoke.ts:161-174`.
- Impact before repair: an internet client connecting directly to the Node process could rotate a self-supplied header and avoid the per-client failed-code counter.
- Fix: ignore forwarding headers until a trusted-proxy boundary is explicitly configured; use `req.socket.remoteAddress`.
- Residual consideration: a production reverse proxy may cause many users to share one peer key. That is fail-closed for guessing but can create shared throttling. Add an explicit trusted-proxy allowlist before using proxy-derived addresses.
- False-positive notes: the pairing code is still time-limited and randomly generated; this finding was defense-in-depth, not evidence of a successful pairing takeover.

### `SEC-PAIR-002` — pairing metadata and scopes were not strictly bounded

- Severity: Medium
- Location: `server/src/auth/chatgpt-pairing-routes.ts:33-38,120-158`
- Evidence: a 121-character client name and the unknown `bridge:admin` scope both return HTTP 400 in `server/src/security-auth-regression-smoke.ts:99-109`.
- Impact before repair: oversized user-controlled fields could consume storage/log/UI capacity, while unknown scope strings could create ambiguous authorization records.
- Fix: field-specific string ceilings, maximum four scopes, and an exact allowlist of read/write/trusted-write/delete scopes.
- Residual consideration: downstream OAuth registration validation remains a separate layer and must stay enabled.

### `SEC-DOS-001` — size environment variables could disable practical abuse ceilings

- Severity: Medium
- Location: `server/src/config.ts:124-128,156-167,508-525,595-603`
- Evidence: `tests/timeout-budgets.test.ts` supplies extremely large environment values and proves the effective hard ceilings.
- Impact before repair: an accidental or hostile deployment configuration could permit very large HTTP, WebSocket, or source-file allocations.
- Fix: central `boundedNumberFromEnv` hard caps. Runtime limits now remain finite even when the environment requests larger values.
- Additional bulk limits: direct bulk source text is capped at 240,000 characters; native chunks are capped at 24,000 characters and 120 estimated Rems; a step runs at most five chunks (`server/src/tools/register-bulk-import-tools.ts:69-87,1234-1248`). Ordinary tree writes cap depth at 12 and nodes at 1,000 (`src/remnote/write/writeTypes.ts:4-8`).
- Residual consideration: an authorized user can still run multiple bounded jobs. Rate limits, write scope, plugin ancestry checks, idempotency, and per-step confirmation remain necessary layers.

### `SEC-CONFIG-001` — repository-tracked local environment file

- Severity: Low
- Location: deleted root `.env`; root `.gitignore` retains `.env` coverage.
- Evidence: the removed file contained development placeholders/configuration rather than a confirmed production secret. Its values are intentionally not reproduced here.
- Impact before repair: tracked environment files normalize a pattern that can later capture secrets and mix deployment configuration with source history.
- Fix: remove it from the product tree and keep local/runtime values outside Git.
- Residual consideration: prior Git history was not rewritten. If a real secret is ever discovered in history, rotate it first, then perform a separately authorized history-cleaning operation.

## Controls verified

| Area | Local evidence | Security property |
| --- | --- | --- |
| Hosted startup | `server/src/config.ts:376-401` | Hosted mode requires explicit enablement, a session secret, an absolute HTTPS public URL, authentication, and at least one allowed browser origin. |
| HTTP boundary | `server/src/http.ts:5-12,26-50,83-101,104-123` | Loopback host checks, constant-time token comparison, security headers, exact-origin CORS, and bounded JSON reads. |
| Pairing lifecycle | `server:test:pairing`, `server:test:security` | Short-lived codes, authenticated disconnect, malformed-body rejection, bounded metadata, allowed scopes, and failed-code throttling. Tokens/codes are stored as hashes. |
| OAuth/session | `server:test:auth`, `server:test:codex-bearer`, `server:test:routing` | S256 PKCE, rotating/revocable tokens, authenticated hosted calls, and no query-string debug secret bypass. |
| Server tool policy | `server/src/tool-permissions.ts:58-143,196-320` | Every exposed tool has a fail-closed category, required RemNote access scope, and write/trusted-write/delete policy. Missing policies are rejected. |
| Plugin write policy | `src/remnote/permissions.ts:13-77,177-243` | Read, safe-write, and destructive tools are separated. Delete/replace always require approval and suitable mode. |
| Rem scope | `server:test:boundaries`, plugin ancestry helpers | Server scope is checked before routing; plugin permission scope and ancestor-chain checks enforce the actual target. Full-KB changes require explicit full-KB approval. |
| File import | `server/src/bulk-import/source-file-loader.ts:188-317,320-377,380-460,485-519` | Allowed local roots, canonical paths, no symlink following, regular-file check, byte limit, authenticated callers, public HTTPS-only remote download, DNS pinning, private-address blocking, redirect cap, and timeout. |
| Connector compatibility | `server:test:connector-compat-routing` | Compatibility no-auth exposure is read-only and separately gated; it does not become a write bypass. |
| Reconnect/approvals | bridge runtime/channel/panel regressions | Sidebar disposal cannot stop transport; approval responses are request-ID bound; online recovery and manual Connect recycle stale sockets; local Disconnect remains effective when remote revocation is offline. |

## Scope and abuse model

The safe default remains a focused Rem or its approved descendant tree. ChatGPT cannot silently expand that scope: server access rank is checked first, then the plugin checks its configured permission mode/scope and the target ancestry. If the user deliberately approves `full-kb`/`workspace_allowed`, ChatGPT may read or modify other Rems because that is the requested capability. Destructive delete/replace operations remain separately gated and approval-bound.

Large note creation is bounded rather than disabled. One request/job step cannot import an arbitrary amount: body/file/message ceilings, schema text limits, tree node/depth limits, chunk sizes, at-most-five chunks per step, timeout budgets, request rate limiting, and idempotency all apply. A fully authorized user can intentionally execute multiple bounded steps; preventing that would also prevent the requested long-note workflow.

## Tests 03, 12, and 14 confirmation

| Test | Local repair status | Honest remaining boundary |
| --- | --- | --- |
| 03 | Confirmed code defects fixed: dry-run uses the same static preflight as live execution; unsupported headings are not promised; successful style plans return unique outer `updatedRemIds`. | Existing-Rem native heading mutation remains `SDK_UNSUPPORTED` because the installed RemNote SDK path can create visible metadata pollution. This is truthful limitation handling, not a simulated pass. |
| 12 | Confirmed supported-path defects fixed: native `Size`/`Color` metadata is filtered from content reads, formula classification is narrower, direct Concept-to-Descriptor evidence is recognized, rich styles survive repair, and failure envelopes remain truthful. | The same existing-Rem native heading limitation remains. Supported repair behavior is locally covered; full visual/runtime acceptance requires the deployed plugin. |
| 14 | Confirmed wrapper defect fixed: each chunk's `maxNodes` derives from estimated Rem count and exact source-manifest units, covering the reproduced 40-node table rather than enforcing 30. | The repaired code is not deployed. Two persistent live runs plus current PostgreSQL durability proof remain required before release. |

## Verification record

| Gate | Result |
| --- | --- |
| `npm test` | PASS — 32 files, 292 tests |
| `npm run check-types` | PASS |
| `npm run validate` | PASS — RemNote SDK 0.0.46 |
| `npm run build` | PASS — existing bundle-size warnings only |
| `npm run server:build` | PASS |
| Auth/pairing/Codex/routing/connector/security/boundaries/hosted smoke gates | PASS |
| Tool schemas, core, advanced, diagnostics, structured depth, Markdown importer, source fidelity, style correctness | PASS |
| Idempotency, health routing, performance, full server fault smoke | PASS |
| Bulk storage | Memory/CAS PASS; PostgreSQL BLOCKED because `DATABASE_URL` is not configured |
| Root and server npm advisory lookup | BLOCKED — registry quick-audit request unavailable; no current zero-vulnerability claim |

## Open proof gaps

1. Push/deploy/reload this exact candidate, then verify public TLS/edge headers, pairing, CORS, reconnect soak, and native UI rendering.
2. Rerun the required live Tests 03, 11–14, and one independent Test 15 control at the deployed candidate. Do not reinterpret native heading `SDK_UNSUPPORTED` as failure or success.
3. Run PostgreSQL restart/CAS durability with a fresh `DATABASE_URL` at the final candidate.
4. Re-run root and server production dependency audits when the npm advisory service is reachable, and remediate any returned finding by severity.
5. Require the repository CI workflow and branch protection after push.

The local candidate is suitable for commit as a version 0.1 release candidate. It is not yet proven as the deployed production release.
