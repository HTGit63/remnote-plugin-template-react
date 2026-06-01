# AGENTS.md — RemNote MCP Bridge Reliability, Tooling, Tiering, and Productization Plan

## Project

Repository: `HTGit63/remnote-plugin-template-react`

Current goal: turn the RemNote ↔ Render ↔ ChatGPT MCP bridge into a reliable hosted plugin app that normal users can connect, configure, and use without manual bearer-token setup.

Current status: the hosted bridge is now able to connect RemNote, Render, and ChatGPT. The next phase is **productization**:

```text
reliable tools
clear tool tiers
better schemas
safe complex operations
fast batch workflows
hosted diagnostics
runtime verification
clean user experience
release hardening
```

This AGENTS.md is intentionally specific. Do not treat it as a loose suggestion list. Work through it in phases and report clearly what was completed, skipped, or deferred.

---

# 0. Non-Negotiable Requirements

## 0.1 Keep the hosted architecture

Target user flow:

```text
RemNote Plugin → Render Companion Server → ChatGPT MCP Connector
```

Hosted mode must use ChatGPT OAuth/pairing/session authentication. Do **not** require ChatGPT users to manually paste or configure `REMNOTE_BRIDGE_TOKEN`.

`REMNOTE_BRIDGE_TOKEN` may remain for local developer mode only.

## 0.2 Do not remove useful complex tools

Some tools have complex schemas, but they are valuable because they can perform large structured note operations in one pass. Do **not** remove them just because ChatGPT Developer Mode labels them as unclear. Improve them.

The important complex tools are:

```text
verify_note_design
apply_style_plan
apply_remnote_command
create_polished_note_tree
apply_structured_note_batch
create_styled_rem_tree
reorder_children
move_rem
replace_rem
update_rem
```

These tools are essential for complicated workflows. Improve schema clarity, safety, verification, and speed without reducing capability.

## 0.3 Delete legacy destructive tools completely

Remove these tools from the codebase entirely. Do not merely hide them.

```text
delete_focused_rem
delete_selected_rem
delete_rem
```

`delete_rem_by_id` is enough and must remain the only delete path.

Delete these names from:

```text
server/src/tools/register-delete-tools.ts
server/src/tool-registry.ts
server/src/tool-policy.ts
server/src/health-check.ts
server/src/mcp-tool-map.ts
server/src/remnote-capability-guide.ts
src/bridge/protocol.ts
src/bridge/handlers.ts
src/bridge/client.ts
plugin-side handlers
tests
docs
diagnostic output
capability guide
sample payloads
```

Do not leave them as:

```text
hidden
legacy
private
local-dev only
gated
deprecated
dangerous
```

They must be gone.

## 0.4 Keep every other useful tool

Keep all other tools unless they are truly unsupported by the installed RemNote SDK.

If a tool is unsupported, do not expose it as a normal callable tool. Mark it clearly as unsupported in diagnostics and docs.

## 0.5 Tool tiers must be easy to change from the RemNote plugin

Users must be able to change tool tier/profile directly inside the RemNote plugin UI.

This must work:

```text
before bridge connection
after bridge connection
before ChatGPT pairing
after ChatGPT pairing
```

When tier changes, the server, plugin, and ChatGPT connector state must be handled clearly. If ChatGPT needs reconnection to reload the schema, the plugin must say so.

---

# 1. Current Codebase Gaps To Address

These are known gaps from code review and runtime testing.

## 1.1 Current tier/profile system is too limited

Current code only supports:

```text
simple
full
```

That is not enough for a public app. Replace or extend it with real tiers:

```text
core
advanced_notes
developer_diagnostics
full
```

Expected behavior:

```text
core = safe ordinary user tools
advanced_notes = structured writing, styling, rich editing
developer_diagnostics = debug and certification tools
full = all non-removed, non-unsupported tools
```

Do not break existing env compatibility immediately. Accept old values as aliases:

```text
simple → core
full → full
```

## 1.2 Current tool profile is mostly environment-driven

The current configuration reads `REMNOTE_BRIDGE_TOOL_PROFILE` from environment. That is fine for initial server boot, but not enough for plugin-controlled dynamic tier switching.

Implement dynamic tier state using hosted pairing/session state and plugin state.

The active tier should be derived in this order:

```text
explicit ChatGPT pairing/session tier
plugin-selected tier
server default tier from env
safe fallback: core
```

## 1.3 Storage models need tier/session fields

Add fields to hosted ChatGPT pairing/session state:

```ts
toolTier?: 'core' | 'advanced_notes' | 'developer_diagnostics' | 'full';
toolTierVersion?: string;
toolTierChangedAt?: string;
toolSchemaVersionAtApproval?: string;
requiresConnectorRefresh?: boolean;
```

Add any needed DB migration for Postgres storage and equivalent support for memory storage.

## 1.4 ChatGPT schema refresh must be handled

Changing the tool tier may not automatically refresh ChatGPT’s tool schema.

Required UX:

```text
Tool tier changed. Reconnect ChatGPT connector to refresh available tools.
```

If live schema refresh is possible through MCP discovery, implement it. If not, show a clear reconnect-required state.

Do not silently show stale tools.

## 1.5 Runtime verification state is not first-class yet

The bridge currently distinguishes registry-listed tools from runtime-verified tools, but this must become a proper verification matrix.

Add persistent or session-level runtime verification records:

```text
tool name
tier
category
risk level
registered
exposed
runtime verified
last success timestamp
last failure timestamp
last error code
average latency
supports dry-run
supports idempotency
requires write
requires delete
recommended fallback
```

Expose the matrix through:

```text
get_bridge_diagnostics
dashboard
RemNote plugin advanced details
run_bridge_health_check
```

## 1.6 Health check routing must be hosted-session aware

`run_bridge_health_check` must use the same principal/session-aware plugin routing path as normal MCP tool calls.

Do not call raw hub/plugin routing in hosted mode without the authenticated ChatGPT principal. This is what can cause false `NO_PAIRED_PLUGIN_SESSION` failures.

Required fix:

```text
health-check.ts must receive/use the principal-aware callPlugin wrapper
```

## 1.7 Hosted diagnostics must not depend on local bearer auth

Keep `/diagnostics` protected for admin/local debugging if needed.

But the RemNote plugin hosted UI needs its own hosted-safe diagnostics route, such as:

```text
POST /api/plugin/diagnostics
POST /api/plugin/health-check
POST /api/plugin/copy-failed-request
```

Authenticate these using hosted plugin session/pairing state, not `REMNOTE_BRIDGE_TOKEN`.

## 1.8 Some schemas are too broad or ambiguous

Do not remove the tools. Improve the schemas.

Known schema problems:

```text
apply_structured_note_batch has overlapping target/parentId/root/note shapes
apply_style_plan uses generic value
verify_note_design uses dynamic expectedStyleMap record
create_polished_note_tree mixes creation and post-create styling plan
create_styled_rem_tree recursive payload is powerful but needs tighter constraints
move/reorder/update/replace need dry-run and guards
```

## 1.9 Static MCP server registration may be inefficient

Each MCP request can rebuild/register tool definitions. For 47 tools this is acceptable during testing, but not ideal for a public app.

Add caching of static tool definitions and registry summaries. Still inject request-specific values:

```text
principal
request signal
session
active tier/profile
runtime info
```

Cache invalidation must occur when tool tier/profile changes or when registry version changes.

## 1.10 Test scripts listed in the plan may not exist yet

Add the missing test scripts rather than pretending they ran.

Required new scripts include:

```text
server:test:tools-core
server:test:tools-advanced
server:test:tools-diagnostics
server:test:tool-schemas
server:test:hosted-diagnostics
server:test:tier-switching
server:test:idempotency
server:test:performance
```

If an existing script covers the same purpose, document the mapping.

---

# 2. Work Division

Divide the work into three main areas:

1. **MCP server, tool registry, schemas, permissions, and performance**
2. **RemNote plugin UI, tier controls, hosted diagnostics, and user experience**
3. **Testing, verification matrix, documentation, deployment checks, and release hardening**

Each area has required tasks and acceptance criteria.

---

# Area 1 — MCP Server, Tool Registry, Schemas, Permissions, and Performance

## 1.1 Remove legacy destructive delete tools completely

Delete these tools from the entire repo:

```text
delete_focused_rem
delete_selected_rem
delete_rem
```

Keep only:

```text
delete_rem_by_id
```

