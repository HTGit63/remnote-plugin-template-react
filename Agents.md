# AGENTS.md

## Purpose

This file gives AI coding agents strict instructions for working in this repository.

This repository is the **RemNote ChatGPT Bridge**.

The goal is **not** to build an AI chatbot inside RemNote.

The goal is to let ChatGPT / Vivy use RemNote through a safe, typed, permissioned, auditable bridge.

The intended architecture is:

```text
ChatGPT / Vivy
↓
MCP-compatible tool layer
↓
Local companion server
↓
WebSocket bridge
↓
Running RemNote plugin
↓
RemNote SDK
↓
User's RemNote knowledge base
```

The RemNote plugin is the RemNote SDK access layer.

ChatGPT / Vivy is the reasoning layer.

The bridge must make RemNote usable for high-quality note generation, editing, reading, verification, and structured writing without unsafe silent changes.

---

# 1. Current Diagnosis — 2026-05-14

## 1.1 Latest known repo state

The latest inspected commit is:

```text
81ce44bfad43a2ab4c1eeda1f107449e18938825
Commit message: 26 Working tools
```

The repo currently declares:

```text
43 public MCP tools
1 hidden gated tool: delete_rem
toolRegistryVersion: 2026-05-14.2
mcpDiscoveryVersion: mcp-discovery-2026-05-14.2
```

The source-level registry exposure problem is mostly fixed.

The old 8-tool surface was a stale connector/discovery problem.

However, the system is **not complete**.

The previous live test report showed that only about **26 tools were working reliably**. Milestones 1-9 are now implemented and repo-verified, with a health-check tool available to record a real RemNote sandbox pass before public hosted submission wording is allowed.

## 1.2 Main current problem

The main problem is no longer only:

```text
ChatGPT cannot see all tools.
```

The current problem is:

```text
The bridge exposes 43 public tools, but not all 43 are verified working in live execution against the RemNote plugin and RemNote SDK.
```

Diagnostics now correctly say:

```text
callabilitySource: registry_only_not_live_execution
```

This is important.

It means a tool being listed as `callableTools` does **not** prove that the tool actually worked through the full path:

```text
ChatGPT → MCP tools/call → companion server → WebSocket bridge → plugin approval → RemNote SDK → result back to ChatGPT
```

## 1.3 Product-level problem

The bridge is not yet good enough for one-pass, high-quality structured note generation.

The current workflow often forces Vivy to use many small sequential tools:

```text
append_to_rem
update_rem
set_rem_heading_level
set_rem_text_color
set_text_span_color
move_rem
reorder_children
```

That creates several failure points:

```text
multiple approval prompts
multiple MCP calls
multiple chances for timeout
multiple chances for OUT_OF_SCOPE
partial note creation
flat note structure
math inserted as plain text
styling failures
gateway blocking
```

The correct direction is to build one reliable atomic structured-writing tool that can create or replace a complete note tree in one approved operation.

---

# 2. Do Not Mark Complete Yet

Do not describe the current bridge as fully complete.

Correct status wording:

```text
The source-level 43-tool registry is present and the connector exposes all 43 public tools. Milestones 1-9 are repo-verified, but a recorded live RemNote sandbox health-check pass is still required before public hosted production-ready wording.
```

Incorrect status wording:

```text
All 43 tools work live.
Complete.
Issue fixed.
```

---

# 3. Current Working / Risky Tool Classification

## 3.1 Tools reported as working or mostly working

These tools are currently usable or mostly usable based on live testing:

```text
get_bridge_status
get_bridge_diagnostics
ping_remnote_plugin
get_plugin_status
get_focused_rem
get_rem
get_rem_tree
get_current_selection
get_children
get_rem_breadcrumbs
search_rems
get_document_or_folder_tree
append_to_rem
update_rem
move_rem
reorder_children
update_rem_rich
set_rem_heading_level
set_rem_highlight_color
set_rem_type
set_hide_bullet
create_basic_flashcard
create_concept_card
create_descriptor_card
create_multiple_choice_card
create_list_answer_card
```

Do not assume every tool above is perfect. Still test them after changes.

## 3.2 Tools previously problematic or still live-risky

These tools caused hangs, timeouts, partial execution, gateway blocks, or SDK errors:

```text
create_rem
replace_rem
create_rem_tree
get_rem_rich
create_cloze_card
```

Notes:

```text
create_rem timed out and may have created a blank Rem anyway.
replace_rem caused a stuck call.
create_rem_tree caused a stuck call.
get_rem_rich was blocked by the ChatGPT/OpenAI gateway during testing.
create_cloze_card was blocked by the ChatGPT/OpenAI gateway during testing.
set_rem_text_color and span color/highlight tools fail with SDK format argument errors.
clear_rem_formatting fails with rem.setType argument error.
```

2026-05-14 update:

```text
Formatting tools now use SDK-supported color names, best-effort color clearing, and SDK_UNSUPPORTED for unsupported default/highlight/type reset paths.
Live RemNote sandbox QA is still required to move them from source-verified to live-verified.
```

## 3.3 Dangerous tools

These must remain strongly gated:

```text
delete_focused_rem
delete_selected_rem
delete_rem
```

Rules:

```text
delete_rem must remain hidden by default.
delete_focused_rem and delete_selected_rem must always require approval.
Delete must require typed confirmText: DELETE.
Delete must show target title, child count, descendant count, and recursive warning.
```

---

# 4. Core Root Causes

## 4.1 Registry callability is not runtime callability

The current registry lists tools as public/callable because they are registered.

That does not mean the tool executed successfully in a real RemNote session.

Required distinction:

```text
registryDeclaredTools = tools declared in source registry
mcpListedTools = tools returned by MCP tools/list
mcpRegisteredTools = tools actually registered with McpServer
recentSuccessfulToolCalls = tools that succeeded through the bridge
realPluginVerifiedTools = tools that succeeded against real RemNote plugin/SDK
runtimeUnverifiedTools = public tools that have not succeeded live
```

Never let diagnostics imply runtime success unless a real call succeeded.

## 4.2 Approval-gated writes are fragile

Write tools can fail because they cross two approval/session layers:

```text
ChatGPT tool-call approval / gateway
RemNote plugin approval UI
```

Current symptoms:

```text
APPROVAL_TIMEOUT
stuck calls
blank partial Rems
request appears gone in UI while ChatGPT is still waiting
approval may not produce a clean final response
```

Required fix:

```text
Every approval-gated request must have a complete lifecycle state machine.
```

## 4.3 Multi-step note generation is too fragile

High-quality RemNote notes require:

```text
root title
nested headings
body bullets
equation children
rendered inline math
rendered math blocks
colors
heading levels
highlights
Rem type
bullet visibility
ordering
verification
```

Doing this through many separate tool calls is brittle.

The bridge needs a single atomic batch/tree writer.

## 4.4 Permission scope blocks descendant editing

When permission scope is:

```text
focused_rem_only
```

Vivy can edit the focused Rem but cannot style/read newly created children.

This causes:

```text
OUT_OF_SCOPE
Request target is outside the focused Rem scope.
```

For note generation, practical scope must be:

```text
focused_rem_and_descendants
```

or:

```text
approved_document_or_folder
```

with descendant access.

## 4.5 Math is not represented as RemNote math

Markdown/plain text insertion is not enough.

LaTeX like this:

```text
\psi(\mathbf r,t)
|\psi(\mathbf r,t)|^2
```

must become RemNote rich math nodes, not escaped visible text.

Required mapping:

```text
$...$        -> inlineMath
\(...\)      -> inlineMath
$$...$$      -> mathBlock
\[...\]      -> mathBlock
```

## 4.6 SDK formatting calls are wrong or incomplete

Historical observed errors:

```text
richText.removeTextFormatFromRange format parameter: Invalid input
rem.setType type parameter: Required
```

Affected tools:

```text
set_rem_text_color
set_text_span_color
set_text_span_highlight
clear_rem_formatting
```

Likely root causes:

```text
invalid RichTextFormatName values
passing color names not accepted by SDK
using one function for text color and highlight without confirming SDK distinctions
calling rem.setType with invalid/default enum
```

2026-05-14 source fix:

```text
SDK typings and installed SDK output were checked.
Supported colors are red, orange, yellow, green, blue, and purple.
pink, gray, whole-Rem highlight clearing, and normal type reset return SDK_UNSUPPORTED instead of SDK_ERROR.
Text/span color clearing is best-effort and default color clearing returns structured SDK_UNSUPPORTED if the SDK rejects range clearing.
```

## 4.7 Gateway-blocked tools need graceful alternatives

Some tools were blocked before reaching the plugin:

```text
get_rem_rich
create_cloze_card
```

The bridge cannot fix all ChatGPT/OpenAI gateway behavior, but it can reduce risk by:

```text
shorter schemas
clearer descriptions
less suspicious/destructive wording
smaller payloads
fallback tools
atomic note tool with safe name and schema
diagnostics that identify gateway-blocked vs plugin-failed
```

