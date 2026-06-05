# Local Development Setup Guide

This guide provides a comprehensive overview of how to set up, configure, run, and verify the RemNote MCP Bridge in a local development environment.

## Quick Start Commands

To quickly bootstrap the workspace:

```bash
# Install root dependencies (primarily for plugin development)
npm install

# Install companion server dependencies
npm run server:install

# Compile the companion server
npm run server:build

# Start the companion server in local watch mode
npm run server:dev
```

## Network Architecture & Endpoints

When running locally, the companion server listens on the following defaults:

* **WebSocket Endpoint (Plugin Connection)**:  
  `ws://127.0.0.1:47391/remnote-bridge`
* **HTTP Endpoint (MCP Client / ChatGPT)**:  
  `http://127.0.0.1:47392/mcp`

The RemNote plugin (loaded in the browser or desktop app) connects as a client to the WebSocket endpoint. The MCP client (e.g., Cursor, Claude Desktop, or ChatGPT connector) connects to the HTTP endpoint to dispatch tool requests.

---

## Local Configuration via `.env`

You can customize the server behavior using local environment variables. Create a `.env` file in the root directory (or in `server/.env`).

### Recommended Local Developer Configuration:

```env
NODE_ENV=development
REMNOTE_BRIDGE_DEPLOYMENT_MODE=local
REMNOTE_BRIDGE_WS_PORT=47391
REMNOTE_BRIDGE_MCP_PORT=47392
REMNOTE_BRIDGE_HOST=127.0.0.1

# Enable token-based security for local client requests
REMNOTE_BRIDGE_TOKEN=dev-secret-token-123

# Allow test tools like delete_rem_by_id to be exposed
REMNOTE_BRIDGE_ENABLE_DELETE_TOOL=1
REMNOTE_BRIDGE_TOOL_PROFILE=danger
```

### Authentication Controls

* **Secure Bearer Token Mode**: Set `REMNOTE_BRIDGE_TOKEN=your_token`. All incoming MCP tool requests must supply `Authorization: Bearer your_token` headers.
* **No-Token Mode (Isolated Dev Only)**: Set `REMNOTE_BRIDGE_ALLOW_NO_TOKEN=1`. This bypasses local request signature checks. *Never use this in production or hosted mode.*

---

## Verifying the Local Setup

### 1. Check WebSocket Server Status
Ensure the companion server is running, then verify that the WebSocket server is listening. You can verify it by running:
```bash
curl -I http://127.0.0.1:47392/health
```
This should return a `200 OK` with a JSON body indicating the bridge server health and pairing state.

### 2. Verify Bearer Authentication
If you set `REMNOTE_BRIDGE_TOKEN=dev-secret-token-123`, verify that requests without the token are blocked:
```bash
curl -X POST http://127.0.0.1:47392/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}'
```
Expected output: `401 Unauthorized` or an MCP error indicating unauthorized access.

Now, try with the valid bearer token:
```bash
curl -X POST http://127.0.0.1:47392/mcp \
  -H "Authorization: Bearer dev-secret-token-123" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}'
```
Expected output: `200 OK` containing the list of registered MCP tools.

---

## Troubleshooting Local Disconnects

* **`PLUGIN_NOT_CONNECTED`**: The companion server is reachable, but your browser-side RemNote plugin is either not open, has crashed, or failed to establish its WebSocket connection to `ws://127.0.0.1:47391/remnote-bridge`. Verify that the plugin is running in your active RemNote tab.
* **CORS Errors**: If you are running tests or embedding the widget in custom origins, set `REMNOTE_BRIDGE_ALLOW_CORS=1` and `REMNOTE_BRIDGE_ALLOWED_ORIGINS=*` (or specify your custom port origin).
* **Port Conflicts**: If port `47391` or `47392` is already in use, check background processes or change port configurations in your environment.