`delete_rem_by_id` must remain guarded:

```text
dryRun defaults true
real delete requires dryRun=false
real delete requires expectedParentId, expectedAncestorId, or confirmTitle
real delete must return clear target confirmation data
```

Required output for dry run and real delete:

```json
{
  "ok": true,
  "dryRun": true,
  "target": {
    "remId": "...",
    "title": "...",
    "parentId": "...",
    "breadcrumbs": ["..."],
    "childCount": 8
  },
  "wouldDelete": true,
  "deleted": false
}
```

## 1.2 Implement real tool tiers

Replace the old `simple/full` mental model with:

```text
core
advanced_notes
developer_diagnostics
full
```

### Core tier

Safe default for ordinary users.

```text
get_bridge_status
get_plugin_status
get_focused_rem
get_rem
get_children
get_rem_tree
get_rem_breadcrumbs
search_rems
create_basic_flashcard
create_cloze_card
create_multiple_choice_card
create_list_answer_card
delete_rem_by_id
```

### Advanced Notes tier

For real note writing and structured editing.

```text
get_current_selection
get_rem_rich
get_document_or_folder_tree
create_rem
create_document
append_to_rem
update_rem
replace_rem
move_rem
reorder_children
create_rem_tree
create_styled_rem_tree
create_polished_note_tree
apply_structured_note_batch
apply_style_plan
verify_note_design
apply_remnote_command
set_rem_heading_level
set_rem_text_color
set_rem_highlight_color
set_text_span_color
set_text_span_highlight
set_rem_type
set_hide_bullet
clear_rem_formatting
create_concept_card
create_descriptor_card
```

### Developer / Diagnostics tier

For debugging, tool certification, raw rich-text inspection, and bridge development.

```text
ping_remnote_plugin
get_bridge_diagnostics
run_bridge_health_check
get_remnote_capability_guide
debug_get_raw_rich_text
```

### Full tier

All non-removed and non-unsupported tools.

### Removed

```text
delete_focused_rem
delete_selected_rem
delete_rem
```

### Unsupported

If `create_folder` is still unsupported by the RemNote SDK, do not expose it as a normal callable tool. Either remove it from public tiers or mark it as `sdk_unsupported` and keep it out of ChatGPT callable schema.

## 1.3 Add tier metadata to every tool

Each tool must have metadata:

```json
{
  "tier": "core",
  "category": "read",
  "riskLevel": "low",
  "requiresWrite": false,
  "requiresDelete": false,
  "supportsDryRun": false,
  "supportsIdempotency": false,
  "recommendedForNormalUse": true,
  "runtimeVerified": false
}
```

Risk levels:

```text
low
medium
high
dangerous
```

Categories:

```text
status
diagnostics
read
write
formatting
batch
cards
delete
debug
```

## 1.4 Dynamic tier resolution

Active tier must be resolvable per session/request.

Required order:

```text
request/session tier
paired ChatGPT session tier
active RemNote plugin tier
server default tier
core fallback
```

Expose active tier in:

```text
/health
get_bridge_status
get_plugin_status
get_bridge_diagnostics
run_bridge_health_check
tool registry summary
dashboard
RemNote plugin UI
```

If active tier changes, set:

```text
requiresConnectorRefresh=true
```

unless the connector schema is refreshed automatically.

## 1.5 Improve complex schemas without reducing tool power

Improve these essential tools:

```text
verify_note_design
apply_style_plan
apply_remnote_command
create_polished_note_tree
apply_structured_note_batch
create_styled_rem_tree
reorder_children
move_rem
replace_rem
update_rem
```

General schema rules:

```text
avoid untyped any/object
avoid generic value fields
avoid multiple competing ways to express the same target
prefer discriminated unions
prefer explicit fields
add examples in descriptions
normalize legacy aliases internally
do not expose legacy aliases if they confuse ChatGPT
return normalized execution plans
support dry-run where practical
support idempotency where practical
```

## 1.6 Improve `apply_style_plan`

Replace generic operation format:

```json
{
  "type": "heading",
  "value": "H2"
}
```

with discriminated operation types:

```json
{
  "type": "heading",
  "remId": "abc",
  "headingLevel": "H2"
}
```

```json
{
  "type": "text_color_span",
  "remId": "abc",
  "text": "equilibrium",
  "occurrence": 1,
  "color": "Blue"
}
```

