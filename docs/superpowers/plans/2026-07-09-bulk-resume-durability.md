# Bulk Resume Durability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make bulk import jobs restartable without duplicate or lost chunks.

**Architecture:** Keep the in-process job state machine explicit, then persist the same plan/job JSON through the existing storage provider when Postgres storage is configured. Tool responses must label `memory_only` vs `persistent` durability and cancellation must block future chunk execution without deleting content.

**Tech Stack:** TypeScript, Vitest, MCP tool handlers, existing Memory/Postgres storage providers.

---

### Task 1: State Machine Guards

**Files:**
- Modify: `shared/bridge/bulk-import.ts`
- Modify: `server/src/bulk-import/job-store.ts`
- Test: `tests/bulk-import.test.ts`

- [x] Add failing tests for invalid chunk/job transitions.
- [x] Add explicit chunk/job transition helpers.
- [x] Route job-store status changes through those helpers.
- [x] Run `npm run test -- tests/bulk-import.test.ts`.

### Task 2: Durability Surface And Storage

**Files:**
- Modify: `server/src/storage/types.ts`
- Modify: `server/src/storage/memory-store.ts`
- Modify: `server/src/storage/postgres-store.ts`
- Modify: `server/src/tools/tool-context.ts`
- Modify: `server/src/mcp-server.ts`
- Modify: `server/src/server/create-http-server.ts`
- Test: `tests/bulk-import.test.ts`
- Test: `tests/bulk-import-tools.test.ts`

- [x] Add failing tests for storage methods and top-level durability fields.
- [x] Add bulk plan/job methods to memory and Postgres storage.
- [x] Pass storage into MCP tool registration.
- [x] Persist plan/job changes from bulk import handlers.
- [x] Run targeted tests.

### Task 3: Resume, Cancel, Audit

**Files:**
- Modify: `server/src/tools/register-bulk-import-tools.ts`
- Modify: `server/src/area3-certification.ts`
- Modify: `server/src/mass-note-audit-report.ts`
- Modify: `docs/engineering-guide.md`
- Modify: `TOOL_REFERENCE.md`

- [x] Add failing tests for cancelled jobs blocking later steps.
- [x] Prevent run/resume after cancel.
- [x] Add Stage 7 audit labels and area3 resume/cancel sequence.
- [x] Regenerate reports/reference where needed.
- [x] Run `npm run server:test:area3` and `npm run server:mass-note-audit`.
