# AGENTS.md

## Purpose of This File

This file gives AI coding agents strict instructions for working in this repository.

This repository is the **RemNote ChatGPT Bridge**.

It is no longer just a RemNote plugin prototype. The target is a production-grade bridge that lets ChatGPT/Vivy safely read, create, append, organize, update, move, and eventually delete RemNote content through a controlled MCP-compatible tool layer.

The final system must be safe enough to use outside ChatGPT Developer Mode and structured enough to become a normal secure MCP/App-style integration.

---

# 1. Product Direction

## 1.1 Target Product

The target architecture is:

```text
ChatGPT / Vivy
↓
MCP-compatible tool layer / future ChatGPT App
↓
Local or hosted companion server
↓
Authenticated bridge channel
↓
Running RemNote plugin
↓
RemNote SDK
↓
User's RemNote knowledge base
```

The RemNote plugin is the RemNote SDK executor.

The MCP/server layer is the tool and security layer.

ChatGPT/Vivy is the reasoning layer.

The plugin must not become an AI chatbot inside RemNote.

## 1.2 Core Product Goal

The product should make this workflow reliable:

```text
User opens RemNote.
User enables the RemNote Bridge plugin.
User connects ChatGPT/Vivy to the bridge.
User gives ChatGPT permission to work in a selected Rem, document, folder, or approved workspace scope.
ChatGPT reads the RemNote structure.
ChatGPT understands the order, hierarchy, and nesting of Rems.
ChatGPT appends new notes after existing content by default.
ChatGPT can create new Rems, documents, and folders when permitted.
ChatGPT can update/rewrite only under the selected permission mode.
ChatGPT can delete only with strict human supervision.
Every write is structured, logged, bounded, and recoverable as much as possible.
```

## 1.3 Main Principle

The bridge must be:

```text
ordered
typed
permissioned
auditable
secure
non-laggy
human-supervised for dangerous actions
```

Do not build loose command execution.

Do not build unbounded AI freedom.

Do not build silent destructive behavior.

---

# 2. Current Repository State

The current repository already contains a working local bridge foundation.

Important current files include:

```text
README.md
Agents.md
ARCHITECTURE.md
SAFETY.md
NEXT_STEPS.md
package.json

src/bridge/protocol.ts
src/bridge/client.ts
src/bridge/handlers.ts
src/bridge/status.ts

src/remnote/read.ts
src/remnote/write.ts
src/remnote/serialize.ts
src/remnote/permissions.ts

src/widgets/bridge-status.tsx
src/widgets/index.tsx

server/package.json
server/tsconfig.json
server/src/app.ts
server/src/bridge-hub.ts
server/src/config.ts
server/src/http.ts
server/src/index.ts
server/src/mcp-server.ts
server/src/smoke.ts
server/src/test-client.ts
```

The current package scripts include:

```bash
npm run check-types
npm run validate
npm run dev
npm run build
npm run server:install
npm run server:dev
npm run server:build
npm run server:smoke
npm run server:test-client
```

The current bridge already has these important pieces:

```text
- local companion server
- WebSocket plugin bridge
- bridge token support
- typed protocol
- read tools
- create/append/update/move/create-tree tools
- permission modes
- approval UI
- MCP-compatible server endpoint
```

Do not throw this away.

The job now is to harden it into a full app-quality bridge.

---

# 3. Non-Negotiable Rules for Coding Agents

## 3.1 Always Plan Before Coding

Before changing code, produce a concrete implementation plan.

The plan must include:

```text
- phase being implemented
- files to inspect
- files to modify
- files to create
- files to avoid touching
- current behavior
- target behavior
- safety risks
- tests to run
- manual RemNote test procedure
```

Do not code without a plan.

Do not combine multiple phases unless explicitly asked.

## 3.2 Work in Small Production Phases

This repository must be improved in separate phases.

Each phase must be independently reviewable.

Each phase must leave the repo buildable.

Do not rewrite the whole repo in one patch.

## 3.3 Preserve the Bridge Architecture

Do not reintroduce:

```text
- OpenAI API key inside RemNote settings
- direct OpenAI calls from the RemNote plugin
- AI chatbot UI inside RemNote
- prompt-copy workflow as the main product
- DOM scraping of RemNote or ChatGPT
- arbitrary command strings
- silent full-KB access
```

## 3.4 Use Typed Boundaries

Every bridge/tool/server/plugin boundary must use TypeScript types.

Use strict schemas for MCP tool input.

Avoid `any`.

If unknown SDK data must cross a boundary, normalize it first.

## 3.5 Default to Safety

The default product behavior must be:

```text
read allowed
create/append requires permission mode logic
rewrite/update requires stronger confirmation
move requires confirmation when risky
delete always requires strict human confirmation
bulk operations are disabled unless explicitly implemented with previews and limits
```

---

# 4. Product Safety Model

## 4.1 Permission Modes

The current modes are:

```ts
export type PermissionMode =
  | 'read_only'
  | 'confirm_writes'
  | 'trusted_writes'
  | 'danger_zone';
```

These modes should evolve into a clearer app-level model, but do not break existing settings without migration.

Target meaning:

| Mode | Meaning |
|---|---|
| `read_only` | ChatGPT can only read permitted RemNote context. |
| `confirm_writes` | Safe writes require user approval. This is the default. |
| `trusted_writes` | Safe create/append operations can happen without repeated approval inside the allowed scope. |
| `danger_zone` | Extra tools may be available, but destructive actions still require explicit approval. |

Dangerous actions must always confirm.

Even in `trusted_writes` or `danger_zone`, deletion must not run silently.

## 4.2 Future Scope Modes

Add these as explicit concepts during the permissions phase:

```text
focused_rem_only
selected_rem_only
descendants_of_selected_rem
approved_document_or_folder
workspace_allowed
```

The model should support both:

```text
restricted mode
free-roam mode
```

but free-roam must still be bounded by the RemNote plugin permission scope and bridge settings.

## 4.3 Action Classes

Classify tools into action classes:

```text
read
safe_create
safe_append
safe_organize
rewrite
move
destructive
bulk
admin
```

Rules:

```text
read -> allowed by read permission
safe_create -> may be allowed without approval in trusted mode
safe_append -> may be allowed without approval in trusted mode
safe_organize -> approval depends on scope and risk
rewrite -> approval required unless specifically allowed
move -> approval required when moving existing user content
destructive -> approval always required
bulk -> approval always required with preview
admin -> never automatic
```

---

# 5. Current Safety Issue to Fix

The documentation currently says destructive internal bridge tools should not be exposed through MCP, but the current MCP server registers `delete_rem`.

This must be fixed before treating the app as safe.

Until the delete phase is intentionally implemented, `delete_rem` must be one of:

```text
- removed from public MCP registration
- disabled behind a development-only flag
- blocked unless a strict delete safety gate passes
```

Do not leave public `delete_rem` casually exposed.

---

# 6. RemNote Ordering Rules

## 6.1 Default Insert Behavior

New notes must be added **after existing children** by default.

The default insert mode must be:

```text
append/end
```

Do not insert new notes above existing notes unless the user explicitly requests top/start insertion.

## 6.2 Ordered Tree Creation

When creating multiple Rems, preserve the exact order sent by ChatGPT.

For a tree like:

```json
{
  "title": "Main",
  "children": [
    { "title": "First" },
    { "title": "Second" },
    { "title": "Third" }
  ]
}
```

The resulting RemNote order must be:

```text
Main
  First
  Second
  Third
```

not reversed.

## 6.3 Fresh Parent State

Do not trust stale parent child counts during creation.

Before computing append index, refresh the parent from RemNote SDK if necessary.

Preferred helper:

```ts
async function getFreshInsertIndex(plugin, parentId, position) {
  const freshParent = await plugin.rem.findOne(parentId);
  if (!freshParent) throw ...
  return position === 'start' ? 0 : freshParent.children.length;
}
```

After creating a child, confirm or refresh the parent when doing sequential ordered operations.

## 6.4 Insert API Contract

The protocol should evolve from:

```ts
position?: 'start' | 'end'
```

to a clearer insert contract:

```ts
type InsertMode =
  | 'append'
  | 'prepend'
  | 'at_index';

interface InsertPosition {
  mode: InsertMode;
  index?: number;
}
```

Backward compatibility may keep `position?: 'start' | 'end'` temporarily, but the product should move toward explicit insert mode.

---

# 7. Target MCP Tools

The final bridge should expose tools in controlled groups.

## 7.1 Status Tools

```text
get_bridge_status
ping_remnote_plugin
get_plugin_status
```

## 7.2 Read Tools

```text
get_focused_rem
get_current_selection
get_rem
get_rem_tree
get_rem_rich
search_rems
get_rem_breadcrumbs
get_children
get_document_or_folder_tree
```

## 7.3 Navigation Tools

Only implement these if supported safely by the RemNote SDK:

```text
open_rem
open_rem_as_page
focus_rem
```

If the SDK does not support a navigation action, document the limitation instead of inventing a fragile workaround.

## 7.4 Create Tools

```text
create_rem
append_to_rem
create_rem_tree
create_document
create_folder
```

Before implementing `create_document` or `create_folder`, inspect the actual RemNote SDK types and confirm the supported method.

Likely possibilities:

```text
setIsDocument(true)
setType(...)
```

Do not guess. Verify in SDK typings or existing plugin SDK docs/types.

## 7.5 Organize Tools

```text
move_rem
reorder_children
set_parent
```

These must preserve order and must not move large subtrees without clear approval.

## 7.6 Rewrite Tools

```text
update_rem
replace_rem
rewrite_rem_tree
```

Rewrite tools must require stronger approval than append tools.

