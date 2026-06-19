# AGENTS.md — RemNote MCP Mass Note Creation Stability Plan

## Mission

You are working on the RemNote MCP bridge. The current known-working version must be preserved before any repair work. The goal of this branch is **not** to prove that every experimental tool can run. The goal is to make the bridge reliable enough for **safe, repeatable, large note creation from ChatGPT/Codex**.

The audit shows that the bridge already has a good core. Protect that core. Fix the root causes that block mass note creation:

1. Deployed-code/source-code mismatch risk.
2. Too many unstable/high-risk tools exposed to ChatGPT at once.
3. Missing standardized tool response and timing data.
4. Unsafe style mutation path.
5. Card verifier timeout.
6. No guarded cleanup path.
7. No chunked, resumable mass-note writer.

Do not rewrite the whole bridge. Patch in small, testable stages.

---

## Branching rule

Start from the current working source branch and preserve it.

```bash
git fetch origin

# Known working branch from the audit context.
git checkout feature/hosted-auth-pairing

# Preserve the working version. Do not modify this branch.
git branch baseline/remnote-mcp-working-audit-2026-06-12

# Repair branch.
git checkout -b fix/remnote-mcp-mass-note-creation-stability
```

If the baseline already exists, do **not** force-push over it. Create a second baseline:

```bash
git branch baseline/remnote-mcp-working-audit-2026-06-12-v2
```

---

## Safety contract

These rules are non-negotiable.

1. Never delete user content outside a disposable test root.
2. Never expose broad destructive tools in normal profiles.
3. Never run a real delete before a successful dry-run delete.
4. Never use legacy focus-based delete tools.
5. Only delete Rems created in the current audit/test session.
6. Never delete `Plugin Test` itself.
7. Never delete workspace roots.
8. Real cleanup must require:
   - exact `confirmTitle`;
   - `expectedParentId` or `expectedAncestorId`;
   - `requireCreatedInCurrentSession: true`;
   - idempotency key;
   - previous dry-run success.
9. Do not run huge real writes until cleanup is proven safe.
10. Every write path must have idempotency or duplicate-prevention.
11. Every style-only tool must preserve child count and plain text.
12. Every test result must classify outcome as:
    - `PASS`
    - `FAIL`
    - `PARTIAL`
    - `GATED`
    - `UNSUPPORTED`
    - `SKIPPED`
    - `BLOCKED_BY_PERMISSION`
    - `BLOCKED_BY_PROFILE`
    - `PLATFORM_BLOCKED`

---

## Current audit evidence

Latest manual audit target:

```text
Focused Rem: Plugin Test
Focused Rem ID: OjLcSppWfIH0cpPoh
Sandbox root created: 7sIIfsCdRDQ0WmIe5
Sandbox title: MCP audit sandbox 2026 06 12 2135
Cleanup: not deleted because delete_rem_by_id was hidden/gated
```

Audit-reported bridge state:

```text
Server version: remnote-mcp-0.9.0
Tool registry version: 2026-01-15-unified-tool-groups
Active tier/profile: danger
Permission mode: danger_zone
Permission scope: workspace_allowed
Declared tools: 66
Listed/callable tools: 63
Hidden/gated/unsupported tools: 3
Hidden tools: create_folder, delete_rem_by_id, replace_rem
```

Strongest working path:

```text
create_or_replace_note_from_markdown dry-run:
  planned nodes: 15
  internal duration: about 0.003 s
  status: PASS

create_or_replace_note_from_markdown real write:
  created nodes: 15
  internal duration: about 0.747 s
  verifyAfterWrite: true
  status: PASS

idempotency replay:
  duplicate nodes: 0
  result: already_applied
  status: PASS
```

Critical audit failures:

```text
create_rem:
  status: PASS but slow
  total duration: about 41.955 s
  plugin mutation duration: about 0.035 s

ping_remnote_plugin:
  duration: about 7.719 s

set_rem_heading_level:
  status: FAIL / PARTIAL_FAILURE
  unexpected child created: G5JRKAH5nhiphzh2F

verify_card_set:
  status: FAIL
  timeout: 12.000 s on empty/simple sandbox

delete_rem_by_id:
  hidden/gated, so cleanup could not run

Several harmless calls:
  platform-blocked before reaching bridge
```

---

## Root-cause hypothesis ranking

