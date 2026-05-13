# AGENTS.md

## Purpose

This file gives AI coding agents strict instructions for working in this repository.

This repository is the **RemNote ChatGPT Bridge**.

The goal is **not** to build an AI chatbot inside RemNote.

The goal is to let ChatGPT / Vivy use RemNote through a safe, typed, permissioned, auditable bridge.

The expected architecture is:

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

---

# 1. Current State and Main Diagnosis

The bridge has improved significantly.

Basic connectivity works.

The plugin can connect to the local companion server.

The MCP endpoint can be reached by ChatGPT through a tunnel.

The following tools are currently public and callable through the MCP layer:

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
```

Observed bridge status after the 2026-05-10 rich-note closeout:

```text
connected: true
pendingRequests: 0
toolRegistryVersion: 2026-05-10.1
mcpDiscoveryVersion: mcp-discovery-2026-05-10.1
publicToolCount: 40
discoveryAuthMode: no_auth_required
deleteToolExposed: false
registryMismatch: []
```

The earlier 8-tool ChatGPT exposure bug had two layers: stale MCP-facing tool registration and token-gated discovery. The server now records registered MCP tools, compares them with the public registry at startup, allows no-auth `initialize`/`tools/list` for ChatGPT refresh, reports auth/discovery/callable fields through diagnostics, and smoke-tests `tools/list` parity.

---

# 2. Product Rule

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

# 3. Absolute Non-Negotiable Rules

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

Do not implement everything in one giant patch.

Do not break the currently working 8 tools.

Do not remove the approval model.

Do not let failed write calls terminate the MCP session.

---

# 4. Current Major Issues to Fix

## 4.1 Tool Registry Mismatch

Former problem:

```text
Bridge reports 40 public tools.
MCP tools/list exposes the same 40 public tools, including rich note, styled tree, and card tools.
```

This means the bridge has an internal registry that is not correctly wired to the ChatGPT-facing MCP tool registry.

Status:

```text
DONE 2026-05-09
```

Required invariant:

```text
The MCP tools/list response must expose the same public tools that get_bridge_status reports.
```

The tool registry must have one source of truth.

Avoid this bad architecture:

```text
server has registry A
MCP layer has registry B
bridge status reports registry A
ChatGPT sees registry B
```

Preferred architecture:

```text
shared tool registry
↓
get_bridge_status uses it
↓
MCP tools/list uses it
↓
tool router uses it
↓
diagnostics uses it
```

Acceptance test:

```text
tools/list shows all public tools.
get_bridge_status publicTools matches tools/list.
get_bridge_diagnostics is callable.
get_rem_rich is callable.
get_current_selection is callable.
get_children is callable.
get_rem_breadcrumbs is callable.
search_rems is callable if implemented.
get_document_or_folder_tree is callable if implemented.
create_rem_tree is callable.
update_rem is callable.
move_rem is callable.
reorder_children is callable.
```

Delete tools require extra safety and should not be casually exposed.

---

## 4.2 Hidden Tools Are Reported but Not Callable

The bridge reports these tools, but ChatGPT cannot call them:

```text
get_bridge_diagnostics
get_rem_rich
get_current_selection
get_children
get_rem_breadcrumbs
search_rems
get_document_or_folder_tree
create_document
create_folder
update_rem
replace_rem
move_rem
reorder_children
delete_focused_rem
delete_selected_rem
create_rem_tree
```

Required behavior:

If a tool is reported as public, it must be callable.

If a tool is not implemented, it must not be reported as public.

If a tool is intentionally hidden, diagnostics must explain why.

Add diagnostic fields:

```text
registeredTools
publicTools
exposedTools
callableTools
hiddenTools
hiddenReasons
mcpDiscoveryVersion
lastDiscoveryRefreshAt
serverToolRegistryVersion
pluginProtocolVersion
```

---

## 4.3 Permission Scope Is Too Restrictive

Current plugin status can show:

```text
permissionMode: confirm_writes
permissionScope: focused_rem_only
```

This is safe, but it creates workflow friction.

Observed problem:

```text
ChatGPT creates a child under the focused Rem.
The bridge returns the child Rem ID.
ChatGPT tries to read that child back.
The plugin returns OUT_OF_SCOPE.
```

Required improvement:

Add or expose these permission scopes:

```text
focused_rem_only
focused_rem_and_descendants
selected_rem_only
selected_rem_and_descendants
approved_document_or_folder
workspace_allowed
```

Recommended default for serious editing:

```text
focused_rem_and_descendants
```

Keep `focused_rem_only` available for strict safety.

Required rule:

```text
A Rem created by the current request/session under the focused Rem should be readable for verification.
```

Do not allow arbitrary workspace writes by default.

---

## 4.4 Approval Flow Must Never Hang

Approval has improved, but it must be made strict.

Every write request must resolve as one of:

```text
APPROVED
APPROVAL_REJECTED
APPROVAL_TIMEOUT
SDK_ERROR
INTERNAL_ERROR
```

No write request may hang indefinitely.

Required timeout:

```ts
const WRITE_APPROVAL_TIMEOUT_MS = 30000;
```

This value should be configurable in one place.

Required behavior:

```text
User approves
→ tool returns success

