# AGENTS.md — RemNote MCP Live-Test Recovery Plan

## Mission

This repository is the RemNote MCP bridge. The current branch goal is **safe, repeatable, verified RemNote note creation from ChatGPT/Vivy**.

The latest 15 live tests prove that the project is not live-ready for mass note creation yet.

Correct current status:

```text
Safe read/focus core: mostly working.
Small setup writes: mostly working.
Mass note creation: not live-proven.
Bulk import: failing verification.
File-backed import: blocked by file input handling.
Styling mutation: unsafe.
Card lifecycle: not reliable.
Stability: not acceptable for large writes.
Final combined proof: partial only.
```

Do not claim production readiness until the final live proof returns `LIVE_PROVEN_READY` or a strictly justified `READY_WITH_WARNINGS` with no core blocker.

---

## Evidence baseline — 2026-06-25 / 2026-06-26

The user ran a 15-test live RemNote MCP audit under the focused Rem:

```text
Focused Rem: Plugin Test
Focused Rem ID: OjLcSppWfIH0cpPoh
```

### Test verdict summary

```text
01 Preflight, focus, and scope safety: PASS
02 Tool visibility/profile matrix: PASS_WITH_WARNINGS
03 Default-profile tool audit: PARTIAL
04 Read-chain/search consistency: PASS_WITH_WARNINGS
05 Safe write/idempotency: FAILED_VERIFICATION
06 Markdown preview/planning: PARTIAL
07 Small bulk import workflow: FAILED_VERIFICATION
08 Full Chapter One file-backed import: BLOCKED
09 Bulk resume/retry/partial handling: BLOCKED
10 Duplicate/scope/cleanup protection: FAILED_VERIFICATION
11 Formula/math fidelity: FAILED_VERIFICATION
12 Design/styling mutation invariants: FAILED_VERIFICATION
13 Card lifecycle: FAILED_VERIFICATION
14 Latency/timeout/stability soak: FAILED_RUNTIME
15 Final combined live proof: PARTIAL_PROOF
```

### Meaning

The bridge has a usable core, but the mass-note path is not safe enough yet. The bulk writer, file-backed import, style tools, card tools, duplicate behavior, and runtime stability must be fixed before real course-note import work.

---

# 1. What is going on

## 1.1 The code architecture improved

This branch has a better modular architecture than `main`:

```text
server/src/mcp-server.ts
server/src/tool-policy.ts
server/src/tools/register-bulk-import-tools.ts
server/src/tools/register-write-tools.ts
shared/bridge/bulk-import.ts
shared/bridge/markdown-importer.ts
src/remnote/write/*
src/remnote/write-engine/*
```

The MCP server registers tools through grouped modules and filters them by profile. The default profile is `mass_note_writer`.

That is good.

## 1.2 But registry success is not runtime success

Agents must keep these states separate:

```text
source declares tool
MCP lists tool
ChatGPT sees schema
tool call reaches bridge
tool call reaches plugin
RemNote SDK operation succeeds
readback verifies result
source fidelity verifies result
```

A tool is not proven until the final verification step passes.

## 1.3 The mass-note profile still exposes unstable bulk tools

`mass_note_writer` includes the bulk import tools. That profile is conceptually correct, but live testing shows the bulk execution path still fails.

Until fixed, large note creation must stay gated behind small sandbox tests.

## 1.4 The main blocker is source fidelity

Small bulk imports created output, but verification failed. The observed output had:

```text
repeated wrapper roots
visible Size/H1 and Size/H3 content nodes
altered verification anchors
source_fidelity_failed
partial chunks
```

Do not run the full Nuclear Chapter One import again until the small bulk import passes.

## 1.5 File-backed import is blocked

The source file was locally readable and the Chapter One boundary was valid:

```text
file: /mnt/data/Nuclear Phyiscs.md
startMarker: # Chapter One:
stopBeforeMarker: # Chapter Two:
sections 1.1 through 1.5: found
Chapter Two: excluded locally
```

But the file-backed MCP tools failed before job creation with a proxied-file-path rewrite error.

The fix must support connector-mounted files, not only local filesystem paths.

## 1.6 Styling is currently unsafe

The styling test showed that a style operation changed hierarchy by creating visible `Size` metadata nodes and changing child order.

Style-only operations must preserve:

```text
plain text
child IDs
child order
parent IDs
formula text
created-child count
```

Until this passes, style tools must not be part of normal note creation.

## 1.7 Cards are not reliable yet

Basic/concept/descriptor cards mostly worked. Cloze, multiple-choice, and list-answer cards failed verification. Card repair/verification also gave questionable results.

Card tools must remain outside mass-note creation until verifier behavior is fixed.

## 1.8 Runtime stability is a blocker

The stability soak hit consecutive timeouts. The final combined test disconnected mid-run. One write call timed out after mutation may already have started.

