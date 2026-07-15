# RemNote MCP Remediation Roadmap

This file is the binding engineering plan for this repository. It replaces the historical stage roadmap. Future agents must use repository truth, live readback, and the evidence rules below; a checked box, function name, successful mutation response, commit message, or simulated test is never sufficient proof by itself.

## 1. Mission and current baseline

### Mission

This repository provides a TypeScript RemNote plugin, an MCP server, ChatGPT/Codex connection and authorization paths, structured RemNote read/write tools, Markdown and rich-text import, card workflows, reusable design templates, and resumable bulk imports. The remediation mission is to make the benchmarked workflows safe, deterministic, observable, and truthful without rewriting capabilities that already work.

### Repository and live baseline

- Audited branch: `fix/remnote-mcp-mass-note-creation-stability`.
- Report-era audited commit: `ff5e6d1ebf12dfc41c0e037cff99bfe690def240` (`graphify update and 18 stage task complete`).
- Latest verified deployed commit: `a65ce2cf5f9cda94a6bb818d35def5d0ea1e4065` on the same branch. The 2026-07-15 release-readiness and native-widget changes described below are a local candidate and have **not** been deployed or live-retested.
- Benchmark reports reviewed: **24 Markdown files**, covering Tests **01–15**, including the cross-test campaign report `remnote-mcp-tests-01-15-post-deploy-verification-report-2026-07-14.md`.
- Report dates: 2026-07-12 through 2026-07-14. The external 2026-07-15 Second-Eye Release Readiness Audit was checked separately against repository code and tests.
- Latest live connection on 2026-07-14: hosted endpoint connected; initial sync complete; one active plugin session; SDK `0.0.46`; focused Rem `Plugin Test` (`OjLcSppWfIH0cpPoh`). The campaign was self-scoped to `New test` (`SMPeZUPMV64bHl7JI`) and created one run root, `Post-Deploy Benchmark 01–15 — 2026-07-14 — 81eef93` (`3QR2MpAEihc3YMXkJ`). `Old test` (`8RmenkVwDXr88CQYy`) was not mutated.
- Live proof boundary: the latest Tests 01–15 evidence applies to deployed `81eef93`, not to the local post-campaign edits. Per deployment constraints, no edited code was live-retested in the same campaign. A push/deploy and targeted rerun are required before release.
- The connection remained healthy for approximately 55 minutes with no reported reconnect attempt, late response, or pending-request leak. This is an in-run stability observation, not weak-network recovery proof. The installed connector still rejected `get_children.startIndex`; treat that as deployment/connector-catalog drift until refreshed after deployment.
- Live access was `developer` with workspace/full-KB reach, broader than the default `mass_note_writer` profile. Every write used explicit IDs below `New test`; no scope violation, unauthorized write, blind retry, persistent duplicate, or late disconnect occurred during the campaign.
- 2026-07-15 deployed-commit connection proof: bridge and plugin status both passed at `a65ce2c`; read-only health under `New test` passed 34 tools with zero failures (`health-mrmbuiph`), and safe-write health passed 54 tools with zero failures (`health-mrmbv47n`). The disposable sandbox root was `7DjhM3o9tQQQ4dIfx`. This proves the deployed baseline only, not the local candidate.

### Benchmark outcome

The benchmark is not a blanket failure. Simple creation, structured notes, guarded factual correction, hierarchy surgery, core math creation, and multi-family card creation are strong. The latest campaign found locally reproducible defects in reconnect timing, Test 14 logical planning, blank-line/spacer handling, structured append, stale-parent classification, answer/summary design roles, dry-run envelopes, and native whole-Rem highlight enablement. Those code paths now have red/green regressions, but the deployed `81eef93` Test 14 run stopped safely before job creation and therefore did not re-prove persistent execution/resume behavior at that commit. Formula glyph font color and native heading mutation remain SDK limitations.

### 2026-07-15 second-eye closure supplement

The Second-Eye audit's seven code/release claims were re-traced rather than accepted from prose. All seven were confirmed in the `a65ce2c` source and addressed in the local candidate. Deployment evidence remains a separate gate.

| Audit gap | Repository classification | Local candidate evidence | Remaining proof |
| --- | --- | --- | --- |
| GAP-01 completed-job verifier recommended resume | Confirmed `VER-003` contract defect. | State-aware recommendations never advise replay of completed/non-runnable work; `tests/bulk-import-tools.test.ts`. | Deployed completed-job mismatch probe. |
| GAP-02 cross-key structured append duplicates | Confirmed `IMP-005` idempotency defect. | `duplicatePolicy: skip` is schema-visible and compares direct child semantic text across different keys; `tests/write-idempotency-duplicates.test.ts`. | Deployed Test 08 repeat with different keys. |
| GAP-03 design-aware update bypass | Confirmed `DES-002` path defect. | `updateNoteWithDesign` compiles through saved/default rules, writes the compiled tree, records materialization evidence, and saves an exact applied manifest; `tests/design-template-preview.test.ts`. | Deployed Tests 11–12. |
| GAP-04 exact verifier contamination | Confirmed `VER-001` evidence-mixing defect. | Applied-manifest verification is authoritative and no longer invokes generic preset assumptions; `tests/verifier-evidence-phase4.test.ts`. | Deployed Tests 11–12. |
| GAP-05 stale Graphify outputs | Confirmed release-evidence defect. | Graphify refreshed to 4,567 nodes / 10,418 edges and a new architecture review was opened at `/tmp/architecture-review-remnote-mcp-2026-07-15.html`. | Review generated diff before merge. |
| GAP-06 no CI | Confirmed release-engineering defect. | `.github/workflows/ci.yml` runs types, 261-test suite, SDK validation/build, server build/security/schema/idempotency/health, PostgreSQL durability, and the full server fault smoke. | Independent GitHub run after push and required branch protection. |
| GAP-07 thematic break pollution | Confirmed Markdown representation defect. | CommonMark thematic breaks become hidden-bullet spacer Rems with an explicit supported-fallback warning; `tests/bulk-import.test.ts`. | Deployed Test 05 visual/readback control. |

Local release evidence at this candidate: **28 test files / 261 tests passed**, TypeScript, SDK validation, plugin build, server build, security/schema/idempotency/health routing, full server fault smoke, and PostgreSQL restart/CAS durability passed. The new widget removes the setup wall, presents Connection, Writing Access, and Design Style first, moves operator diagnostics under Advanced Details, adds the `Structured Science` preset and custom-style deletion, repairs health/copy fallbacks, and uses `public/logo.svg` for both the toolbar/tab and panel brand surfaces. Native RemNote visual acceptance remains post-deploy.

### 2026-07-14 deployed live-campaign supplement

This campaign supplements the 23 historical report files; it does not rewrite their historical verdicts. Tests used disposable descendants of `3QR2MpAEihc3YMXkJ` only. Full evidence is in `remnote report/remnote-mcp-tests-01-15-post-deploy-verification-report-2026-07-14.md`.

| Roadmap area | Deployed `81eef93` live result | Local candidate response | Post-deploy proof still required |
| --- | --- | --- | --- |
| Phase 1 / Test 14 | Exact source validation passed, but planning returned five logical sections instead of the required four, so no persistent job was created. | H1/preamble now belongs to the first H2 logical section. The exact 6,149-character fixture produces four logical and four native chunks locally with the benchmark limits. | Run two persistent Test 14 jobs after deployment, including pause/resume, reconnect, read-only reverification, and completed replay prevention. |
| Phase 2 / Tests 05, 07, 08, 14 | Test 05 semantic content was strong; Test 07 created unwanted spacers; Test 08 structured append created a wrapper/duplicate; Test 14 stopped before write. | Blank-line false defaults, visible list bullets, structured append routing, and logical planning are regression-tested. | Rerun Tests 05, 07, 08, and exact Test 14; prove authorized connector attachment/file handoff separately. |
| Phase 3 / Test 11 | Explicit target analysis and one-root creation passed, but answer treatment over-applied, summary bullets hid, and formula whole-Rem highlight was gated off. | Answer results are distinct from labels; numbered summary children transfer visible-bullet treatment; native whole-Rem highlight is enabled by default. | Two independent Test 11 runs in both writing modes with exact role/property readback. |
| Phase 4 / Tests 11–15 | Test 11 self-manifest verification passed incomplete semantics; Test 12 dry-run outer `ok` contradicted its valid plan. Test 13 card verification passed cleanly. | Exact role targets, visible summary rules, and dry-run envelope truth have focused regressions. | Rerun Tests 11, 12, 13, the Test 14 verifier, and Test 15 controls. |
| Phase 5 / Tests 03, 05–07, 12 | Formula creation stayed reliable. Whole-formula-Rem highlight failed on deployed code; native headings remained safely unsupported. | Native whole-Rem highlight is the supported formula emphasis path; style correctness now verifies it. Formula glyph font color is explicitly unsupported. | Rerun whole-Rem highlight and targeted Tests 03, 05, 06, 07, 12; never claim formula glyph color. |
| Phase 6 / Tests 01, 02, 09, 10 | One session stayed healthy; symbol search was non-exhaustive; stale text conflict passed; stale parent used generic `INVALID_ARGS`; connector continuation schema drift remained. | Heartbeat timeout, reconnect timer/socket races, registration failure, stale-event handling, and stale-parent conflict are regression-tested. | Weak-network soak, connector refresh, `startIndex` call, and targeted read/error reruns. |
| Phase 7 / Test 15 | 154 Rems, exactly 11 sections, 12/12 cards, and ID-preserving formula repair passed; design limitations remained. | 28 test files / 261 tests, types, SDK validation, plugin/server builds, full server fault smoke, security/schema/idempotency/health routing, PostgreSQL restart/CAS durability, Graphify refresh, and CI definition pass locally. | Push, require independent CI, deploy, run targeted phases, then an independent Test 15 and connection soak. |

### Report inventory

Scores are `Agent / Plugin / Artifact / final weighted`. `—` means that report type did not assign the component score. Filename run labels are preserved, while the run classification follows the report's own evidence.