## 7.7 Delete Tools

```text
delete_selected_rem
delete_focused_rem
```

Avoid exposing this as the default public tool:

```text
delete_any_rem_by_id
```

Delete by arbitrary ID is too dangerous for normal app behavior.

---

# 8. Human Approval Requirements

## 8.1 Approval Must Always Resolve

Approval must never hang.

Every approval request must resolve as exactly one of:

```text
APPROVED
APPROVAL_REJECTED
APPROVAL_TIMEOUT
```

When the user denies approval, the server must receive a clean structured response.

When the approval window times out, the server must receive a clean structured response.

When another request is already pending, the new request must be rejected or queued intentionally.

Do not leave MCP calls stuck.

## 8.2 Approval UI Must Show Enough Information

For write requests, the RemNote plugin approval UI must show:

```text
- tool name
- action class
- permission mode
- target Rem ID
- target title
- parent title if relevant
- whether target has children
- preview of content being written
- insert location
- deadline
- warning for risky operations
```

For delete requests, the UI must additionally show:

```text
- descendant count
- parent Rem title
- exact delete mode
- whether delete is recursive
- confirmation text requirement
```

## 8.3 Destructive Approval

Delete must require:

```text
- target must be focused or selected OR shown in a clear preview
- plugin-side confirmation
- literal confirm text DELETE
- no silent recursive deletion
- no bulk deletion without explicit bulk-delete phase
```

---

# 9. Bridge Reliability Requirements

## 9.1 Request Lifecycle

Every request must have:

```text
requestId
tool name
validated args
startedAt
timeoutMs
status
final response
```

Every request must end with:

```text
ok: true
```

or:

```text
ok: false
```

## 9.2 No Silent Failure

Do not swallow bridge errors.

Return structured errors:

```text
PLUGIN_NOT_CONNECTED
INVALID_ARGS
PERMISSION_DENIED
APPROVAL_REJECTED
APPROVAL_TIMEOUT
TIMEOUT
REM_NOT_FOUND
PARENT_NOT_FOUND
SDK_ERROR
SDK_UNSUPPORTED
UNKNOWN_TOOL
INTERNAL_ERROR
```

## 9.3 Avoid Lag

Large operations must not feel frozen.

For large create-tree/import operations:

```text
- validate size first
- cap node count
- cap depth
- cap markdown size
- create sequentially in order
- optionally send progress events in a later phase
- return partial failure details if creation fails midway
```

Do not create giant unbounded trees.

Current limits should remain or be tightened:

```text
MAX_MARKDOWN_CHARS
CREATE_TREE_MAX_DEPTH
CREATE_TREE_MAX_NODES
CREATE_TREE_MAX_TITLE_LENGTH
```

---

# 10. Security Requirements

## 10.1 Current Local Security

The current local model must remain secure by default:

```text
- server binds to localhost by default
- bridge token required by default
- remote bind must require explicit configuration
- CORS must not be open by default
- unknown tools rejected
- arguments validated
```

## 10.2 Future App Security

For the future normal MCP/App version, add architecture without forcing it all into the current local prototype.

Target remote-ready model:

```text
ChatGPT App / MCP client
↓ OAuth
Hosted MCP server
↓ authenticated session
paired RemNote plugin
↓ RemNote SDK
```

Future production security must include:

```text
- OAuth or equivalent sign-in
- one user account maps to one active plugin session
- pairing code or device linking flow
- short-lived session tokens
- signed command envelopes or equivalent server-side validation
- scoped permissions
- audit log
- revocation/disconnect
- no open unauthenticated public channel
```

Do not expose a public MCP server that any client can use to write into RemNote.

## 10.3 Data Minimization

Do not send the whole knowledge base by default.

Read tools must be bounded by:

```text
- depth
- number of children
- character count
- selected/focused scope
- explicit user-approved scope
```

Logs must not dump full note content unless debug mode is explicitly enabled.

Good logs:

```text
requestId
tool
durationMs
permission result
approval result
targetRemId
createdRemId
errorCode
```

Bad logs:

```text
full private note text
full markdown payload
full Rem tree
```

---

# 11. Implementation Phases

Agents must complete this work in phases.

Do not mix phases unless explicitly instructed.

Each phase below can become one Codex task.

---

## Phase 1 — Baseline Audit and Safety Freeze

### Goal

Confirm current behavior and prevent unsafe destructive exposure before deeper changes.

### Files to Inspect

```text
README.md
Agents.md
ARCHITECTURE.md
SAFETY.md
NEXT_STEPS.md
src/bridge/protocol.ts
src/bridge/handlers.ts
src/remnote/permissions.ts
server/src/mcp-server.ts
server/src/bridge-hub.ts
```

### Tasks

```text
1. Verify all currently exposed MCP tools.
2. Confirm whether delete_rem is publicly registered.
3. If delete_rem is public, disable it unless a strict dev-only flag is set.
4. Add a clear comment explaining why delete is disabled until the delete safety phase.
5. Confirm existing build and server scripts still work.
6. Update SAFETY.md and NEXT_STEPS.md if they contradict the current code.
```

