# AGENTS.md

## Purpose

This file gives AI coding agents strict instructions for working in this repository.

This repository is the **RemNote ChatGPT Bridge**.

The goal is **not** to build an AI chatbot inside RemNote.

The goal is to let ChatGPT / Vivy use RemNote through a safe, typed, permissioned, auditable bridge.

The RemNote plugin is the **RemNote SDK access layer**.

ChatGPT / Vivy is the **reasoning layer**.

The bridge must make RemNote usable for high-quality note generation, editing, reading, verification, formatting, flashcard creation, and structured writing without unsafe silent changes.

---

# 0. Current Product Truth

## 0.1 Current architecture

The intended local architecture is:

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

The intended hosted personal architecture is:

```text
ChatGPT / Vivy
↓
HTTPS MCP endpoint
↓
Hosted companion server on Render
↓
Secure WebSocket bridge
↓
Running RemNote plugin connected to hosted bridge
↓
RemNote SDK
↓
User's RemNote knowledge base
```

The plugin must not contain OpenAI logic.

The plugin must not call OpenAI.

The plugin must not store OpenAI API keys.

The plugin must not choose AI models.

The plugin must not scrape ChatGPT.

The plugin must not scrape the RemNote DOM.

The plugin must only expose controlled RemNote operations through the bridge.

---

## 0.2 Latest known working state

The latest known working state has:

```text
47 public MCP tools
3 hidden gated legacy delete tools:
  delete_rem
  delete_focused_rem
  delete_selected_rem

toolRegistryVersion:
  2026-05-15.2

mcpDiscoveryVersion:
  mcp-discovery-2026-05-15.2
```

The working tests showed that the bridge is now functionally strong.

The main tool categories work:

```text
status tools
read/navigation tools
create/write tools
formatting tools
font color tools
highlight tools
high-level structured note tools
flashcard tools
guarded delete dry-run
verification tools
diagnostics tools
```

The remaining real issues are:

```text
connection flicker / PLUGIN_NOT_CONNECTED during some calls
search_rems scope leakage outside focused/context root
delete_rem_by_id real delete needs final stable verification
clear_rem_formatting is partial because the installed SDK cannot fully reset all Rem-level state
create_folder remains SDK_UNSUPPORTED because the installed SDK does not expose folder creation
live RemNote sandbox health-check proof is still required
public hosted mode still needs OAuth, pairing, per-user sessions, and revocation
code needs modular cleanup after behavior is frozen
```

2026-05-17 final-polish phases 3, 4, and 5 are complete at repo and mock-runtime level:

```text
tool policy and simple/full profile exist
capability guide and tool descriptions prefer high-level note tools
plugin UI has calmer default/approval/diagnostics surfaces
single-port personal hosted server mode and render.yaml exist
```

Do not add random new tools.

Do not expand scope.

This final polish is about:

```text
stability
speed
UI clarity
safe hosting
code cleanup
proof through tests
documentation honesty
```

---

# 1. Non-Negotiable Rules

## 1.1 Product rules

Do not build an AI chatbot inside RemNote.

Do not add direct OpenAI API calls.

Do not add OpenAI API key settings.

Do not let the plugin choose models.

Do not scrape ChatGPT.

Do not scrape RemNote DOM.

Do not expose unsafe delete tools by default.

Do not silently delete user notes.

Do not silently rewrite user notes.

Do not fake unsupported RemNote SDK behavior.

Do not claim success if the RemNote SDK operation failed.

Do not report registry/tool-list success as live runtime success.

Do not let failed write calls terminate the MCP session.

Do not create partial blank Rems without returning partial execution details.

Do not rely on many sequential writes for one high-quality note when a single atomic write is possible.

Do not break existing working tools.

---

## 1.2 Safety rules

All mutation tools must be scoped by the plugin, not only by the companion server.

The companion server cannot widen plugin scope.

Destructive tools must require explicit approval.

Legacy delete tools must remain hidden/private by default:

```text
delete_rem
delete_focused_rem
delete_selected_rem
```

The only public delete tool must be:

```text
delete_rem_by_id
```

`delete_rem_by_id` must default to:

```text
dryRun: true
```

Real delete requires:

```text
dryRun: false
at least one matching guard:
  expectedParentId
  expectedAncestorId

optional confirmTitle must match target plain text
delete must verify the target cannot be read afterward
```

If delete status is uncertain because of disconnect, timeout, or client abort, do not claim deletion success.

Return a retryable/unknown status with lifecycle evidence.

---

## 1.3 Formatting rules

Font color and highlight are different.

Do not mix them.

The current proven model is:

```text
Font color:
  raw rich-text field tc

Selected text highlight:
  raw rich-text field h

Whole-Rem highlight:
  remStyle.highlightColor / Rem-level highlight
```

