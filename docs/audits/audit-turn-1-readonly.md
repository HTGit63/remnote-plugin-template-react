# Audit Turn 1 - Read-Only Architecture and Safety Audit

Generated: 2026-06-02

## Executive Summary

The root and server builds currently pass, but the server build is not deploy-boundary safe. `server/tsconfig.json` still compiles plugin-side `src/bridge/**`, which pulls in plugin handlers and RemNote SDK read/write code into `server/dist/src/**`. Tool registry and docs also drift: `delete_rem_by_id` is in the default core profile, `getHiddenMcpTools()` returns no entries, `exposeDeleteTool` is ignored, `create_folder` remains protocol/call-map/registration code, and docs hard-code stale `47 public tools` claims.

Security is improved from earlier local/hosted work but not production-ready. Hosted dashboard/root routes can expose PID/cwd and live diagnostics, `/diagnostics` is not hosted-admin protected, hosted permission validation enforces scope but not trusted write/delete intent, and diagnostics can still overclaim registry-only callability.

Markdown importer exists and is wired, but parser/fidelity still need stronger structure/count/pollution verification. Write code split files exist, but they are thin re-export shells, so `src/remnote/write/index.ts` remains a 3454-line god file.

Codebase map: `docs/audits/codebase-map.md`.

## Build Status

Commands run before implementation:

```text
npm run server:build
PASS - tsc -p server/tsconfig.json completed.

npm run build
PASS - plugin webpack build completed, with 3 webpack size warnings.
```

Important caveat:

```text
server/dist/src/bridge/client.js
server/dist/src/bridge/handlers.js
server/dist/src/bridge/pairing.js
server/dist/src/remnote/read.js
server/dist/src/remnote/write/index.js
```

These outputs prove the server build still compiles plugin-side runtime files despite passing.

## Architecture Boundary Findings

- `server/tsconfig.json` includes `../src/bridge/**/*.ts`.
- Server files import `../../src/bridge/protocol.js` and `../../src/bridge/markdown-importer.js`.
- Because `src/bridge/client.ts` imports `handlers.ts`, and `handlers.ts` imports RemNote write/read modules, the server build emits RemNote SDK-dependent plugin runtime files.
- No `shared/**` directory exists yet.
- Server package does not list `@remnote/plugin-sdk`, which is correct, but current server build still relies on root-side plugin source availability.
- `src/remnote/write/*.ts` split modules are not real implementation modules; they re-export from `index.ts`.

## Dependency Graph

Current risk path:

```text
server/tsconfig include ../src/bridge/**
  -> src/bridge/client.ts
  -> src/bridge/handlers.ts
  -> src/remnote/write/index.ts
  -> @remnote/plugin-sdk
```

Required path:

```text
server/src/** -> shared/bridge/**
src/** plugin -> shared/bridge/** + @remnote/plugin-sdk
shared/** -> no SDK, no React, no server internals
```

## Server/Plugin/Shared Import Violations

Violations found:

```text
server/src/mcp-server.ts -> ../../src/bridge/protocol.js
server/src/mcp-tool-map.ts -> ../../src/bridge/protocol.js
server/src/health-check.ts -> ../../src/bridge/protocol.js
server/src/bridge-hub.ts -> ../../src/bridge/protocol.js
server/src/tools/tool-context.ts -> ../../../src/bridge/protocol.js
server/src/area1-smoke.ts -> ../../src/bridge/markdown-importer.js
server/src/*smoke.ts and area certs -> ../../src/bridge/protocol.js
```

No direct `@remnote/plugin-sdk` import was found in `server/src`, but compiled output still contains plugin SDK-dependent files because server build includes plugin bridge source.

## Tool Registry Findings

- `delete_rem_by_id` is in `CORE_TIER_TOOLS`; default/core exposes a dangerous delete tool.
- `getAllPublicMcpToolNames(exposeDeleteTool)` ignores `exposeDeleteTool`.
- `getHiddenMcpTools()` always returns `[]`.
- `replace_rem` has `policy: dangerous` but metadata category is `write`, creating a classification mismatch.
- `create_folder` remains in bridge protocol, map, handler, and MCP registration code; metadata marks unsupported, but registration still exists.
- `callabilitySource: "registry_only_not_live_execution"` appears in registry summaries and tests expect it, which can sound like callability proof.
- Docs hard-code old tool counts (`47 public MCP tools`) instead of generating counts from source.
- `debug_get_raw_rich_text` is in developer diagnostics tier, but full profile also exposes it; normal profile currently excludes it.

## Markdown Importer Findings

- `create_or_replace_note_from_markdown` is wired through registry, MCP registration, bridge protocol, plugin handler, write executor, and smoke tests.
- Parser supports H1-H4, paragraphs, blank lines, bullets, numbered lists, inline math, block math, code blocks, and tables-as-text.
- Fidelity check is still snippet-based: it checks that source snippets appear in output text.
- Fidelity output lacks required counts for headings/paragraphs/bullets/math/code/table in `verifyMarkdownSourceFidelity`.
- Pollution Rem detection is handled later in `verifyNoteDesign`, not integrated in parser/source-fidelity report.
- Rollback exists in structured batch path; Markdown verification failure currently reports `rollbackStatus: "not_attempted"` for source-fidelity failure.
- Parser tests are local-only and do not require live RemNote, but stronger structural tests are needed.

