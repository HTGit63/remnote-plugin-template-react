# RemNote MCP Engineering Agent Guide

## 1. Mission

Build and repair the RemNote MCP bridge from evidence. Treat reports, code, tests, and live readback as separate proof classes. Do not claim the MCP is fixed unless current code evidence and live RemNote verification both prove it.

Canonical docs for this cleanup run:

- `docs/repo-cleanup-summary.md`
- `docs/remnote-mcp-report-analysis.md`
- `docs/remnote-mcp-repair-plan.md`

Required style: direct, practical, evidence-based. No vague success claims.

## 2. Non-negotiable safety rules

- Never modify `Remnote MCP test by Chagpt result with report/`.
- Never delete source, tests, package files, config, lockfiles, or runtime files.
- Never confuse a tool response with behavior verification.
- Never mark a write passed without readback, breadcrumbs, or direct verification.
- Never write into RemNote until current focus and safe disposable root are confirmed.
- Never write outside the disposable test root.
- Never run destructive tools on real user notes.
- Never use `delete_rem_by_id` without dry-run, title guard, parent/ancestor guard, and explicit scope.
- Stop live writes immediately if focus, session, scope, or connection state becomes unclear.

## 3. Protected files and folders

Protected evidence folder:

```text
Remnote MCP test by Chagpt result with report/
```

Allowed: read-only analysis.

Forbidden: edit, delete, move, rename, compress, reformat, deduplicate, regenerate, or intentionally touch timestamps.

## 4. Current known state from old/new reports

Evidence labels:

- `OLD_REPORT_EVIDENCE`: old protected reports.
- `NEW_REPORT_EVIDENCE`: new protected reports.
- `CODE_EVIDENCE`: current repository code.
- `LIVE_RETEST_EVIDENCE`: current live retest from this or later Codex run.
- `INFERENCE`: reasoned conclusion from evidence.
- `UNKNOWN`: not proven.

Current state:

- Tests 01, 02, 05, and 10 are `Partially working` or warning-level from new evidence.
- Tests 03, 07, 09, 11, and 14 have new failed evidence.
- Tests 04, 06, and 12 are partial or stability-blocked.
- Tests 08, 13, and 15 are blocked/not live-proven.
- Current Codex live mini-suite is `Partially working`, not live-proven ready. Connection, focus, safe root/child writes, idempotency replay, basic card, rich formula readback, style color/highlight, and a compact report note passed with readback. Small bulk import failed source-fidelity verification.

Improved from old to new:

- Bulk job tools are now callable.
- Safe write idempotency improved.
- Same-title/same-parent duplicate guard improved.
- Resume flow progressed far enough to verify chunks 1-4.

Still not proven:

- File-backed import.
- Full bulk source fidelity.
- Formula fidelity.
- Style invariants.
- Cloze/MC/list-answer cards.
- Stable plugin connection under repeated calls.

## 5. Architecture overview

Server entry:

- `server/src/mcp-server.ts` builds the `McpServer`, filters tools by profile, and registers status, read, write, bulk, style, design, card, diagnostic, and danger tools.
- `server/src/tool-policy.ts` defines default profile `mass_note_writer` and tier visibility.
- `server/src/tool-registry.ts` records declared/registered/listed/callable/live verification metadata.

Auth and policy:

- `server/src/server/create-http-server.ts` handles local/hosted HTTP, MCP routing, OAuth/Codex bearer, pairing, and health endpoints.
- `server/src/tool-permissions.ts` enforces access scope, trusted write, compact report limits, and destructive guards.

Bridge:

- `server/src/bridge-hub.ts` routes plugin-bound calls over WebSocket, applies timeouts/retry rules, records request history, and manages heartbeat.
- `server/src/bridge/session-router.ts` maps hosted user/device/plugin sessions.
- `server/src/bridge/plugin-connection.ts` tracks hosted plugin socket `alive` and `lastPongAt`.

Plugin handlers:

- `src/bridge/handlers.ts` dispatches bridge tools to RemNote SDK read/write modules.
- `src/bridge/handlers/scope.ts` enforces focused/selected/approved-root scope.
- `src/remnote/read.ts` implements readback, children, breadcrumbs, rich reads, search, and document tree.

Write paths:

- `src/remnote/write/basicWrites.ts`: create/update/move/reorder/document.
- `src/remnote/write/markdownImportExecutor.ts`: high-level Markdown import.
- `server/src/tools/register-bulk-import-tools.ts`: server-local planning/job/resume/verify tools.
- `server/src/bulk-import/job-store.ts`: in-memory bulk job store.
- `shared/bridge/bulk-import.ts`: bulk plan/chunk/idempotency/source verification helpers.
- `src/remnote/write/formattingWrites.ts`: style operations.
- `src/remnote/write/cardWrites.ts`: basic/cloze/MC/list-answer card creation.
- `src/remnote/write/verification.ts`: style/design verification.

## 6. Tool status matrix

