# RemnoteMCP Release Readiness Audit

Status: `unlisted-beta-blocked`

Date: 2026-06-06
Branch: `feature/hosted-auth-pairing`

RemnoteMCP is not public-ready. The connector/schema/auth layer is repaired locally, and the new live smoke harness can prove tool execution through MCP, but this workspace did not have an active RemNote plugin WebSocket or disposable live test root. Real note-writing, style, math, flashcard, and danger-tool live gates remain blocked.

## Completed In This Pass

- Fixed structured writer transaction return handling.
- Disabled SDK transactions by default until live transaction proof passes.
- Made manual recursive structured/tree creation the default path.
- Put `createTreeWithMarkdown` fast path behind `REMNOTE_BRIDGE_ENABLE_MARKDOWN_TREE_FAST_PATH=1`.
- Added specific `SDK_CREATE_TREE_UNSUPPORTED`, `SDK_CREATE_TREE_EMPTY_RESULT`, and `TRANSACTION_RETURN_BUG` errors.
- Fixed safe whole-text highlight path to avoid child Rem pollution.
- Added child-pollution failure reporting for style-only operations.
- Fixed `verify_card_set` recognition for plugin-created card variants.
- Fixed post-mutation readback for `update_rem` and `update_rem_rich`.
- Removed OAuth security scheme metadata from no-auth connector compatibility tool registration.
- Added `server/src/live-tool-regression.ts` and `npm run bridge:live-tool-regression`.
- Added `docs/TOOL_EXECUTION_REPAIR.md`.
- Restored no-auth MCP discovery for `initialize`, `notifications/initialized`, and `tools/list`.
- Kept normal `tools/call` auth protected unless local no-token mode or explicit `REMNOTE_BRIDGE_CONNECTOR_COMPAT_NO_AUTH_TOOLS=1`.
- Added hosted connector compatibility routing: exactly one active plugin connection is routed; zero returns `PLUGIN_NOT_CONNECTED`; multiple returns `DEVICE_CONFLICT`.
- Added `/health`, `/status`, and diagnostics fields for connector compatibility and active plugin connection count.
- Simplified connector-facing schemas earlier in this branch for the known `preview_markdown_note_tree` schema blocker.
- Switched RemnoteMCP UI CSS to dark/black theme tokens earlier in this branch.
- Added `server/src/live-tool-smoke.ts`, which calls tools through MCP HTTP and writes JSON/Markdown reports.
- Added `server/src/connector-compat-routing-smoke.ts` with zero/one/multiple active hosted-connection coverage.
- Added diagnostic failure fields: layer, code, required/actual scope, permission mode/scope, recommended fix.
- Generated `TOOL_REFERENCE.md`.
- Added manual MCP curl tests in `docs/MCP_MANUAL_TOOL_TESTS.md`.

## Static Test Results

Passed:

```text
npm run check-types
npm run validate
npm run build
npm run server:build
npm run server:test:tool-schemas
npm run server:test:routing
npm run server:test:connector-compat-routing
npm run server:smoke
npm run server:test:performance
```

Build warnings:

```text
bridge-status.js and bridge-status-sandbox.js exceed webpack recommended size limits.
```

## Live Test Results

Command:

```bash
REMNOTE_BRIDGE_TOKEN=test-token REMNOTE_MCP_URL=http://127.0.0.1:47392/mcp npm run bridge:live-test
```

Result: failed, expected environment blocker.

Passed:

```text
tools/list
get_bridge_status
get_bridge_diagnostics
```

Failed:

```text
ping_remnote_plugin: PLUGIN_NOT_CONNECTED
get_plugin_status: PLUGIN_NOT_CONNECTED
get_focused_rem: PLUGIN_NOT_CONNECTED
search_rems: PLUGIN_NOT_CONNECTED
```

Skipped:

```text
sandbox_root: No MCP Regression Test Root found. Set REMNOTE_LIVE_TEST_PARENT_ID to a disposable Rem.
```

Live tool smoke report:

```text
server/reports/live-tool-smoke.json
server/reports/live-tool-smoke.md
```

Latest local no-plugin run:

```text
command: npm run bridge:live-tool-regression
result: failed honestly
reason: ECONNREFUSED 127.0.0.1:47392; local MCP server was not running for live regression
report: server/reports/live-tool-regression.json
```

## Performance Benchmark

Command:

```bash
npm run server:test:performance
```

Server-local/mock benchmark results:

| Benchmark | Total | Calls | Fallback | Status |
|---|---:|---:|---:|---|
| small_note | 2 ms | 1 | no | success |
| medium_5_9_style_note | 1 ms | 1 | no | success |
| large_formula_heavy_note | 9 ms | 1 primary, 5 internal | yes, 4 chunks | success_with_performance_warning |
| flashcard_set | 1 ms | 1 | no | success |
| table_note | 1 ms | 1 | no | success |
| repair_pass | 0 ms | 1 | no | success |
| template_based_note | 0 ms | 1 | no | success |

These are not real RemNote SDK timings.

## Permission And Manifest Review

Current manifest:

```text
requiredScopes: All + ReadCreateModifyDelete
requestNative: false
enableOnMobile: false
unlisted: true
```

Internal tiers map to RemNote permission intent as follows:

| Internal Tier | RemNote Level Intent | Scope Intent |
|---|---|---|
| Read Only | Read | Focused Rem / selected/approved root where possible |
| Read + Create | ReadCreate | Focused Rem + descendants for normal note creation |
| Read + Create + Modify | ReadCreateModify | Focused Rem + descendants or approved root |
| Full Control With Delete Approval | ReadCreateModifyDelete | Approved root or workspace only with explicit delete approval |
| Danger Zone | ReadCreateModifyDelete | Explicit user action, guarded delete/replace only |

Public release still needs a final RemNote manifest narrowing decision. Official docs to use before final review:

- https://plugins.remnote.com/advanced/permissions
- https://plugins.remnote.com/advanced/manifest
- https://plugins.remnote.com/advanced/settings
- https://plugins.remnote.com/advanced/storage

## Render Check

Commands:

```bash
curl -sS -i --max-time 20 https://remnote-plugin-template-react.onrender.com/status
curl -sS -i --max-time 20 https://remnote-plugin-template-react.onrender.com/health
curl -sS -i --max-time 20 https://remnote-plugin-template-react.onrender.com/mcp
```

Result:

```text
All three timed out after 20 seconds with 0 bytes received.
```

This does not prove local changes deployed.

## Remaining Blockers

- Deploy this branch or merge into the branch Render actually serves.
- Connect the RemNote plugin WebSocket to the same server under test.
- Set `REMNOTE_LIVE_TEST_PARENT_ID` or `REMNOTE_LIVE_TOOL_PARENT_ID` to a disposable Rem.
- Re-run `npm run bridge:live-test`.
- Re-run `npm run bridge:live-tool-smoke`.
- Live-prove tiny and medium `create_note_from_markdown_tree`.
- Live-prove `apply_structured_note_batch`.
- Live-prove `create_designed_note_tree` or hide it from normal tier with fallback guidance.
- Live-prove `verify_note_design`, one flashcard tool, one style tool, and `delete_rem_by_id` dry-run guard.
- Complete privacy review, security review, manifest permission review, and setup wizard review.
- Resolve or accept current widget bundle-size warnings before public listing.

## Decision

Do not mark RemnoteMCP public-ready. Current state is `unlisted-beta-blocked` until real RemNote plugin live smoke passes and Render serves the fixed branch.