### Acceptance Criteria

```text
- Public MCP no longer exposes casual delete_rem.
- Destructive tools are either disabled or explicitly dev-gated.
- Existing read/create/append tools still work.
- npm run check-types passes.
- npm run server:build passes.
- npm run server:smoke passes.
```

### Manual Test

```text
1. Start plugin dev server.
2. Start companion server.
3. Connect plugin.
4. Run get_bridge_status.
5. Run get_focused_rem.
6. Confirm delete_rem is unavailable or blocked safely.
```

---

## Phase 2 — Correct Rem Ordering and Deterministic Insert Behavior

### Goal

Fix the ordering problem completely.

New Rems must append after existing content by default.

Tree creation must preserve exact order.

### Files to Modify

```text
src/bridge/protocol.ts
src/bridge/handlers.ts
src/remnote/write.ts
server/src/mcp-server.ts
server/src/test-client.ts
server/src/smoke.ts
```

### Tasks

```text
1. Audit appendMarkdownToRem and createRemTree ordering.
2. Replace ambiguous start/end behavior with an explicit insert model if practical.
3. Keep backward compatibility for existing position: start/end if needed.
4. Ensure default is append/end.
5. Refresh parent before computing insert index.
6. For createRemTree, create children in exact array order.
7. Add read-back verification helper for test mode if practical.
8. Add tests/smoke checks for order.
```

### Required Behavior

Default append:

```text
Existing parent children:
  A
  B

append_to_rem(parent, C)

Expected:
  A
  B
  C
```

Tree creation:

```text
create_rem_tree(parent, {
  title: "Main",
  children: [
    { title: "First" },
    { title: "Second" },
    { title: "Third" }
  ]
})

Expected:
  Main
    First
    Second
    Third
```

### Acceptance Criteria

```text
- append_to_rem adds after existing children by default.
- create_rem adds after existing children when parentId exists.
- create_rem_tree root is appended after existing parent children.
- create_rem_tree children preserve order.
- No write inserts at top unless explicitly requested.
- npm run check-types passes.
- npm run server:build passes.
```

### Manual Test

Create a RemNote sandbox Rem:

```text
Plugin Test
  Existing 1
  Existing 2
```

Run append.

Expected:

```text
Plugin Test
  Existing 1
  Existing 2
  New appended child
```

---

## Phase 3 — RemNote Structure Awareness and Navigation

### Goal

Make ChatGPT understand RemNote hierarchy, order, documents, folders, selected Rems, and focused Rems.

### Files to Modify

```text
src/bridge/protocol.ts
src/remnote/read.ts
src/remnote/serialize.ts
src/bridge/handlers.ts
server/src/mcp-server.ts
src/widgets/bridge-status.tsx
```

### Tools to Add or Improve

```text
get_current_selection
get_children
get_rem_breadcrumbs
search_rems
get_document_or_folder_tree
```

Optional only if SDK supports safely:

```text
open_rem
open_rem_as_page
focus_rem
```

### Tasks

```text
1. Inspect RemNote SDK capabilities before implementing navigation.
2. Add a structured way to read direct children in order.
3. Add breadcrumbs with parent chain.
4. Add document/folder metadata if available from SDK.
5. Add bounded search over Rems if SDK supports it.
6. Add max result limits.
7. Add truncation flags.
8. Update MCP tool descriptions so ChatGPT knows when to use each tool.
```

### Required Output Shape

For children:

```json
{
  "parentRemId": "string",
  "children": [
    {
      "remId": "string",
      "title": "string",
      "index": 0,
      "hasChildren": true,
      "type": "rem | document | folder | unknown"
    }
  ],
  "truncated": false
}
```

For breadcrumbs:

```json
{
  "remId": "string",
  "breadcrumbs": [
    {
      "remId": "string",
      "title": "string"
    }
  ]
}
```

### Acceptance Criteria

```text
- ChatGPT can inspect a parent Rem and know exact child order.
- ChatGPT can distinguish focused Rem from selected Rems where SDK allows.
- Tree reads are bounded.
- Search is bounded and privacy-conscious.
- No full-KB dump is exposed by default.
```

### Completion Status — DONE 2026-05-08

```text
Phase 1 — DONE
- Public MCP tool list does not expose delete_rem by default.
- delete_rem requires REMNOTE_BRIDGE_ENABLE_DELETE_TOOL=1 before it is registered.
- server smoke verifies replace_rem/delete_rem are absent from default MCP descriptors.
- SAFETY.md, ARCHITECTURE.md, NEXT_STEPS.md, and README.md match the gated destructive-tool behavior.

Phase 2 — DONE
- create_rem and append_to_rem compute append/end indexes from a freshly read parent.
- create_rem_tree appends the root after existing parent children and creates children in array order.
- write results expose insert indexes for smoke/readback verification.
- server smoke verifies append defaults to end and tree root reports the expected append index.

Phase 3 — DONE
- get_current_selection is implemented.
- get_children returns direct children in ordered index form.
- get_rem_breadcrumbs returns parent chain IDs and titles.
- search_rems uses RemNote SDK search with result caps.
- get_document_or_folder_tree returns a bounded current/requested tree.
- bridge-status widget shows selected Rem count/IDs when SDK selection is available.
```

