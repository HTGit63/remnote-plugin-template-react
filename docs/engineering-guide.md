# RemNote MCP Engineering Guide

Compressed from root docs, `docs/`, `conductor/`, and prior `AGENTS.md`.

## Version Identity

RemNote MCP uses two intentional version lanes. Root `package.json` and
`server/package.json` use `0.0.1` as internal implementation-package versions;
`public/manifest.json` uses `0.1.0` as the user-facing RemNote plugin product
version. Server runtime metadata follows the server package version, while the
plugin catalog/release identity follows the manifest version. Do not compare
these values as though they were one shared release counter.

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
- Hosted mode: shared plugin OAuth/pairing for ChatGPT and Codex. Local bridge token is not used for hosted MCP tool calls.
- Canonical deployment env values are `REMNOTE_BRIDGE_DEPLOYMENT_MODE=local` and `REMNOTE_BRIDGE_DEPLOYMENT_MODE=hosted`.
- Legacy mode aliases `local_dev`, `personal_hosted_token`, and `public_hosted_oauth` are still accepted by `server/src/config.ts` and covered by `npm run server:test:auth`; do not remove them without a migration test.
- Render should use the canonical hosted value plus `REMNOTE_BRIDGE_ENABLE_HOSTED_PAIRING=1`, `SESSION_SECRET`, and hosted allowed origins.
- `get_bridge_status` proves server/bridge state only. Plugin-routed proof needs `ping_remnote_plugin`, `get_focused_rem`, `get_children`, `get_rem_rich`, or write+readback.
- Hosted bridge WebSocket must not open to non-local URL until hosted session secret exists.
- `PLUGIN_NOT_CONNECTED` = server reachable, plugin socket absent.
- `fetch failed` / `curl: (7)` = server unreachable.

Important env/ops refs:

- Render env: hosted deployment mode, hosted pairing enabled, session/admin secrets, and OAuth configuration.
- Docs formerly split across `CODEX_MCP_SETUP.md`, `DEPLOY_RENDER.md`, `render-deployment.md`, `oauth-setup.md`, `pairing-flow.md`, `release-hardening.md`.
- Keep local/hosted semantics separate. Discovery remains unauthenticated; hosted unauthenticated `tools/call` returns an MCP `isError` OAuth challenge, while non-tool protected routes may use HTTP 401/403. Neither path reaches a tool handler.

### Shared ChatGPT And Codex Authentication

The hosted plugin uses one OAuth installation and provider authorization for ChatGPT and Codex. Connect and authorize the plugin in ChatGPT; Codex then uses that same plugin connection. There is no second Codex-specific server secret, client credential, or pairing route.

The shared authentication does not widen RemNote authority. Stored scopes, tool tier, trusted-write mode, plugin-session routing, and delete protection continue to apply to both clients. `REMNOTE_BRIDGE_TOKEN` remains only for local bridge development and must not be reused for OAuth access/refresh tokens, pairing codes, `SESSION_SECRET`, or `ADMIN_DEBUG_SECRET`.

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
- Bulk import job durability is explicit:
  - `memory_only` means plan/job state is process-local and lost on server restart.
  - `persistent` means plan/job JSON is stored through the configured storage provider.
  - Persistent bulk jobs include source text and must be treated as note-content-sensitive DB data.
  - Postgres persistence is proven only when `DATABASE_URL` is configured and `npm run server:test:bulk-storage` reports Postgres `PASS`.
- Canceling a bulk import job stops future chunk execution. It never deletes already written Rems.
- Resume only runs pending, partial, failed-safe, or written-not-verified chunks; verified chunks stay skipped.

## File-Backed Imports

- `plan_note_import_from_file` and `start_note_import_from_file` accept `sourceFilePath`, `filePath`, `path`, `sourceFileUri`, or `sourceFile`.
- Local paths require an authenticated local bridge token. `local_no_token`, connector-compatible no-auth, and hosted OAuth local-path reads are denied.
- Configure local roots with comma-separated absolute paths in `REMNOTE_MCP_SOURCE_FILE_ALLOW_ROOTS`. Defaults are `/mnt/data` and `~/Downloads/Remnote`; nonexistent roots remain unavailable.
- Local file checks use canonical paths. Relative traversal, encoded traversal, `file://` escape, connector URI escape, and symlink escape are denied.
- `REMNOTE_MCP_SOURCE_FILE_MAX_BYTES` defaults to 2 MiB and is capped by `REMNOTE_BRIDGE_MAX_WS_MESSAGE_BYTES`. Oversized files fail before parsing; HTTP tool bodies remain capped separately by `REMNOTE_BRIDGE_MAX_BODY_BYTES` (128 KiB by default).
- ChatGPT uses the top-level `sourceFile` file parameter declared through `_meta["openai/fileParams"]`. The official object fields are `download_url`, `file_id`, optional `mime_type`, and optional `file_name`.
- ChatGPT file references require hosted OAuth. Downloads require HTTPS on port 443, pin a public DNS address for the request, reject private/link-local/reserved addresses, follow at most three validated redirects, and enforce the same source-size cap.
- Signed ChatGPT download URLs are temporary input only and are never returned in tool output or stored in the bulk plan.
- Local automated tests prove descriptor shape, aliases, auth-lane separation, path/root/symlink denial, SSRF address denial, and size errors. Real ChatGPT Developer Mode file upload remains a separate live proof.

Local bridge file example:

```bash
export REMNOTE_BRIDGE_TOKEN='<local bridge secret>'
export REMNOTE_MCP_SOURCE_FILE_ALLOW_ROOTS='/absolute/path/to/imports'
export REMNOTE_MCP_SOURCE_FILE_MAX_BYTES='2097152'
```

Call `plan_note_import_from_file` with a path under that root and the authenticated local MCP endpoint. Hosted ChatGPT and Codex clients must use the top-level `sourceFile` input instead of a server-local path.

## Development Workflow

1. Read reports + code before edits.
2. Add failing regression test for behavior repair.
3. Patch smallest responsible module.
4. Run targeted test.
5. Run local gate bundle.
6. Run live retest only under disposable RemNote root.
7. Record exact proof boundary.

## Local Commands

### RemNote local plugin installation

RemNote loads this development plugin from a live HTTP server. Installing
`http://localhost:8080` does not copy the plugin bundle into RemNote. If the
server stops, the plugin disappears or its widget fails with
`ERR_CONNECTION_REFUSED`.

Use the durable service commands:

```bash
npm run dev:start
npm run dev:status
```

Only after `dev:status` reports ready, install this exact URL in RemNote:

```text
http://localhost:8080
```

Do not append `/manifest.json`. Keep the service running while using RemNote.
Useful recovery commands:

```bash
npm run dev:doctor
npm run dev:stop
```

The background service writes `.remnote-dev-server.log` and an owned PID file
in the repository. `dev:stop` refuses to signal a reused or unrelated PID.

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
