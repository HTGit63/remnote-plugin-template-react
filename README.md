# RemNote ChatGPT Bridge

This repository is a RemNote plugin moving toward a local bridge architecture.

The plugin is not an AI chatbot inside RemNote. It does not call OpenAI directly, does not store an OpenAI API key, and does not choose models. ChatGPT or Vivy remains the reasoning layer. This plugin is the RemNote SDK access layer.

## Product Direction

Target flow:

```text
ChatGPT / Vivy
-> MCP-compatible tool layer
-> local companion server
-> WebSocket bridge
-> running RemNote plugin
-> RemNote SDK
-> user's RemNote knowledge base
```

The plugin exposes controlled RemNote operations:

- read the focused Rem;
- read a specific Rem by ID;
- read a bounded Rem tree;
- create a Rem from markdown;
- append markdown under an existing Rem;
- require approval for writes by default;
- keep destructive operations behind explicit confirmation.

## Current Milestone State

Implemented now:

- docs and product direction updated for the bridge;
- active OpenAI API-key and runtime request path removed;
- RemNote SDK reads, writes, serialization, and permissions moved into service files;
- right sidebar replaced with a bridge-status widget;
- WebSocket bridge client inside the plugin;
- local companion server under `server/`;
- read-only MCP tools for focused Rem, Rem by ID, and bounded Rem trees;
- safe create/append write tools with RemNote-side approval by default;
- MCP/ChatGPT-compatible tool layer at `http://127.0.0.1:47392/mcp`.

## Local Setup

1. Run `npm install`
2. Run `npm run dev`
3. In RemNote open `Settings -> Plugins -> Build`
4. Use `Develop from localhost`
5. Enter `http://localhost:8080`
6. Enable the plugin

Do not enter `/manifest.json` in RemNote. Use `http://localhost:8080` only.

## Companion Server Setup

Install and run the local server separately:

```bash
npm run server:install
export REMNOTE_BRIDGE_TOKEN="$(openssl rand -hex 32)"
npm run server:dev
```

Then enter the same token in the plugin's `Bridge Token` setting. The server listens on:

- WebSocket bridge: `ws://127.0.0.1:47391/remnote-bridge`
- MCP endpoint: `http://127.0.0.1:47392/mcp`

The server binds to `127.0.0.1` by default. Remote bind or CORS requires a token, and CORS also requires `REMNOTE_BRIDGE_ALLOWED_ORIGINS`.

`REMNOTE_BRIDGE_TOKEN` is required by default. Use `REMNOTE_BRIDGE_ALLOW_NO_TOKEN=1` only for isolated local development.

## MCP Tools

The companion server exposes:

- `get_bridge_status`
- `ping_remnote_plugin`
- `get_plugin_status`
- `get_focused_rem`
- `get_rem`
- `get_rem_tree`
- `create_rem`
- `append_to_rem`

`replace_rem` and `delete_rem` exist only in the internal bridge protocol and are not exposed through MCP in this shipping path.

## Settings

- `Bridge Server URL`: defaults to `ws://localhost:47391/remnote-bridge`
- `Bridge Permission Mode`: defaults to `Confirm Writes`
- `Bridge Token`: must match `REMNOTE_BRIDGE_TOKEN`

No OpenAI API key setting is required.

## Validation Commands

```bash
npm run check-types
npm run validate
npm run build
npm run server:build
npm run server:smoke
```

## Project Docs

- `Agents.md`
- `ARCHITECTURE.md`
- `SAFETY.md`
- `NEXT_STEPS.md`