| Tool name | Category | Observed status | Failure mode | Evidence type | Evidence source | Likely code owner | Priority | Recommended fix | Required verification |
|---|---|---|---|---|---|---|---|---|---|
| `get_bridge_status` | status | Partially working | Historical stale-connected risk; current retest returned connected, hosted, danger profile, 72 public tools | NEW_REPORT_EVIDENCE, CODE_EVIDENCE, LIVE_RETEST_EVIDENCE | New Tests 14-15, live 2026-07-02, `register-status-tools.ts` | bridge/status | P0 — Safety and correctness blockers | Separate socket-open from plugin-responsive | Status after timeout marks stale/unresponsive |
| `get_plugin_status` | status | Partially working | Historical timeout; current retest passed in 83 ms and 123 ms | NEW_REPORT_EVIDENCE, LIVE_RETEST_EVIDENCE | New Test 14, live 2026-07-02 | bridge/plugin lifecycle | P0 — Safety and correctness blockers | Add stale detection and faster failure | 3 repeated calls pass or status disconnects |
| `get_focused_rem` | read | Partially working | Current focus confirmed as `Plugin Test` | OLD_REPORT_EVIDENCE, NEW_REPORT_EVIDENCE, LIVE_RETEST_EVIDENCE | Tests 01, 15, live 2026-07-02 | read/scope | P0 — Safety and correctness blockers | Keep focus confirmation mandatory | Focus ID/title read before root creation |
| `get_children` | read | Partially working | Historical blocks/timeouts; current retest read parent/root/import children in 59-177 ms | NEW_REPORT_EVIDENCE, LIVE_RETEST_EVIDENCE | Tests 04, 12, 14, live 2026-07-02 | read/bridge | P1 — Tool reliability and verification gaps | Improve timeout reporting and bounded reads | Child read after disposable root write |
| `get_rem_tree` | read | Partially working | Timeout and bulk verification dependency | NEW_REPORT_EVIDENCE, CODE_EVIDENCE | Tests 07, 14 | read/verification | P1 — Tool reliability and verification gaps | Bound depth and fail honestly | Tree readback after chunk write |
| `get_rem_breadcrumbs` | read | Partially working | Fallback when `get_rem` blocked | NEW_REPORT_EVIDENCE | Test 01 | read | P1 — Tool reliability and verification gaps | Keep as verification fallback | Breadcrumb proves correct parent |
| `search_rems` | read/search | Partially working | Platform blocks; scope proof incomplete | OLD_REPORT_EVIDENCE, NEW_REPORT_EVIDENCE, CODE_EVIDENCE | Tests 04, 11, `read.ts` | read/search | P1 — Tool reliability and verification gaps | Keep descendant filtering and report filtered counts | Scoped search only returns descendants |
| `create_rem` | write | Partially working | Current retest root/child/report writes passed; same-key replay created zero Rems | NEW_REPORT_EVIDENCE, CODE_EVIDENCE, LIVE_RETEST_EVIDENCE | Tests 05, 10, 14, live 2026-07-02 | basic writes | P0 — Safety and correctness blockers | Preserve duplicate refusal and readback | same-key replay zero new Rems |
| `create_document` | write | Partially working | Visible metadata warning | OLD_REPORT_EVIDENCE, NEW_REPORT_EVIDENCE | Test 05 | basic writes | P3 — Styling, card, formula, and readability improvements | Decide whether metadata is acceptable | Document readback includes expected text |
| `create_or_replace_note_from_markdown` | high-level write | Partially working | source loss in bulk; blank spacer warning | OLD_REPORT_EVIDENCE, NEW_REPORT_EVIDENCE, CODE_EVIDENCE | Tests 05, 07, 10 | markdown writer | P2 — Bulk import, resume, and no-duplicate quality | Repair fidelity, pollution, replay semantics | normalized source readback passes |
| `preview_markdown_note_tree` | preview | Partially working | Current retest no-write preview passed; inline math parsed | OLD_REPORT_EVIDENCE, NEW_REPORT_EVIDENCE, LIVE_RETEST_EVIDENCE | Test 06, live 2026-07-02 | markdown importer | P2 — Bulk import, resume, and no-duplicate quality | Preserve no-write guarantee | Preview produces tree and no Rem mutation |
| `plan_note_import` | bulk plan | Partially working | Current retest planned one chunk but omitted pre-section body from section chunks | NEW_REPORT_EVIDENCE, CODE_EVIDENCE, LIVE_RETEST_EVIDENCE | Tests 07, 09, live 2026-07-02 | bulk planner | P2 — Bulk import, resume, and no-duplicate quality | Ensure plan covers extracted source, including pre-first-section body | plan lengths/hash match selected source |
| `plan_note_import_from_file` | file plan | Blocked | proxied mount rewrite failure | OLD_REPORT_EVIDENCE, NEW_REPORT_EVIDENCE, CODE_EVIDENCE | Tests 06, 08 | file resolver | P2 — Bulk import, resume, and no-duplicate quality | Support connector file objects or return precise unsupported error | file-backed plan succeeds from safe source |
| `start_note_import_from_file` | file job | Blocked | hosted server cannot see local path | OLD_REPORT_EVIDENCE, NEW_REPORT_EVIDENCE | Test 08 | file resolver/deployment | P2 — Bulk import, resume, and no-duplicate quality | Define hosted/local file boundary | safe file job starts or fails pre-write |
| `run_note_import_job_step` | bulk write | Failed current mini-suite | Created 5 Rems but returned `PARTIAL`; readback showed missing pre-section text and wrong bullet nesting | NEW_REPORT_EVIDENCE, CODE_EVIDENCE, LIVE_RETEST_EVIDENCE | Tests 07, 09, live 2026-07-02 | bulk runner | P2 — Bulk import, resume, and no-duplicate quality | Fix chunk coverage, hierarchy, and readback target | one chunk verified with source text |
| `resume_note_import_job` | bulk resume | Partially working | Current dry-run resume did not rewrite but still targets failed chunk; old long-key failure remains | NEW_REPORT_EVIDENCE, CODE_EVIDENCE, LIVE_RETEST_EVIDENCE | Test 09, live 2026-07-02, `bulk-import.ts` | bulk job/idempotency | P2 — Bulk import, resume, and no-duplicate quality | hash/shorten generated keys; durable job state | resume skips verified chunks and finishes |
| `verify_note_import_job` | verification | Working as failure detector | Current mini-suite returned `source_fidelity_failed` with missing inline formula source | NEW_REPORT_EVIDENCE, CODE_EVIDENCE, LIVE_RETEST_EVIDENCE | Tests 07, 09, live 2026-07-02 | verification | P1 — Tool reliability and verification gaps | Keep strict no-pass-without-evidence rule | final report fails on missing text |
| `apply_style_plan` | style write | Blocked | old pollution; new stability block | OLD_REPORT_EVIDENCE, NEW_REPORT_EVIDENCE, CODE_EVIDENCE | Test 12 | formatting/style | P3 — Styling, card, formula, and readability improvements | Prove no pollution/order changes | baseline/apply/readback invariant proof |
| `set_rem_heading_level` | style write | Regression risk | existing Rem heading disabled unless opt-in | CODE_EVIDENCE | `formattingWrites.ts` | formatting/style | P3 — Styling, card, formula, and readability improvements | Keep disabled until live proven | no `Size/H1/H3` child Rems |
| `set_rem_text_color` | style write | Partially working | Current retest applied blue text with no child/order/text mutation | LIVE_RETEST_EVIDENCE | live 2026-07-02 | formatting/style | P3 — Styling, card, formula, and readability improvements | Keep invariant verification | rich readback shows expected color and no pollution |
| `set_rem_highlight_color` | style write | Partially working | Current retest applied yellow highlight with no child/order/text mutation | LIVE_RETEST_EVIDENCE | live 2026-07-02 | formatting/style | P3 — Styling, card, formula, and readability improvements | Keep invariant verification | rich readback shows expected highlight and no pollution |
| `create_basic_flashcard` | card write | Partially working | Current retest created basic card with front/back/practice readback | OLD_REPORT_EVIDENCE, NEW_REPORT_EVIDENCE, CODE_EVIDENCE, LIVE_RETEST_EVIDENCE | Test 13, live 2026-07-02 | cards | P3 — Styling, card, formula, and readability improvements | Verify card readback fields | practice enabled and front/back readback |
| `create_cloze_card` | card write | Regression risk | old verification failed; new not rerun | OLD_REPORT_EVIDENCE, NEW_REPORT_EVIDENCE, CODE_EVIDENCE | Test 13 | cards | P3 — Styling, card, formula, and readability improvements | Verify cloze span semantics | readback proves cloze, not plain text only |
| `create_multiple_choice_card` | card write | Regression risk | old helper-child verification failed | OLD_REPORT_EVIDENCE, CODE_EVIDENCE | Test 13 | cards | P3 — Styling, card, formula, and readability improvements | Verify card item children | correct/choice children read back |
| `create_list_answer_card` | card write | Regression risk | old helper-child verification failed | OLD_REPORT_EVIDENCE, CODE_EVIDENCE | Test 13 | cards | P3 — Styling, card, formula, and readability improvements | Verify list item children | item child texts read back |
| `create_flashcards_from_markdown` | card parser/write | Regression risk | Current dry-run parsed double-colon card but also emitted malformed basic card from cloze line under `marker: both` | LIVE_RETEST_EVIDENCE | live 2026-07-02 | cards/parser | P3 — Styling, card, formula, and readability improvements | Fix marker routing so cloze lines do not become malformed basic cards | dry-run and live write per marker mode |
| `delete_rem_by_id` | destructive | Gated | skipped except safe dry-run cleanup | OLD_REPORT_EVIDENCE, NEW_REPORT_EVIDENCE, CODE_EVIDENCE | Test 10, `tool-permissions.ts` | delete/safety | P0 — Safety and correctness blockers | Keep dry-run/title/scope/key guards | dry-run first; no live delete in normal retest |

