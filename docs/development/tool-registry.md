# Tool Registry & Profile Guide

This guide describes how the Model Context Protocol (MCP) tools are declared, cataloged, restricted by profiles, and exposed to clients at runtime.

---

## Code Files Architecture

1. **`shared/bridge/protocol.ts`**: Declares the JSON RPC message types, response models, validation schemas, and lists of allowed tools.
2. **`server/src/tool-policy.ts`**: Defines the security tiers, profile assignments (`core`, `advanced_notes`, `developer_diagnostics`, `full`), and canonical profiles.
3. **`server/src/tool-registry.ts`**: Registers the tool schema configurations, implements filtering rules based on the active profile, and generates public tools catalogs.
4. **`server/src/mcp-tool-map.ts`**: Routes incoming JSON RPC requests to their respective target handlers.
5. **`server/src/tools/`**: Holds implementation-specific parameters and utilities.

---

## Tool Profile Categories

The companion server supports four profiles, configured using `REMNOTE_BRIDGE_TOOL_PROFILE`:

| Profile | Target Audience | Allowed Operations |
| :--- | :--- | :--- |
| `core` | General users | Read/write basic notes, tags, child trees. Safe operations only. |
| `advanced_notes` | Advanced layouts | Apply style plans, concept card generation, raw markdown imports. |
| `developer_diagnostics` | Debugging / QA | Raw rich text inspection, status polling, diagnostic records. |
| `full` | Admins & Power users | All tools, including destructive operations (`delete_rem_by_id`). |

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
Open `server/src/tool-policy.ts`. Associate the tool with a classification category (e.g., `'read'`, `'write'`, `'dangerous'`), profile tier, and specify if it requires trusted authorization:
```typescript
export const TOOL_POLICIES: Record<BridgeToolName, ToolPolicy> = {
  my_new_tool: {
    category: 'write',
    requiresTrustedWrite: true,
    profiles: ['advanced_notes', 'full'],
  },
  ...
};
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
