# RemNote MCP Repair And Testing

Compressed from old docs, test matrix, repair plan, audits, live reports, and cleanup notes.

## Evidence Labels

- `OLD_REPORT_EVIDENCE`: old ChatGPT RemNote MCP reports.
- `NEW_REPORT_EVIDENCE`: new ChatGPT RemNote MCP reports.
- `CODE_EVIDENCE`: current repo code.
- `LIVE_RETEST_EVIDENCE`: current Codex live mini-suite, 2026-07-02.
- `INFERENCE`: reasoned link, not direct proof.
- `UNKNOWN`: not proven.

## Priority Scheme

- P0 — Safety and correctness blockers
- P1 — Tool reliability and verification gaps
- P2 — Bulk import, resume, and no-duplicate quality
- P3 — Styling, card, formula, and readability improvements
- P4 — Reporting and developer experience

## Test 01-15 Status

| Test | Area | Old | New | Current live | Main repair |
|---|---|---|---|---|---|
| 01 | Preflight/focus/scope | PASS | PASS_WITH_WARNING | PASS_VERIFIED narrow path | Keep focus/root/readback gate |
| 02 | Tool visibility/profile | PASS_WITH_WARNINGS | PASS_WITH_WARNINGS | PASS_WITH_WARNING, danger profile exposed | Separate default vs danger profile |
| 03 | Default tool audit | PARTIAL | FAILED_VERIFICATION | Not rerun full | Fix source fidelity + file path |
| 04 | Read/search consistency | PASS_WITH_WARNINGS | PARTIAL | Read children/breadcrumbs passed narrow path | Bound reads, report scope truth |
| 05 | Safe write/idempotency | FAILED_VERIFICATION | PASS_WITH_WARNINGS | PASS_VERIFIED same-key replay | Preserve zero-duplicate replay |
| 06 | Markdown preview/planning | PARTIAL | PARTIAL | Preview passed no-write | File plan still blocked |
| 07 | Small bulk workflow | FAILED_VERIFICATION | FAILED_VERIFICATION | FAIL_VERIFIED | Fix source coverage + hierarchy |
| 08 | Full file import | BLOCKED | BLOCKED | Not run safety reason | Define hosted connector-file boundary |
| 09 | Resume/retry/partial | BLOCKED | FAILED_VERIFICATION | PASS dry-run, actual chunk failed | Short keys, durable jobs, no rewrite verified chunks |
| 10 | Duplicate/scope/cleanup | FAILED_VERIFICATION | PASS_WITH_WARNINGS | Not rerun full | Finish different-parent proof |
| 11 | Formula fidelity | FAILED_VERIFICATION | FAILED_VERIFICATION | PASS_WITH_WARNING one rich inline math | Prove formula-heavy import |
| 12 | Design/style invariants | FAILED_VERIFICATION | PARTIAL_STABILITY_BLOCKED | PASS simple color/highlight only | Retest full `apply_style_plan` |
| 13 | Card lifecycle | FAILED_VERIFICATION | NOT_RUN_DEPENDENCY_BLOCKED | PASS basic card only; parser warning | Fix cloze/MC/list/parser |
| 14 | Latency/stability | FAILED_RUNTIME | FAILED_STABILITY | PASS_WITH_WARNING short spot only | Long soak, stale connection detection |
| 15 | Final combined proof | PARTIAL_PROOF | NOT_LIVE_PROVEN_READY | PARTIAL only | Finish P0-P3 first |

## Tool Status

## Stage 4 Tool Matrix Audit, 2026-07-09

Current generated registry truth:

- Declared tools: 75.
- Public tools without delete gate: 72.
- Default `mass_note_writer` public tools: 19.
- Danger profile public tools with delete gate: 73.
- Hidden or gated source-level tools: `delete_rem_by_id`, `replace_rem`, `create_folder`.
- Default profile runtime-unverified tools: 9.