## 7. Test status matrix for Tests 01-15

| Test number | Test name | Purpose | Old result | New result | Current confidence | Evidence type | Evidence source | Likely code area | Repair needed | Verification needed |
|---|---|---|---|---|---|---|---|---|---|---|
| 01 | Preflight focus/scope safety | Confirm connection, focus, disposable root, readback | PASS | PASS_WITH_WARNING | Partially working; current mini-suite passed root/child/breadcrumb proof | OLD_REPORT_EVIDENCE, NEW_REPORT_EVIDENCE, LIVE_RETEST_EVIDENCE | Old/New Test 01, live 2026-07-02 | scope/read/status | Keep strict focus/root/readback rules | Focus, root, children/breadcrumb readback |
| 02 | Tool visibility/profile matrix | Confirm profile/tool visibility | PASS_WITH_WARNINGS | PASS_WITH_WARNINGS | Partially working; current status shows danger profile and 72 public tools | OLD_REPORT_EVIDENCE, NEW_REPORT_EVIDENCE, CODE_EVIDENCE, LIVE_RETEST_EVIDENCE | Old/New Test 02, live 2026-07-02, policy code | tool policy/registry | Explain active danger vs default profile | Registry/profile comparison |
| 03 | Default profile audit | Exercise default tool set | PARTIAL | FAILED_VERIFICATION | Regression risk | OLD_REPORT_EVIDENCE, NEW_REPORT_EVIDENCE | Old/New Test 03 | bulk/read/write | Fix source fidelity and file plan | Default profile mini-suite with readback |
| 04 | Read-chain/search consistency | Read hierarchy and scoped search | PASS_WITH_WARNINGS | PARTIAL | Partially working | OLD_REPORT_EVIDENCE, NEW_REPORT_EVIDENCE, CODE_EVIDENCE | Old/New Test 04, `read.ts` | read/search | Reduce blocks; report scope truth | Known tree read/search |
| 05 | Safe write/idempotency | Safe write replay/no duplicate | FAILED_VERIFICATION | PASS_WITH_WARNINGS | Partially working; current same-key replay returned `already_applied` and created zero Rems | OLD_REPORT_EVIDENCE, NEW_REPORT_EVIDENCE, CODE_EVIDENCE, LIVE_RETEST_EVIDENCE | Old/New Test 05, live 2026-07-02, `basicWrites.ts` | basic writes/markdown writer | Resolve warnings | same-key replay zero new Rems |
| 06 | Markdown preview/planning | No-write preview and file plan | PARTIAL | PARTIAL | Partially working; current no-write preview passed, file path still not retested | OLD_REPORT_EVIDENCE, NEW_REPORT_EVIDENCE, CODE_EVIDENCE, LIVE_RETEST_EVIDENCE | Old/New Test 06, live 2026-07-02 | markdown/file resolver | Fix file path boundary | preview no mutation, file plan success |
| 07 | Small bulk import workflow | Bounded import with source proof | FAILED_VERIFICATION | FAILED_VERIFICATION | Failed current mini-suite | OLD_REPORT_EVIDENCE, NEW_REPORT_EVIDENCE, CODE_EVIDENCE, LIVE_RETEST_EVIDENCE | Old/New Test 07, live 2026-07-02 | bulk runner/readback | Repair missing sections/source match and bullet nesting | 100% normalized readback |
| 08 | Full file-backed import | Chapter One file import | BLOCKED | BLOCKED | Blocked | OLD_REPORT_EVIDENCE, NEW_REPORT_EVIDENCE, CODE_EVIDENCE | Old/New Test 08 | file resolver/deployment | Support connector file or fail pre-write | file-backed plan/job under safe path |
| 09 | Bulk resume/retry/no duplicate | Resume without duplicate writes | BLOCKED | FAILED_VERIFICATION | Regression risk; current dry-run resume did not mutate but actual chunk stayed failed | OLD_REPORT_EVIDENCE, NEW_REPORT_EVIDENCE, CODE_EVIDENCE, LIVE_RETEST_EVIDENCE | Old/New Test 09, live 2026-07-02 | job store/idempotency | Shorten keys, durable jobs | resume same chunk/key, final verify |
| 10 | Duplicate/scope/cleanup | Duplicate refusal and cleanup guard | FAILED_VERIFICATION | PASS_WITH_WARNINGS | Partially working | OLD_REPORT_EVIDENCE, NEW_REPORT_EVIDENCE, CODE_EVIDENCE | Old/New Test 10 | duplicate/delete/scope | Finish different-parent proof | duplicate matrix and dry-run cleanup |
| 11 | Formula fidelity | Preserve formulas | FAILED_VERIFICATION | FAILED_VERIFICATION | Partially working only for one rich readback; bulk formula source fidelity still failed | OLD_REPORT_EVIDENCE, NEW_REPORT_EVIDENCE, CODE_EVIDENCE, LIVE_RETEST_EVIDENCE | Old/New Test 11, live 2026-07-02 | markdown/rich text | Fix after bulk/file path | `get_rem_rich` math proof plus normalized source proof |
| 12 | Design/style invariants | Style without pollution/reorder | FAILED_VERIFICATION | PARTIAL_STABILITY_BLOCKED | Partially working only for simple text/highlight color; `apply_style_plan` not retested | OLD_REPORT_EVIDENCE, NEW_REPORT_EVIDENCE, CODE_EVIDENCE, LIVE_RETEST_EVIDENCE | Old/New Test 12, live 2026-07-02 | style invariants | Prove no pollution/order mutation | baseline/apply/readback |
| 13 | Card lifecycle | Card create/verify/repair | FAILED_VERIFICATION | NOT_RUN_DEPENDENCY_BLOCKED | Partially working for basic card; cloze/MC/list remain unproven and parser dry-run has cloze bug | OLD_REPORT_EVIDENCE, NEW_REPORT_EVIDENCE, CODE_EVIDENCE, LIVE_RETEST_EVIDENCE | Old/New Test 13, live 2026-07-02 | card writers/verifier | Fix cloze/MC/list verification and parser marker routing | card readback per type |
| 14 | Latency/stability | Repeated plugin calls stable | FAILED_RUNTIME | FAILED_STABILITY | Partially working in short spot check; not a soak test | OLD_REPORT_EVIDENCE, NEW_REPORT_EVIDENCE, CODE_EVIDENCE, LIVE_RETEST_EVIDENCE | Old/New Test 14, live 2026-07-02 | bridge/session/timeout | Stale connection detection | repeated read/status calls over longer run |
| 15 | Final combined live proof | End-to-end readiness proof | PARTIAL_PROOF | NOT_LIVE_PROVEN_READY | Partial live mini-suite only; not live-proven ready | OLD_REPORT_EVIDENCE, NEW_REPORT_EVIDENCE, LIVE_RETEST_EVIDENCE | Old/New Test 15, live 2026-07-02 | all paths | Complete P0-P3 first | full live mini-suite |

