# Bulk Note Import Reliability

This bridge supports long Markdown imports as a bounded, resumable job workflow:

```text
plan -> start job -> run bounded step -> checkpoint -> resume -> verify -> report
```

This workflow is designed for ChatGPT/MCP limits. It does not rely on one large tool call.

## Safe Focused-Rem Rule

Before any write:

1. Call `get_focused_rem`.
2. Confirm the title and ID are the intended focused Rem.
3. Use that focused Rem ID as `targetRootId`.
4. Write only under that focused Rem or a disposable child created under it.
5. Stop if focus cannot be confirmed.

Do not use a remembered Rem ID as proof. A remembered ID can be useful context, but live controlled writes require a fresh focused-Rem read.

## Tools

- `plan_note_import`: parses source Markdown into ordered sections and chunks. No RemNote write.
- `plan_note_import_from_file`: reads a local server-side source file, extracts a bounded chapter span, and creates a plan. No RemNote write.
- `start_note_import_job`: creates an in-memory manifest from a saved plan. No RemNote write.
- `start_note_import_from_file`: combines file-backed planning and job creation. No RemNote write.
- `run_note_import_job_step`: ensures chapter/section roots, then writes one bounded chunk through `create_or_replace_note_from_markdown`.
- `get_note_import_job_status`: returns progress, failed chunks, created IDs, and next action.
- `resume_note_import_job`: continues from the first pending, unverified, partial, or failed chunk.
- `verify_note_import_job`: checks normalized plain-text readback from supplied text or live `get_rem_tree` when available.
- `cancel_note_import_job`: cancels future steps. It never deletes content.

`run_note_import_job_step` uses chunk-level idempotency:

```text
bulk-import:{jobId}:section:{sectionKey}:chunk:{chunkIndex}:source:{sourceHash}
```

Agents should use this chunked job flow for long chapters instead of one huge write. Verified chunks are skipped on resume. Written-only chunks are not skipped unless readback or explicit verification proves them safe. A changed source hash for the same chunk is rejected by the job store instead of rewritten.

## Full Chapter From Source File

Use the file-backed tools when the source is too large or too important to paste through a model/tool-call message.

Example:

```json
{
  "sourceFilePath": "/mnt/data/Nuclear Phyiscs.md",
  "startMarker": "# Chapter One:",
  "stopBeforeMarker": "# Chapter Two:",
  "targetRootId": "focused-rem-id-from-get_focused_rem",
  "rootTitle": "Nuclear Physics — Chapter One Bulk Import Test",
  "sourceNormalization": "auto",
  "options": {
    "maxCharsPerChunk": 6000,
    "maxRemsPerChunk": 30
  }
}
```

The server reads the file, finds the marker line even when it is exported as `- # Chapter One:`, stops before Chapter Two, and normalizes RemNote-exported heading bullets into Markdown headings before planning. Normal content bullets remain normal list/child content and are not imported as visible dash prefixes.

Safety limits:

- File paths must be under `REMNOTE_MCP_SOURCE_FILE_ALLOW_ROOTS`, the repo root, OS temp, `/mnt/data`, or `$HOME/Downloads/Remnote`.
- Files larger than 2 MB are rejected.
- The plan stores raw source hash, extracted Chapter span hash, planned write-source hash, source lengths, marker lines, and normalization mode.

Acceptance checks:

- `sourceMetadata.extractedSourceLength` is the raw Chapter One span length.
- `plannedSourceLength` is the normalized source length that will be written.
- `sourceMetadata.stopMarkerFound` must be true when `stopBeforeMarker` is supplied.
- Planned chunks must not contain Chapter Two text.
- Final verification must compare readback against the planned source after documented normalization.

## Hierarchy

Target structure:

```text
target root, e.g. Plugin Test
  optional import root, e.g. Nuclear Physics — Chapter One Bulk Import Test
    chapter root, e.g. Chapter One
    section root, e.g. 1.1 ...
      chunk content
```

The job manifest tracks:

```text
targetRootId
importRootTitle
importRootRemId
chapterRootRemId
chapterTitle
sectionRootRemId
sectionKey
sectionTitle
chunkParentRemId
createdRemIds
updatedRemIds
```

Import root, chapter, section, and chunk writes use separate idempotency keys. Before creating an import root, chapter, or section root, the bridge reads existing children and reuses a normalized title match. Duplicate title matches are reported for manual review instead of silently creating another root.

Chunks write section body content under the section root. They do not rewrite the section heading as another child, so section headings are not duplicated.

## Status Meanings

- `written`: write completed, but not enough evidence to claim source fidelity.
- `written_not_verified`: write returned success without explicit `verification.passed === true`; resume must retry with same idempotency key or verify by readback.
- `verified`: explicit verification passed or readback later proved source fidelity.
- `partial`: timeout or unknown write state; mutation may have started.
- `partial_needs_verification`: readback or manifest evidence is incomplete; inspect before retry.
- `not_verifiable`: no live/readback evidence available; do not claim success.
- `source_fidelity_failed`: normalized plain-text readback did not match expected source.

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

Timeout errors include request ID, tool, timeout, duration, lifecycle, mutation risk, retry safety, idempotency key when present, and a recommended next action.

## Reconnect And Late Responses

