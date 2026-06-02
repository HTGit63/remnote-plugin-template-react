# Codebase Map

Generated: 2026-06-02

## Repository State

- Branch: `feature/hosted-auth-pairing`
- Latest commit: `f8edd1e enhnaced and fast tools for the mcp`
- Controlling contract: `Agents.md`

## Directory Tree Summary

```text
.
  public/                         RemNote plugin manifest
  scripts/                        plugin build/dev scripts
  src/
    bridge/                       plugin WebSocket client, handler, pairing, SDK-free protocol/parser today
    remnote/                      RemNote SDK read/write/serialize/permission layer
    remnote/write/                intended write split, currently mostly barrel wrappers
    services/                     empty directory
    widgets/                      RemNote plugin React widgets
  server/
    src/                          MCP HTTP server, auth, routing, storage, registry, tests/smokes
    src/auth/                     OAuth, dashboard session, pairing, local token, token verifier
    src/bridge/                   hosted session routing and plugin connection helpers
    src/dashboard/                dashboard templates/pages
    src/security/                 redaction helper
    src/sessions/                 audit event types/logger
    src/storage/                  memory/postgres storage
    src/tools/                    MCP tool registration modules
  docs/                           older phase docs plus audit output
```

## Entry Points

- Plugin build entry: `src/widgets/index.tsx`, `src/widgets/bridge-status.tsx`
- Plugin bridge entry: `src/bridge/client.ts`
- Plugin request executor: `src/bridge/handlers.ts`
- RemNote SDK write surface: `src/remnote/write/index.ts`
- Server build entry: `server/src/index.ts`
- Server HTTP/MCP entry: `server/src/app.ts`
- MCP tool registry/registration: `server/src/tool-registry.ts`, `server/src/tool-policy.ts`, `server/src/mcp-server.ts`, `server/src/tools/*`
- Hosted/local routing: `server/src/bridge-hub.ts`, `server/src/bridge/session-router.ts`

## Build Config

- Root TypeScript: `tsconfig.json` includes only `src`.
- Server TypeScript: `server/tsconfig.json` currently includes `src/**/*.ts` and `../src/bridge/**/*.ts`, with `rootDir: ".."`.
- Render: `render.yaml` uses `rootDir: server`, `buildCommand: npm install && npm run build`, `startCommand: npm start`.

## Current Build Output Boundary

`npm run server:build` passes, but emits plugin files into `server/dist/src/**`, including:

```text
server/dist/src/bridge/client.js
server/dist/src/bridge/handlers.js
server/dist/src/bridge/pairing.js
server/dist/src/remnote/read.js
server/dist/src/remnote/write/index.js
server/dist/src/widgets not emitted in current run, but RemNote SDK write/read runtime is emitted
```

This proves server build success is not boundary-safe.

## Shared Candidates

Move or create SDK-free shared files under `shared/**`:

- `src/bridge/protocol.ts` -> `shared/bridge/protocol.ts`
- `src/bridge/markdown-importer.ts` -> `shared/bridge/markdown-importer.ts`
- style normalization and tree limit helpers currently embedded in `src/remnote/write/index.ts`
- tool definition metadata currently split across `server/src/tool-registry.ts`, `server/src/tool-policy.ts`, protocol annotations, and MCP schemas

## Plugin-Only Files

- `src/widgets/**`
- `src/bridge/client.ts`
- `src/bridge/handlers.ts`
- `src/bridge/pairing.ts`
- `src/remnote/**`

These import `@remnote/plugin-sdk`, React, or RemNote SDK objects and must not be in server build output.

## Server-Only Files

- `server/src/app.ts`
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

```text
src/widgets/index.tsx
src/widgets/bridge-status.tsx
src/remnote/read.ts
src/remnote/richTextFormatting.ts
src/remnote/serialize.ts
src/remnote/write/index.ts
src/bridge/client.ts
src/bridge/handlers.ts
src/bridge/pairing.ts
```

## Server Imports From Plugin Tree

```text
server/src/mcp-server.ts -> ../../src/bridge/protocol.js
server/src/mcp-tool-map.ts -> ../../src/bridge/protocol.js
server/src/health-check.ts -> ../../src/bridge/protocol.js
server/src/bridge-hub.ts -> ../../src/bridge/protocol.js
server/src/tools/tool-context.ts -> ../../../src/bridge/protocol.js
server/src/local-mode-smoke.ts -> ../../src/bridge/protocol.js
server/src/routing-smoke.ts -> ../../src/bridge/protocol.js
server/src/area1-smoke.ts -> ../../src/bridge/markdown-importer.js and protocol
server/src/area2-smoke.ts -> ../../src/bridge/protocol.js
server/src/area3-certification.ts -> ../../src/bridge/protocol.js
server/src/smoke.ts -> ../../src/bridge/protocol.js
```

