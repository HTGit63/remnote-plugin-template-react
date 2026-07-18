# RemNote MCP — Product Completion Contract

> **Binding repository-wide execution plan for Codex and other coding agents.**
>
> Target branch: `fix/remnote-mcp-mass-note-creation-stability`
>
> The objective is not to accumulate more tools, more stages, or more prose. The objective is to finish a **judge-testable, safe, reliable, verifiable RemNote MCP product** whose exact release commit can be installed, connected, tested, and demonstrated without repository archaeology.
>
> Historical detail belongs in `remnote report/`, Git history, CI, and dated release reports. This file defines **what must be done next, how Codex must work, which skills it must use, what counts as proof, and what “complete” means**.

---

# 0. Skill-enforcement contract

Codex has access to the skills listed below and **must actively use them**, not merely mention them.

## 0.1 Mandatory skill-use protocol

At the beginning of **every stage**, Codex must:

1. Read the stage's **Required skills** list.
2. Activate/use every skill marked **MANDATORY** before editing code for that stage.
3. Follow the selected skill's workflow, not just its title.
4. Print a short stage preamble in its working response:

```text
STAGE:
SKILLS ACTIVATED:
WHY EACH SKILL APPLIES:
EXPECTED DELIVERABLE:
PROOF REQUIRED BEFORE STAGE COMPLETION:
```

5. If a required skill cannot be used, stop that stage and report:

```text
SKILL BLOCKER:
- Missing/unavailable skill:
- Why the stage cannot safely continue:
- Smallest safe fallback:
```

6. Do not mark a stage complete until `verification-before-completion` has been applied to the evidence for that stage.

## 0.2 Global skills that remain active throughout the project

These two are always mandatory:

- `remnote-mcp-workflow-auditor`
- `verification-before-completion`

Their purpose is to prevent the most common failure mode in this repository:

```text
server reachable
≠ plugin connected
≠ MCP call returned
≠ RemNote mutation succeeded
≠ mutation was correct
≠ mutation was idempotent
≠ media rendered
≠ exact release commit was live-proven
```

Codex must keep those proof layers separate in every report.

## 0.3 TDD is mandatory for implementation work

For every bug fix, feature, refactor, behavior change, or media capability:

**MANDATORY skill:** `test-driven-development`

The enforced cycle is:

```text
RED
write one focused failing test
↓
VERIFY RED
prove it fails for the intended reason
↓
GREEN
write the minimum production change
↓
VERIFY GREEN
run the focused test
↓
REGRESSION
run the relevant surrounding suite
↓
REFACTOR
only while all tests remain green
```

**Iron rule:**

> No production behavior change without a failing test first, except for pure documentation/configuration changes that do not alter runtime behavior.

If Codex writes implementation before the failing test, it must revert/delete that implementation and restart the change through RED → GREEN.

## 0.4 Planning is mandatory before multi-subsystem implementation

For any work that touches more than one of:

- MCP tool schema/registry,
- shared bridge protocol,
- plugin bridge handler,
- RemNote write engine,
- SDK capability probing,
- server auth/security,
- UI,
- deployment,
- live test campaign,

Codex must use:

- `planner`
- `writing-plans`

The plan must identify:

- exact files to inspect;
- exact files expected to change;
- interfaces consumed and produced;
- tests to write first;
- commands to run;
- expected RED failure;
- expected GREEN behavior;
- live proof required;
- commit boundaries.

Save a persistent implementation plan when appropriate, preferably under:

`docs/superpowers/plans/YYYY-MM-DD-<feature-or-repair>.md`

unless the user explicitly requests another location.

After the plan is approved/established, use:

- `executing-plans`

to carry it out task-by-task.

## 0.5 Skill index for this contract

Use these exact skill names:

- `remnote-mcp-workflow-auditor`
- `verification-before-completion`
- `planner`
- `writing-plans`
- `executing-plans`
- `test-driven-development`
- `mcp-builder`
- `nodejs-backend-patterns`
- `security-best-practices`
- `context7`
- `openai-docs`
- `improve-codebase-architecture`
- `playwright`
- `webapp-testing`

Do not load every skill for every task. Use the stage-specific list below.

---

# 1. Mission

RemNote MCP already has substantial product functionality. Preserve working systems and finish the product around them.

The repository contains or has historically contained:

- a TypeScript RemNote plugin;
- a Node.js MCP server;
- local and hosted connection modes;
- ChatGPT/Codex connection and authorization paths;
- scope and write-access controls;
- structured RemNote read tools;
- structured RemNote write tools;
- Markdown and rich-text import;
- card/flashcard workflows;
- scientific formula handling;
- formatting and design tools;
- reusable design templates;
- guarded mutation behavior;
- idempotency patterns;
- readback and verification;
- resumable bulk-import planning and execution;
- durable job state;
- diagnostic/health tooling;
- a Tests 01–15 live campaign history;
- CI and security/boundary regression work.

Do **not** rewrite these systems from scratch.

The completion mission is:

> Make the existing RemNote MCP safe, deterministic, observable, media-capable, easy for a judge to test, and truthful about every proof boundary.

---

# 2. Current repository truth and evidence rules

## 2.1 Branch

All work governed by this contract targets:

`fix/remnote-mcp-mass-note-creation-stability`

Before every work session:

```bash
git branch --show-current
git rev-parse HEAD
git status --short
```

If the active branch is not the target branch, stop before editing.

## 2.2 Candidate SHA

A candidate used during Build Week preparation was:

`5380dd5f2b87fa7d908a346fef81862498d47eea`

Treat this as a **historical reference only**.

Do not assume it is:

- current HEAD;
- current deployment SHA;
- current plugin build;
- current CI target;
- final release SHA.

Verify every one independently.

## 2.3 Current known metadata drift that must be audited

The repository has evidence of product/release metadata drift that Codex must reconcile rather than ignore.

Examples to verify at current HEAD:

- root `package.json` reports version `0.0.1`;
- `server/package.json` reports version `0.0.1`;
- `public/manifest.json` reports RemNote MCP version `0.1.0`;
- `chatgpt-app-submission.json` still uses older “RemNote ChatGPT Bridge” naming and a fixed default-profile tool-count description;
- `public/manifest.json` changelog URL points to `main/README.md`, while the release branch may have a different README state.

Do not blindly normalize versions. First decide whether:

- package versions are implementation-package versions;
- manifest version is plugin product version;
- server protocol/versioning is intentionally independent.

Then document the decision and remove contradictory user-facing metadata.

## 2.4 Historical reports are evidence, not current truth

Files in `remnote report/` prove only the branch/SHA/deployment they actually tested.

Every result must be classified as one of:

```text
EXACT_RELEASE_LIVE_PROOF
HISTORICAL_LIVE_PROOF
LOCAL_AUTOMATED_PROOF
CI_PROOF
DEPLOYED_SERVER_PROOF
PLUGIN_CONNECTION_PROOF
SOURCE_ONLY
BLOCKED
SDK_UNSUPPORTED
NOT_RETESTED
```

Never write “passed” without naming the proof level.

## 2.5 Proof ladder

Use this ladder in all completion reports:

1. **Static/source proof** — code exists.
2. **Focused automated proof** — one test passes.
3. **Regression proof** — relevant suite passes.
4. **Build proof** — plugin/server builds.
5. **CI proof** — exact commit passes CI.
6. **Deployment proof** — `/health` reports exact commit.
7. **Plugin round-trip proof** — plugin-routed ping succeeds.
8. **Live mutation proof** — RemNote write succeeds.
9. **Readback proof** — resulting Rem structure/content is read back.
10. **Idempotency/recovery proof** — retry/resume does not duplicate/corrupt.
11. **Visual/playback proof** — media actually renders/plays in RemNote.
12. **Exact-release campaign proof** — the final immutable SHA passes the defined release workflow.

A higher layer cannot be inferred from a lower one.

---

# 3. Definition of a complete product

RemNote MCP is `COMPLETE` only when:

1. every hard release gate passes;
2. product score is at least **95/100**;
3. no unresolved P0 or P1 defect remains;
4. the exact immutable release SHA is the SHA used for CI, deployment, plugin build, judge artifact, and final live proof.

A high score cannot compensate for a failed hard gate.

---

# 4. Hard release gates

Every checkbox below is mandatory.

## 4.1 Repository and identity

- [ ] Target branch is correct.
- [ ] Exact final release SHA is pushed and publicly resolvable.
- [ ] Working tree is clean at the release checkpoint.
- [ ] Build Week eligible commit range is documented.
- [ ] Final compare link resolves.
- [ ] User-facing product name is consistently `RemNote MCP`.
- [ ] Versioning strategy is documented and conflicting metadata is reconciled.

## 4.2 Automated engineering gates

- [ ] TypeScript checks pass.
- [ ] Plugin SDK validation passes.
- [ ] Plugin build passes.
- [ ] Server build passes.
- [ ] Full root automated test suite passes.
- [ ] Security/auth tests pass.
- [ ] Boundary/input-limit tests pass.
- [ ] Tool schema tests pass.
- [ ] Idempotency tests pass.
- [ ] Source-fidelity tests pass.
- [ ] Bulk-storage tests pass.
- [ ] PostgreSQL durability proof passes if PostgreSQL is used for release persistence.
- [ ] Relevant routing/hosted/pairing tests pass.
- [ ] Fault/retry/reconnect tests pass.
- [ ] Performance gates stay within current documented budgets.
- [ ] Dependency audit is run when the package registry is reachable; otherwise the blocker is documented honestly.

## 4.3 Deployment gates

- [ ] Hosted `/health` is reachable.
- [ ] `/health` reports the exact final release SHA.
- [ ] Hosted auth mode matches the documented release configuration.
- [ ] Plugin build used for live testing corresponds to the exact release SHA.
- [ ] Plugin connects successfully.
- [ ] Initial sync completes.
- [ ] `ping_remnote_plugin` proves a plugin-routed round trip.

## 4.4 Core product live gates

- [ ] Focused/approved Rem is confirmed before writes.
- [ ] Read-only workflow passes.
- [ ] Safe small write passes.
- [ ] Readback verifies the created hierarchy/content.
- [ ] Same idempotency key repeat does not duplicate content.
- [ ] Guarded stale-state rejection works.
- [ ] Card creation/readback works.
- [ ] Formula/rich-text preservation works.
- [ ] Supported design/styling paths verify correctly.
- [ ] Unsupported SDK behavior is returned truthfully.
- [ ] Resumable import interruption/resume/verify path passes.
- [ ] Test 14 exact native-node budget case passes on the exact release SHA.
- [ ] Tests 01–15 are either exact-release live-proven or explicitly replaced by a stronger documented equivalent.

## 4.5 Media gates

- [ ] `insert_image_from_url` implemented.
- [ ] `insert_audio_from_url` implemented.
- [ ] `insert_video_from_url` implemented.
- [ ] Runtime capability probes exist for image/audio/video builders.
- [ ] Stable HTTPS image renders visibly in RemNote.
- [ ] Direct audio URL renders a playable audio player.
- [ ] YouTube URL renders a playable video embed.
- [ ] Direct video-file URL is tested when practical.
- [ ] Same media idempotency key does not create duplicates.
- [ ] Media failure does not partially destroy existing text.
- [ ] Unsupported media SDK path returns typed `SDK_UNSUPPORTED`.
- [ ] Media verification separates stored rich-text evidence from actual visual/playback evidence.

## 4.6 Judge-readiness gates

- [ ] Root `README.md` exists.
- [ ] README contains architecture, setup, supported platforms, Build Week delta, Codex/GPT-5.6 usage, known limitations, and judge quick-start.
- [ ] Prebuilt plugin artifact or equivalent no-rebuild install path is published.
- [ ] Artifact is tied to exact release SHA.
- [ ] Clean-environment install is tested.
- [ ] Disposable judge sandbox flow is documented.
- [ ] Read-only judge prompt is documented.
- [ ] Safe-write judge prompt is documented.
- [ ] Resumable-import judge prompt is documented.
- [ ] Media demo prompt is documented.
- [ ] Danger tier is disabled for judge instructions.
- [ ] No secret is required inside a prompt.

---

# 5. Product scorecard — 100 points

| Area | Points | Completion standard |
| --- | ---: | --- |
| Core RemNote read/write correctness | 20 | Reads, creates, updates, hierarchy, Markdown/rich text, formulas, cards, and guarded mutations work with readback. |
| Bulk import, idempotency, recovery | 15 | Long imports plan correctly, persist, pause/resume, skip verified chunks, reconcile uncertainty, and avoid duplicate replay. |
| Safety, auth, permissions, security | 15 | Local/hosted auth, pairing, scope, write tiers, input limits, rate limits, secrets, and destructive boundaries are enforced. |
| Connection/runtime reliability | 10 | Persistent plugin runtime, reconnect, manual connect/disconnect, online recovery, routing, and diagnostics are stable. |
| Design and formatting fidelity | 10 | Supported styles, highlights, Concept/Descriptor behavior, cards, formulas, hierarchy, and exact verification behave truthfully. |
| Media capability | 10 | Image/audio/video URL insertion is safe, discoverable, idempotent, capability-probed, read back, and visually/playback verified. |
| Automated tests and CI | 10 | Every repaired defect and media path has regression coverage; exact release SHA is green in CI. |
| Release and judge testability | 10 | README, install path, artifact, hosted endpoint, exact-SHA evidence, and concise judge workflows are ready. |

### Verdict scale

- **95–100 + every hard gate:** `COMPLETE`
- **90–94 + every hard gate:** strong release candidate but improve remaining non-blocking gaps before submission when time permits
- **80–89:** functional beta; `NOT COMPLETE`
- **<80:** incomplete; `NOT COMPLETE`

Known RemNote SDK limitations do not automatically reduce the product below complete when:

- capability is detected;
- user data is preserved;
- failure is typed;
- result is truthful;
- best supported fallback is documented.

---

# 6. Stage 0 — Exact-state audit and implementation plan

## Goal

Establish current truth before editing code and produce the execution plan Codex will follow.

## Required skills

**MANDATORY**

- `remnote-mcp-workflow-auditor`
- `verification-before-completion`
- `planner`
- `writing-plans`
- `context7`

