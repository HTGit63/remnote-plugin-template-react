# AGENTS.md

## Purpose of This File

This file gives AI coding agents strict instructions for working in this repository.

The repository is currently a RemNote plugin that directly calls the OpenAI API from inside RemNote. That is **not** the desired final product.

The desired product is a **RemNote ChatGPT Bridge**:

- ChatGPT / Vivy is the reasoning layer.
- RemNote is the knowledge-base and note-editing layer.
- The RemNote plugin exposes controlled read/write access to the RemNote SDK.
- A local companion server mediates communication between ChatGPT tooling and the running RemNote plugin.
- The plugin must not behave like a separate AI chatbot inside RemNote.
- The plugin must not require the user to paste an OpenAI API key into RemNote settings.

The migration must be done carefully, in small production-safe steps.

---

# 1. Core Product Direction

## 1.1 Current Wrong Direction

The current repository behaves like this:

```text
User opens RemNote
↓
RemNote plugin sidebar loads
↓
User enters OpenAI API key in RemNote plugin settings
↓
Plugin reads focused RemNote content
↓
Plugin directly calls OpenAI API
↓
Plugin displays AI output inside RemNote
↓
User manually creates/appends/replaces RemNote content
```

That is useful as a prototype, but it is not the requested product.

## 1.2 Desired Direction

The target architecture is:

```text
ChatGPT / Vivy
↓
ChatGPT connector or MCP-compatible tool layer
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

The RemNote plugin becomes a bridge, not the AI brain.

## 1.3 Main Principle

The plugin should not think.

The plugin should not generate AI text.

The plugin should not call OpenAI.

The plugin should only:

- read focused/selected RemNote context;
- serialize RemNote data into safe structured payloads;
- expose approved RemNote operations;
- receive structured tool requests from the local bridge;
- show confirmation UI for write/destructive operations;
- apply approved changes through the RemNote SDK;
- return structured success/error responses.

---

# 2. Non-Negotiable Rules for Agents

## 2.1 Plan Before Coding

Before making code changes, produce a concrete plan that includes:

- files to modify;
- files to create;
- files to delete or deprecate;
- current behavior being replaced;
- target behavior;
- safety risks;
- test steps.

Do not make large speculative rewrites.

## 2.2 Small Commits Only

Implement the migration in small, reviewable commits. Do not attempt the whole architecture in one patch.

Preferred commit sequence:

1. Documentation and naming direction.
2. Remove direct OpenAI API dependency from the plugin UI path.
3. Refactor RemNote read/write operations into service modules.
4. Replace AI sidebar with bridge-status widget.
5. Add typed bridge protocol.
6. Add WebSocket bridge client inside the plugin.
7. Add local companion server skeleton.
8. Implement read-only tool flow.
9. Implement safe append/create write flow with confirmation.
10. Add MCP / ChatGPT tool layer.

## 2.3 Do Not Hide Risky Behavior

Any operation that modifies the user's RemNote knowledge base must be explicit.

Never silently:

- replace Rem text;
- delete Rems;
- move Rems;
- bulk edit Rems;
- rewrite parent Rems;
- modify descendants recursively.

## 2.4 Do Not Add More AI-Inside-RemNote Features

Do not add new features such as:

- custom chat UI inside RemNote;
- more OpenAI models in plugin settings;
- prompt templates inside RemNote;
- direct AI generation buttons inside RemNote;
- API-key storage in RemNote settings.

Those features reinforce the wrong architecture.

## 2.5 Prefer Typed Boundaries

Use TypeScript types for every boundary:

- bridge requests;
- bridge responses;
- tool schemas;
- Rem serialization output;
- permission state;
- pending approval state;
- error responses.

Avoid untyped `any` unless there is no practical alternative. If `any` is used, isolate it at the SDK boundary and convert it immediately into typed internal structures.

---

# 3. Repository Understanding

## 3.1 Current Known Files

Important current files include:

```text
README.md
ARCHITECTURE.md
SAFETY.md
NEXT_STEPS.md
package.json
src/bridge/protocol.ts
src/bridge/status.ts
src/remnote/read.ts
src/remnote/write.ts
src/remnote/serialize.ts
src/remnote/permissions.ts
src/widgets/bridge-status.tsx
src/widgets/index.tsx
```

## 3.2 Current Useful Logic

The plugin preserves these useful RemNote SDK operations in `src/remnote/*` service modules:

- get currently focused Rem;
- read front text;
- read back text;
- convert rich text to string;
- create Rem from markdown;
- append markdown as child Rem;
- replace Rem text;
- delete Rem after explicit approval.

Do not move SDK logic back into widget components.

## 3.3 Current Logic to Remove or Deprecate

The following concepts are removed from the active plugin path and must not be reintroduced:

- OpenAI API key setting;
- model setting for OpenAI completion;
- `callOpenAI` as plugin runtime behavior;
- direct calls to `https://api.openai.com`;
- `Generate Notes`, `Summarize`, `Rewrite`, `Expand`, and `Clean Format` buttons as AI actions;
- `Open ChatGPT and copy prompt` as the main integration model.

The final connector should not depend on manually copying prompts into ChatGPT.

---

# 4. Target Folder Structure

Move toward this structure:

```text
src/
  bridge/
    client.ts
    handlers.ts
    package.json
    protocol.ts
    status.ts
  remnote/
    read.ts
    write.ts
    serialize.ts
    permissions.ts
  widgets/
    bridge-status.tsx
  index.ts

server/
  package.json
  tsconfig.json
  src/
    app.ts
    bridge-hub.ts
    config.ts
    http.ts
    index.ts
    mcp-client.ts
    mcp-server.ts
    smoke.ts
    test-client.ts
```

Do not create all files blindly if the current build system requires a more gradual path. However, this is the intended final organization.

---

# 5. RemNote Plugin Responsibilities

## 5.1 What the Plugin Should Do

The RemNote plugin should:

- connect to the local companion server through WebSocket;
- report bridge connection status;
- expose RemNote SDK actions through typed handlers;
- read focused RemNote content;
- read specific Rems by ID when permitted;
- serialize Rem trees into safe JSON;
- create new Rems from markdown;
- append markdown under an existing Rem;
- request user approval before writes if required;
- always request user approval before destructive actions;
- return structured success/error results.

## 5.2 What the Plugin Should Not Do

The RemNote plugin should not:

- call OpenAI directly;
- store OpenAI API keys;
- make model-selection decisions;
- act as a chatbot;
- invent content by itself;
- perform hidden background edits;
- execute arbitrary commands received from a server;
- accept untyped command strings.

---

# 6. Local Companion Server Responsibilities

The local companion server is a separate Node/TypeScript process.

It should:

- listen locally only by default;
- accept a WebSocket connection from the RemNote plugin;
- expose a tool interface for ChatGPT/MCP-compatible clients;
- route tool calls to the connected RemNote plugin;
- validate tool arguments;
- enforce permissions;
- track request/response IDs;
- return structured errors;
- log all requests in a privacy-conscious way;
- avoid storing full note content unless explicitly needed for debugging.

## 6.1 Local-Only Default

The server should bind to localhost by default:

```text
127.0.0.1
```

Do not expose the server publicly by default.

Suggested ports:

```text
47391 WebSocket bridge
47392 tool/MCP endpoint
```

These can be changed later, but keep them centralized in config.

---

# 7. Bridge Protocol

Create a typed bridge protocol.

Suggested file:

```text
src/bridge/protocol.ts
```

The protocol must include:

- request ID;
- tool name;
- typed arguments;
- permission level;
- response success flag;
- result payload;
- error object.

Example shape:

```ts
export type BridgeToolName =
  | "get_focused_rem"
  | "get_rem"
  | "get_rem_tree"
  | "create_rem"
  | "append_to_rem"
  | "replace_rem"
  | "delete_rem";

export interface BridgeRequest<TArgs = unknown> {
  id: string;
  tool: BridgeToolName;
  args: TArgs;
}

export interface BridgeSuccess<TResult = unknown> {
  id: string;
  ok: true;
  result: TResult;
}

export interface BridgeFailure {
  id: string;
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type BridgeResponse<TResult = unknown> =
  | BridgeSuccess<TResult>
  | BridgeFailure;
```

Do not use arbitrary string commands such as:

```ts
{ command: "do something with this note" }
```

That is unsafe and untestable.

---

# 8. Tool Contract

Start with read-only tools.

## 8.1 Read-Only Tools

### `get_focused_rem`

Purpose:

Read the currently focused Rem in the active RemNote client.

Input:

```json
{}
```

Output:

```json
{
  "remId": "string",
  "frontText": "string",
  "backText": "string",
  "plainText": "string",
  "breadcrumbs": ["string"],
  "hasChildren": true
}
```

### `get_rem`

Purpose:

Read a specific Rem by ID.

Input:

```json
{
  "remId": "string"
}
```

Output:

```json
{
  "remId": "string",
  "frontText": "string",
  "backText": "string",
  "plainText": "string",
  "breadcrumbs": ["string"],
  "hasChildren": true
}
```

### `get_rem_tree`

Purpose:

Read a Rem and descendants up to a bounded depth.

Input:

```json
{
  "remId": "string",
  "depth": 2
}
```

Rules:

- Default depth should be small.
- Hard cap depth to prevent accidental full-KB extraction.
- Return partial/truncated flag if needed.

## 8.2 Safe Write Tools

### `create_rem`

Purpose:

Create a new Rem, optionally under a parent.

Input:

```json
{
  "parentId": "string or null",
  "markdown": "string"
}
```

Rules:

- Requires write permission.
- Should show approval UI unless trusted-write mode is enabled.
- Return created Rem ID.

### `append_to_rem`

Purpose:

Append markdown as child Rem content under an existing Rem.

Input:

```json
{
  "remId": "string",
  "markdown": "string"
}
```

Rules:

- Safer than replace.
- Should be the default write action.
- Requires approval in confirm mode.

## 8.3 Dangerous Tools

These must not be enabled in the first working version:

- `replace_rem`
- `delete_rem`
- `move_rem`
- `bulk_update_rem`

When later added, they must always show explicit approval inside RemNote.

---

# 9. Permission Model

Create a permission system with clear modes.

Suggested modes:

```ts
export type PermissionMode =
  | "read_only"
  | "confirm_writes"
  | "trusted_writes"
  | "danger_zone";
```

Default mode:

```text
confirm_writes
```

## 9.1 Permission Rules

| Action | read_only | confirm_writes | trusted_writes | danger_zone |
|---|---:|---:|---:|---:|
| Read focused Rem | yes | yes | yes | yes |
| Read specific Rem | yes | yes | yes | yes |
| Read bounded tree | yes | yes | yes | yes |
| Create Rem | no | confirm | yes | yes |
| Append to Rem | no | confirm | yes | yes |
| Replace Rem | no | confirm always | confirm always | confirm always |
| Delete Rem | no | confirm always | confirm always | confirm always |
| Bulk operation | no | confirm always | confirm always | confirm always |

Even in `trusted_writes`, destructive operations must still confirm.

---

# 10. Approval UI Requirements

The RemNote widget should show pending requests clearly.

Minimum UI:

```text
RemNote ChatGPT Bridge

Status: Connected / Disconnected
Local Server: ws://localhost:47391/remnote-bridge
Permission Mode: Confirm Writes
Focused Rem: Found / Not Found

Pending Request:
Tool: append_to_rem
Target: <breadcrumb or rem id>
Preview:
<markdown preview>

[Approve] [Reject]
```

Do not apply write operations before approval unless permission mode explicitly allows it.

Approval result should be returned to the server as a normal bridge response.

---

# 11. Serialization Rules

Do not send raw SDK objects across the bridge.

Serialize RemNote content into small, stable objects.

Suggested type:

```ts
export interface SerializedRem {
  remId: string;
  frontText: string;
  backText: string;
  plainText: string;
  breadcrumbs: string[];
  children?: SerializedRem[];
  hasChildren: boolean;
  truncated?: boolean;
}
```

Rules:

- Convert rich text to plain text or markdown-like text before sending.
- Do not include giant raw object graphs.
- Limit child depth.
- Limit maximum character output per response.
- Include `truncated: true` when data is cut for safety.

---

# 12. Error Handling

All bridge failures must return structured errors.

Example:

```json
{
  "id": "request-id",
  "ok": false,
  "error": {
    "code": "NO_FOCUSED_REM",
    "message": "No Rem is currently focused in RemNote."
  }
}
```

Use clear error codes, for example:

```text
NO_FOCUSED_REM
REM_NOT_FOUND
PLUGIN_NOT_CONNECTED
INVALID_ARGS
PERMISSION_DENIED
APPROVAL_REJECTED
SDK_ERROR
TIMEOUT
UNKNOWN_TOOL
INTERNAL_ERROR
```

Do not throw raw SDK errors across process boundaries.

---

# 13. Testing Strategy

Every phase must include manual test steps.

## 13.1 First Critical Test

The first working milestone must prove this flow:

```text
Local test client
↓
Local companion server
↓
WebSocket
↓
RemNote plugin
↓
RemNote SDK
↓
get focused Rem
↓
structured response returned to local test client
```

## 13.2 Read Test

Steps:

1. Open RemNote.
2. Focus a known Rem.
3. Start the local companion server.
4. Confirm the plugin shows connected status.
5. Run local test client for `get_focused_rem`.
6. Verify returned text matches the focused Rem.

## 13.3 Append Test

Steps:

1. Focus a test Rem inside a test-only document.
2. Send `append_to_rem` request from local test client.
3. Confirm approval UI appears inside plugin.
4. Approve request.
5. Verify a child Rem is created.
6. Verify response includes created Rem ID.

## 13.4 Rejection Test

Steps:

1. Send `append_to_rem` request.
2. Reject inside RemNote UI.
3. Confirm no Rem is created.
4. Confirm response has `APPROVAL_REJECTED`.

## 13.5 Safety Test

Never test on real notes first.

Create a dedicated test document such as:

```text
Test KB Space / ChatGPT Bridge Sandbox
```

All write and destructive tests must happen there first.

---

# 14. Build and Validation

Current package scripts should be respected unless changed intentionally.

Expected existing commands:

```bash
npm install
npm run check-types
npm run validate
npm run dev
npm run build
```

If a server package is added, include separate commands such as:

```bash
cd server
npm install
npm run dev
npm run build
```

Do not break the existing RemNote plugin build while adding the server.

---

# 15. Documentation Updates

Update documentation as part of the migration.

## 15.1 README.md Should Explain

- This is a RemNote ChatGPT Bridge.
- It is not an AI chatbot inside RemNote.
- It does not require an OpenAI API key in RemNote.
- It requires the RemNote plugin and local companion server to be running.
- ChatGPT/Vivy accesses RemNote through explicit tools.
- Writes require approval by default.

## 15.2 ARCHITECTURE.md Should Explain

- Why RemNote SDK access must happen inside the plugin.
- Why a local companion server is needed.
- How the WebSocket bridge works.
- How the ChatGPT/MCP tool layer talks to the local server.
- Where permissions are enforced.

## 15.3 SAFETY.md Should Explain

- Permission modes.
- Read-only behavior.
- Confirmed writes.
- Dangerous operations.
- Testing in sandbox documents.
- Privacy assumptions.

## 15.4 NEXT_STEPS.md Should Be Rewritten

The old automation framing should be replaced with connector-focused milestones.

---

# 16. Security and Privacy Requirements

## 16.1 Local Server Security

- Bind to localhost by default.
- Do not expose the bridge to the public internet.
- Require a local secret/token between plugin and server by default.
- Reject unknown tools.
- Validate all arguments.
- Add request timeouts.

## 16.2 Data Minimization

- Do not send the full knowledge base by default.
- Prefer focused Rem and bounded tree access.
- Add limits for depth, number of children, and character count.
- Mark truncated responses.

## 16.3 Logging

Logs should show useful debugging metadata without dumping full private notes by default.

Good logs:

```text
request id
tool name
status
duration
permission result
error code
```

Avoid logs like:

```text
full note body
full markdown payload
full Rem tree
```

unless debug mode is explicitly enabled.

---

# 17. Implementation Milestones

## Milestone 1: Documentation and Direction - DONE 2026-05-07

Goal:

Make the repository direction explicit.

Tasks:

- Add or update `AGENTS.md`.
- Update README wording from OpenAI connector to ChatGPT bridge.
- Update architecture docs.
- Document migration plan.

Acceptance:

- Done: docs clearly reject direct OpenAI-inside-RemNote architecture.
- Done: docs describe local bridge architecture.

## Milestone 2: Remove OpenAI Runtime Dependency - DONE 2026-05-07

Goal:

Stop the plugin from requiring OpenAI API behavior.

Tasks:

- Remove API-key UI from active widget.
- Remove direct OpenAI call path from plugin runtime.
- Keep old code only if needed temporarily, but do not leave it active.

Acceptance:

- Done: plugin can run without OpenAI API key.
- Done: no active user-facing flow asks for an OpenAI API key.

## Milestone 3: Refactor RemNote SDK Access - DONE 2026-05-07

Goal:

Move RemNote logic into reusable services.

Tasks:

- Create read service.
- Create write service.
- Create serializer.
- Create permissions module.
- Keep widget thin.

Acceptance:

- Done: widget imports RemNote read/permission service functions.
- Done: RemNote SDK object handling is isolated in `src/remnote/*`.

## Milestone 4: Bridge Status Widget - DONE 2026-05-07

Goal:

Replace AI sidebar with connection/status UI.

Tasks:

- Show connection status.
- Show focused Rem status.
- Show permission mode.
- Show pending request approval UI.

Acceptance:

- Done: no AI generation buttons remain in the main UI.
- Done: UI presents bridge state, focused Rem state, permission mode, and pending request area.

## Milestone 5: Typed Bridge Protocol - DONE 2026-05-07

Goal:

Define safe request/response contracts.

Tasks:

- Add `src/bridge/protocol.ts`.
- Add tool names.
- Add request/response types.
- Add error codes.

Acceptance:

- Done: no arbitrary command execution pattern is defined.
- Done: protocol exports structured failure helpers including `UNKNOWN_TOOL`.

## Milestone 6: WebSocket Bridge Client - DONE 2026-05-07

Goal:

Plugin can connect to local server.

Tasks:

- Add WebSocket client.
- Add reconnect behavior.
- Add status reporting.
- Add handler dispatch.

Acceptance:

- Done: plugin opens a WebSocket client, sends typed hello, reconnects with backoff, and reports connected/disconnected/error state.
- Done: server can send `ping` and `get_status` through the bridge handler path.

## Milestone 7: Local Companion Server Skeleton - DONE 2026-05-07

Goal:

Create local server process.

Tasks:

- Add `server/` package.
- Add WebSocket server.
- Add tool router.
- Add simple local test client or script.

Acceptance:

- Done: `server/` package starts a localhost WebSocket bridge and MCP HTTP endpoint.
- Done: `BridgeHub` tracks one active plugin socket and request/response IDs with timeouts.
- Done: `server/src/test-client.ts` and `server/src/smoke.ts` provide local verification paths.

## Milestone 8: Read-Only Tool Flow - DONE 2026-05-07

Goal:

Make `get_focused_rem` work end-to-end.

Tasks:

- Implement plugin handler.
- Implement server route.
- Implement local test script.

Acceptance:

- Done: MCP read tools route through the companion server, WebSocket bridge, plugin handler, and RemNote read services.
- Done: `get_focused_rem`, `get_rem`, and `get_rem_tree` return typed serialized Rem payloads or structured errors.

## Milestone 9: Safe Write Flow - DONE 2026-05-07

Goal:

Make append/create work safely.

Tasks:

- Implement `append_to_rem`.
- Implement `create_rem`.
- Add approval UI.
- Add rejection handling.

Acceptance:

- Done: `create_rem` and `append_to_rem` route through permission checks and the widget approval flow.
- Done: approval resolves before SDK writes run in `confirm_writes` mode.
- Done: rejection or timeout returns a structured approval error without applying the write.

## Milestone 10: MCP/ChatGPT Tool Layer - DONE 2026-05-07

Goal:

Expose the local server as a proper tool layer.

Tasks:

- Add MCP-compatible server adapter if required.
- Define tool schemas.
- Route tool calls through existing server router.

Acceptance:

- Done: MCP Streamable HTTP endpoint exposes bridge status, plugin ping/status, read tools, and safe write tools.
- Done: exposed RemNote tools use the same server-to-plugin bridge and permission pipeline.
- Done: destructive internal bridge tools are not exposed through MCP.

---

# 18. Anti-Patterns to Avoid

Do not implement:

```text
ChatGPT opens RemNote web UI and scrapes DOM
Browser extension that reads chat.openai.com DOM
Plugin that pastes copied prompts into ChatGPT
Remote public server that stores the user's full RemNote KB
Direct OpenAI API calls inside RemNote
Silent background rewriting of notes
Giant one-shot rewrite of the entire repo
Untyped JSON command bus
Bulk delete or replace without confirmation
```

These are either fragile, unsafe, or not aligned with the product direction.

---

# 19. Coding Style

Use clear, boring code.

Prefer:

- TypeScript interfaces;
- small functions;
- explicit errors;
- simple state machines;
- isolated SDK wrappers;
- comments only where they clarify non-obvious behavior.

Avoid:

- clever abstractions;
- giant React components;
- hidden mutable global state;
- unbounded recursion through Rem trees;
- silent catches;
- console noise with private note content.

---

# 20. Final Product Definition

The product is successful when this becomes possible:

```text
User opens RemNote and enables the bridge plugin.
User starts the local companion server.
ChatGPT/Vivy has access to RemNote tools.
User asks ChatGPT: "Read my focused Rem and improve it."
ChatGPT calls `get_focused_rem`.
ChatGPT reasons over the returned note content.
ChatGPT calls `append_to_rem` with improved markdown.
RemNote plugin shows approval UI.
User approves.
The improved markdown appears under the selected Rem.
```

That is the target experience.

Keep every implementation decision aligned with that flow.
