# RemNote ChatGPT Bridge — Deep Issue Audit and Completion Blockers

**Repo:** `HTGit63/remnote-plugin-template-react`
**Branch inspected:** `main`
**Audit date:** 2026-05-13
**Scope:** MCP tool exposure, bridge/plugin registry parity, ChatGPT connector behavior, RemNote SDK implementation risk, approval/session safety, and remaining QA before this can be called complete.

---

## 0. Executive Summary

The latest pushed `main` branch is no longer in the old 8-tool or 24-tool source state.

The source now targets:

```text
40 public MCP tools
1 gated hidden tool: delete_rem
toolRegistryVersion: 2026-05-10.1
mcpDiscoveryVersion: mcp-discovery-2026-05-10.1
```

That means the earlier source-level diagnosis — “only 24 tools exist in the repo” — is stale.

However, this should **not** be marked complete yet.

The repository now appears to define and smoke-test a 40-tool registry, but the real issue is whether the live end-to-end path exposes and calls those same tools:

```text
ChatGPT / Vivy
↓
MCP-compatible tool layer
↓
Tunnel / connector / ChatGPT Developer Mode app
↓
Local companion server
↓
WebSocket bridge
↓
Running RemNote plugin
↓
RemNote SDK
↓
User RemNote knowledge base
```

The remaining likely failure is not simply “the code for the 32 tools is missing.”

The remaining failure is probably one or more of:

```text
1. ChatGPT is connected to an old companion server process.
2. ChatGPT cached an old tools/list result.
3. The tunnel URL points to the wrong local process or stale port.
4. MCP discovery works, but tools/call is blocked by auth/token configuration.
5. The local server was rebuilt, but the RemNote plugin panel is still running an older bundle.
6. The 40 tools are registered in source and mock-smoke tested, but not all have been verified against the real RemNote SDK/runtime.
7. Some “callableTools” diagnostics are registry-derived, not proof of successful real tool execution.
8. A failed plugin-side write or approval path may still surface as a transport/session issue in ChatGPT.
```

Recommended final wording:

```text
Source-level 40-tool registry parity appears implemented in latest main. Live ChatGPT + real RemNote QA remains required before closing the issue.
```

Do **not** write:

```text
Complete.
```

---

## 1. What Was Originally Wrong

The original bug had multiple layers.

### 1.1 User-visible symptom

ChatGPT/Vivy could only access a small subset of tools.

Observed exposed tools were approximately:

```text
get_bridge_status
ping_remnote_plugin
get_plugin_status
get_focused_rem
get_rem
get_rem_tree
create_rem
append_to_rem
```

That is 8 tools.

The intended bridge later reported a much larger set, eventually:

```text
40 public tools
1 gated hidden delete tool
```

### 1.2 Why that is serious

If the bridge reports tools that ChatGPT cannot call, the architecture is broken.

This violates the central invariant:

```text
Every public tool reported by the bridge must be discoverable and callable through MCP.
```

The bad architecture is:

```text
registry A: bridge status reports 40 tools
registry B: MCP tools/list exposes 8 tools
router C: only routes some subset
plugin protocol D: implements another subset
```

The correct architecture is:

```text
shared tool registry
↓
get_bridge_status uses it
↓
get_bridge_diagnostics uses it
↓
MCP tools/list uses it
↓
MCP tool registration uses it
↓
tool router/call path uses it
↓
plugin protocol/handlers use matching tool names
```

---

## 2. Current Source-Level State

### 2.1 Shared registry now exists

The latest `server/src/tool-registry.ts` defines:

```text
TOOL_REGISTRY_VERSION = 2026-05-10.1
MCP_DISCOVERY_VERSION = mcp-discovery-2026-05-10.1
BRIDGE_PLUGIN_PROTOCOL_VERSION = 1
SERVER_VERSION = 0.1.0
MCP_TOOL_REGISTRY
```

It includes 40 public tools plus one gated tool.

### 2.2 Current public tools

