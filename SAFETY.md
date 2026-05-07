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

## Read-Only Behavior

Read tools serialize only bounded RemNote data:

- focused Rem;
- specific Rem by ID;
- Rem tree with capped depth;
- plain text/front/back fields;
- breadcrumb labels;
- truncated flag when data is limited.

Raw SDK objects are not sent across the bridge.

## Confirmed Writes

Safe write tools are:

- `create_rem`
- `append_to_rem`

In `confirm_writes`, these requests must appear in the bridge-status widget before execution. The user must approve or reject them inside RemNote.

## Dangerous Operations

Dangerous tools are:

- `replace_rem`
- `delete_rem`

These always require explicit approval in the internal bridge protocol, even in trusted modes. They are not exposed through the MCP/ChatGPT tool layer in the current shipping path.

## Companion Server Controls

The local server is constrained by default:

- binds to `127.0.0.1`;
- rejects non-loopback Host headers unless remote mode is explicitly enabled;
- requires `REMNOTE_BRIDGE_TOKEN` by default;
- allows no-token mode only when `REMNOTE_BRIDGE_ALLOW_NO_TOKEN=1` is explicitly set for isolated local development;
- requires `REMNOTE_BRIDGE_ALLOWED_ORIGINS` before CORS can be enabled;
- rejects browser-origin MCP requests when CORS is disabled;
- enforces MCP request body size limits;
- times out plugin bridge requests;
- keeps only one active plugin WebSocket connection.

Use a generated `REMNOTE_BRIDGE_TOKEN` and enter the same value in the plugin's `Bridge Token` setting for real use.

## Privacy Assumptions

The bridge should minimize note data:

- do not send the full knowledge base by default;
- keep tree depth small;
- cap child count and text length;
- avoid logging full note bodies;
- log request ID, tool name, status, duration, permission result, and error code instead.

The current server logs startup state and request failures without dumping Rem body text or markdown payloads.

## Manual Testing Rule

Do write tests only in a sandbox document first:

```text
Test KB Space / ChatGPT Bridge Sandbox
```

Never test append, replace, delete, or bulk operations on important notes first.