`TOOL_REFERENCE.md` now includes a generated Tool Correctness Matrix for every declared tool.
Rows separate profile exposure, schema status, local/server-local status, live status,
idempotency, scope, error quality, ChatGPT/Codex status, known failures, and next test.
`server_local_verified` is not live RemNote proof. Any row without a recent connected
plugin success stays `live_not_run`.

Working narrow path, still not broad readiness:

- `get_bridge_status`: connected status OK; not enough alone.
- `ping_remnote_plugin`: plugin route OK in current run.
- `get_plugin_status`: responsive in current run.
- `get_focused_rem`: focus confirmed.
- `get_current_selection`: selection confirmed.
- `create_rem`: root/child/report writes verified.
- `get_children`: parent/root/import reads verified in mini-suite.
- `get_rem_breadcrumbs`: parent chain verified.
- `preview_markdown_note_tree`: no-write preview OK.
- `get_rem_rich`: inline math + style readback OK.
- `create_basic_flashcard`: basic card OK.
- `set_rem_text_color`, `set_rem_highlight_color`: simple style OK, no child pollution in mini-suite.

Failed or risky:

- `run_note_import_job_step`: current mini-suite failed source fidelity/hierarchy.
- `verify_note_import_job`: correctly failed current bad import.
- `resume_note_import_job`: dry-run safe; real recovery not proven.
- `plan_note_import`: passed, but pre-section source not preserved downstream.
- `plan_note_import_from_file`, `start_note_import_from_file`: old/new blocked by path/hosted file boundary.
- `create_flashcards_from_markdown`: parser bug with `marker: both`.
- `create_cloze_card`, `create_multiple_choice_card`, `create_list_answer_card`: not live-proven.
- `apply_style_plan`: old pollution/stability risk; not rerun full.
- `delete_rem_by_id`: keep gated.

## Stage 6 Local Fix, 2026-07-09

Local Stage 6 regressions now cover the July 2 tiny bulk failure shape:

- H1 intro text before the first H2 is preserved as a `Chapter introduction` chunk, so `Alpha source sentence.` is no longer dropped during planning.
- Final readback verification checks direct child hierarchy and reports `wrongParentChunks` when `Bullet B` or its formula is nested under `Bullet A`.
- `run_note_import_job_step` only marks a chunk `verified` when plugin write verification is explicitly `passed` and readback source fidelity also passes.
- Bulk tool envelopes now expose chunk IDs, idempotency keys, created IDs, readback status, plugin verification status, missing/extra previews, and top-level verification method/status.
- `live-tool-smoke` defines a gated Stage 6 disposable-root sequence: `plan_note_import`, `start_note_import_job`, `run_note_import_job_step`, `verify_note_import_job`.
- `live-tool-regression` reports that sequence as blocked unless a real connected plugin and `REMNOTE_LIVE_TOOL_PARENT_ID` or `REMNOTE_LIVE_TEST_PARENT_ID` are available.

This is local readiness for live retest, not live proof. Keep Test 07 marked live-failed until the gated live sequence passes against a disposable RemNote root.

## Failure Taxonomy

- Connection/session: status can look connected while plugin calls time out.
- Scope: broad `workspace_allowed` exists; agent must self-limit to disposable root.
- Bulk source fidelity: missing source text, wrong chunk coverage, wrong hierarchy.
- Idempotency: long generated keys can exceed 128-char validator.
- Resume: jobs memory-only; restart-resume not proven.
- Formula: rich inline math can work, but full formula import not proven.
- Cards: basic works; cloze/MC/list/parser still weak.
- Style: simple color/highlight works; full design plan not proven.
- Reporting: never promote `ok: true` to pass without readback.

## P0 Repairs

1. Stale connection truth:
   - Files: `server/src/bridge-hub.ts`, `server/src/tools/register-status-tools.ts`, `server/src/bridge/plugin-connection.ts`.
   - Need: plugin-responsive vs socket-open distinction.
   - Test: simulate timeout, ensure status marks stale/unresponsive.