These should move to `shared/bridge/**`.

## Oversized Files Ranked

Over 1000 lines:

```text
3454 src/remnote/write/index.ts
2348 src/bridge/handlers.ts
2184 Agents.md
2094 README.md
1841 server/src/smoke.ts
1743 src/bridge/protocol.ts
1625 src/widgets/bridge-status.tsx
1295 server/src/bridge-hub.ts
```

Over 800 lines:

```text
969 server/src/app.ts
818 server/src/area3-certification.ts
```

Over 500 lines:

```text
739 server/src/storage/postgres-store.ts
723 server/src/health-check.ts
700 server/src/dashboard/templates.ts
681 src/remnote/read.ts
645 src/bridge/markdown-importer.ts
577 server/src/auth/oauth-routes.ts
553 server/src/auth/chatgpt-pairing-routes.ts
```

## Files Mixing Responsibilities

- `src/remnote/write/index.ts`: errors, caches, style normalization, rich text, CRUD writes, cards, batch, Markdown import, verification, delete.
- `server/src/app.ts`: route dispatch, dashboard rendering data, auth selection, MCP transport, diagnostics, health, plugin API.
- `src/bridge/handlers.ts`: parsing/validation, approval UI payloads, scope checks, execution dispatch, lifecycle logging.
- `src/bridge/protocol.ts`: protocol types, tool lists, annotations, error factory, status shapes.
- `server/src/tool-registry.ts` and `server/src/tool-policy.ts`: overlapping source of truth.

## Names That No Longer Match Behavior

- `src/remnote/write/basicWrites.ts`, `treeWrites.ts`, `structuredBatch.ts`, `formattingWrites.ts`, `cardWrites.ts`, `writeTypes.ts`: currently re-export from `index.ts`; not true split modules.
- `server/src/tool-policy.ts`: includes tier/profile and metadata, not only policy.
- `docs/final-polish-*`: historical phase docs, not current production truth.

## Dead, Empty, Placeholder, Duplicate

- Empty files: `dev-server.err.log`, `watch8090.err.log`.
- Empty directory: `src/services`.
- Placeholder-style split files under `src/remnote/write/*.ts` are barrel wrappers, not real modules.
- Stale docs with old phase claims: `docs/final-polish-*.md`, old public tool count claims in `README.md` and `NEXT_STEPS.md`.

## Critical Dependency Graph

```text
ChatGPT MCP
  -> server/src/app.ts
  -> server/src/mcp-server.ts
  -> server/src/tools/*
  -> server/src/bridge-hub.ts
  -> WebSocket plugin client
  -> src/bridge/handlers.ts
  -> src/remnote/read.ts and src/remnote/write/index.ts
  -> @remnote/plugin-sdk
```

Expected graph after repair:

```text
server/src/** -> shared/** only
src/** plugin -> shared/** plus @remnote/plugin-sdk/React as needed
shared/** -> no server, no plugin SDK, no React
```

## Circular Dependencies

No package-level circular dependency tool is installed. Visible circular-like issue:

- `src/remnote/write/*.ts` re-export from `src/remnote/write/index.ts`, while `index.ts` owns all implementations. This defeats segmentation but is not a runtime import cycle unless callers import both sides.

## Smoke-Only Tests

- `server/src/smoke.ts`: large end-to-end smoke with many assertions but overloaded.
- `server/src/area1-smoke.ts`: registry/importer assertions, but no boundary test.
- `server/src/area2-smoke.ts`: hosted diagnostics smoke, not full security matrix.
- `server/src/area3-certification.ts`: tool profile and certification assertions, but no docs count extraction or server dist boundary check.
- Missing root script: `server:test:boundaries`.

## Refactor Targets

1. Move SDK-free protocol/parser to `shared/bridge/**`.
2. Add static boundary test before relying on server build.
3. Replace write barrel shells with real implementation modules or a smaller orchestrating barrel.
4. Split app route helpers enough that `server/src/app.ts` is no longer the main god file.
5. Canonicalize tool profile/registry data and make hidden tools honest.