This means large writes are unsafe until timeout, reconnect, and unknown-write-state handling are improved.

---

# 2. Non-negotiable agent rules

1. Always call bridge/plugin/focus status before live work.
2. Treat the live focused Rem result as authority, not remembered IDs.
3. Write only under a fresh disposable root unless the user explicitly asks otherwise.
4. Verify every created root by readback before using it as a target.
5. Stop after a plugin disconnect, focus mismatch, or unknown write state.
6. Never claim a write passed unless readback proves it.
7. Never claim a bulk import passed unless job verification and independent readback agree.
8. Never run large imports after small import source-fidelity failure.
9. Never run styling/card/design mutation tools on old user notes while those tools are failing tests.
10. Never hide `FAILED_VERIFICATION`, `FAILED_RUNTIME`, `BLOCKED`, or `PARTIAL` under success wording.
11. Never use broad cleanup paths in normal profiles.
12. Keep all high-risk cleanup work guarded, sandbox-only, and opt-in.

---

# 3. Root-cause clusters

## Cluster A — Runtime/source alignment

Symptoms:

```text
registered tools and live-callable schemas did not always match
active profile often appeared broader than the default profile
some tools were visible in registry but not directly callable in a session
```

Files to inspect:

```text
server/src/mcp-server.ts
server/src/tool-policy.ts
server/src/tool-registry.ts
server/src/app.ts
server/src/config.ts
server/src/server/create-http-server.ts
chatgpt-app-submission.json
```

Fix:

```text
Expose gitSha, branchName, buildTime, toolSchemaVersion, toolRegistryVersion, defaultToolProfile, activeToolProfile, registeredToolNames, mcpListedToolNames, and runtimeVerifiedTools in diagnostics.
```

---

## Cluster B — File-backed import input handling

Symptoms:

```text
plan_note_import_from_file failed
start_note_import_from_file failed
connector/proxied file path rewrite error appeared
```

Files to inspect:

```text
server/src/tools/register-bulk-import-tools.ts
server/src/tools/schemas.ts
server/src/server/create-http-server.ts
server/src/app.ts
shared/bridge/protocol-write-args.ts
```

Fix:

```text
Support both local sourceFilePath and connector-provided mounted file references.
Return a clean INVALID_ARGS error for unusable paths.
Return resolved file path, byte length, source hash, and extracted chapter hash after successful read.
```

---

## Cluster C — Bulk/Markdown source fidelity

Symptoms:

```text
source_fidelity_failed
anchor text altered
underscore anchors not preserved
repeated wrapper roots
visible Size/H metadata nodes
```

Files to inspect:

```text
shared/bridge/markdown-importer.ts
shared/bridge/bulk-import.ts
server/src/tools/register-write-tools.ts
server/src/tools/register-bulk-import-tools.ts
src/bridge/markdown-importer.ts
src/remnote/write/markdownImportExecutor.ts
src/remnote/write/notePlan.ts
src/remnote/write/verification.ts
```

Fix:

```text
Use one shared canonical source-to-output normalization.
Preserve anchors exactly.
Prevent repeated wrapper creation.
Never emit style metadata as visible content.
Make preview, write, and verification use the same parser and normalization rules.
```

---

## Cluster D — Idempotency and duplicate behavior

Symptoms:

```text
same-key replay often returned same ID but still reported created
same title under same parent with different key silently duplicated
bulk retry/resume could create wrapper duplication
```

Files to inspect:

```text
src/remnote/write/writeCaches.ts
src/remnote/write/basicWrites.ts
src/remnote/write/treeWrites.ts
src/remnote/write/markdownImportExecutor.ts
server/src/bulk-import/job-store.ts
server/src/tools/register-bulk-import-tools.ts
shared/bridge/bulk-import.ts
```

Fix:

```text
same idempotency key -> already_applied
same title + same parent + different key -> explicit duplicate warning or refusal before write
bulk job retry -> reuse recorded root/chapter/section IDs
resume -> skip verified chunks
```

---

## Cluster E — Readback and scope verification

Symptoms:

```text
created root sometimes could not be verified
safe readback calls were sometimes platform-blocked
search scope was not always enforced
```

Files to inspect:

```text
server/src/tools/register-read-tools.ts
server/src/tools/schemas.ts
server/src/mcp-tool-map.ts
server/src/tool-policy.ts
src/remnote/read.ts
src/remnote/serialize.ts
src/remnote/permissions.ts
```

Fix:

```text
Keep safe read schemas/descriptions short.
Return parent proof in write results.
Make contextRemId scope enforcement explicit.
If a read is blocked upstream, do not continue into write-heavy work.
```

---

## Cluster F — Styling mutation safety

Symptoms:

```text
apply_style_plan created visible Size nodes
child order changed
unexpected child IDs appeared
```