| Test | Report filename | Run classification and date | Verdict | Scores | Recommendation or decisive warning |
| --- | --- | --- | --- | --- | --- |
| 01 | `remnote-mcp-test-01-connection-scope-report-2026-07-12.md` | Main, 2026-07-12 | `PASS_WITH_WARNINGS` | — / — / — / 94 | Connected and safe in-run; scope was broad and retrieval was bounded/fuzzy. |
| 02 | `remnote-mcp-test-02-information-retrieval-report-2026-07-12-run-02.md` | Corrected-target Run 02 | `PASS_WITH_WARNINGS` | 92 / 76 / 85 / 83.85 | Repair tree/search/verifier reliability; original target was a fixture defect. |
| 03 | `remnote-mcp-test-03-tool-choice-judgment-report-2026-07-12.md` | Main | `PARTIAL` | 93 / 84 / 91 / 88.90 | Heading mutation remained unsupported; otherwise tool choice and isolation were strong. |
| 04 | `remnote-mcp-test-04-clean-structured-note-report-2026-07-12.md` | Main | `PASS_WITH_WARNINGS` | 96 / 92 / 95 / 94.15 | Structured creation passed; heading metadata read back as normal. |
| 05 | `remnote-mcp-test-05-exact-markdown-fidelity-report-2026-07-12.md` | Main | `PASS_WITH_WARNINGS` | 97 / 93 / 94 / 94.65 | Fix remaining Markdown representation; source-manifest/hash mismatch was a fixture defect. |
| 06 | `remnote-mcp-test-06-scientific-formula-rich-text-fidelity-report-2026-07-12.md` | Main | `PASS_WITH_WARNINGS` | 99 / 97 / 99 / 98.20 | Formula creation was excellent; late disconnect occurred after proof. |
| 07 | `remnote-mcp-test-07-precision-styling-report-2026-07-12-run-02.md` | Report filename Run 02; RemNote Run 01 | `PASS_WITH_WARNINGS` | 98 / 90 / 95 / 94.05 | Fix rich replacement false failure and unsupported heading mutation. |
| 08 | `remnote-mcp-test-08-safe-extension-report-2026-07-12-run-02.md` | Report filename Run 02; RemNote Run 01 | `PASS_WITH_WARNINGS` | 98 / 97 / 100 / 98.10 | Preserve this safe-extension path; nested preview and verifier warnings remain. |
| 09 | `remnote-mcp-test-09-safe-factual-correction-report-2026-07-12.md` | Main Run 01 | `PASS_WITH_WARNINGS` | 100 / 98 / 100 / 99.20 | Preserve guarded correction; use a conflict error, not generic `INVALID_ARGS`. |
| 09 | `remnote-mcp-test-09-safe-factual-correction-repeat-report-2026-07-12.md` | Independent repeat | `PASS_WITH_WARNINGS` | 99 / 98 / 100 / 98.85 | Highly repeatable; one agent schema mistake and the same error-taxonomy weakness. |
| 09 | `remnote-mcp-test-09-recovery-challenge-report-2026-07-12.md` | Recovery of existing artifact | `RECOVERY_PASS` | — / — / — / 100 | Five allegations were false/already correct; zero mutation was correct. |
| 10 | `remnote-mcp-test-10-hierarchy-surgery-report-2026-07-12-run-02.md` | Report filename Run 02; RemNote Run 01 | `PASS_WITH_WARNINGS` | 98 / 98 / 100 / 98.50 | Preserve hierarchy surgery; improve symbol search and error attribution. |
| 11 | `remnote-mcp-test-11-learn-reuse-design-report-2026-07-13.md` | Main Run 01 | `PARTIAL` | 83 / 56 / 64 / 67.50 | Repair designed-note creation and reusable rule transfer. |
| 11 | `remnote-mcp-test-11-learn-reuse-design-report-2026-07-13-run-02.md` | Amended/recovery continuation of Run 01, not independent Run 02 | `PARTIAL` | 86 / 52 / 64 / 66.90 | UI template selection failed to propagate; no recovery mutation. |
| 11 | `remnote-mcp-test-11-learn-reuse-design-report-2026-07-12-run-02.md` | Filename Run 02; report identifies Run 03 | `PARTIAL` | 91 / 68 / 79 / 78.80 | Analyzer used the wrong source; template materialization and verifier defaults failed. |
| 12 | `remnote-mcp-test-12-design-diagnosis-repair-report-2026-07-13.md` | Main | `PARTIAL` | 98 / 75 / 90 / 75.00 adjusted | Formula conversion succeeded but lost emphasis; generic design verifier was wrong. |
| 13 | `remnote-mcp-test-13-flashcard-lifecycle-report-2026-07-13.md` | Main Run 01 | `PASS_WITH_WARNINGS` | 99 / 91 / 99 / 95.80 | Fourteen functional cards passed; aggregate verifier overclassified non-cards. |
| 13 | `remnote-mcp-test-13-flashcard-lifecycle-repeat-report-2026-07-13.md` | Independent Run 02 | `PASS_WITH_WARNINGS` | 96 / 91 / 99 / 94.80 | `HIGHLY_REPEATABLE`; preserve creators, repair verifier/preview fidelity. |
| 13 | `remnote-mcp-test-13-recovery-challenge-report-2026-07-13.md` | Recovery of Run 01 | `RECOVERY_PASS` | — / — / — / 100 | Six allegations were false/already correct; direct metadata proved state. |
| 14 | `remnote-mcp-test-14-resumable-long-import-report-2026-07-13-run-02.md` | Adapted RemNote Run 01; local report Run 02 | `BLOCKED_JOB_STATE` | 92 / 42 / 29 / 50.00 adjusted | Repair chunk ID tracking and normalization before repeating Test 14. |
| 14 | `remnote-mcp-test-14-resumable-long-import-report-2026-07-13-run-03.md` | RemNote Run 02; third local report | `BLOCKED_JOB_STATE` | 88 / 31 / 21 / 48.40 | `REPAIR_IMPORT_VERIFICATION`; verifier corrupted untouched chunk state. |
| 15 | `remnote-mcp-test-15-recovery-challenge-report-2026-07-13-run-02.md` | Recovery of existing Run 01 | `RECOVERY_PASS` | — / — / — / 100 | Eight allegations were false; zero mutation preserved the correct artifact. |
| 15 | `remnote-mcp-test-15-complete-course-capstone-run-02-report-2026-07-13.md` | Independent Run 02 | `PASS_WITH_WARNINGS` | 97 / 81 / 92 / 89.35 | `READY_FOR_CAPSTONE_RUN_03`; heading, rich styling, and verifier warnings remain. |

### Coverage gaps

Do not invent missing evidence. The directory lacks a Test 02 Run 01 report; a Test 04 recovery report; Test 05 recovery/repeat reports; base-named reports for Tests 07, 08, and 10; an independent Test 11 Run 02 core report; the initial/base Test 14 report; the main Test 15 Run 01 report; and an independent Test 15 Run 03 report. Some are expected only because other reports or embedded benchmark controls refer to them. Their absence does not invalidate the files that are present.

### Safety invariants

- Operate only on explicit Rem IDs or an explicitly approved root; never infer a broad target from focus when a target argument exists.
- Preserve Rem IDs, parentage, sibling order, unrelated notes, and existing rich/card metadata unless the operation explicitly changes them.
- Never treat registry presence, a successful tool envelope, local simulation, or report prose as live final-state proof.
- Writes require stable idempotency identities. Unknown outcomes require read-before-retry; never blind retry.
- Verification is read-only unless the tool name and contract explicitly say `repair` or `reconcile` and require approval.
- Never convert a pending chunk into a failed/partial chunk unless that exact chunk was attempted or explicitly reconciled.
- Never report `PASS` while an inner result, persisted state, or required live readback says partial, failed, unknown, or unsupported.
- Preserve local-bearer versus hosted-OAuth boundaries, pairing/session truth, CSRF and same-origin protections, and least privilege.

## 2. Previous AGENTS.md closure audit

The historical roadmap contained 19 stages with duplicated goal matrices and detailed stage checklists. Every stage goal was mapped to implementation, tests, and benchmark evidence. The table gives the closure status; completed historical tasks are not repeated below.

| Previous phase or task | Status | Repository evidence | Carry forward? |
| --- | --- | --- | --- |
| Stage 0 — Evidence refresh and graph map | `COMPLETE` | `graphify-out/graph.json`, `graphify-out/graph.html`, and `graphify-out/GRAPH_REPORT.md` exist at the audited commit. | No; refresh only when architecture changes materially. |
| Stage 1 — Tool registry and descriptor truth | `PARTIALLY_COMPLETE` | `server/src/tool-registry.ts`, `server/src/tool-policy.ts`, and `tests/tool-status-matrix.test.ts` exist; the earlier `466b808` catalog differed from source (73 public, 70 app-callable), and the latest connector still rejected `startIndex`. | Yes: retain truth labels and refresh connector descriptors in Phase 6. |
| Stage 2 — Auth, pairing, and session routing | `PARTIALLY_COMPLETE` | Hosted bridge, pairing stores, `server/src/bridge/session-router.ts`, and connection smokes exist; Test 06 saw a late disconnect and only a one-session live case was rechecked. | Yes: reconnection and unknown-outcome handling in Phases 1 and 6. |
| Stage 3 — Scope, approval, and destructive safety | `PARTIALLY_COMPLETE` | Scope handlers, access tests, guarded delete/update, and zero observed scope violations are real; the audited live profile remained workspace/full-KB developer access. | Yes: preserve and re-prove least privilege in Phase 6. |
| Stage 4 — Tool-by-tool correctness matrix | `PARTIALLY_COMPLETE` | Registry/matrix infrastructure exists, but Tests 02, 03, 07, 11–15 prove live behavior gaps and verifier misclassification. | Yes: phase-specific matrices and live proof. |
| Stage 5 — Workflow compatibility and retry safety | `PARTIALLY_COMPLETE` | Idempotency records, retry classifications, timeout budgets, and duplicate tests exist; Test 14 proves unsafe resume/reconciliation behavior remains. | Yes: Phases 1 and 6. |
| Stage 6 — Bulk import source fidelity | `PARTIALLY_COMPLETE` | `shared/bridge/bulk-import.ts`, Markdown parser tests, source hashes, and source-fidelity tests exist; Test 14 still found hierarchy, bullet, title, and normalization failures. | Yes: Phase 2. |
| Stage 7 — Bulk resume and persistent durability | `NOT_COMPLETE` | Postgres JSON persistence and job tests exist, but both Test 14 runs ended `BLOCKED_JOB_STATE`; verification mutated state and write IDs were lost. | Yes: highest-priority Phase 1. |
| Stage 8 — File-backed and connector-scale imports | `NOT_COMPLETE` | `server/src/bulk-import/source-file-loader.ts` and loader tests exist; live connector-backed ingestion failed in Test 14. | Yes: Phase 2. |
| Stage 9 — Markdown, formula, and rich-text fidelity | `PARTIALLY_COMPLETE` | Parser/rich-text helpers and regression tests cover many cases; Tests 05, 07, 12, 14, and 15 show emphasis loss, range failures, and semantic mismatch. | Yes: Phases 2 and 5. |
| Stage 10 — Card tools | `PARTIALLY_COMPLETE` | Card creators and idempotency are strong: Test 13 produced 14/14 correct cards twice and Test 15 cards passed. Aggregate verifier and preview semantics remain wrong. | Yes, narrowly: Phase 4 only. |
| Stage 11 — Style, design, and UI-facing note quality | `PARTIALLY_COMPLETE` | Template storage/preview exists; all three Test 11 evidence sets and Test 12 prove wrong target selection, incomplete rule transfer, wrapper duplication, and verifier mismatch. | Yes: Phase 3. |
| Stage 12 — ChatGPT end-to-end workflow | `PARTIALLY_COMPLETE` | Contracts and hosted smokes exist; benchmark runs succeeded broadly, but current connector exposure, file handoff, and live proof counts remain incomplete. | Yes: targeted gates in Phases 2, 6, and 7. |
| Stage 13 — Codex end-to-end workflow | `PARTIALLY_COMPLETE` | Codex pairing/routing smokes exist; no evidence closes all live write and reconnect cases at the audited commit. | Yes: targeted gates in Phases 6 and 7. |
| Stage 14 — Plugin UI polish | `NOT_VERIFIABLE` | UI state tests exist, but Test 11's selected template did not propagate and the report set is not a complete UI acceptance audit. | Yes only for template-selection propagation in Phase 3. |
| Stage 15 — Security audit | `NOT_COMPLETE` | Auth/scope/CSRF/session code and boundary smokes exist; no complete current production security audit is present, and the live profile is broader than default. | Yes: bounded security gate in Phase 6; do not weaken protections. |
| Stage 16 — Performance and soak audit | `NOT_COMPLETE` | Budgets and timing fields exist; reports still show long verifier calls and no complete reconnect/soak proof. | Yes: targeted fault/soak tests in Phases 1, 4, and 6. |
| Stage 17 — Broad architecture cleanup | `OBSOLETE` | A standalone cleanup stage would risk rewriting reliable subsystems. Current defects identify narrower seams: import state, design compilation, verification, and error mapping. | Replace with localized architectural work inside Phases 1–6. |
| Stage 18 — Final release audit | `NOT_COMPLETE` | Test 14 fails both available runs; Tests 11 and 12 are partial; Test 15 Run 03 is absent. | Yes: Phase 7 release gate. |