Supported text/highlight colors are:

```text
Red
Orange
Yellow
Green
Blue
Purple
```

Unsupported colors should return structured errors, not raw SDK errors:

```text
Gray
Brown
Pink
```

`create_folder` must return:

```text
SDK_UNSUPPORTED
```

Do not fake folder creation by creating normal Rems and calling them folders.

`clear_rem_formatting` may be partial.

It must clearly report what was cleared and what could not be cleared.

---

# 2. Preferred Tool Workflow for ChatGPT / Vivy

## 2.1 Default tool choices

For full note creation, use:

```text
create_polished_note_tree
```

or:

```text
apply_structured_note_batch
```

For existing-note styling, use:

```text
apply_style_plan
```

For checking styled notes, use:

```text
verify_note_design
```

For formatting debugging, use only when necessary:

```text
debug_get_raw_rich_text
```

For deletion, use only:

```text
delete_rem_by_id
```

Do not make full notes through many small calls like:

```text
create_rem
append_to_rem
update_rem
set_rem_heading_level
set_text_span_color
move_rem
reorder_children
```

unless repairing a specific existing note.

---

## 2.2 Tool policy categories

Add or maintain a tool-policy layer.

Suggested file:

```text
server/src/tool-policy.ts
```

Each tool should be classified as one of:

```ts
type ToolPolicy =
  | "preferred"
  | "fallback"
  | "debug"
  | "legacy_hidden"
  | "dangerous"
  | "unsupported";
```

Suggested classification:

```text
preferred:
  create_polished_note_tree
  apply_structured_note_batch
  apply_style_plan
  verify_note_design
  delete_rem_by_id

fallback:
  create_rem
  create_document
  append_to_rem
  update_rem
  move_rem
  reorder_children
  create_rem_tree
  create_styled_rem_tree
  update_rem_rich
  set_rem_heading_level
  set_rem_text_color
  set_rem_highlight_color
  set_text_span_color
  set_text_span_highlight
  set_rem_type
  set_hide_bullet
  clear_rem_formatting
  apply_remnote_command

debug:
  get_bridge_status
  get_bridge_diagnostics
  run_bridge_health_check
  get_remnote_capability_guide
  debug_get_raw_rich_text
  ping_remnote_plugin
  get_plugin_status
  get_current_selection
  get_rem_rich

read:
  get_focused_rem
  get_rem
  get_rem_tree
  get_children
  get_rem_breadcrumbs
  search_rems
  get_document_or_folder_tree

cards:
  create_basic_flashcard
  create_concept_card
  create_descriptor_card
  create_cloze_card
  create_multiple_choice_card
  create_list_answer_card

unsupported:
  create_folder

dangerous:
  replace_rem

legacy_hidden:
  delete_rem
  delete_focused_rem
  delete_selected_rem
```

---

## 2.3 Tool profiles

Implement tool profiles to reduce AI confusion.

Environment variable:

```bash
REMNOTE_BRIDGE_TOOL_PROFILE=simple
REMNOTE_BRIDGE_TOOL_PROFILE=full
```

Default should be:

```text
simple
```

unless this would break current ChatGPT setup.

### Simple profile

Expose only the tools needed for normal use:

```text
get_bridge_status
get_bridge_diagnostics
run_bridge_health_check
get_focused_rem
get_rem
get_rem_tree
get_children
get_rem_breadcrumbs
search_rems
create_polished_note_tree
apply_structured_note_batch
apply_style_plan
verify_note_design
delete_rem_by_id
create_basic_flashcard
create_concept_card
create_descriptor_card
create_cloze_card
create_multiple_choice_card
create_list_answer_card
```

### Full profile

Expose all 47 public tools for development, debugging, and regression testing.

The full profile must keep hidden legacy delete tools hidden by default.

Implementation status 2026-05-17:

```text
full remains the default profile to preserve current connector expectations
set REMNOTE_BRIDGE_TOOL_PROFILE=simple for normal reduced-tool operation
```

---

# 3. Seven-Phase Final Polish Plan

Complete these phases one at a time.

Do not mix phases.

Do not refactor while fixing runtime bugs unless the phase explicitly asks for refactor.

After each phase, run the listed validation commands.

---

# Phase 1 — Freeze and Protect the Working State

## Goal

Preserve the current working bridge behavior before polishing.

## Tasks

1. Create a final-polish branch.

```bash
git checkout main
git pull
git checkout -b release/final-polish
git tag pre-final-polish-working-tools
```

2. Record current tool count and registry version.

3. Confirm the current 47 public tools are still discoverable.

4. Confirm hidden delete tools remain hidden.

