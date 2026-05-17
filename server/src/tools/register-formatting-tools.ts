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

export function registerFormattingTools({ registerTool, callPlugin }: ToolRegistrationContext): void {
  registerTool(
    'set_rem_heading_level',
    {
      title: 'Set Rem heading level',
      description: 'Use this when a Rem should become H1, H2, H3, or normal text.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The target Rem ID.'),
        level: HEADING_LEVEL_SCHEMA.describe('Heading level to apply.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('set_rem_heading_level'),
    },
    async ({ remId, level }) =>
      bridgeToolResult(() => callPlugin('set_rem_heading_level', { remId, level }), 'Set Rem heading level.')
  );

  registerTool(
    'set_rem_text_color',
    {
      title: 'Set whole Rem text color',
      description: 'Use this when all text in one Rem should be colored.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The target Rem ID.'),
        color: COLOR_SCHEMA.describe('Color to apply.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('set_rem_text_color'),
    },
    async ({ remId, color }) =>
      bridgeToolResult(() => callPlugin('set_rem_text_color', { remId, color }), 'Set Rem text color.')
  );

  registerTool(
    'set_rem_highlight_color',
    {
      title: 'Set Rem highlight color',
      description: 'Use this when an entire Rem should receive a RemNote highlight color.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The target Rem ID.'),
        color: COLOR_SCHEMA.describe('Highlight color to apply.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('set_rem_highlight_color'),
    },
    async ({ remId, color }) =>
      bridgeToolResult(() => callPlugin('set_rem_highlight_color', { remId, color }), 'Set Rem highlight color.')
  );

  registerTool(
    'set_text_span_color',
    {
      title: 'Set partial text color',
      description: 'Use this when one word or character range inside a Rem should be colored.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The target Rem ID.'),
        ...SPAN_RANGE_INPUT_SCHEMA,
        color: COLOR_SCHEMA.describe('Color to apply to this text range.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('set_text_span_color'),
    },
    async ({ remId, range, start, end, text, occurrence, verifyAfterWrite, color }) =>
      bridgeToolResult(() => callPlugin('set_text_span_color', { remId, range, start, end, text, occurrence, verifyAfterWrite, color }), 'Set text span color.')
  );

  registerTool(
    'set_text_span_highlight',
    {
      title: 'Set partial text highlight',
      description: 'Use this when one word or character range inside a Rem should be highlighted.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The target Rem ID.'),
        ...SPAN_RANGE_INPUT_SCHEMA,
        color: COLOR_SCHEMA.describe('Highlight color to apply to this text range.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('set_text_span_highlight'),
    },
    async ({ remId, range, start, end, text, occurrence, verifyAfterWrite, color }) =>
      bridgeToolResult(
        () => callPlugin('set_text_span_highlight', { remId, range, start, end, text, occurrence, verifyAfterWrite, color }),
        'Set text span highlight.'
      )
  );

  registerTool(
    'set_rem_type',
    {
      title: 'Set Rem type',
      description: 'Use this when a Rem should become normal, concept, or descriptor.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The target Rem ID.'),
        type: REM_TYPE_SCHEMA.describe('Rem type to apply.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('set_rem_type'),
    },
    async ({ remId, type }) =>
      bridgeToolResult(() => callPlugin('set_rem_type', { remId, type }), 'Set Rem type.')
  );

  registerTool(
    'set_hide_bullet',
    {
      title: 'Set bullet visibility',
      description: 'Use this when a Rem bullet should be hidden or restored through SDK list-item state.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The target Rem ID.'),
        hideBullet: z.boolean().describe('True hides the bullet, false restores list-item bullet behavior.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('set_hide_bullet'),
    },
    async ({ remId, hideBullet }) =>
      bridgeToolResult(() => callPlugin('set_hide_bullet', { remId, hideBullet }), 'Set bullet visibility.')
  );

  registerTool(
    'clear_rem_formatting',
    {
      title: 'Clear Rem formatting',
      description:
        'Use this when a Rem should return to plain text where the installed SDK supports it. The result may report partial clearing for unsupported Rem-level resets.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The target Rem ID.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('clear_rem_formatting'),
    },
    async ({ remId }) =>
      bridgeToolResult(() => callPlugin('clear_rem_formatting', { remId }), 'Processed Rem formatting clear request.')
  );

  registerTool(
    'create_styled_rem_tree',
    {
      title: 'Create styled Rem tree',
      description:
        'Fallback/developer tool for directly creating a nested styled RemNote tree. Prefer create_polished_note_tree or apply_structured_note_batch for normal ChatGPT note creation.',
      inputSchema: z.object({
        parentId: REM_ID_SCHEMA.describe('The parent Rem ID for the created tree root.'),
        position: POSITION_SCHEMA.describe('Where to place the tree root under the parent Rem.'),
        tree: STYLED_REM_TREE_NODE_SCHEMA.describe('Structured styled Rem tree.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('create_styled_rem_tree'),
    },
    async ({ parentId, position, tree }) =>
      bridgeToolResult(
        () => callPlugin('create_styled_rem_tree', { parentId, position, tree }),
        'Create styled Rem tree request processed.'
      )
  );

}

export function registerStyleVerificationTools({ registerTool, callPlugin }: ToolRegistrationContext): void {
  registerTool(
    'apply_style_plan',
    {
      title: 'Apply style plan',
      description:
        'Preferred tool for applying multiple formatting operations to existing Rems with per-operation status and optional verification evidence.',
      inputSchema: z.object({
        operations: z.array(STYLE_PLAN_OPERATION_SCHEMA).min(1).max(100).describe('Ordered style operations.'),
        continueOnError: z.boolean().default(true).describe('True returns per-operation failures and keeps going.'),
        verifyAfterWrite: z.boolean().default(false).describe('Return verification evidence when available.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('apply_style_plan'),
    },
    async ({ operations, continueOnError, verifyAfterWrite }) =>
      bridgeToolResult(
        () => callPlugin('apply_style_plan', { operations, continueOnError, verifyAfterWrite }),
        'Apply style plan request processed.'
      )
  );

  registerTool(
    'verify_note_design',
    {
      title: 'Verify note design',
      description:
        'Preferred verification tool after note creation or styling. Compares headings, highlights, colored spans, plain text, and child order against an expected style map.',
      inputSchema: z.object({
        rootRemId: REM_ID_SCHEMA.describe('Root Rem ID for the design verification.'),
        expectedStyleMap: z.record(REM_ID_SCHEMA, EXPECTED_STYLE_MAP_ENTRY_SCHEMA).describe('Expected styles keyed by Rem ID.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('verify_note_design'),
    },
    async ({ rootRemId, expectedStyleMap }) =>
      bridgeToolResult(
        () => callPlugin('verify_note_design', { rootRemId, expectedStyleMap }),
        'Verify note design request processed.'
      )
  );

}