Closure count: **1 complete, 11 partially complete, 5 not complete, 1 obsolete, and 1 not verifiable**.

## 3. Benchmark evidence summary

Prompt reproductions inside reports are context, not observed evidence. The findings below come from executive summaries, operation logs, final artifact readback, recovery classifications, scoring caps, and final verdicts. When sections conflicted, live ID/property readback and the final evidence classification won.

| Test | Runs reviewed | Final outcome | Main plugin finding | Roadmap impact |
| --- | --- | --- | --- | --- |
| 01 | Main | Passed with warning | Connection and scope controls worked; broad profile and bounded/fuzzy retrieval remain warnings. | Phase 6; preserve connection truth and least privilege. |
| 02 | Corrected Run 02 | Passed with warning | `get_rem_tree` produced SDK errors, search missed readable content, bounded scan lacked continuation, and generic card verification overclassified. Original target was a benchmark fixture defect. | Phases 4 and 6. |
| 03 | Main | Partial | Existing-Rem heading mutation was safely blocked; generic card verifier warned on non-cards; temporary disconnect recovered. | Phases 4–6. |
| 04 | Main | Passed with warning | Structured note creation was reliable; headings read as `normal`; bounded tree reads required branches. | Phase 5; structured creation is a protected non-goal. |
| 05 | Main | Passed with warning | Content was recovered, but code fences, emphasis, blockquotes, numbering, table representation, and heading metadata degraded. Manifest/hash discrepancy was a fixture defect. | Phases 2 and 5. |
| 06 | Main | Passed with warning | Rich math creation and content preservation were excellent; heading metadata was weak; late disconnect was a connection failure after artifact proof. | Preserve math creation; Phases 5 and 6. |
| 07 | RemNote Run 01 | Passed with warning | Full rich replacement succeeded but the style-only plain-text invariant reported partial failure; heading mutation remained blocked. | Phase 5. |
| 08 | RemNote Run 01 | Passed with warning | Safe extension preserved the source perfectly; nested preview rules and generic verifier remained limited. | Protect extension; Phases 3 and 4 only. |
| 09 | Main, repeat, recovery | Passed twice; recovery 100 | Guarded correction and ID preservation were highly reliable. Stale guard used generic `INVALID_ARGS` and wrong permission-layer guidance. Recovery correctly changed nothing. | Protect mutation path; improve errors in Phase 6. |
| 10 | RemNote Run 01 | Passed with warning | Hierarchy surgery was strong. Symbol-heavy search missed content; validation errors were attributed to permission. | Protect surgery; Phase 6. |
| 11 | Run 01, amended Run 01, reported Run 03 | Partial in all evidence sets | Analyzer source identity, UI selection propagation, template materialization, wrapper creation, card/design transfer, and verifier rules failed. Content/reference isolation remained strong. | Phase 3, then Phase 4. |
| 12 | Main | Partial | ID-based readback proved many states; generic template verifier used wrong defaults; formula repair lost existing emphasis; card metadata was correct despite aggregate warnings. | Phases 4 and 5. |
| 13 | Main, repeat, recovery | Passed twice; recovery 100 | All 14 cards were functional and duplicate-free twice. Verifier misclassified organizational headings, literal cloze text, descriptor representation, and MCQ serialization. | Narrow Phase 4; do not redesign creators. |
| 14 | Adapted Run 01 and RemNote Run 02 | Blocked job state twice | Mutation IDs were lost, verification changed untouched chunks, resume retargeted unsafe chunks, state disagreed with live artifacts, hierarchy was corrupted, and connector file paths failed. | P0 Phase 1, then Phase 2. |
| 15 | Run 01 recovery and independent Run 02 | Recovery 100; Run 02 passed with warning | Full course and cards were sound. Heading mutation, whole-math highlighting, formula answer styling, and aggregate verification remained weak. | Phases 4–7; Run 03 required. |

## 4. Consolidated issue register

Priority counts: **P0: 4**, **P1: 13**, **P2: 5**, **P3: 2**. Total: **24 consolidated issues**. Historical live closure is retained as evidence but does not replace final-candidate proof. “Latest live” means deployed `a65ce2c`; “local candidate” means automated proof that awaits deployment.

| Issue ID | Priority | Subsystem | Evidence | Root-cause status | Planned phase |
| --- | --- | --- | --- | --- | --- |
| `IMP-001` | P0 | Resumable import / verifier | Test 14 Run 02 changed 11 untouched pending chunks to failed/verification-needed. `verify_note_import_job` updated chunk state and persisted it. | Implementation and older live jobs support closure; latest `81eef93` stopped before a job. Final-candidate two-run proof remains required. | 1 |
| `IMP-002` | P0 | Import outcomes / mutation identity | Test 14 adapted run found live chunk content with no durable created/updated IDs. | Implementation and older live jobs retained IDs; latest `81eef93` stopped before a job. Final-candidate proof remains required. | 1 |
| `IMP-003` | P0 | Resume cursor / replay safety | Historical Test 14 reports showed resume selecting an unsafe attempted chunk. | Deterministic selection/replay tests and older live readback pass; latest deployment did not reach resume. | 1 |
| `IMP-004` | P0 | Persistence / reconnect / atomicity | Historical Test 14 state disagreed with live artifacts and lacked revision/CAS semantics. | Revision/CAS, migration, memory, and reconnect unit proof pass. Current PostgreSQL and final-deployment restart proof remain outstanding. | 1 |
| `IMP-005` | P1 | Import parser / hierarchy / chunk model | Test 14 found microchunking, duplicate titles, visible prefixes, hierarchy corruption, and latest `81eef93` planned an H1/preamble introduction as a fifth logical section. | Local candidate produces four exact logical/native chunks for the 6,149-character fixture and explicitly preserves visible bullets; deployment rerun pending. | 2 |
| `IMP-006` | P1 | Import planner / logical sections | Latest Test 14 required four H2 logical chunks but received a synthetic introduction plus four H2 sections, so the safety gate blocked before job creation. | Root cause confirmed in `splitSections`; local candidate attaches H1/preamble to the first H2 section. | 2 |
| `FILE-001` | P1 | File/connector ingestion | Test 14 could not use connector-backed file routes; local loader and alias tests pass. | Local adapters and actionable pre-job errors are complete; connector-host handoff still needs live validation. | 2 |
| `MD-001` | P1 | Semantic fidelity / manifests | Test 14 compared rendered RemNote text against raw Markdown and rejected links, bold, and math despite readable content. `normalizeForSourceFidelity` is plain-text and destructive. | Local semantic/source manifest, hierarchy, and normalization fixes pass; live rendered readback pending. | 2 |
| `DES-001` | P1 | Design analysis identity | Test 11 reported analysis of the focused/wrong Rem instead of the supplied sample. Current resolver honors `rootRemId ?? sampleRemId`, so schema/call/UI propagation remains suspect. | Local fix complete: explicit identity is required and echoed; ambiguous/focus fallback is rejected. Live Test 11 pending. | 3 |
| `DES-002` | P1 | Template materialization | Latest Test 11 over-applied answer emphasis to label and result, hid summary bullets, and failed whole-formula-Rem highlight. | Root cause confirmed in compiler roles, reusable bullet capture, and runtime highlight flag. Focused local regressions pass; deployment rerun pending. | 3 |
| `DES-003` | P1 | Design UI / root construction | Historical Test 11 created a redundant child H1 when content began with a different H1. | Latest `81eef93` one-root creation passed; UI/direct parity still needs a post-candidate live run. | 3 |
| `VER-001` | P1 | Design verifier | Tests 11–12 show H1/H3/default assumptions conflicting with saved rules. `verifyNoteAgainstDesign` and named-preset verification do not consume one complete stored-rule manifest. | Local fix complete: target-specific applied manifest drives read-only exact verification. Live Tests 11–12 pending. | 4 |
| `VER-002` | P1 | Card verifier / preview | Historical Test 13 runs exposed MCQ and organizational-heading false findings. | Latest `81eef93` Test 13 passed all 14 cards and aggregate direct-metadata verification; retain as a protected regression control. | 4 |
| `VER-003` | P1 | Import final verifier | Live Test 14 Run B had one exact North/East/South/West tree and matching hashes, but substring duplicate detection counted `North paragraph` and similar content as duplicate section titles, failed all repeats, and recommended resume on a completed job. | Root cause confirmed in substring counting. Local candidate compares exact semantic units and forbids replay guidance for completed jobs; deployment rerun pending. | 4 |
| `RICH-001` | P1 | Rich text / formula styling | Live mixed-rich readback measured plain length 18 versus SDK length 14; styling text after math rejected valid plain offsets. Rich replacement dropped math styles while claiming a match. | Root cause confirmed in offset-domain mixing and raw math serialization. Local candidate maps each rich node and preserves/reads math styles; deployment probe pending. | 5 |
| `HEAD-001` | P2 | Heading/property mutation | Tests 03–07 and 15 show created headings read as normal, while existing mutation is disabled because SDK font size can create visible `Size` children. | Safe capability-off fallback, direct readback, no-op rejection, and clear-reset guard pass locally; live SDK probe pending. | 5 |
| `MD-002` | P2 | Markdown representation | Live Test 05 preserved content/math/hierarchy, but ordinary quotes gained `Callout:`, inline code styling and native headings were lost without warning, and ordered/link fallbacks were incomplete. | Root causes confirmed. Local candidate preserves exact quote text with quote style and declares heading/inline-code/link/ordered-list limits in preview, manifest, result, and readback counts. | 5 |
| `READ-001` | P2 | Tree reads / search | Latest tree reads passed, symbol-heavy search produced a bounded false negative for content available by ID, and the installed connector descriptor lacked the source-implemented `startIndex` input. | Direct-ID fallback and non-exhaustive labeling exist; connector refresh and post-refresh continuation/search proof remain. | 6 |
| `ERR-001` | P2 | Schemas / error taxonomy | Tests 09–10 found stale-state and structural validation returned `INVALID_ARGS`, `plugin_permission`, and irrelevant permission guidance; some calls used `text` where schema expected `title`. | Local fix complete: conflict code, layers/actions, aliases, and envelope tests pass. | 6 |
| `OBS-001` | P3 | Envelopes / observability / performance | Live design repair returned applied operations but zero outer updated IDs and no attempted verification; verifier tools omitted standard verification evidence. | Local candidate lifts updated IDs, typed verification method/pass state, checked role IDs, and rejects inner verification failure at the standard envelope. | 6 |
| `CONN-001` | P1 | Bridge / connection lifecycle | Weak internet caused repeated disconnects; code closed after a single missed-pong cycle and client timers/socket callbacks could race or stack. | Server now honors the configured pong timeout; client coalesces timers, ignores stale socket events, closes failed registration, and resets backoff only after `server_hello`. Six unit regressions pass; weak-network live soak pending. | 6 |
| `REL-001` | P1 | Release engineering / CI | Second-Eye GAP-06 found no independent workflow for the candidate; local-only evidence could not gate a public release. | CI now installs plugin/server dependencies, runs typed/build/security/schema/idempotency/health gates, and proves persistent storage against PostgreSQL. Independent GitHub status is pending push. | 7 |
| `UX-001` | P2 | Native RemNote widget | The default view was a setup/diagnostic wall; health/copy controls failed on constrained browser surfaces; template use/delete and both logo surfaces were unclear or stale. | Default information architecture, clipboard fallback, independent health probes, featured/custom template lifecycle, accessibility CSS, and both logo surfaces are locally implemented and tested. Native visual proof is pending deployment. | 7 |
| `ARCH-001` | P3 | Architecture / maintainability | Import registration, design tools, and verification files combine orchestration, persistence mutation, normalization, and policy. Defects cross these seams. | Bounded state/compiler/verifier seams and dependency/migration tests pass; no broad rewrite performed. | 7 |