Fix in this order. The highest-ranked items may explain many downstream symptoms.

### Root cause 0 — Deployed bridge may not match the source branch

The audit reported:

```text
Server version: remnote-mcp-0.9.0
Tool registry version: 2026-01-15-unified-tool-groups
```

But the current source branch may report different constants such as a different `SERVER_VERSION`, `TOOL_REGISTRY_VERSION`, or `TOOL_SCHEMA_VERSION`.

This mismatch is a **stop-the-line issue**. If Codex patches a branch that is not the deployed code, every later test can mislead us.

Required first action:

1. Print local git SHA.
2. Print package version.
3. Print `SERVER_VERSION`.
4. Print `TOOL_REGISTRY_VERSION`.
5. Print `TOOL_SCHEMA_VERSION`.
6. Call deployed `get_bridge_status`.
7. Call deployed `get_bridge_diagnostics`.
8. Compare deployed values against local branch values.

If they do not match, do not debug style/card/latency yet. First align deployment or clearly mark that tests are running against an older deployment.

### Root cause 1 — The active profile is too broad for ChatGPT mass note writing

The audit ran in:

```text
Active tier/profile: danger
Permission mode: danger_zone
Permission scope: workspace_allowed
Listed/callable tools: 63
```

This is bad for normal ChatGPT note creation. It mixes safe note creation, debug tools, style mutation, card repair, design repair, and dangerous cleanup concepts in one session. That can cause:

- platform safety false positives;
- ChatGPT tool-selection confusion;
- harmless preview calls blocked upstream;
- accidental preference for unstable tools;
- noisy tool registry responses.

The likely whole-system fix is to create a **minimal mass-note profile** and make it the recommended/default ChatGPT profile.

Recommended profile name:

```text
mass_note_writer
```

It should expose only:

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
preview_markdown_note_tree only after platform block is fixed
```

Do **not** expose in this profile:

```text
delete_rem_by_id
replace_rem
create_folder
repair_note_design
repair_card_set
apply_remnote_command
debug_get_raw_rich_text
run_bridge_health_check
style tools
card tools
design mutation tools
```

If this profile works, mass note creation can ship before all 63 tools are perfect.

### Root cause 2 — Tool policy prefers unstable writers over the proven writer

The audit says the best writer is:

```text
create_or_replace_note_from_markdown
```

But current policy may still mark several gated or unstable wrappers as preferred for complete notes, such as:

```text
create_note_from_markdown_tree
create_polished_note_tree
create_styled_rem_tree
apply_structured_note_batch
create_designed_note_tree
```

Fix tool guidance so ChatGPT/Codex prefers the proven path first:

```text
create_or_replace_note_from_markdown
→ get_rem_tree/get_rem verification
→ no style tools during normal import
```

Wrappers may remain available in dev profiles, but they must not be recommended until they route through the same stable internal writer and pass tests.

### Root cause 3 — Response shape is not diagnostic enough

Several tools were marked `PARTIAL` because the response did not capture enough verification data.

A tool response must answer:

```text
What was attempted?
What was created?
What was updated?
What was skipped?
What was verified?
What failed?
Was it a bridge failure, profile block, permission block, or platform block?
How long did each phase take?
Was the idempotency key already applied?
```

Without this, Codex cannot patch confidently.

### Root cause 4 — Style tools may be using the wrong mutation path

`set_rem_heading_level` created a child Rem. That suggests the style operation may be routed through a markdown/content-creation path instead of an existing-Rem metadata/style setter.

Style tools must not call a path that creates or appends children.

### Root cause 5 — Card verification traversal is unbounded or waiting on missing metadata

`verify_card_set` timed out on an empty/simple sandbox. This suggests a missing empty-root fast path, unbounded traversal, or unresolved promise.

### Root cause 6 — Cleanup is too gated for test lifecycle

Keeping broad delete hidden is correct. But without a narrow cleanup-only sandbox delete, large-note testing cannot be safe.

---

# Patch stages

Do not skip stages. Each stage has a gate. If a gate fails, stop and fix it before moving on.

---

## Stage 0 — Prove source/deployment alignment

### Goal

Make sure the code being patched is the code being tested.

### Required work

Add or confirm a diagnostic endpoint/report that returns:

```text
gitSha
branchName
packageVersion
serverVersion
toolRegistryVersion
toolSchemaVersion
mcpDiscoveryVersion
bridgePluginProtocolVersion
buildTime
deploymentEnvironment
activeToolProfile
permissionMode
permissionScope
declaredToolCount
listedToolCount
hiddenToolCount
```

### Files to inspect

```text
package.json
server/package.json
server/src/tool-registry.ts
server/src/tool-policy.ts
server/src/mcp-server.ts
server/src/server/create-http-server.ts
server/src/app.ts
```

### Required test

Run local values and deployed values side by side.

```bash
npm run server:build
npm run server:smoke
```

Then call deployed:

```text
get_bridge_status
get_bridge_diagnostics
```

### Acceptance gate

Proceed only if:

```text
local toolRegistryVersion === deployed toolRegistryVersion
local toolSchemaVersion === deployed toolSchemaVersion
local serverVersion === deployed serverVersion
local gitSha === deployed gitSha
```

If `gitSha` is not currently exposed, add it.

---

## Stage 1 — Create a minimal `mass_note_writer` profile

### Goal

Reduce platform safety blocks and tool-selection confusion by exposing only the safe tools needed for mass note creation.

### Required work

Add a profile:

```ts
type ToolProfile =
  | "basic"
  | "mass_note_writer"
  | "note_writer"
  | "power_user"
  | "developer"
  | "danger";
