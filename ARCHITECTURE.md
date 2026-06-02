# Architecture

## Layers

```text
shared/bridge/**
  SDK-free protocol, parser, validators, type contracts

server/src/**
  MCP HTTP transport, OAuth/local auth, hosted pairing, routing, storage, registry, diagnostics

src/**
  RemNote plugin UI, WebSocket client, approval flow, RemNote SDK read/write execution
```

## Import Rules

Server may import:

```text
shared/**
server/src/**
node built-ins
@modelcontextprotocol/sdk
pg
ws
zod
```

Server must not import:

```text
@remnote/plugin-sdk
React
src/remnote/**
src/widgets/**
src/bridge/client.ts
src/bridge/handlers.ts
src/bridge/pairing.ts
```

Plugin code may import `shared/**`, React, and `@remnote/plugin-sdk`. Plugin code must not import `server/src/**`.

Boundary enforcement:

```bash
npm run server:test:boundaries
```

## Runtime Flow

```text
MCP request
  -> server/src/app.ts
  -> OAuth/local-token auth
  -> tool registry/profile filtering
  -> server/src/mcp-server.ts
  -> server/src/tools/*
  -> server/src/bridge-hub.ts
  -> plugin WebSocket
  -> src/bridge/handlers.ts
  -> src/remnote/read.ts or src/remnote/write/*
```

## Tool Registry

The active public tool list is derived from:

```text
server/src/tool-registry.ts
server/src/tool-policy.ts
server/src/tools/*
shared/bridge/protocol.ts
```

`get_bridge_status`, `get_bridge_diagnostics`, `/health`, and MCP `tools/list` expose the same registry version and active profile. Counts are generated at runtime, not maintained in docs.

`delete_rem_by_id` is gated by `REMNOTE_BRIDGE_ENABLE_DELETE_TOOL=1` and full profile. Legacy focus/selection/direct delete tools are absent.

`create_folder` is SDK-unsupported and not public/callable.

## Markdown Import

`create_or_replace_note_from_markdown` is the preferred long-note path. The parser lives in `shared/bridge/markdown-importer.ts`; execution lives in the RemNote plugin write layer. It performs one bridge write request, supports dry-run planning, enforces depth/node limits, and returns source-fidelity verification.

## Code File Architecture

All major implementation files have been successfully split and modularized to conform to strict size guidelines:
- `src/remnote/write/index.ts` has been decomposed into modular sub-modules, leaving a clean, 13-line barrel file.
- `src/bridge/handlers.ts` has been split into dedicated validators, normalizers, and checkers under `src/bridge/handlers/`, leaving the main entrypoint at 655 lines.
- `server/src/bridge-hub.ts` has been split into evidence helpers, type contracts, and retry policies under `server/src/bridge/`, leaving the main class at 980 lines.
- No source code file is over the 1000-line limit (excluding testing harness scripts such as `server/src/smoke.ts`).

