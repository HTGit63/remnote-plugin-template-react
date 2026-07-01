# Plan: RemNote MCP 7-Report Repair

**Generated**: 2026-07-01  
**Complexity**: High  
**Mode**: staged, root-cause-first, no broad rewrite

## Overview

Goal: make Tests 01-07 rerun cleanly, with hard focus on total failures first: Test 05 and Test 07. Keep live proof honest: local tests can prove code behavior, but live PASS still requires running ChatGPT + connected RemNote plugin.

Main failing Module cluster:

- Markdown writer Module: `src/remnote/write/markdownImportExecutor.ts`, `src/remnote/write/structuredBatch.ts`, `src/remnote/write/remnoteSdkHelpers.ts`
- Bulk import Module: `shared/bridge/bulk-import.ts`, `server/src/tools/register-bulk-import-tools.ts`, `server/src/bulk-import/job-store.ts`
- Read/schema Module: `server/src/tools/register-read-tools.ts`, `server/src/tools/schemas.ts`
- Runtime/profile Module: `server/src/tool-policy.ts`, `server/src/tools/register-status-tools.ts`

Architecture rule: deepen verification seam. Callers should not know created-ID quirks, RemNote heading metadata quirks, or chunk hierarchy rules. One verification interface must read root subtree, detect pollution, and decide pass/fail.

## Current Stage Status

| Stage | Status | Notes |
| --- | --- | --- |
| Sprint 1 hard failures | DONE_LOCALLY | Test 05/Test 07 root causes fixed in writer, bulk planner, hierarchy, and readback verifier. |
| Sprint 2 partials | DONE_LOCALLY | Dry-run resume/step no longer mutate job state; `get_document_or_folder_tree` accepts `remId`; file import accepts connector file aliases/objects. |
| Sprint 3 warnings | GATED | Active `danger` profile, ChatGPT platform blocks, live latency, and uploaded-file rewrite still require the active ChatGPT + RemNote runtime rerun. |

## Report Triage

| Report | Verdict | Issue | Code Cause | Fix | Absolute? |
| --- | --- | --- | --- | --- | --- |
| Test 01 | PASS_WITH_WARNINGS | Active profile `danger`; compact report single long Rem | profile env/session broader than default; `create_rem` is one-Rem writer | keep warning; use narrower profile for rerun; compact reports can use child Rems later | Profile fix is environment-gated |
| Test 02 | PASS_WITH_WARNINGS | Active profile broad; platform blocks; missing per-tool locality metadata | runtime profile not narrowed; capability guide lacks execution-location field | add/verify `executionLocation` metadata later; rerun under `mass_note_writer` | Platform blocks not repo-absolute |
| Test 03 | PARTIAL | step verification contradicted final verify; math/source mismatch; `Size` pollution; dry-run resume mutates job state; loose arg fallback | `runOneChunk` trusts writer verification; Markdown verifier reads created IDs not subtree; dry-run uses same mutation path; schema accepts no `remId` alias for doc tree | Stage 1-3 fixes below | Mostly absolute locally; live latency remains gated |
| Test 04 | PASS_WITH_WARNINGS | broad profile, latency, fuzzy search, platform block | env/profile; search relevance + scope post-filter; runtime latency | no hard code blocker for 01-07; keep exact search as later low-risk task | Not absolute for platform/latency |
| Test 05 | FAILED | built-in Markdown verification missed visible `Size -> H1/H3` Rems | write path applies heading style through `setFontSize`; verifier collects only known created IDs, so SDK-created metadata children are invisible | strip unsafe heading style from normal Markdown content writes; verify full created root subtree; fail on `Size/H*` pollution | Absolute for repo behavior; live must confirm RemNote SDK no longer emits pollution |
| Test 06 | PARTIAL | `plan_note_import_from_file` cannot consume uploaded `/mnt/data` path | server path resolver has local support, but connector/schema path rewrite not wired for ChatGPT file arg | add schema/metadata support for file refs if platform supports it; return resolved path/hash on success | Not absolute until ChatGPT connector rewrite rerun |
| Test 07 | FAILED | final verifier fails; duplicate title wrappers; duplicate anchor; `Size` pollution; step verification too weak | `splitSections()` only recognizes numbered headings; `ensureChunkHierarchy()` creates import root + chapter root when titles equal; chunk writer re-imports source H1; verifier trusts chunk-local success | recognize generic H2+ section headings; collapse duplicate import/chapter roots; verify chunk by live subtree; strip unsafe heading style | Absolute for synthetic source locally; live rerun required |

## Sprint 1: Hard Failure Core

**Goal**: fix Test 05 + Test 07 root causes without touching cards/design/cleanup.

**Demo/Validation**:

- `npm test -- tests/bulk-import.test.ts tests/bulk-import-tools.test.ts tests/write-idempotency-duplicates.test.ts`
- `npm run test:style-correctness`
- `npm run check-types`

### Task 1.1: Add Regression Tests

- **Location**: `tests/bulk-import.test.ts`, `tests/bulk-import-tools.test.ts`, `tests/helpers/fakeRemnote.ts`
- **Description**: Add tests for generic H2 section splitting, duplicate root/chapter collapse, no `Size/H*` pollution in Markdown writes, and live-readback chunk verification.
- **Dependencies**: none
- **Acceptance**:
  - Current failure shape is reproduced locally.
  - Tests fail before patch, pass after patch.

### Task 1.2: Stop Visible Heading Metadata Pollution

- **Location**: `src/remnote/write/markdownImportExecutor.ts`, `src/remnote/write/structuredBatch.ts`
- **Description**: For normal Markdown content writes, create content without heading `setFontSize` mutations. Styling remains separate/higher-tier until style invariant tests pass.
- **Dependencies**: Task 1.1
- **Acceptance**:
  - No `setFontSize` call during `create_or_replace_note_from_markdown` content path.
  - Verification still preserves source text, formulas, anchors.

