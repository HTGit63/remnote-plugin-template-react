# Plan: RemNote MCP Bulk Note Reliability

**Generated**: 2026-06-22
**Estimated Complexity**: High

## Overview

Patch the existing RemNote MCP bridge for chapter-scale imports without live RemNote access. Keep existing small and medium note tools working. Add bounded timeout budgets, longer reconnect windows, resumable bulk import job state, chunk-level idempotency, mock/fake tests, docs, and a manual Plugin Test checklist.

No site URL, navigation, or page hierarchy changes are needed. This is backend/tool workflow work.

## Prerequisites

- Current branch: `fix/remnote-mcp-mass-note-creation-stability`.
- Preserve user-owned untracked reports in `reports/`.
- Do not claim live RemNote proof.
- Use existing product context in `PRODUCT.md`, `DESIGN.md`, and `conductor/README.md`.

## Sprint 1: Baseline And Stability

**Goal**: Establish current write path and patch timeout/reconnect behavior.
**Demo/Validation**:
- Run typecheck and unit tests.
- Inspect diagnostics for timeout/reconnect budget fields.

### Task 1.1: Record Baseline Audit

- **Location**: `reports/`, final response
- **Description**: Capture branch, commit, registry versions, active profile, public tools, hidden tools, build/test commands, and write-path files inspected.
- **Dependencies**: None
- **Acceptance Criteria**:
  - Current branch and SHA reported.
  - Live RemNote status clearly marked not run.
- **Validation**:
  - `git status --short --branch`
  - `git rev-parse --short HEAD`

### Task 1.2: Add Configurable Timeouts

- **Location**: `server/src/config.ts`, `server/src/performance/tool-budgets.ts`, `server/src/tools/tool-context.ts`
- **Description**: Add timeout env vars for default request, high-level writes, bulk steps, reads, mutations, write approval, reconnect window, and reconnect interval.
- **Dependencies**: Task 1.1
- **Acceptance Criteria**:
  - Invalid env values fall back safely.
  - Diagnostics can expose configured timeout budgets.
  - Bulk import steps can use longer bounded budgets.
- **Validation**:
  - Unit tests cover defaults and env overrides.

### Task 1.3: Improve Timeout And Reconnect Details

- **Location**: `server/src/bridge-hub.ts`, `server/src/bridge/bridge-hub-types.ts`
- **Description**: Return structured timeout details, record reconnect attempts, and retain late response evidence.
- **Dependencies**: Task 1.2
- **Acceptance Criteria**:
  - Timeout errors include tool, timeout, duration, lifecycle, mutation risk, retry safety, and recommendation.
  - Reconnect window defaults to 30 seconds with bounded interval.
  - Diagnostics include reconnect config and recent attempts.
- **Validation**:
  - Existing smoke timeout/reconnect tests still pass.

## Sprint 2: Bulk Planner And Manifest

**Goal**: Add pure chunk planning and resumable manifest state that can be tested without RemNote.
**Demo/Validation**:
- Unit tests plan a multi-section Markdown chapter and verify chunk order/hash/idempotency.

### Task 2.1: Add Bulk Import Planner

- **Location**: `shared/bridge/bulk-import.ts`
- **Description**: Parse Markdown into ordered sections/chunks, preserve source text, avoid splitting fenced blocks, compute hashes, and produce stable chunk IDs.
- **Dependencies**: Sprint 1
- **Acceptance Criteria**:
  - Chapter title and sections are detected.
  - Large sections split into bounded chunks.
  - Chunk text preserves source wording.
  - Idempotency keys are deterministic.
- **Validation**:
  - Vitest planner tests.

### Task 2.2: Add Job Manifest Store

- **Location**: `server/src/bulk-import/job-store.ts`
- **Description**: Add memory-backed job store with explicit non-durable warning and state transition helpers.
- **Dependencies**: Task 2.1
- **Acceptance Criteria**:
  - Create/read/update/list/cancel jobs.
  - Save chunk checkpoints/events.
  - Skip verified chunks on resume.
  - Reject same chunk index with changed source hash.
- **Validation**:
  - Vitest store tests.

## Sprint 3: Bulk Import MCP Tools