## Security Findings

- Hosted OAuth token verifier checks expiry, audience/issuer, pairing approval, and OAuth scopes.
- `validateMcpToolPermission` checks access scope only. It does not enforce:
  - `bridge:trusted_write` for `requiresTrustedWrite`
  - `trustedWriteMode: "trusted-inside-scope"` or approval path
  - `bridge:delete` plus guard fields for destructive tools
- `/` renders dashboard with PID, cwd, uptime, recent tool data, and live status without hosted admin protection.
- `/diagnostics` uses local bearer authorization path; hosted mode needs admin session/secret or local-only restriction.
- `/health` returns `bridge` and pairing summary; hosted public health should be more minimal.
- Redaction helper exists, but diagnostics route can expose internal bridge/session data.
- `render.yaml` requests hosted mode but lacks `REMNOTE_BRIDGE_ENABLE_HOSTED_PAIRING=1`.
- `render.yaml` allowed origins include `https://www.remnote.com` but not `https://remnote.com`.

## Bloat and Dead-Code Findings

Oversized implementation files:

```text
3454 src/remnote/write/index.ts
2348 src/bridge/handlers.ts
1743 src/bridge/protocol.ts
1625 src/widgets/bridge-status.tsx
1295 server/src/bridge-hub.ts
969 server/src/app.ts
```

Dead/empty/placeholder:

```text
src/services/                    empty directory
dev-server.err.log               empty log
watch8090.err.log                empty log
src/remnote/write/*.ts           barrel placeholders, not true split modules
docs/final-polish-*.md           stale phase docs
```

## Tests Currently Present/Missing

Present scripts include most requested root commands:

```text
check-types
validate
build
server:build
server:smoke
server:test:tool-profile
server:test:health-check-routing
server:test:structured-depth
server:test:style-schema
server:test:markdown-importer
server:test:source-fidelity
server:test:performance
server:test:security
```

Missing:

```text
server:test:boundaries
```

Existing tests assert some registry/importer/profile behavior but do not fail on:

- server dist emitting plugin runtime files
- `server/src` importing plugin tree
- `shared` importing SDK/React/server internals
- docs tool-count drift

## Deployment Config Risks

- Render build command uses `npm install && npm run build`; deterministic `npm ci` is available because `server/package-lock.json` exists.
- Hosted mode validation requires `REMNOTE_BRIDGE_ENABLE_HOSTED_PAIRING=1`; `render.yaml` omits it.
- `REMNOTE_BRIDGE_TOOL_PROFILE` is set to `simple`, which normalizes to `core`; docs should use canonical `core`.
- Hosted CORS origin list misses bare `https://remnote.com`.
- Server start command currently matches emitted path `node dist/server/src/index.js`, but build output layout is polluted by `rootDir: ".."`.

## Prioritized Fix List

1. Create `shared/bridge/**`, move SDK-free protocol and Markdown importer there, and update imports.
2. Fix `server/tsconfig.json` include/exclude and add `server:test:boundaries`.
3. Add boundary script checking imports and `server/dist` output.
4. Fix registry/profile behavior: remove delete from core, make `exposeDeleteTool` meaningful, make hidden-tool reporting honest, align `replace_rem`, keep `create_folder` unsupported/non-public.
5. Harden hosted diagnostics/dashboard/health output and hosted write/delete permission checks.
6. Improve Markdown source-fidelity report counts/structure/pollution checks and tests.
7. Split `src/remnote/write/index.ts` into real modules or at least move substantial sections out.
8. Update Render config and deployment docs.
9. Remove empty placeholder files/directories and stale phase docs, with changelog.
10. Run all required gates and write Audit Turn 2.

## Files Likely to Modify

```text
server/tsconfig.json
package.json
server/package.json
render.yaml
server/src/*
server/src/tools/*
server/src/tool-registry.ts
server/src/tool-policy.ts
server/src/tool-permissions.ts
server/src/mcp-tool-map.ts
server/src/mcp-server.ts
src/bridge/*
src/remnote/*
src/remnote/write/*
shared/bridge/*
README.md
ARCHITECTURE.md
SAFETY.md
NEXT_STEPS.md
DEPLOY_RENDER.md
docs/development/*
docs/deployment/*
docs/security/*
docs/audits/*
```

## Files Likely to Remove

```text
dev-server.err.log
watch8090.err.log
src/services/ if no longer needed
stale docs/final-polish-*.md if retained information is superseded
```

Generated build artifacts under `dist/` and `server/dist/` are ignored by git and should not be treated as source removals.

## Risks

- Full real split of `src/remnote/write/index.ts` is large and can cause regressions if rushed.
- Moving protocol imports affects server, plugin, and tests simultaneously.
- Hosted security route changes may break older dashboard assumptions; tests must pin safe behavior.
- Manual golden test requires live RemNote plugin access and must not be faked.
- Docs are very stale; update must avoid claiming production readiness if live hosted/manual proof remains missing.
