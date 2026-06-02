# Audit Turn 1 - Read-Only Architecture and Safety Audit

Generated: 2026-06-02

## Executive Summary

The prior architecture split is mostly in place: root build, server build, typecheck, and plugin validation pass; server build now emits only `server/**` and `shared/**`; server/shared no longer import the RemNote SDK.

The current task-specific failures are still real. Direct hosted MCP writes can be blocked in `server/src/tool-permissions.ts` before reaching the same plugin trusted-write route used by health checks. The error is generic `TRUSTED_WRITE_REQUIRED` and does not identify the blocking layer. Diagnostics do not expose a direct-write decision trace. The Nuclear Physics note style preset is absent from protocol schemas, Markdown import options, high-level write tools, and `verify_note_design`.

Additional safety drift remains: `replace_rem` is public while dangerous, direct write tool schemas omit `bridge:trusted_write` from OAuth metadata, `create_folder` is still protocol-callable internally though not public, and the existing Audit Turn 2 doc overclaims readiness.

Codebase map: `docs/audits/codebase-map.md`.

## Build Status

Commands run before implementation:

```text
npm run server:build
PASS - tsc -p server/tsconfig.json completed.

npm run build
PASS - plugin webpack build completed with 3 size warnings.

npm run check-types
PASS - root TypeScript check completed.

npm run validate
PASS - RemNote manifest validation completed.
```

Server dist boundary check:

```text
server/dist/server/src/**
server/dist/shared/bridge/**
```

No emitted plugin runtime files were found in server dist.

## Architecture Boundary Findings

- `server/tsconfig.json` includes `server/src/**/*.ts` and `../shared/**/*.ts`; it excludes plugin runtime paths.
- `src/bridge/protocol.ts` is now a re-export of `shared/bridge/protocol`.
- `server/src/**` imports shared protocol/parser from `../../shared/bridge/**`.
- `shared/**` imports no `@remnote/plugin-sdk`, React, or server internals in the current search.
- Remaining dense files are maintainability risks but not direct blockers for this task: `server/src/bridge-hub.ts`, `server/src/server/create-http-server.ts`, `src/widgets/bridge-status.tsx`, `server/src/smoke.ts`.

## Tool Registry Findings

- `create_folder` is not in `MCP_TOOL_REGISTRY`, and metadata marks it unsupported. Compatibility protocol/handler paths still exist.
- `delete_rem_by_id` is gated, not public by default.
- Legacy delete tools `delete_rem`, `delete_focused_rem`, and `delete_selected_rem` are absent.
- `replace_rem` remains public under `advanced_notes` and `full` despite dangerous classification. It should be hidden/gated until stronger guards and verification are complete.
- `requiredOAuthScopesForTool()` returns only `bridge:read` and `bridge:write` for safe writes, while `validateMcpToolPermission()` later demands `bridge:trusted_write`; ChatGPT discovery metadata can therefore understate requirements.
- `create_or_replace_note_from_markdown` is public and preferred, but live task evidence says it can partially fail. Current importer has rollback through structured batch but source-fidelity failure still reports rollback not attempted.
- `getHiddenMcpTools()` reports gated delete and unsupported static tools, but does not explain public-dangerous `replace_rem` as hidden because it is not hidden yet.

## Direct Write Approval Findings

Observed likely mismatch:

```text
direct MCP call
  -> hosted auth principal
  -> validateMcpToolPermission()
  -> requires bridge:trusted_write and trustedWriteMode=trusted-inside-scope
  -> blocks with TRUSTED_WRITE_REQUIRED
  -> plugin trusted-write/scope route is never reached
```

Health-check write path calls `hub.callPlugin(...)` from an already registered tool and can exercise plugin write permissions directly. Direct MCP tools are blocked earlier by server policy if OAuth scope metadata/session data are stale or incomplete.

Needed fix:

- Treat paired session trusted mode as the source for safe direct writes inside scope, without bypassing scope checks.
- Keep hosted destructive tools guarded by delete scope and plugin approval.
- Add structured direct-write decision diagnostics and layer-specific error codes.

## Markdown Importer Findings

- Parser supports H1-H4, paragraphs, blank lines, bullets, numbered lists, inline math, block math, code blocks, and tables-as-text.
- Default Markdown mapping already uses H1 root and H3 section/subsection headings.
- Parser inserts spacer nodes between headings, but spacer text defaults to a regular space. Nuclear preset requires zero-width-space spacer Rems as root-level siblings between H3 sections.
- Parser can accidentally insert a spacer before the first section heading; Nuclear preset should avoid leading spacer and ensure spacers are root-level siblings between sections.
- Style preset fields are absent from schemas and protocol args.
- `verify_note_design` currently checks explicit `expectedStyleMap`; it does not accept a preset expectation object or compute H1/H3/spacer/math structure automatically.

