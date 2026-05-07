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
    bridge-hub.ts
    config.ts
    http.ts
    index.ts
    mcp-client.ts
    mcp-server.ts
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
- tool impact annotations for later MCP descriptor generation.

Unknown tools must return `UNKNOWN_TOOL`. Arbitrary command strings are not a valid bridge input.

## Permission Enforcement

`src/remnote/permissions.ts` defines four modes:

- `read_only`
- `confirm_writes`
- `trusted_writes`
- `danger_zone`

Reads are allowed in all modes. Safe writes require approval in `confirm_writes`. Destructive tools such as replace and delete always require approval outside `read_only`, and are blocked in `read_only`.

## WebSocket Bridge

`src/bridge/client.ts` runs inside the plugin. It opens the configured WebSocket URL, sends a typed plugin hello, reconnects with backoff, dispatches bridge requests through `src/bridge/handlers.ts`, and reports connection state to the widget.

The plugin handler validates request IDs, known tools, Rem IDs, markdown size, and tree depth before touching the RemNote SDK. Writes go through the permission module and can pause on the widget approval Promise.

## Local Companion Server

The companion server is a separate Node/TypeScript package under `server/`.

It provides:

- WebSocket server on `127.0.0.1:47391/remnote-bridge`;
- MCP Streamable HTTP endpoint on `127.0.0.1:47392/mcp`;
- one active plugin connection at a time;
- request/response ID tracking with timeouts;
- token checks by default through `REMNOTE_BRIDGE_TOKEN`;
- loopback host validation and optional CORS allowlisting.

## MCP/ChatGPT Tool Layer

`server/src/mcp-server.ts` registers the MCP tools. Read tools route through the WebSocket bridge and return structured RemNote payloads. Safe write tools route through the same bridge and depend on the plugin permission mode.

The MCP layer intentionally exposes only safe writes:

- `create_rem`
- `append_to_rem`

Destructive internal bridge tools are not registered as MCP tools.
