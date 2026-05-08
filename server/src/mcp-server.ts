import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  type BridgeFailure,
  type BridgeResponse,
  type BridgeToolAnnotations,
  type BridgeToolName,
  BRIDGE_TOOL_ANNOTATIONS,
} from '../../src/bridge/protocol.js';
import type { BridgeHub } from './bridge-hub.js';

const REM_ID_SCHEMA = z.string().trim().min(1).max(256);
const MARKDOWN_SCHEMA = z.string().trim().min(1).max(20000);
const POSITION_SCHEMA = z.enum(['start', 'end']).default('end');

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

export function createMcpServer(hub: BridgeHub): McpServer {
  const server = new McpServer({
    name: 'remnote-chatgpt-bridge',
    version: '0.1.0',
  });

  server.registerTool(
    'get_bridge_status',
    {
      title: 'Get bridge status',
      description: 'Use this when you need to know whether the RemNote plugin is connected.',
      inputSchema: z.object({}),
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
        result: hub.getStatus(),
      },
    })
  );

  server.registerTool(
    'ping_remnote_plugin',
    {
      title: 'Ping RemNote plugin',
      description: 'Use this when you need to verify the WebSocket path to the running RemNote plugin.',
      inputSchema: z.object({
        message: z.string().trim().max(200).optional().describe('Optional ping message to echo through the plugin.'),
      }),
      annotations: annotationsFor('ping'),
    },
    async ({ message }) =>
      bridgeToolResult(() => hub.callPlugin('ping', { message }), 'RemNote plugin ping completed.')
  );

  server.registerTool(
    'get_plugin_status',
    {
      title: 'Get plugin status',
      description: 'Use this when you need RemNote-side bridge status, permission mode, and focused Rem availability.',
      inputSchema: z.object({}),
      annotations: annotationsFor('get_status'),
    },
    async () => bridgeToolResult(() => hub.callPlugin('get_status', {}), 'Read RemNote plugin status.')
  );

  server.registerTool(
    'get_focused_rem',
    {
      title: 'Get focused Rem',
      description: 'Use this when the user asks to read the Rem currently focused in RemNote.',
      inputSchema: z.object({}),
      annotations: annotationsFor('get_focused_rem'),
    },
    async () => bridgeToolResult(() => hub.callPlugin('get_focused_rem', {}), 'Read focused Rem.')
  );

  server.registerTool(
    'get_rem',
    {
      title: 'Get Rem',
      description: 'Use this when the user provides a Rem ID and asks to read that specific Rem.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The RemNote Rem ID to read.'),
      }),
      annotations: annotationsFor('get_rem'),
    },
    async ({ remId }) => bridgeToolResult(() => hub.callPlugin('get_rem', { remId }), 'Read Rem by ID.')
  );

  server.registerTool(
    'get_rem_tree',
    {
      title: 'Get Rem tree',
      description: 'Use this when the user asks to inspect a bounded Rem subtree by Rem ID.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The root RemNote Rem ID to read.'),
        depth: z.number().int().min(0).max(3).default(1).describe('Maximum descendant depth, capped at 3.'),
      }),
      annotations: annotationsFor('get_rem_tree'),
    },
    async ({ remId, depth }) =>
      bridgeToolResult(() => hub.callPlugin('get_rem_tree', { remId, depth }), 'Read bounded Rem tree.')
  );

  server.registerTool(
    'get_rem_rich',
    {
      title: 'Get Rem rich content',
      description: 'Use this when the user needs normalized rich text, math hints, and plain text for a Rem.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The RemNote Rem ID to read.'),
      }),
      annotations: annotationsFor('get_rem_rich'),
    },
    async ({ remId }) => bridgeToolResult(() => hub.callPlugin('get_rem_rich', { remId }), 'Read rich Rem content.')
  );

  server.registerTool(
    'get_current_selection',
    {
      title: 'Get current RemNote selection',
      description: 'Use this when the user asks what Rem is focused or selected in RemNote.',
      inputSchema: z.object({}),
      annotations: annotationsFor('get_current_selection'),
    },
    async () => bridgeToolResult(() => hub.callPlugin('get_current_selection', {}), 'Read current RemNote selection.')
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
      annotations: annotationsFor('create_rem'),
    },
    async ({ parentId, markdown }) =>
      bridgeToolResult(
        () => hub.callPlugin('create_rem', { parentId: parentId ?? null, markdown }),
        'Create Rem request processed.'
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
      annotations: annotationsFor('append_to_rem'),
    },
    async ({ remId, markdown, position }) =>
      bridgeToolResult(
        () => hub.callPlugin('append_to_rem', { remId, markdown, position }),
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
      annotations: annotationsFor('update_rem'),
    },
    async ({ remId, markdown }) =>
      bridgeToolResult(() => hub.callPlugin('update_rem', { remId, markdown }), 'Update request processed.')
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
      annotations: annotationsFor('move_rem'),
    },
    async ({ remId, newParentId, index }) =>
      bridgeToolResult(() => hub.callPlugin('move_rem', { remId, newParentId, index }), 'Move request processed.')
  );

  server.registerTool(
    'delete_rem',
    {
      title: 'Delete Rem',
      description: 'Use this when the user explicitly asks to delete a Rem and has provided confirmText DELETE.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The Rem ID to delete.'),
        recursive: z.boolean().default(false).describe('Whether to delete descendants too. Defaults to false.'),
        confirmText: z.literal('DELETE').describe('Required literal confirmation text.'),
      }),
      annotations: annotationsFor('delete_rem'),
    },
    async ({ remId, recursive, confirmText }) =>
      bridgeToolResult(
        () => hub.callPlugin('delete_rem', { remId, recursive, confirmText }),
        'Delete request processed.'
      )
  );

  server.registerTool(
    'create_rem_tree',
    {
      title: 'Create Rem tree',
      description: 'Use this when the user explicitly asks to create a nested Rem tree from structured JSON.',
      inputSchema: z.object({
        parentId: REM_ID_SCHEMA.describe('The parent Rem ID for the created tree root.'),
        tree: REM_TREE_NODE_SCHEMA.describe('Structured Rem tree to create.'),
      }),
      annotations: annotationsFor('create_rem_tree'),
    },
    async ({ parentId, tree }) =>
      bridgeToolResult(
        () => hub.callPlugin('create_rem_tree', { parentId, tree }),
        'Create Rem tree request processed.'
      )
  );

  return server;
}