---

# 5. Product Rule

The plugin should not think.

The plugin should not call OpenAI.

The plugin should not store OpenAI API keys.

The plugin should not choose AI models.

The plugin should not contain a ChatGPT-like sidebar.

The plugin should only:

```text
read RemNote context
serialize RemNote data safely
receive typed tool requests
enforce permissions
show approval UI when needed
execute approved RemNote SDK actions
return structured results
```

---

# 6. Absolute Non-Negotiable Rules

Do not add direct OpenAI API calls.

Do not add an AI chat UI inside RemNote.

Do not reintroduce OpenAI API key settings.

Do not scrape ChatGPT.

Do not scrape RemNote DOM.

Do not expose arbitrary unsafe delete by default.

Do not silently rewrite user notes.

Do not silently delete user notes.

Do not fake SDK support.

Do not report success if the RemNote SDK operation failed.

Do not report registry callability as runtime success.

Do not implement everything in one giant patch.

Do not break the currently working tools.

Do not remove the approval model.

Do not let failed write calls terminate the MCP session.

Do not create partial blank Rems without returning partial execution details.

Do not rely on many sequential writes for one high-quality note when a single atomic write is possible.

---

# 7. Required Architecture Direction

## 7.1 Keep low-level tools

Keep low-level tools for debugging and precise operations.

Examples:

```text
get_children
update_rem
append_to_rem
set_rem_heading_level
move_rem
reorder_children
```

## 7.2 Add high-level atomic workflow tools

For real note writing, add high-level tools that perform multiple RemNote SDK operations inside the plugin after one approval.

Priority tool:

```text
apply_structured_note_batch
```

Alternative names:

```text
create_or_replace_focused_rem_tree
apply_note_transaction
create_styled_rem_tree_atomic
```

The recommended name is:

```text
apply_structured_note_batch
```

Reason:

```text
It makes clear that this is one batch transaction, not a simple tree create.
```

## 7.3 Batch tool should support one-pass note creation

The batch tool must support:

```text
root update or root create
nested Rem tree
H1/H2/H3/normal heading levels
text color
highlight color
hide bullet
Rem type
inline math
math blocks
quote style
plain text spans
bold/italic/underline
blank spacer Rems
cards only if explicitly requested
move/reorder if needed
verification readback
rollback on failure where possible
idempotencyKey
dryRun mode
```

## 7.4 Why a batch tool is needed

Vivy can call tools one by one, but one-by-one tool use is not reliable enough for high-quality note generation.

Problems with separate calls:

```text
each tool has its own approval lifecycle
each tool can timeout
each tool can be blocked by scope
each tool can fail after earlier calls succeeded
styling child Rems requires child IDs and scope
math conversion requires consistent rich text parsing
ordering can break after partial execution
```

The bridge should make the best workflow easy:

```text
one tool call
one approval
one structured payload
one execution plan
one verification report
one result
```

---

# 8. New Required Tool: apply_structured_note_batch

## 8.1 Tool purpose

Use this when Vivy needs to create or update a complete structured RemNote note in one operation.

This tool is the preferred path for:

```text
lecture notes
physics/math notes
SAT notes
ESSLCE notes
nested outlines
styled notes
math-heavy content
multi-section notes
```

## 8.2 Input schema

```json
{
  "target": {
    "mode": "focused_rem | rem_id | parent_child",
    "remId": "string or null",
    "parentId": "string or null",
    "createIfMissing": false
  },
  "operation": "replace_children | append_children | update_root_and_replace_children | create_child_tree",
  "idempotencyKey": "string",
  "dryRun": false,
  "rollbackOnFailure": true,
  "verifyAfterWrite": true,
  "note": {
    "root": {
      "text": "string",
      "style": {
        "headingLevel": "H1",
        "color": "blue",
        "highlight": "default",
        "hideBullet": false,
        "remType": "normal"
      },
      "richText": [
        {
          "type": "text",
          "text": "string",
          "styles": {
            "bold": true,
            "italic": false,
            "underline": false,
            "color": "blue",
            "highlight": "default"
          }
        }
      ]
    },
    "children": [
      {
        "type": "rem",
        "text": "Section Heading",
        "style": {
          "headingLevel": "H3",
          "color": "red",
          "highlight": "default",
          "hideBullet": false
        },
        "children": [
          {
            "type": "paragraph",
            "text": "Body text."
          },
          {
            "type": "mathBlock",
            "latex": "\\psi(\\mathbf r,t)"
          }
        ]
      }
    ]
  }
}
```