---

## Phase 4 — Create Rems, Documents, Folders, and Full Trees Safely

### Goal

Allow ChatGPT to create new RemNote content safely, including standalone new content outside an existing Rem when allowed.

### Files to Modify

```text
src/bridge/protocol.ts
src/remnote/write.ts
src/remnote/permissions.ts
src/bridge/handlers.ts
server/src/mcp-server.ts
src/widgets/bridge-status.tsx
```

### Tools to Improve/Add

```text
create_rem
append_to_rem
create_rem_tree
create_document
create_folder
```

### Important Rule

Do not guess folder/document SDK methods.

Before implementing:

```text
1. Inspect @remnote/plugin-sdk typings.
2. Confirm how to create a document.
3. Confirm whether folder creation is supported through SDK.
4. If folder creation is unsupported, return SDK_UNSUPPORTED with a clear message.
```

### Create Rules

```text
- Creating under a known parent should append by default.
- Creating without parent should be allowed only if the current permission mode/scope permits workspace-level create.
- create_document should set document behavior if SDK supports it.
- create_folder should set folder behavior if SDK supports it.
- Tree creation must preserve order.
```

### Acceptance Criteria

```text
- create_rem under parent works.
- create_rem without parent is blocked unless permission scope allows it.
- create_document works or returns SDK_UNSUPPORTED honestly.
- create_folder works or returns SDK_UNSUPPORTED honestly.
- create_rem_tree preserves hierarchy and order.
- All create operations are size-limited.
```

---

## Phase 5 — Permission Scopes and Free-Roam vs Restricted Mode

### Goal

Let the user choose whether ChatGPT is restricted or allowed broader RemNote access.

### Files to Modify

```text
src/bridge/protocol.ts
src/remnote/permissions.ts
src/bridge/handlers.ts
src/widgets/bridge-status.tsx
server/src/mcp-server.ts
server/src/config.ts
SAFETY.md
ARCHITECTURE.md
```

### Required Modes

Add app-level scope settings without breaking existing permission modes:

```text
focused_rem_only
selected_rem_only
descendants_of_selected_rem
approved_document_or_folder
workspace_allowed
```

### Required Policy

```text
read_only + focused_rem_only:
  read focused Rem only

confirm_writes + descendants_of_selected_rem:
  read and write only inside selected Rem subtree, with approval for writes

trusted_writes + approved_document_or_folder:
  safe create/append allowed in approved scope without repeated approval

workspace_allowed:
  broader read/create allowed, but still bounded and logged

danger_zone:
  does not remove delete confirmation
```

### Tasks

```text
1. Add scope config to plugin settings.
2. Add UI showing current scope.
3. Enforce scope in plugin handlers, not only server.
4. Reject out-of-scope target Rem IDs.
5. Add clear errors: PERMISSION_DENIED or OUT_OF_SCOPE if adding new error code.
6. Keep server-side validation too.
```

### Acceptance Criteria

```text
- User can choose restricted or broader mode.
- Plugin enforces scope locally.
- Server cannot bypass plugin-side scope.
- Writes outside approved scope are blocked.
- Delete is still not automatic.
```

---

## Phase 6 — Rewrite, Update, Move, and Reorder Tools

### Goal

Allow controlled editing and organization of existing Rems.

### Files to Modify

```text
src/bridge/protocol.ts
src/remnote/write.ts
src/remnote/permissions.ts
src/bridge/handlers.ts
server/src/mcp-server.ts
src/widgets/bridge-status.tsx
```

### Tools

```text
update_rem
replace_rem
move_rem
reorder_children
```

### Rules

```text
update_rem:
  replaces only the target Rem text, not children

replace_rem:
  dangerous alias or stronger version of update_rem
  must require approval

move_rem:
  must prevent moving a Rem into itself or descendant
  must show warning if moving a Rem with children
  must preserve order by explicit index

reorder_children:
  must operate only on one parent at a time
  must require a full ordered child ID list
  must reject missing/extra child IDs unless explicitly designed otherwise
```

### Acceptance Criteria

```text
- update_rem requires approval unless explicitly trusted by policy.
- replace_rem always requires approval.
- move_rem prevents cycles.
- moving a Rem with children requires approval.
- reorder_children is deterministic.
- No hidden recursive rewriting.
```

---

## Phase 7 — Secure Delete Workflow

### Goal

Make delete possible but tightly supervised.