User rejects
→ tool returns APPROVAL_REJECTED

User does nothing
→ tool returns APPROVAL_TIMEOUT

SDK fails
→ tool returns SDK_ERROR

Plugin disconnects
→ tool returns PLUGIN_NOT_CONNECTED
```

After any failure, these tools must still work:

```text
get_bridge_status
ping_remnote_plugin
get_plugin_status
get_focused_rem
```

---

## 4.5 Read Tools Need Richer RemNote Awareness

Current read tools mostly return:

```text
frontText
backText
plainText
breadcrumbs
hasChildren
children
```

Needed richer read tools:

```text
get_rem_rich
get_current_selection
get_children
get_rem_breadcrumbs
search_rems
get_document_or_folder_tree
```

Required behavior:

If the SDK does not support a field, return:

```json
{
  "supported": false,
  "reason": "SDK does not expose this field"
}
```

Do not fake visual layout information.

Do not claim to know cursor position, collapsed state, or scroll position if the SDK does not expose it.

---

## 4.6 Markdown Alone Is Not Enough

Plain markdown can create readable notes, but it does not reliably create proper RemNote-native layout.

Bad result:

```text
Mini Note
  One giant text block containing:
  ## Main decay law
  ## Half-life relation
  ## Interpretation
```

Better result:

```text
Mini Note — Exponential Decay and Half-Life
  Core Idea
    Exponential decay describes...
  Main Decay Law
    N(t)=N₀e^(-λt)
  Half-Life Relation
    T₁/₂ = ln(2)/λ
  Interpretation
    Larger λ means shorter half-life.