Files to inspect:

```text
server/src/tools/register-formatting-tools.ts
src/remnote/write/formattingWrites.ts
src/remnote/write/styleMutationInvariant.ts
src/remnote/richTextFormatting.ts
src/remnote/style/index.ts
src/remnote/write/verification.ts
```

Fix:

```text
Before/after snapshot required for every style operation.
Fail if child IDs, child order, parent IDs, or plain text change unexpectedly.
Use SDK style APIs only; do not route style-only operations through content creation.
```

---

## Cluster G — Card lifecycle verification

Symptoms:

```text
cloze card verification failed
multiple-choice verification failed
list-answer verification failed
helper children appeared
repair/verification reported questionable card counts
```

Files to inspect:

```text
server/src/tools/register-card-tools.ts
src/remnote/cards/index.ts
src/remnote/write/cardWrites.ts
src/remnote/write/verification.ts
tests/card-verifier.test.ts
```

Fix:

```text
Bound traversal.
Add empty/no-card fast path.
Verify each card type against actual RemNote SDK representation.
Keep card repair out of normal workflows until verifier passes.
```

---

## Cluster H — Timeout and disconnect stability

Symptoms:

```text
three consecutive timeouts
write timeout with unknown mutation status
plugin disconnect during final proof
severe latency outliers on tiny writes
```

Files to inspect:

```text
server/src/bridge-hub.ts
server/src/bridge/bridge-hub-retry.ts
server/src/bridge/request-ledger.ts
server/src/bridge/session-router.ts
server/src/tools/tool-context.ts
server/src/performance/tool-budgets.ts
src/bridge/client.ts
src/bridge/status.ts
src/widgets/bridge-status.tsx
```

Fix:

```text
Add phase timing across MCP server, queue, websocket, plugin pickup, SDK execution, plugin response, and MCP response.
Classify unknown write state as retryable but unsafe to continue automatically.
Add stale-plugin detection before writes.
Stop write loops after unknown mutation state.
```

---

# 4. Staged repair plan

## Stage 0 — Prove runtime/source alignment

Goal: make sure the tested runtime matches this branch.

Required work:

```text
Expose gitSha, branchName, buildTime, toolSchemaVersion, toolRegistryVersion, active/default profile, and registered/listed tool names.
```

Acceptance:

```text
local branch metadata equals live diagnostics metadata
mass_note_writer tool list is exactly as expected
```

---

## Stage 1 — Lock down `mass_note_writer`

Goal: expose only safe mass-note tools.

Allowed tools:

```text
get_bridge_status
get_plugin_status
get_focused_rem
get_rem
get_children
get_rem_tree
get_rem_breadcrumbs
search_rems
get_document_or_folder_tree
create_or_replace_note_from_markdown
plan_note_import
plan_note_import_from_file
start_note_import_job
start_note_import_from_file
run_note_import_job_step
get_note_import_job_status
resume_note_import_job
verify_note_import_job
cancel_note_import_job
```

Keep style/card/design/debug/cleanup/power-user tools outside this profile.

Acceptance:

```text
Tests 02 and 03 pass without unexpected tools or missing callable schemas.
```

---

## Stage 2 — Standard response envelope and timing

Goal: every tool result must explain what happened.

Every tool should return:

```text
status
toolName
operationId
idempotencyKey/idempotencyResult
targetRemId/parentRemId
createdRemIds/updatedRemIds/deletedRemIds
verification.attempted/passed/method/warnings
errorCode/errorMessage/retryable
phaseDurations.totalMs
warnings
```

Acceptance:

```text
No write tool returns vague success only.
Same-key replay says already_applied.
get_bridge_status includes total timing or explicit N/A reason.
```

---

## Stage 3 — Safe readback and scope verification

Goal: every created target must be verifiable before reuse.

Acceptance:

```text
Test 04 passes cleanly.
Test 09 no longer blocks on root verification.
Search scope is explicit.
```

---

## Stage 4 — File-backed import compatibility

Goal: file-backed tools work with local paths and connector-mounted files.

Acceptance:

```text
Test 06 file planning passes.
Test 08 can create a file-backed plan and job without file rewrite error.
```

---

## Stage 5 — Markdown/source fidelity repair

Goal: small imports must be perfect before large imports.

Acceptance:

```text
Test 05 passes with no visible metadata pollution.
Test 07 passes with exact anchors, no repeated wrappers, and source fidelity passed.
Test 10 duplicate import subtest no longer pollutes hierarchy.
```

Do not run full Chapter One import before this stage passes.

---

## Stage 6 — Idempotency and duplicate protection

Goal: retries never create duplicate note trees.

Acceptance:

```text
same-key replay creates no duplicate and reports already_applied
same-title/same-parent/different-key behavior is explicit
bulk resume duplicate count is zero
```