**CONDITIONAL**

- `openai-docs` — only when the audit makes claims about current OpenAI/ChatGPT/Codex capabilities.

## Skill enforcement

Codex must not edit production code in Stage 0.

It must first print:

```text
STAGE: 0 — Exact-state audit and implementation plan
SKILLS ACTIVATED:
- remnote-mcp-workflow-auditor
- verification-before-completion
- planner
- writing-plans
- context7
```

Then perform the audit.

## Required repository reads

At minimum inspect:

- `AGENTS.md`
- `PRODUCT.md`
- `TOOL_REFERENCE.md`
- `package.json`
- `server/package.json`
- `public/manifest.json`
- `chatgpt-app-submission.json`
- `.github/workflows/ci.yml`
- `security_best_practices_report.md`
- `docs/engineering-guide.md`
- `docs/remnote-mcp-repair-and-testing.md`
- `server/src/tool-registry.ts`
- `server/src/mcp-tool-map.ts`
- `server/src/tool-policy.ts`
- `server/src/tool-permissions.ts`
- `server/src/tools/schemas.ts`
- `shared/bridge/protocol.ts`
- `shared/bridge/protocol-registry.ts`
- `src/bridge/handlers.ts`
- `src/bridge/plugin-runtime.ts`
- `src/remnote/sdkCapabilities.ts`
- `src/remnote/write-engine/*`
- `src/remnote/write/*`
- the latest Tests 01–15 campaign report.

## Required commands

```bash
git branch --show-current
git rev-parse HEAD
git status --short
git log --oneline --decorate -20
git diff --stat main...HEAD
```

Then inspect current scripts and run the cheapest non-destructive baseline gates needed to determine whether the tree is already broken.

## Required audit questions

Codex must answer:

1. What is exact branch HEAD?
2. Is working tree clean?
3. What is current deployment SHA?
4. Does deployment SHA match branch HEAD?
5. Is the RemNote plugin connected?
6. Is initial sync complete?
7. What SDK version is actually installed?
8. What is the current public tool count?
9. What is the default tool profile?
10. Does `chatgpt-app-submission.json` match the actual profile/tool registry?
11. Are product names consistent?
12. Are package/manifest versions intentionally different or stale?
13. Which Tests 01–15 are exact-release proof?
14. Which are historical only?
15. Which fixes have only local/CI proof?
16. What remains blocked?
17. Does Test 14 have exact-release live proof?
18. Does root `README.md` exist?
19. Is there a public prebuilt plugin artifact?
20. Do installed SDK typings expose:
    - `plugin.richText.image`
    - `plugin.richText.audio`
    - `plugin.richText.video`
21. Does the live runtime expose them?
22. Does the current MCP expose any media tools already?

## Required audit output

```text
HEAD:
Working tree:
Compare vs main:
Deployment SHA:
CI status:
Plugin connection:
Initial sync:
SDK version:
Public tool count:
Default profile:
Metadata drift:
Tests 01–15 proof classification:
Test 14 status:
Remaining P0:
Remaining P1:
Media SDK type-level support:
Media SDK runtime support:
Existing MCP media tools:
README status:
Prebuilt artifact status:
Judge-readiness blockers:
```

## Required planning deliverable

Use `writing-plans` to create a detailed implementation plan before Stage 1.

Preferred path:

`docs/superpowers/plans/YYYY-MM-DD-remnote-mcp-product-completion.md`

The plan must:

- use checkbox steps;
- name exact files;
- name interfaces;
- include RED test step;
- include expected RED reason;
- include minimum GREEN implementation;
- include regression command;
- include commit boundary;
- include deployment proof;
- include live RemNote proof.

Do not use placeholders such as:

- TODO
- TBD
- “add validation”
- “write tests”
- “handle errors”

without concrete behavior and files.

## Stage 0 completion gate

Stage 0 passes only when:

- repository truth is recorded;
- proof levels are classified;
- implementation plan exists;
- no production code was changed during the audit.

---

# 7. Stage 1 — Close existing reliability and release defects

## Goal

Make the existing core product trustworthy before adding novelty.

## Required skills

**MANDATORY**

- `remnote-mcp-workflow-auditor`
- `verification-before-completion`
- `test-driven-development`
- `nodejs-backend-patterns`
- `security-best-practices`
- `executing-plans`

**CONDITIONAL**

- `improve-codebase-architecture` — only when a concrete release-risk problem cannot be repaired safely within the current seam.

## Priority order

1. P0 data loss/corruption risk.
2. Duplicate/replay risk.
3. Auth/scope/permission bypass.
4. Unknown-state retry risk.
5. Exact-release Test 14.
6. Connection/reconnect/runtime ownership.
7. Verification truthfulness.
8. Metadata/release drift.
9. Lower-priority cleanup.

Do not reorder this priority merely because a lower item is easier.

## TDD enforcement

For each defect:

1. Identify one behavior failure.
2. Write a focused failing test.
3. Run it and capture RED.
4. Confirm RED is caused by the target defect.
5. Implement minimum fix.
6. Run focused test.
7. Run surrounding regression suite.
8. Only then refactor.
9. Record proof level.

## Stage 1A — Test 14 and resumable import

Re-check:

- native-node budget calculation;
- logical vs native count;
- table expansion;
- exact chunk manifest;
- persisted revision;
- chunk state transitions;
- `written_not_verified`;
- `partial`;
- `failed`;
- `blocked`;
- `verified`;
- reconnect/resume behavior;
- completed-job replay prevention;
- reconciliation;
- duplicate prevention;
- PostgreSQL persistence.

Required outcome:

- exact release candidate passes the Test 14 scenario twice;
- second run proves repeatability;
- pause/resume does not rewrite verified chunks;
- reconnect does not duplicate content;
- source Rems remain unchanged.

Potential relevant files to inspect:

- `server/src/tools/register-bulk-import-tools.ts`
- `server/src/bulk-import/job-store.ts`
- `server/src/bulk-import/access.ts`
- `server/src/bulk-import/source-file-loader.ts`
- `shared/bridge/bulk-import.ts`
- `shared/bridge/markdown-importer.ts`
- `src/remnote/write/markdownImportExecutor.ts`
- `src/remnote/write/verification.ts`
- `tests/*bulk*`
- `tests/*import*`

Exact files must be confirmed from current repository truth before editing.

## Stage 1B — Verification truthfulness

Re-check known high-value paths:

- Test 03 dry-run prediction;
- successful style-plan outer `updatedRemIds`;
- Test 11 native property filtering;
- Test 11 principal-formula classification;
- Concept → Descriptor verification;
- Test 12 exact style verification;
- supported vs unsupported heading mutation;
- partial vs fail MCP envelope semantics.

Rules:

- `SDK_UNSUPPORTED` is acceptable when the installed RemNote SDK truly lacks capability.
- Never convert unsupported behavior into fake success.
- Exact verification must use evidence produced by the actual applied plan when available.
- Generic preset assumptions must not contaminate exact verification.

Potential files:

- `server/src/tools/register-formatting-tools.ts`
- `server/src/tools/register-design-tools.ts`
- `src/remnote/templates/designPlanCompiler.ts`
- `src/remnote/templates/designVerificationManifest.ts`
- `src/remnote/write/designedNoteTools.ts`
- `src/remnote/write/formattingWrites.ts`
- `src/remnote/write/verification.ts`

## Stage 1C — Connection/runtime reliability

Re-check:

- plugin runtime ownership independent of sidebar lifecycle;
- WebSocket generation replacement;
- browser `online` recovery;
- stuck `CONNECTING` recovery;
- explicit Connect action;
- explicit Disconnect action;
- late response cleanup;
- pending request cleanup;
- session routing;
- reconnect after transient network loss.

Potential files:

- `src/bridge/plugin-runtime.ts`
- `src/bridge/runtime.ts`
- `src/bridge/runtime-channel.ts`
- `src/bridge/client.ts`
- `server/src/bridge-hub.ts`
- `server/src/bridge/*`
- `tests/bridge-reconnect.test.ts`
- `tests/bridge-runtime-lifecycle.test.ts`
- `tests/bridge-retry-safety.test.ts`

## Stage 1D — Metadata/version/release truth

Reconcile:

- product display name;
- manifest name;
- package versions;
- server version;
- tool counts;
- default profile description;
- hosted/private wording;
- changelog URL;
- current branch vs main README references.

Do not manually hard-code a tool count if it can be generated from registry truth.

Prefer:

```text
registry → generated reference/metadata
```

over:

```text
registry
+
hand-maintained count A
+
hand-maintained count B
+
hand-maintained count C
```

where practical.

## Stage 1E — Architecture cleanup only when release-risk evidence exists

Use:

- `improve-codebase-architecture`

only if the current implementation causes a proven risk such as:

- duplicated mutation logic with divergent safety behavior;
- repeated media write paths with inconsistent validation;
- untestable giant function blocking reliable change;
- shallow pass-through modules causing incorrect ownership;
- cyclic dependency;
- state ownership split across incompatible modules.

Do not perform broad architecture cleanup merely to make the repository prettier.

Before architecture changes:

1. characterize current behavior with tests;
2. identify the exact seam;
3. explain locality/leverage benefit;
4. preserve public interfaces unless a migration is planned;
5. keep tests green.

## Stage 1 completion gate

Stage 1 is complete only when:

- no known P0/P1 existing-product defect remains without an explicit blocker;
- focused RED/GREEN tests exist for every repaired defect;
- relevant regression suites are green;
- no security control was weakened;
- exact-release live proof is clearly separated from local proof.

### 2026-07-18 execution record — Stage 1

Status: `COMPLETE_LOCAL_WITH_EXPLICIT_LIVE_BLOCKERS`.

- Stage 1A rechecked native table-node budgeting, logical/native manifests,
  chunk states, reconciliation, completed-job no-replay, duplicate prevention,
  and storage semantics. The focused bulk/import suite passed; memory CAS and
  restart-loss truth passed. PostgreSQL durability remains `BLOCKED` because
  `DATABASE_URL` is not configured.
- Stage 1B rechecked dry-run truth, applied-manifest verification, native
  property filtering, Concept -> Descriptor evidence, and partial/fail
  envelopes. Focused verifier/design/read-style regressions passed.
- Stage 1C rechecked runtime ownership, reconnect, browser-online recovery,
  request cleanup, and retry safety. Focused runtime/reconnect/retry regressions
  passed.
- Stage 1D closed current release drift through a RED/GREEN metadata test:
  public identity is `RemNote MCP`, default-profile copy matches the current
  20-tool registry, the changelog link resolves to GitHub releases, and the
  intentional npm `0.0.1` versus plugin manifest `0.1.0` version lanes are
  documented. Generated registry evidence now reports 76 declared, 73
  all-public, and 20 default-public tools.
- Fresh local proof: 8 focused files / 117 tests, metadata/version 2 files / 5
  tests, security/auth smoke, boundaries, idempotency, memory bulk storage, and
  generated tool-reference gates all passed. No security control was weakened.
- Deployment-health proof: hosted `/health` returned HTTP 200 at exact HEAD
  `5380dd5f2b87fa7d908a346fef81862498d47eea`, reports one connected plugin
  session, and exact-SHA GitHub Actions run `29603562034` is green.
- Live boundary: this run has no `REMNOTE_CODEX_TOKEN`, disposable
  `REMNOTE_LIVE_TEST_PARENT_ID`, or authenticated plugin-health session.
  Therefore initial-sync readback, two exact-SHA Test 14 live reruns, current
  Tests 01-15 live proof, and source-preservation readback remain unclaimed.
  Historical Test 14 live evidence is for `76c6e2d` and remains historical.

---

# 8. Stage 2 — Design the media feature before implementation

## Goal

Define a safe, narrow, first-class media capability that fits the existing MCP architecture.

## Required skills

**MANDATORY**

- `remnote-mcp-workflow-auditor`
- `verification-before-completion`
- `mcp-builder`
- `writing-plans`
- `security-best-practices`
- `context7`

**MANDATORY FOR OPENAI CLAIMS**

- `openai-docs`

**CONDITIONAL**

- `nodejs-backend-patterns`

## Official RemNote API basis

Current official RemNote Plugin API documentation exposes RichText builders equivalent to:

- `plugin.richText.image(url, width?, height?)`
- `plugin.richText.audio(url)`
- `plugin.richText.video(url)`

Current RemNote product documentation also describes:

- image insertion from URLs;
- audio-file URL embedding with an audio player;
- YouTube URL embedding;
- direct video-file URL embedding.

Codex must still verify:

1. installed SDK `@remnote/plugin-sdk` typings;
2. runtime capability;
3. actual rendering in the connected RemNote version.

Documentation alone is not live proof.

## Required public MCP tools

Implement these public tools unless the existing repository already has equivalent correctly named public tools:

1. `insert_image_from_url`
2. `insert_audio_from_url`
3. `insert_video_from_url`

Use one shared internal media module/helper only when it improves consistency without making the public tools vague.

## Required tool contract design

The design plan must decide and document:

### Shared fields

- `parentId` or the repository's established explicit target field;
- `url`;
- `position`;
- `caption` or `label` only when safely representable;
- `idempotencyKey`;
- `verifyAfterWrite`.

### Image-only fields

- `width?`
- `height?`

### Placement policy

Default to the safest behavior that preserves existing content.

Preferred default:

> create a dedicated child/media Rem at a deterministic position rather than overwrite arbitrary existing rich text.

If the established write engine has a safer canonical pattern, use that pattern.

Any replace-existing-content mode must be explicit and separately guarded.

## URL validation policy

At minimum:

- allow only `http://` and `https://` unless official SDK behavior requires another safe scheme;
- reject `javascript:`;
- reject `file:`;
- reject malformed URLs;
- enforce bounded URL length;
- reject empty URL;
- normalize before idempotency comparison where safe.

### SSRF rule

Before adding private-IP/localhost blocking, determine **who fetches the URL**:

- MCP server;
- browser/plugin runtime;
- RemNote service/client.

If the MCP server never fetches the URL, server-side SSRF risk is different from a server proxy/fetch architecture.

Do not add security theater. Document the actual fetch owner and enforce the appropriate threat model.

