# Codebase Map

Generated: 2026-06-02

## Repository State

- Branch: `feature/hosted-auth-pairing`
- Latest commit: `131ad34 small fixes`
- Controlling contract: `Agents.md`
- Task source: pasted RemNote MCP bridge direct-write and Nuclear Physics preset task.

## Directory Tree Summary

```text
.
  public/                         RemNote plugin manifest
  scripts/                        plugin build/dev scripts
  shared/bridge/                  SDK-free protocol and Markdown parser
  src/
    bridge/                       plugin WebSocket client, handler, pairing, status
    bridge/handlers/              plugin handler validation/scope/approval helpers
    remnote/                      RemNote SDK read/write/serialize/permission layer
    remnote/write/                split RemNote SDK write implementation modules
    widgets/                      RemNote plugin React widgets
  server/
    src/                          MCP HTTP server, auth, routing, storage, registry, tests
    src/auth/                     OAuth, dashboard session, pairing, local token, verifier
    src/bridge/                   hosted session routing, connection, retry/evidence helpers
    src/dashboard/                dashboard templates/pages
    src/security/                 redaction helper
    src/sessions/                 audit event types/logger
    src/storage/                  memory/postgres storage
    src/tools/                    MCP tool registration modules and schemas
  docs/                           audit, development, deployment, security docs
```

## Entry Points

- Plugin build entry: `src/widgets/index.tsx`
- Plugin status widget: `src/widgets/bridge-status.tsx`
- Plugin bridge client: `src/bridge/client.ts`
- Plugin request executor: `src/bridge/handlers.ts`
- RemNote SDK write barrel: `src/remnote/write/index.ts`
- Server build entry: `server/src/index.ts`
- Server HTTP/MCP assembly: `server/src/app.ts`, `server/src/server/create-http-server.ts`
- MCP tool registry/registration: `server/src/tool-registry.ts`, `server/src/tool-policy.ts`, `server/src/mcp-server.ts`, `server/src/tools/*`
- Hosted/local routing: `server/src/bridge-hub.ts`, `server/src/bridge/session-router.ts`
- Shared protocol/parser: `shared/bridge/protocol.ts`, `shared/bridge/markdown-importer.ts`

## Build Config

- Root TypeScript: `tsconfig.json` includes `src` and `shared`.
- Server TypeScript: `server/tsconfig.json` includes `server/src/**/*.ts` and `../shared/**/*.ts`; excludes plugin SDK/UI/runtime paths.
- Render: `render.yaml` uses `rootDir: server`, `buildCommand: npm ci && npm run build`, `startCommand: npm start`.
- Server start path: `node dist/server/src/index.js`.

## Current Build Output Boundary

`npm run server:build` passes. Current `server/dist` emits only server and shared files:

```text
server/dist/server/src/**
server/dist/shared/bridge/**
```

No plugin runtime files were found in `server/dist/src/remnote`, `server/dist/src/widgets`, or `server/dist/src/bridge/{client,handlers,pairing}`.

## Shared Candidates

Already shared:

- `shared/bridge/protocol.ts`
- `shared/bridge/protocol-core.ts`
- `shared/bridge/protocol-read.ts`
- `shared/bridge/protocol-write-args.ts`
- `shared/bridge/protocol-write-results.ts`
- `shared/bridge/protocol-messages.ts`
- `shared/bridge/protocol-registry.ts`
- `shared/bridge/markdown-importer.ts`

Remaining useful shared candidates:

- reusable note style preset constants
- direct write diagnostic decision shape
- tool definition single source of truth, if deeper registry cleanup continues

## Plugin-Only Files

- `src/widgets/**`
- `src/bridge/client.ts`
- `src/bridge/handlers.ts`
- `src/bridge/pairing.ts`
- `src/bridge/handlers/**`
- `src/remnote/**`

These may import `@remnote/plugin-sdk` and React where needed. They must not be imported by `server/src/**` or `shared/**`.

## Server-Only Files

- `server/src/app.ts`
- `server/src/server/create-http-server.ts`
- `server/src/index.ts`
- `server/src/auth/**`
- `server/src/storage/**`
- `server/src/bridge-hub.ts`
- `server/src/bridge/**`
- `server/src/tools/**`
- `server/src/mcp-server.ts`
- `server/src/tool-*`
- `server/src/health-check.ts`
- `server/src/*smoke.ts`, `server/src/area*.ts`