**Goal**: Add server-side MCP tools for plan/start/status/step/resume/verify/cancel.
**Demo/Validation**:
- Tool registry lists the new tools under `mass_note_writer`.
- Server tests exercise tools without live RemNote writes where possible.

### Task 3.1: Register Bulk Tools

- **Location**: `server/src/tools/register-bulk-import-tools.ts`, `server/src/mcp-server.ts`, `server/src/tool-policy.ts`, `server/src/tool-registry.ts`
- **Description**: Add `plan_note_import`, `start_note_import_job`, `run_note_import_job_step`, `get_note_import_job_status`, `resume_note_import_job`, `verify_note_import_job`, and `cancel_note_import_job`.
- **Dependencies**: Sprint 2
- **Acceptance Criteria**:
  - Planning/status/cancel tools do not require live RemNote.
  - Step tool writes only bounded chunks and uses chunk idempotency.
  - Failure does not claim completion.
- **Validation**:
  - Registry/profile tests.

### Task 3.2: Add Source-Fidelity Verification

- **Location**: `shared/bridge/bulk-import.ts`
- **Description**: Add normalized plain-text comparison, duplicate/missing/wrong-parent report shape, and honest `not_verifiable` state.
- **Dependencies**: Task 3.1
- **Acceptance Criteria**:
  - Hash mismatches fail.
  - Missing and extra text previews are reported.
  - Rich text limitations are explicit.
- **Validation**:
  - Vitest verification tests.

## Sprint 4: Docs And Final Evidence

**Goal**: Leave durable docs, test evidence, and manual live-test checklist.
**Demo/Validation**:
- `docs/bulk-import.md` explains workflow and env vars.
- Final report separates automated proof from manual live proof.

### Task 4.1: Add Documentation

- **Location**: `docs/bulk-import.md`, `plans/remnote-mcp-mass-note-stability.md`
- **Description**: Document bulk import design, tools, timeout env vars, reconnect behavior, idempotency, source-fidelity limits, and manual Plugin Test checklist.
- **Dependencies**: Sprint 3
- **Acceptance Criteria**:
  - No vague live claims.
  - Manual checklist targets `Plugin Test` / `OjLcSppWfIH0cpPoh`.
- **Validation**:
  - Read docs against prompt acceptance criteria.

### Task 4.2: Run Gates

- **Location**: repo root
- **Description**: Run local non-live gates appropriate to changed files.
- **Dependencies**: Task 4.1
- **Acceptance Criteria**:
  - Exact commands and outcomes reported.
  - Any blocked live proof is called out honestly.
- **Validation**:
  - `npm test`
  - `npm run check-types`
  - `npm run server:build`
  - focused server smoke/profile tests as time allows.

## Testing Strategy

- Unit tests for planner, chunking, hash stability, idempotency, source-fidelity reporting, timeout budget config, and job transitions.
- Existing fake RemNote tests for small writer regressions.
- No live RemNote writes in this pass.
- Fake bridge tests for timeout, disconnect, missing verification, successful verification, resume retry with same idempotency key, duplicate chapter/section prevention, and readback-unavailable honesty.

## Potential Risks & Gotchas

- Memory job storage is not durable across server restart. Report clearly.
- Server-side tools need bounded chunk calls so they do not reintroduce one giant write.
- Existing `create_or_replace_note_from_markdown` already has chunk fallback; do not duplicate plugin implementation unnecessarily.
- A timed-out write has unknown mutation status; retry only with same idempotency key or after inspection.

## Rollback Plan

- Revert the new bulk import modules, tool registrations, docs, and tests.
- Keep existing `create_or_replace_note_from_markdown` behavior unchanged.

## 2026-06-23 Review Follow-Up

Additional acceptance criteria from follow-up prompt:

- No `verified` chunk without explicit `verification.passed === true` or later readback proof.
- Manifest tracks `chapterRootRemId`, `sectionRootRemId`, and `chunkParentRemId`.
- Resume does not skip `written_not_verified` chunks.
- `verify_note_import_job` returns `not_verifiable` when live/readback evidence is absent.
- Readiness audit includes branch, SHA, registry/schema versions, default profile, live proof flag, local gate results, and static-only rows.