```

Required tool:

```text
create_rem_tree
```

Future tool:

```text
create_styled_rem_tree
```

Do not rely on one markdown string for complex nested RemNote outlines.

---

# 5. Required Tool Registry Target

The strong RemNote bridge should eventually support this tool set.

## 5.1 Status Tools

```text
get_bridge_status
get_bridge_diagnostics
ping_remnote_plugin
get_plugin_status
```

## 5.2 Read Tools

```text
get_focused_rem
get_current_selection
get_rem
get_rem_tree
get_rem_rich
get_children
get_rem_breadcrumbs
search_rems
get_document_or_folder_tree
```

## 5.3 Create Tools

```text
create_rem
append_to_rem
create_rem_tree
create_document
create_folder
```

## 5.4 Update and Organization Tools

```text
update_rem
move_rem
reorder_children
```

## 5.5 Dangerous Tools

These require strict handling:

```text
replace_rem
delete_focused_rem
delete_selected_rem
```

Do not expose arbitrary delete by default.

Do not expose arbitrary recursive delete by default.

Do not expose workspace-wide delete.

---

# 6. Tools to Expose First

Fix tool exposure in this order.

## Phase A: Diagnostics and Read Tools

Expose and verify:

```text
get_bridge_diagnostics
get_rem_rich
get_current_selection
get_children
get_rem_breadcrumbs
```

These are safe read-oriented tools and should be exposed first.

## Phase B: Search and Tree Navigation

Expose and verify:

```text
search_rems
get_document_or_folder_tree
```

These can expose broader data, so enforce limits.

Required limits:

```text
max results
max depth
max characters
scope filter
truncated flag
```

## Phase C: Safe Create and Tree Tools

Expose and verify:

```text
create_rem_tree
create_document
create_folder
```

These require approval in `confirm_writes`.

## Phase D: Update and Move Tools

Expose and verify:

```text
update_rem
move_rem
reorder_children
```

These require approval in `confirm_writes`.

Moving Rems with children must always be treated as higher risk.

## Phase E: Dangerous Tools

Only after the above works, consider:

```text
replace_rem
delete_focused_rem
delete_selected_rem
```

These must always require explicit approval.

Delete must require typed confirmation:

```text
DELETE
```

---

# 7. Tool Schemas

## 7.1 get_bridge_diagnostics

Input:

```json
{}
```

Expected output:

```json
{
  "serverVersion": "string",
  "pluginVersion": "string",
  "toolRegistryVersion": "string",
  "registeredTools": ["string"],
  "publicTools": ["string"],
  "exposedTools": ["string"],
  "callableTools": ["string"],
  "hiddenTools": [
    {
      "name": "string",
      "reason": "string"
    }
  ],
  "mcpDiscoveryVersion": "string",
  "lastDiscoveryRefreshAt": "string",
  "pendingRequests": 0,
  "recentErrors": [],
  "recentRequestLifecycle": []
}
```

---

## 7.2 get_rem_rich

Input:

```json
{
  "remId": "string"
}
```

Expected output:

```json
{
  "remId": "string",
  "frontText": "string",
  "backText": "string",
  "plainText": "string",
  "richSupported": true,
  "rich": {
    "front": [],
    "back": []
  },
  "detectedContentTypes": [
    "plain_text",
    "inline_math",
    "math_block",
    "descriptor",
    "concept"
  ]
}
```

If unsupported:

```json
{
  "remId": "string",
  "richSupported": false,
  "reason": "SDK does not expose normalized rich text"
}
```

---

## 7.3 get_current_selection

Input:

```json
{}
```

Expected output:

```json
{
  "focusedRemId": "string or null",
  "selectedRemIds": ["string"],
  "selectionSupported": true
}
```

If unsupported:

```json
{
  "focusedRemId": "string or null",
  "selectedRemIds": [],
  "selectionSupported": false,
  "reason": "SDK does not expose current selection"
}
```

---

## 7.4 get_children

Input:

```json
{
  "remId": "string"
}
```

Expected output:

```json
{
  "remId": "string",
  "children": [
    {
      "remId": "string",
      "frontText": "string",
      "plainText": "string",
      "index": 0,
      "hasChildren": true
    }
  ],
  "childCount": 1
}
```

---

## 7.5 get_rem_breadcrumbs

Input:

```json
{
  "remId": "string"
}
```

Expected output:

```json
{
  "remId": "string",
  "breadcrumbs": [
    {
      "remId": "string",
      "text": "string"
    }
  ]
}
```

---

## 7.6 search_rems

Input:

```json
{
  "query": "string",
  "limit": 10,
  "scope": "focused_rem_and_descendants"
}
```

Rules:

```text
limit must be capped
scope must be enforced
do not return full workspace by default
return truncated flag if results are limited
```

Expected output:

```json
{
  "query": "string",
  "results": [
    {
      "remId": "string",
      "frontText": "string",
      "breadcrumbs": ["string"]
    }
  ],
  "truncated": false
}
```

---

## 7.7 create_rem_tree

Input:

```json
{
  "parentId": "string",
  "position": "end",
  "tree": {
    "title": "Clean Organized Notes",
    "children": [
      {
        "title": "1. Purpose",
        "children": [
          {
            "title": "This note organizes the Plugin Test content."
          }
        ]
      }
    ]
  }
}
```

Limits:

```ts
const CREATE_TREE_MAX_DEPTH = 5;
const CREATE_TREE_MAX_NODES = 100;
const CREATE_TREE_MAX_TITLE_LENGTH = 1000;
```

Expected output:

```json
{
  "rootCreatedRemId": "string",
  "createdNodeCount": 12,
  "createdRemIds": ["string"],
  "status": "created_tree"
}
```

Rules:

```text
one approval request for the whole tree
preserve order
return created IDs
do not silently exceed limits
return structured error on partial failure
do not terminate MCP session
```

---

## 7.8 update_rem

Input:

```json
{
  "remId": "string",
  "markdown": "string"
}
```

Expected output:

```json
{
  "updatedRemId": "string",
  "status": "updated"
}
```

Rules:

```text
require approval in confirm_writes
preserve children unless explicitly replacing tree
do not delete descendants
return REM_NOT_FOUND if missing
return OUT_OF_SCOPE if not allowed
```

---

## 7.9 move_rem

Input:

```json
{
  "remId": "string",
  "newParentId": "string",
  "index": 0
}
```

Expected output:

```json
{
  "movedRemId": "string",
  "newParentId": "string",
  "index": 0,
  "status": "moved"
}
```

Rules:

```text
validate source Rem
validate target parent
validate index
prevent moving a Rem into itself
prevent moving a Rem into its descendant
require approval
higher risk if Rem has children
```

---

## 7.10 reorder_children

Input:

```json
{
  "parentId": "string",
  "orderedChildIds": ["string"]
}
```

Expected output:

```json
{
  "parentId": "string",
  "orderedChildIds": ["string"],
  "status": "reordered"
}
```

Rules:

```text
all child IDs must belong to parent
do not drop children silently
require approval
return INVALID_ARGS if list is inconsistent
```

---

## 7.11 delete_focused_rem

Input:

```json
{
  "confirmText": "DELETE",
  "recursive": false
}
```

Expected output:

```json
{
  "deletedRemId": "string",
  "recursive": false,
  "status": "deleted"
}
```

Rules:

```text
must always require approval
must require confirmText DELETE
must show target title
must show child count
must warn about descendants
must not delete silently
must not run in trusted_writes without approval
```

---

## 7.12 delete_selected_rem

Input:

```json
{
  "confirmText": "DELETE",
  "recursive": false
}
```

Rules:

```text
same as delete_focused_rem
only delete currently selected Rem
do not allow arbitrary ID delete by default
```

---

# 8. Rich and Styled RemNote Support

The current bridge is too markdown-heavy.

Add rich/styled tools later, after tool exposure mismatch is fixed.

Do not implement these until the normal tool registry is correct.

## 8.1 Future Styled Tree Tool

Future tool:

```text
create_styled_rem_tree
```

Input shape:

```json
{
  "parentId": "string",
  "position": "end",
  "tree": {
    "text": "Mini Note — Exponential Decay and Half-Life",
    "style": {
      "headingLevel": "H1",
      "textColor": "blue",
      "highlightColor": "none",
      "hideBullet": true,
      "bold": true
    },
    "children": [
      {
        "text": "Main Decay Law",
        "style": {
          "headingLevel": "H2",
          "textColor": "yellow"
        },
        "children": [
          {
            "text": "If a quantity starts at N₀..."
          },
          {
            "type": "mathBlock",
            "latex": "N(t)=N_0e^{-\\lambda t}"
          }
        ]
      }
    ]
  }
}
```

If RemNote SDK does not support styling, return:

```text
SDK_UNSUPPORTED
```

Do not fake styling with emojis.

---

## 8.2 Future Formatting Tools

Potential future tools:

```text
set_rem_heading_level
set_rem_text_color
set_rem_highlight_color
set_rem_type
set_hide_bullet
clear_rem_formatting
```

These require SDK investigation first.

---

## 8.3 Future Flashcard Tools

Potential future tools:

```text
create_basic_flashcard
create_concept_card
create_descriptor_card
create_cloze_card
create_multiple_choice_card
create_list_answer_card
```

Do not add these until normal tree creation and update tools are stable.

---

# 9. Error Handling Requirements

All errors must be structured.

Use error codes:

```text
INVALID_ARGS
REM_NOT_FOUND
PARENT_NOT_FOUND
OUT_OF_SCOPE
PERMISSION_DENIED
APPROVAL_REJECTED
APPROVAL_TIMEOUT
PLUGIN_NOT_CONNECTED
SDK_UNSUPPORTED
SDK_ERROR
UNKNOWN_TOOL
TIMEOUT
INTERNAL_ERROR
```

Example response:

```json
{
  "ok": false,
  "error": {
    "code": "OUT_OF_SCOPE",
    "message": "Request target is outside the focused Rem scope.",
    "details": {
      "focusedRemId": "string",
      "targetRemIds": ["string"]
    }
  }
}
```

A failed request must not:

```text
terminate the MCP session
close the WebSocket
clear unrelated plugin state
leave approval request stuck
report success incorrectly
```

---

# 10. Approval UI Requirements

The approval UI must show:

```text
tool name
risk level
target Rem title
target Rem ID
parent title
insert position
preview content
deadline
Approve button
Reject button
```

For delete:

```text
typed DELETE confirmation
child count
descendant count if available
recursive warning
```

The approval UI must always resolve the request.

Approve must send success or SDK error.

Reject must send:

```text
APPROVAL_REJECTED
```

Timeout must send:

```text
APPROVAL_TIMEOUT
```

---

# 11. Scope and Permission Requirements

Keep permission modes:

```text
read_only
confirm_writes
trusted_writes
danger_zone
```

Add or expose permission scopes:

```text
focused_rem_only
focused_rem_and_descendants
selected_rem_only
selected_rem_and_descendants
approved_document_or_folder
workspace_allowed
```

Default safe scope:

```text
focused_rem_only
```

Recommended practical scope:

```text
focused_rem_and_descendants
```

Rules:

```text
read_only allows only read tools
confirm_writes requires approval for writes
trusted_writes can allow safe create/update/move only inside scope
delete always requires approval
replace always requires approval
workspace_allowed should not be default
```

---

# 12. Logging Requirements

Logs should include:

```text
request ID
tool name
approval state
permission mode
permission scope
target Rem IDs
created Rem IDs
error code
duration
```

Logs should not include full private note content by default.

Avoid logging:

```text
full markdown body
full Rem tree
full workspace search result
full rich text object
```

unless debug mode is explicitly enabled.

---

# 13. Files to Inspect

Before coding, inspect:

```text
src/bridge/protocol.ts
src/bridge/handlers.ts
src/bridge/client.ts
src/bridge/status.ts
src/remnote/read.ts
src/remnote/write.ts
src/remnote/serialize.ts
src/remnote/permissions.ts
src/widgets/bridge-status.tsx
server/src/index.ts
server/src/websocket.ts
server/src/tool-router.ts
server/src/tools.ts
server/src/mcp-server.ts
server/src/auth.ts
server/src/logs.ts
```

Also inspect:

```text
node_modules/@remnote/plugin-sdk
```

Find real SDK support for:

```text
creating Rems
setting text
setting backText
setting parent
moving Rems
ordering children
deleting Rems
reading children
reading breadcrumbs
reading rich text
searching Rems
selection state
document/folder tree
heading/style formatting
math objects
flashcard syntax or card APIs
```

Do not assume SDK method names.

Do not call unsupported SDK endpoints.

---

# 14. Required Implementation Order

Do not implement everything in one patch.

## Milestone 1: Tool Registry Unification

Goal:

```text
MCP tools/list and get_bridge_status report the same public callable tools.
```

Tasks:

```text
find all tool registries
remove duplicate stale registry
create one source of truth
make tools/list use same registry as get_bridge_status
add get_bridge_diagnostics
add hiddenTools and hiddenReasons
```

Acceptance:

```text
tools/list exposes all public tools
get_bridge_status publicTools matches tools/list
calling get_bridge_diagnostics works
calling unknown tool returns UNKNOWN_TOOL, not Resource not found
```

---

## Milestone 2: Expose Safe Read Tools

Expose and verify:

```text
get_rem_rich
get_current_selection
get_children
get_rem_breadcrumbs
```

Acceptance:

```text
all appear in tools/list
all are callable
unsupported rich/selection fields return supported=false
read tools respect scope
```

---

## Milestone 3: Scope Improvements

Add or expose:

```text
focused_rem_and_descendants
```

Acceptance:

```text
created child under focused Rem can be read back
descendants of focused Rem are in scope
outside Rems still return OUT_OF_SCOPE
```

---

## Milestone 4: Tree Creation

Expose and verify:

```text
create_rem_tree
```

Acceptance:

```text
one approval request creates a nested tree
order is preserved
response returns createdNodeCount and createdRemIds
limits are enforced
failed creation does not terminate session
```

---

## Milestone 5: Update and Move

Expose and verify:

```text
update_rem
move_rem
reorder_children
```

Acceptance:

```text
update_rem changes text and preserves children
move_rem moves a Rem to a new parent/index
reorder_children changes child order
all require approval in confirm_writes
errors do not terminate session
```

---

## Milestone 6: Delete Tools

Expose only safe delete tools:

```text
delete_focused_rem
delete_selected_rem
```

Do not expose arbitrary delete by ID yet unless explicitly approved by the user.

Acceptance:

```text
delete requires approval
delete requires confirmText DELETE
delete shows target title and child count
reject deletes nothing
timeout deletes nothing
success returns deletedRemId
```

---

## Milestone 7: Rich and Styled Tools

Only after previous milestones work, investigate:

```text
create_styled_rem_tree
set_rem_heading_level
set_rem_text_color
set_rem_highlight_color
set_hide_bullet
create_math_block
create_inline_math
```

Do not fake rich styling with emojis.

If SDK does not support styling, return:

```text
SDK_UNSUPPORTED
```

---

# 15. Validation Commands

Run these after changes:

```bash
npm run check-types
```

```bash
npm run validate
```

```bash
npm run build
```

```bash
npm run server:build
```

```bash
npm run server:smoke
```

All must pass before stopping.

---

# 16. Manual Test Setup

Start RemNote plugin dev server:

```bash
npm run dev
```

Start companion server in local no-token mode:

```bash
export REMNOTE_BRIDGE_ALLOW_NO_TOKEN=1
unset REMNOTE_BRIDGE_TOKEN
npm run server:dev
```

If using ChatGPT through ngrok:

```bash
ngrok http --host-header=localhost:47392 47392
```

Use MCP URL:

```text
https://YOUR-NGROK-URL/mcp
```

---

# 17. Manual Test Plan

Use only sandbox notes.

Example sandbox Rem:

```text
Plugin Test → notes
Rem ID: jCxriMiSyUVAJoKfh
```

## Test 1: Tool Registry

Call:

```text
tools/list
```

Expected:

```text
all public tools are listed
get_bridge_diagnostics is listed
get_rem_rich is listed
create_rem_tree is listed
update_rem is listed
move_rem is listed
```

Then call:

```text
get_bridge_status
```

Expected:

```text
publicTools matches tools/list
publicToolCount matches callable tool count
```

Then call:

```text
get_bridge_diagnostics
```

Expected:

```text
diagnostics returns registeredTools, exposedTools, callableTools, hiddenTools
```

---

## Test 2: Read Descendant Scope

Set permission scope:

```text
focused_rem_and_descendants
```

Create a child under focused Rem.

Then call:

```text
get_rem
```

on the created child ID.

Expected:

```text
child is readable
no OUT_OF_SCOPE error
```

---

## Test 3: Create Rem Tree

Call:

```json
{
  "tool": "create_rem_tree",
  "args": {
    "parentId": "jCxriMiSyUVAJoKfh",
    "position": "end",
    "tree": {
      "title": "Mini Note — Exponential Decay and Half-Life",
      "children": [
        {
          "title": "Core Idea",
          "children": [
            {
              "title": "Exponential decay describes a quantity that decreases by a constant fraction per unit time."
            }
          ]
        },
        {
          "title": "Main Decay Law",
          "children": [
            {
              "title": "N(t)=N₀e^(-λt)"
            }
          ]
        },
        {
          "title": "Half-Life Relation",
          "children": [
            {
              "title": "T₁/₂ = ln(2)/λ"
            }
          ]
        }
      ]
    }
  }
}
```

Expected:

```text
one approval appears
approval creates nested Rem tree
order is preserved
response includes createdNodeCount and createdRemIds
```

---

## Test 4: Update Rem

Call:

```json
{
  "tool": "update_rem",
  "args": {
    "remId": "TARGET_REM_ID",
    "markdown": "Updated text"
  }
}
```

Expected:

```text
approval appears
approve updates Rem
children remain intact
response includes updatedRemId
```

---

## Test 5: Move Rem

Call:

```json
{
  "tool": "move_rem",
  "args": {
    "remId": "CHILD_REM_ID",
    "newParentId": "jCxriMiSyUVAJoKfh",
    "index": 0
  }
}
```

Expected:

```text
approval appears
approve moves Rem
response includes movedRemId
order changes correctly
```

---

## Test 6: Reorder Children

Call:

```json
{
  "tool": "reorder_children",
  "args": {
    "parentId": "jCxriMiSyUVAJoKfh",
    "orderedChildIds": ["CHILD_ID_1", "CHILD_ID_2"]
  }
}
```

Expected:

```text
approval appears
approve reorders children
no children are dropped silently
```

---

## Test 7: Delete Focused Rem

Only test on a temporary Rem.

Call:

```json
{
  "tool": "delete_focused_rem",
  "args": {
    "confirmText": "DELETE",
    "recursive": false
  }
}
```

Expected:

```text
approval appears
delete warning is clear
reject deletes nothing
approve deletes only the intended focused Rem
response includes deletedRemId
```

---

## Test 8: Failure Does Not Kill Session

Call a tool with a bad ID:

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
returns REM_NOT_FOUND
session remains alive
get_bridge_status still works
ping_remnote_plugin still works
```