---

## Stage 7 — Bulk resume/retry/partial-state engine

Goal: interrupted jobs resume safely.

Acceptance:

```text
Test 09 passes.
No completed job contains partial or written_not_verified chunks.
resume skips verified chunks.
```

---

## Stage 8 — Stability and timeout recovery

Goal: no ordinary workflow collapses under repeated calls.

Acceptance:

```text
Test 14 passes or passes with only minor recovered warnings.
No three-timeout storm.
No unknown mutation state remains unresolved.
Plugin remains connected through end status.
```

---

## Stage 9 — Full Chapter One import and formula fidelity

Goal: prove the real Nuclear file import.

Acceptance:

```text
Test 08 passes.
Test 11 passes.
Chapter One sections 1.1–1.5 exist.
Chapter Two is absent.
Required formula snippets are readable.
No visible metadata pollution.
```

---

## Stage 10 — Styling/design repair

Goal: style tools preserve structure.

Acceptance:

```text
Test 12 passes.
No style operation changes child IDs, child order, parent IDs, or plain text unexpectedly.
```

Style tools remain outside mass_note_writer until this passes.

---

## Stage 11 — Card lifecycle repair

Goal: card creation and verifier are bounded and correct.

Acceptance:

```text
Test 13 passes or passes with only optional repair skipped.
No false cardCount 0 when cards exist.
No verifier timeout.
```

---

## Stage 12 — Guarded sandbox cleanup

Goal: allow cleanup of only current-session disposable test roots.

Acceptance:

```text
dry-run cleanup succeeds on disposable test root
real cleanup succeeds only after dry-run and exact guards
unsafe targets are refused
normal profiles do not expose broad cleanup
```

---

## Stage 13 — Final 15-test rerun

Goal: produce final live evidence.

Required result:

```text
Test 15 returns LIVE_PROVEN_READY.
```

`READY_WITH_WARNINGS` is acceptable only for optional/non-core warnings. It is not acceptable if bulk import, file-backed import, source fidelity, formula fidelity, parent scope, duplicate behavior, or stability remains incomplete.

---

# 5. Tool policy during repair

## Safe during diagnosis

```text
get_bridge_status
get_plugin_status
get_focused_rem
get_rem
get_children
get_rem_tree
get_rem_breadcrumbs
search_rems
get_document_or_folder_tree
preview_markdown_note_tree when callable
plan_note_import dry-run/planning only
get_note_import_job_status
cancel_note_import_job for safe job stop only
```

## Use only in tiny disposable roots

```text
create_rem
create_or_replace_note_from_markdown
start_note_import_job
run_note_import_job_step
resume_note_import_job
verify_note_import_job
```

## Do not use for real notes until fixed

```text
start_note_import_from_file
full Chapter One run_note_import_job_step
apply_style_plan
update_rem_rich
create_styled_rem_tree
create_polished_note_tree
apply_structured_note_batch
create_designed_note_tree
card tools
repair tools
replace tools
broad cleanup tools
```

---

# 6. Validation commands

Run local checks after each patch:

```bash
npm run check-types
npm run validate
npm run build
npm run server:build
npm run server:smoke
npm test
git diff --check
```

Then run live checks only when RemNote is open and the plugin is connected:

```bash
npm run mcp:live-test
npm run bridge:live-test
npm run mass-note-audit
```

If a command does not exist, add it or document the exact replacement. Do not claim a test passed without command output.

---

# 7. Definition of done

Do not merge or call this ready until all are true:

```text
runtime metadata matches branch metadata
mass_note_writer exposes only intended tools
safe readback is reliable
file-backed planning works
small bulk import passes source fidelity
no visible Size/H metadata nodes are created
anchors preserve underscores exactly
same-key idempotency reports already_applied
same-title duplicate behavior is explicit
resume creates zero duplicates
no job completes with partial/written_not_verified chunks
full Chapter One import passes
Chapter Two is absent from imported Chapter One
formula fidelity passes
style-only tools preserve structure
card verifier is bounded and correct
stability soak passes
final combined proof returns LIVE_PROVEN_READY
```

Until then, use this status wording:

```text
The RemNote MCP bridge has a working safety/read core, but mass note creation is not live-proven. Bulk import, file-backed import, styling, card verification, duplicate protection, and runtime stability require staged fixes before real use.
```

---

# 8. Agent behavior rules

- Be honest about failures.
- Patch in small stages.
- Do not rewrite the whole bridge.
- Do not loosen safety to make tests pass.
- Do not hide failed verification under skipped wording.
- Do not treat platform blocks as RemNote SDK failures.
- Do not keep testing large writes after hierarchy pollution.
- Do not test against a runtime that does not match the branch.
- Always report exact files changed, commands run, results, and remaining blockers.