Transient failures wait for a configurable reconnect window before retry. Non-idempotent writes do not retry blindly. Unknown write status returns a retryable failure that tells the caller to inspect target state or resume with the same idempotency key. If a mutation may have started, the chunk is not marked cleanly failed; it remains partial until readback or idempotent resume clarifies state.

After timeout, disconnect, partial write, missing verification, or duplicate detection:

1. Call `get_note_import_job_status`.
2. If status is `partial`, `written_not_verified`, or `partial_needs_verification`, call `verify_note_import_job` with live/readback evidence when possible.
3. If verification is unavailable, call `resume_note_import_job` to retry the same chunk with the same idempotency key.
4. If duplicate chapter/section roots are reported, stop automated resume and inspect the target root manually.
5. Never delete cleanup targets unless they are disposable current-session Rems under the test root.

Late plugin responses are recorded in bridge diagnostics with lifecycle and mutation evidence when present.

## Source Fidelity

`verify_note_import_job` performs normalized plain-text comparison when actual readback text is supplied or when live `get_rem_tree` succeeds. It checks expected chunk text, duplicate chunk text, chunk order, missing/extra text previews, and created/updated ID presence. It tolerates line ending, heading marker, and bullet marker differences, but it does not claim full rich-text/math rendering verification unless live RemNote readback provides enough evidence.

Final verification checks:

- chapter root exists in readback
- sections exist in expected order
- duplicate sections are reported
- planned source hash and readback hash are returned
- normalized match percentage is returned
- missing and extra text previews are returned
- Chapter Two text is rejected
- visible dash-heading pollution is rejected
- duplicate chunk content is rejected

Without live readback, verification returns `not_verifiable` and explains that only manifest state was checked.

## Design Workflow

Content fidelity comes first. Styling must never change plain text, child order, or child count.

Named presets:

- `clean_academic`: default design contract for readable generated notes.
- `exam_ready`: clean academic hierarchy with stronger study/exam intent.
- `colorful_study`: same safe hierarchy with optional color emphasis where later style tools support it.
- `minimal`: headings only, no spacer Rems.
- `formula_heavy`: preferred for physics/math notes.
- `nuclear_physics_h1_h3_spacer_math`: backwards-compatible alias.

Recommended physics flow:

1. Import source content first with the bulk workflow.
2. Verify content by readback.
3. Apply or verify styling with `formula_heavy` or `exam_ready`.
4. Run `verify_note_design` with the same preset.
5. If style verification reports plain-text or child-order mutation, treat the styling step as failed even if the content import passed.

Style-only operations are guarded by mutation invariants in the plugin write layer. If the RemNote SDK changes plain text, child order, or creates children during style-only work, the tool reports failure instead of returning a false pass.

## Individual Tool Audit Workflow

Audit tools in a disposable root under the focused Rem.

- Read-only tools: safe to run after focus confirmation.
- Safe-write tools: require disposable root and idempotency key.
- Destructive tools: dry run only unless the user explicitly approves a disposable target.
- Style-only tools: verify plain text, child order, and child count before and after.
- Final table columns: tool, category, status, target, created, updated, deleted, verification, warning, cleanup.

Skip a tool only with a written reason such as unsupported SDK capability, blocked permission, missing live plugin, or destructive operation outside the disposable root.

## Manual Plugin Test Checklist

Do not run this unless RemNote is open, the plugin is connected, and the target root exists.

Target:

```text
Plugin Test
ID: OjLcSppWfIH0cpPoh
```

Steps:

1. Confirm focused Rem live with `get_focused_rem`.
2. Create or use a disposable root under Plugin Test.
3. Call `plan_note_import_from_file` or `start_note_import_from_file`.
4. Confirm Chapter One extracted, Chapter Two excluded, sections 1.1 to 1.5 present, and hashes/lengths recorded.
5. Call `run_note_import_job_step` repeatedly with `maxChunks: 1`.
6. Interrupt after a few chunks if possible.
7. Call `get_note_import_job_status`.
8. Call `resume_note_import_job`.
9. Finish all chunks.
10. Call `verify_note_import_job` after readback is available.
11. Confirm no duplicate sections or chunks.
12. Confirm all created Rems are under Plugin Test.
13. Confirm no visible dash prefixes before headings/notes.
14. Confirm formulas survived normalized readback.
15. Apply/verify design preset only after content verification.
16. Write a final report inside RemNote under the disposable root.

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

Verdict rules:

- `NOT_READY`: static checks or focused workflows fail.
- `STATIC_READY_NEEDS_LIVE_TEST`: code checks pass, but live plugin/socket is unavailable.
- `READY_FOR_CONTROLLED_LIVE_TEST`: local/static gates pass and live test instructions are ready.
- `LIVE_PROVEN_READY`: only after a real live Plugin Test run passes readback with full-source proof.

## Related Release Docs

- Tool visibility, profile policy, and problem-tool classifications: `docs/tool-audit.md`.
- Optional design/styling rules and mutation invariants: `docs/design-tools.md`.
- Controlled live test checklist and verdict definitions: `docs/live-testing.md`.

Normal ChatGPT bulk-note work should stay on the `mass_note_writer` profile. Use `create_or_replace_note_from_markdown` for bounded notes and the resumable `plan/start/run/resume/verify` job flow for long chapters. Legacy Markdown-tree and style/design/card tools remain higher-tier or hidden until live proof supports broader exposure.