---

# 18. Acceptance Criteria

This update is complete only when:

```text
MCP tools/list exposes the same public tools reported by get_bridge_status
get_bridge_diagnostics is callable
hidden tools have hidden reasons
safe read tools are callable
focused_rem_and_descendants scope works
newly created descendants can be read back
create_rem_tree works
update_rem works
move_rem works
reorder_children works
delete_focused_rem and delete_selected_rem are strictly approval-gated
approval requests always resolve
failed tools do not terminate MCP session
existing base tools still work
all validation commands pass
```

---

# 19. Required Output Before Coding

Before coding, produce a short plan covering:

```text
current tool registry locations
why get_bridge_status and MCP tools/list must report the same public registry
which files will change
which tools are truly implemented already
which tools are registry-only stubs
which tools are unsupported by the RemNote SDK
how tools/list will be unified with publicTools
how delete tools will be safely gated
how permission scopes will be updated
test plan
```

Then implement in small milestones.

Do not begin with rich styling.

Do not begin with flashcards.

Do not begin with arbitrary delete.

Fix the registry mismatch first.

---

# 20. Completion Audit - 2026-05-09

Final status:

```text
DONE
```

Nine requested tasks:

```text
1. Milestone 1 - DONE
2. Milestone 2 - DONE
3. Milestone 3 - DONE
4. Milestone 4 - DONE
5. Milestone 5 - DONE
6. Milestone 6 - DONE
7. Milestone 7 - DONE
8. Agents.md fulfillment check - DONE
9. Final audit and validation - DONE
```

