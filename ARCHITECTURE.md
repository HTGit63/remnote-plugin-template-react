# Architecture

## Target Architecture

RemNote SDK access must happen inside the running RemNote plugin because the user's knowledge base is available through RemNote's local plugin APIs, not through a remote server-side API. The local companion server exists to mediate between ChatGPT-compatible tools and the plugin without putting AI logic inside RemNote.

```text
ChatGPT / Vivy
-> MCP-compatible tool layer
-> local companion server
-> WebSocket bridge
-> RemNote plugin
-> RemNote SDK
-> user's RemNote knowledge base
```

## Plugin Boundary

The plugin is responsible for:

- tracking bridge status;
- reading focused RemNote context;
- serializing RemNote SDK objects into small JSON payloads;
- checking permissions;
- showing approval UI for writes;
- applying approved RemNote SDK changes;
- returning typed success or error responses.

The plugin is not responsible for:

- generating AI output;
- calling OpenAI APIs;
- storing OpenAI API keys;
- choosing OpenAI models;
- acting as a chatbot UI.

## Current Source Layout

```text
src/
  bridge/
    client.ts
    handlers.ts
    package.json
    protocol.ts
    status.ts
  remnote/
    permissions.ts
    read.ts
    serialize.ts
    write.ts
  widgets/
    bridge-status.tsx
    index.tsx
server/
  src/
    app.ts
    auth/
      local-token.ts
      types.ts
    bridge-hub.ts
    config.ts
    http.ts
    index.ts
    mcp-client.ts
    mcp-server.ts
    sessions/
      audit-log.ts
      types.ts
    smoke.ts
    test-client.ts
```

## Bridge Protocol

`src/bridge/protocol.ts` defines the safe boundary:

- known tool names only;
- typed request arguments;
- typed result payloads;
- structured error codes;
- pending approval request shape;
- lifecycle event shape for request state evidence;
- tool impact annotations for later MCP descriptor generation.

Unknown tools must return `UNKNOWN_TOOL`. Arbitrary command strings are not a valid bridge input.

## Permission Enforcement

`src/remnote/permissions.ts` defines four write modes:

- `read_only`
- `confirm_writes`
- `trusted_writes`
- `danger_zone`

Reads are allowed in all modes. Safe writes require approval in `confirm_writes`. Destructive tools such as replace and delete always require approval outside `read_only`, and are blocked in `read_only`.

The plugin also enforces app-level scopes:

- `focused_rem_only`
- `focused_rem_and_descendants`
- `selected_rem_only`
- `selected_rem_and_descendants`
- `approved_document_or_folder`
- `workspace_allowed`

Scope checks run inside `src/bridge/handlers.ts` before approval or SDK mutation. Workspace-level create is blocked unless `workspace_allowed` is selected. `approved_document_or_folder` requires the `Approved Root Rem ID` plugin setting.

## WebSocket Bridge

`src/bridge/client.ts` runs inside the plugin. It opens the configured WebSocket URL, sends a typed plugin hello, reconnects with backoff, dispatches bridge requests through `src/bridge/handlers.ts`, and reports connection state to the widget.

The plugin handler validates request IDs, known tools, Rem IDs, markdown size, and tree depth before touching the RemNote SDK. Writes go through the permission module and can pause on the widget approval Promise.

Only one approval can be pending in the widget at a time. A second approval request returns `APPROVAL_PENDING` instead of waiting behind hidden UI. Approval denial returns `APPROVAL_REJECTED`, approval deadline returns `APPROVAL_TIMEOUT`, plugin disconnect returns `PLUGIN_NOT_CONNECTED`, and server-side bridge timeout returns `TIMEOUT`.

If the MCP caller disconnects while a write approval is pending, the companion server sends a typed `cancel_request` message to the plugin. The plugin resolves the approval UI as cancelled, suppresses any late response for that request, and the server records the outcome as `CLIENT_DISCONNECTED`. This keeps ChatGPT from losing a write result while the plugin still silently applies the approved change.

Every handled request returns lifecycle evidence such as `received`, `validated`, `waiting_for_approval`, `executing`, `completed`, `failed`, `partial_failure`, or `cancelled`. Write failures that occur after a Rem is created include partial execution details and created Rem IDs when the plugin can know them.

Serialized tree reads are bounded by depth, children per node, total node count, title/text truncation, and WebSocket message size.

## Local Companion Server

The companion server is a separate Node/TypeScript package under `server/`.

It provides:

- WebSocket server on `127.0.0.1:47391/remnote-bridge`;
- MCP Streamable HTTP endpoint on `127.0.0.1:47392/mcp`;
- one active plugin connection at a time;
- request/response ID tracking with timeouts;
- caller-disconnect cancellation for pending bridge requests;
- a recent request outcome ledger that stores lifecycle, status/error metadata, created Rem IDs, and partial execution evidence without note content;
- token checks by default through `REMNOTE_BRIDGE_TOKEN`;
- loopback host validation and optional CORS allowlisting.
- local audit logging for request/auth metadata without note content.