5. Run baseline validation.

```bash
npm run check-types
npm run validate
npm run build
npm run server:build
npm run server:smoke
npm run bridge:live-test
git diff --check
```

6. Save baseline output in a local note or release log.

Suggested file:

```text
docs/final-polish-baseline.md
```

## Acceptance criteria

The phase is complete only when:

```text
branch exists
baseline tag exists
tool count is recorded
hidden delete tools are confirmed hidden
server smoke test passes
live test result is recorded or clearly marked as skipped/unavailable
no behavior change has been made yet
```

---

# Phase 2 — Fix Remaining Runtime Bugs

## Goal

Fix only the remaining real issues from live testing.

Do not add features.

Do not redesign UI.

Do not refactor code for beauty yet.

---

## 2.1 Stabilize connection and retry behavior

The observed failure was:

```text
PLUGIN_NOT_CONNECTED
```

This usually means the tool works, but the plugin connection flickered.

### Required behavior

Add retry behavior by tool type:

| Tool type | Retry behavior |
|---|---|
| Read tools | Retry once after reconnect |
| Safe idempotent writes | Retry only when `idempotencyKey` exists |
| Non-idempotent writes | Do not auto-retry |
| Destructive tools | Do not auto-retry |
| Delete tools | Do not auto-retry real delete; require fresh dry-run preview |
| Unknown write status | Return `RETRYABLE_UNKNOWN_WRITE_STATUS` with lifecycle evidence |
| Unknown delete status | Return `RETRYABLE_UNKNOWN_DELETE_STATUS` with lifecycle evidence |

### Required diagnostics

Every retryable failure should include:

```ts
{
  retryable: true,
  errorCode: "PLUGIN_NOT_CONNECTED" | "TIMEOUT" | "CLIENT_DISCONNECTED" | "RETRYABLE_UNKNOWN_WRITE_STATUS" | "RETRYABLE_UNKNOWN_DELETE_STATUS",
  requestId: string,
  tool: string,
  lifecycle: BridgeLifecycleEvent[],
  recommendation: string
}
```

### Acceptance test

Simulate disconnect during:

```text
get_rem
apply_structured_note_batch
delete_rem_by_id
```

Expected:

```text
get_rem retries once safely
apply_structured_note_batch resolves through idempotency or returns retryable unknown write status
delete_rem_by_id never silently retries real delete
pendingRequests returns to 0
recentRequests records terminal outcome
```

---

## 2.2 Fix search_rems scope leakage

`search_rems` currently works, but it can return results outside the focused/context scope.

### Required behavior

After RemNote search returns results, apply post-filtering by ancestor chain.

For every result:

```text
read result breadcrumbs / ancestor chain
keep result only if contextRemId or focused root appears in ancestors
```

Add metadata:

```ts
{
  scopeRequested: string,
  scopeEnforcement: "post_filter_ancestor_chain",
  rawResultCount: number,
  filteredResultCount: number,
  filteredOutCount: number
}
```

### Acceptance test

Create this structure:

```text
Plugin Test
  Final Polish Sandbox
    Alpha scoped result

Outside Plugin Test
  Alpha outside result
```

Call:

```json
{
  "query": "Alpha",
  "contextRemId": "Plugin Test ID",
  "scope": "focused_rem_and_descendants"
}
```

Expected:

```text
Only Alpha scoped result is returned.
Alpha outside result is filtered out.
Result metadata reports raw count and filtered count.
```

---

## 2.3 Finish delete_rem_by_id real delete verification

Dry run already works.

Real delete must be fully verified.

### Required behavior

For real delete:

```text
dryRun must be false
expectedParentId or expectedAncestorId must match
confirmTitle must match if provided
delete executes
tool reads target again
if target cannot be read, return verifiedDeleted: true
diagnostics record deletedRemId
```

If disconnect happens during delete:

```text
do not claim success
return RETRYABLE_UNKNOWN_DELETE_STATUS
include dry-run preview if available
include lifecycle evidence
tell caller to re-check the target ID
```

### Acceptance test

```text
create disposable child under sandbox
delete_rem_by_id dryRun=true
delete_rem_by_id dryRun=false expectedParentId=sandboxId
get_rem childId should fail cleanly
get_bridge_diagnostics should include deletedRemId
```

---

## 2.4 Keep clear_rem_formatting honest

Do not fake full reset.

The installed SDK cannot reliably reset all Rem-level formatting.

### Required output shape

```ts
{
  ok: false,
  status: "formatting_partially_cleared",
  cleared: {
    textFormatting: boolean,
    heading: boolean,
    hideBullet: boolean,
    wholeRemHighlight: boolean,
    remType: boolean
  },
  unsupported: {
    wholeRemHighlightReset?: boolean,
    remTypeReset?: boolean
  },
  warnings: string[]
}
```

