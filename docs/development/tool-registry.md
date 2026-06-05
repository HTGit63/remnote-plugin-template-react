# Tool Registry & Profile Guide

This guide describes how the Model Context Protocol (MCP) tools are declared, cataloged, restricted by access tiers, and exposed to clients at runtime.

---

## Code Files Architecture

1. **`shared/bridge/protocol.ts`**: Declares the JSON RPC message types, response models, validation schemas, and lists of allowed tools.
2. **`server/src/tool-policy.ts`**: Defines the security tiers, access-tier assignments (`basic`, `note_writer`, `power_user`, `developer`, `danger`), and legacy aliases.
3. **`server/src/tool-registry.ts`**: Registers the tool schema configurations, implements filtering rules based on the active profile, and generates public tools catalogs.
4. **`server/src/mcp-tool-map.ts`**: Routes incoming JSON RPC requests to their respective target handlers.
5. **`server/src/tools/`**: Holds implementation-specific parameters and utilities.

---

## Tool Access Tiers

The companion server supports five access tiers, configured using `REMNOTE_BRIDGE_TOOL_PROFILE`:

| Tier | Target Audience | Allowed Operations |
| :--- | :--- | :--- |
| `basic` | Read-only/status clients | Bridge status, focused Rem, Rem trees, breadcrumbs, search. |
| `note_writer` | Normal note writing | Basic plus create/import, Markdown/tree imports, batch note creation, cards, verification. |
| `power_user` | Scoped power editing | Note writer plus rich updates, style plans, move/reorder, formatting commands. |
| `developer` | Debugging / QA | Power user plus diagnostics, health checks, capability guide, raw rich text inspection. |
| `danger` | Explicit destructive testing/admin | Developer plus destructive operations, currently only `delete_rem_by_id` when enabled. |

Legacy aliases still normalize: `core -> basic`, `advanced_notes -> note_writer`, `developer_diagnostics -> developer`, `full -> danger`.

---

## Step-by-Step: How to Add a New MCP Tool

Follow these steps to implement and register a new tool in the bridge system:

### Step 1: Define the Protocol Contract
Open `shared/bridge/protocol.ts`. Add your tool name to `BridgeToolName`:
```typescript
export type BridgeToolName =
  | 'get_rem'
  | 'my_new_tool' // Add your tool here
  | ...;
```
Define the argument payload contract and verification checks inside `protocol.ts` using `zod` or TypeScript interface guards.

### Step 2: Configure Policy & Tier
Open `server/src/tool-policy.ts`. Put the tool in the smallest correct tier list, then add metadata for category, risk, dry-run/idempotency support, and whether it requires write/delete authorization:
```typescript
export const NOTE_WRITER_TIER_TOOLS = [
  'my_new_tool',
] as const;

meta('my_new_tool', 'write', 'medium', {
  supportsDryRun: true,
  supportsIdempotency: true,
});
```

### Step 3: Register Tool Metadata
Open `server/src/tool-registry.ts`. Register your tool schema description, arguments schema, and description annotations so that MCP clients can discover it:
```typescript
{
  name: 'my_new_tool',
  description: 'Explain what your new tool does here.',
  inputSchema: {
    type: 'object',
    properties: {
      remId: { type: 'string', description: 'Target Rem ID' }
    },
    required: ['remId']
  }
}
```

### Step 4: Map the Server Execution Route
Open `server/src/mcp-tool-map.ts`. Map the MCP request payload parsing to bridge-hub forwarders:
```typescript
case 'my_new_tool':
  return forwardToPlugin(toolName, args, targetSocket);
```

### Step 5: Implement the Plugin Handler
Open `src/bridge/handlers.ts` (or the relevant submodule under `src/bridge/handlers/`). Wire the execution logic to invoke the RemNote SDK:
```typescript
export async function handleMyNewTool(args: any, context: BridgeContext) {
  // Call RemNote SDK
  const rem = await context.sdk.rem.findOne(args.remId);
  ...
  return { ok: true, result: { status: 'success' } };
}
```

---

## Testing Tool Registries

Validate that profile-based filtering is functioning correctly:

```bash
# Run the automated tool profile certification check
npm run server:test:tool-profile
```
This script validates that unauthorized tools are hidden, parameters match specifications, and that the unsupported `create_folder` is masked.
