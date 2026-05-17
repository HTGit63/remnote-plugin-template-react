# Final Polish Phase 2 Runtime Fixes

Generated: 2026-05-17
Branch: `release/final-polish`

## Scope

Phase 2 only. No UI redesign, no new tools, no registry expansion.

## Completed Fixes

```text
connection retry behavior: done
search_rems scoped ancestor filtering: done
delete_rem_by_id real delete verification shape: done
clear_rem_formatting honest partial output: done
```

## Runtime Behavior

Connection flicker handling now separates safe retry from unknown mutation status:

```text
read tools: retry once after reconnect
safe idempotent writes: retry only when idempotencyKey exists
non-idempotent writes: no auto-retry
real delete: no silent auto-retry
unknown write after forwarded request: RETRYABLE_UNKNOWN_WRITE_STATUS
unknown delete after forwarded request: RETRYABLE_UNKNOWN_DELETE_STATUS
```

`search_rems` now post-filters scoped results by ancestor chain and returns scope metadata:

```text
scopeRequested
scopeEnforcement
rawResultCount
filteredResultCount
filteredOutCount
```

`delete_rem_by_id` real delete now returns deletion verification fields when the SDK confirms the Rem no longer resolves:

```text
verifiedDeleted: true
verification.readAfterDelete: not_found
```

`clear_rem_formatting` now reports partial state when installed SDK support cannot reset all Rem-level formatting:

```text
ok: false
status: formatting_partially_cleared
unsupported.wholeRemHighlightReset: true
warnings: present
```

## Validation

```text
npm run check-types: pass
npm run server:build: pass
npm run server:smoke: pass
npm run build: pass with existing webpack asset-size warnings for bridge-status bundles
npm run bridge:live-test: failed/unavailable, fetch failed against http://127.0.0.1:47392/mcp because no live companion server/plugin loop was reachable
git diff --check: pass
```

## Phase 2 Verdict

```text
connection flicker returns clean retryable states: yes
search_rems respects scoped ancestor filtering: yes
delete_rem_by_id real delete verifies deletion: yes
clear_rem_formatting reports partial state honestly: yes
server smoke confirms existing formatting/card/note tools still pass: yes
live RemNote plugin loop verified: unavailable in this shell session
```
