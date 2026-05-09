import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  type BridgeFailure,
  type BridgeResponse,
  type BridgeToolAnnotations,
  type BridgeToolName,
  type BridgeToolArgs,
  BRIDGE_TOOL_ANNOTATIONS,
} from '../../src/bridge/protocol.js';
import type { BridgeHub } from './bridge-hub.js';
import { getToolRegistrySummary } from './tool-registry.js';

const REM_ID_SCHEMA = z.string().trim().min(1).max(256);
const MARKDOWN_SCHEMA = z.string().trim().min(1).max(20000);
const POSITION_SCHEMA = z.enum(['start', 'end']).default('end');
const MAX_CHILDREN_SCHEMA = z.number().int().min(1).max(100).default(25);
const MAX_SEARCH_RESULTS_SCHEMA = z.number().int().min(1).max(25).default(10);
const TREE_DEPTH_SCHEMA = z.number().int().min(0).max(3).default(1);
const ORDERED_CHILD_IDS_SCHEMA = z.array(REM_ID_SCHEMA).max(500);
const DELETE_CONFIRM_SCHEMA = z.literal('DELETE');
const BRIDGE_TOOL_OUTPUT_SCHEMA = z.object({
  ok: z.boolean(),
  result: z.unknown().optional(),
  error: z.unknown().optional(),
});

interface RemTreeNodeInput {
  title: string;
  children?: RemTreeNodeInput[];
}

const REM_TREE_NODE_SCHEMA: z.ZodType<RemTreeNodeInput> = z.lazy(() =>
  z.object({
    title: z.string().trim().min(1).max(1000).describe('Text/markdown title for this Rem node.'),
    children: z.array(REM_TREE_NODE_SCHEMA).max(100).optional().describe('Ordered child Rem nodes.'),
  })
);

type McpToolResult = {
  content: Array<{ type: 'text'; text: string }>;
  structuredContent: Record<string, unknown>;
  isError?: boolean;
};

export interface CreateMcpServerOptions {
  exposeDeleteTool?: boolean;
  requestSignal?: AbortSignal;
}

function annotationsFor(tool: BridgeToolName): BridgeToolAnnotations {
  return BRIDGE_TOOL_ANNOTATIONS[tool];
}

function failureToToolResult(failure: BridgeFailure): McpToolResult {
  return {
    isError: true,
    content: [
      {
        type: 'text',
        text: `${failure.error.code}: ${failure.error.message}`,
      },
    ],
    structuredContent: {
      ok: false,
      error: failure.error,
    },
  };
}

function internalErrorToToolResult(error: unknown): McpToolResult {
  const message = error instanceof Error ? error.message : String(error);
  console.error('MCP bridge tool failed:', message);
  return failureToToolResult({
    id: 'unknown',
    ok: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Bridge tool call failed internally.',
      details: {
        message,
      },
    },
  });
}

function successToToolResult(response: BridgeResponse, message: string): McpToolResult {
  if (!response.ok) {
    return failureToToolResult(response);
  }

  return {
    content: [
      {
        type: 'text',
        text: message,
      },
    ],
    structuredContent: {
      ok: true,
      result: response.result,
    },
  };
}

async function bridgeToolResult(
  call: () => Promise<BridgeResponse>,
  successMessage: string
): Promise<McpToolResult> {
  try {
    return successToToolResult(await call(), successMessage);
  } catch (error: unknown) {
    return internalErrorToToolResult(error);
  }
}