## 5. Dependency-ordered remediation phases

The phases are ordered by data safety. A later phase may add characterization tests early, but it must not bypass an unmet dependency or broaden a reliable subsystem rewrite.

### Phase 1 — Make resumable import state truthful and crash-safe

**Implementation status (2026-07-15): `LOCAL_STATE_AND_POSTGRES_COMPLETE / DEPLOYED TWO-RUN GATE OPEN`.** State transitions, exact planning, completed-job guidance, memory persistence, PostgreSQL provider restart, and stale-writer/CAS behavior pass locally. Two persistent Test 14 runs on the deployed local candidate remain mandatory.

#### Objective

Guarantee that persisted job state, mutation identity, live RemNote state, and resume selection cannot silently disagree or cause replay.

#### Evidence

- `remnote-mcp-test-14-resumable-long-import-report-2026-07-13-run-02.md`: chunk 6 content existed and hash-matched, but mutation IDs were absent and resume targeted it again.
- `remnote-mcp-test-14-resumable-long-import-report-2026-07-13-run-03.md`: verification changed 11 untouched pending chunks and resume targeted the attempted Maths chunk.
- Relevant issues: `IMP-001`–`IMP-004`.

#### Current code areas

- `shared/bridge/bulk-import.ts`: chunk/job types, transition rules, runnable classification, progress summaries, hashes.
- `server/src/bulk-import/job-store.ts`: in-memory mutation, `nextRunnableChunk`, status refresh, checkpoints.
- `server/src/tools/register-bulk-import-tools.ts`: `runOneChunk`, verify/resume/cancel handlers, result-ID extraction, persistence calls.
- `server/src/storage/types.ts`, `memory-store.ts`, `postgres-store.ts`: whole-job persistence and durability labels.
- `server/src/bridge-hub.ts`, `server/src/bridge/bridge-hub-retry.ts`, `server/src/bridge/bridge-hub-evidence.ts`, `server/src/tools/tool-context.ts`: execution acknowledgement, unknown-outcome evidence, and retry classifications.
- `tests/bulk-import-tools.test.ts`, `tests/bulk-import-access.test.ts`, `tests/bridge-retry-safety.test.ts`, `server/src/bulk-import-storage-smoke.ts`, `server/src/area3-certification.ts`.

#### Investigation tasks

- [x] Record the exact bridge response shapes for success, timeout, disconnect, partial execution, and post-write verification failure; identify every location where created/updated IDs can exist.
- [x] Define a transition table with separate facts for attempt state, write outcome, observed Rem IDs, verification state, and reconciliation state. Pending, attempted-unknown, written-unverified, verified, failed-before-write, and manual-review must not collapse into one field.
- [x] Define resume policy separately from reconciliation and explicit replay. Determine which states may advance, which require ID/readback reconciliation, and which require user-approved retry.
- [x] Reproduce server termination before and after plugin acknowledgement, before persistence, and during persistence for both memory and Postgres providers.
- [x] Decide whether revision/CAS, row locking, an append-only attempt journal, or another transactional seam best fits the existing storage abstraction. Do not prescribe a database rewrite without the interleaving evidence.
- [x] Specify migration and backward-compatibility behavior for existing serialized job JSON.

#### Implementation tasks

- [x] Make `verify_note_import_job` a read-only report. If state must be reconciled, expose an explicitly named, approved reconciliation operation with its own schema and audit event.
- [x] Persist an attempt record before dispatch and persist every returned/observed mutation ID even when post-write verification fails or the outer response is partial.
- [x] Make unknown outcomes first-class and non-retryable until ID-based/readback reconciliation completes.
- [x] Replace broad first-runnable selection with a deterministic selector that never chooses verified/completed chunks and never silently replays an attempted-unknown chunk.
- [x] Add stable job revision, attempt ID, operation ID, expected parent, source/semantic hash, and reconciliation provenance to durable records where the investigation proves they are needed.
- [x] Make job/chunk transitions atomic at the storage seam and reject stale writers with expected/actual revision details.
- [x] Preserve chunk IDs, idempotency keys, root/section Rem IDs, and completed-chunk state across restart and reconnect.
- [x] Add a safe migration/read path for old jobs; never reinterpret an ambiguous old state as verified.

#### Regression tests

- Unit: exhaustive allowed/forbidden transition table and deterministic next-action selection.
- Integration: partial response containing IDs, timeout before/after acknowledgement, verification failure after successful write, and explicit reconciliation.
- Persistence: restart between every write-state boundary using memory and Postgres providers.
- Property/invariant: repeated verify calls do not change serialized job bytes; completed chunks are never selected; untouched chunks remain pending.
- Fault injection: disconnect, process exit, stale concurrent writer, duplicated response, and lost acknowledgement.
- End to end: Test 14 twice consecutively with fresh jobs and no cleanup-driven concealment.

#### Acceptance criteria

- A pending chunk cannot transition to failed, partial, or verification-needed unless that exact chunk was attempted or an explicit reconciliation operation classified it.
- Reverification cannot mutate job progress, cursor, IDs, status, or timestamps.
- A response that contains mutation IDs persists those IDs before any subsequent verification classification.
- An unknown write outcome blocks blind retry and returns a read-before-retry action with job, chunk, attempt, operation, and expected-parent identity.
- Resume selects the first truly incomplete safe chunk and never a verified, completed, or attempted-unknown chunk.
- A hash- and ID-reconciled live chunk can close without replay; a hash-only ambiguous match cannot silently claim identity.
- Restart/reconnect produces the same next action and progress summary as the pre-restart state.
- Concurrent stale updates return a dedicated conflict result with expected and actual revision.

#### Required evidence before completion

- Commands: `npm test -- tests/bulk-import-tools.test.ts tests/bulk-import-access.test.ts`, `npm run server:test:bulk-storage`, `npm run server:test:idempotency`, `npm run server:build`.
- Attach command output, fault-injection matrix, serialized before/after states, and exact operation/attempt IDs.
- Rerun Test 14 twice consecutively; include before/after behavior and prove no regression in Tests 08, 09, 10, and 13 safety invariants.
- [x] Local command gate passed: focused Phase 1 tests, idempotency certification, server build, full server fault smoke, PostgreSQL durability/restart/CAS proof, and the 261-test repository suite.
- [x] Re-prove persistence against a real temporary PostgreSQL instance at the final candidate revision, including stale-writer rejection and provider-restart reload. A disposable PostgreSQL 16 instance passed persistent reload, revision 2 retention, and stale-writer rejection on 2026-07-15.
- [ ] Complete two deployed live Test 14 state-machine executions at the final candidate revision with no verifier mutation, lost IDs, unsafe resume, replay, hierarchy corruption, or persistent duplicate. Deployed `81eef93` stopped before job creation.

#### Definition of done

Phase 1 may be checked complete only when `IMP-001`–`IMP-004` are closed by automated state/persistence/fault tests and two consecutive live Test 14 runs complete without replay, lost IDs, verifier mutation, duplicate roots, or state/artifact disagreement.

### Phase 2 — Preserve import hierarchy and semantic source fidelity

**Implementation status (2026-07-15): `LOCAL_CANDIDATE COMPLETE / DEPLOYMENT RERUN REQUIRED`.** Planning, blank-line behavior, visible bullets, cross-key structured append skipping, semantic manifests, and thematic-break fallback pass locally. Authorized connector attachment handoff and deployed Tests 05/08/14 remain open.

#### Objective

Turn logical source sections into stable RemNote hierarchy through supported file/connector routes, while comparing source and rendered output with explicit semantic rules.

#### Evidence

- Both Test 14 reports: excessive native chunks, duplicate `1.1` titles, bullet pollution, hierarchy inversion, raw-Markdown mismatch, and connector ingestion failure.
- Test 05: code, emphasis, blockquote, list, and table representation limits.
- Relevant issues: `IMP-005`, `FILE-001`, `MD-001`.

#### Current code areas

- `shared/bridge/bulk-import.ts`: source normalization, section/chunk planning, hierarchy verifier, raw hashes.
- `shared/bridge/markdown-importer.ts`: heading/bullet stacks, fragment plans, code/table/callout nodes, inline math, emphasis spans, and source snippets.
- `shared/bridge/protocol-write-args.ts`, `src/bridge/handlers/args.ts`, `src/remnote/write/markdownImportExecutor.ts`: fragment append schema, bridge parsing, sibling materialization, and source-fidelity verification.
- `server/src/bulk-import/source-file-loader.ts`, `server/src/tools/register-bulk-import-tools.ts`: file aliases, connector handoff, policy.
- `tests/bulk-import.test.ts`, `tests/source-file-loader.test.ts`, `tests/bulk-import-tools.test.ts`, `tests/style-presets.test.ts`.

#### Investigation tasks