`server/src/auth` and `server/src/sessions` define the future hosted-mode security boundary: OAuth account, user/session identity, device/session IDs, scope grants, revocation, and audit event shapes. The active implementation still uses local bridge-token auth only. `REMNOTE_BRIDGE_HOSTED_MODE=1` fails startup until real OAuth, pairing, and persistent sessions are implemented.

## MCP/ChatGPT Tool Layer

`server/src/mcp-server.ts` registers the MCP tools. Read tools route through the WebSocket bridge and return structured RemNote payloads. Safe write tools route through the same bridge and depend on the plugin permission mode.

The public tool registry is centralized in `server/src/tool-registry.ts`. `get_bridge_status`, `get_bridge_diagnostics`, `run_bridge_health_check`, `/health`, and authenticated `/diagnostics` all expose or record the same registry version/count so stale ChatGPT connector sessions can be identified quickly.

Registry/listing fields are kept separate from runtime proof. `publicTools` and `mcpListedTools` show discovery. `realPluginVerifiedTools` shows recent successful bridge execution. `runtimeUnverifiedTools` shows listed tools with no recent success. `sdkUnsupportedTools` shows tools that are known unsupported by the installed RemNote SDK.

The MCP layer exposes bounded read/navigation tools:

- `get_bridge_status`
- `get_bridge_diagnostics`
- `run_bridge_health_check`
- `get_remnote_capability_guide`
- `ping_remnote_plugin`
- `get_plugin_status`
- `get_focused_rem`
- `get_rem`
- `get_rem_tree`
- `get_rem_rich`
- `get_current_selection`
- `get_children`
- `get_rem_breadcrumbs`
- `search_rems`
- `get_document_or_folder_tree`

The MCP layer exposes safe writes:

- `create_rem`
- `append_to_rem`
- `create_document`
- `create_folder`
- `update_rem`
- `replace_rem`
- `move_rem`
- `reorder_children`
- `create_rem_tree`
- `update_rem_rich`
- `set_rem_heading_level`
- `set_rem_text_color`
- `set_rem_highlight_color`
- `set_text_span_color`
- `set_text_span_highlight`
- `set_rem_type`
- `set_hide_bullet`
- `clear_rem_formatting`
- `create_styled_rem_tree`
- `apply_structured_note_batch`
- `create_basic_flashcard`
- `create_concept_card`
- `create_descriptor_card`
- `create_cloze_card`
- `create_multiple_choice_card`
- `create_list_answer_card`
- `delete_focused_rem`
- `delete_selected_rem`

`create_document` uses the RemNote SDK `setIsDocument(true)` behavior. `create_folder` returns `SDK_UNSUPPORTED` because the installed SDK typings do not expose a folder creation method.

`get_remnote_capability_guide` is a server-local knowledge pool built from RemNote help/forum sources. It gives ChatGPT/Vivy the working model for Rems, documents, folders, top-level Rems, formatting, flashcards, references, tags, portals, and the preferred bridge workflow.

`run_bridge_health_check` records pass/fail/skipped results for public tools. It is safe by default, can run a structured batch dry run when a parent Rem ID is supplied, and can execute safe writes only when `includeWrites` and a sandbox parent ID are provided. Destructive delete is never executed by the health check.

`apply_structured_note_batch` is the high-level note writer. It validates a styled tree root, supports dry runs and idempotency keys, creates the tree after one approval, can verify created Rem IDs after write, and returns partial execution plus rollback evidence when an SDK operation fails after creating Rems.

`replace_rem`, `delete_focused_rem`, and `delete_selected_rem` are destructive-hinted MCP tools and always require plugin-side approval. Arbitrary-ID `delete_rem` can be registered only with `REMNOTE_BRIDGE_ENABLE_DELETE_TOOL=1` for local development.

## Future Hosted App Architecture

Hosted mode must add real controls before public deployment:

```text
ChatGPT app
-> public HTTPS /mcp endpoint
-> OAuth sign-in
-> user account
-> paired plugin session
-> short-lived session token
-> scope grants
-> revocation/audit log
-> RemNote plugin WebSocket session
-> RemNote SDK
```

Required hosted controls:

- stable HTTPS endpoint for `/mcp`;
- OAuth provider with review-safe demo account;
- pairing flow that binds a plugin device/session to one user;
- short-lived session tokens stored server-side as hashes;
- scope grants enforced server-side and plugin-side;
- revocation path for sessions/devices;
- audit log that excludes note bodies, markdown payloads, tokens, and secrets;
- production storage for sessions and audit events.

Local mode remains separate:

```text
localhost / loopback
-> bridge token
-> one active RemNote plugin WebSocket
-> developer MCP use
```
