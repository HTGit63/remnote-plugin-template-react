# Build Week Final Judge Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use verification-before-completion, test-driven-development for any product behavior change, remnote-mcp-workflow-auditor for proof boundaries, and security-best-practices for the final audit. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Produce a truthful, runnable OpenAI Build Week judge package, restore ChatGPT exposure of uploaded MP3/MP4 tools, benchmark every registered tool, and rewrite the public and judge documentation in the builder's direct voice.

**Architecture:** Keep the existing tool-only MCP + RemNote desktop-plugin architecture. Diagnose uploaded-file exposure at the serialized `tools/list` and deployed connector layers; change production behavior only if a failing regression proves a remaining code defect. Generate the benchmark inventory from the current registry and keep local, simulated, hosted, plugin-connected, live mutation, readback, and human playback evidence separate.

**Tech Stack:** TypeScript, Node.js, MCP SDK, React 17 RemNote plugin, Vitest, PostgreSQL-backed hosted storage, Markdown documentation.

## Global Constraints

- Work only on `judges/openai-build-week-v0.1.1`.
- Do not merge, tag, deploy, force-push, rewrite history, or push.
- Judges use RemNote desktop **Develop from localhost**; the packaged ZIP remains a review artifact, not the primary test path.
- Derive all counts, hashes, versions, endpoints, tool profiles, and test results from current evidence.
- Never promote local or simulated proof into live RemNote or human media proof.

---

### Task 1: Diagnose uploaded audio/video exposure and freeze the evidence

**Files:**
- Modify only if a failing test proves a defect: `server/src/tools/schemas.ts`, `server/src/tools/register-media-tools.ts`, `server/src/tool-registry.ts`, `server/src/tool-policy.ts`
- Test: `tests/chatgpt-app-contract.test.ts`, `tests/media-tools.test.ts`, `tests/hosted-image-media.test.ts`

**Interfaces:**
- Consumes: MCP `tools/list`, `_meta["openai/fileParams"]`, strict ChatGPT file reference objects.
- Produces: discoverable `insert_audio_from_file` and `insert_video_from_file` descriptors with persistent HTTPS hosting and native readback.

- [x] Inspect local and deployed `tools/list`, current branch/remote SHAs, profile policy, and exact uploaded media files.
- [x] If a defect remains, add one failing descriptor or runtime regression and run `npm test -- --run tests/chatgpt-app-contract.test.ts tests/media-tools.test.ts` to observe the expected failure.
- [x] Apply the smallest safe implementation change; do not weaken SSRF, MIME, byte, ownership, auth, scope, or cleanup controls.
- [x] Re-run the focused tests and confirm the uploaded-file descriptors are serialized for image, audio, and video.

### Task 2: Build a fresh all-tool benchmark and security audit

**Files:**
- Modify: `judges/BENCHMARKS.md`
- Modify: `judges/BUILD_WEEK_ENGINEERING_AUDIT.md`

**Interfaces:**
- Consumes: registry/policy metadata, generated tool reference, current tests, mass-note audit, hosted bridge diagnostics, local environment.
- Produces: one row for every current registered tool, measured local timings where safe, and explicit `BLOCKED`/`NOT RUN` reasons elsewhere.

- [x] Capture `git rev-parse HEAD`, branch, UTC time, Node/npm/OS versions, database state, hosted identity, plugin connection, and active profile.
- [x] Run the repository inventory/certification scripts and generate the authoritative tool/profile matrix.
- [x] Run reproducible monotonic-timer local benchmarks with one warm-up and at least ten measured runs for safe descriptor/diagnostic paths; retain existing connected results only when their proof source is identified.
- [x] Run required install, test, type, build, smoke, auth, routing, schema, profile, idempotency, storage, fidelity, style, media, import, security, boundary, and dependency-audit gates.
- [x] Audit the touched media/server path for SSRF, MIME/byte validation, redirects, DNS/IP filtering, auth/scope, ownership, error redaction, and active-content handling.
- [x] Write the benchmark with current counts, measurements, blocked tools, rubric, reproduction commands, and proof boundaries.

### Task 3: Consolidate and rewrite the documentation

**Files:**
- Modify: `README.md`, `judges/README.md`, `judges/BENCHMARKS.md`
- Rename/rebuild: `judges/STAGE_1_7_AUDIT.md` to `judges/BUILD_WEEK_ENGINEERING_AUDIT.md`
- Delete after evidence migration: `judges/MEDIA_MCP_FUNCTIONAL_SECURITY_AUDIT.md`

**Interfaces:**
- Consumes: live Devpost description and criteria, Git history, historical `AGENTS.md` states, Codex session evidence, benchmark output.
- Produces: public user guide plus exactly three primary judge Markdown documents.

- [x] Reconstruct the pre-Build-Week baseline, event chronology, AGENTS evolution, milestones, failures/repairs, release identity, and current judge-branch delta from Git and bounded Codex records.
- [x] Rewrite `README.md` for normal users with local-first RemNote desktop setup, architecture, workflows, safety, current limitations, and judge-evidence links.
- [x] Rewrite `judges/README.md` as the product story and evaluation guide mapped to all four official criteria.
- [x] Merge all unique media/security evidence into the engineering audit, then remove both superseded audit filenames and fix every internal link.
- [x] Keep the primary `/feedback` session `019f761b-7a26-7413-a2b1-99112f18888d` and every verified material supporting session, without publishing private transcript content.

### Task 4: Cross-document verification and commit

**Files:**
- Verify all changed files; no additional scope.

**Interfaces:**
- Consumes: completed code, benchmark, audit, and documentation.
- Produces: one reviewable judge-branch commit with an honest readiness verdict.

- [x] Compare all four documentation surfaces for product framing, architecture, counts, endpoints, platform, version, SHA, tests, media support, sessions, and timeline.
- [x] Confirm `judges/` contains exactly `README.md`, `BUILD_WEEK_ENGINEERING_AUDIT.md`, and `BENCHMARKS.md` as its primary Markdown documents.
- [x] Run the complete fresh verification set and `git diff --check`; inspect the final diff and repo status.
- [x] Commit with a focused message only after every claimed gate has current exit-zero evidence.

## Self-Review

- Spec coverage: media exposure, every-tool benchmark, Devpost-aligned voice, local judge flow, three-file consolidation, Codex history, security, and proof boundaries are each mapped above.
- Placeholder scan: no implementation placeholders remain; blocked live checks must be recorded as blocked, not deferred silently.
- Type consistency: file parameters remain `imageFile`, `audioFile`, and `videoFile`; benchmark inventory comes from the same current registry and policy used by `tools/list`.