- [x] Trace one failing Test 14 section from raw source to logical section, native chunk, Markdown plan, created Rem IDs, and final tree; locate where each parent changes.
- [x] Distinguish logical checkpoints from transport/native write chunks. Determine the minimum native split required by current size/depth limits.
- [x] Reproduce connector file references from each supported client shape and identify whether failure occurs in schema conversion, MCP attachment handoff, local policy, loader, or deployment.
- [x] Define a source manifest containing source hash, semantic hash, normalized units, hierarchy relationships, formatting expectations, and supported-loss declarations.
- [x] Classify code fences, tables, numbering, blockquotes, links, emphasis, and math as native representation, supported fallback, or unsupported SDK capability.

#### Implementation tasks

- [x] Preserve section roots exactly once and keep same-level headings/list items as siblings across native chunk boundaries.
- [x] Prevent chunk payloads from recreating a section title already represented by the section root.
- [x] Remove Markdown bullet markers from visible content when `plain_child_rems` is selected while retaining the intended hierarchy and ordered-list metadata/fallback.
- [x] Bound native splitting without turning every paragraph into a resumable logical checkpoint.
- [x] Normalize supported links, emphasis, inline/block math, Unicode, whitespace, and list markers into semantic comparison units; retain raw source hash separately.
- [x] Emit exact missing/extra unit, expected parent, actual parent, source span, chunk ID, and Rem ID evidence on failure.
- [x] Make every documented connector/local file shape enter one normalized source adapter or return a precise unsupported-source error before job creation.
- [x] Keep benchmark/source fixture discrepancies classified separately from plugin defects.

#### Regression tests

- Pure parser: nested headings/lists split at every boundary, duplicate-title prevention, bullet stripping, code/table/callout plans.
- Schema: every supported file alias/client envelope and every conflict/unsupported case.
- Semantic manifest: links, bold, italic, inline math, block math, Unicode, spacing, ordered lists, code, and tables.
- Integration: logical-to-native chunk mapping with stable parent IDs and no title duplication.
- Property: parsing then splitting preserves source order and parent relationships for generated trees within limits.
- End to end: Tests 05 and 14; Test 06 as math-regression control.

#### Acceptance criteria

- Six logical batches do not become dozens of independently resumable microchunks unless an explicit limit requires it and the mapping is reported.
- Section titles appear once; same-level source items remain siblings; all expected parents are manifest-addressable.
- No created Rem displays a raw leading Markdown bullet unless literal source content requires it.
- Raw source hash, semantic hash, and rendered readback hash are distinct fields with documented normalization.
- A semantic match does not fail only because RemNote rendered a link, emphasis, or math node differently from Markdown syntax.
- Unsupported formatting produces a precise declared limitation, not silent loss or false exact-fidelity success.
- Connector input either loads identically to direct text or fails before job creation with the failing adapter and actionable next step.

#### Required evidence before completion

- Commands: `npm test -- tests/bulk-import.test.ts tests/source-file-loader.test.ts tests/bulk-import-tools.test.ts tests/style-presets.test.ts`, `npm run server:test:source-fidelity`, `npm run validate`.
- Attach source/semantic manifests, tree before/after samples, exact connector-envelope fixtures, and Test 05/Test 14 rerun reports.
- Prove no regression in Test 06 formulas and Test 08 safe extension.
- [x] Local command gate passed: focused hierarchy/loader/write tests, exact Test 14 planning proof, source-fidelity and Markdown-importer certifications, SDK validation, thematic-break and cross-key append regressions, formula/style control, and the 261-test suite.
- [ ] Deploy the local candidate, rerun Test 05, rerun the `VER-003` Test 14 final verifier, and prove one authorized connector attachment/file handoff. Earlier `466b808` direct-text hierarchy evidence is historical; deployed `81eef93` stopped at the planner gate.

#### Definition of done

Phase 2 is complete only when `IMP-005`, `FILE-001`, and `MD-001` meet the observable criteria, Test 05 passes its supported-fidelity contract, and the Phase 1-safe Test 14 path preserves hierarchy and semantic content through connector and direct-text inputs.

### Phase 3 — Compile saved design rules into one deterministic note plan

**Implementation status (2026-07-15): `LOCAL DESIGN PIPELINE COMPLETE / DEPLOYMENT RERUN REQUIRED`.** Explicit source identity, role transfer, one-root creation, saved-rule compilation, design-aware existing-note updates, exact materialization evidence, and applied-manifest storage pass locally. Two independent deployed Test 11 runs and Test 12 remain required.

#### Objective

Analyze the requested source, save reusable content-independent rules, and create exactly one target root whose supported design properties match those rules.

#### Evidence

- All three Test 11 reports: wrong analysis source, 33–46% transfer, duplicate wrappers, missing styles/card patterns, and UI selection propagation failure.
- Test 12: creation content was sound but generic verification and design repair were incomplete.
- Relevant issues: `DES-001`–`DES-003`.

#### Current code areas

- `src/remnote/templates/designTemplates.ts`: target resolution, rule analysis, validation, local template storage/versioning.
- `src/remnote/templates/designPlanCompiler.ts`: deterministic role-to-rule compiler shared by preview and creation.
- `src/remnote/write/designedNoteTools.ts`: Markdown/styled-tree creation, rule subset mapping, verification and repair entry points.
- `shared/bridge/protocol-write-args.ts`: `NoteDesignRules`, design schemas, writing modes.
- `server/src/tools/register-design-tools.ts`, `src/bridge/handlers/args.ts`: public schemas and argument aliases.
- `src/widgets/bridge-status.tsx`: selected-template state and UI-to-tool propagation.
- `tests/design-template-phase3.test.ts`, `tests/design-template-preview.test.ts`, `tests/bridge-ui-state.test.ts`, `src/remnote/write/style-correctness-regression.ts`.

#### Investigation tasks

- [x] Reproduce `rootRemId`, `sampleRemId`, focus, selection, and UI-selected-template combinations with operation logs; locate the first identity divergence.
- [x] Enumerate every stored rule and classify it as currently analyzable, serializable, materializable, verifiable, preview-only, or SDK-unsupported.
- [x] Trace both Markdown and styled-tree modes to explain duplicate wrapper formation and differences in supported rule transfer.
- [x] Identify content-specific samples leaking into reusable rules; define reusable selectors/roles for title, section, warning, answer, formula, phrase highlight, concept, descriptor, and spacer.
- [x] Determine how UI selection should bind to an explicit template ID without hidden focus fallback.

#### Implementation tasks

- [x] Require the analyzer result to echo the exact requested source Rem ID and fail on ambiguous/missing identity instead of falling back silently.
- [x] Introduce one design-plan compiler seam from validated stored rules plus content roles to a deterministic preview/create manifest used by both writing modes.
- [x] Compile every supported stored rule: title/section roles, colors, highlights, spacing, formula treatment, answer/warning treatment, phrase highlights, concept/descriptor/card patterns, and bullet behavior.
- [x] Mark unsupported rules explicitly in preview and result; never count them as transferred.
- [x] Create one target root and prevent content/title wrappers from duplicating it.
- [x] Make UI template selection produce the same explicit template ID and plan as a direct MCP call.
- [x] Keep storage versioned and reject unsafe operations/content-specific destructive rules.

#### Regression tests

- Unit: target resolver precedence and ambiguity; rule classification; content-independent selector extraction.
- Serialization: save/list/get/export/import round trip for every rule field and version conflict.
- Integration: analyze A → save → preview → create B in both modes, asserting one root and each supported property.
- Property: template serialization/compilation is deterministic and does not embed source Rem IDs except provenance.
- UI contract: selected template reaches the same compiler manifest as explicit API selection.
- End to end: Test 11 independent runs after implementation.

#### Acceptance criteria

- Supplying a source Rem ID can never analyze the focused or selected Rem instead; result and operation log echo the requested ID.
- Applying a saved design creates exactly one target root and one intended title.
- Preview and creation use the same compiled rule manifest and report identical supported/unsupported rule sets.
- Every supported stored rule is either evidenced on an exact target Rem/property or reported as failed; no silent partial transfer.
- Reusable rules contain roles/patterns, not reference-note-specific phrases or IDs except provenance.
- UI and direct MCP selection produce the same template ID, version, and compiled plan.

#### Required evidence before completion

- Commands: `npm test -- tests/design-template-preview.test.ts tests/bridge-ui-state.test.ts tests/style-presets.test.ts`, `npm run test:style-correctness`, `npm run check-types`, `npm run build`.
- Attach template JSON before/after, compiled manifests, exact root/child IDs, property readback, and independent Test 11 reruns.
- Prove reference/source notes remain unchanged and Test 08 extension still passes.
- [x] Local command gate passed: focused design/UI/style tests, answer/summary materialization readback, style correctness, type checking, schema certification, and source-isolation controls. Network-binding server smoke is environment-blocked.
- [ ] Deploy the local candidate and complete two independent Test 11 runs with warning, answer, math, root-wrapper, UI/direct parity, and exact property readback.

#### Definition of done

Phase 3 is complete only when `DES-001`–`DES-003` pass analyzer identity, serialization, UI propagation, single-root, and full supported-rule materialization criteria in both writing modes and in the required Test 11 reruns.

### Phase 4 — Make verifiers read-only, typed, and evidence-specific

**Implementation status (2026-07-15): `LOCAL EVIDENCE VERIFIERS COMPLETE / DEPLOYMENT RERUN REQUIRED`.** Exact applied manifests no longer inherit generic preset assumptions, import guidance is state-safe, card direct-metadata controls remain green, and dry-run envelope truth passes locally. Deployed Tests 11–14 remain required.

#### Objective

Choose the correct verification mode for each claim and prevent heuristic warnings from masquerading as exact property failures or triggering unsafe repair.

#### Evidence

- Tests 02, 03, 07, 08, 12, 13, and 15: aggregate card false positives.
- Tests 11–12: design verifier ignored stored rules and imposed default H1/H3 structure.
- Test 14: verifier mutation is addressed in Phase 1; this phase generalizes the read-only contract.
- Relevant issues: `VER-001`, `VER-002`.

#### Current code areas

- `src/remnote/write/verification.ts`: expected-style verification with explicit evidence output.
- `src/remnote/templates/designVerificationManifest.ts`, `src/remnote/write/designedNoteTools.ts`: applied-manifest readback, `verifyNoteAgainstDesign`, metadata-based `verifyCardSet`, and explicit repair entry points.
- `src/remnote/read.ts`: direct rich/property/card metadata readback.
- `server/src/tools/tool-context.ts`: outer/inner result normalization and verification summaries.
- `tests/verifier-evidence-phase4.test.ts`, `tests/card-verifier.test.ts`, `tests/verification-status.test.ts`, `tests/tool-status-matrix.test.ts`.

#### Investigation tasks

- [x] Inventory every verifier claim and assign one evidence class: generic heuristic, exact manifest, ID-based, semantic, or live property/rich-text readback.
- [x] Trace RemNote card APIs for ordinary headings, organizational card-family headings, concepts/descriptors, MCQ card items, list answers, and functional cloze metadata.
- [x] Define precedence when heuristic and exact metadata disagree; exact live metadata must win for property claims.
- [x] Identify every verifier with side effects, mutable cache writes, or repair suggestions that cannot be traced to exact Rem IDs.