## Security Findings

- Hosted auth validates bearer presence, expiry, audience/issuer, pairing approval, scope grants, and trusted write mode.
- Server safe-write policy blocks before plugin route when trusted write grant is absent, but error lacks layer/source context.
- Destructive tools require `bridge:delete`; `delete_rem_by_id` checks dry-run/guards for real delete.
- `replace_rem` real writes require only `expectedPlainText` at server layer; pasted task requires stronger parent/ancestor/title guard or hiding. Hiding is safer for this iteration.
- Diagnostics expose recent requests and pending approval information through MCP diagnostic tool, which is authenticated through MCP flow. Route-level hosted diagnostics still need to remain protected by current server config/tests.

## Bloat and Dead-Code Findings

Oversized source hotspots:

```text
1842 server/src/smoke.ts
1625 src/widgets/bridge-status.tsx
980 server/src/bridge-hub.ts
955 server/src/server/create-http-server.ts
821 server/src/area3-certification.ts
739 server/src/storage/postgres-store.ts
723 server/src/health-check.ts
702 src/bridge/handlers/validation.ts
700 server/src/dashboard/templates.ts
684 src/remnote/write/remnoteSdkHelpers.ts
684 shared/bridge/markdown-importer.ts
```

Empty files: none found.

Stale docs: `docs/audits/audit-turn-2-post-repair.md` currently claims `READY_TO_DEPLOY`; must be replaced after actual post-repair verification.

## Tests Currently Present/Missing

Present scripts:

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
server:test:boundaries
```

Missing task-specific coverage:

- `direct-write-trusted-mode-regression`
- direct server permission decisions for `create_rem`, `apply_structured_note_batch`, `create_polished_note_tree`, `apply_style_plan`, `apply_remnote_command`
- Nuclear Physics generic style preset dry-run/parser/schema/verification regression
- `replace_rem` hidden/gated assertion
- `create_or_replace_note_from_markdown` preset schema support

## Deployment Config Risks

- `render.yaml` uses hosted env vars and includes `REMNOTE_BRIDGE_ENABLE_HOSTED_PAIRING=1`.
- Allowed origins include both `https://chatgpt.com` and RemNote domains.
- `REMNOTE_BRIDGE_DEPLOYMENT_MODE` is `public_hosted_oauth`; config must normalize this legacy value to hosted.
- Build command is deterministic (`npm ci && npm run build`) because `server/package-lock.json` exists.
- Deployment is not ready until direct-write trusted route and style preset tests pass and Audit Turn 2 is updated honestly.

## Prioritized Fix List

1. Fix server trusted-write permission routing for safe direct tools so paired trusted mode can reach plugin route.
2. Add layer-specific direct-write errors and diagnostics fields.
3. Add `bridge:trusted_write` to safe write OAuth metadata.
4. Hide/gate `replace_rem` from public tools until stronger guards are implemented.
5. Add `nuclear_physics_h1_h3_spacer_math` preset types, schemas, Markdown option normalization, and high-level tool fields.
6. Make Markdown parser insert zero-width spacer siblings between H3 sections for the preset and avoid leading spacer.
7. Extend `verify_note_design` for preset structure checks.
8. Add regression tests in existing smoke/certification suites.
9. Update `LIVE_TOOL_QA_REPORT.md`, `NUCLEAR_NOTE_STYLE_PRESET.md`, and Audit Turn 2.
10. Run required validation commands and report live-test availability honestly.

## Files Likely to Modify

```text
shared/bridge/protocol-write-args.ts
shared/bridge/protocol-write-results.ts
shared/bridge/markdown-importer.ts
server/src/tool-permissions.ts
server/src/mcp-server.ts
server/src/tool-policy.ts
server/src/tool-registry.ts
server/src/tools/schemas.ts
server/src/tools/register-write-tools.ts
server/src/tools/register-formatting-tools.ts
server/src/tools/register-diagnostic-tools.ts
server/src/area1-smoke.ts
server/src/area3-certification.ts
src/remnote/write/verification.ts
docs/audits/*
LIVE_TOOL_QA_REPORT.md
NUCLEAR_NOTE_STYLE_PRESET.md
```

## Files Likely to Remove

No source files are planned for removal. Safer path is to hide/gate unsafe public tools instead of deleting compatibility protocol paths.

## Risks

- Live RemNote bridge access may be unavailable in this headless environment; live test must not be faked.
- ChatGPT connector may require reconnect/refresh if OAuth scope metadata changes.
- Hiding `replace_rem` changes public tool list and may require docs/test updates.
- Nuclear preset verification depends on RemNote SDK readback for real H1/H3/math/spacer proof; local tests can prove parser/schema only.
