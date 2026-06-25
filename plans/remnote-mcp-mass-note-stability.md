# RemnoteMCP Mass Note Stability Plan

## Status

In progress on `fix/remnote-mcp-mass-note-creation-stability`.

## Checklist

- [x] Preserve baseline branch.
- [x] Add `mass_note_writer` profile.
- [x] Make `create_or_replace_note_from_markdown` the default bulk writer.
- [x] Hide design/card/debug/delete tools from default profile.
- [x] Add registry/source/deploy metadata fields.
- [x] Add standard tool response envelope.
- [x] Add phase-duration reporting from lifecycle events.
- [x] Add guarded cleanup flags and current-session creation ledger.
- [x] Bound `verify_card_set` with caps and timeout.
- [x] Add empty-root fast path for `verify_card_set`.
- [x] Make mass-note audit output report static readiness as explicit static statuses, not fake live `PASS`.
- [x] Bind `serverVersion` to `packageVersion`.
- [x] Add card creation read-back verification fields.
- [x] Add Vitest unit/mock test runner.
- [x] Add in-flight idempotency guard for concurrent structured batch writes.
- [x] Add direct styled-tree rollback reporting on partial failure.
- [x] Capture markdown fast-path fallback reasons.
- [x] Tighten style-only child order invariant.
- [x] Add configurable timeout/reconnect budgets for bulk reliability.
- [x] Add server-side resumable bulk import planner/job tools.
- [x] Add normalized plain-text bulk import source-fidelity checks.
- [x] Prevent false verified status without explicit verification evidence.
- [x] Track chapter root, section root, and chunk parent Rem IDs in bulk manifests.
- [x] Add fake bridge coverage for timeout, disconnect, resume, readback, and duplicate root prevention.
- [x] Run all required local gates.
- [ ] Run live 15/50/100-node write proof with disposable cleanup when RemNote plugin is connected.

## Live Proof Boundary

Local registry, type, build, and smoke success is not live RemNote write proof. Live proof requires a connected plugin, approved write scope, disposable parent Rem, write verification, replay/idempotency, and cleanup verification.

## 2026-06-20 Code-Only Checkpoint

Local verification passed:

- `npm run check-types`
- `npm run validate`
- `npm run build` (passes with existing `bridge-status` bundle-size warnings)
- `npm run server:build`
- `npm run server:smoke`
- `npm run server:test:tool-profile`
- `npm run test:style-correctness`
- `npm run server:mass-note-audit`

Latest generated readiness report:

- `reports/remnote-mcp-readiness-audit-2026-06-20T17-33-19-191Z.md`
- `reports/remnote-mcp-readiness-audit-2026-06-20T17-33-19-191Z.json`

Readiness stats: `PASS=2`, `FAIL=0`, `PARTIAL=9`, `GATED=5`. This is not live RemNote proof.

## 2026-06-21 Reliability Repair Checkpoint

Local proof added:

- `npm test` runs Vitest unit/mock tests without RemNote open.
- Static audit rows no longer use runtime `PASS`.
- Structured batch same-key concurrent calls share one running write.
- Direct styled tree failure attempts rollback of created Rem IDs and reports removed/failed IDs.
- Markdown tree fast-path fallback stores the SDK error message.

Live proof remains not run until a connected RemNote plugin and disposable parent root are available.

## 2026-06-22 No-Live Bulk Reliability Checkpoint

Added prompt-specific no-live reliability work:

- `plans/remnote-mcp-bulk-note-reliability-plan.md`
- `docs/bulk-import.md`
- configurable timeout budgets:
  - `REMNOTE_BRIDGE_DEFAULT_REQUEST_TIMEOUT_MS`
  - `REMNOTE_BRIDGE_HIGH_LEVEL_WRITE_TIMEOUT_MS`
  - `REMNOTE_BRIDGE_BULK_STEP_TIMEOUT_MS`
  - `REMNOTE_BRIDGE_READ_TIMEOUT_MS`
  - `REMNOTE_BRIDGE_MUTATION_TIMEOUT_MS`
  - `REMNOTE_BRIDGE_WRITE_APPROVAL_TIMEOUT_MS`
  - `REMNOTE_BRIDGE_RECONNECT_RETRY_WINDOW_MS`
  - `REMNOTE_BRIDGE_RECONNECT_RETRY_INTERVAL_MS`
- server-side bulk tools:
  - `plan_note_import`
  - `start_note_import_job`
  - `run_note_import_job_step`
  - `get_note_import_job_status`
  - `resume_note_import_job`
  - `verify_note_import_job`
  - `cancel_note_import_job`

Current job storage is memory-only and explicitly reported as not durable across server restart. Live RemNote proof is still not run.

## 2026-06-23 Bulk Verification Honesty Checkpoint

Fixed remaining bulk-job reliability gaps from the review prompt:

- Successful chunk write without `verification.passed === true` now becomes `written_not_verified`, not `verified`.
- Progress counts only chunks with `status` verified/skipped and `verificationStatus: passed`.
- Resume re-enters `written_not_verified`, `partial`, and failed chunks; verified chunks are the only normal skip path.
- Chunk execution ensures `Chapter -> Section -> Chunk` placement with idempotent chapter/section root creation.
- Duplicate chapter/section roots are detected by normalized title under parent and reported for manual review.
- `verify_note_import_job` returns `not_verifiable` when readback is unavailable and can verify from supplied text or live `get_rem_tree`.
- Timeout details include idempotency key when available.
- Readiness audit now includes registry/schema versions plus optional local gate result table.

Live RemNote proof remains `LIVE_TEST_NOT_RUN` until a connected plugin socket and disposable root are available.

## 2026-06-25 Problem Tool Matrix Checkpoint

Added/updated:

- `docs/tool-audit.md`
- `docs/design-tools.md`
- `docs/live-testing.md`
- `tests/tool-status-matrix.test.ts`

Current policy:

- default profile remains `mass_note_writer`
- `preview_markdown_note_tree` is server-local when exposed
- `create_note_from_markdown_tree` is documented as legacy/fallback
- `update_rem_rich`, `apply_remnote_command`, and `clear_rem_formatting` remain higher-tier style tools
- `create_folder`, `delete_rem_by_id`, and `replace_rem` remain hidden/gated with explicit reasons

Local proof must be rerun after this checkpoint. Live RemNote proof is still gated by connected plugin and disposable root.