```

The `mass_note_writer` profile should include:

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
```

Optional after fixing platform blocks:

```text
preview_markdown_note_tree
```

Do not include style, card, design-repair, debug/raw, health-check, replace, delete, or folder tools.

### Required policy changes

Mark `create_or_replace_note_from_markdown` as the primary recommended writer for mass notes.

Downgrade these from normal recommendation until stable:

```text
create_note_from_markdown_tree
append_markdown_as_rem_tree
create_polished_note_tree
create_styled_rem_tree
create_designed_note_tree
apply_structured_note_batch
```

They may remain available in `developer` or `power_user` profiles but should not be the first recommendation for ChatGPT mass note creation.

### Files to inspect

```text
server/src/tool-policy.ts
server/src/tool-registry.ts
server/src/mcp-server.ts
```

### Required tests

1. List tools with `basic`.
2. List tools with `mass_note_writer`.
3. List tools with `note_writer`.
4. List tools with `power_user`.
5. List tools with `developer`.
6. List tools with `danger`.

### Acceptance gate

`mass_note_writer` must list only safe mass-note tools and no destructive/repair/style/card tools.

---

## Stage 2 — Simplify safe tool metadata and payload wording

### Goal

Reduce platform safety false positives.

### Problem evidence

Harmless or safe calls were blocked:

```text
get_remnote_capability_guide
get_rem_rich
debug_get_raw_rich_text
verify_note_design
create_styled_rem_tree
preview_markdown_note_tree
create_polished_note_tree
create_note_from_markdown_tree
create_basic_flashcard
run_bridge_health_check
```

Some of these may not be SDK failures. They may be platform/tool-schema blocks.

### Required work

1. Keep dangerous words out of safe tool descriptions.
2. Keep `delete`, `replace`, `repair`, `raw`, and `debug` out of normal profile metadata.
3. Make preview/dry-run tool descriptions short and neutral.
4. Split large health checks into smaller tools or smaller payloads.
5. Avoid returning huge registry metadata unless requested.
6. Add `PLATFORM_BLOCKED` classification in test reports.

### Example wording

Bad:

```text
Repair, replace, delete, debug raw Rem tree...
```

Better:

```text
Preview a note import plan. This does not modify RemNote when dryRun is true.
```

### Required tests

1. Call every `mass_note_writer` tool with minimal payload.
2. Confirm no platform blocks.
3. Call preview tool with a tiny note.
4. Confirm platform block is not counted as RemNote bridge failure.

### Acceptance gate

All tools in `mass_note_writer` must be callable without platform block.

---

## Stage 3 — Standardize tool response envelope

### Goal

Make every tool result machine-readable and useful for Codex debugging.

### Required response shape

Use this envelope for all tools:

```ts
type StandardToolStatus =
  | "PASS"
  | "FAIL"
  | "PARTIAL"
  | "GATED"
  | "UNSUPPORTED"
  | "SKIPPED"
  | "BLOCKED_BY_PERMISSION"
  | "BLOCKED_BY_PROFILE"
  | "PLATFORM_BLOCKED";

type StandardToolResponse = {
  status: StandardToolStatus;
  toolName: string;
  operationId: string;
  idempotencyKey?: string;
  idempotencyResult?: "created" | "updated" | "already_applied" | "skipped" | "not_supported";

  targetRemId?: string;
  parentRemId?: string;
  createdRemIds: string[];
  updatedRemIds: string[];
  deletedRemIds: string[];

  plannedNodeCount?: number;
  createdNodeCount?: number;
  updatedNodeCount?: number;
  skippedNodeCount?: number;

  verification: {
    attempted: boolean;
    passed?: boolean;
    method?: string;
    before?: unknown;
    after?: unknown;
    warnings: string[];
  };

  errorCode?: string;
  errorMessage?: string;
  retryable?: boolean;

  phaseDurations: {
    serverReceivedMs?: number;
    serverQueueMs?: number;
    serverToPluginMs?: number;
    pluginPickupMs?: number;
    pluginExecutionMs?: number;
    pluginToServerMs?: number;
    serverResponseMs?: number;
    totalMs: number;
  };

  warnings: string[];
};
```

### Required work

1. Wrap existing tool handlers with a response-normalizer.
2. Do not lose tool-specific details.
3. Convert thrown errors into structured `FAIL` with `errorCode`.
4. Convert hidden/profile blocks into `BLOCKED_BY_PROFILE`.
5. Convert permission problems into `BLOCKED_BY_PERMISSION`.
6. Convert platform-level blocks in the test runner into `PLATFORM_BLOCKED`.

### Acceptance gate

No write tool may return only a vague success string.

---

## Stage 4 — Add phase timing and diagnose latency before optimizing

### Goal

Find the exact slow segment.

### Problem evidence

```text
create_rem total: about 41.955 s
create_rem plugin mutation: about 0.035 s
ping_remnote_plugin: about 7.719 s
```

The RemNote SDK mutation is probably not the bottleneck.

### Required work

Instrument these phases:

```text
MCP tool call received
server validates request
server enqueues/forwards to plugin
plugin receives request
plugin starts SDK call
plugin finishes SDK call
plugin sends response
server receives plugin response
server returns MCP response
```

### Likely files

```text
server/src/server/create-http-server.ts
server/src/app.ts
server/src/config.ts
server/src/mcp-server.ts
src/bridge/*
src/App.tsx
```

### Likely faults

Check for:

1. Render/free-host cold start.
2. WebSocket sleep or reconnect delay.
3. Long-poll interval too high.
4. Request queue not flushing immediately.
5. Plugin heartbeat missing or stale.
6. Response waiting on wrong request ID.
7. Retry loop adding hidden delay.
8. Tool gateway timeout/retry behavior.
9. Plugin tab inactive/suspended.

### Required tests

Run each 5 times:

```text
ping_remnote_plugin
get_plugin_status
get_rem on sandbox root
create_rem under sandbox root
create_or_replace_note_from_markdown 15-node real write
```

Then idle 60 seconds and run again.

### Acceptance gate

Either:

```text
warm ping < 2 s
warm create_rem < 5 s
```

or the response clearly reports which phase is slow and whether cold start is likely.

Do not optimize blindly before timing exists.

---

## Stage 5 — Protect and harden the proven Markdown writer

### Goal

Make `create_or_replace_note_from_markdown` the stable mass-note MVP.

### Required work

Add regression tests around the exact behavior that passed:

1. 15-node dry-run.
2. 15-node real write.
3. verifyAfterWrite.
4. idempotency replay creates 0 duplicates.
5. math block preserved.
6. inline math preserved.
7. table converted safely.
8. heading hierarchy correct.
9. read-back through `get_rem_tree`.

### Required behavior

Normal mass note creation should use:

```text
create_or_replace_note_from_markdown
→ verifyAfterWrite
→ get_rem_tree read-back
→ idempotency replay check
```

### Do not

Do not route normal mass-note imports through style tools, card tools, design repair tools, or `replace_rem`.

### Acceptance gate

The exact 15-node audit case still passes.

---

## Stage 6 — Add guarded sandbox cleanup

### Goal

Make large tests safe by allowing cleanup of only disposable roots.

### Important design decision

Do **not** expose broad `delete_rem_by_id` to normal users. Instead prefer a cleanup-only tool or a strongly guarded delete path.