```text
get_bridge_status
get_bridge_diagnostics
ping_remnote_plugin
get_plugin_status
get_focused_rem
get_rem
get_rem_tree
get_rem_rich
get_current_selection
get_children
get_rem_breadcrumbs
search_rems
get_document_or_folder_tree
create_rem
create_document
create_folder
append_to_rem
update_rem
replace_rem
move_rem
reorder_children
delete_focused_rem
delete_selected_rem
create_rem_tree
update_rem_rich
set_rem_heading_level
set_rem_text_color
set_rem_highlight_color
set_text_span_color
set_text_span_highlight
set_rem_type
set_hide_bullet
clear_rem_formatting
create_styled_rem_tree
create_basic_flashcard
create_concept_card
create_descriptor_card
create_cloze_card
create_multiple_choice_card
create_list_answer_card
```

### 2.3 Gated hidden tool

```text
delete_rem
```

Expected default:

```text
delete_rem must not appear in tools/list
delete_rem must appear in hiddenTools / hiddenReasons
deleteToolExposed must be false
```

Only local development should enable arbitrary ID delete:

```bash
REMNOTE_BRIDGE_ENABLE_DELETE_TOOL=1
```

Do not expose arbitrary delete by default.

---

## 3. Current Protocol-Level State

The bridge protocol now includes the expanded tool names and types.

Current protocol categories:

```text
status tools
read tools
safe create/write tools
rich/styled formatting tools
flashcard/card helper tools
dangerous replace/delete tools
gated arbitrary delete
```

The protocol now includes permission scopes:

```text
focused_rem_only
focused_rem_and_descendants
selected_rem_only
selected_rem_and_descendants
approved_document_or_folder
workspace_allowed
```

It also includes the approval timeout constant:

```ts
WRITE_APPROVAL_TIMEOUT_MS = 30000
```

This is good.

Remaining concern:

```text
Protocol-level presence does not prove live SDK behavior.
```

A tool can exist in:

```text
registry
protocol
MCP server registration
mock smoke responder
```

and still fail in real RemNote if:

```text
the RemNote SDK method behaves differently
the method exists in typings but fails at runtime
the plugin is running an old bundle
permission scope blocks the target
approval UI hangs or is cancelled
tool-call auth blocks the request
ChatGPT connector uses stale discovery metadata
```

---

## 4. MCP Discovery and Auth Analysis

### 4.1 Discovery now has a no-auth path

The server treats these MCP methods as discovery:

```text
initialize
notifications/initialized
tools/list
```

These can be allowed without bearer auth so ChatGPT can refresh tool metadata.

This is good and directly addresses stale/missing tools during discovery.

### 4.2 Tool calls may still require auth

Discovery and tool calls are different.

Possible state:

```text
tools/list → works and shows 40 tools
tools/call → fails due to auth/token mismatch
```

The diagnostics must be checked for:

```text
discoveryAuthMode
toolCallAuthMode
unauthDiscoverableTools
unauthMcpCallableTools
```

Important expected cases:

#### Local no-token development

```bash
export REMNOTE_BRIDGE_ALLOW_NO_TOKEN=1
unset REMNOTE_BRIDGE_TOKEN
```

Expected:

```text
discoveryAuthMode: no_auth_required
toolCallAuthMode: no_auth_allowed
tools/list: 40 tools
tools/call: allowed without token
```

#### Token-protected mode

Expected:

```text
discoveryAuthMode: no_auth_required
toolCallAuthMode: local_bearer_required
tools/list: 40 tools
tools/call: requires correct bearer token
```

If ChatGPT can list tools but not call them, check the token path first.

---

## 5. Diagnostics Field Risk

Current diagnostics expose fields such as:

```text
registeredTools
publicTools
exposedTools
callableTools
discoverableTools
actualMcpCallableTools
unauthDiscoverableTools
unauthMcpCallableTools
hiddenTools
hiddenReasons
registryMismatch
```

This is useful, but there is a subtle problem:

```text
Some of these fields appear registry-derived, not necessarily proven by live tool execution.
```

For example:

```text
callableTools = publicTools
actualMcpCallableTools = publicTools
```

may mean:

```text
registered according to the server registry
```

not:

```text
successfully called end-to-end through ChatGPT and RemNote
```

Recommendation:

Add or maintain separate fields:

```json
{
  "registeredTools": [],
  "publicTools": [],
  "mcpListedTools": [],
  "mcpRegisteredTools": [],
  "lastSuccessfulToolCalls": [],
  "lastFailedToolCalls": [],
  "realPluginVerifiedTools": [],
  "mockSmokeVerifiedTools": [],
  "sdkUnsupportedTools": [],
  "runtimeUnverifiedTools": []
}
```

