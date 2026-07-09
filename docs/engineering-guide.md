# RemNote MCP Engineering Guide

Compressed from root docs, `docs/`, `conductor/`, and prior `AGENTS.md`.

## Mission

RemnoteMCP = RemNote plugin + hosted/local companion server + MCP tool bridge. Goal: safe, scoped, verified ChatGPT writes into RemNote.

No fake readiness. Tool call success != behavior proof. Live proof needs plugin-routed read/write/readback under disposable root.

## Architecture

- Plugin UI/runtime: `src/`, RemNote SDK, bridge WebSocket client.
- Server/MCP: `server/src/`, HTTP/MCP routes, OAuth/bearer auth, hosted pairing, bridge hub.
- Shared protocol/parsers: `shared/bridge/`.
- Tool registry/policy: `server/src/tool-registry.ts`, `server/src/tool-policy.ts`, `server/src/tool-permissions.ts`.
- Bulk import: `server/src/tools/register-bulk-import-tools.ts`, `server/src/bulk-import/job-store.ts`, `shared/bridge/bulk-import.ts`, `shared/bridge/markdown-importer.ts`.
- Write handlers: `src/remnote/write/`.
- Read handlers: `src/remnote/read.ts`.

Runtime flow:

1. ChatGPT/Codex calls MCP tool.
2. Server validates auth, profile, scope, tier.
3. Server forwards plugin-bound op over WebSocket.
4. Plugin validates scope/permission.
5. Plugin calls RemNote SDK.
6. Server returns standard envelope with created/updated/deleted IDs, warnings, verification state.

## Modes And Auth

- Local mode: local bearer token required unless explicit dev bypass env set.
- Hosted mode: OAuth/pairing/Codex bearer. Local bridge token not used for hosted MCP tool calls.
- Canonical deployment env values are `REMNOTE_BRIDGE_DEPLOYMENT_MODE=local` and `REMNOTE_BRIDGE_DEPLOYMENT_MODE=hosted`.
- Legacy mode aliases `local_dev`, `personal_hosted_token`, and `public_hosted_oauth` are still accepted by `server/src/config.ts` and covered by `npm run server:test:auth`; do not remove them without a migration test.
- Render should use the canonical hosted value plus `REMNOTE_BRIDGE_ENABLE_HOSTED_PAIRING=1`, `SESSION_SECRET`, and hosted allowed origins.
- `get_bridge_status` proves server/bridge state only. Plugin-routed proof needs `ping_remnote_plugin`, `get_focused_rem`, `get_children`, `get_rem_rich`, or write+readback.
- Hosted bridge WebSocket must not open to non-local URL until hosted session secret exists.
- `PLUGIN_NOT_CONNECTED` = server reachable, plugin socket absent.
- `fetch failed` / `curl: (7)` = server unreachable.

Important env/ops refs:

- Render env: hosted deployment mode, hosted pairing enabled, secret bearer/token values.
- Docs formerly split across `CODEX_MCP_SETUP.md`, `DEPLOY_RENDER.md`, `render-deployment.md`, `oauth-setup.md`, `pairing-flow.md`, `release-hardening.md`.
- Keep local/hosted semantics separate. Do not “fix” expected 401/auth failures away.

## Safety Rules

- Confirm current focused Rem before writes.
- Create disposable root under intended focus.
- Write only under disposable root.
- Use idempotency key for every write.
- Verify every write by readback: `get_children`, `get_rem_breadcrumbs`, `get_rem_rich`, `get_rem_tree`, or tool verification with parent/text proof.
- Stop if focus/session/connection unclear.
- No destructive tools on real notes.
- Delete tools stay hidden/gated. Delete requires dry-run, title guard, parent/ancestor guard, explicit scope, user intent.

## Tool Tiers

- Basic/read: status, focus, children, search, breadcrumbs.
- Mass note writer: markdown preview/import, bulk jobs, verification.
- Note writer: create/update/write/card tools.
- Power/developer/danger: style mutation, diagnostics, broad profile, hidden tools.
- Active `danger` profile may expose far more than default. Do not treat danger matrix as default user profile.

## Import Rules

- Server code must not import RemNote SDK/plugin-only files.
- Plugin code handles RemNote SDK calls.
- Shared code must stay SDK-free.
- Boundary tests/smokes enforce this.

## Product Contract

- User wants high-fidelity note writing, not summaries.
- Preserve source order, headings, bullets, formulas, cards where requested.
- Prefer chunked bulk import for long notes.
- `written_not_verified`, `partial`, `failed`, `blocked`, `verified` stay distinct.

## Development Workflow

1. Read reports + code before edits.
2. Add failing regression test for behavior repair.
3. Patch smallest responsible module.
4. Run targeted test.
5. Run local gate bundle.
6. Run live retest only under disposable RemNote root.
7. Record exact proof boundary.

## Local Commands

Root:

```bash
npm test
npm run test
npm run build
```

Repo may not have root `lint` or `typecheck`. Record `COMMAND_NOT_AVAILABLE` if absent.

Server/extra gates from older docs:

```bash
npm run server:build
npm run server:smoke
npm run check-types
npm run validate
```

Use actual `package.json` scripts, not assumed names.

## Live Testing Protocol

Minimum safe live suite:

1. `get_bridge_status`
2. `ping_remnote_plugin`
3. `get_plugin_status`
4. `get_focused_rem`
5. `get_current_selection`
6. Create disposable root under focus.
7. Replay same idempotency key: expect zero new Rems.
8. Create child under root.
9. Verify root/child with `get_children` + breadcrumbs.
10. Preview markdown no-write.
11. Run tiny bulk only if safe.
12. Verify source fidelity.
13. Test formula/card/style only inside disposable root.
14. Write compact report note inside disposable root.

## Current Live Evidence — 2026-07-02

Focused Rem: `Plugin Test`, `OjLcSppWfIH0cpPoh`.

Disposable root: `HZDcF0Y62bF9ptbfd`.

Passed live:

- Bridge connected; plugin ping passed.
- Focus/selection confirmed.
- Root create verified parent/text.
- Same-key replay returned `already_applied`, zero created.
- Child create verified; breadcrumbs proved parent chain.
- Markdown preview no-write passed; inline math parsed.
- Basic flashcard passed with front/back/practice readback.
- `set_rem_text_color` + `set_rem_highlight_color` passed invariant checks; rich readback showed color/highlight.
- Short latency spot check passed.

Failed live:

- Tiny bulk job returned `PARTIAL`.
- `verify_note_import_job` returned `source_fidelity_failed`.
- Readback missed `Alpha source sentence.`
- Bullet B + formula nested under Bullet A.
- `create_flashcards_from_markdown` dry-run with `marker: both` emitted malformed extra basic card from cloze line.

Not live-proven:

- File-backed import.
- Full chapter import.
- Long stability soak.
- `apply_style_plan`.
- Cloze/MC/list-answer card writes.
- Different-parent duplicate proof.

## Keep Root Clean

Root markdown policy after cleanup:

- Keep `TOOL_REFERENCE.md`.
- Keep `log.md`.
- Do not add root `.md` unless user explicitly asks.
- Put future docs under `docs/engineering-guide.md` or `docs/remnote-mcp-repair-and-testing.md`.