```json
{
  "type": "text_highlight_span",
  "remId": "abc",
  "start": 10,
  "end": 20,
  "highlightColor": "Yellow"
}
```

```json
{
  "type": "whole_rem_highlight",
  "remId": "abc",
  "highlightColor": "Yellow"
}
```

Required behavior:

```text
validate ranges
validate text occurrence
validate colors
support dryRun
support idempotencyKey
return normalized plan
return per-operation result
support continueOnError
support verifyAfterWrite
```

## 1.7 Improve `verify_note_design`

Add an array-based input format.

Preferred public shape:

```json
{
  "rootRemId": "root123",
  "expectations": [
    {
      "remId": "root123",
      "plainText": "5.1 — Physical Origin of the Harmonic Oscillator",
      "headingLevel": "H1",
      "hideBullet": false
    },
    {
      "remId": "child123",
      "plainText": "Physical Idea",
      "headingLevel": "H2"
    }
  ],
  "expectedChildOrder": ["child123", "child456"],
  "verifyRichText": true,
  "verifyMath": true
}
```

Keep old `expectedStyleMap` internally only if needed, but prefer the array shape for public schema.

Must verify:

```text
plain text
heading levels
hidden bullets
Rem type
whole Rem color/highlight
span-level color/highlight
bold/italic/underline where supported
child order
inline math
block math
flashcard/card structure where possible
```

Return actionable mismatch objects:

```json
{
  "remId": "abc",
  "field": "headingLevel",
  "expected": "H2",
  "actual": "normal",
  "fixSuggestion": "Use apply_style_plan heading operation"
}
```

## 1.8 Improve `apply_remnote_command`

Keep this tool, but make it safer.

Required:

```text
explicit command union
target validation
dry-run/preview mode
idempotencyKey
no destructive commands
return normalized command plan
recommend safer specialized tool when applicable
```

If command is equivalent to a specialized tool, metadata should say:

```json
{
  "recommendedTool": "set_rem_heading_level"
}
```

## 1.9 Improve `create_polished_note_tree`

This should become a reliable main workflow.

Required phases:

```text
1. validate tree
2. create tree
3. apply styles
4. verify design
5. rollback if configured and safe
6. return complete report
```

Required output:

```json
{
  "ok": true,
  "rootRemId": "...",
  "createdRemCount": 18,
  "createdRemIds": ["..."],
  "styleOperationsApplied": 4,
  "verification": {
    "ok": true,
    "mismatches": []
  },
  "rollback": {
    "attempted": false,
    "completed": false
  },
  "idempotencyKey": "..."
}
```

Important: heading styles must apply reliably. If RemNote SDK cannot apply heading during creation, automatically apply heading in a post-create style phase.

## 1.10 Improve `apply_structured_note_batch`

Keep it as the safest batch writer but simplify the public path.

Preferred input path:

```json
{
  "operation": "create_child_tree",
  "target": {
    "mode": "parent_child",
    "parentId": "abc"
  },
  "position": "end",
  "tree": {
    "text": "Root title",
    "children": []
  },
  "dryRun": true,
  "verifyAfterWrite": true
}
```

Internal normalization should support older shapes if needed:

```text
parentId
root
note.root
note.children
```

but public schema should prefer one clean path.

Required:

```text
dry-run preview
node count
style count
card count
math count
rollback support
idempotency auto-generation
verification after write
clear partial-failure report
```

## 1.11 Improve `create_styled_rem_tree`

Keep it in Advanced Notes tier.

Required:

```text
stricter recursive schema
max depth
max node count
dryRun
idempotencyKey
input node key support
created ID map
style/math/card count
preview outline
```

Preferred node shape should allow optional `clientNodeId`:

```json
{
  "clientNodeId": "intro-heading",
  "type": "rem",
  "text": "Physical Idea",
  "style": { "headingLevel": "H2" },
  "children": []
}
```

Return:

```json
{
  "idMap": {
    "intro-heading": "createdRemId"
  }
}
```

## 1.12 Improve risky edit tools

These are necessary and should stay, but they need stronger safeguards.

### `reorder_children`

Required:

```text
dryRun
parentRemId
full ordered child ID list
validate IDs are current direct children
refuse partial reorder unless explicitly allowPartial=true
before/after order
idempotencyKey
```

### `move_rem`

Required:

```text
dryRun
source Rem ID
new parent ID
expected current parent or ancestor guard
before/after breadcrumbs
prevent moving into own descendant
idempotencyKey
```

### `replace_rem`

Required:

```text
dryRun
expected current text/title guard
before/after preview
refuse if expected text/title does not match
idempotencyKey
```

### `update_rem`

Required:

```text
dryRun
expected current text/title guard when possible
patch-style update option
before/after preview
idempotencyKey
```

## 1.13 Improve write permissions

Map permission modes clearly:

```text
read_only → no write tools execute
confirm_writes → dry-run/preview first, approval required for real write
trusted_writes → trusted writes allowed inside approved scope
danger_zone → advanced/risky tools allowed, still no removed legacy delete tools
```

Do not let `danger_zone` resurrect removed delete tools.

## 1.14 Performance improvements

### Cache static tool definitions

Avoid rebuilding all static tool schemas on every MCP call if possible.

Cache by:

```text
tool registry version
active tier/profile
delete exposure flag
schema version
```

Still inject:

```text
principal
request signal
session state
runtime info
```

### Prefer batch writes

Normal workflow should be:

```text
create/append tree in batch
apply style batch
verify batch
```

Avoid many single-Rem calls.

### Add idempotency everywhere writes happen

Add required or auto-generated idempotency keys for:

```text
create_polished_note_tree
create_styled_rem_tree
apply_structured_note_batch
apply_style_plan
apply_remnote_command
create_rem_tree
move_rem
reorder_children
replace_rem
update_rem
create_rem
create_document
append_to_rem
update_rem_rich
card creation tools
delete_rem_by_id
```

If omitted, generate one and return it.

### Add response size controls

Large trees and diagnostics can become huge.

Add:

```text
maxDepth
maxChildren
maxResultBytes
truncated: true/false
continuation token or follow-up read hints
```

### Add request cancellation and timeout consistency

Every long write, health check, and verification task must honor abort signals and configured timeout.

---

# Area 2 — RemNote Plugin UI, Tier Controls, Hosted Diagnostics, and UX

## 2.1 Add a visible tier selector

Show:

```text
Core
Advanced Notes
Developer / Diagnostics
Full
```

For each tier show:

```text
tool count
risk explanation
whether ChatGPT reconnect is needed
whether tier is active on server
```

## 2.2 Sync tier state with server

Add server endpoint:

```text
GET /api/plugin/tool-tier
POST /api/plugin/tool-tier
```

Authentication:

```text
hosted plugin session/pairing state
not local bridge token
```

State must update:

```text
plugin local storage
server session state
ChatGPT pairing session record
dashboard
health output
diagnostics output
```

## 2.3 Stale session detection

If permission scope/mode/tier changes after ChatGPT pairing, show:

```text
Reconnect required: ChatGPT was approved with an older permission scope or tool tier.
```

The plugin must not show `Ready` if the paired ChatGPT session cannot use the selected tier/scope.

## 2.4 Hosted diagnostics

Add hosted-safe plugin diagnostics endpoints.

The RemNote plugin advanced buttons must work in hosted mode:

```text
Run Quick Health Check
Run Standard Health Check
Run Full Health Check
Copy Logs
Copy Diagnostics
Copy Failed Request
Copy Tool Verification Matrix
```

Do not call local-token-only `/diagnostics` from hosted plugin UI.

## 2.5 Health check levels

Implement:

```text
quick
standard
full
```

### Quick

```text
server reachable
plugin connected
focused Rem readable
one small read operation
```

### Standard

```text
quick checks
get_children
get_rem_tree
dry-run structured note write
style-plan dry-run
verification dry-run
```

### Full

```text
all exposed tools in active tier
runtime verification matrix
latency report
unsupported tools
schema warnings
permission issues
```

## 2.6 Better error messages

Errors must explain the real fix.

Examples:

```text
Tool unavailable because active tier is Core. Switch to Advanced Notes and reconnect ChatGPT.
```

```text
ChatGPT session was approved with focused-rem-only. Reconnect with focused Rem + descendants.
```

```text
This write requires trusted writes or confirmation approval.
```