#### Implementation tasks

- [x] Keep generic heuristic verification explicitly advisory and never let it claim exact card/design/property failure.
- [x] Use exact creation/design manifests when the system created the artifact and report every finding with expected role, Rem ID, property, actual value, and evidence method.
- [x] Use ID-based verification for identity, parentage, order, duplicate detection, and targeted repair controls.
- [x] Use semantic verification for normalized content/fidelity only; do not infer functional SDK metadata from text syntax.
- [x] Use live property/rich-text readback as the source of truth for headings, colors, math nodes, card state, cloze metadata, concept/descriptor type, and MCQ/list serialization.
- [x] Make design verification consume the exact compiled/stored manifest from Phase 3, not hard-coded H1/H3 defaults.
- [x] Exclude non-card headings and spacers unless live card metadata says otherwise; literal `{{...}}` is not a functional cloze by itself.
- [x] Validate MCQ/list/concept/descriptor forms against their actual storage representation and return actionable schema errors.
- [x] Make verifier operations byte-for-byte read-only for persistent job/template/idempotency state.

#### Regression tests

- Unit: every evidence-class router and heuristic/advisory label.
- Card metadata: all card families plus organizational headings, spacers, literal braces, malformed practice Rems, and MCQ/list serialization.
- Design serialization: stored manifest drives verification without defaults.
- Invariant: verifier calls cannot invoke mutation/storage-save methods and repeated calls are state-identical.
- Integration: exact ID/property findings include traceable Rem IDs and no contradictory success fields.
- End to end: Tests 11, 12, 13; Test 15 card section.

#### Acceptance criteria

- Non-card headings and spacers are excluded from card-verifier defects when live metadata says `hasCards=false`.
- Literal cloze syntax is advisory text evidence only; functional cloze requires live metadata.
- Correct MCQ, list, concept, and descriptor storage passes without manual adjudication.
- Design verification evaluates the applied template version and compiled manifest, including supported non-heading rules.
- Every exact failure identifies the Rem ID, expected/actual property, evidence method, and safe next step.
- A verifier cannot change import progress, template state, card state, Rem content, or idempotency records.
- Outer `ok/status`, standard status, inner result, warnings, and `isError` cannot contradict one another; structured output satisfies the registered output schema.

#### Required evidence before completion

- Commands: `npm test -- tests/card-verifier.test.ts tests/verification-status.test.ts tests/tool-status-matrix.test.ts tests/design-template-preview.test.ts`, `npm run server:test:tool-schemas`, `npm run test:style-correctness`.
- Attach mutation-spy output, exact-versus-heuristic fixtures, property readbacks, and Test 11/12/13 reruns.
- Prove Test 13 remains 14/14 functional and duplicate-free twice.
- [x] Local command gate passed: Phase 4 exact-manifest/import-guidance/design/card regressions, schema certification, style correctness, and the 261-test repository suite.
- [ ] Deploy the local candidate and rerun Tests 11, 12, 13, the Test 14 final verifier, and the Test 15 card/design controls with zero false findings.

#### Definition of done

Phase 4 is complete only when `VER-001` and `VER-002` close with read-only invariants, typed evidence routing, exact design-manifest verification, and zero false card defects in the Test 13 and Test 15 controls.

### Phase 5 — Preserve rich text, math, headings, and Markdown style on repair

**Implementation status (2026-07-15): `LIVE BASELINE DIAGNOSED / LOCAL CANDIDATE COMPLETE / DEPLOYMENT RERUN REQUIRED`.** Whole-Rem formula-block highlighting remains the supported emphasis path; math glyph font color and unsafe native heading mutation remain explicit SDK limitations. Node-aware ranges, rich preservation, quote handling, and honest unsupported results pass locally.

#### Objective

Make targeted style/property operations preserve Rem identity and all unrelated rich nodes/styles, while exposing SDK limits honestly.

#### Evidence

- Test 07: full rich replacement succeeded but was reported partial because plain text changed under a style-only invariant.
- Test 12: raw formula became a math node but lost blue emphasis.
- Test 15: whole-Rem highlight failed on a math block range; answer-highlight writer/verifier disagreed.
- Tests 03–07 and 15: heading mutation unsupported or read back as normal; visible `Size` pollution is the safety concern.
- Test 05: emphasis and representation loss.
- Relevant issues: `RICH-001`, `HEAD-001`, `MD-002`.

#### Current code areas

- `src/remnote/write/basicWrites.ts`: `updateRemRich` uses rich-replacement proof with exact requested readback.
- `src/remnote/write/formattingWrites.ts`: heading/clear guards, whole-Rem highlight safety, style plans, and metadata-preserving formula conversion.
- `src/remnote/richTextFormatting.ts`: rich-node-aware range resolution and targeted math-node replacement.
- `src/remnote/write/styleMutationInvariant.ts`: operation-specific style-only and rich-replacement identity/structure invariants.
- `src/remnote/write/remnoteSdkHelpers.ts`, `src/remnote/read.ts`: rich node construction and normalized readback.
- `shared/bridge/markdown-importer.ts`: rich emphasis/link/quote/list semantics and documented table/numbering fallbacks.
- `tests/rich-repair-phase5.test.ts`, `src/remnote/write/style-correctness-regression.ts`, `tests/style-presets.test.ts`, `tests/write-idempotency-duplicates.test.ts`.

#### Investigation tasks

- [x] Separate operation invariants: style-only, rich replacement, text replacement, math conversion, and property mutation require different allowed deltas.
- [x] Measure installed-SDK rich-text behavior on the disposable mixed text/math fixture: plain length `18`, SDK length `14`, math width `2`; direct card metadata was read separately and unsupported property mutations were rejected before write. Reference/card-item interior range mutation is not exposed as a supported operation.
- [x] Probe heading mutation and Markdown heading creation on disposable Rems: mutation returned `SDK_UNSUPPORTED` before write, created Markdown headings read `normal`, and no `Size`/heading metadata children, ID change, text change, or order drift occurred.
- [x] Define a supported fallback if native heading mutation is unsafe; do not encode heading metadata as visible child text.
- [x] Trace formula conversion from raw text to rich node and identify how adjacent/existing emphasis should be merged.
- [x] Determine which Markdown emphasis, quote, numbering, and table semantics can be represented natively versus documented fallback.

#### Implementation tasks

- [x] Apply the correct invariant per operation; a requested full rich replacement may change plain text but must preserve ID, parent, order, and unspecified children.
- [x] Build targeted repairs by transforming the existing rich array and preserving every untouched node/style field.
- [x] Resolve style ranges against rich-node boundaries; never apply plain-text offsets blindly across math or other non-text nodes.
- [x] Support whole-node math styling only when the SDK exposes a safe property; otherwise return `SDK_UNSUPPORTED` with an exact fallback.
- [x] Preserve existing emphasis/color/highlight when converting only the requested formula span.
- [x] Gate heading capability behind explicit live-validation opt-in, verify enabled mutations by direct property readback, and reject visible metadata pollution/no-op claims.
- [x] Extend Markdown inline parsing to produce supported bold/italic/link/quote/list semantics instead of discarding markers; declare fallback limits for tables/numbering.

#### Regression tests

- Rich round trip: mixed text, styled text, inline math, block math, references, cloze metadata, and unchanged Rem ID.
- Invariant: style-only cannot change plain text; full replacement can change requested text but not unrelated identity/structure.
- Heading property: create/mutate/readback with visible-child pollution checks and capability-off fallback.
- Markdown parser: bold/italic/link/code/blockquote/ordered list/table fixtures and semantic output.
- Fault: SDK range rejection leaves original rich content intact and reports no false success.
- End to end: Tests 03, 05, 06, 07, 12, and the relevant Test 15 style checks.

#### Acceptance criteria

- Styling a math Rem preserves the math node, formula content, existing Rem ID, parent, sibling order, and unrelated styles.
- Formula conversion changes only the designated formula span and preserves existing emphasis/color outside and on supported portions of that span.
- Full rich replacement that matches the requested rich content cannot be reported as a style-only partial failure.
- Heading mutation either round-trips the native property without visible metadata children or returns a truthful unsupported result before mutation.
- `Size`, `H1`, `H2`, `H3`, and `normal` never appear as generated metadata child Rems.
- Supported Markdown emphasis becomes rich style metadata; unsupported presentation is explicit and does not claim exact visual fidelity.

#### Required evidence before completion

- Commands: `npm run test:style-correctness`, `npm test -- tests/style-presets.test.ts tests/write-idempotency-duplicates.test.ts tests/agents-staged-repair-simulation.test.ts`, `npm run check-types`, `npm run build`.
- Attach raw rich-text before/after, exact Rem IDs, property readback, unsupported-capability results, and targeted benchmark reruns.
- Prove Test 06 core rich-math creation remains at its prior reliable baseline.
- [x] Local command gate passed: rich-repair, native whole-Rem highlight, style, Markdown, idempotency, simulated workflow, type, build, and 261-test repository suites.
- [ ] Deploy the local candidate and rerun mixed-rich/math readback plus targeted Tests 03, 05, 06, 07, and 12. Heading must remain truthful unsupported unless the deployed SDK proves a safe native mutation.

#### Definition of done

Phase 5 is complete only when `RICH-001`, `HEAD-001`, and `MD-002` meet operation-specific invariants in automated and live disposable tests, with no visible metadata pollution or regression in Test 06.

### Phase 6 — Make reads, schemas, errors, scope, and reconnection actionable

**Implementation status (2026-07-15): `LOCAL AND DEPLOYED BASELINE HEALTHY / WEAK-NETWORK SOAK REQUIRED`.** Deployed `a65ce2c` passed 34 read-only and 54 safe-write health checks with zero failures. Local reconnect races, 90-second heartbeat tolerance, read-before-retry, security, schema, and full fault smoke pass. Connector catalog refresh, `startIndex` proof, and a genuine weak-network soak remain open.

#### Objective

Return bounded data with usable continuation, stable schemas, correct error layers, operation identity, and safe reconnect guidance under least privilege.

#### Evidence

- Tests 01, 02, 04, 08, and 10: truncation, SDK tree errors, exact search/uniqueness difficulty, and symbol false negatives.
- Tests 09–10: generic `INVALID_ARGS`, `plugin_permission`, and irrelevant permission advice for state/structure conflicts.
- Tests 03 and 06: transient/late disconnects.
- Live 2026-07-13 snapshot: connected one-session path, broader-than-default developer/full-KB profile, and limited connector/live-proof counts.
- Relevant issues: `READ-001`, `ERR-001`, `OBS-001`.

#### Current code areas

