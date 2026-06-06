# RemnoteMCP Tool Execution Repair

Date: 2026-06-06

## Fixed

- `executeWriteOperation` now captures `plugin.app.transaction(fn)` return value directly.
- SDK transactions are disabled by default with `REMNOTE_BRIDGE_DISABLE_SDK_TRANSACTIONS=1` behavior until live RemNote transaction proof passes.
- Transaction telemetry now reports requested/supported/used, callback return, transaction return, fallback use, and created Rem IDs before failure.
- Structured/tree writes use manual recursive creation by default.
- `createTreeWithMarkdown` fast path is opt-in with `REMNOTE_BRIDGE_ENABLE_MARKDOWN_TREE_FAST_PATH=1` and falls back before any created IDs are ignored.
- `createTreeWithMarkdown` failures use `SDK_CREATE_TREE_UNSUPPORTED` or `SDK_CREATE_TREE_EMPTY_RESULT`.
- Style tools fail with `PARTIAL_FAILURE` if a style-only operation creates child Rems.
- `set_rem_highlight_color`, `apply_style_plan` whole-Rem highlight, and highlight commands now use rich-text full-range highlight by default.
- Native `rem.setHighlightColor` is experimental behind `REMNOTE_BRIDGE_ENABLE_NATIVE_REM_HIGHLIGHT=1`.
- MCP tool `_meta.securitySchemes` is emitted only for `hosted_oauth_required`, not no-auth connector compatibility.
- `verify_card_set` recognizes basic, concept, descriptor, cloze metadata, multiple-choice card-item children, and list-answer card-item children.
- `update_rem` and `update_rem_rich` re-read the Rem after mutation and return before/after verification.
- Added `server/src/live-tool-regression.ts`.

## Stable Tool Groups

Stable in static/mock smoke:

- System/read routing.
- Basic create/update/append/move/reorder mock paths.
- Structured batch mock path.
- Markdown preview/create mock path.
- Style tools with no child-pollution regression.
- Card creation and card verification mock paths.
- Danger dry-run/guard mock paths.

Live RemNote proof is still required before calling all tools production-ready.

## Fallback Tool Groups

- Structured tree writes: manual recursive path is default.
- Markdown tree fast path: disabled by default; enable only for live testing with `REMNOTE_BRIDGE_ENABLE_MARKDOWN_TREE_FAST_PATH=1`.
- SDK transactions: disabled by default; enable only for live testing with `REMNOTE_BRIDGE_DISABLE_SDK_TRANSACTIONS=0`.
- Native whole-Rem highlight: disabled by default; enable only for isolated investigation with `REMNOTE_BRIDGE_ENABLE_NATIVE_REM_HIGHLIGHT=1`.

## Hidden Or Gated Tools

- Real delete remains danger-gated and dry-run by default.
- Hosted no-auth tool calls require explicit connector compatibility config.
- Developer/debug tools should stay behind developer tool tier.

## Live Regression

Run with MCP server and RemNote plugin connected:

```bash
export REMNOTE_MCP_URL="http://127.0.0.1:47392/mcp"
export REMNOTE_BRIDGE_TOKEN="replace-with-local-token"
export REMNOTE_LIVE_TOOL_PARENT_ID="replace-with-disposable-test-root-rem-id"
npm run bridge:live-tool-regression
```

Reports:

```text
server/reports/live-tool-regression.json
server/reports/live-tool-regression.md
server/reports/live-tool-smoke.json
server/reports/live-tool-smoke.md
```

If `ECONNREFUSED 127.0.0.1:47392` appears, MCP server is not running. If `PLUGIN_NOT_CONNECTED` appears, MCP is up but RemNote plugin WebSocket is absent.

## Cleanup

Create live test content only under a disposable Rem. After successful live regression, delete that disposable root manually in RemNote or run guarded `delete_rem_by_id` dry-run first, then real delete only with explicit approval and ancestor/title guard.