### Files to Modify

```text
src/bridge/protocol.ts
src/remnote/write.ts
src/remnote/read.ts
src/remnote/permissions.ts
src/bridge/handlers.ts
src/widgets/bridge-status.tsx
server/src/mcp-server.ts
SAFETY.md
```

### Preferred Public Tools

```text
delete_focused_rem
delete_selected_rem
```

Avoid public default:

```text
delete_any_rem_by_id
```

### Delete Requirements

Delete must require:

```text
- plugin-side confirmation
- target must be focused or selected OR explicitly approved in preview
- visible target title
- visible target Rem ID
- visible parent title if available
- visible child count
- visible descendant count if recursive
- literal confirm text DELETE
- recursive flag shown clearly
- no delete in read_only mode
- no silent delete in trusted_writes mode
```

### Required Delete Preview Shape

```json
{
  "targetRemId": "string",
  "targetTitle": "string",
  "parentRemId": "string",
  "parentTitle": "string",
  "childCount": 0,
  "descendantCount": 0,
  "recursive": false,
  "requiresConfirmText": "DELETE"
}
```

### Acceptance Criteria

```text
- delete_rem is not casually public.
- delete selected/focused Rem works only after strict confirmation.
- Rejecting approval does not delete.
- Timeout does not delete.
- Missing DELETE text does not delete.
- Recursive delete requires explicit recursive=true and warning.
```

### Manual Test

Only test inside:

```text
Plugin Test
```

or another sandbox Rem.

Never test delete on real notes.

### Completion Status — DONE 2026-05-08

```text
Phase 4 — DONE
- create_rem remains bounded and parentless create is blocked unless workspace_allowed scope is selected.
- create_document uses RemNote SDK setIsDocument(true) after creating the Rem.
- create_folder returns SDK_UNSUPPORTED because installed @remnote/plugin-sdk typings expose no folder creation method.
- create_rem_tree keeps bounded depth/node/title limits and preserves array order.

Phase 5 — DONE
- Bridge Permission Scope setting added with focused, selected, selected-descendant, approved-root, and workspace modes.
- Approved Root Rem ID setting added for approved_document_or_folder scope.
- Scope enforcement runs inside src/bridge/handlers.ts before approval or SDK mutation.
- OUT_OF_SCOPE errors reject targets outside local plugin policy.
- workspace_allowed is required for parentless workspace create.

Phase 6 — DONE
- replace_rem is exposed as destructive-hinted MCP tool and always requires approval.
- move_rem still blocks self/descendant moves and forces approval when moving a Rem with children.
- reorder_children requires one parent plus the full exact direct-child ID list, rejecting missing/extra/duplicate IDs.
- update/replace only change target Rem text and do not rewrite children.

Phase 7 — DONE
- Public delete tools are delete_focused_rem and delete_selected_rem.
- Arbitrary-ID delete_rem remains hidden unless REMNOTE_BRIDGE_ENABLE_DELETE_TOOL=1 is set for local development.
- Delete approval preview includes target title, target Rem ID, parent title/ID, child count, descendant count, recursive flag, and required DELETE text.
- RemNote widget requires typing DELETE before approving destructive delete.
- read_only blocks delete; trusted_writes still cannot bypass delete approval.
```

---

## Phase 8 — Bridge Reliability, Queueing, Progress, and No-Hang Behavior

### Goal

Fix lag and stuck behavior, especially when approval is denied or append/write requests are slow.

### Files to Modify

```text
src/bridge/client.ts
src/bridge/handlers.ts
src/widgets/bridge-status.tsx
server/src/bridge-hub.ts
server/src/mcp-server.ts
server/src/test-client.ts
```

### Tasks

```text
1. Audit request lifecycle end-to-end.
2. Ensure every request resolves exactly once.
3. Add queue or reject-new-request behavior for multiple pending approvals.
4. Add clear error when approval is already pending.
5. Add request timeout tests.
6. Add clean handling for plugin disconnect during pending request.
7. Add optional progress messages for create_rem_tree later if practical.
8. Add server-side logs that do not expose private note content.
```

### Required Behavior

```text
approve -> tool returns ok true
reject -> tool returns APPROVAL_REJECTED
timeout -> tool returns APPROVAL_TIMEOUT
plugin disconnected -> tool returns PLUGIN_NOT_CONNECTED
server timeout -> tool returns TIMEOUT
invalid input -> tool returns INVALID_ARGS
```

### Acceptance Criteria

```text
- Append approval denial never hangs.
- Approval timeout never hangs.
- Plugin disconnect never leaves pending server requests forever.
- Multiple write requests are handled intentionally.
- Large tree creation is bounded and returns useful errors.
```

---

## Phase 9 — Secure MCP/App Readiness

### Goal

Prepare the codebase for normal MCP/App usage beyond local developer mode.

### Files to Create or Modify