Do not let diagnostics imply runtime success unless a real call happened.

---

## 6. Smoke Test Analysis

The current smoke test is much better than before.

It verifies:

```text
tools/list exactly equals getPublicMcpToolNames(false)
delete_rem is hidden by default
no-auth tools/list returns the expected registry
get_bridge_status publicTools matches tools/list
get_bridge_diagnostics reports registry fields
unknown tools return structured UNKNOWN_TOOL
timeout returns TIMEOUT
plugin disconnect returns PLUGIN_NOT_CONNECTED
client abort returns CLIENT_DISCONNECTED
base read/write paths round-trip through mock plugin
rich/styled/card tools are present in mock paths
```

This is valuable.

But smoke tests use a mock WebSocket responder.

That proves:

```text
MCP server registration works
tool descriptors exist
argument schemas mostly parse
bridge request names are routed to the mock
registry parity exists in the mock environment
session failure handling is at least partially tested
```

It does **not** prove:

```text
the RemNote SDK operation works in a real workspace
the approval UI works under real user interaction
ChatGPT connector refreshes the latest schema
the ngrok/tunnel path points to this server
the plugin bundle loaded in RemNote is latest
formatting/card APIs behave correctly at runtime
```

So classify current tests like this:

| Area | Current confidence | Reason |
|---|---:|---|
| Source registry has 40 public tools | High | Registry code shows 40 public entries |
| MCP tools/list parity in smoke | High | Smoke compares tools/list to registry |
| Hidden `delete_rem` by default | High | Registry and smoke check this |
| Protocol knows 40 tools | High | Protocol includes expanded tool names |
| Mock callability | Medium/high | Smoke mock handles many calls |
| Real ChatGPT exposure | Not verified here | Requires actual ChatGPT connector/tools/list |
| Real RemNote SDK behavior | Not verified here | Requires real RemNote plugin session |
| Approval UI under real use | Not verified here | Requires manual approve/reject/timeout |
| Styled/card fidelity | Medium/unknown | SDK methods may not produce exact intended RemNote semantics |

---

## 7. Tool-by-Tool Classification

### 7.1 Status tools

| Tool | Source status | Risk |
|---|---|---|
| `get_bridge_status` | Implemented | Low |
| `get_bridge_diagnostics` | Implemented | Low/medium; make sure fields are not misleading |
| `ping_remnote_plugin` | Implemented | Low |
| `get_plugin_status` | Implemented | Low |

Required live test:

```text
Call all four from ChatGPT.
They must work even after a failed write call.
```

---

### 7.2 Read tools

| Tool | Source status | Risk |
|---|---|---|
| `get_focused_rem` | Implemented | Low |
| `get_rem` | Implemented | Medium because scope can block descendants |
| `get_rem_tree` | Implemented | Medium because scope/depth/truncation |
| `get_rem_rich` | Implemented | Medium/high because rich text normalization may be lossy |
| `get_current_selection` | Implemented with fallback | Medium because SDK selection support may vary |
| `get_children` | Implemented | Medium because argument aliases and scope |
| `get_rem_breadcrumbs` | Implemented | Low/medium |
| `search_rems` | Implemented | Medium/high because broad search scope must be controlled |
| `get_document_or_folder_tree` | Implemented | Medium because focused portal/document detection can vary |

Required live test:

```text
Run all read tools on a sandbox Rem.
Verify no OUT_OF_SCOPE when using focused_rem_and_descendants.
Verify OUT_OF_SCOPE still happens for outside Rems.
Verify search is capped and scoped.
```

---

### 7.3 Basic create/update/organization tools

| Tool | Source status | Risk |
|---|---|---|
| `create_rem` | Implemented | Medium |
| `append_to_rem` | Implemented | Medium |
| `create_rem_tree` | Implemented | Medium/high due partial creation risk |
| `create_document` | Implemented with setIsDocument(true) | Medium |
| `create_folder` | Explicit `SDK_UNSUPPORTED` | Low if failure is structured |
| `update_rem` | Implemented | Medium |
| `move_rem` | Implemented | Medium/high due hierarchy/index issues |
| `reorder_children` | Implemented | Medium/high due exact child-list requirement |
| `replace_rem` | Implemented but dangerous | High; must always require approval |