Recommended safer tool name:

```text
cleanup_disposable_test_root
```

If reusing `delete_rem_by_id`, it must be hidden outside sandbox/danger testing.

### Required schema

```ts
{
  remId: string;
  dryRun: boolean;
  confirmTitle: string;
  expectedParentId?: string;
  expectedAncestorId?: string;
  requireCreatedInCurrentSession: true;
  idempotencyKey: string;
}
```

### Required guards

Refuse unless:

```text
dry-run happened first
confirmTitle exactly matches
target is under expected parent or ancestor
target was created in current session
target is not Plugin Test
target is not a workspace root
target is not outside approved sandbox
```

### Required tests

1. Dry-run delete disposable child: `PASS`.
2. Real delete disposable child after dry-run: `PASS`.
3. Wrong title: `REFUSED`.
4. Wrong ancestor: `REFUSED`.
5. Plugin Test root: `REFUSED`.
6. Not created in current session: `REFUSED`.
7. Same idempotency key replay: no duplicate side effect.

### Acceptance gate

A complete sandbox lifecycle works:

```text
create sandbox
write small note
dry-run cleanup
real cleanup
verify removed
```

---

## Stage 7 — Fix style-only mutation pollution

### Goal

Style tools must not corrupt note hierarchy.

### Problem evidence

```text
set_rem_heading_level
status: FAIL / PARTIAL_FAILURE
unexpected child: G5JRKAH5nhiphzh2F
```

### Likely fault

The style path may be using a generic markdown/rich-text/content writer that appends content instead of applying metadata/style to the existing Rem.

### Files/search terms

```text
set_rem_heading_level
set_rem_text_color
set_rem_highlight_color
set_text_span_color
set_text_span_highlight
set_hide_bullet
clear_rem_formatting
apply_remnote_command
update_rem_rich
src/bridge/protocol.ts
src/bridge/*
src/App.tsx
server/src/mcp-server.ts
```

### Required invariant

For every style-only operation:

```text
beforeChildIds === afterChildIds
beforeChildOrder === afterChildOrder
beforePlainText === afterPlainText
onlyExpectedStyleChanged === true
```

### Required tests

For each style tool:

1. Create target Rem.
2. Add two known children.
3. Save before snapshot:
   - target text;
   - raw/rich text;
   - child IDs;
   - child order.
4. Apply style operation.
5. Save after snapshot.
6. Assert invariant.

Tools:

```text
set_rem_heading_level
set_rem_text_color
set_rem_highlight_color
set_text_span_color
set_text_span_highlight
set_rem_type
set_hide_bullet
clear_rem_formatting
apply_style_plan
apply_remnote_command
update_rem_rich
```

### Acceptance gate

`set_rem_heading_level` passes the exact audit regression and creates no child Rems.

---

## Stage 8 — Fix card verifier timeout before card generation

### Goal

Verification must be bounded and fast.

### Problem evidence

```text
verify_card_set timed out after 12 s on empty/simple sandbox
```

### Likely faults

1. Recursive traversal without cap.
2. No fast path for empty roots.
3. Waiting for missing card metadata.
4. Promise never resolves when no card-like Rem exists.
5. Card detection scans too broadly.

### Required fix

Add:

```text
maxNodes
maxDepth
maxCards
timeoutMs
```

Add empty/no-card fast path:

```ts
if (visitedNodeCount === 0 || cardLikeRems.length === 0) {
  return {
    status: "PASS",
    cardCount: 0,
    warning: "No cards found under target root.",
    durationMs
  };
}
```

If a cap is reached, return `PARTIAL` with warning. Do not hang.

### Required tests

1. Empty sandbox root returns under 1 second.
2. Ordinary note with no cards returns under 1 second.
3. One basic card verifies.
4. One cloze card verifies.
5. 50 mixed ordinary/card Rems verifies within limit.
6. Exceed traversal cap returns `PARTIAL`.

### Acceptance gate

`verify_card_set` never times out on empty or ordinary roots.

---

## Stage 9 — Unify note writers around one internal `NotePlan`

### Goal

Stop maintaining many divergent writing paths.

### Problem evidence

The audit showed:

```text
create_or_replace_note_from_markdown: PASS
apply_structured_note_batch: PARTIAL
create_polished_note_tree: GATED
create_styled_rem_tree: GATED
create_note_from_markdown_tree: GATED
append_markdown_as_rem_tree: SKIPPED/GATED
create_designed_note_tree: SKIPPED/GATED
```

### Required architecture

Use one internal pipeline:

```text
Markdown input
Structured input
Polished input
Designed input
        ↓
normalize to NotePlan
        ↓
dry-run validate
        ↓
write via stable writer
        ↓
post-write verification
        ↓
standard response
```

### Required work

1. Find why `create_or_replace_note_from_markdown` works.
2. Extract or reuse its parser/planner/writer.
3. Route structured/polished/designed wrappers through that same path.
4. Do not let wrappers use separate style-heavy write paths until style tools are safe.
5. Every wrapper must support:
   - dry-run;
   - idempotency;
   - verifyAfterWrite;
   - standard response envelope.

### Acceptance gate

Same small note represented as Markdown and structured input produces equivalent Rem tree.

---

## Stage 10 — Add chunked mass-note creation

### Goal

Support 100+ node notes without corrupting the workspace.

### Required pipeline

```text
parse input
validate plan
estimate risk
split into chunks
write chunk manifest
apply chunk 1
verify chunk 1
apply chunk 2
verify chunk 2
...
final full-tree verification
```

### Required dry-run report

```text
plannedNodeCount
maxDepth
mathCount
tableCount
flashcardMarkers
estimatedWriteRisk
recommendedChunkSize
chunkCount
warnings
```

### Required real-write behavior

1. Use whole-import idempotency key.
2. Use per-chunk idempotency keys.
3. Save created IDs per chunk.
4. On failure, return `PARTIAL`.
5. Do not continue after a failed chunk.
6. Retry must not duplicate completed chunks.
7. Cleanup must be available before large real writes.

### Benchmarks

Only run real writes after guarded cleanup works.

```text
25-node dry-run and real write
50-node dry-run and real write
100-node dry-run and real write
250-node dry-run only until cleanup is proven
500-node dry-run only until cleanup is proven
```

### Acceptance gate

100-node note writes under sandbox, verifies, and cleans up safely.

---

## Stage 11 — Repair design/template tools after core writer is stable

### Goal

Design features should not block mass note creation.

### Current status

```text
verify_note_against_design: PASS
verify_note_design: GATED
analyze_note_design: PARTIAL
export_note_design_template: PASS/PARTIAL
save/import/update/repair design tools: skipped/gated
```

### Required order

1. Stabilize read-only design verification.
2. Make `analyze_note_design` deterministic.
3. Add export/import round-trip hash.
4. Only then enable mutating design update/repair.

### Acceptance gate

Design template export/import returns normalized equality or hash match.

---

## Stage 12 — Repair card creation after verifier is stable

### Goal

Card creation tools should be safe, bounded, and testable.

### Current status

```text
create_basic_flashcard: GATED
create_concept_card: SKIPPED
create_descriptor_card: SKIPPED
create_cloze_card: SKIPPED
create_multiple_choice_card: SKIPPED
create_list_answer_card: SKIPPED
create_card_set_from_note: SKIPPED
create_flashcards_from_markdown: SKIPPED
create_cloze_cards_from_note: SKIPPED
repair_card_set: SKIPPED
```

### Required order

1. Fix `verify_card_set`.
2. Make `create_basic_flashcard` pass in sandbox.
3. Make `create_cloze_card` pass.
4. Add `create_flashcards_from_markdown` using stable NotePlan/card markers.
5. Add verification after card creation.
6. Keep `repair_card_set` disabled until verifier and creation are stable.

### Acceptance gate

A small card set can be created, verified, replayed idempotently, and cleaned up.

---

## Stage 13 — Full regression harness and report

### Goal

Create repeatable evidence that the branch is safe.

### Required suites

```text
S00 source/deployment alignment
S01 profile listing and gating
S02 platform-block detection
S03 read-only tools
S04 stable markdown writer
S05 idempotency
S06 guarded cleanup
S07 phase timing/performance
S08 style invariants
S09 card verifier
S10 NotePlan wrapper equivalence
S11 chunked import
S12 design/template round-trip
S13 card creation
```

### Required output

Save report as JSON and Markdown.

```text
reports/remnote-mcp-live-audit-<timestamp>.json
reports/remnote-mcp-live-audit-<timestamp>.md
```