- `src/remnote/read.ts`, `src/remnote/serialize.ts`: depth/child/node limits, search, rich/card property readback.
- `server/src/tools/register-read-tools.ts`, `server/src/tools/schemas.ts`: public schemas and aliases.
- `src/bridge/handlers/scope.ts`, `src/remnote/write/writeErrors.ts`, `shared/bridge/protocol-core.ts`: error taxonomy and layer mapping.
- `server/src/tools/tool-context.ts`: standard envelope, output schema, status, operation ID, retry classification.
- `server/src/bridge/session-router.ts`, `server/src/bridge-hub.ts`, `server/src/bridge/bridge-hub-retry.ts`: active sessions and reconnect behavior.
- Auth, CSRF, same-origin, body-limit, tool-policy, and scope tests under `server/src` and `tests/`.

#### Investigation tasks

- [x] Reproduce bounded `get_rem_tree` and child reads live: current deployed traversal succeeded and reported truncation/limits; the only reproduced continuation failure was the installed connector schema omitting `startIndex`, not an SDK traversal error.
- [x] Evaluate continuation designs based on child indexes/IDs and exact-title lookup without performing an unbounded workspace scan.
- [x] Characterize symbol-heavy SDK search live: an exact symbol-heavy fixture was returned successfully, and direct ID readback confirmed it; bounded/non-exhaustive labeling remains preserved.
- [x] Inventory schema aliases (`text`, `title`, root/parent IDs) and remove only those that create ambiguity; preserve documented compatibility.
- [x] Define error layers for validation, stale conflict, scope, permission, SDK, connection, persistence, and internal failure.
- [x] Fault-test disconnect before dispatch, after dispatch, after acknowledgement, and during result delivery with one and multiple sessions.
- [x] Verify current security controls rather than assuming edge protections: body limits, auth/OAuth, session expiry/revocation, CSRF/same-origin, explicit CORS/proxy behavior, secret-safe logs, and least privilege.

#### Implementation tasks

- [x] Add continuation metadata/token or an exact branch-read workflow for every truncating tree/children result; include applied limits and remaining-state truth.
- [x] Return search coverage metadata and a direct-read/exact-title fallback; distinguish no match from non-exhaustive/no supported search.
- [x] Add dedicated stale/conflict error codes with expected/actual values; reserve `INVALID_ARGS` for input validation.
- [x] Map validation to `validation`, stale state to `conflict`, scope to `plugin_scope`, permission to `plugin_permission`, SDK to `sdk`, persistence to `persistence`, and connectivity to `connection`.
- [x] Make recommended actions specific to the actual layer and never recommend wider permission for an unrelated validation failure.
- [x] Keep one canonical public argument name per field and test supported compatibility aliases at the boundary.
- [x] Ensure every tool result has one operation ID, consistent outer/inner status, traceable target IDs, limits, evidence method, and retry classification.
- [x] On reconnect, restore principal/session/idempotency/job identity before accepting a retry; reject ambiguous multiple-session routing.
- [x] Keep default profiles least-privileged and require explicit elevation; never weaken OAuth, bearer, CSRF, same-origin, or scope checks to make a benchmark pass.

#### Regression tests

- Read: pagination/continuation, exact branch reads, truncation at every limit, symbol/title queries, SDK error mapping.
- Schema: canonical names, accepted legacy aliases, rejected ambiguity, registered output schema versus `structuredContent`.
- Error: table-driven code/layer/action cases including stale guarded update with expected/actual text.
- Reconnect: before/after dispatch, unknown result, multiple sessions, expired/revoked pairing, state restoration.
- Security: existing auth/scope/CSRF/body-limit/boundary suites plus safe logging assertions.
- End to end: Tests 01, 02, 09, and 10; connection controls in Tests 03, 06, and 15.

#### Acceptance criteria

- Every truncated read identifies the applied depth/child/node limits and a deterministic continuation/branch action.
- Search never returns an unqualified “not found” when results are bounded or SDK coverage is non-exhaustive.
- Stale guarded updates return a dedicated conflict error with expected and actual text.
- Validation, permission, scope, SDK, persistence, and connection errors report the correct layer and action.
- A tool cannot expose `ok: true`/`PASS` while its inner result says failed, partial, blocked, or verification failed.
- Unknown write outcome after disconnect returns read-before-retry guidance and retains the original operation/idempotency identity.
- Multiple active sessions never route a write ambiguously.
- Default public access remains least-privileged; no scope violation or secret disclosure occurs in tests/logs.

#### Required evidence before completion

- Commands: `npm test -- tests/read-tools.test.ts tests/tool-status-matrix.test.ts tests/timeout-budgets.test.ts tests/http-body-limit.test.ts`, `npm run server:test:tool-schemas`, `npm run server:test:boundaries`, `npm run server:test:connector-compat-routing`, `npm run server:test:codex-routing`, `npm run server:smoke`.
- Attach continuation examples, error matrix, reconnect timeline, live connection diagnostics, and targeted benchmark reports.
- Prove no regression in guarded correction, hierarchy surgery, scope, approval, or idempotency.
- [x] Local unit gate passed: read/error/retry/reconnect regressions, Area 1/3 schemas, source fidelity, idempotency, style schema, structured depth, performance, security, health routing, full server fault smoke, and the 261-test repository suite.
- [x] Targeted deployed controls for Tests 01, 02, 09, and 10 completed: connection, tree/direct-ID reads, stale-text conflict, hierarchy operations, and scope passed; symbol search returned a bounded false negative, stale parent used `INVALID_ARGS`, and connector continuation drift remained. Local fixes cover stale parent/reconnect; refresh the connector and rerun search/continuation after deployment.

#### Definition of done

Phase 6 is complete only when `READ-001`, `ERR-001`, and `OBS-001` meet read/schema/error/reconnect/security criteria in local suites and targeted live tests without widening access or hiding unsupported behavior.

### Phase 7 — Lock architectural seams and pass the release benchmark

**Implementation status (2026-07-15): `LOCAL RELEASE CANDIDATE COMPLETE / POST-DEPLOY RELEASE GATE OPEN`.** State, compiler, verifier, migration, compatibility, UX, CI definition, Graphify, PostgreSQL, security, full server smoke, 28 files / 261 tests, types, validation, and builds pass. The standalone review is `/tmp/architecture-review-remnote-mcp-2026-07-15.html`. Release remains open because the edited candidate has not been pushed/deployed and cannot reuse `a65ce2c` as post-fix proof.

#### Objective

Reduce change coupling only around proven defects, then establish an honest release result across the required benchmark runs.

#### Evidence

- `ARCH-001` and the cross-file traces in Phases 1–6.
- Historical Test 14 is blocked twice; deployed `81eef93` Test 14 was blocked at its pre-job planner gate; Tests 11–12 remain partial. The latest Test 15 content/card core passed, but the local candidate still needs a post-deploy independent capstone.
- Reliable tests show broad rewrites would create unnecessary regression risk.

#### Current code areas

- Import seam: `shared/bridge/bulk-import.ts`, `server/src/bulk-import/`, `server/src/tools/register-bulk-import-tools.ts`, storage providers.
- Design seam: `src/remnote/templates/designTemplates.ts`, `src/remnote/write/designedNoteTools.ts`, design registration/UI state.
- Verification seam: `src/remnote/write/verification.ts`, card/design/import verifiers, `server/src/tools/tool-context.ts`.
- Test/release scripts in root and `server/package.json`, smoke/audit entrypoints under `server/src/`, and `server/src/area3-certification.ts`.
- Native widget/release seam: `src/widgets/bridge-status.tsx`, `src/widgets/bridge-panel/runtime-actions.ts`, `src/widgets/bridge-panel/design-styles.ts`, `src/index.css`, `public/logo.svg`, `.github/workflows/ci.yml`, and `PRODUCT.md`.

#### Investigation tasks

- [x] Re-run the graph/module inspection after Phases 1–6 and identify only remaining high-coupling defect seams.
- [x] Verify that proposed module boundaries improve depth: callers depend on stable state-machine/compiler/verifier interfaces, not internal orchestration details.
- [x] Identify compatibility/migration obligations before moving persistent types or public schemas.

#### Implementation tasks

- [x] Extract deep, test-locked interfaces only where prior phases prove leverage: import state transition/persistence/reconciliation, design compiler, and evidence-specific verifier adapters.
- [x] Keep parsing, writing, verification, repair, and persistence as separable seams with explicit inputs/outputs.
- [x] Preserve public tool names and compatible schemas unless a versioned migration is required.
- [x] Preserve existing pathways; no dead duplicate path was removed without live supported-caller evidence.
- [x] Run final dependency-graph inspection only after behavior and schemas are final; restore generated outputs that indexed untracked benchmark fixtures, and do not let docs imply live proof that was not run.
- [x] Add a least-privilege CI workflow with real PostgreSQL durability, security, schemas, idempotency, health routing, types, tests, validation, and builds; keep independent GitHub status as a post-push gate.
- [x] Replace the native widget setup/diagnostic wall with Connection, Writing Access, and Design Style; put diagnostics and dangerous controls under Advanced Details.
- [x] Add the `Structured Science` recommended preset, current-style capture, custom-style deletion, resilient clipboard/health actions, and the supplied logo on both native brand surfaces.

#### Regression tests

- Full local suite: unit, integration, storage, boundary, style, schema, routing, and build.
- Architecture: dependency-boundary tests for the new seams and no verifier-to-writer/storage imports.
- Migration: old persisted job/template fixtures load conservatively.
- Live: targeted reruns from Section 8 and final independent Test 15 runs.

#### Acceptance criteria

- A change to import persistence does not require editing Markdown parsing or card/design verification.
- A new design rule is added once to schema/compiler/manifest verification, not duplicated across unrelated writers.
- Verifier modules cannot mutate writers or persistent progress through hidden imports.
- Public compatibility and persistent migrations are documented and tested.
- All release gates in Section 10 pass without waived P0/P1 issues or false success claims.

#### Required evidence before completion

- Commands: `npm test`, `npm run check-types`, `npm run validate`, `npm run build`, `npm run server:build`, `npm run server:smoke` plus all relevant `server:test:*` gates from prior phases.
- Attach complete outputs, dependency diff, migration fixtures, before/after benchmark behavior, and a no-regression matrix.
- [x] Updated 2026-07-15 local gate passed: 28 test files/261 tests, types, SDK validation, plugin/server builds, security, tool schemas, idempotency, health routing, full fault smoke, and PostgreSQL restart/CAS durability.
- [x] Dependency graph refreshed locally on 2026-07-15 to 4,567 nodes / 10,418 edges; architecture tests lock the import/compiler/verifier seams and conservative migrations; the standalone review was generated and opened from `/tmp/architecture-review-remnote-mcp-2026-07-15.html`.
- [x] Native widget source/build acceptance passed: setup text is absent, the supplied logo is copied byte-for-byte to `dist/logo.svg`, accessibility styles retain 44px controls/focus/reduced motion, and focused runtime-action/template tests pass. Standalone browser rendering is not valid outside the RemNote SDK host and is not claimed as native visual proof.
- [ ] After push, require the GitHub CI workflow to pass at the candidate SHA and enable branch protection for that workflow before public release.
- [ ] After push/deploy, rerun the targeted Phase 2–5 failures, Test 14 final verification, Tests 11–13, and an independent Test 15. Pre-edit live evidence cannot close this candidate's release gate.

#### Definition of done