```text
This tool is unsupported by the installed RemNote SDK.
```

## 2.7 Hosted mode should hide local token UI

In hosted mode, the RemNote plugin should not make the user think a local bridge token is necessary.

Show bridge token fields only in local developer mode or under advanced local settings.

## 2.8 Dashboard improvements

Dashboard should show:

```text
Deployment mode
Auth mode
Active tier
Tool counts by tier
Verified tool count
Runtime-unverified tool count
Last successful tool
Last failed tool
Average latency
Plugin connection status
ChatGPT pairing status
Session stale yes/no
```

---

# Area 3 — Testing, Verification Matrix, Documentation, Deployment, and Release Hardening

## 3.1 Runtime tool verification matrix

Track:

```text
tool name
tier
category
risk level
registered
exposed
runtime verified
last success timestamp
last failure timestamp
last error code
average latency
p95 latency if available
supports dry-run
supports idempotency
requires write
requires delete
recommended fallback
schema warning status
```

Expose in:

```text
get_bridge_diagnostics
dashboard
RemNote plugin advanced details
run_bridge_health_check
```

## 3.2 Verify every kept tool

Add runtime tests for every kept tool.

### Read tools

```text
get_plugin_status
get_focused_rem
get_current_selection
get_rem
get_rem_tree
get_rem_rich
debug_get_raw_rich_text
get_children
get_rem_breadcrumbs
search_rems
get_document_or_folder_tree
```

### Write tools

```text
create_rem
create_document
append_to_rem
update_rem
replace_rem
move_rem
reorder_children
create_rem_tree
create_styled_rem_tree
apply_structured_note_batch
create_polished_note_tree
apply_remnote_command
update_rem_rich
```