Each row must include:

```text
suite
testName
toolName
status
durationMs
phaseDurations
createdRemIds
updatedRemIds
deletedRemIds
verification
errorCode
rootCauseClass
fixRecommendation
```

### Acceptance gate

The final report proves:

```text
15-node import still passes
50-node import passes
100-node import passes
style tools do not pollute hierarchy
verify_card_set returns under 1 s for empty/no-card roots
guarded cleanup dry-run passes
guarded cleanup real delete only deletes current-session sandbox Rems
idempotency replay creates 0 duplicates
```

---

# Tool-specific instructions

## Protect these tools

Do not break:

```text
get_bridge_status
get_bridge_diagnostics
get_plugin_status
get_focused_rem
get_current_selection
get_rem
get_children
get_rem_breadcrumbs
get_rem_tree
get_document_or_folder_tree
search_rems
create_rem
create_document
append_to_rem
create_rem_tree
create_or_replace_note_from_markdown
```

## Primary writer

For normal ChatGPT mass note creation, prefer:

```text
create_or_replace_note_from_markdown
```

Avoid for normal mass-note creation until fixed:

```text
create_polished_note_tree
create_styled_rem_tree
create_note_from_markdown_tree
append_markdown_as_rem_tree
create_designed_note_tree
apply_structured_note_batch
style tools
card tools
repair tools
delete tools
replace tools
```

## Broken tools

### `set_rem_heading_level`

Severity: blocker for style suite.

Do not run broad style tests until this exact regression passes.

### `verify_card_set`

Severity: blocker for card suite.

Do not run card repair or bulk card generation until this returns quickly on empty/no-card roots.

## Hidden/unsupported tools

### `create_folder`

Keep hidden until a verified RemNote SDK folder path exists.

### `replace_rem`

Keep hidden until atomic replace and rollback exists.

### `delete_rem_by_id`

Keep broad delete hidden. Add or expose only a narrow sandbox cleanup path.

---

# Local commands

Run local non-live checks first:

```bash
npm install
npm run check-types
npm run validate
npm run server:build
npm run server:smoke
```

Then live tests only when the bridge is connected:

```bash
# Read-only only
REMNOTE_LIVE_TEST_MODE=read_only npm run mcp:live-test

# Safe sandbox under Plugin Test
REMNOTE_LIVE_TEST_MODE=safe_sandbox \
REMNOTE_LIVE_TEST_PARENT_ID=OjLcSppWfIH0cpPoh \
npm run mcp:live-test

# Full sandbox only after cleanup is safe
REMNOTE_LIVE_TEST_MODE=full_sandbox \
REMNOTE_LIVE_TEST_PARENT_ID=OjLcSppWfIH0cpPoh \
npm run mcp:live-test
```

Do not run `full_sandbox` until:

```text
source/deployment versions match
mass_note_writer profile works
15-node markdown writer still passes
guarded cleanup dry-run passes
set_rem_heading_level no longer creates children
verify_card_set returns quickly on empty/no-card roots
```

---

# Definition of done

Do not merge this branch into the working branch until all are true:

```text
deployed git/version metadata matches the source branch being tested
mass_note_writer profile exposes only safe mass-note tools
create_or_replace_note_from_markdown remains PASS
15-node import dry-run and real write pass
50-node import real write passes
100-node import real write passes
idempotency replay creates 0 duplicate Rems
warm create_rem total duration < 5 s or phase timing identifies the external slow phase
set_rem_heading_level creates no children
all style-only tools preserve child IDs, child order, and plain text
verify_card_set returns under 1 s for empty/no-card roots
safe preview/dry-run tools are not platform-blocked in mass_note_writer profile
guarded cleanup dry-run works
guarded real cleanup deletes only current-session disposable Rems
final JSON and Markdown audit reports are saved
```

If any definition-of-done item fails, keep the branch open.

---

# Agent behavior rules

- Prefer small patches with tests.
- Do not rewrite the whole bridge.
- Do not loosen safety to make tests pass.
- Do not expose broad destructive tools.
- Do not hide real failures under `SKIPPED`.
- Do not classify platform safety blocks as bridge failures.
- Do not keep testing huge writes after hierarchy pollution.
- Do not test against a deployment that does not match the source branch.
- Keep the known-working branch untouched.
- Always report exact files changed, exact test commands, and exact test results.