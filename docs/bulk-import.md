# Bulk Note Import Reliability

This bridge supports long Markdown imports as a bounded, resumable job workflow:

```text
plan -> start job -> run bounded step -> checkpoint -> resume -> verify -> report
```

This workflow is designed for ChatGPT/MCP limits. It does not rely on one large tool call.

## Tools

- `plan_note_import`: parses source Markdown into ordered sections and chunks. No RemNote write.
- `start_note_import_job`: creates an in-memory manifest from a saved plan. No RemNote write.
- `run_note_import_job_step`: writes one bounded chunk through `create_or_replace_note_from_markdown`.
- `get_note_import_job_status`: returns progress, failed chunks, created IDs, and next action.
- `resume_note_import_job`: continues from the first pending, partial, or failed chunk.
- `verify_note_import_job`: checks manifest state and optional normalized plain-text readback.
- `cancel_note_import_job`: cancels future steps. It never deletes content.

`run_note_import_job_step` uses chunk-level idempotency:

```text
bulk-import:{jobId}:section:{sectionKey}:chunk:{chunkIndex}:source:{sourceHash}
```

Verified chunks are skipped on resume. A changed source hash for the same chunk is rejected by the job store instead of rewritten.

## Storage

Current job storage is memory-only:

```text
memory storage is not durable across server restart
```

This is safe for local/dev and automated tests. A persistent adapter can be added behind the same manifest interface later.

## Timeout Environment Variables

All values are bounded. Invalid values fall back safely.

```text
REMNOTE_BRIDGE_DEFAULT_REQUEST_TIMEOUT_MS
REMNOTE_BRIDGE_HIGH_LEVEL_WRITE_TIMEOUT_MS
REMNOTE_BRIDGE_BULK_STEP_TIMEOUT_MS
REMNOTE_BRIDGE_READ_TIMEOUT_MS
REMNOTE_BRIDGE_MUTATION_TIMEOUT_MS
REMNOTE_BRIDGE_WRITE_APPROVAL_TIMEOUT_MS
REMNOTE_BRIDGE_RECONNECT_RETRY_WINDOW_MS
REMNOTE_BRIDGE_RECONNECT_RETRY_INTERVAL_MS
```

Defaults:

```text
read: 30000 ms
ordinary mutation: 60000 ms
high-level write: 180000 ms
bulk step: 240000 ms
write approval: 30000 ms
reconnect retry window: 30000 ms
reconnect retry interval: 400 ms
```

Timeout errors include request ID, tool, timeout, duration, lifecycle, mutation risk, retry safety, and a recommended next action.

## Reconnect And Late Responses

Transient failures wait for a configurable reconnect window before retry. Non-idempotent writes do not retry blindly. Unknown write status returns a retryable failure that tells the caller to inspect target state or resume with the same idempotency key.

Late plugin responses are recorded in bridge diagnostics with lifecycle and mutation evidence when present.

## Source Fidelity

`verify_note_import_job` performs normalized plain-text comparison when actual readback text is supplied. It tolerates line ending and bullet marker differences, but it does not claim full rich-text/math rendering verification unless live RemNote readback provides enough evidence.

Without live readback, verification returns `not_verifiable` and explains that only manifest state was checked.

## Manual Plugin Test Checklist

Do not run this unless RemNote is open, the plugin is connected, and the target root exists.

Target:

```text
Plugin Test
ID: OjLcSppWfIH0cpPoh
```

Steps:

1. Create a disposable root under Plugin Test: `Bulk Import Manual Test - <timestamp>`.
2. Use a long Markdown sample with at least five sections.
3. Make one section large enough to split into three or more chunks.
4. Call `plan_note_import`.
5. Call `start_note_import_job`.
6. Call `run_note_import_job_step` repeatedly with `maxChunks: 1`.
7. Interrupt after a few chunks if possible.
8. Call `get_note_import_job_status`.
9. Call `resume_note_import_job`.
10. Finish all chunks.
11. Call `verify_note_import_job` after readback is available.
12. Confirm no duplicate sections or chunks.
13. Confirm all created Rems are under Plugin Test.
14. Confirm source-fidelity report passes or clearly explains limitations.

Expected final state:

```text
completed: true
sections verified: all
chunks verified: all
duplicates: none
wrong parent: none
manual cleanup required: false
```

If it fails, capture:

```text
jobId
sectionKey
chunkIndex
createdRemIds
last error
recommended next command
manual cleanup status
```