### Formatting tools

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
verify_note_design
```

### Flashcard/card tools

```text
create_basic_flashcard
create_concept_card
create_descriptor_card
create_cloze_card
create_multiple_choice_card
create_list_answer_card
```

### Diagnostics/status tools

```text
ping_remnote_plugin
get_bridge_status
get_bridge_diagnostics
run_bridge_health_check
get_remnote_capability_guide
```

### Delete

```text
delete_rem_by_id
```

Only dry-run delete should be tested automatically. Real delete must use a dedicated throwaway sandbox Rem and strong guards.

## 3.3 Add certification scripts

Add or map scripts:

```bash
npm run server:test:tools-core
npm run server:test:tools-advanced
npm run server:test:tools-diagnostics
npm run server:test:tool-schemas
npm run server:test:hosted-diagnostics
npm run server:test:tier-switching
npm run server:test:idempotency
npm run server:test:performance
npm run server:test:e2e-hosted-smoke
```

Do not report these commands as run if they do not exist.

## 3.4 Schema quality tests

Fail tests if public schemas contain:

```text
untyped any
generic object where typed schema is practical
recursive children:any[]
generic value for unrelated operation types
dynamic record maps without array alternative
removed tools
unsupported tools exposed in normal tiers
missing descriptions
missing examples for complex tools
missing tier metadata
missing dry-run metadata for risky tools
missing idempotency metadata for multi-step writes
```

## 3.5 Performance tests

Track:

```text
status/read tools: < 700 ms typical
get_children/get_rem_tree: < 1 s typical
small write: < 1.5 s typical
18-25 Rem note tree: < 3 s typical
style batch: < 1.5 s typical
verification: < 1.5 s typical
card creation: < 4 s typical
diagnostics quick: < 1 s typical
diagnostics standard: < 3 s typical
```

Report regressions but do not fail hard unless clearly broken.

## 3.6 Hosted mode regression tests

Verify:

```text
hosted MCP does not require local bearer token
hosted MCP uses OAuth/pairing/session auth
local mode still requires token unless explicit dev no-auth
health check uses principal-aware routing
hosted diagnostics do not use local bearer-token path
tool tier changes update registry
stale ChatGPT session detection works
/health returns public endpoints, not 127.0.0.1
allowed origins include RemNote/ChatGPT/public base origins
plugin reconnect after server restart works
session expiry and refresh behavior works
```

## 3.7 End-to-end workflow checklist

Create an automated or semi-automated checklist:

```text
deploy Render
open RemNote plugin
select Core tier
connect plugin
pair ChatGPT
get focused Rem
switch to Advanced Notes tier
reconnect if required
create styled note tree
apply style plan
verify note design
create flashcards
run guarded delete dry-run
run quick health check
run standard health check
export diagnostics
rotate exposed secrets after testing
```

## 3.8 Documentation updates

Update:

```text
README
hosted setup guide
local setup guide
Render env guide
RemNote plugin guide
ChatGPT connector guide
tool tier guide
permission mode guide
recommended workflows
safe write workflow
delete safety guide
troubleshooting guide
diagnostics guide
performance guide
release checklist
```

## 3.9 Security hardening

Required:

```text
rotate exposed secrets after testing
redact tokens/session secrets in all logs
audit pairing approval/disconnect/tool calls
rate limit pairing and diagnostics endpoints
validate CORS origins
reject unknown origins in hosted websocket
expire stale plugin sessions
support revocation/disconnect cleanup
never expose raw tokens in UI diagnostics
```

## 3.10 Product readiness checklist

Before public release:

```text
Render starts cleanly in hosted mode
/health shows hosted_oauth_required
bridge.connected true after plugin connect
ChatGPT connector connects without manual bearer token
Core tier works
Advanced Notes tier works
Developer Diagnostics tier works
Full tier works
tool tier switching works
stale session warnings work
all kept tools have schema-quality review
all kept tools have runtime verification status
legacy delete tools removed entirely
delete_rem_by_id remains guarded
complex note creation applies headings/styles correctly
math/rich-text verification works
hosted diagnostics UI works
performance report available
documentation complete
```

---

# 4. Tool Improvement Priorities

Work in this order:

1. Remove legacy delete tools completely.
2. Implement real tier/profile system in server and plugin UI.
3. Add tier metadata and dynamic tier resolution.
4. Improve complex schemas.
5. Fix hosted health check routing.
6. Fix hosted diagnostics and plugin advanced buttons.
7. Make note creation auto-style and auto-verify.
8. Add runtime tool verification matrix.
9. Add performance/idempotency improvements.
10. Add full documentation and release checklist.

---

# 5. Acceptance Criteria

## Functional

```text
all tools except removed legacy delete tools remain available through a tier
users can switch tiers inside RemNote plugin
ChatGPT can understand active tier
delete_rem_by_id is the only delete tool
complex tools remain powerful but become clearer, safer, faster, better verified
hosted diagnostics work without local bearer token
health checks route correctly in hosted mode
batch writing is preferred normal path
multi-step write tools support idempotency
tool verification matrix is visible and useful
```

## Safety

```text
no focus-based delete
no selected-Rem delete
no legacy direct delete
risky tools support dry-run/preview/guards
permission mode and tier state are visible
stale ChatGPT sessions are detected
danger zone does not resurrect removed delete tools
```

## Performance

```text
avoid rebuilding static schemas unnecessarily
prefer batch operations
track latency by tool
report slow tools
cap large response sizes
honor abort/timeouts
```

## UX

```text
normal users can connect without understanding tokens
tool tier can be changed from plugin
diagnostics are readable
errors explain real fixes
reconnect-required states are clear
hosted mode hides local-token UI
```

---

# 6. Development Commands To Run

Run these before reporting completion:

```bash
npm run server:build
npm run server:test:auth
npm run server:test:routing
npm run server:smoke
npm run server:test:pairing
npm run server:test:security
npm run server:test:tools-core
npm run server:test:tools-advanced
npm run server:test:tools-diagnostics
npm run server:test:tool-schemas
npm run server:test:hosted-diagnostics
npm run server:test:tier-switching
npm run server:test:idempotency
npm run server:test:performance
npm run server:test:e2e-hosted-smoke
npm run check-types
npm run build
git diff --check
```

If some scripts do not exist yet, create them or explicitly report which scripts are still missing and why.

---

# 7. Final Report Format Required From Codex

When finished, report:

```text
Summary
Files changed
Tools removed
Tools kept
Tier/profile behavior
Dynamic tier switching behavior
Complex schema improvements
Hosted diagnostics fixes
Health check routing fixes
Runtime verification matrix
Performance improvements
Security improvements
Tests added
Commands run
Known limitations
Manual runtime checks still needed
```

Do not claim live Render/ChatGPT success unless it was actually tested live.