## MCP annotations

Use `mcp-builder`.

Annotations must match actual behavior.

Do not copy annotations blindly.

For each media tool, explicitly justify:

- `readOnlyHint`
- `destructiveHint`
- `idempotentHint` if supported by the repository's MCP SDK/tool metadata model
- `openWorldHint`

If inserting a remote URL causes an external fetch, decide `openWorldHint` from actual MCP annotation semantics and implementation behavior.

## Capability probing

Extend the runtime capability report for:

- `plugin.richText.image`
- `plugin.richText.audio`
- `plugin.richText.video`

If missing:

- no mutation;
- typed `SDK_UNSUPPORTED`;
- actionable message;
- capability name in details.

## Generated-image boundary

Use `openai-docs`.

Document current truth:

- ChatGPT can generate images.
- RemNote's media builder accepts a URL.
- A generated image is not automatically equivalent to a durable public URL available to the MCP.
- Full automation requires a handoff mechanism such as:
  - client-provided stable URL;
  - secure upload endpoint;
  - object storage;
  - another durable hosting system.

Build Week v1 default:

> implement URL insertion first.

Do not introduce OpenAI image-generation API keys, storage, file retention, or upload services unless all release gates are already safe and the extra architecture is justified.

## Generated-voice/audio boundary

Use `openai-docs`.

Document current truth:

- OpenAI APIs can generate speech audio.
- RemNote audio insertion needs a URL.
- Generated audio bytes/file still need durable hosting for URL-based insertion.
- ChatGPT conversational Voice output must not be assumed to expose a reusable MCP-accessible audio URL.

Build Week v1 default:

> stable audio URL → RemNote MCP → audio embed.

Optional v2:

```text
text
→ OpenAI TTS
→ generated audio file
→ secure storage
→ durable URL
→ RemNote audio embed
```

Only add this after core release gates.

## Video boundary

For v1:

- YouTube URL is mandatory live proof.
- Direct MP4/WebM URL is optional but preferred when practical.

Do not claim:

- rich-text YouTube embed = YouTube Annotator source;
- media embed = uploaded/owned RemNote source object;

unless official API + live proof establishes it.

## Stage 2 planning deliverable

Before implementation, create a media implementation plan containing:

- exact tool schemas;
- exact shared helper interface;
- protocol changes;
- plugin handler changes;
- capability-probe changes;
- idempotency model;
- test files;
- RED expectations;
- live proof fixtures;
- rollback/failure semantics.

Stage 2 ends before production implementation begins.

### 2026-07-18 execution record — Stage 2

Status: `COMPLETE_DESIGN_ONLY`.

- Verified installed `@remnote/plugin-sdk@0.0.46` typings and implementation
  expose `plugin.richText.image`, `plugin.richText.audio`, and
  `plugin.richText.video`; runtime availability and rendering remain live-proof
  obligations.
- Verified the repository MCP annotation model supports `idempotentHint` and
  designed all three tools as non-read-only, non-destructive, idempotent,
  open-world writes.
- Fixed the v1 scope at stable HTTP(S) URL insertion into one dedicated child
  Rem. The MCP server will not fetch/proxy media, and no generation API key,
  upload service, storage system, or retention path is introduced.
- Defined exact schemas, shared protocol/result interfaces, plugin-side trust
  validation, scope/permission routing, capability probes, memory idempotency,
  readback, rollback behavior, RED/GREEN order, regression commands, and later
  live fixtures in
  `docs/superpowers/plans/2026-07-18-remnote-mcp-media-insertion.md`.
- Official OpenAI guidance confirms image and speech APIs produce media data;
  those bytes still require durable hosting before URL insertion. ChatGPT voice
  output is not treated as a reusable MCP media URL.
- No Stage 3 production source was changed before this design checkpoint.

---

# 9. Stage 3 — Implement media insertion with strict TDD

## Goal

Add image, audio, and video/YouTube insertion without weakening safety or existing note behavior.

## Required skills

**MANDATORY**

- `remnote-mcp-workflow-auditor`
- `verification-before-completion`
- `test-driven-development`
- `mcp-builder`
- `nodejs-backend-patterns`
- `security-best-practices`
- `executing-plans`

**USE FOR CURRENT SDK DETAILS**

- `context7`

## Likely files to inspect

Confirm exact paths before editing. Expected areas include:

### MCP server/tool layer

- `server/src/tools/schemas.ts`
- `server/src/tools/register-formatting-tools.ts` or a new focused media registration module
- `server/src/tool-registry.ts`
- `server/src/mcp-tool-map.ts`
- `server/src/tool-policy.ts`
- `server/src/tool-permissions.ts`
- `server/src/remnote-capability-guide.ts`

### Shared bridge protocol

- `shared/bridge/protocol.ts`
- `shared/bridge/protocol-registry.ts`
- `shared/bridge/protocol-write-args.ts`
- `shared/bridge/protocol-write-results.ts`

### Plugin bridge

- `src/bridge/handlers.ts`
- `src/bridge/handlers/args.ts`
- `src/bridge/handlers/validation.ts`
- `src/bridge/handlers/scope.ts`

### RemNote capability/write layer

- `src/remnote/sdkCapabilities.ts`
- `src/remnote/write/index.ts`
- `src/remnote/write/basicWrites.ts`
- `src/remnote/write/writeValidation.ts`
- `src/remnote/write/writeErrors.ts`
- a new focused media write module if this preserves locality.

### Tests

Use the repository's current naming conventions. Prefer focused tests for:

- media schemas;
- media tool registration;
- bridge routing;
- plugin write behavior;
- idempotency;
- scope/permission;
- capability absence;
- serialization/readback.

## Required TDD sequence — image

### RED 1 — schema

Write failing tests for:

- valid HTTPS URL accepted;
- valid HTTP URL accepted if policy allows;
- malformed URL rejected;
- `javascript:` rejected;
- `file:` rejected;
- width <= 0 rejected;
- height <= 0 rejected;
- excessive dimensions rejected;
- excessive URL length rejected.

Run focused tests and capture expected RED.

### GREEN 1

Implement minimum schema/validation.

### RED 2 — builder selection

Write failing test proving image operation calls the image builder with:

```text
url
width?
height?
```

and does not call audio/video builder.

### GREEN 2

Implement minimum image builder path.

### RED 3 — safe placement

Prove the image write:

- creates or updates only intended target;
- does not erase unrelated existing text;
- returns created/updated ID envelope.

### GREEN 3

Implement placement.

### RED 4 — idempotency

Repeat same idempotency key and prove no duplicate media Rem.

### GREEN 4

Implement using the repository's canonical idempotency system.

### RED 5 — capability missing

Simulate runtime without `plugin.richText.image`.

Expected:

- typed `SDK_UNSUPPORTED`;
- zero mutation.

### GREEN 5

Implement capability gate.

## Required TDD sequence — audio

Repeat the same pattern for:

- schema;
- audio builder selection;
- safe placement;
- idempotency;
- capability missing;
- zero partial destruction.

## Required TDD sequence — video

Repeat for:

- normal HTTPS video URL;
- YouTube URL;
- video builder selection;
- safe placement;
- idempotency;
- capability missing.