## 8. Failure taxonomy

- Connection/session/focus: plugin can be reported connected while plugin-handled calls time out.
- Timeout/latency: repeated 30s timeouts block Tests 12-15.
- Parent-scope safety: every write must stay inside focused/approved disposable root.
- Idempotency/resume/no-duplicate: generated bulk keys can exceed plugin validation; jobs are memory-only.
- Formula/card/styling fidelity: old failures not live-proven fixed.
- Weak reporting: pass/fail labels must reflect readback, not only tool-call success.

## 9. P0 safety and correctness blockers

- Fix stale plugin responsiveness reporting in `server/src/bridge-hub.ts` and `server/src/tools/register-status-tools.ts`.
- Preserve server and plugin scope gates in `server/src/tool-permissions.ts` and `src/bridge/handlers/scope.ts`.
- Preserve duplicate refusal in `src/remnote/write/basicWrites.ts`.
- Preserve destructive dry-run/title/parent-or-ancestor/idempotency guards.

Status labels: `Partially working`, `Blocked`, `Regression risk`. Not `Verified fixed`.

## 10. P1 tool reliability and verification gaps

- Make standard tool output impossible to overstate.
- `PASS` requires successful behavior verification.
- `PARTIAL` means write may have happened but verification was incomplete.
- `FAIL` means direct verification failed or required invariant failed.
- `PLATFORM_BLOCKED` means external platform/session blocked proof.
- `Not tested` remains `Not tested`.