## Files Importing `@remnote/plugin-sdk`

Only plugin-side files import the RemNote SDK:

```text
src/widgets/index.tsx
src/widgets/bridge-status.tsx
src/remnote/read.ts
src/remnote/richTextFormatting.ts
src/remnote/serialize.ts
src/remnote/write/*
src/bridge/client.ts
src/bridge/handlers.ts
src/bridge/pairing.ts
src/bridge/handlers/*
```

No `server/src/**` or `shared/**` import of `@remnote/plugin-sdk` was found.

## Server/Plugin Boundary Check

Current static search found no live server imports from plugin-only implementation paths. `server/src/boundary-smoke.ts` contains string checks for those forbidden paths, which is expected.

## Oversized Files Ranked

Over 1000 lines:

```text
2184 Agents.md
1842 server/src/smoke.ts
1625 src/widgets/bridge-status.tsx
```

Over 800 lines:

```text
980 server/src/bridge-hub.ts
955 server/src/server/create-http-server.ts
860 chatgpt-app-submission.json
821 server/src/area3-certification.ts
```

Over 500 lines:

```text
739 server/src/storage/postgres-store.ts
723 server/src/health-check.ts
702 src/bridge/handlers/validation.ts
700 server/src/dashboard/templates.ts
684 src/remnote/write/remnoteSdkHelpers.ts
684 shared/bridge/markdown-importer.ts
681 src/remnote/read.ts
655 src/bridge/handlers.ts
650 src/remnote/write/structuredBatch.ts
606 src/remnote/write/formattingWrites.ts
577 server/src/auth/oauth-routes.ts
553 server/src/auth/chatgpt-pairing-routes.ts
```

## Files Mixing Responsibilities

- `server/src/server/create-http-server.ts`: HTTP routing, auth selection, MCP transport, dashboard, diagnostics, plugin API in one file.
- `server/src/bridge-hub.ts`: connection routing plus diagnostics still dense, though helper files exist.
- `src/widgets/bridge-status.tsx`: UI, pairing state, connection status, user controls.
- `server/src/smoke.ts`: broad smoke harness covering many concerns.
- `server/src/tool-policy.ts`: policy, profile/tier, metadata, summaries.

## Names That No Longer Match Behavior

- `toolTier` still exists as a compatibility alias beside canonical `toolProfile`.
- `create_folder` remains in protocol/map/plugin handler for compatibility, but should stay unsupported and non-public.
- `replace_rem` is public in the registry while classified dangerous; it should be hidden or gated until strong guards are complete.

## Dead, Empty, Placeholder, Duplicate

- Empty source files: none found.
- Empty non-source files: none found in current `find -empty` scan.
- Stale audit/doc risk: `docs/audits/audit-turn-2-post-repair.md` currently overclaims `READY_TO_DEPLOY` from prior work and must be replaced after this repair.
- Build/log artifacts exist in repo root (`PluginZip.zip`, `dev*.log`, `watch*.log`); avoid unnecessary churn unless user asks.

## Critical Dependency Graph

```text
ChatGPT MCP client
  -> server/src/server/create-http-server.ts
  -> server/src/mcp-server.ts
  -> server/src/tools/*
  -> server/src/bridge-hub.ts
  -> server/src/bridge/session-router.ts
  -> RemNote plugin WebSocket
  -> src/bridge/handlers.ts
  -> src/remnote/read.ts and src/remnote/write/*
  -> @remnote/plugin-sdk
```

Expected boundary graph:

```text
server/src/** -> shared/** plus server/src/**
src/** plugin -> shared/** plus @remnote/plugin-sdk/React
shared/** -> no server internals, no React, no RemNote SDK
```

## Circular Dependencies

No package-level circular dependency tool is installed. Visible imports do not show a direct source cycle across server/shared/plugin boundaries.

## Smoke-Only Tests

- `server/src/smoke.ts`: broad and assertion-heavy, but too large to act as focused regression suite.
- `server/src/area1-smoke.ts`: registry/parser/style checks; good home for preset and schema regression.
- `server/src/area2-smoke.ts`: hosted diagnostics/security checks.
- `server/src/area3-certification.ts`: mock MCP route certification; good home for direct-write trusted-mode regression.
- `server/src/boundary-smoke.ts`: boundary static check.