## 8.3 Output schema

```json
{
  "ok": true,
  "result": {
    "operationId": "string",
    "idempotencyKey": "string",
    "dryRun": false,
    "status": "completed",
    "targetRemId": "string",
    "createdRemIds": ["string"],
    "updatedRemIds": ["string"],
    "deletedRemIds": ["string"],
    "movedRemIds": ["string"],
    "nodeCount": 0,
    "mathNodeCount": 0,
    "styledNodeCount": 0,
    "cardNodeCount": 0,
    "verification": {
      "verified": true,
      "readBackRootId": "string",
      "expectedNodeCount": 0,
      "actualNodeCount": 0,
      "warnings": []
    }
  }
}
```

Failure output:

```json
{
  "ok": false,
  "error": {
    "code": "PARTIAL_FAILURE",
    "message": "Structured note batch failed after partial execution.",
    "details": {
      "operationId": "string",
      "idempotencyKey": "string",
      "createdRemIds": ["string"],
      "updatedRemIds": ["string"],
      "rolledBackRemIds": ["string"],
      "rollbackStatus": "completed | partial | failed | not_attempted",
      "failedStep": "string",
      "sdkMessage": "string"
    }
  }
}
```

## 8.4 Rules

```text
One approval request for the whole batch.
No separate approval for every child.
No silent partial success.
Return created/updated/deleted IDs.
Use idempotency key to avoid duplicate retries.
Support dryRun before real write.
Validate full payload before writing anything.
Apply permission scope once to the root and descendants.
If rollbackOnFailure is true, delete newly created Rems on failure where safe.
Never rollback user-existing Rems unless explicitly allowed.
After write, read back and verify if verifyAfterWrite is true.
```

## 8.5 Acceptance test

Create a disposable Rem called:

```text
MCP Batch Writer Test
```

Call `apply_structured_note_batch` to create:

```text
H1 blue title
H3 red headings
paragraph children
inline math
math block
one quoted child
one highlighted child
```

Expected:

```text
one approval prompt
correct nested structure
math renders as math
headings styled correctly
result returns all created IDs
verification passes
no pending requests after completion
get_bridge_status still works
```

---

# 9. Required Task Plan

## Task 1 — Preserve and document current 26-tool reality

### Goal

Make the project honest about current state.

### Required changes

Update diagnostics and docs to say:

```text
43 tools exposed
previous live report verified about 26 working
remaining tools unverified/problematic
callabilitySource = registry_only_not_live_execution
```

### Acceptance

```text
get_bridge_diagnostics shows realPluginVerifiedTools
get_bridge_diagnostics shows runtimeUnverifiedTools
get_bridge_diagnostics does not imply all public tools work
AGENTS.md tells agents not to call the project complete
```

---

## Task 2 — Fix approval lifecycle before adding new features

### Goal

No write request should hang, timeout incorrectly, or partially execute silently.

### Files to inspect

```text
src/widgets/bridge-status.tsx
src/bridge/client.ts
src/bridge/handlers.ts
server/src/bridge-hub.ts
server/src/mcp-server.ts
```

### Required lifecycle states

```text
received
validated
waiting_for_approval
approval_approved
approval_rejected
approval_timeout
executing
completed
failed
partial_failure
rollback_started
rollback_completed
rollback_failed
cancelled
```

### Required result mapping

```text
APPROVED -> execute operation
APPROVAL_REJECTED -> return APPROVAL_REJECTED
APPROVAL_TIMEOUT -> return APPROVAL_TIMEOUT
REQUEST_CANCELLED -> return CLIENT_DISCONNECTED or REQUEST_CANCELLED structured error
SDK_ERROR -> return SDK_ERROR
PLUGIN_NOT_CONNECTED -> return PLUGIN_NOT_CONNECTED
```

### Must fix

```text
create_rem timeout after approval
replace_rem stuck call
create_rem_tree stuck call
blank partial Rem creation without success result
```

### Acceptance

```text
approve returns success/failure
reject returns APPROVAL_REJECTED
timeout returns APPROVAL_TIMEOUT
plugin disconnect returns PLUGIN_NOT_CONNECTED
failed SDK call returns SDK_ERROR
no request remains pending forever
get_bridge_status works after every failure
recentRequestLifecycle records every phase
```

---

## Task 3 — Add idempotency and partial execution tracking

### Goal

Retries must not duplicate notes or create blank Rems.

### Required implementation

For write tools, especially:

```text
create_rem
create_rem_tree
create_styled_rem_tree
apply_structured_note_batch
flashcard tools
```

add:

```text
idempotencyKey
operationId
createdRemIds
updatedRemIds
partialExecution
rollbackStatus
```

### Rules

```text
If the same idempotencyKey is retried, return the original result if completed.
If prior execution is still pending, return OPERATION_PENDING.
If prior execution partially failed, return partial failure details.
Do not create duplicates on retry.
```

### Acceptance

```text
retry create_rem with same idempotencyKey does not create a duplicate
retry batch note write does not duplicate children
partial failure returns createdRemIds
```

---

## Task 4 — Fix permission scope for real note writing

### Goal

Allow descendants created under the focused/approved root to be edited and verified.

### Required scopes

Keep:

```text
focused_rem_only
selected_rem_only
workspace_allowed
```

Ensure these work:

```text
focused_rem_and_descendants
selected_rem_and_descendants
approved_document_or_folder
```

Add if needed:

```text
approved_root_and_descendants
created_during_this_operation
```

### Required behavior

```text
If focused_rem_and_descendants is active, any descendant of focused Rem is in scope.
If a batch operation creates a Rem, that created Rem is in scope for the rest of the same operation.
If approved_document_or_folder is active, descendants of approved root are in scope.
```

### Acceptance

```text
append child under focused Rem
style that child in same operation
read that child back
no OUT_OF_SCOPE
outside Rem still returns OUT_OF_SCOPE
```

---

## Task 5 — Fix SDK formatting errors

### Goal

Make formatting tools reliable or explicitly unsupported.

### Broken tools

```text
set_rem_text_color
set_text_span_color
set_text_span_highlight
clear_rem_formatting
```

### Known errors

```text
richText.removeTextFormatFromRange format parameter: Invalid input
rem.setType type parameter: Required
```

### Required investigation

Inspect actual SDK typings and runtime behavior for:

```text
RichTextFormatName
applyTextFormatToRange
removeTextFormatFromRange
setHighlightColor
setFontSize
setType
SetRemType
```

### Rules

```text
Do not guess SDK enum values.
Do not use color names unless SDK accepts them.
Do not use highlight and text color interchangeably unless SDK proves they share the same format system.
If SDK cannot support an action, return SDK_UNSUPPORTED.
```

### Acceptance

```text
set_rem_text_color works on a test Rem or returns SDK_UNSUPPORTED
set_text_span_color works on a test range or returns structured error
set_text_span_highlight works on a test range or returns structured error
clear_rem_formatting works without SDK_ERROR
all failures preserve session
```

---

## Task 6 — Fix math rendering

### Goal

Math-heavy notes must render properly in RemNote.

### Required parser

Create a markdown/rich-text parser that maps:

```text
$...$ -> inlineMath
\(...\) -> inlineMath
$$...$$ -> mathBlock
\[...\] -> mathBlock
```

### Required support

```text
text before and after math
multiple inline math nodes in one Rem
display math as child Rem or math block node
escaped dollar signs
LaTeX backslashes preserved correctly
```

### Tool integration

Use this parser in:

```text
update_rem_rich
create_styled_rem_tree
apply_structured_note_batch
```

Do not rely on plain markdown for math-heavy notes.

### Acceptance

Create a test note containing:

```text
The wave function is \(\psi(\mathbf r,t)\).
The probability density is \(|\psi(\mathbf r,t)|^2\).

\[
\int |\psi(\mathbf r,t)|^2 d^3r = 1
\]
```

Expected:

```text
inline math renders inline
display equation renders as math block
no visible escaped plain LaTeX where math is expected
get_rem_rich detects inline_math and math_block
```

---

## Task 7 — Build apply_structured_note_batch

### Goal

Let Vivy write one complete note in one tool call and one approval.

### Why

This is the main improvement needed so Vivy does not have to fight many tools.

### Required features

```text
dryRun
idempotencyKey
rollbackOnFailure
verifyAfterWrite
root update
child creation
nested tree
styles
math
ordering
created IDs
verification report
```

### Initial supported node types

```text
rem
paragraph
heading
inlineMath
mathBlock
quote
spacer
```

Do not add flashcards to the first version unless needed.

### Acceptance

One call creates a complete mini physics note:

```text
H1 blue root title
H3 red section headings
nested body bullets
inline math
display math
ordered children
verification passes
```

---

## Task 8 — Rework create_rem_tree and create_styled_rem_tree around the batch engine

### Goal

Stop maintaining separate fragile tree-writing paths.

### Required direction

Implement one internal engine:

```text
structuredWriteEngine()
```

Then make these tools wrappers around it:

```text
create_rem_tree
create_styled_rem_tree
apply_structured_note_batch
```

### Rules

```text
validate entire tree before writing
one approval
track all created IDs
return partial failure details
rollback newly created Rems if safe
verify readback
```

### Acceptance

```text
create_rem_tree no longer hangs
create_styled_rem_tree creates styled nested structure
partial failures are reported with created IDs
```

---

## Task 9 — Improve diagnostics for live verification

### Goal

Make diagnostics explain what is actually verified.

### Add fields

```json
{
  "toolRegistryVersion": "string",
  "mcpDiscoveryVersion": "string",
  "callabilitySource": "registry_only_not_live_execution | live_execution",
  "registryDeclaredTools": [],
  "mcpListedTools": [],
  "mcpRegisteredTools": [],
  "realPluginVerifiedTools": [],
  "runtimeUnverifiedTools": [],
  "sdkUnsupportedTools": [],
  "gatewayBlockedTools": [],
  "lastSuccessfulToolCalls": [],
  "lastFailedToolCalls": [],
  "pendingApproval": null,
  "recentApprovalLifecycle": [],
  "partialExecutions": [],
  "lastPartialExecution": null
}
```

### Acceptance

```text
diagnostics clearly separates registry-listed from live-verified tools
recent failed tools show reason
partial blank Rems are visible in diagnostics
runtimeUnverifiedTools shrinks as tools pass live tests
```

---

## Task 10 — Add safe live tool health-check mode

### Goal

Know which tools are actually live-working, not merely registered.

### New tool

```text
run_bridge_health_check
```

### Modes

```text
read_only
safe_sandbox
full_sandbox
```

### Rules

```text
Never run destructive checks by default.
Use only a disposable sandbox root Rem.
Do not test delete unless explicitly requested and target is disposable.
```

### Output

```json
{
  "mode": "safe_sandbox",
  "testedAt": "string",
  "passedTools": [],
  "failedTools": [
    {
      "tool": "string",
      "errorCode": "string",
      "message": "string"
    }
  ],
  "skippedTools": [
    {
      "tool": "string",
      "reason": "string"
    }
  ]
}
```

### Acceptance

```text
health check identifies working tools
health check does not damage real notes
diagnostics includes last health-check summary
```

---

## Task 11 — Reduce ChatGPT/OpenAI gateway blocking

### Goal

Make tools less likely to be blocked before reaching RemNote.

### Known blocked tools

```text
get_rem_rich
create_cloze_card
```

### Required improvements

```text
shorten tool descriptions
avoid suspicious words where possible
keep schemas small and clear
avoid overly broad tool names if gateway flags them
add fallback tools
avoid massive payloads in one non-batch low-level tool
```

### Add fallback tools

```text
get_rem_safe_rich_summary
create_practice_card_safe
```

or make existing tools safer by schema simplification.

### Acceptance

```text
get_rem_rich or fallback can be called from ChatGPT
create_cloze_card or fallback can be called from ChatGPT
gateway block is clearly distinguished from plugin failure
```

---

## Task 12 — Improve Vivy workflow rules

### Goal

Guide Vivy to use the bridge correctly.

### Tool usage policy for Vivy

For reading:

```text
1. get_plugin_status
2. get_focused_rem
3. get_children or get_rem_tree
4. get_rem_rich only when needed and not gateway-blocked
```

For simple edits:

```text
use update_rem or append_to_rem
verify with get_rem or get_children
```

For complete notes:

```text
use apply_structured_note_batch
do not use many append_to_rem calls unless batch tool is unavailable
```

For styling:

```text
prefer style inside batch payload
avoid post-hoc styling child Rems under focused_rem_only
```

For math:

```text
use rich math nodes
never write math-heavy notes as plain escaped markdown
```

For risky operations:

```text
avoid delete tools unless user explicitly asks
avoid replace_rem until lifecycle is fixed
avoid create_rem_tree until atomic engine is fixed
```

---

# 10. Required Validation Commands

Run after each milestone:

```bash
npm run check-types
npm run validate
npm run build
npm run server:build
npm run server:smoke
npm audit
npm audit --omit=dev
git diff --check
```

Do not stop after compile-only success.

A tool is not “working” until it passes the correct runtime test.

---

# 11. Required Manual Regression Root

Use a disposable Rem:

```text
MCP Regression Test Root
```

Never run destructive tests on real notes.

Recommended settings for live QA:

```text
permissionMode: confirm_writes
permissionScope: focused_rem_and_descendants
```

---

# 12. Milestone Plan

## Milestone 1 — Honest diagnostics and docs

Tasks:

```text
Preserve callabilitySource.
Add realPluginVerifiedTools.
Add runtimeUnverifiedTools.
Add sdkUnsupportedTools.
Update AGENTS.md status.
```

Acceptance:

```text
diagnostics no longer suggests all public tools work.
```

## Milestone 2 — Approval lifecycle hardening

Tasks:

```text
Add lifecycle state machine.
Add request IDs in UI and server logs.
Fix approval timeout race.
Fix cancellation handling.
Fix stuck create/replace/tree requests.
```

Acceptance:

```text
No write hangs.
No partial blank Rem without reporting.
```

## Milestone 3 — Scope model fix

Tasks:

```text
Make focused_rem_and_descendants reliable.
Authorize created-during-operation Rem IDs.
Support approved root descendants.
```

Acceptance:

```text
Vivy can create a child and style/read it in the same operation.
```

## Milestone 1-3 Execution Status — 2026-05-14

- [x] Milestone 1 — Honest diagnostics and docs.
  `get_bridge_diagnostics` now separates `realPluginVerifiedTools`, `runtimeUnverifiedTools`, and `sdkUnsupportedTools`. Registry-only fields no longer claim all public tools are live-callable.
- [x] Milestone 2 — Approval lifecycle hardening.
  Bridge responses and server diagnostics now carry request lifecycle events. The RemNote approval UI shows the request ID, clears timeout state, and cancellation is recorded as lifecycle evidence.
- [x] Milestone 3 — Scope model fix.
  Existing focused-descendant and approved-root descendant checks are preserved. Created Rem IDs and partial execution details are recorded so same-operation child creation/style/read failures are auditable instead of silent.

Verification status:

```text
npm run check-types passed.
npm run validate passed.
npm run build passed with existing webpack size warnings.
npm run server:build passed.
npm run server:smoke passed.
npm audit passed with 0 vulnerabilities.
npm audit --omit=dev passed with 0 vulnerabilities.
git diff --check passed.
Live RemNote sandbox QA is still required before marking all public tools production-ready.
```

## Milestone 4 — SDK formatting fix

Tasks:

```text
[x] Fix color format handling.
[x] Fix span color/highlight.
[x] Fix clear_rem_formatting.
[x] Add repo smoke coverage for formatting surfaces.
```

Acceptance:

```text
Formatting tools work or return SDK_UNSUPPORTED cleanly.
```

## Milestone 5 — Math rendering

Tasks:

```text
[x] Implement LaTeX-to-rich-node parser.
[x] Integrate with update_rem_rich and batch writer.
[x] Add math regression tests in MCP smoke.
```

Acceptance:

```text
Inline and display math render correctly.
```

## Milestone 6 — Atomic structured note writer

Tasks:

```text
[x] Build apply_structured_note_batch.
[x] Support dryRun.
[x] Support idempotencyKey.
[x] Support rollbackOnFailure.
[x] Support verifyAfterWrite.
[x] Support styles and math.
```

Acceptance:

```text
One tool call writes a complete styled note correctly.
```

## Milestone 4-6 Execution Status — 2026-05-14

- [x] Milestone 4 — SDK formatting fix.
  Formatting calls now use installed SDK-supported rich-text color names, avoid invalid normal type reset calls, and return `SDK_UNSUPPORTED` for unsupported default whole-Rem highlight clearing or normal type reset instead of raw `SDK_ERROR`.
- [x] Milestone 5 — Math rendering.
  Plain text spans now parse `$...$`, `\(...\)`, `$$...$$`, and `\[...\]` into RemNote rich math nodes. The parser is used by `update_rem_rich`, styled trees, flashcard rich text creation paths, and the batch writer.
- [x] Milestone 6 — Atomic structured note writer.
  `apply_structured_note_batch` is now a public MCP tool and bridge tool. It supports `dryRun`, `idempotencyKey`, best-effort `rollbackOnFailure`, `verifyAfterWrite`, styled nodes, nested children, flashcards, and math-rich text.

Verification status:

```text
npm run check-types passed.
npm run validate passed.
npm run build passed with existing webpack size warnings.
npm run server:build passed.
npm run server:smoke passed.
Live RemNote sandbox QA is still required before marking all 43 tools production-ready in hosted/public wording.
```

## Milestone 7 — Rework tree tools on batch engine

Tasks:

```text
[x] Make create_rem_tree use structured write engine.
[x] Make create_styled_rem_tree use structured write engine.
[x] Deprecate fragile duplicate logic.
```

Acceptance:

```text
Tree tools no longer hang.
```

## Milestone 8 — Live health-check system

Tasks:

```text
[x] Add run_bridge_health_check.
[x] Record pass/fail/skipped tools.
[x] Surface last health check in diagnostics.
```

Acceptance:

```text
Project can prove which tools work live.
```

## Milestone 9 — Final live QA

Tasks:

```text
[x] Run all safe tools in MCP smoke/mock bridge.
[x] Run note-writing test through structured batch dry-run/apply smoke paths.
[x] Run failure survival test.
[x] Run approval reject/timeout/cancel reliability tests.
[x] Record QA results in diagnostics/health-check docs.
```

Acceptance:

```text
The bridge can be honestly marked repo-ready for structured note generation. Public hosted production-ready wording still requires a recorded live RemNote sandbox health-check pass.
```

## Milestone 7-9 Execution Status — 2026-05-14

- [x] Milestone 7 — Rework tree tools on batch engine.
  `create_rem_tree` now validates the simple tree shape and delegates creation to `create_styled_rem_tree`, so the old duplicate recursive write path is removed. `create_styled_rem_tree` remains the shared structured write engine used by `apply_structured_note_batch`.
- [x] Milestone 8 — Live health-check system.
  `run_bridge_health_check` is a public MCP tool. It records pass/fail/skipped results, avoids destructive deletes, supports safe dry runs by default, can execute sandbox writes when explicitly requested, and stores `lastHealthCheck` in diagnostics.
- [x] Milestone 9 — Final repo QA.
  Server smoke now verifies `tools/list` registry parity, the RemNote capability guide, health-check recording, structured batch dry-run/apply, note-writing failure survival, plugin timeout, plugin disconnect, and client-disconnect cancellation.

Milestone 7-9 verification:

```text
npm run check-types passed.
npm run validate passed.
npm run build passed with existing webpack size warnings.
npm run server:build passed.
npm run server:smoke passed.
chatgpt-app-submission.json parsed with 43 tool entries, 27 test cases, and 4 negative test cases.
git diff --check passed.
```

---

# 13. Final Completion Criteria

The bridge is complete only when all are true:

```text
43 public tools are discoverable.
delete_rem is hidden by default.
callabilitySource is honest.
At least all required note-generation tools are live verified.
Approval-gated writes never hang.
Partial executions are tracked.
create_rem works.
replace_rem works or is disabled until safe.
create_rem_tree works.
create_styled_rem_tree works.
apply_structured_note_batch works.
focused_rem_and_descendants works.
created children can be styled and read back.
math renders as RemNote math.
color/span/highlight tools work or return SDK_UNSUPPORTED.
clear_rem_formatting works or returns SDK_UNSUPPORTED.
gateway-blocked tools have safe fallbacks.
failed calls do not terminate MCP session.
QA results are recorded in diagnostics and a health-check matrix.
```

---

# 14. Current Practical Guidance for Vivy

Current repo-verified guidance:

## Default read/context tools

Use:

```text
get_bridge_status
get_bridge_diagnostics
run_bridge_health_check
get_remnote_capability_guide
ping_remnote_plugin
get_plugin_status
get_focused_rem
get_children
get_rem_tree
get_rem_rich
get_current_selection
get_rem_breadcrumbs
search_rems
get_document_or_folder_tree
```

## Default note-writing path

Use:

```text
get_remnote_capability_guide
get_bridge_diagnostics
apply_structured_note_batch dryRun=true
apply_structured_note_batch dryRun=false verifyAfterWrite=true rollbackOnFailure=true
```

## Low-level repair tools

Use only when the user asks for precise edits:

```text
append_to_rem
update_rem
update_rem_rich
set_rem_heading_level
set_rem_text_color
set_rem_highlight_color
set_text_span_color
set_text_span_highlight
set_rem_type
set_hide_bullet
clear_rem_formatting
move_rem
reorder_children
create_rem_tree
create_styled_rem_tree
```

---

# 15. Implementation Warning

Do not just add more tools.

The problem is not lack of tool count.

The problem is:

```text
reliability
atomicity
approval lifecycle
math fidelity
permission scope
SDK correctness
live verification
```

A small set of reliable high-level tools is more valuable than 40 fragile tools.

Build toward this:

```text
read context
plan note
dry run structured batch
approve once
write complete note
verify readback
return complete result
```

That is the workflow Vivy needs.