export function createMcpServer(hub: BridgeHub, options: CreateMcpServerOptions = {}): McpServer {
  const server = new McpServer({
    name: 'remnote-chatgpt-bridge',
    version: '0.1.0',
  });
  const toolRegistry = getToolRegistrySummary(options.exposeDeleteTool);
  const callPlugin = <TTool extends BridgeToolName>(
    tool: TTool,
    args: BridgeToolArgs[TTool],
    timeoutMs?: number
  ) => hub.callPlugin(tool, args, timeoutMs, options.requestSignal);

  server.registerTool(
    'get_bridge_status',
    {
      title: 'Get bridge status',
      description: 'Use this when you need to know whether the RemNote plugin is connected.',
      inputSchema: z.object({}),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async () => ({
      content: [{ type: 'text', text: hub.getStatus().connected ? 'RemNote plugin connected.' : 'RemNote plugin not connected.' }],
      structuredContent: {
        ok: true,
        result: {
          ...hub.getStatus(),
          ...toolRegistry,
          serverStartedAt: hub.getDiagnostics().startedAt,
          recentRequestCount: hub.getDiagnostics().recentRequests.length,
        },
      },
    })
  );

  server.registerTool(
    'get_bridge_diagnostics',
    {
      title: 'Get bridge diagnostics',
      description:
        'Use this when the RemNote connector looks stale, a tool call did not return, or you need the live tool registry and recent request outcomes.',
      inputSchema: z.object({}),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async () => {
      const diagnostics = hub.getDiagnostics();
      return {
        content: [
          {
            type: 'text',
            text: `Bridge diagnostics: ${toolRegistry.publicToolCount} tools, ${diagnostics.status.pendingRequests} pending requests.`,
          },
        ],
        structuredContent: {
          ok: true,
          result: {
            ...toolRegistry,
            ...diagnostics,
          },
        },
      };
    }
  );

  server.registerTool(
    'ping_remnote_plugin',
    {
      title: 'Ping RemNote plugin',
      description: 'Use this when you need to verify the WebSocket path to the running RemNote plugin.',
      inputSchema: z.object({
        message: z.string().trim().max(200).optional().describe('Optional ping message to echo through the plugin.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('ping'),
    },
    async ({ message }) =>
      bridgeToolResult(() => callPlugin('ping', { message }), 'RemNote plugin ping completed.')
  );

  server.registerTool(
    'get_plugin_status',
    {
      title: 'Get plugin status',
      description: 'Use this when you need RemNote-side bridge status, permission mode, and focused Rem availability.',
      inputSchema: z.object({}),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('get_status'),
    },
    async () => bridgeToolResult(() => callPlugin('get_status', {}), 'Read RemNote plugin status.')
  );

  server.registerTool(
    'get_focused_rem',
    {
      title: 'Get focused Rem',
      description: 'Use this when the user asks to read the Rem currently focused in RemNote.',
      inputSchema: z.object({}),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('get_focused_rem'),
    },
    async () => bridgeToolResult(() => callPlugin('get_focused_rem', {}), 'Read focused Rem.')
  );

  server.registerTool(
    'get_rem',
    {
      title: 'Get Rem',
      description: 'Use this when the user provides a Rem ID and asks to read that specific Rem.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The RemNote Rem ID to read.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('get_rem'),
    },
    async ({ remId }) => bridgeToolResult(() => callPlugin('get_rem', { remId }), 'Read Rem by ID.')
  );

  server.registerTool(
    'get_rem_tree',
    {
      title: 'Get Rem tree',
      description: 'Use this when the user asks to inspect a bounded Rem subtree by Rem ID.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The root RemNote Rem ID to read.'),
        depth: TREE_DEPTH_SCHEMA.describe('Maximum descendant depth, capped at 3.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('get_rem_tree'),
    },
    async ({ remId, depth }) =>
      bridgeToolResult(() => callPlugin('get_rem_tree', { remId, depth }), 'Read bounded Rem tree.')
  );

  server.registerTool(
    'get_rem_rich',
    {
      title: 'Get Rem rich content',
      description: 'Use this when the user needs normalized rich text, math hints, and plain text for a Rem.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The RemNote Rem ID to read.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('get_rem_rich'),
    },
    async ({ remId }) => bridgeToolResult(() => callPlugin('get_rem_rich', { remId }), 'Read rich Rem content.')
  );

  server.registerTool(
    'get_current_selection',
    {
      title: 'Get current RemNote selection',
      description: 'Use this when the user asks what Rem is focused or selected in RemNote.',
      inputSchema: z.object({}),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('get_current_selection'),
    },
    async () => bridgeToolResult(() => callPlugin('get_current_selection', {}), 'Read current RemNote selection.')
  );

  server.registerTool(
    'get_children',
    {
      title: 'Get ordered Rem children',
      description:
        'Use this when the user needs direct child Rems of a parent Rem in their exact RemNote order.',
      inputSchema: z.object({
        parentRemId: REM_ID_SCHEMA.describe('The parent RemNote Rem ID whose direct children should be read.'),
        maxChildren: MAX_CHILDREN_SCHEMA.describe('Maximum direct children to return, capped at 100.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('get_children'),
    },
    async ({ parentRemId, maxChildren }) =>
      bridgeToolResult(
        () => callPlugin('get_children', { parentRemId, maxChildren }),
        'Read ordered Rem children.'
      )
  );

  server.registerTool(
    'get_rem_breadcrumbs',
    {
      title: 'Get Rem breadcrumbs',
      description: 'Use this when the user needs the parent chain for a Rem before editing or navigating.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The RemNote Rem ID whose parent chain should be read.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('get_rem_breadcrumbs'),
    },
    async ({ remId }) =>
      bridgeToolResult(
        () => callPlugin('get_rem_breadcrumbs', { remId }),
        'Read Rem breadcrumbs.'
      )
  );

  server.registerTool(
    'search_rems',
    {
      title: 'Search Rems',
      description:
        'Use this when the user asks to find Rems by text. Results are capped and may be scoped to one context Rem.',
      inputSchema: z.object({
        query: z.string().trim().min(1).max(500).describe('Search text. Keep focused and specific.'),
        contextRemId: REM_ID_SCHEMA.nullable().optional().describe('Optional Rem ID to scope search under.'),
        maxResults: MAX_SEARCH_RESULTS_SCHEMA.describe('Maximum results to return, capped at 25.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('search_rems'),
    },
    async ({ query, contextRemId, maxResults }) =>
      bridgeToolResult(
        () => callPlugin('search_rems', { query, contextRemId: contextRemId ?? null, maxResults }),
        'Searched Rems.'
      )
  );

  server.registerTool(
    'get_document_or_folder_tree',
    {
      title: 'Get document or folder tree',
      description:
        'Use this when the user needs the current document/folder context or a bounded tree rooted at a document-like Rem.',
      inputSchema: z.object({
        rootRemId: REM_ID_SCHEMA.nullable().optional().describe('Optional document, folder, portal, or Rem root ID.'),
        depth: TREE_DEPTH_SCHEMA.describe('Maximum descendant depth, capped at 3.'),
        maxChildren: MAX_CHILDREN_SCHEMA.describe('Maximum children per node, capped at 100.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('get_document_or_folder_tree'),
    },
    async ({ rootRemId, depth, maxChildren }) =>
      bridgeToolResult(
        () =>
          callPlugin('get_document_or_folder_tree', {
            rootRemId: rootRemId ?? null,
            depth,
            maxChildren,
          }),
        'Read document or folder tree.'
      )
  );

  server.registerTool(
    'create_rem',
    {
      title: 'Create Rem',
      description: 'Use this when the user explicitly asks to create a new Rem from markdown.',
      inputSchema: z.object({
        parentId: z.string().trim().max(256).nullable().optional().describe('Optional parent Rem ID.'),
        markdown: MARKDOWN_SCHEMA.describe('Markdown content to create in RemNote.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('create_rem'),
    },
    async ({ parentId, markdown }) =>
      bridgeToolResult(
        () => callPlugin('create_rem', { parentId: parentId ?? null, markdown }),
        'Create Rem request processed.'
      )
  );

  server.registerTool(
    'create_document',
    {
      title: 'Create RemNote document',
      description:
        'Use this when the user explicitly asks to create a new RemNote document from markdown.',
      inputSchema: z.object({
        parentId: z.string().trim().max(256).nullable().optional().describe('Optional parent Rem ID.'),
        markdown: MARKDOWN_SCHEMA.describe('Markdown title/content for the new document Rem.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('create_document'),
    },
    async ({ parentId, markdown }) =>
      bridgeToolResult(
        () => callPlugin('create_document', { parentId: parentId ?? null, markdown }),
        'Create document request processed.'
      )
  );

  server.registerTool(
    'create_folder',
    {
      title: 'Create RemNote folder',
      description:
        'Use this when the user asks to create a RemNote folder. Returns SDK_UNSUPPORTED if the installed RemNote SDK cannot create folders.',
      inputSchema: z.object({
        parentId: z.string().trim().max(256).nullable().optional().describe('Optional parent Rem ID.'),
        markdown: MARKDOWN_SCHEMA.describe('Folder title/content requested by the user.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('create_folder'),
    },
    async ({ parentId, markdown }) =>
      bridgeToolResult(
        () => callPlugin('create_folder', { parentId: parentId ?? null, markdown }),
        'Create folder request processed.'
      )
  );

  server.registerTool(
    'append_to_rem',
    {
      title: 'Append to Rem',
      description: 'Use this when the user explicitly asks to append markdown as a child of an existing Rem.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The target RemNote Rem ID.'),
        markdown: MARKDOWN_SCHEMA.describe('Markdown content to append under the target Rem.'),
        position: POSITION_SCHEMA.describe('Where to place the new child under the target Rem.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('append_to_rem'),
    },
    async ({ remId, markdown, position }) =>
      bridgeToolResult(
        () => callPlugin('append_to_rem', { remId, markdown, position }),
        'Append request processed.'
      )
  );

  server.registerTool(
    'update_rem',
    {
      title: 'Update Rem text',
      description: 'Use this when the user explicitly asks to replace the text of an existing Rem.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The target RemNote Rem ID.'),
        markdown: MARKDOWN_SCHEMA.describe('Markdown content that replaces the target Rem text.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('update_rem'),
    },
    async ({ remId, markdown }) =>
      bridgeToolResult(() => callPlugin('update_rem', { remId, markdown }), 'Update request processed.')
  );

  server.registerTool(
    'replace_rem',
    {
      title: 'Replace Rem text',
      description:
        'Use this when the user explicitly asks to overwrite the visible text of an existing Rem. Children are not rewritten.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The target RemNote Rem ID.'),
        markdown: MARKDOWN_SCHEMA.describe('Markdown content that replaces the target Rem text.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('replace_rem'),
    },
    async ({ remId, markdown }) =>
      bridgeToolResult(() => callPlugin('replace_rem', { remId, markdown }), 'Replace request processed.')
  );

  server.registerTool(
    'move_rem',
    {
      title: 'Move Rem',
      description: 'Use this when the user explicitly asks to move a Rem under another Rem at a specific index.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The Rem ID to move.'),
        newParentId: REM_ID_SCHEMA.describe('The new parent Rem ID.'),
        index: z.number().int().min(0).describe('Zero-based child index under the new parent.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('move_rem'),
    },
    async ({ remId, newParentId, index }) =>
      bridgeToolResult(() => callPlugin('move_rem', { remId, newParentId, index }), 'Move request processed.')
  );

  server.registerTool(
    'reorder_children',
    {
      title: 'Reorder Rem children',
      description:
        'Use this when the user explicitly asks to reorder all direct children under one parent Rem.',
      inputSchema: z.object({
        parentRemId: REM_ID_SCHEMA.describe('The parent Rem whose direct children should be reordered.'),
        orderedChildRemIds: ORDERED_CHILD_IDS_SCHEMA.describe('Full ordered list of current direct child Rem IDs.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('reorder_children'),
    },
    async ({ parentRemId, orderedChildRemIds }) =>
      bridgeToolResult(
        () => callPlugin('reorder_children', { parentRemId, orderedChildRemIds }),
        'Reorder children request processed.'
      )
  );

  server.registerTool(
    'delete_focused_rem',
    {
      title: 'Delete focused Rem',
      description:
        'Use this only when the user explicitly asks to delete the Rem currently focused in RemNote.',
      inputSchema: z.object({
        recursive: z.boolean().default(false).describe('Whether to delete descendants too. Defaults to false.'),
        confirmText: DELETE_CONFIRM_SCHEMA.describe('Required literal confirmation text.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('delete_focused_rem'),
    },
    async ({ recursive, confirmText }) =>
      bridgeToolResult(
        () => callPlugin('delete_focused_rem', { recursive, confirmText }),
        'Delete focused Rem request processed.'
      )
  );

  server.registerTool(
    'delete_selected_rem',
    {
      title: 'Delete selected Rem',
      description:
        'Use this only when the user explicitly asks to delete exactly one currently selected Rem in RemNote.',
      inputSchema: z.object({
        recursive: z.boolean().default(false).describe('Whether to delete descendants too. Defaults to false.'),
        confirmText: DELETE_CONFIRM_SCHEMA.describe('Required literal confirmation text.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('delete_selected_rem'),
    },
    async ({ recursive, confirmText }) =>
      bridgeToolResult(
        () => callPlugin('delete_selected_rem', { recursive, confirmText }),
        'Delete selected Rem request processed.'
      )
  );

  // Arbitrary ID delete stays off in public descriptors; focused/selected delete remains preview-gated.
  if (options.exposeDeleteTool) {
    server.registerTool(
      'delete_rem',
      {
        title: 'Delete Rem',
        description: 'Use this only in local development when destructive tool exposure is explicitly enabled.',
        inputSchema: z.object({
          remId: REM_ID_SCHEMA.describe('The Rem ID to delete.'),
          recursive: z.boolean().default(false).describe('Whether to delete descendants too. Defaults to false.'),
          confirmText: DELETE_CONFIRM_SCHEMA.describe('Required literal confirmation text.'),
        }),
        outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
        annotations: annotationsFor('delete_rem'),
      },
      async ({ remId, recursive, confirmText }) =>
        bridgeToolResult(
          () => callPlugin('delete_rem', { remId, recursive, confirmText }),
          'Delete request processed.'
        )
    );
  }

  server.registerTool(
    'create_rem_tree',
    {
      title: 'Create Rem tree',
      description: 'Use this when the user explicitly asks to create a nested Rem tree from structured JSON.',
      inputSchema: z.object({
        parentId: REM_ID_SCHEMA.describe('The parent Rem ID for the created tree root.'),
        tree: REM_TREE_NODE_SCHEMA.describe('Structured Rem tree to create.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('create_rem_tree'),
    },
    async ({ parentId, tree }) =>
      bridgeToolResult(
        () => callPlugin('create_rem_tree', { parentId, tree }),
        'Create Rem tree request processed.'
      )
  );

  return server;
}
