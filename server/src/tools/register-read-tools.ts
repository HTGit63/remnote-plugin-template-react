import { z } from 'zod';
import {
  BRIDGE_TOOL_OUTPUT_SCHEMA,
  COLOR_SCHEMA,
  DELETE_CONFIRM_SCHEMA,
  EXPECTED_STYLE_MAP_ENTRY_SCHEMA,
  GET_CHILDREN_INPUT_SCHEMA,
  HEADING_LEVEL_SCHEMA,
  MARKDOWN_SCHEMA,
  MAX_CHILDREN_SCHEMA,
  PERMISSION_SCOPE_SCHEMA,
  POSITION_SCHEMA,
  PRACTICE_DIRECTION_SCHEMA,
  REM_ID_SCHEMA,
  REM_TREE_NODE_SCHEMA,
  REMNOTE_COMMAND_SCHEMA,
  REMNOTE_COMMAND_TARGET_SCHEMA,
  REMNOTE_GUIDE_SECTION_SCHEMA,
  REM_TYPE_SCHEMA,
  REORDER_CHILDREN_INPUT_SCHEMA,
  RICH_TEXT_SPAN_SCHEMA,
  SEARCH_REMS_INPUT_SCHEMA,
  SPAN_RANGE_INPUT_SCHEMA,
  STRUCTURED_NOTE_OPERATION_SCHEMA,
  STRUCTURED_NOTE_SCHEMA,
  STRUCTURED_NOTE_TARGET_SCHEMA,
  STYLED_REM_TREE_NODE_SCHEMA,
  STYLE_PLAN_OPERATION_SCHEMA,
  STYLING_PLAN_SCHEMA,
  TREE_DEPTH_SCHEMA,
} from './schemas.js';
import { annotationsFor, bridgeToolResult, type ToolRegistrationContext } from './tool-context.js';

export function registerReadTools({ registerTool, callPlugin }: ToolRegistrationContext): void {
  registerTool(
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

  registerTool(
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

  registerTool(
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

  registerTool(
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

  registerTool(
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

  registerTool(
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

  registerTool(
    'debug_get_raw_rich_text',
    {
      title: 'Debug raw Rem rich text',
      description:
        'Debug only. Use this for bridge development when normalized rich-text output is insufficient and raw RemNote SDK rich text must be inspected.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The RemNote Rem ID whose raw rich text should be read.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('debug_get_raw_rich_text'),
    },
    async ({ remId }) =>
      bridgeToolResult(() => callPlugin('debug_get_raw_rich_text', { remId }), 'Read raw Rem rich text.')
  );

  registerTool(
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

  registerTool(
    'get_children',
    {
      title: 'Get ordered Rem children',
      description:
        'Use this when the user needs direct child Rems of a parent Rem in their exact RemNote order.',
      inputSchema: GET_CHILDREN_INPUT_SCHEMA,
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('get_children'),
    },
    async ({ parentRemId, remId, maxChildren, limit }) =>
      bridgeToolResult(
        () =>
          callPlugin('get_children', {
            parentRemId: parentRemId ?? remId ?? '',
            maxChildren: maxChildren ?? limit,
          }),
        'Read ordered Rem children.'
      )
  );

  registerTool(
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

  registerTool(
    'search_rems',
    {
      title: 'Search Rems',
      description:
        'Use this when the user asks to find Rems by text. Results are capped and may be scoped to one context Rem.',
      inputSchema: SEARCH_REMS_INPUT_SCHEMA,
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('search_rems'),
    },
    async ({ query, contextRemId, maxResults, limit, scope }) =>
      bridgeToolResult(
        () =>
          callPlugin('search_rems', {
            query,
            contextRemId: contextRemId ?? null,
            maxResults: maxResults ?? limit,
            scope,
          }),
        'Searched Rems.'
      )
  );

  registerTool(
    'get_document_or_folder_tree',
    {
      title: 'Get document or folder tree',
      description:
        'Use this when the user needs the current document/folder context or a bounded tree rooted at a document-like Rem.',
      inputSchema: z.object({
        rootRemId: REM_ID_SCHEMA.nullable().optional().describe('Optional document, folder, portal, or Rem root ID.'),
        depth: TREE_DEPTH_SCHEMA.describe('Maximum descendant depth, capped at 3.'),
        maxChildren: MAX_CHILDREN_SCHEMA.optional().describe('Maximum children per node, capped at 100.'),
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

}