### Acceptance test

Run on a styled concept/descriptor Rem.

It must never report complete success unless every requested format was actually cleared.

---

## Phase 2 validation

Run:

```bash
npm run check-types
npm run server:smoke
npm run bridge:live-test
git diff --check
```

Phase 2 is complete only when:

```text
connection flicker returns clean retryable states
search_rems respects scoped ancestor filtering
delete_rem_by_id real delete verifies deletion
clear_rem_formatting reports partial state honestly
no working formatting/card/note tools broke
```

---

# Phase 3 — Make ChatGPT Faster and Less Tool-Confused

## Goal

Reduce AI hesitation, excessive tool calls, and long multi-step workflows.

The bridge has 47 tools, but normal note work should use only a small number of preferred tools.

---

## 3.1 Add tool policy metadata

Add:

```text
server/src/tool-policy.ts
```

Export:

```ts
export type ToolPolicy =
  | "preferred"
  | "fallback"
  | "debug"
  | "read"
  | "cards"
  | "legacy_hidden"
  | "dangerous"
  | "unsupported";

export interface ToolPolicyEntry {
  name: string;
  policy: ToolPolicy;
  preferredFor?: string[];
  avoidWhen?: string[];
  replacement?: string;
}
```

Update diagnostics so it can show:

```text
preferredTools
fallbackTools
debugTools
unsupportedTools
dangerousTools
hiddenLegacyTools
```

---

## 3.2 Add simple/full tool profile

Add environment variable:

```bash
REMNOTE_BRIDGE_TOOL_PROFILE=simple
REMNOTE_BRIDGE_TOOL_PROFILE=full
```

Default target:

```text
simple for normal use
full for development
```

If defaulting to simple would break current connector expectations, keep full as default temporarily and document how to switch to simple.

---

## 3.3 Update capability guide

Update `get_remnote_capability_guide`.

It must tell ChatGPT:

```text
For full note creation:
  use create_polished_note_tree first.

For atomic structured writing:
  use apply_structured_note_batch.

For styling existing Rems:
  use apply_style_plan.

For checking style/design:
  use verify_note_design.

For deletion:
  use delete_rem_by_id only.

For formatting debugging:
  use debug_get_raw_rich_text only when checking raw tc/h fields.

Do not use many low-level create/update/style tools for full note generation.
```

---

## 3.4 Tighten tool descriptions

Update MCP tool descriptions so ChatGPT naturally prefers high-level tools.

Examples:

```text
create_polished_note_tree:
  Preferred tool for creating complete polished RemNote notes, lessons, outlines, and study trees in one operation.

apply_structured_note_batch:
  Preferred atomic batch writer for structured note creation with dry-run, idempotency, verification, and rollback evidence.

apply_style_plan:
  Preferred tool for applying multiple formatting operations to existing Rems.

verify_note_design:
  Preferred verification tool after styled/batch writes.

debug_get_raw_rich_text:
  Debug-only tool for validating RemNote raw rich-text fields such as tc and h.
```

---

## Phase 3 validation

Run:

```bash
npm run check-types
npm run server:smoke
```

Manual ChatGPT test:

```text
Ask ChatGPT to create a polished note.
It should choose create_polished_note_tree or apply_structured_note_batch.
It should not call many low-level tools unless repairing an existing note.
```

Phase 3 is complete only when:

```text
tool policy exists
simple/full profile exists
capability guide prefers high-level tools
tool descriptions reduce tool confusion
ChatGPT uses one-call structured writing in normal note tasks
```

Completion status 2026-05-17:

```text
complete at repo and mock-runtime level
validated by npm run check-types, npm run server:build, npm run server:smoke
```

---

# Phase 4 — Polish the RemNote Plugin UI

## Goal

Make the plugin feel calm, useful, and user-friendly.

The current UI is too much like an engineering/debug cockpit.

---

## 4.1 Split UI into three levels

### Level 1 — Default user view

Show only:

```text
Connected / Reconnecting / Offline
Current access mode
Focused Rem
Recommended Note Mode button
Pending approval if any
Last successful action
Last failed action if any
```

Do not show registry/debug details in default view.

---

### Level 2 — Approval view

Show only when a request is pending:

```text
Tool
Plain-English summary
Target Rem
Risk level
Scope
Preview
Approve / Reject
```

For destructive actions, require typed confirmation:

```text
DELETE
```

Approval controls must remain fixed at the bottom.

Long previews must scroll.

---

### Level 3 — Advanced diagnostics

Hide behind:

```text
Advanced Diagnostics
```

Advanced diagnostics may show:

```text
tool count
registry version
callability source
runtime unverified tools
SDK unsupported tools
hidden tools
last health check
recent lifecycle logs
copy diagnostics
copy failed request
debug raw rich text notes
```

---

## 4.2 Improve connection state messages

Show clear status:

```text
Connected
Reconnecting...
Offline
Token mismatch
Server unreachable
Plugin disconnected
```

Show one-line next action:

```text
Start companion server.
Check Bridge Token.
Reconnect plugin.
Run Health Check.
Refresh ChatGPT connector tools.
```

---

## 4.3 Add Final Health Check button

Add button:

```text
Run Final Health Check
```

It should run:

```text
read_only health check
safe_write health check
mutation_on_disposable_rem formatting check
```

Display summary:

```text
Passed
Failed
Unsupported
Skipped
```

Raw JSON should be available only through Advanced Diagnostics.

---

## 4.4 Split widget code

Refactor:

```text
src/widgets/bridge-status.tsx
```

into:

```text
src/widgets/BridgeStatusWidget.tsx
src/widgets/components/StatusHeader.tsx
src/widgets/components/RecommendedModeCard.tsx
src/widgets/components/AccessPanel.tsx
src/widgets/components/ApprovalPanel.tsx
src/widgets/components/DiagnosticsPanel.tsx
src/widgets/components/HealthCheckPanel.tsx
src/widgets/hooks/useBridgeConnection.ts
src/widgets/hooks/useApprovalFlow.ts
src/widgets/hooks/useBridgeDiagnostics.ts
```

Do not change backend behavior during the UI split.

---

## Phase 4 validation

Run:

```bash
npm run check-types
npm run validate
npm run build
git diff --check
```

Manual UI checks:

```text
default view is simple
approval preview scrolls
approval footer stays fixed
recommended note mode is obvious
advanced diagnostics are hidden by default
connection failure gives clear next action
```

Phase 4 is complete only when:

```text
UI is cleaner
approval flow is easier
diagnostics are hidden by default
no bridge behavior is broken
```

Completion status 2026-05-17:

```text
complete at repo validation level
validated by npm run check-types, npm run validate, npm run build
manual RemNote-host visual inspection still required
```

---

# Phase 5 — Make Personal Hosted Render Mode Possible

## Goal

Make the bridge able to run on Render for personal hosted use.

Do not claim public multi-user production readiness yet.

Personal hosted mode is:

```text
one user
one hosted server
one static bridge token
RemNote plugin connects to hosted WSS bridge
ChatGPT connects to hosted HTTPS MCP endpoint
```

Public hosted mode is later and requires OAuth/pairing/session management.

---

## 5.1 Why current local server is not enough

Current local server uses:

```text
WebSocket bridge:
  ws://127.0.0.1:47391/remnote-bridge

MCP endpoint:
  http://127.0.0.1:47392/mcp
```

Render needs a public web service that binds to:

```text
0.0.0.0
process.env.PORT
```

The hosted server should expose HTTP and WebSocket routes through one public service.

Target hosted routes:

```text
GET  /health
GET  /diagnostics
POST /mcp
GET  /mcp
DELETE /mcp
WS   /remnote-bridge
```

Hosted URLs should look like:

```text
https://your-service.onrender.com/health
https://your-service.onrender.com/diagnostics
https://your-service.onrender.com/mcp
wss://your-service.onrender.com/remnote-bridge
```

---

## 5.2 Refactor companion server to single-port mode

Create or modify:

```text
server/src/app.ts
server/src/index.ts
server/src/hosted-app.ts
```

The app must support two modes:

```text
local mode:
  can keep existing localhost behavior if needed

single-port mode:
  MCP and WebSocket share one HTTP server
```

Add config:

```ts
interface CompanionServerConfig {
  bindHost: string;
  port: number;
  singlePort: boolean;
  bridgePath: string;
  mcpPath: string;
}
```

Environment variables:

```bash
REMNOTE_BRIDGE_SINGLE_PORT=1
REMNOTE_BRIDGE_HOST=0.0.0.0
PORT=10000
REMNOTE_BRIDGE_WS_PATH=/remnote-bridge
REMNOTE_BRIDGE_MCP_PATH=/mcp
```

In hosted mode:

```ts
const port = Number(process.env.PORT || 10000);
server.listen(port, "0.0.0.0");
```

---

## 5.3 Add Render deployment files

Add:

```text
render.yaml
```

Suggested personal hosted configuration:

```yaml
services:
  - type: web
    name: remnote-chatgpt-bridge
    runtime: node
    rootDir: server
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: REMNOTE_BRIDGE_SINGLE_PORT
        value: "1"
      - key: REMNOTE_BRIDGE_HOST
        value: "0.0.0.0"
      - key: REMNOTE_BRIDGE_TOKEN
        sync: false
      - key: REMNOTE_BRIDGE_ALLOW_REMOTE
        value: "1"
      - key: REMNOTE_BRIDGE_ALLOW_CORS
        value: "1"
      - key: REMNOTE_BRIDGE_ALLOWED_ORIGINS
        value: "https://chatgpt.com,https://chat.openai.com"
      - key: REMNOTE_BRIDGE_TOOL_PROFILE
        value: "simple"
```

If the repo root is required instead of `server`, use:

```yaml
services:
  - type: web
    name: remnote-chatgpt-bridge
    runtime: node
    buildCommand: npm install && npm run server:install && npm run server:build
    startCommand: npm run server:start
```

Add script if missing:

```json
{
  "scripts": {
    "server:start": "npm start --prefix server"
  }
}
```

---

## 5.4 Plugin settings for hosted mode

The plugin UI must support:

```text
Bridge Server URL:
  wss://your-service.onrender.com/remnote-bridge

Bridge Token:
  same token configured in Render

MCP endpoint for ChatGPT:
  https://your-service.onrender.com/mcp
```

Do not store the MCP endpoint inside RemNote unless useful.

The RemNote plugin needs the WebSocket URL.

ChatGPT needs the MCP URL.

---

## 5.5 Hosted mode security boundaries

For personal hosted mode, static token is acceptable.

For public hosted mode, static token is not enough.

Public hosted mode requires:

```text
OAuth or account login
device pairing
per-user bridge token
persistent session store
session revocation UI
multi-user routing
privacy policy
support contact
rate limiting
audit controls
```

Do not remove the hosted-mode safety warning until those are implemented.

Do not submit as public ChatGPT app until hosted public mode exists.

---

## Phase 5 validation

Local:

```bash
npm run check-types
npm run server:build
npm run server:smoke
```

Single-port local test:

```bash
export REMNOTE_BRIDGE_SINGLE_PORT=1
export REMNOTE_BRIDGE_HOST=0.0.0.0
export PORT=10000
export REMNOTE_BRIDGE_TOKEN="$(openssl rand -hex 32)"
npm run server:start
```

Check:

```text
http://localhost:10000/health
http://localhost:10000/diagnostics
http://localhost:10000/mcp
ws://localhost:10000/remnote-bridge
```

Render test:

```text
deploy service
open /health
connect RemNote plugin using wss URL
connect ChatGPT using https /mcp URL
run get_bridge_status
run run_bridge_health_check read_only
```

Phase 5 is complete only when:

```text
single-port server works locally
render.yaml exists
Render deployment starts
RemNote plugin connects to hosted WSS bridge
ChatGPT can reach hosted HTTPS MCP endpoint
personal hosted mode works with token
public hosted mode remains clearly marked not ready
```

Completion status 2026-05-17:

```text
complete for personal hosted readiness at repo and mock-runtime level
single-port local mode is covered by server:smoke
render.yaml exists
actual Render deployment was not run in this local coding pass
```

---

# Phase 6 — Clean Code Bloat Safely

## Goal

Make the code easier to maintain without changing behavior.

No feature work in this phase.

No behavioral rewrites unless tests expose a bug.

---

## 6.1 Split server tools

Current `mcp-server.ts` is too large.

Split into:

```text
server/src/tools/schemas.ts
server/src/tools/register-status-tools.ts
server/src/tools/register-read-tools.ts
server/src/tools/register-write-tools.ts
server/src/tools/register-formatting-tools.ts
server/src/tools/register-card-tools.ts
server/src/tools/register-delete-tools.ts
server/src/tools/register-diagnostic-tools.ts
server/src/tools/tool-context.ts
```

Each register file should export one function:

```ts
export function registerReadTools(context: ToolRegistrationContext): void
export function registerWriteTools(context: ToolRegistrationContext): void
export function registerFormattingTools(context: ToolRegistrationContext): void
```

Shared context should include:

```ts
interface ToolRegistrationContext {
  server: McpServer;
  hub: BridgeHub;
  registerTool: RegisterToolFunction;
  callPlugin: CallPluginFunction;
  bridgeToolResult: BridgeToolResultFunction;
  annotationsFor: AnnotationsFunction;
}
```

---

## 6.2 Split RemNote write logic

Current `src/remnote/write.ts` is too large.

Split into:

```text
src/remnote/write/basicWrites.ts
src/remnote/write/treeWrites.ts
src/remnote/write/structuredBatch.ts
src/remnote/write/formattingWrites.ts
src/remnote/write/cardWrites.ts
src/remnote/write/deleteWrites.ts
src/remnote/write/writeTypes.ts
src/remnote/write/index.ts
```