Do not over-specialize YouTube parsing unless the SDK requires it.

## Shared regression matrix

Every media tool must be covered for:

- auth path;
- scope enforcement;
- write tier;
- input validation;
- capability gate;
- tool routing;
- correct bridge command;
- correct plugin handler;
- created/updated IDs;
- no unrelated mutation;
- idempotent repeat;
- structured error envelope;
- readback representation when available.

## Failure semantics

A media failure must not leave the target in a worse state.

Prefer:

```text
validate
→ capability check
→ scope/write authorization
→ prepare new media rich text
→ mutate
→ read back
→ verify
```

over:

```text
erase target
→ attempt media creation
→ fail
```

## Stage 3 completion gate

Stage 3 is complete only when:

- all three public media tools are discoverable;
- schemas are validated;
- capability probes exist;
- focused RED/GREEN history exists;
- relevant full regression suites pass;
- no live-success claim has been made yet.

### 2026-07-18 execution record — Stage 3

Status: `COMPLETE_LOCAL_WITH_LIVE_MEDIA_RENDERING_UNPROVEN`.

- Added three public `note_writer` tools: `insert_image_from_url`,
  `insert_audio_from_url`, and `insert_video_from_url`. The generated registry
  now reports 79 declared tools, 76 public tools with delete disabled, 77
  public tools in the danger profile, and the unchanged 20-tool default
  profile under schema version `2026-07-18.media-url-insertion`.
- Added strict HTTP(S)-only schemas, bounded URL/label/dimension inputs,
  current-tree scope enforcement, trusted-write authorization, explicit
  open-world/idempotent annotations, plugin-side revalidation, and image,
  audio, and video capability probes.
- Added dedicated-child media writes with no unrelated text replacement,
  readback of the serialized media discriminator and URL, same-key replay
  protection, conflicting-key rejection, and compensation. Failed writes remove
  the created child when possible; failed compensation returns
  `PARTIAL_FAILURE` with the orphan Rem ID.
- Captured the required RED/GREEN sequence in focused TDD: missing media
  registration, protocol/policy/capabilities, image write, audio route, video
  route, compensation coverage, and operation-tier metadata each failed before
  the corresponding minimum implementation. The focused media suite passes 33
  tests; the related six-file regression passes 98 tests; the full suite passes
  33 files / 326 tests.
- Fresh local proof also passes type checking, plugin and server builds,
  validation, server smoke, tool schemas, boundaries, security, idempotency,
  source fidelity, health routing, style correctness, and all tool-profile
  certification (77 danger-profile tools, p95 16 ms). PostgreSQL bulk-storage
  proof remains `BLOCKED` because `DATABASE_URL` is not configured; memory
  storage passes.
- Live boundary: installed SDK typings/builders and local fake-runtime readback
  are proven, but this commit has not been deployed and no connected RemNote
  session has rendered an image, audio player, direct video, or YouTube embed.
  No live media-success or production-readiness claim is made.

---

# 10. Stage 4 — Full automated regression, CI, and conditional architecture review

## Goal

Prove the combined existing fixes + media work do not regress the product.

## Required skills

**MANDATORY**

- `verification-before-completion`
- `test-driven-development`
- `executing-plans`

**CONDITIONAL**

- `improve-codebase-architecture`
- `nodejs-backend-patterns`
- `security-best-practices`

## Minimum verification commands

Discover current canonical scripts from `package.json` and `server/package.json`.

At minimum run:

```bash
git status --short
git rev-parse HEAD

npm run check-types
npm test
npm run validate
npm run build

npm run server:build
npm run server:smoke
npm run server:test:security
npm run server:test:boundaries
npm run server:test:tool-schemas
npm run server:test:idempotency
npm run server:test:source-fidelity
npm run server:test:health-check-routing
npm run server:test:bulk-storage
npm run test:style-correctness
```

Also inspect and run the strongest current applicable commands for:

- auth;
- Codex bearer;
- Codex routing;
- Codex pairing;
- ChatGPT pairing;
- connector compatibility;
- tool profiles;
- tier switching;
- structured depth;
- Markdown importer;
- PostgreSQL durability;
- performance;
- hosted E2E smoke;
- live-tool smoke/regression when environment permits.

## Dependency audit

Run when registry access works:

```bash
npm audit --omit=dev
npm audit --omit=dev --prefix server
```

If unavailable:

- record exact failure;
- do not claim zero vulnerabilities from an old audit.

## Architecture review trigger

Use `improve-codebase-architecture` only when regression work reveals a real architectural release risk.

Possible candidates:

- media validation duplicated across three paths;
- media mutation duplicated across three handlers with inconsistent authorization;
- bridge request switch too large to safely extend;
- write-engine ownership split;
- repeated serialization logic causing verification mismatch.

If used:

1. read architecture docs first;
2. characterize behavior;
3. create report;
4. choose smallest high-leverage seam;
5. implement through TDD only after plan.

## Graphify

If the repository uses Graphify as maintained release evidence:

```bash
graphify . --update
```

only after code freeze.

Do not let generated Graphify output become the main measure of Build Week work.

## Stage 4 completion gate

- all required automated gates green;
- exact commit identified;
- CI green for exact commit;
- architecture changes, if any, separately justified and tested;
- no unresolved regression introduced by media.

### 2026-07-18 execution record — Stage 4

- Required local gates, strongest applicable auth/routing/pairing/profile/import/performance gates, builds, validation, and both production dependency audits passed.
- PostgreSQL bulk-storage proof remains `BLOCKED` because `DATABASE_URL` is not configured; memory storage passed.
- Exact-commit remote CI remains `BLOCKED`: the remote branch predates this work, `gh` is unavailable, and no push was authorized.
- TDD fixed an arbitrary widget asset URL injection risk. The conditional architecture review chose that narrow release seam and did not perform a speculative dispatcher/widget refactor.
- Full command evidence and proof boundaries are recorded in `docs/stage-4-5-verification.md`.

---

# 11. Stage 5 — Plugin UI and judge-experience verification

## Goal

Ensure a judge can understand connection state, approve scope, and use the plugin without confusion.

## Required skills

**MANDATORY**

- `verification-before-completion`
- `playwright`
- `webapp-testing`

**CONDITIONAL**

- `security-best-practices`

## Verify UI states

At minimum inspect:

- disconnected;
- connecting;
- connected;
- reconnecting;
- failed connection;
- ChatGPT pairing code entry;
- pairing review;
- pairing approved;
- pairing rejected/expired;
- writing access selection;
- scope selection;
- design style selection;
- Ping;
- Connect;
- Disconnect;
- health check;
- Advanced settings;
- loading states;
- error states.

## Responsive/accessibility checks

Where browser automation can reach the surface, verify:

- narrow sidebar;
- 200% zoom;
- keyboard navigation;
- visible focus;
- no clipped controls;
- no horizontal overflow;
- minimum practical touch/click targets;
- readable contrast;
- reduced-motion behavior where animations exist.

Do not claim native RemNote visual acceptance from a standalone component render if the real plugin UI was not rendered inside RemNote.

## Judge usability requirement

A first-time judge should be able to answer within one minute:

1. Is the MCP server reachable?
2. Is the RemNote plugin connected?
3. What RemNote scope is approved?
4. What write access is enabled?
5. How do I disconnect?
6. What should I test first?

## Stage 5 completion gate

- browser/UI proof recorded;
- native RemNote visual proof performed where required;
- no blocking setup ambiguity remains.

### 2026-07-18 execution record — Stage 5

- The real widget rendered through the RemNote SDK sandbox and passed the state, pairing, control, scope, design, health, narrow-layout, keyboard, focus, target-size, zoom, and reduced-motion checks recorded in `docs/stage-4-5-verification.md`.
- TDD replaced contradictory dashboard/Render setup copy with one visible ChatGPT-to-widget pairing flow.
- Native visual proof remains `BLOCKED`: RemNote 1.26.30 was running on Wayland, no companion server listened on 47391/47392, and the native window was not safely automatable or capturable from this session.
- Browser screenshots are under `output/playwright/`. They are SDK sandbox evidence only and are not represented as native RemNote proof.

---

# 12. Stage 6 — Exact-release live RemNote proof

## Goal

Prove the exact release SHA against a real connected RemNote workspace.

## Required skills

**MANDATORY**

- `remnote-mcp-workflow-auditor`
- `verification-before-completion`
- `executing-plans`

**CONDITIONAL**

- `webapp-testing` — for visual/browser evidence where useful.

## Preconditions

Before any live write:

- [ ] `/health` reports exact release SHA.
- [ ] Plugin build corresponds to exact release SHA.
- [ ] Plugin connected.
- [ ] Initial sync complete.
- [ ] Focused/approved root re-read live.
- [ ] Target is disposable.
- [ ] Write scope confirmed.
- [ ] Danger/destructive tier disabled unless explicitly required by one sandbox test.
- [ ] Test URLs contain no secrets.

Never trust a remembered Rem ID without live confirmation.

## Core proof sequence

Run in this order:

1. `get_bridge_status`
2. `ping_remnote_plugin`
3. `get_focused_rem`
4. bounded read
5. child/tree read
6. safe small write
7. readback
8. same-idempotency-key repeat
9. guarded stale-state rejection
10. card creation/readback
11. formula/rich-text preservation
12. supported design/style verification
13. resumable import interruption
14. job status inspection
15. reconnect if part of scenario
16. resume
17. verify
18. completed-job no-replay check
19. exact Test 14 case
20. image insertion
21. audio insertion
22. YouTube/video insertion

## Test 14 exact-release requirement

Test 14 must prove:

- correct chunk budget;
- correct native-node count;
- all intended chunks;
- pause;
- status;
- resume;
- reconnect where relevant;
- no duplicate verified chunk;
- verification;
- completed-job behavior;
- PostgreSQL persistence where release uses PostgreSQL.

Run the exact scenario at least twice when feasible.

## Tests 01–15 exact-release campaign

Use the exact existing test prompts/reports as test definitions.

Rules:

- never edit historical reports in place;
- create a new dated release campaign report;
- keep writes in disposable approved root;
- read back every artifact;
- preserve source Rems;
- preserve IDs where repair requires in-place update;
- use explicit verdicts.

Allowed verdicts:

```text
PASS
PASS_WITH_WARNINGS
RECOVERY_PASS
RECOVERY_PASS_WITH_WARNINGS
PARTIAL
SDK_UNSUPPORTED
BLOCKED
PLUGIN_NOT_CONNECTED
FAIL
```

Do not use `PASS` when the actual result is a supported subset plus limitation.

## Media live-proof campaign

Create:

`remnote-mcp-media-live-proof-YYYY-MM-DD.md`

Record:

```text
Branch:
HEAD:
Deployment SHA:
Plugin build SHA:
SDK version:
Approved root:
Image URL:
Image mutation IDs:
Image readback:
Image visual result:
Image idempotency repeat:

Audio URL:
Audio mutation IDs:
Audio readback:
Audio player result:
Audio idempotency repeat:

YouTube URL:
Video mutation IDs:
Video readback:
Video playback/embed result:
Video idempotency repeat:

Direct video URL:
Result:

Limitations:
```

## Media proof requirements

### Image

Need all:

- MCP call success;
- created/updated ID;
- readback evidence;
- visible image render;
- no duplicate on same key.

### Audio

Need all:

- MCP call success;
- created/updated ID;
- readback evidence;
- visible audio player;
- playback works;
- no duplicate on same key.

### Video

Need all:

- MCP call success;
- created/updated ID;
- readback evidence;
- embedded YouTube/video player visible;
- playback/embed functional;
- no duplicate on same key.

A stored URL string is not sufficient.

## Disconnect rule

If plugin disconnects:

- stop affected writes;
- return/report `PLUGIN_NOT_CONNECTED`;
- reconnect explicitly;
- re-read focus/scope;
- inspect uncertain state;
- never blind replay.

## Stage 6 completion gate

Exact release SHA has live proof for:

- read;
- write;
- readback;
- idempotency;
- guarded mutation;
- resumable import;
- Test 14;
- image;
- audio;
- video.

---

# 13. Stage 7 — Judge-ready release engineering

## Goal

Package the exact proven release so a judge can test it quickly.

## Required skills

**MANDATORY**

- `verification-before-completion`
- `writing-plans`

**CONDITIONAL**

- `security-best-practices`
- `mcp-builder`
- `openai-docs`

## Root README requirements

Create/update root `README.md` with:

1. What RemNote MCP is.
2. Why RemNote is a different target from a general-purpose workspace MCP.
3. Architecture diagram.
4. Supported platforms.
5. Local setup.
6. Hosted setup.
7. ChatGPT pairing.
8. Codex connection.
9. Scope/write-access model.
10. Tool-profile explanation.
11. Exact release version/SHA.
12. Build Week pre-existing foundation.
13. Build Week eligible delta.
14. Codex/GPT-5.6 usage.
15. Judge quick start.
16. Read-only test.
17. Safe-write test.
18. Resumable-import demo.
19. Media demo.
20. Known limitations.
21. Security guidance.
22. Troubleshooting.
23. Release artifact link.

## Judge artifact

Publish a prebuilt plugin artifact tied to exact release SHA.

Then test from a clean environment/account where practical.

Record:

```text
Artifact URL:
Artifact checksum:
Source SHA:
Install date:
Clean environment:
Installation result:
Connection result:
Read test:
Write test:
Media test:
```

## Judge prompts

### Read-only

A simple bounded prompt proving:

- focus;
- child read;
- no mutation.

### Safe write

A small structured note with:

- hierarchy;
- formula;
- card;
- readback;
- same-key repeat.

### Resumable import

A prepared fixture demonstrating:

- plan;
- partial run;
- interruption;
- resume;
- verify.

### Media

A prepared prompt with:

- one image URL;
- one audio URL;
- one YouTube URL;
- deterministic placement;
- readback.

## Metadata release audit

Reconcile:

- `package.json`
- `server/package.json`
- `public/manifest.json`
- `chatgpt-app-submission.json`
- `TOOL_REFERENCE.md`
- README
- hosted health identity
- release tag

Do not leave stale “RemNote ChatGPT Bridge” text in user-facing material unless intentionally documenting history.