2. Scope + destructive safety:
   - Files: `server/src/tool-permissions.ts`, `src/bridge/handlers/scope.ts`.
   - Need: no write outside focus/approved root; delete stays gated.
   - Test: out-of-scope write rejected; delete dry-run/title/parent guards required.

## P1 Repairs

1. Verification status:
   - Keep `PASS`, `PARTIAL`, `FAIL`, `BLOCKED`, `UNKNOWN` distinct.
   - `written_not_verified` never becomes `verified`.
   - Tool envelope must expose verification attempt + method + warnings.

2. Profile matrix:
   - Default `mass_note_writer` and active `danger` must report separately.
   - Hidden tools: delete/replace/folder remain hidden unless explicit env/profile permits.

## P2 Repairs

1. Bulk chunk coverage:
   - Repro: source with H1 intro text before H2/H3, then section bullets.
   - Expected: intro preserved, section preserved, normalized full source matches.

2. Bullet hierarchy:
   - Repro: sibling bullets A/B plus formula paragraph.
   - Expected: Bullet B sibling of Bullet A, formula sibling/paragraph as planned, not child of Bullet A.

3. Idempotency key length:
   - Current format can exceed validator.
   - Fix: hash long job/section/source components.
   - Test: long jobId/source title still <=128 chars.

4. Job durability:
   - Current: `memory_only`.
   - Either add durable store or label restart-resume unsupported.

5. File-backed import:
   - Accept connector file object aliases: `sourceFilePath`, `filePath`, `path`, `sourceFileUri`.
   - Hosted arbitrary local paths must fail before write with clear error.

## P3 Repairs

1. Formula:
   - Use `get_rem_rich` proof: inlineMath/mathBlock, no raw delimiters where conversion requested.
   - Verify full source text too.

2. Style/design:
   - No visible `Size`, `H1`, `H2`, `H3`, `normal` child pollution.
   - No child reorder unless requested.
   - Retest full `apply_style_plan`.

3. Cards:
   - Basic: already narrow-pass.
   - Cloze/MC/list: add readback tests.
   - Parser: `marker: both` must not emit malformed basic card from cloze line.

## P4 Repairs

- Keep docs compressed.
- Keep root markdown count low.
- Put reports in consolidated report files.
- Keep final statuses exact.
- Keep `TOOL_REFERENCE.md` generated at root.

## Required Local Gates

Run at minimum:

```bash
npm test
npm run test
npm run build
```

If scripts exist/touched area needs them:

```bash
npm run server:build
npm run server:smoke
npm run check-types
npm run validate
```

Current last run, 2026-07-02:

- `npm test`: PASSED, 14 files, 74 tests.
- `npm run test`: PASSED, 14 files, 74 tests.
- `npm run lint`: COMMAND_NOT_AVAILABLE.
- `npm run typecheck`: COMMAND_NOT_AVAILABLE.
- `npm run build`: PASSED, 3 webpack size warnings.

## Required Live Gate

Do not claim `LIVE_PROVEN_READY` until:

- Focus confirmed.
- Disposable root created.
- Safe writes/readback pass.
- Bulk source fidelity passes on representative source.
- File-backed import either passes with connector file or fails pre-write by design.
- Formula/card/style paths prove readback.
- Stability soak passes without stale connection.

Current status: `PARTIAL_LIVE_PROOF_ONLY`.

## Cleanup Policy

Root markdown allowed:

- `TOOL_REFERENCE.md`
- `log.md`

Docs markdown allowed:

- `docs/engineering-guide.md`
- `docs/remnote-mcp-repair-and-testing.md`

Report evidence folder markdown allowed:

- `Remnote MCP test by Chagpt result with report/old-report.md`
- `Remnote MCP test by Chagpt result with report/new-report.md`

All other markdown must be compressed into these files or deleted.