No behavior change.

Only move code.

---

## 6.3 Split protocol types if needed

If `src/bridge/protocol.ts` is too large, split into:

```text
src/bridge/protocol/base.ts
src/bridge/protocol/tools.ts
src/bridge/protocol/permissions.ts
src/bridge/protocol/lifecycle.ts
src/bridge/protocol/errors.ts
src/bridge/protocol/index.ts
```

Make sure existing imports still work.

---

## 6.4 Split widget code

If not already done in Phase 4, split:

```text
src/widgets/bridge-status.tsx
```

into components and hooks.

---

## Refactor rule

After every meaningful file split, run:

```bash
npm run check-types
npm run server:smoke
```

If a split breaks behavior, revert the split and make a smaller move.

Do not combine refactor with logic changes.

---

## Phase 6 validation

Run full validation:

```bash
npm run check-types
npm run validate
npm run build
npm run server:build
npm run server:smoke
npm run bridge:live-test
git diff --check
```

Phase 6 is complete only when:

```text
large files are split
behavior is unchanged
all tests still pass
public tool list is unchanged for the selected profile
simple/full profiles still work
no hidden delete tools leak into public registry
```

Completion status 2026-05-17:

```text
complete at repo and mock-runtime level
server/src/mcp-server.ts split into server/src/tools modules
src/remnote/write.ts split into category entrypoints under src/remnote/write/
public tool order preserved by server:smoke
simple/full profiles preserved by server:smoke
hidden legacy delete tools remain hidden by default
protocol.ts intentionally kept as the single shared contract for now
```

---

# Phase 7 — Final QA, Docs, and Release Readiness

## Goal

Prove the bridge is stable, honest, and ready for personal use.

Do not claim public hosted production readiness unless OAuth/pairing/session work is complete.

---

## 7.1 Required automated checks

Run:

```bash
npm run check-types
npm run validate
npm run build
npm run server:build
npm run server:smoke
npm run bridge:live-test
npm audit
npm audit --omit=dev
git diff --check
```

If any command does not exist, add it or document why it is unavailable.

---

## 7.2 Required live RemNote checks

Create one disposable sandbox:

```text
Plugin Test / Final Polish Sandbox
```

Run:

```text
run_bridge_health_check mode=read_only
run_bridge_health_check mode=safe_write
run_bridge_health_check mode=mutation_on_disposable_rem
```

Manual live tests:

```text
get_bridge_status
get_bridge_diagnostics
get_focused_rem
get_rem_tree
search_rems scoped to sandbox
create_polished_note_tree
apply_structured_note_batch
apply_style_plan
verify_note_design
debug_get_raw_rich_text on colored/highlighted Rem
delete_rem_by_id dryRun
delete_rem_by_id real delete on disposable child
create_folder returns SDK_UNSUPPORTED
clear_rem_formatting returns honest partial result where appropriate
```

---

## 7.3 Required ChatGPT checks

In ChatGPT:

```text
refresh connector/app tools
verify simple/full tool profile behavior
create a styled note in one call
create flashcards in one call
edit an existing note with apply_style_plan
verify note design with verify_note_design
delete a disposable child with delete_rem_by_id
ask for diagnostics after a failure
```

Expected ChatGPT behavior:

```text
uses high-level tools by default
does not call many low-level tools for complete note generation
does not use debug_get_raw_rich_text unless debugging formatting
does not use create_folder as if real folders are supported
does not expose or call hidden legacy delete tools
```

---

## 7.4 Required Render checks

For personal hosted mode:

```text
Render service deploys
/health works
/diagnostics works with token
/mcp responds
/remnote-bridge accepts plugin WebSocket
RemNote plugin connects to wss URL
ChatGPT connects to https MCP URL
get_bridge_status works
read_only health check works
safe_write health check works inside disposable sandbox
```

Document the exact URLs:

```text
MCP URL:
  https://your-service.onrender.com/mcp

Plugin WebSocket URL:
  wss://your-service.onrender.com/remnote-bridge
```

Do not put secrets in docs.

---

## 7.5 Documentation updates

Update:

```text
README.md
NEXT_STEPS.md
SAFETY.md
ARCHITECTURE.md
chatgpt-app-submission.json
```

README must include:

```text
current status
local quick start
personal hosted quick start
tool profiles
recommended ChatGPT workflow
known limitations
troubleshooting connection flicker
troubleshooting stale tool list
Render setup
public hosted mode warning
```

Known limitations must include:

```text
create_folder is SDK_UNSUPPORTED
clear_rem_formatting may be partial
public hosted mode requires OAuth/pairing/session store
legacy delete tools are hidden
debug_get_raw_rich_text is for debugging only
```

