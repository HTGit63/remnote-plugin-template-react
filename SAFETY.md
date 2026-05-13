# Safety Controls and Permissions

This plugin requests broad RemNote read/write access so it can become a controlled bridge to the user's knowledge base. That access must stay bounded by typed tools, explicit permissions, and approval UI.

## Permission Modes

| Mode | Reads | Create/append | Replace/delete |
| --- | --- | --- | --- |
| `read_only` | allowed | blocked | blocked |
| `confirm_writes` | allowed | approval required | approval required |
| `trusted_writes` | allowed | allowed | approval required |
| `danger_zone` | allowed | allowed | approval required |

Default mode is `confirm_writes`.

## Permission Scopes

The plugin also enforces a local scope before it touches RemNote SDK data:

| Scope | Behavior |
| --- | --- |
| `focused_rem_only` | Allows requests anchored to the focused Rem. Workspace create is blocked. |
| `focused_rem_and_descendants` | Allows requests inside the focused Rem subtree, including children created during the current workflow. |
| `selected_rem_only` | Allows requests anchored to currently selected Rem IDs only. |
| `selected_rem_and_descendants` | Allows requests inside the selected Rem subtree. |
| `approved_document_or_folder` | Allows requests inside the configured `Approved Root Rem ID`. |
| `workspace_allowed` | Allows broader bounded reads and workspace-level create. |

Default scope is `focused_rem_only`. Scope is enforced inside the plugin handler, so the companion server cannot bypass it.

## Read-Only Behavior

Read tools serialize only bounded RemNote data:

- focused Rem;
- specific Rem by ID;
- Rem tree with capped depth;
- Rem tree with a total serialized-node cap;
- plain text/front/back fields;
- breadcrumb labels;
- summary titles truncated before crossing the bridge;
- truncated flag when data is limited.

Raw SDK objects are not sent across the bridge.

## Confirmed Writes

Safe write tools are:

- `create_rem`
- `append_to_rem`
- `create_document`
- `create_folder`
- `update_rem`
- `move_rem`
- `reorder_children`
- `create_rem_tree`

In `confirm_writes`, these requests must appear in the bridge-status widget before execution. The user must approve or reject them inside RemNote.

`create_folder` currently returns `SDK_UNSUPPORTED` because the installed RemNote SDK typings expose document creation through `setIsDocument(true)` but do not expose folder creation.

## Dangerous Operations

Dangerous tools are:

- `replace_rem`
- `delete_focused_rem`
- `delete_selected_rem`
- `delete_rem`

These always require explicit approval in the internal bridge protocol, even in trusted modes. `replace_rem`, `delete_focused_rem`, and `delete_selected_rem` are exposed through MCP with destructive hints. `delete_rem` is arbitrary-ID delete and is not exposed by default.

Focused/selected delete requires a plugin-side preview showing the target title, target Rem ID, parent title when available, child count, descendant count for recursive deletes, the recursive flag, and the required literal text `DELETE`. The RemNote widget also requires the user to type `DELETE` before the approval button can run the delete.

`delete_rem` can be exposed only for local development by setting `REMNOTE_BRIDGE_ENABLE_DELETE_TOOL=1`. Keep arbitrary-ID delete disabled for normal use.

## Approval and No-Hang Policy

Every bridge request must resolve once:

- approve returns `ok: true`;
- reject returns `APPROVAL_REJECTED`;
- ignored approval returns `APPROVAL_TIMEOUT`;
- duplicate approval while one is pending returns `APPROVAL_PENDING`;
- plugin disconnect returns `PLUGIN_NOT_CONNECTED`;
- MCP caller disconnect returns `CLIENT_DISCONNECTED` in server diagnostics and sends plugin-side cancellation;
- server bridge timeout returns `TIMEOUT`;
- invalid bridge input returns `INVALID_ARGS`.

The widget shows one approval at a time. Hidden approval queues are not allowed because the user cannot review them.
If the MCP caller disconnects while an approval is pending, the companion server sends `cancel_request` to the plugin so the user cannot approve a write whose caller will never receive the final response.

## Companion Server Controls

The local server is constrained by default:

- binds to `127.0.0.1`;
- rejects non-loopback Host headers unless remote mode is explicitly enabled;
- requires `REMNOTE_BRIDGE_TOKEN` by default;
- allows no-token mode only when `REMNOTE_BRIDGE_ALLOW_NO_TOKEN=1` is explicitly set for isolated local development;
- requires `REMNOTE_BRIDGE_ALLOWED_ORIGINS` before CORS can be enabled;
- rejects browser-origin MCP requests when CORS is disabled;
- enforces MCP request body size limits;
- enforces WebSocket message size limits;
- times out plugin bridge requests;
- records recent request outcomes without note bodies or markdown;
- keeps only one active plugin WebSocket connection.
- fails startup if hosted mode is enabled before real OAuth/pairing support exists.

Use a generated `REMNOTE_BRIDGE_TOKEN` and enter the same value in the plugin's `Bridge Token` setting for real use.

## Privacy Assumptions

The bridge should minimize note data:

- do not send the full knowledge base by default;
- keep tree depth small;
- cap child count and text length;
- avoid logging full note bodies;
- log request ID, tool name, status, duration, permission result, auth mode, endpoint, and error code instead.

The current server audit log records auth/request metadata without dumping Rem body text, markdown payloads, tokens, or secrets.

## Manual Testing Rule

Do write tests only in a sandbox document first:

```text
Test KB Space / ChatGPT Bridge Sandbox
```

Never test append, replace, delete, or bulk operations on important notes first.