Required live test:

```text
create child
read child back
create tree
verify order
update text
verify children preserved
move child
verify location
reorder children
verify no dropped child
bad ID returns REM_NOT_FOUND
session remains alive
```

---

### 7.4 Rich/styled tools

| Tool | Source status | Risk |
|---|---|---|
| `update_rem_rich` | Implemented | High; real rich text output must be verified |
| `set_rem_heading_level` | Implemented | Medium |
| `set_rem_text_color` | Implemented | Medium/high; SDK color support limited |
| `set_rem_highlight_color` | Implemented | Medium/high |
| `set_text_span_color` | Implemented | High; offset mapping can be fragile |
| `set_text_span_highlight` | Implemented | High; offset mapping can be fragile |
| `set_rem_type` | Implemented | Medium |
| `set_hide_bullet` | Implemented through list-item state | Medium/high; semantic correctness must be checked |
| `clear_rem_formatting` | Implemented | High; may remove more formatting than expected |
| `create_styled_rem_tree` | Implemented | High; complex mixed node/style/card behavior |

Important issue:

```text
Color support maps only certain colors to SDK formats.
pink and gray may return SDK_UNSUPPORTED.
```

This is acceptable only if the error is structured and does not terminate the session.

Required live test:

```text
Apply heading
Apply color
Apply highlight
Apply span color
Apply span highlight
Set concept/descriptor/normal
Hide bullet
Clear formatting
Create styled tree
Read back with get_rem_rich
Verify actual visual RemNote result
```

---

### 7.5 Card/flashcard tools

| Tool | Source status | Risk |
|---|---|---|
| `create_basic_flashcard` | Implemented | High |
| `create_concept_card` | Implemented | High |
| `create_descriptor_card` | Implemented | High |
| `create_cloze_card` | Implemented | High |
| `create_multiple_choice_card` | Implemented | High |
| `create_list_answer_card` | Implemented | High |

Reason for high risk:

```text
The tools may create Rems and enable practice, but real RemNote card semantics must be verified manually.
```

Things to verify:

```text
front/back appear correctly
practice is enabled
practice direction is correct
concept/descriptor behavior matches RemNote semantics
cloze behavior is real cloze, not just text
multiple choice items become real answer choices if supported
list answer items behave as intended
```

If the SDK does not support true card semantics for a given card type, return:

```text
SDK_UNSUPPORTED
```

Do not fake card support by creating plain notes and reporting success as if they were cards.

---

### 7.6 Dangerous delete tools

| Tool | Source status | Risk |
|---|---|---|
| `delete_focused_rem` | Public, dangerous | High |
| `delete_selected_rem` | Public, dangerous | High |
| `delete_rem` | Gated hidden | Very high; should remain hidden by default |

Required behavior:

```text
delete requires approval
delete requires confirmText DELETE
approval UI shows target title
approval UI shows parent title
approval UI shows child count
approval UI shows descendant count
reject deletes nothing
timeout deletes nothing
success returns deletedRemId
failed delete does not kill session
```

Important:

```text
trusted_writes must not silently allow delete.
danger_zone may allow more, but delete should still be explicit and strongly gated.
```

---

## 8. Permission Scope Analysis

The old problem:

```text
ChatGPT creates a child under focused Rem.
Bridge returns child Rem ID.
ChatGPT tries to read the child.
Plugin returns OUT_OF_SCOPE.
```

This happens when scope is:

```text
focused_rem_only
```

The new practical scope should be:

```text
focused_rem_and_descendants
```

The source now includes:

```text
focused_rem_only
focused_rem_and_descendants
selected_rem_only
selected_rem_and_descendants
approved_document_or_folder
workspace_allowed
```

Required live test:

```text
1. Set scope to focused_rem_only.
2. Create child under focused Rem.
3. Read child.
4. Confirm it is blocked or verify intended exception.
5. Set scope to focused_rem_and_descendants.
6. Create child under focused Rem.
7. Read child.
8. Confirm read succeeds.
9. Try reading outside Rem.
10. Confirm OUT_OF_SCOPE.
```

Important product decision:

```text
focused_rem_only should remain default-safe.
focused_rem_and_descendants should be recommended for serious editing.
workspace_allowed should not be default.
```

---

## 9. Approval Flow Analysis

Required invariant:

```text
No write request may hang indefinitely.
```

Expected outcomes:

```text
APPROVED
APPROVAL_REJECTED
APPROVAL_TIMEOUT
SDK_ERROR
INTERNAL_ERROR
PLUGIN_NOT_CONNECTED
CLIENT_DISCONNECTED
TIMEOUT
```

The UI code uses:

```text
WRITE_APPROVAL_TIMEOUT_MS = 30000
```

Approval UI appears to include:

```text
tool name
mode
scope
summary
target Rem
target title
delete preview
risk
deadline
preview content
warning
approve button
reject button
DELETE confirmation for destructive requests
```

Remaining live test:

```text
approve write
reject write
let write timeout
disconnect plugin during pending approval
close MCP caller during pending approval
run failed SDK call
verify session still alive
```

After each failure:

```text
get_bridge_status must work
ping_remnote_plugin must work
get_plugin_status must work
get_focused_rem must work
```

---

## 10. Session and Transport Failure Analysis

The previous observed error:

```text
Session terminated
```

should be treated as a transport/session-layer issue, not proof that a specific RemNote SDK tool is incomplete.

Known structured errors include:

```text
PLUGIN_NOT_CONNECTED
TIMEOUT
CLIENT_DISCONNECTED
UNKNOWN_TOOL
SDK_ERROR
SDK_UNSUPPORTED
REM_NOT_FOUND
OUT_OF_SCOPE
INVALID_ARGS
APPROVAL_REJECTED
APPROVAL_TIMEOUT
```

Interpretation table:

| Symptom | Likely layer | Meaning |
|---|---|---|
| `Resource not found` | ChatGPT/MCP discovery layer | Tool is not exposed to ChatGPT |
| `UNKNOWN_TOOL` | MCP app/router | Tool name not public or not registered |
| `Session terminated` | MCP transport/session | Connection or request lifecycle failed |
| `PLUGIN_NOT_CONNECTED` | Bridge WebSocket | RemNote plugin not connected |
| `TIMEOUT` | Bridge request timeout | Plugin did not answer in time |
| `CLIENT_DISCONNECTED` | MCP caller disconnected | Caller closed request before result |
| `SDK_UNSUPPORTED` | RemNote SDK capability | Operation intentionally unsupported |
| `SDK_ERROR` | RemNote SDK runtime | SDK call failed |
| `OUT_OF_SCOPE` | Permission scope | Tool target outside allowed Rem scope |

Important requirement:

```text
Failed write calls must return structured errors and must not terminate MCP session.
```

---

## 11. Most Likely Current User-Facing Failure

If ChatGPT still shows only 8 tools after latest code, the most likely cause is **not** missing latest source.

Most likely causes in order:

```text
1. Old server process still running.
2. Server not rebuilt after latest push.
3. ChatGPT connector/app still cached old tools/list.
4. ngrok URL points to old process or wrong port.
5. ChatGPT MCP URL still points to old tunnel.
6. RemNote plugin still running old bundle.
7. Browser/RemNote panel not refreshed.
8. token settings allow tools/list but block tools/call.
9. server started with unexpected env config.
10. deployment path is using previous commit, not main.
```

---

## 12. Required Live Debug Procedure

### 12.1 Stop stale processes

```bash
pkill -f "tsx src/index.ts" || true
pkill -f "node dist/server/src/index.js" || true
pkill -f "ngrok" || true
```

Or manually stop:

```text
old companion server
old plugin dev server
old tunnel
```

### 12.2 Rebuild everything

```bash
npm run check-types
npm run validate
npm run build
npm run server:build
npm run server:smoke
```

### 12.3 Start local no-token mode for debugging

```bash
export REMNOTE_BRIDGE_ALLOW_NO_TOKEN=1
unset REMNOTE_BRIDGE_TOKEN
npm run server:dev
```

### 12.4 Restart plugin/dev UI

```bash
npm run dev
```

Then refresh/reload the RemNote plugin panel.

### 12.5 Start fresh tunnel

```bash
ngrok http --host-header=localhost:47392 47392
```

Use:

```text
https://YOUR-NGROK-URL/mcp
```

### 12.6 Refresh ChatGPT connector/app

Do all applicable:

```text
update MCP URL
refresh tool discovery
re-import Developer Mode app if needed
remove old connector config if cached
reconnect to new ngrok URL
```

### 12.7 Verify with ChatGPT

Call:

```text
tools/list
get_bridge_status
get_bridge_diagnostics
ping_remnote_plugin
get_plugin_status
```

Expected:

```text
tools/list shows 40 public tools
get_bridge_status publicToolCount = 40
get_bridge_diagnostics registryMismatch missing = []
get_bridge_diagnostics registryMismatch unexpected = []
delete_rem is hidden
get_plugin_status shows connected plugin
```

---

## 13. Manual QA Matrix

Use a sandbox Rem only.

Example:

```text
Plugin Test → notes
Rem ID: jCxriMiSyUVAJoKfh
```

### 13.1 Registry and discovery

| Test | Expected |
|---|---|
| `tools/list` | 40 public tools |
| `tools/list` includes `get_bridge_diagnostics` | yes |
| `tools/list` includes `create_styled_rem_tree` | yes |
| `tools/list` includes card tools | yes |
| `tools/list` includes `delete_rem` | no |
| `get_bridge_status.publicTools` equals `tools/list` | yes |
| `get_bridge_diagnostics.registryMismatch` | empty |

### 13.2 Base read tools

| Tool | Expected |
|---|---|
| `get_focused_rem` | focused sandbox Rem |
| `get_rem` | target Rem or structured `REM_NOT_FOUND` |
| `get_rem_tree` | bounded tree |
| `get_rem_rich` | rich metadata or structured fallback |
| `get_current_selection` | focused/selected Rem IDs or supported=false |
| `get_children` | ordered direct children |
| `get_rem_breadcrumbs` | parent chain |
| `search_rems` | capped scoped results |
| `get_document_or_folder_tree` | bounded tree |

### 13.3 Create/update/move tools

| Tool | Expected |
|---|---|
| `create_rem` | approval, creates Rem |
| `append_to_rem` | approval, creates child |
| `create_rem_tree` | one approval, ordered tree |
| `create_document` | creates document Rem |
| `create_folder` | `SDK_UNSUPPORTED` unless SDK supports it |
| `update_rem` | updates text, preserves children |
| `move_rem` | moves Rem, prevents self/descendant move |
| `reorder_children` | reorders exact child list |
| `replace_rem` | approval required, no silent destructive overwrite |

### 13.4 Rich/styled/card tools

| Tool | Expected |
|---|---|
| `update_rem_rich` | rich content updates or structured error |
| `set_rem_heading_level` | heading changes |
| `set_rem_text_color` | color changes or `SDK_UNSUPPORTED` |
| `set_rem_highlight_color` | highlight changes or `SDK_UNSUPPORTED` |
| `set_text_span_color` | span color changes or structured range error |
| `set_text_span_highlight` | span highlight changes or structured range error |
| `set_rem_type` | normal/concept/descriptor works |
| `set_hide_bullet` | bullet state changes correctly |
| `clear_rem_formatting` | formatting clears without data loss |
| `create_styled_rem_tree` | nested styled tree appears as intended |
| `create_basic_flashcard` | real practice card behavior |
| `create_concept_card` | real concept card behavior |
| `create_descriptor_card` | real descriptor card behavior |
| `create_cloze_card` | real cloze behavior |
| `create_multiple_choice_card` | real MC behavior or structured unsupported |
| `create_list_answer_card` | real list answer behavior or structured unsupported |

### 13.5 Delete tools

| Tool | Expected |
|---|---|
| `delete_focused_rem` | requires approval + `DELETE` |
| `delete_selected_rem` | requires approval + `DELETE` |
| `delete_rem` | hidden by default |
| delete reject | deletes nothing |
| delete timeout | deletes nothing |
| delete success | deletes only intended Rem |

### 13.6 Failure survival

Run bad calls:

```json
{
  "tool": "move_rem",
  "args": {
    "remId": "bad-id",
    "newParentId": "jCxriMiSyUVAJoKfh",
    "index": 0
  }
}
```

Expected:

```text
returns REM_NOT_FOUND or structured SDK_ERROR
session remains alive
get_bridge_status still works
ping_remnote_plugin still works
get_plugin_status still works
get_focused_rem still works
```

---

## 14. Completion Criteria

This issue is complete only when all are true:

```text
tools/list from ChatGPT shows 40 public tools
delete_rem is hidden by default
get_bridge_status reports publicToolCount 40
get_bridge_status publicTools exactly matches tools/list
get_bridge_diagnostics is callable from ChatGPT
get_bridge_diagnostics registryMismatch is empty
get_bridge_diagnostics hiddenTools includes delete_rem
get_bridge_diagnostics shows discoveryAuthMode and toolCallAuthMode
base 8 tools still work
all safe read tools are callable
focused_rem_and_descendants works
created children under focused Rem can be read back
outside Rems remain blocked by scope
create_rem_tree works on sandbox Rem
update_rem works on sandbox Rem
move_rem works on sandbox Rem
reorder_children works on sandbox Rem
create_document works or returns structured SDK_UNSUPPORTED if applicable
create_folder returns structured SDK_UNSUPPORTED unless real SDK support exists
rich/styled/card tools either work correctly or return structured SDK_UNSUPPORTED/SDK_ERROR
delete_focused_rem and delete_selected_rem require approval and DELETE
failed calls do not terminate MCP session
approval reject resolves
approval timeout resolves
plugin disconnect resolves
all validation commands pass
manual QA evidence is recorded
```

---

## 15. Recommended Issue Title

```text
Verify live ChatGPT exposure and real RemNote execution for 40-tool MCP bridge
```

Alternative:

```text
Do not close: source registry parity fixed, but live ChatGPT + RemNote QA still required
```

---

## 16. Recommended GitHub Issue Body

```md
## Summary

The latest `main` source now defines a 40-public-tool MCP registry plus one gated hidden `delete_rem` tool. Source-level registry parity appears implemented, and mock smoke tests verify that `tools/list` matches the public registry.

However, this should not be closed until the live ChatGPT-facing MCP endpoint and real RemNote plugin session prove that the same 40 tools are discoverable and callable.

## Current source state

- `toolRegistryVersion`: `2026-05-10.1`
- `mcpDiscoveryVersion`: `mcp-discovery-2026-05-10.1`
- Public tools: 40
- Hidden tools: `delete_rem`
- Discovery methods allow no-auth path for `initialize`, `notifications/initialized`, and `tools/list`
- Smoke tests compare `tools/list` against `getPublicMcpToolNames(false)`

## Remaining risk

The current code may be correct while ChatGPT still sees only 8 tools if:

- old companion server process is still running
- ChatGPT connector cached stale tools/list
- tunnel points to wrong local process
- MCP URL points to old ngrok URL
- tool calls are token-gated even though discovery works
- RemNote plugin panel is running old bundled code
- real SDK behavior differs from mock smoke behavior

## Do not mark complete until

- ChatGPT `tools/list` shows 40 public tools
- `delete_rem` is hidden by default
- `get_bridge_status.publicTools` equals `tools/list`
- `get_bridge_diagnostics.registryMismatch` is empty
- representative read/write/rich/card tools are callable from ChatGPT
- real RemNote SDK behavior is verified on sandbox notes
- failed calls do not terminate the MCP session
- approval reject/timeout/disconnect paths resolve cleanly

## Required live tests

1. Refresh ChatGPT connector/app tool discovery.
2. Confirm `tools/list` returns 40 tools.
3. Call `get_bridge_diagnostics`.
4. Confirm:
   - `publicToolCount = 40`
   - `registryMismatch.missing = []`
   - `registryMismatch.unexpected = []`
   - `deleteToolExposed = false`
   - `hiddenTools` includes `delete_rem`
5. Call all base read tools.
6. Run sandbox write tests for:
   - `create_rem`
   - `append_to_rem`
   - `create_rem_tree`
   - `update_rem`
   - `move_rem`
   - `reorder_children`
7. Run rich/styled/card tools and record whether each truly works or returns structured unsupported/error.
8. Verify delete tools require approval and typed `DELETE`.
9. Verify bad calls return structured errors and session remains alive.

## Final status wording

Use:

> Source-level 40-tool registry parity appears fixed in latest main. Live ChatGPT + real RemNote QA remains required before closing.

Do not use:

> Complete.
```

