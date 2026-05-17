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

export function registerDeleteTools({ registerTool, callPlugin, exposeDeleteTool }: ToolRegistrationContext): void {
  registerTool(
    'delete_rem_by_id',
    {
      title: 'Delete Rem by ID safely',
      description:
        'Use this for deletion. Defaults to dryRun=true. Real delete requires dryRun=false plus matching expectedParentId or expectedAncestorId guard.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The exact Rem ID to inspect/delete.'),
        expectedParentId: REM_ID_SCHEMA.optional().describe('Guard: must match actual parent for real delete.'),
        expectedAncestorId: REM_ID_SCHEMA.optional().describe('Guard: must appear in breadcrumbs for real delete.'),
        confirmTitle: z.string().trim().max(1000).optional().describe('Optional guard: must match target plain text exactly when provided.'),
        dryRun: z.boolean().default(true).describe('Default true. Set false only after reviewing the dry-run target.'),
        idempotencyKey: z.string().trim().min(1).max(128).optional().describe('Returns the same delete result on retry in this plugin session.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('delete_rem_by_id'),
    },
    async ({ remId, expectedParentId, expectedAncestorId, confirmTitle, dryRun, idempotencyKey }) =>
      bridgeToolResult(
        () => callPlugin('delete_rem_by_id', { remId, expectedParentId, expectedAncestorId, confirmTitle, dryRun, idempotencyKey }),
        dryRun === false ? 'Delete Rem by ID request processed.' : 'Delete Rem by ID dry run processed.'
      )
  );

  // Legacy delete tools stay hidden unless local destructive exposure is explicitly enabled.
  if (exposeDeleteTool) {
    registerTool(
      'delete_focused_rem',
      {
        title: 'Delete focused Rem',
        description:
          'Legacy/private. Prefer delete_rem_by_id; focus-based delete can target the wrong Rem.',
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

    registerTool(
      'delete_selected_rem',
      {
        title: 'Delete selected Rem',
        description:
          'Legacy/private. Prefer delete_rem_by_id; selection-based delete can target the wrong Rem.',
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

    registerTool(
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

}
