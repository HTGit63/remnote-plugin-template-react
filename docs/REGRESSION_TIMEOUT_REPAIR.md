# RemnoteMCP Timeout And DryRun Regression Repair

Date: 2026-06-06
Branch: `feature/hosted-auth-pairing`

## Source Failure

Latest live report showed:

- Dry-run tools entered approval wait, then timed out as `RETRYABLE_UNKNOWN_WRITE_STATUS`.
- `create_rem` timed out and left blank child Rem `hIVxYjpD9hWKvPhSx`.
- Approval wait and WebSocket forwarding were treated as mutation evidence.
- `search_rems` was too strict for focused-root scoped sessions.

## Fixed Behavior

| Failure | Before | After |
|---|---|---|
| DryRun approval | DryRun could request RemNote approval | `isDryRunRequest` bypasses approval and marks lifecycle `dry_run_planned` |
| DryRun timeout | Could become `RETRYABLE_UNKNOWN_WRITE_STATUS` | DryRun timeout stays normal retryable `TIMEOUT`/original failure |
| Approval timeout | Approval wait counted as plugin mutation evidence | Approval wait is not mutation evidence |
| Unknown write | Any forwarded write could become unknown | Unknown requires `sdk_mutation_started`, `partial_failure`, or mutation IDs |
| `create_rem` blank child | SDK markdown fast path could leave blank Rem | Manual create path is default, readback verifies non-blank text |
| Blank partial | Blank Rem could be silent | `PARTIAL_FAILURE` includes created ID and rollback result |
| Scoped search | Required full-kb globally | Context/focused-root scoped search passes current-rem-tree policy |
| Late responses | Dropped silently after timeout | Stored in diagnostics `lateResponses` with lifecycle and IDs |

## New Flags

```bash
REMNOTE_BRIDGE_ENABLE_SINGLE_MARKDOWN_FAST_PATH=1
```

Enables `plugin.rem.createSingleRemWithMarkdown` for isolated testing. Default is off.

Existing conservative flags:

```bash
REMNOTE_BRIDGE_DISABLE_SDK_TRANSACTIONS=1
REMNOTE_BRIDGE_ENABLE_MARKDOWN_TREE_FAST_PATH=0
REMNOTE_BRIDGE_ENABLE_NATIVE_REM_HIGHLIGHT=0
```

## Local Verification

Passed on this branch:

```text
npm run check-types
npm run validate
npm run server:build
npm run server:test:tool-schemas
npm run server:smoke
```

Still required for final proof:

```bash
npm run build
npm run bridge:live-tool-regression
```

Live regression requires the MCP server running, RemNote plugin connected, and `REMNOTE_LIVE_TOOL_PARENT_ID` or `REMNOTE_LIVE_TEST_PARENT_ID` pointing to a disposable Rem.

## Runtime Diagnostics To Check

For failed requests, inspect:

- `lifecycle`
- `pluginLifecycle`
- `lateResponses`
- `createdRemIds`
- `partialExecution`
- `errorCode`

Correct interpretation:

- `waiting_for_remnote_approval` only means approval wait.
- `forwarded_to_plugin` only means WebSocket transport.
- `sdk_mutation_started` or mutation IDs mean write/delete may have started.