## 11. P2 bulk import, resume, and no-duplicate repair plan

Primary files:

- `shared/bridge/bulk-import.ts`
- `server/src/bulk-import/job-store.ts`
- `server/src/tools/register-bulk-import-tools.ts`
- `src/remnote/write/markdownImportExecutor.ts`
- `shared/bridge/markdown-importer.ts`

Required repairs:

- Shorten bulk idempotency keys to <= 128 chars.
- Make job store durable or explicitly block restart-resume claims.
- Fix chunk coverage and final readback root selection.
- Fix or clearly define file-backed hosted path support.
- Keep dry-run resume from mutating state.

## 12. P3 styling, card, formula, and readability repair plan

Primary files:

- `src/remnote/write/formattingWrites.ts`
- `src/remnote/write/styleMutationInvariant.ts`
- `src/remnote/write/cardWrites.ts`
- `src/remnote/write/designedNoteTools.ts`
- `shared/bridge/markdown-importer.ts`
- `src/remnote/read.ts`

Required repairs:

- Style plan must not create visible `Size`, `H1`, `H2`, `H3`, or `normal` child Rems.
- Style plan must not reorder children unless explicitly asked.
- Formula imports must read back as math spans/math blocks when requested.
- Card verification must prove card behavior, not just Rem creation.

## 13. P4 reporting and developer experience improvements

- Keep stale generated reports out of repo root.
- Keep protected report folder read-only.
- Use one canonical analysis doc and one repair plan.
- Report static/code/live evidence separately.
- Add exact local command results before claiming readiness.

## 14. Required development workflow

Use these skills when relevant:

- [$caveman](/home/hunde-tefera/.agents/skills/caveman/SKILL.md)
- [$caveman-review](/home/hunde-tefera/.agents/skills/caveman-review/SKILL.md)
- [$compress](/home/hunde-tefera/.agents/skills/compress/SKILL.md)
- [$caveman-compress](/home/hunde-tefera/.agents/skills/caveman-compress/SKILL.md)
- [$superpowers:writing-plans](/home/hunde-tefera/.codex/plugins/cache/openai-curated/superpowers/3fdeeb49/skills/writing-plans/SKILL.md)
- [$planner](/home/hunde-tefera/.agents/skills/planner/SKILL.md)
- [$task-observer](/home/hunde-tefera/.agents/skills/task-observer/SKILL.md)
- [$context-driven-development](/home/hunde-tefera/.agents/skills/context-driven-development/SKILL.md)
- [$improve-codebase-architecture](/home/hunde-tefera/.agents/skills/improve-codebase-architecture/SKILL.md)
- [$mcp-builder](/home/hunde-tefera/.agents/skills/mcp-builder/SKILL.md)
- [$nodejs-backend-patterns](/home/hunde-tefera/.agents/skills/nodejs-backend-patterns/SKILL.md)
- [$superpowers:test-driven-development](/home/hunde-tefera/.codex/plugins/cache/openai-curated/superpowers/3fdeeb49/skills/test-driven-development/SKILL.md)
- [$superpowers:verification-before-completion](/home/hunde-tefera/.codex/plugins/cache/openai-curated/superpowers/3fdeeb49/skills/verification-before-completion/SKILL.md)
- [$security-best-practices](/home/hunde-tefera/.agents/skills/security-best-practices/SKILL.md)
- [@data-analytics](plugin://data-analytics@openai-curated-remote)

Workflow:

1. Read reports and current code before changing behavior.
2. Write or update a failing test before production code changes.
3. Keep edits scoped to the responsible module.
4. Preserve safety gates.
5. Run targeted test.
6. Run required local verification bundle.
7. Record exact evidence.

## 15. Required test workflow

For behavior repairs:

1. Add failing regression test.
2. Confirm it fails for expected reason.
3. Implement minimal repair.
4. Run targeted test until it passes.
5. Run wider relevant tests.
6. Record command and result.

Required command attempts before completion:

```bash
npm test
npm run test
npm run lint
npm run typecheck
npm run build
```

If a command is absent, record `COMMAND_NOT_AVAILABLE`. If it fails, record `FAILED` with useful error. If it passes, record `PASSED`.

## 16. Live RemNote MCP testing protocol

Before any live write:

1. Confirm MCP tool availability.
2. Confirm bridge connectivity.
3. Confirm current focused Rem ID and title.
4. Confirm focused Rem is intended test parent.
5. Create one disposable test root under the focused Rem.
6. Write only under that disposable root.
7. Use idempotency keys for every write.
8. Verify every write by readback.
9. Stop if focus, scope, session, or connection becomes unclear.
10. Do not delete existing user notes.

Minimum mini-suite:

- Connection/status.
- Focused Rem confirmation.
- Tool listing/visibility.
- Disposable root creation.
- Safe child note creation.
- Readback verification.
- Parent-scope safety.
- Idempotency/no-duplicate.
- Small bulk import or safe simulated bulk workflow.
- Formula handling where safe.
- Card lifecycle where safe.
- Styling/highlight/color where safe.
- Latency/timeout behavior.
- Compact report creation where safe.

## 17. Focus and parent-scope safety rules

- Current focus is not assumed.
- A parent ID from old reports is not assumed current.
- A write target must be inside the focused Rem descendants or approved document/folder scope.
- `search_rems` without a context root is workspace-level unless policy narrows it.
- Parent-scope proof needs readback: `get_children`, `get_rem_tree`, or `get_rem_breadcrumbs`.

## 18. Idempotency and no-duplicate rules

- Same idempotency key means replay: no new Rems.
- Different idempotency key with same title and same parent must not silently duplicate.
- Different parent duplicate title may be allowed, but must be verified as different parent.
- Bulk resume must reuse the same chunk idempotency key.
- Generated idempotency keys must satisfy plugin validation: max 128 chars.
- Memory-only job state cannot support restart-resume claims.

## 19. Verification strategy

Acceptable proof:

- Direct `get_rem`, `get_children`, `get_rem_tree`, `get_rem_breadcrumbs`, or `get_rem_rich` readback.
- For style: before/after child order, forbidden child text scan, and rich/style field readback.
- For formulas: rich math span/math block readback and no visible raw delimiters when math conversion requested.
- For cards: practice state, card type where SDK exposes it, and front/back/item child text.
- For bulk: normalized source fidelity over full selected source, not only one chunk.

Not proof:

- Tool call returned `ok: true`.
- Registry says tool exists.
- Bridge status says connected.
- Old report pass without current code/live evidence.
- Simulated/local-only test for live behavior.

## 20. Definition of done

- Protected evidence unchanged.
- Cleanup inventory recorded before deletion.
- Old/new report findings documented.
- Code inspection documented.
- `AGENTS.md` matrices updated with evidence labels.
- Live retest either run safely or recorded unavailable.
- Local verification commands attempted and recorded.
- Final `git status --short` recorded.
- No `fixed` claim unless verified by code and live evidence.

## 21. Open questions and unknowns

- `UNKNOWN`: whether hosted file-backed import should support arbitrary local paths or only connector-uploaded paths.
- `UNKNOWN`: exact root cause of Test 14 stale connection: RemNote SDK stall, plugin handler deadlock, stale WebSocket, or hosted routing.
- `UNKNOWN`: whether Test 14 stays stable in a longer soak run; this run only performed a short mini-suite.
- `UNKNOWN`: whether full `apply_style_plan`, cloze cards, multiple-choice cards, list-answer cards, and file-backed bulk import pass on current live RemNote.
- `UNKNOWN`: whether old `Agents.md` should become a compatibility pointer to `AGENTS.md` or stay empty until user approves.

## 22. Live retest findings from current Codex run

Date: 2026-07-02.

Safe live root:

- Focused Rem: `Plugin Test`, `OjLcSppWfIH0cpPoh`.
- Disposable root created under focus: `HZDcF0Y62bF9ptbfd`, title `Codex Live Retest Disposable Root 2026-07-02T20-33Z`.
- All writes in this run stayed under that disposable root or the focused parent for root creation.
- No destructive tools were run.

### Live check log

| Check name | Tool used | Input summary | Expected result | Actual result | Readback evidence | Status | Failure mode if any | Time/latency if relevant | Evidence type |
|---|---|---|---|---|---|---|---|---|---|
| Tool discovery | `tool_search`, `get_bridge_status` | Discover RemNote MCP tools | Tools visible; danger/delete safety clear | Tool search exposed relevant tools; bridge status reported 72 public tools, active `danger`, delete/replace/folder hidden | Bridge status tool registry fields | PASS_WITH_WARNING | Active profile exceeds default `mass_note_writer` | `get_bridge_status` total 4 ms | LIVE_RETEST_EVIDENCE |
| Bridge connection | `get_bridge_status` | Read hosted bridge status | Connected status with plugin metadata | `connected: true`, hosted deployment, plugin SDK `0.0.46`, initial sync complete | Status verification `bridge_hub_status`, pluginConnected true | PASS_VERIFIED | Historical stale-connected risk still exists from reports | 4 ms server phase | LIVE_RETEST_EVIDENCE |
| Plugin WebSocket path | `ping_remnote_plugin` | Ping message | Echo through plugin | Echo returned with plugin lifecycle | Lifecycle reached plugin received/validated/completed | PASS_VERIFIED | None in current run | 310 ms | LIVE_RETEST_EVIDENCE |
| Plugin status | `get_plugin_status` | Read plugin status | Focus available and plugin responsive | Focused Rem found: `Plugin Test`, `OjLcSppWfIH0cpPoh`; workspace permission reported | Plugin status result | PASS_VERIFIED | Broad `workspace_allowed` requires disciplined agent scope | 83 ms and later 123 ms | LIVE_RETEST_EVIDENCE |
| Focus confirmation | `get_focused_rem`, `get_current_selection` | Read focused/selected Rem | Focus equals intended test parent | Focus and selection both `OjLcSppWfIH0cpPoh` | Focus result and selection result | PASS_VERIFIED | None | 53 ms, 57 ms | LIVE_RETEST_EVIDENCE |
| Disposable root creation | `create_rem` | Create root under focused Rem with idempotency key | One root created under focused Rem | Created `HZDcF0Y62bF9ptbfd`; parent proof matched focused Rem | `afterPlainText`, `afterParentId`, parent children readback | PASS_VERIFIED | None | 152 ms mutation phase | LIVE_RETEST_EVIDENCE |
| Idempotency replay | `create_rem` | Replay same root key | Zero new Rems | `idempotencyResult: already_applied`, `created: []`, same root ID | Tool verification after text and parent proof | PASS_VERIFIED | None | 111 ms | LIVE_RETEST_EVIDENCE |
| Safe child note | `create_rem`, `get_children`, `get_rem_breadcrumbs` | Create child under disposable root | Child under root only | Created `MuH79WA9EE5gbhF65`; root children and breadcrumbs verified | Breadcrumbs `Plugin Test -> disposable root -> child` | PASS_VERIFIED | None | create 92 ms, children 177 ms, breadcrumbs 63 ms | LIVE_RETEST_EVIDENCE |
| Parent-scope safety | `get_children`, `get_rem_breadcrumbs` | Verify root and child location | All live writes inside root | Root is direct child of `Plugin Test`; child is descendant of root | Parent child list and child breadcrumbs | PASS_VERIFIED | No negative out-of-scope write attempted for safety | 63-177 ms | LIVE_RETEST_EVIDENCE |
| Markdown preview | `preview_markdown_note_tree` | No-write mini markdown with formula | Tree preview and math parse, no Rem mutation | Preview returned 6 nodes, inline math count 1, no pollution | Server-local preview verification | PASS_VERIFIED | No live write by design | 5 ms | LIVE_RETEST_EVIDENCE |
| Small bulk plan | `plan_note_import` | Plan one-chunk mini import under root | Plan covers full supplied source | Plan passed but section chunk only covered section body; pre-section text became a live failure later | Plan metadata and later readback | PASS_WITH_WARNING | Pre-first-section body risk | 0 ms server phase | LIVE_RETEST_EVIDENCE |
| Bulk job start | `start_note_import_job` | Start job `codex-mini-20260702` | Job planned without writing full note | Job status `planned`; warned `memory_only` durability | Job progress | PASS_WITH_WARNING | Memory-only job state | 0 ms server phase | LIVE_RETEST_EVIDENCE |
| Bulk dry-run step | `run_note_import_job_step` | Dry-run one chunk | No mutation | `status: would_run`, progress unchanged | No created Rem IDs | PASS_VERIFIED | None | 0 ms server phase | LIVE_RETEST_EVIDENCE |
| Bulk actual step | `run_note_import_job_step` | Write one chunk | One chunk verified | Returned `PARTIAL`; created 5 Rems; failed chunk count 1 | Later root/section children readback | FAIL_VERIFIED | Source fidelity and hierarchy failure | tool call wall 2.6 s | LIVE_RETEST_EVIDENCE |
| Bulk readback | `get_children` | Read import root/section/bullet descendants | Source text and hierarchy preserved | Missing `Alpha source sentence.`; `Bullet B` and formula nested under `- Bullet A` | Children of root, import root, section, bullet | FAIL_VERIFIED | Missing source text; wrong bullet nesting | 59-220 ms reads | LIVE_RETEST_EVIDENCE |
| Bulk verifier | `verify_note_import_job` | Verify observed chunk text | Verifier passes only if source matches | Returned `FAIL`, `source_fidelity_failed`, missing inline formula source | Verifier report | FAIL_VERIFIED | Normalized source mismatch; no full readback | 0 ms server phase | LIVE_RETEST_EVIDENCE |
| Resume dry-run | `resume_note_import_job` | Dry-run resume failed job | No rewrite; identify failed chunk | Returned `PASS`; `partial_needs_verification`; no new writes | Created IDs unchanged; dry-run true | PASS_WITH_WARNING | Actual resume not run; failed chunk remains | 0 ms server phase | LIVE_RETEST_EVIDENCE |
| Formula rich readback | `get_rem_rich` | Read formula Rem from mini import | Math segment visible in rich readback | Rich text contained `inlineMath` latex `E = mc^2` | `detectedContentTypes: inline_math` | PASS_WITH_WARNING | Full formula-heavy import still failed/not tested | 61 ms | LIVE_RETEST_EVIDENCE |
| Basic card lifecycle | `create_basic_flashcard` | Create basic card under root with verification | Front/back/practice verified | Created `13fvNaPk40PUFWt3V`; verification passed | front/back/practice readback | PASS_VERIFIED | Does not prove cloze/MC/list-answer | 306 ms | LIVE_RETEST_EVIDENCE |
| Flashcard parser dry-run | `create_flashcards_from_markdown` | Dry-run double-colon plus cloze with `marker: both` | Correct parsed cards without writes | Parsed double-colon, cloze, plus malformed extra basic card from cloze line | Dry-run card list, no created IDs | PASS_WITH_WARNING | Parser incorrectly treats cloze line as basic too | 106 ms | LIVE_RETEST_EVIDENCE |
| Text color | `set_rem_text_color`, `get_rem_rich` | Apply blue to disposable child | Text styled, no pollution | Tool invariant checks passed; rich readback `color: blue` | no children created; rich style | PASS_VERIFIED | Full `apply_style_plan` not retested | 61 ms, read 239 ms | LIVE_RETEST_EVIDENCE |
| Highlight color | `set_rem_highlight_color`, `get_rem_rich` | Apply yellow highlight to disposable child | Highlight styled, no pollution | Tool invariant checks passed; rich readback `highlight: yellow` | no children created; rich style | PASS_VERIFIED | Full `apply_style_plan` not retested | 302 ms, read 239 ms | LIVE_RETEST_EVIDENCE |
| Short latency spot check | `get_plugin_status`, `get_children`, `ping_remnote_plugin` | Three plugin-bound calls after writes | No timeouts | Calls returned in 123 ms, 131 ms, 305 ms | Tool phase durations | PASS_WITH_WARNING | Not a long soak; does not erase old Test 14 failures | 123-305 ms | LIVE_RETEST_EVIDENCE |
| Compact report note | `create_rem`, `get_children` | Write compact retest note under root | Report note created under root | Created `UTDKK77FIM7A5vxNV`; final root children show 4 root children | text/parent verification and final children readback | PASS_VERIFIED | This is a simple Rem report, not a dedicated report-generator tool | 367 ms, final read 110 ms | LIVE_RETEST_EVIDENCE |

### What Passed

- Connection/status and plugin WebSocket path passed in this session.
- Focused Rem and selected Rem were both `Plugin Test`.
- Safe disposable root, safe child note, readback, breadcrumbs, and idempotency replay passed.
- No-write Markdown preview passed and detected one inline math node.
- Formula rich readback passed for one small inline math Rem.
- Basic flashcard creation passed with front/back/practice verification.
- Direct text color and highlight operations passed with no child pollution.
- Short latency spot check passed without reproducing the old 30s timeout.
- Compact report note creation under the disposable root passed.

### What Failed

- Small bulk import failed live. The job wrote Rems but returned `PARTIAL`; verifier returned `source_fidelity_failed`.
- Readback showed missing pre-section source text and wrong bullet nesting.
- Flashcard parser dry-run with `marker: both` produced an extra malformed basic card from a cloze line.

### What Was Blocked Or Not Run

- Full file-backed import was not run because old/new evidence shows hosted path boundary failure and this run did not have a safe connector-file source.
- Full chapter import was not run because small bulk failed first.
- `apply_style_plan` was not run because simple color/highlight coverage was enough for a safe mini-suite and old style failures need targeted tests.
- Cloze, multiple-choice, and list-answer live writes were not run because old evidence failed those paths and parser dry-run already showed a bug.
- Destructive cleanup/delete was not run.

### What Changed Compared With Old Reports

- Basic create/read/idempotency behavior is stronger than old failures for this narrow path.
- Basic card write is live-verified in this run.
- Direct color/highlight writes are live-verified in this run without `Size/H1/H3` pollution.
- Bulk import remains failed, consistent with old source-fidelity failures.

### What Changed Compared With New Reports

- Current session did not reproduce Test 14 timeouts during the short mini-suite.
- Current session reproduced the core Test 07/Test 09 bulk weakness on an even smaller source.
- Current session adds direct evidence that rich math can survive in one small Rem even while bulk source verification fails.

### What Changed Compared With Code Inspection Expectations

- Code expectation confirmed: memory-only job store is reported live as `memory_only`.
- Code expectation confirmed: short job ID avoids the old long idempotency-key error, but source fidelity still fails.
- Code expectation refined: bulk hierarchy writer can nest sibling bullets incorrectly under a previous bullet in this mini source.
- Code expectation refined: `create_flashcards_from_markdown` marker routing needs its own parser regression test.

### Remaining Unknowns

- Full file-backed import behavior with a connector-provided safe file.
- Long stability soak after repeated bulk/card/style operations.
- Full `apply_style_plan` behavior.
- Cloze, multiple-choice, and list-answer card live verification.
- Whether different-parent duplicate handling is still blocked by platform/session issues.

### Updated Repair Priorities

1. P0 — Safety and correctness blockers: keep focus/root/readback and stale-connection guards; do not weaken them.
2. P1 — Tool reliability and verification gaps: make status/report output distinguish short live pass from long stability proof.
3. P2 — Bulk import, resume, and no-duplicate quality: fix pre-section source coverage, bullet hierarchy, source-fidelity verification, long generated idempotency keys, and memory-only job claims.
4. P3 — Styling, card, formula, and readability improvements: add parser regression for `marker: both`; retest cloze/MC/list cards; retest full style plan.
5. P4 — Reporting and developer experience: keep live evidence logs compact and separate from old/new report evidence.

### Recommended Next Repair Steps

1. Add focused unit tests for `plan_note_import` and bulk section splitting when source text exists before the first H2/H3 section.
2. Add a writer/readback regression for sibling bullets to ensure Bullet B remains sibling of Bullet A.
3. Add a parser test proving cloze markers are not also emitted as malformed double-colon cards when `marker: both`.
4. Re-run the same mini-suite after code fixes before attempting full file-backed or full chapter import.