```text
server/src/auth/
server/src/sessions/
server/src/config.ts
server/src/http.ts
server/src/mcp-server.ts
ARCHITECTURE.md
SAFETY.md
NEXT_STEPS.md
README.md
```

### Do Not Implement Blindly

Do not add fake security.

Do not add incomplete OAuth and pretend it is production-ready.

Create architecture and interfaces first, then implement step-by-step.

### Target Concepts

```text
OAuth sign-in
user account
paired RemNote plugin session
device/session ID
short-lived session token
scope grants
revocation
audit log
protected MCP endpoint
public server deployment checklist
```

### Local vs Hosted Modes

Keep two modes clear:

```text
local mode:
  localhost companion server
  bridge token
  developer usage

hosted mode:
  OAuth
  pairing flow
  session-based plugin connection
  production MCP/App endpoint
```

### Acceptance Criteria

```text
- Current local mode still works.
- Hosted mode design is documented.
- Security interfaces are added without weakening local mode.
- No unauthenticated public write endpoint exists.
```

---

## Phase 10 — Documentation, Test Matrix, and Release Readiness

### Goal

Make the repository understandable and ready for iterative development.

### Files to Update

```text
README.md
ARCHITECTURE.md
SAFETY.md
NEXT_STEPS.md
Agents.md
```

### Required Documentation

README must explain:

```text
- what this project is
- local setup
- plugin setup
- server setup
- MCP endpoint
- current tools
- permission modes
- what is safe now
- what is not ready yet
```

ARCHITECTURE must explain:

```text
- plugin responsibilities
- server responsibilities
- bridge protocol
- MCP tool layer
- permission enforcement
- future hosted app architecture
```

SAFETY must explain:

```text
- read limits
- write approvals
- scope modes
- delete policy
- logging policy
- sandbox testing policy
```

NEXT_STEPS must contain:

```text
- current phase
- next phase
- blocked items
- manual test checklist
```

### Required Test Matrix

Maintain a test matrix like:

| Area | Test | Expected |
|---|---|---|
| Connection | plugin connects to server | connected status |
| Read | get focused Rem | returns selected content |
| Order | append child | appears after existing children |
| Tree | create ordered tree | order preserved |
| Approval | reject write | no write, error returned |
| Timeout | ignore approval | timeout error returned |
| Scope | write outside scope | denied |
| Delete | missing DELETE | blocked |
| Disconnect | plugin disconnect during request | structured error |

### Acceptance Criteria

```text
- Documentation matches actual code.
- Test matrix exists.
- All validation scripts pass.
- Manual sandbox test steps are clear.
```

---

### Completion Status — DONE 2026-05-09

Repo/build/smoke verification status:

Phase 8 — DONE
- Bridge lifecycle audited through hub, plugin client, widget approval path, and smoke coverage.
- Server-side pending requests resolve through success, timeout, disconnect, or send failure paths.
- Widget rejects duplicate approval requests with `APPROVAL_PENDING` instead of hiding a queue.
- Approval timeout uses the request deadline and returns `APPROVAL_TIMEOUT`.
- Smoke coverage includes server timeout and plugin disconnect paths.
- Large read payloads are additionally bounded by total serialized nodes, summary-title truncation, and WebSocket message size.

Phase 9 — DONE
- Active local mode still uses loopback bind plus bridge token by default.
- `/mcp` remains protected by local bearer/token auth; remote/CORS modes require a token.
- Auth/session/audit interfaces now exist under `server/src/auth` and `server/src/sessions`.
- Hosted mode is documented and intentionally blocked by config until real OAuth/pairing/session storage is implemented.
- Audit logs record metadata only and avoid note bodies, markdown payloads, tokens, and secrets.

Phase 10 — DONE
- README explains project purpose, local setup, plugin setup, server setup, MCP endpoint, tools, modes/scopes, safe-now status, and not-ready status.
- Architecture doc explains plugin/server responsibilities, bridge protocol, MCP layer, permission enforcement, and future hosted architecture.
- Safety doc explains read limits, write approvals, scope modes, delete policy, logging policy, sandbox policy, and no-hang behavior.
- NEXT_STEPS contains completed milestones, current phase, next phase, blocked items, manual QA, and test matrix.
- Security scan artifact written under `/tmp/codex-security-scans/remnote-plugin-template-react/4eacf1c_20260509T065352Z/report.md`.

### Live MCP Follow-up Status — DONE 2026-05-09

Stage 1 — DONE
- Canonical MCP registry stamp added with 24 default public tools and gated `delete_rem` metadata.
- `/health`, `/diagnostics`, `get_bridge_status`, and `get_bridge_diagnostics` expose live registry evidence.

Stage 2 — DONE
- BridgeHub now records pending and recent request outcomes without note bodies or markdown.
- MCP client disconnect aborts pending server work with `CLIENT_DISCONNECTED`.
- Server sends `cancel_request` to the plugin so pending RemNote approvals do not execute after the caller is gone.

