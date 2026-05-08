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
      }),
      annotations: annotationsFor('append_to_rem'),
    },
    async ({ remId, markdown }) =>
      bridgeToolResult(() => hub.callPlugin('append_to_rem', { remId, markdown }), 'Append request processed.')
  );

  return server;
}