## Immutable release

After final proof:

- create immutable tag/release;
- do not move the tag;
- record exact SHA;
- use same SHA in Devpost evidence.

## Stage 7 completion gate

A judge can:

```text
understand
→ install
→ connect
→ approve safe scope
→ read
→ write
→ verify
→ run media demo
```

without needing private explanations.

---

# 14. Stage 8 — OpenAI Build Week submission completion

## Goal

Finish the submission only after software truth is frozen.

## Required skills

**MANDATORY**

- `verification-before-completion`

**MANDATORY FOR OPENAI PRODUCT/MODEL CLAIMS**

- `openai-docs`

Do not use `openai-docs` for Devpost rules; use official Devpost/OpenAI Build Week rules directly.

## Required submission items

Complete current official submission requirements, including:

- project category;
- individual/team information;
- country;
- repository;
- license/access requirements;
- judge installation/testing instructions;
- plugin/developer-tool instructions;
- `/feedback` Codex Session ID;
- demo video;
- all required custom fields.

## `/feedback`

Use the actual primary Build Week Codex session containing the majority of eligible core implementation.

Do not invent the ID.

Upload logs where required and preserve proof of successful upload.

## Demo video

Public YouTube video.

Keep within current official time limit.

The recommended story:

```text
problem
→ why RemNote
→ safe connection/scope
→ difficult structured knowledge workflow
→ interruption/recovery
→ readback/verification
→ image/audio/video insertion
→ what Codex + GPT-5.6 changed during Build Week
```

The demo must not claim capabilities that were not live-proven on the release SHA.

## Stage 8 completion gate

Submission text, repository, release SHA, video, testing instructions, and evidence all refer to the same product state.

---

# 15. Verification command matrix

Codex must inspect current scripts first. The table below is a minimum, not an excuse to skip stronger current gates.

| Area | Command |
| --- | --- |
| Identity | `git branch --show-current && git rev-parse HEAD && git status --short` |
| Focused TDD | `npx vitest run tests/<relevant>.test.ts` |
| Root tests | `npm test` |
| Types | `npm run check-types` |
| SDK validation | `npm run validate` |
| Plugin build | `npm run build` |
| Server build | `npm run server:build` |
| Server smoke | `npm run server:smoke` |
| Security | `npm run server:test:security` |
| Boundaries | `npm run server:test:boundaries` |
| Tool schemas | `npm run server:test:tool-schemas` |
| Idempotency | `npm run server:test:idempotency` |
| Source fidelity | `npm run server:test:source-fidelity` |
| Health routing | `npm run server:test:health-check-routing` |
| Bulk storage | `npm run server:test:bulk-storage` |
| Style correctness | `npm run test:style-correctness` |
| Hosted smoke | `npm run server:test:e2e-hosted-smoke` |
| Live bridge | `npm run bridge:live-test` |
| Live tool smoke | `npm run bridge:live-tool-smoke` |
| Live regression | `npm run bridge:live-tool-regression` |

Also inspect current scripts for:

- auth;
- pairing;
- Codex bearer;
- Codex routing;
- connector compatibility;
- tool profiles;
- tier switching;
- performance;
- PostgreSQL durability.

Record exact commands and exit codes in final report.

---

# 16. Source hierarchy

When sources conflict, use this order.

## Product behavior truth

1. exact-release live RemNote readback/visual proof;
2. exact-release automated regression;
3. current source code;
4. historical reports;
5. old prose.

## RemNote SDK capability truth

1. installed SDK typings/runtime;
2. current official RemNote Plugin API docs;
3. live RemNote behavior.

## OpenAI capability truth

1. current official OpenAI documentation;
2. live product/API behavior available to the user.

## Repository intent

1. this `AGENTS.md`;
2. current approved implementation plan;
3. product/architecture docs;
4. historical stage plans.

---

# 17. Official external references for media research

RemNote Plugin API:

- https://plugins.remnote.com/api/classes/RichTextNamespace

RemNote media behavior:

- https://help.remnote.com/en/articles/6752220-adding-images-and-media

OpenAI documentation must be retrieved through the `openai-docs` skill or current official OpenAI sources when making claims about:

- ChatGPT image generation;
- image artifacts/URLs;
- Codex image generation;
- speech/TTS;
- Voice;
- GPT-5.6.

---

# 18. Final Codex completion report

Codex must not finish with:

- “done”;
- “all tools work”;
- “production-ready”;

without the evidence below.

Use this exact final structure:

```markdown
# RemNote MCP completion report

## Skills used
- Stage 0:
- Stage 1:
- Stage 2:
- Stage 3:
- Stage 4:
- Stage 5:
- Stage 6:
- Stage 7:
- Stage 8:

## Release identity
- Branch:
- HEAD:
- Working tree:
- Release tag:
- Deployment SHA:
- Plugin build SHA:
- CI run:
- Artifact URL:

## Product score
- Core correctness: /20
- Bulk/recovery: /15
- Safety/security: /15
- Connection/runtime: /10
- Design/formatting: /10
- Media: /10
- Tests/CI: /10
- Judge readiness: /10
- Total: /100

## Hard gates
- Passed:
- Failed:
- Blocked:

## Existing defects fixed
- Defect:
  - RED test:
  - Fix:
  - Regression:
  - Live proof:

## New media capabilities
### Image
- Tool:
- Schema:
- Capability probe:
- Automated proof:
- Live readback:
- Visual proof:
- Idempotency:

### Audio
- Tool:
- Schema:
- Capability probe:
- Automated proof:
- Live readback:
- Playback proof:
- Idempotency:

### Video/YouTube
- Tool:
- Schema:
- Capability probe:
- Automated proof:
- Live readback:
- Embed/playback proof:
- Idempotency:

## Automated verification
- Commands:
- Exit codes:
- Test counts:
- CI:

## Live RemNote proof
- Approved root:
- Read proof:
- Write proof:
- Guarded mutation:
- Cards:
- Formula:
- Design:
- Resumable import:
- Test 14:
- Tests 01–15:
- Media report:

## Judge readiness
- README:
- Prebuilt artifact:
- Clean install:
- Judge prompts:
- Hosted endpoint:
- Known limitations:

## Known limitations
- ...

## Remaining blockers
- ...

## Release verdict
- COMPLETE / NOT COMPLETE
```

`COMPLETE` is allowed only when:

- every hard gate passes;
- score >= 95/100;
- no P0/P1 defect remains;
- final exact SHA has live proof;
- judge installation path works.

---

# 19. Product priority rule

Do not spend remaining Build Week time on speculative breadth.

Priority is:

1. preserve data;
2. preserve security;
3. eliminate duplicate/replay risk;
4. make exact release reliable;
5. prove core product live;
6. add image/audio/video URL insertion;
7. prove media live;
8. make judge installation effortless;
9. document limitations honestly;
10. only then consider optional generation/hosting features.

Do not optimize for tool count.

Optimize for this judge experience:

```text
I understand what this is.
I can connect it.
I can see what access it has.
I can safely test it.
It performs a difficult structured workflow.
It survives interruption.
It verifies its own work.
It can add useful media.
I trust the evidence.
```

That is the completion standard.