### Task 1.3: Verify Full Markdown Subtree

- **Location**: `src/remnote/write/markdownImportExecutor.ts`
- **Description**: Replace created-ID-only verification with root-subtree text traversal so unexpected child Rems appear in source-fidelity check.
- **Dependencies**: Task 1.2
- **Acceptance**:
  - Any visible `Size`, `H1`, `H2`, `H3`, `normal` child fails verification.
  - Built-in verification agrees with manual `get_rem_tree` for pollution.

### Task 1.4: Fix Bulk Section Planning

- **Location**: `shared/bridge/bulk-import.ts`
- **Description**: Treat generic H2+ headings as section starts, not only numbered headings. Strip chapter H1 from chunk source.
- **Dependencies**: Task 1.1
- **Acceptance**:
  - Test 07 source plans Section A/B/C as sections.
  - Chunk text excludes section headings when section body exists.

### Task 1.5: Collapse Duplicate Bulk Roots

- **Location**: `server/src/tools/register-bulk-import-tools.ts`, `server/src/bulk-import/job-store.ts`
- **Description**: If `importRootTitle` equals `chapterTitle`, use one root, not nested duplicate roots.
- **Dependencies**: Task 1.4
- **Acceptance**:
  - `rootTitle == chapterTitle` creates/reuses one Rem.
  - Full Chapter One case still keeps distinct import root + Chapter One root when titles differ.

### Task 1.6: Make Chunk Verification Live-Readback Based

- **Location**: `server/src/tools/register-bulk-import-tools.ts`, `shared/bridge/bulk-import.ts`
- **Description**: After a chunk write, read the chunk/section subtree and run same normalized source-fidelity/pollution checks used by final verification. If readback unavailable, mark `written_not_verified`, not `verified`.
- **Dependencies**: Task 1.3, Task 1.4
- **Acceptance**:
  - `run_note_import_job_step` cannot report verified if final verifier would fail on same readback.
  - `verify_note_import_job` and step status agree.

## Sprint 2: Partial Report Fixes

**Goal**: clear Test 03 + Test 06 partial blockers that are repo-fixable.

### Task 2.1: Pure Dry-Run Resume

- **Location**: `server/src/tools/register-bulk-import-tools.ts`, `server/src/bulk-import/job-store.ts`
- **Description**: `resume_note_import_job({ dryRun:true })` returns projected action without mutating job/chunk state.
- **Acceptance**:
  - Before/after job status equal for dry-run resume.

### Task 2.2: Strict Read Tool Args

- **Location**: `server/src/tools/register-read-tools.ts`, `server/src/tools/schemas.ts`
- **Description**: Add explicit `remId` alias or reject unknown args for `get_document_or_folder_tree`; no silent fallback.
- **Acceptance**:
  - Wrong arg returns schema error or warning, not focused portal fallback.

### Task 2.3: File-Backed Connector Input

- **Location**: `server/src/tools/register-bulk-import-tools.ts`, `chatgpt-app-submission.json`, tool schema generation path
- **Description**: Ensure `sourceFilePath` is exposed as a real file/path argument for ChatGPT mount rewrite where supported. Keep existing local path support.
- **Acceptance**:
  - Local file tests pass.
  - Live Test 06 reaches marker validation and returns Chapter One plan.

## Sprint 3: Warnings + Clean Rerun

**Goal**: reduce warnings without hiding platform/environment limits.

### Task 3.1: Active Profile Proof

- **Location**: `server/src/config.ts`, `server/src/tool-policy.ts`, status tools
- **Description**: Diagnostics must show active/default profile, registry version, schema version, git metadata.
- **Acceptance**:
  - Rerun reports can prove runtime matches branch.

### Task 3.2: Search Exact Mode

- **Location**: `server/src/tools/register-read-tools.ts`, `src/remnote/read.ts`
- **Description**: Add optional exact-title matching under `contextRemId`; keep fuzzy as default.
- **Acceptance**:
  - Exact searches return target first and can suppress fuzzy siblings.

## Testing Strategy

- Unit first: planner/parser/job-store/tool harness.
- Fake RemNote second: Markdown writer + pollution simulation.
- Server smoke third.
- Live rerun last: Tests 01-07 under `mass_note_writer` if possible.

Minimum local gate after Sprint 1:

```bash
npm test -- tests/bulk-import.test.ts tests/bulk-import-tools.test.ts tests/write-idempotency-duplicates.test.ts
npm run test:style-correctness
npm run check-types
git diff --check
```

Full local gate before claiming ready for live rerun:

```bash
npm run check-types
npm run validate
npm run build
npm run server:build
npm run server:smoke
npm test
npm run test:agents-simulated-live
npm run server:test:source-fidelity
npm run server:test:tool-profile
npm run server:test:idempotency
npm run server:test:boundaries
npm run test:style-correctness
git diff --check
```

## Risks / Gotchas

- RemNote SDK `setFontSize` live behavior may differ from fake tests. Mitigation: keep style mutations out of normal Markdown write until style stage.
- ChatGPT platform blocks are not always repo bugs. Mitigation: keep RemNote compact reports low-risk and detailed report in chat/files.
- File mounted paths need live connector proof. Local tests cannot prove ChatGPT file-rewrite metadata.
- Latency spikes need live timing instrumentation; local tests cannot prove stable RemNote app scheduling.

## Rollback

- Revert only files touched in current staged patch.
- If Sprint 1 breaks style/design tests, keep Markdown content path safe and move style behavior behind explicit higher-tier tooling.
- If live Test 07 still fails after local pass, stop before file-backed/full import and inspect live readback tree.
