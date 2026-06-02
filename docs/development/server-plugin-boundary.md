# Server-Plugin Boundary Architecture

This guide explains the architectural separation between the companion server and the browser plugin client. Keeping these domains strictly decoupled is essential for security, performance, and deployment safety.

---

## The Core decoupling Rule

```text
+-----------------------+           +-----------------------+
|  Plugin Client (src)  | --------> |  Shared Package       |
|  - React UI Widgets   |           |  - Protocol Contracts |
|  - RemNote Plugin SDK |           |  - AST Parsers        |
|  - Browser APIs       |           |  - Zod Schemas        |
+-----------------------+           +-----------------------+
            ^                                   ^
            | (WebSocket Protocol)              |
            v                                   |
+-----------------------+                       |
|  Companion Server     | ----------------------+
|  - HTTP MCP Server    |
|  - Node.js APIs       |
|  - PostgreSQL Driver  |
+-----------------------+
```

### 🚫 Forbidden Imports on Server:
* **No importing from `src/**`** (excluding `shared/` imports via compatibility paths).
* **No importing `@remnote/plugin-sdk`** (which relies on the browser's global RemNote API context).
* **No importing `React` or frontend widget libraries**.

### 🚫 Forbidden Imports in Shared package:
* No server-side internals (e.g., PostgreSQL connections, OAuth client secrets, file system readers).
* No plugin-side dependencies (e.g., RemNote SDK instances, UI hooks).

---

## Why the Boundary Exists

1. **Independent Server Deployment**: The companion server runs in headless container nodes (like Render or Docker). If it attempts to bundle or resolve browser-based Web APIs, React decorators, or Webpack modules, compilation will fail or create massive, bloated distribution bundles.
2. **Security Gating**: The companion server is a gatekeeper. By ensuring that it contains zero RemNote SDK implementation code, we enforce that all operations are authorized before being dispatched over the WebSocket socket connection.
3. **Execution Safety**: The companion server cannot bypass permission checking because it has no direct database access to the user's RemNote KB; it must cooperate with the plugin running inside the user's browser sandbox.

---

## Verifying the Boundary

We use a automated boundary verification script to inspect imports and the compiled build output structure:

```bash
# Execute boundary verification tests
npm run server:test:boundaries
```

This test checks two aspects:
1. **Source Imports Inspection**: Greps through `server/src/**` to ensure no illegal import paths or keywords exist.
2. **Distribution Outputs Check**: Verifies that the compiled directory structure inside `server/dist/` contains only `server/dist/server/**` and `server/dist/shared/**`, and is completely free of any compiled browser runtime modules (like `server/dist/src/**`).

---

## Troubleshooting Boundary Test Failures

If the boundaries test fails, check for the following common issues:

* **Stale tsconfig imports**: Ensure `server/tsconfig.json` has `exclude: ["../src/**"]` (excluding `shared/`) so that the TypeScript compiler does not automatically resolve and compile client files.
* **Shared code placement**: If you have utility functions (e.g., validators, parsers) that both server and plugin need, move them to the `shared/bridge/` directory. Do not place them in `server/src/` or `src/bridge/`.
* **Path Aliasing**: When importing files from `shared/` inside `server/src/`, use the relative file imports with `.js` extensions (e.g., `import { ... } from '../../shared/bridge/protocol.js'`).