---

## 7.6 Final definition of done

The project is polished when all are true:

```text
1. All automated tests pass.
2. Live RemNote health checks pass.
3. search_rems respects scope.
4. delete_rem_by_id real delete verifies deletion.
5. connection flicker produces retryable/clean errors, not confusion.
6. UI default view is simple.
7. diagnostics are hidden under Advanced.
8. ChatGPT prefers high-level tools.
9. simple/full tool profiles exist.
10. single-port hosted server exists.
11. Render personal deployment works.
12. docs clearly separate local, personal hosted, and public hosted modes.
13. create_folder remains SDK_UNSUPPORTED, not faked.
14. clear_rem_formatting reports partial success honestly.
15. hidden legacy delete tools remain hidden by default.
16. no OpenAI API key or AI runtime path exists inside the plugin.
17. release notes are honest about what is live-proven vs source/smoke-proven.
```

Completion status 2026-05-17:

```text
local automated QA complete
docs updated
chatgpt-app-submission.json updated for the current readiness posture

npm run check-types: passed
npm run validate: passed
npm run build: passed with existing webpack asset-size warnings
npm run server:build: passed
npm run server:smoke: passed
npm audit: passed, 0 vulnerabilities
npm audit --omit=dev: passed, 0 vulnerabilities
git diff --check: passed

npm run bridge:live-test: reached local MCP after starting the companion server, passed tools/list/get_bridge_status/get_bridge_diagnostics, then failed plugin tools with PLUGIN_NOT_CONNECTED because no real RemNote plugin session was connected.
```

Still required before public production-ready wording:

```text
real RemNote sandbox health checks
ChatGPT Developer Mode connector refresh and golden prompts
actual Render deploy and hosted WSS/MCP proof
public-hosted OAuth/pairing/session/revocation work
```

---

# 4. Validation Command Reference

Use these commands throughout the project:

```bash
npm run check-types
npm run validate
npm run build
npm run server:build
npm run server:smoke
npm run bridge:live-test
npm audit
npm audit --omit=dev
git diff --check
```

Additional MCP checks:

```bash
npm run server:test-client -- tools/list
```

Single-port hosted local test:

```bash
export REMNOTE_BRIDGE_SINGLE_PORT=1
export REMNOTE_BRIDGE_HOST=0.0.0.0
export PORT=10000
export REMNOTE_BRIDGE_TOKEN="$(openssl rand -hex 32)"
npm run server:start
```

---

# 5. Status Wording Rules

Use honest status language.

Correct wording:

```text
The bridge is functionally strong and most live tool tests pass. Final polish is focused on connection stability, scoped search correctness, delete verification, UI simplification, AI tool-policy speedups, Render personal hosting, and code cleanup.
```

Correct wording after Phase 7 passes:

```text
The bridge is ready for personal local/hosted use with a token-protected MCP endpoint and RemNote plugin connection. Public multi-user hosted mode still requires OAuth/pairing/session management before public submission.
```

Incorrect wording:

```text
All tools are production ready for everyone.
Public hosted mode is done.
OAuth is done.
Folders are supported.
All SDK reset operations are supported.
Delete is safe without dry-run and guards.
```

---

# 6. Final Agent Execution Order

Follow this order exactly:

```text
Phase 1:
  Freeze and protect working state.

Phase 2:
  Fix runtime bugs:
    connection retry behavior
    search_rems scoped filtering
    delete_rem_by_id real verification
    clear_rem_formatting honest partial output

Phase 3:
  Make ChatGPT faster:
    tool policy
    simple/full profiles
    capability guide preferences
    better tool descriptions

Phase 4:
  Polish UI:
    simple default view
    focused approval view
    advanced diagnostics
    final health check button

Phase 5:
  Render personal hosting:
    single-port server
    hosted WSS bridge
    hosted HTTPS MCP
    render.yaml
    personal token mode

Phase 6:
  Clean code bloat:
    split server tools
    split widget
    split RemNote write logic
    preserve behavior

Phase 7:
  Final QA and docs:
    automated checks
    live RemNote checks
    ChatGPT checks
    Render checks
    docs update
    honest release wording
```

Do not skip phases.

Do not merge phases.

Do not add new features outside these phases.

When uncertain, preserve the current working behavior and document the limitation.

---

# 7. Final Notes for Coding Agents

The bridge already works.

The final mission is not more tools.

The final mission is:

```text
stable connection
strict scoped search
verified guarded delete
fast high-level AI workflow
calm UI
Render personal hosting
clean modules
honest documentation
```

Protect the user’s RemNote data first.

Protect working tools second.

Polish third.

Ship only after proof.