Phase 7 is complete only when `ARCH-001` is closed by bounded seam improvements and every Section 10 release condition is supported by current automated and live benchmark evidence.

## 6. Cross-cutting engineering requirements

### Scope and identity safety

- Resolve explicit target IDs before focus/selection fallbacks. Echo principal, approved root, target, parent, and operation ID in audit evidence without logging secrets.
- Validate every target and created/moved descendant against the approved scope. Scope checks are not substitutes for authentication or write approval.
- Never broaden scope, tool profile, CORS, proxy trust, OAuth, CSRF, same-origin, or session policy to make a test pass.

### Idempotency and unknown outcomes

- Every write, repair, reconcile, and destructive action uses a stable request hash and idempotency key bound to principal, tool, and target.
- `already_applied` must return the original stable IDs and zero new mutations.
- Timeout/disconnect after dispatch is `unknown`, not failed. Perform read-before-retry using expected IDs/hashes/parentage. No blind retry and no duplicate repair artifact.
- Preserve idempotency and attempt records across reconnect and restart.

### Persistent state

- Encode legal job transitions centrally and test them exhaustively.
- Persist state changes atomically with revision/conflict protection. Record who/what caused each transition.
- Verification does not mutate progress. Reconciliation is explicit, named, audited, and conservative.
- Persistent format changes require versioning, migration tests, rollback/compatibility notes, and conservative handling of ambiguous old state.

### Verification and repair separation

- Parsing describes intended structure; writing materializes it; verification observes it; repair changes it. Do not combine these responsibilities in one implicit call path.
- Generic heuristic verification is advisory. Exact manifest, ID-based, semantic, and live property readback must be labeled and used only for claims they can prove.
- Repair requires exact targets, before-state guards, explicit approval where applicable, and post-write readback.

### Errors and observability

- Use a structured taxonomy: validation, conflict, scope, permission, SDK unsupported, SDK failure, connection, persistence, partial execution, unknown outcome, and internal error.
- Every response includes one operation ID, consistent status, target IDs, mutation IDs, verification method, warnings, retry classification, and phase timings where applicable.
- MCP `structuredContent` must satisfy its registered output schema; failures set `isError` and cannot coexist with a false `PASS` envelope.
- Logs and reports must not contain bearer tokens, OAuth codes, session secrets, cookies, private keys, or raw credentials.

### Compatibility and architecture

- Preserve public tool names, reliable card/creation paths, and old persisted data unless a versioned migration is necessary.
- Prefer deep modules with narrow interfaces around state transitions, design compilation, verification evidence, and storage.
- Avoid broad rewrites of reliable subsystems. Add characterization tests before moving a defect path.
- Keep implementation details local so policy changes do not ripple across parser, writer, verifier, UI, and persistence layers.

## 7. Test strategy

### Layered strategy

1. **Pure parser and normalization tests:** Markdown blocks/inlines, formulas, links, Unicode, logical/native chunks, hierarchy, source and semantic hashes. Validates Tests 05, 06, 14.
2. **Schema and validation tests:** canonical/legacy arguments, file envelopes, output schemas, error taxonomy, limits. Validates Tests 01, 02, 09, 10, 14.
3. **Rich-text round-trip tests:** mixed nodes, targeted ranges, style preservation, headings, math conversion, identity. Validates Tests 03, 05, 06, 07, 12, 15.
4. **Card metadata tests:** all card families, direct SDK metadata, organizational headings, literal cloze, MCQ/list serialization, duplicates. Validates Tests 03, 07, 08, 12, 13, 15.
5. **Design-template serialization tests:** analyze identity, versioned save/load, compiler manifest, UI selection, one-root materialization. Validates Tests 11, 12.
6. **Import state-machine tests:** exhaustive transitions, next action, unknown outcome, reconciliation, completed-chunk exclusion. Validates Test 14.
7. **Persistence and reconnection tests:** memory/Postgres, restart boundaries, CAS conflicts, session restore, durable idempotency. Validates Tests 01, 06, 14, 15.
8. **Verifier read-only invariant tests:** mutation spies and serialized-state equality across import, design, card, and fidelity verifiers. Validates Tests 11–15.
9. **Fault-injection tests:** timeouts, disconnects, lost acknowledgements, partial envelopes, stale writers, SDK range/tree errors, multiple sessions. Validates Tests 02, 03, 06, 07, 14, 15.
10. **Live RemNote benchmark reruns:** exact operation logs, Rem IDs, property/rich readback, before/after artifacts, independent run roots. Validates final user-visible behavior.

### Test-to-phase map

| Benchmark test | Primary phases | What it validates |
| --- | --- | --- |
| 01 | 6, 7 | Connection, deployment identity, scope, tool exposure. |
| 02 | 4, 6 | Retrieval, truncation, search, card-verifier restraint. |
| 03 | 4, 5, 6 | Tool choice, heading capability, non-card verification, reconnect. |
| 04 | 5, 7 | Clean structured note and heading/property readback. |
| 05 | 2, 5 | Markdown semantic and rich presentation fidelity. |
| 06 | 5, 6, 7 | Core rich math preservation and late disconnect handling. |
| 07 | 5 | Precision styling, rich replacement, math ranges, headings. |
| 08 | 3, 4, 7 | Safe extension regression and preview/verifier restraint. |
| 09 | 6, 7 | Guarded correction, stale conflict, ID preservation, no-op recovery. |
| 10 | 6, 7 | Hierarchy surgery, exact errors, search fallback. |
| 11 | 3, 4, 7 | Design analysis, storage, materialization, verification, UI selection. |
| 12 | 3, 4, 5, 7 | Design diagnosis, formula repair, exact readback. |
| 13 | 4, 7 | Functional card families, repeatability, verifier accuracy. |
| 14 | 1, 2, 7 | Durable resumability, reconciliation, file ingestion, hierarchy/fidelity. |
| 15 | 3–7 | Full integration, recovery restraint, independent-run stability. |

## 8. Required benchmark reruns

Use disposable, uniquely named roots under the approved benchmark root. Preserve prior artifacts unless the benchmark explicitly authorizes cleanup. Do not rerun all tests after every small change.

| After phase | Required reruns | Required focus |
| --- | --- | --- |
| Phase 1 | Test 14 twice consecutively | State/readback agreement, IDs, restart/reconnect, no replay, read-only verification. |
| Phase 2 | Tests 05 and 14; Test 06 control | Markdown semantics, hierarchy, file routes, chunking, formula non-regression. |
| Phase 3 | Test 11 in at least two independent runs | Exact source identity, template lifecycle, one root, supported rule transfer, UI/direct parity. |
| Phase 4 | Tests 11, 12, and 13 | Stored-rule verification, zero false card defects, direct metadata truth. |
| Phase 5 | Tests 03 and 07; targeted 05, 06, 12 checks | Heading capability, rich replacement, math styling, emphasis preservation. |
| Phase 6 | Tests 01, 02, 09, and 10; connection portions of 03/06 | Continuation, search, error taxonomy, reconnect, least privilege. |
| Phase 7 | Test 14 twice; Tests 11–13; full Test 15 independent runs | Final integrated release evidence and repeatability. |

The 2026-07-14 supplement records an independent pre-fix Test 15 Run 03 under `New test`; it confirmed capstone structure/cards and reproduced design/verifier defects. Release still requires a new independent Test 15 run after this local candidate is pushed and deployed. A recovery continuation is not an independent core test.

## 9. Non-goals

Protect these evidence-backed capabilities. Change them only when a failing characterization test proves the remediation requires it.

- Do not redesign simple child creation or clean structured-note creation; Test 04 was strong.
- Do not rewrite safe extension; Test 08 achieved exact source preservation and a perfect artifact score.
- Do not replace guarded factual correction or hierarchy surgery; Tests 09 and 10 were highly reliable and ID-safe. Only improve their error taxonomy and evidence envelopes.
- Do not replace core rich-math creation; Test 06 achieved complete formula fidelity. Repair targeted style/range behavior around it.
- Do not redesign functional multi-family card creation; Test 13 produced 14/14 correct, duplicate-free cards twice, and Test 15 cards remained functional. Fix verifier and preview seams.
- Do not fake heading success with visible metadata children or plain text.
- Do not add broad workspace scans to compensate for bounded reads/search.
- Do not treat benchmark fixture defects, agent schema mistakes, or connection failures as plugin logic defects.
- Do not perform broad architecture cleanup, documentation rewrite, or dependency migration unrelated to the consolidated issues. The bounded native operator-panel redesign in `UX-001` is explicitly in scope; unrelated product UI is not.

## 10. Final release gate

Release is allowed only when all conditions below have current evidence at the candidate commit and deployed plugin version.

- [ ] No Priority 0 issue remains open at the deployed candidate; local state-machine and PostgreSQL restart/CAS tests pass, but two-run deployed Test 14 proof remains outstanding.
- [ ] Every Priority 1 acceptance criterion is met; unsupported SDK features are explicit and cannot produce false success.
- [x] The complete local gate passes at the candidate revision: `npm test` (28 files / 261 tests), types, SDK validation, plugin/server builds, full server fault smoke, security/schema/idempotency/health routing, and PostgreSQL restart/CAS durability pass.
- [ ] Test 14 passes twice consecutively with persistent storage, no verifier mutation, no replay, no lost IDs, no state/artifact disagreement, no hierarchy corruption, and no persistent duplicates.
- [ ] Test 11 design learn/save/apply workflows pass in the required independent runs with one target root and complete supported-rule accounting.
- [ ] Test 12 diagnosis/repair passes without style loss or generic-verifier false claims.
- [ ] Test 13 remains functional, 14/14 correct, duplicate-free, and free of aggregate false card defects in main and repeat runs.
- [ ] Test 15 passes the required independent run set, including a new Run 03, within the benchmark repeatability threshold.
- [x] Connection, branch, deployed commit `a65ce2c`, SDK `0.0.46`, explicit `New test` scope, and one active session are recorded. Read-only and safe-write health passed with zero failures. The post-fix candidate commit must be added after commit/deployment.
- [x] No scope violation, unauthorized write, secret disclosure, blind retry, or ambiguous-session write occurred in the 2026-07-14 campaign or local gates.
- [ ] No silent content loss, Rem-ID instability, unrelated-note mutation, child-order drift, or visible metadata pollution occurred.
- [x] Latest live direct readback found no persistent duplicate root, repair artifact, or card. Test 14 created no job because the source-plan gate failed, so it made no duplicate import artifact.
- [ ] No verifier or standard envelope made a false success claim; every final claim is traceable to exact live readback or the appropriate evidence class.
- [x] Benchmark/fixture defects, connector/deployment drift, SDK limitations, and agent-only mistakes are reported separately from confirmed plugin defects.
- [x] This roadmap supplement and task handoff include before/after behavior, command results, operation/Rem IDs, report provenance, and an explicit deployed-live versus local-candidate proof boundary.

The final release checkbox may be marked complete only after all boxes above are checked with linked evidence from the same candidate revision. A partial, blocked, simulated-only, or registry-only result is not release proof.