---

## 17. Recommended `QA_LIVE.md` Template

```md
# Live QA — RemNote ChatGPT Bridge

Date:
Tester:
Commit SHA:
Ngrok URL:
RemNote version:
Plugin bundle build time:
Companion server start time:

## Environment

```text
REMNOTE_BRIDGE_ALLOW_NO_TOKEN=
REMNOTE_BRIDGE_TOKEN=set/unset
REMNOTE_BRIDGE_ENABLE_DELETE_TOOL=
MCP URL=
```

## Registry

| Check | Result | Notes |
|---|---|---|
| tools/list count = 40 | pass/fail | |
| get_bridge_status count = 40 | pass/fail | |
| publicTools equals tools/list | pass/fail | |
| registryMismatch empty | pass/fail | |
| delete_rem hidden | pass/fail | |
| get_bridge_diagnostics callable | pass/fail | |

## Read tools

| Tool | Result | Notes |
|---|---|---|
| get_focused_rem | pass/fail | |
| get_rem | pass/fail | |
| get_rem_tree | pass/fail | |
| get_rem_rich | pass/fail | |
| get_current_selection | pass/fail | |
| get_children | pass/fail | |
| get_rem_breadcrumbs | pass/fail | |
| search_rems | pass/fail | |
| get_document_or_folder_tree | pass/fail | |

## Write tools

| Tool | Result | Notes |
|---|---|---|
| create_rem | pass/fail | |
| append_to_rem | pass/fail | |
| create_rem_tree | pass/fail | |
| create_document | pass/fail | |
| create_folder | pass/fail/unsupported | |
| update_rem | pass/fail | |
| move_rem | pass/fail | |
| reorder_children | pass/fail | |
| replace_rem | pass/fail | |

## Rich/styled/card tools

| Tool | Result | Notes |
|---|---|---|
| update_rem_rich | pass/fail/unsupported | |
| set_rem_heading_level | pass/fail/unsupported | |
| set_rem_text_color | pass/fail/unsupported | |
| set_rem_highlight_color | pass/fail/unsupported | |
| set_text_span_color | pass/fail/unsupported | |
| set_text_span_highlight | pass/fail/unsupported | |
| set_rem_type | pass/fail/unsupported | |
| set_hide_bullet | pass/fail/unsupported | |
| clear_rem_formatting | pass/fail/unsupported | |
| create_styled_rem_tree | pass/fail/unsupported | |
| create_basic_flashcard | pass/fail/unsupported | |
| create_concept_card | pass/fail/unsupported | |
| create_descriptor_card | pass/fail/unsupported | |
| create_cloze_card | pass/fail/unsupported | |
| create_multiple_choice_card | pass/fail/unsupported | |
| create_list_answer_card | pass/fail/unsupported | |

## Delete tools

| Tool | Result | Notes |
|---|---|---|
| delete_focused_rem requires approval | pass/fail | |
| delete_focused_rem requires DELETE | pass/fail | |
| delete_selected_rem requires approval | pass/fail | |
| delete_selected_rem requires DELETE | pass/fail | |
| delete_rem hidden by default | pass/fail | |

## Failure survival

| Failure | Expected | Result |
|---|---|---|
| bad Rem ID | structured error | pass/fail |
| out-of-scope Rem | OUT_OF_SCOPE | pass/fail |
| rejected approval | APPROVAL_REJECTED | pass/fail |
| approval timeout | APPROVAL_TIMEOUT | pass/fail |
| plugin disconnect | PLUGIN_NOT_CONNECTED | pass/fail |
| caller disconnect | CLIENT_DISCONNECTED | pass/fail |
| status after failure | still works | pass/fail |
```

---

## 18. Final Recommendation

The repo is much closer now.

But the responsible final state is:

```text
Source-level registry parity: likely fixed.
Mock MCP smoke parity: likely fixed if server:smoke passes.
Live ChatGPT exposure: still must be verified.
Real RemNote SDK behavior: still must be verified.
Approval/session failure survival: still must be verified live.
```

Therefore:

```text
Do not close the issue yet.
Run live ChatGPT + RemNote QA.
Record a QA matrix.
Only then mark complete.
```