Stage 3 — DONE
- Plugin sidebar is task-focused: Ready/Action Needed/Bridge Offline, tool count, registry stamp, scope, refresh warning, approval card, and copy diagnostics.
- UI uses 44px controls, visible focus states, wrapping text, and reduced-motion-safe transitions.

Stage 4 — DONE
- Submission JSON includes `get_bridge_diagnostics` and diagnostics test coverage.
- README and NEXT_STEPS explain 24-tool registry, connector refresh, diagnostics endpoint, and client-disconnect behavior.

Stage 5 — DONE
- `npm run check-types`, `npm run server:build`, and `npm run server:smoke` pass after the follow-up fix.
- Smoke coverage now checks 24-tool diagnostics, server timeout, plugin disconnect, and client-disconnect cancellation.

---

# 12. Tool Design Rules

## 12.1 MCP Tool Descriptions

Tool descriptions must teach ChatGPT when to use each tool.

Bad:

```text
Create Rem.
```

Good:

```text
Use this when the user explicitly asks to create a new RemNote Rem under a known parent. By default the new Rem is appended after existing children.
```

## 12.2 Tool Inputs

Every tool input must be validated with schema.

Use zod on the server side.

Use TypeScript normalization on the plugin side.

Never trust server input just because it came from MCP.

## 12.3 Tool Outputs

Every tool output must include structured content.

Write tools should return:

```json
{
  "status": "appended",
  "targetRemId": "string",
  "createdRemId": "string",
  "insertedAt": 3
}
```

Add `insertedAt` where practical during the ordering phase.

---

# 13. RemNote SDK Rules

## 13.1 Keep SDK Calls Isolated

RemNote SDK calls should stay in:

```text
src/remnote/read.ts
src/remnote/write.ts
src/remnote/serialize.ts
src/remnote/permissions.ts
```

Do not put SDK-heavy logic inside React widgets.

Widgets should display state and request approval only.

## 13.2 Do Not Send Raw SDK Objects

Never send raw RemNote SDK objects over the bridge.

Always serialize.

## 13.3 Rich Text and Math

Math notation must be preserved as much as the RemNote SDK allows.

For math/rich text work:

```text
- inspect rich text shape
- preserve inline math
- preserve math blocks
- test with real RemNote rendering
- do not flatten math into broken plain text when writing
```

Use `get_rem_rich` for diagnostics when checking math behavior.

---

# 14. Testing Rules

## 14.1 Always Test in Sandbox First

All write and delete tests must happen inside a sandbox Rem such as:

```text
Plugin Test
```

or:

```text
ChatGPT Bridge Sandbox
```

Never test destructive actions on real notes.

## 14.2 Required Commands

Run these after meaningful changes:

```bash
npm run check-types
npm run validate
npm run build
npm run server:build
npm run server:smoke
```

When server behavior changes:

```bash
npm run server:test-client
```

## 14.3 Manual RemNote Test

Use this checklist:

```text
1. Start npm run dev.
2. Start npm run server:dev.
3. Load plugin in RemNote from http://localhost:8080.
4. Confirm bridge token matches.
5. Confirm bridge status connected.
6. Focus Plugin Test Rem.
7. Run get_focused_rem.
8. Run get_rem_tree.
9. Run append_to_rem.
10. Approve request.
11. Confirm child appears after existing children.
12. Run append_to_rem again.
13. Reject request.
14. Confirm no child was created.
```

---

# 15. Anti-Patterns to Avoid

Do not implement:

```text
DOM scraping
browser automation against RemNote UI
browser automation against ChatGPT UI
direct OpenAI API calls inside RemNote
RemNote plugin as chatbot
silent note rewriting
silent delete
bulk delete
unbounded full-KB read
untyped command bus
public unauthenticated bridge server
open CORS write endpoint
giant all-in-one refactor
```

---

# 16. Coding Style

Use clear, boring code.

Prefer:

```text
small functions
typed interfaces
explicit schemas
explicit errors
bounded recursion
request IDs
clear logs
manual test notes
```

Avoid:

```text
clever abstractions
large React components
hidden global mutable state
silent catches
console logs with private note content
unbounded loops through Rem trees
```

---

# 17. Definition of Done

A phase is done only when:

```text
- implementation matches the phase goal
- safety behavior is correct
- types pass
- build passes
- server build passes
- smoke test passes
- manual test steps are documented
- no unrelated phase was mixed in
```

The full product is successful when this works reliably:

```text
User opens RemNote.
User focuses or selects a Rem.
User asks ChatGPT/Vivy to organize or add notes.
ChatGPT reads the current Rem structure.
ChatGPT understands order and nesting.
ChatGPT appends new content after existing children.
The plugin shows approval when needed.
The user approves or rejects.
The bridge returns a structured result.
RemNote updates exactly as expected.
Dangerous actions remain tightly supervised.
```

Keep every implementation decision aligned with that product experience.