## 20.1 Milestone 1 - Tool Registry Unification

Status:

```text
DONE
```

Evidence:

```text
server/src/tool-registry.ts is the shared public/hidden registry source.
server/src/mcp-server.ts records registered MCP tools and asserts parity at startup.
get_bridge_status and get_bridge_diagnostics return the same public tool list that tools/list exposes.
delete_rem remains hidden by default with an explicit hidden reason.
Unknown MCP tool calls return structured UNKNOWN_TOOL.
```

## 20.2 Milestone 2 - Safe Read Tools

Status:

```text
DONE
```

Exposed and smoke-called:

```text
get_rem_rich
get_current_selection
get_children
get_rem_breadcrumbs
```

The read response shapes include support metadata where SDK capability can vary.

## 20.3 Milestone 3 - Scope Improvements

Status:

```text
DONE
```

Implemented scopes:

```text
focused_rem_and_descendants
selected_rem_and_descendants
```

The old persisted `descendants_of_selected_rem` value is normalized to `selected_rem_and_descendants` for compatibility.

## 20.4 Milestone 4 - Tree Creation

Status:

```text
DONE
```

Evidence:

```text
create_rem_tree is public.
position is accepted.
rootInsertPosition is returned.
createdNodeCount and createdRemIds remain part of the result.
server:smoke verifies ordered tree creation.
```

## 20.5 Milestone 5 - Update and Move

Status:

```text
DONE
```

Smoke-called tools:

```text
update_rem
move_rem
reorder_children
```

`reorder_children` accepts manual-test aliases `parentId` and `orderedChildIds` while preserving canonical bridge fields.

## 20.6 Milestone 6 - Delete Tools

Status:

```text
DONE
```

Public delete tools:

```text
delete_focused_rem
delete_selected_rem
```

Safety status:

```text
delete_rem remains hidden unless REMNOTE_BRIDGE_ENABLE_DELETE_TOOL=1 is set.
Delete tools require confirmText DELETE.
Delete tools keep destructive MCP annotations.
Delete tools use plugin-side approval.
```

## 20.7 Milestone 7 - Rich and Styled Tools

Status:

```text
DONE AS SDK-BACKED PUBLIC TOOL EXPOSURE
```

SDK findings:

```text
Installed SDK typings expose text, back text, parent/order, remove, children, descendants, search, selection, document marking, font size, highlight color, rich text formatting, and LaTeX helpers.
Installed SDK typings do not expose a complete folder creation API.
Installed SDK typings expose list-item toggling; `set_hide_bullet` uses that SDK path and reports the explicit state change.
```

Decision:

```text
Expose create_styled_rem_tree, set_hide_bullet, math/styling write tools, and card helpers only through typed public contracts and smoke tests.
Do not use slash-command text as styling.
create_folder continues to return SDK_UNSUPPORTED.
```

## 20.8 Agents.md Fulfillment Check

Status:

```text
DONE
```

All acceptance items in section 18 are covered by code, smoke tests, docs, or explicit SDK-unsupported handling.

## 20.9 Final Audit and Validation

Status:

```text
DONE
```

Commands run:

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

Results:

```text
All commands passed.
npm audit reported 0 vulnerabilities.
npm run build compiled successfully and wrote PluginZip.zip.
npm run server:smoke confirmed 40-tool registry parity, no-auth discovery, rich/styled/card tool calls, hidden delete_rem, UNKNOWN_TOOL handling, and failure paths keep the session alive.
```

Manual follow-up that still requires a real RemNote and ChatGPT session:

```text
Refresh the ChatGPT Developer Mode app/connector if ChatGPT still displays stale tool metadata.
Run the sandbox manual QA in NEXT_STEPS.md against a real RemNote knowledge base before public submission.
```
