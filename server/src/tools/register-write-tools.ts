import { z } from 'zod';
import {
  BRIDGE_TOOL_OUTPUT_SCHEMA,
  APPEND_MARKDOWN_AS_REM_TREE_INPUT_SCHEMA,
  COLOR_SCHEMA,
  CREATE_NOTE_FROM_MARKDOWN_TREE_INPUT_SCHEMA,
  CREATE_OR_REPLACE_NOTE_FROM_MARKDOWN_INPUT_SCHEMA,
  DELETE_CONFIRM_SCHEMA,
  EXPECTED_STYLE_MAP_ENTRY_SCHEMA,
  GET_CHILDREN_INPUT_SCHEMA,
  HEADING_LEVEL_SCHEMA,
  IDEMPOTENCY_KEY_SCHEMA,
  MARKDOWN_SCHEMA,
  MAX_CHILDREN_SCHEMA,
  MAX_TREE_NODE_COUNT_SCHEMA,
  NOTE_STYLE_PRESET_FIELDS_SCHEMA,
  PERMISSION_SCOPE_SCHEMA,
  POSITION_SCHEMA,
  PREVIEW_MARKDOWN_NOTE_TREE_INPUT_SCHEMA,
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

export function registerBasicWriteTools({ registerTool, callPlugin }: ToolRegistrationContext): void {
  registerTool(
    'create_rem',
    {
      title: 'Create Rem',
      description: 'Use this when the user explicitly asks to create a new Rem from markdown.',
      inputSchema: z.object({
        parentId: z.string().trim().max(256).nullable().optional().describe('Optional parent Rem ID.'),
        markdown: MARKDOWN_SCHEMA.describe('Markdown content to create in RemNote.'),
        idempotencyKey: IDEMPOTENCY_KEY_SCHEMA.optional().describe('Prevents duplicate Rem creation when the same key is reused.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('create_rem'),
    },
    async ({ parentId, markdown, idempotencyKey }) =>
      bridgeToolResult(
        () => callPlugin('create_rem', { parentId: parentId ?? null, markdown, idempotencyKey }),
        'Create Rem request processed.'
      )
  );

  registerTool(
    'create_document',
    {
      title: 'Create RemNote document',
      description:
        'Use this when the user explicitly asks to create a new RemNote document from markdown.',
      inputSchema: z.object({
        parentId: z.string().trim().max(256).nullable().optional().describe('Optional parent Rem ID.'),
        markdown: MARKDOWN_SCHEMA.describe('Markdown title/content for the new document Rem.'),
        idempotencyKey: IDEMPOTENCY_KEY_SCHEMA.optional().describe('Prevents duplicate document creation when the same key is reused.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('create_document'),
    },
    async ({ parentId, markdown, idempotencyKey }) =>
      bridgeToolResult(
        () => callPlugin('create_document', { parentId: parentId ?? null, markdown, idempotencyKey }),
        'Create document request processed.'
      )
  );

  registerTool(
    'create_folder',
    {
      title: 'Create RemNote folder',
      description:
        'Use this when the user asks to create a RemNote folder. Hidden until the modern SDK folder path is live-verified.',
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

  registerTool(
    'append_to_rem',
    {
      title: 'Append to Rem',
      description: 'Use this when the user explicitly asks to append markdown as a child of an existing Rem.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The target RemNote Rem ID.'),
        markdown: MARKDOWN_SCHEMA.describe('Markdown content to append under the target Rem.'),
        position: POSITION_SCHEMA.describe('Where to place the new child under the target Rem.'),
        idempotencyKey: IDEMPOTENCY_KEY_SCHEMA.optional().describe('Prevents duplicate append requests when the same key is reused.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('append_to_rem'),
    },
    async ({ remId, markdown, position, idempotencyKey }) =>
      bridgeToolResult(
        () => callPlugin('append_to_rem', { remId, markdown, position, idempotencyKey }),
        'Append request processed.'
      )
  );

  registerTool(
    'update_rem',
    {
      title: 'Update Rem text',
      description: 'Use this when the user explicitly asks to replace the text of an existing Rem.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The target RemNote Rem ID.'),
        markdown: MARKDOWN_SCHEMA.describe('Markdown content that replaces the target Rem text.'),
        dryRun: z.boolean().default(false).describe('Validate target and preview new markdown without replacing text.'),
        idempotencyKey: IDEMPOTENCY_KEY_SCHEMA.optional().describe('Prevents duplicate update requests.'),
        expectedPlainText: z.string().max(5000).optional().describe('Guard: current Rem plain text must match before update.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('update_rem'),
    },
    async ({ remId, markdown, dryRun, idempotencyKey, expectedPlainText }) =>
      bridgeToolResult(() => callPlugin('update_rem', { remId, markdown, dryRun, idempotencyKey, expectedPlainText }), 'Update request processed.')
  );

  registerTool(
    'replace_rem',
    {
      title: 'Replace Rem text',
      description:
        'Use this when the user explicitly asks to overwrite the visible text of an existing Rem. Children are not rewritten.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The target RemNote Rem ID.'),
        markdown: MARKDOWN_SCHEMA.describe('Markdown content that replaces the target Rem text.'),
        dryRun: z.boolean().default(false).describe('Validate target and preview new markdown without replacing text.'),
        idempotencyKey: IDEMPOTENCY_KEY_SCHEMA.optional().describe('Prevents duplicate replace requests.'),
        expectedPlainText: z.string().max(5000).optional().describe('Guard: current Rem plain text must match before replace.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('replace_rem'),
    },
    async ({ remId, markdown, dryRun, idempotencyKey, expectedPlainText }) =>
      bridgeToolResult(() => callPlugin('replace_rem', { remId, markdown, dryRun, idempotencyKey, expectedPlainText }), 'Replace request processed.')
  );

  registerTool(
    'move_rem',
    {
      title: 'Move Rem',
      description: 'Use this when the user explicitly asks to move a Rem under another Rem at a specific index.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The Rem ID to move.'),
        newParentId: REM_ID_SCHEMA.describe('The new parent Rem ID.'),
        index: z.number().int().min(0).describe('Zero-based child index under the new parent.'),
        dryRun: z.boolean().default(false).describe('Validate target, parent, and index without moving.'),
        idempotencyKey: IDEMPOTENCY_KEY_SCHEMA.optional().describe('Prevents duplicate move requests.'),
        expectedParentId: REM_ID_SCHEMA.optional().describe('Guard: current parent must match before real move.'),
        expectedAncestorId: REM_ID_SCHEMA.optional().describe('Guard: current ancestor chain must include this ID before real move.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('move_rem'),
    },
    async ({ remId, newParentId, index, dryRun, idempotencyKey, expectedParentId, expectedAncestorId }) =>
      bridgeToolResult(() => callPlugin('move_rem', { remId, newParentId, index, dryRun, idempotencyKey, expectedParentId, expectedAncestorId }), 'Move request processed.')
  );

  registerTool(
    'reorder_children',
    {
      title: 'Reorder Rem children',
      description:
        'Use this when the user explicitly asks to reorder all direct children under one parent Rem.',
      inputSchema: REORDER_CHILDREN_INPUT_SCHEMA,
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('reorder_children'),
    },
    async ({ parentRemId, parentId, orderedChildRemIds, orderedChildIds, dryRun, idempotencyKey, allowPartial }) =>
      bridgeToolResult(
        () =>
          callPlugin('reorder_children', {
            parentRemId: parentRemId ?? parentId ?? '',
            orderedChildRemIds: orderedChildRemIds ?? orderedChildIds ?? [],
            dryRun,
            idempotencyKey,
            allowPartial,
          }),
        'Reorder children request processed.'
      )
  );

}

export function registerTreeWriteTools({ registerTool, callPlugin }: ToolRegistrationContext): void {
  registerTool(
    'create_rem_tree',
    {
      title: 'Create Rem tree',
      description: 'Use this when the user explicitly asks to create a nested Rem tree from structured JSON.',
      inputSchema: z.object({
        parentId: REM_ID_SCHEMA.describe('The parent Rem ID for the created tree root.'),
        position: POSITION_SCHEMA.describe('Where to place the tree root under the parent Rem.'),
        tree: REM_TREE_NODE_SCHEMA.describe('Structured Rem tree to create.'),
        idempotencyKey: IDEMPOTENCY_KEY_SCHEMA.optional().describe('Prevents duplicate tree creation when the same key is reused.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('create_rem_tree'),
    },
    async ({ parentId, position, tree, idempotencyKey }) =>
      bridgeToolResult(
        () => callPlugin('create_rem_tree', { parentId, position, tree, idempotencyKey }),
        'Create Rem tree request processed.'
      )
  );

  registerTool(
    'update_rem_rich',
    {
      title: 'Update Rem rich text',
      description: 'Use this when you need to replace a Rem with structured rich text spans or math nodes.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The target Rem ID.'),
        richText: z.array(RICH_TEXT_SPAN_SCHEMA).min(1).max(200).describe('Ordered RemNote rich text spans.'),
        idempotencyKey: IDEMPOTENCY_KEY_SCHEMA.optional().describe('Prevents duplicate rich text updates when the same key is reused.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('update_rem_rich'),
    },
    async ({ remId, richText, idempotencyKey }) =>
      bridgeToolResult(() => callPlugin('update_rem_rich', { remId, richText, idempotencyKey }), 'Updated Rem rich text.')
  );

}

export function registerHighLevelWriteTools({ registerTool, callPlugin }: ToolRegistrationContext): void {
  registerTool(
    'apply_remnote_command',
    {
      title: 'Apply RemNote command',
      description:
        'Use this when one safe shortcut-like RemNote command should apply to a focused, selected, or explicit Rem without keyboard simulation.',
      inputSchema: z.object({
        target: REMNOTE_COMMAND_TARGET_SCHEMA.describe('Focused Rem, selected Rem, or explicit Rem ID target.'),
        command: REMNOTE_COMMAND_SCHEMA.describe('Safe RemNote command to apply.'),
        args: z
          .object({
            latex: z.string().max(5000).optional().describe('LaTeX for insert_inline_math or insert_math_block.'),
            text: z.string().max(5000).optional().describe('Optional prefix text for math insertion.'),
          })
          .optional(),
        dryRun: z.boolean().default(false).describe('Validate command target and payload without applying the command.'),
        idempotencyKey: z.string().trim().min(1).max(128).optional().describe('Prevents duplicate command application for repeated calls in this plugin session.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('apply_remnote_command'),
    },
    async ({ target, command, args, dryRun, idempotencyKey }) =>
      bridgeToolResult(
        () => callPlugin('apply_remnote_command', { target, command, args, dryRun, idempotencyKey }),
        'Applied RemNote command.'
      )
  );

  registerTool(
    'preview_markdown_note_tree',
    {
      title: 'Preview Markdown note tree',
      description:
        'Parse Markdown into the exact RemNote-native hierarchy plan without writing. Use before creating long notes, formula-heavy notes, tables, or flashcard-marker content.',
      inputSchema: PREVIEW_MARKDOWN_NOTE_TREE_INPUT_SCHEMA,
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('preview_markdown_note_tree'),
    },
    async (args) =>
      bridgeToolResult(
        () => callPlugin('preview_markdown_note_tree', args),
        'Markdown note tree preview generated.'
      )
  );

  registerTool(
    'create_note_from_markdown_tree',
    {
      title: 'Create note from Markdown tree',
      description:
        'Preferred safe writer for creating a clean RemNote-native hierarchy from Markdown. Headings, bullets, formulas, tables, and worked examples become Rem structure instead of visible Markdown syntax.',
      inputSchema: CREATE_NOTE_FROM_MARKDOWN_TREE_INPUT_SCHEMA,
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('create_note_from_markdown_tree'),
    },
    async (args) =>
      bridgeToolResult(
        () => callPlugin('create_note_from_markdown_tree', args),
        'Markdown hierarchy create request processed.'
      )
  );

  registerTool(
    'append_markdown_as_rem_tree',
    {
      title: 'Append Markdown as Rem tree',
      description:
        'Append Markdown under an existing Rem as clean child Rem hierarchy. Use instead of append_to_rem when user expects structured notes, bullets, formulas, or tables.',
      inputSchema: APPEND_MARKDOWN_AS_REM_TREE_INPUT_SCHEMA,
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('append_markdown_as_rem_tree'),
    },
    async (args) =>
      bridgeToolResult(
        () => callPlugin('append_markdown_as_rem_tree', args),
        'Markdown hierarchy append request processed.'
      )
  );

  registerTool(
    'create_or_replace_note_from_markdown',
    {
      title: 'Create or replace note from Markdown',
      description:
        'Preferred one-call bulk importer for long lecture notes, ESSLCE notes, math/physics/chemistry notes, and copied Markdown outlines. Preserves headings, paragraphs, bullets, math, code, and source order; never summarizes user source text.',
      inputSchema: CREATE_OR_REPLACE_NOTE_FROM_MARKDOWN_INPUT_SCHEMA,
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('create_or_replace_note_from_markdown'),
    },
    async (args) =>
      bridgeToolResult(
        () => callPlugin('create_or_replace_note_from_markdown', args),
        'Markdown note import request processed.'
      )
  );

  registerTool(
    'apply_structured_note_batch',
    {
      title: 'Apply structured note batch',
      description:
        'Preferred atomic batch writer for approved RemNote note changes. Supports dry-run previews, idempotency, rollback, styled hierarchy, math, and optional verification.',
      inputSchema: z.object({
        ...NOTE_STYLE_PRESET_FIELDS_SCHEMA,
        target: STRUCTURED_NOTE_TARGET_SCHEMA.optional().describe('Preferred target object. Use focused_rem + create_child_tree for normal note writing.'),
        operation: STRUCTURED_NOTE_OPERATION_SCHEMA.describe('Batch operation. create_child_tree is safest for new notes.'),
        parentId: REM_ID_SCHEMA.optional().describe('Legacy parent Rem ID for create_child_tree.'),
        position: POSITION_SCHEMA.describe('Where to place the batch root under the parent Rem.'),
        root: STYLED_REM_TREE_NODE_SCHEMA.optional().describe('Legacy structured styled note root and descendants.'),
        note: STRUCTURED_NOTE_SCHEMA.optional().describe('Production note payload with root plus ordered children.'),
        dryRun: z.boolean().default(false).describe('Validate and preview the batch without writing Rems.'),
        idempotencyKey: z.string().trim().min(1).max(128).optional().describe('Prevents duplicate writes for repeated calls in this server session.'),
        rollbackOnFailure: z.boolean().default(true).describe('Best-effort remove Rems created before a failed batch.'),
        verifyAfterWrite: z.boolean().default(false).describe('Read created Rem IDs after write and report missing IDs.'),
        maxDepth: TREE_DEPTH_SCHEMA.describe('Maximum accepted depth for this batch plan.'),
        maxNodeCount: MAX_TREE_NODE_COUNT_SCHEMA.describe('Maximum accepted node count for this batch plan.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('apply_structured_note_batch'),
    },
    async ({ target, operation, parentId, position, root, note, dryRun, idempotencyKey, rollbackOnFailure, verifyAfterWrite, maxDepth, maxNodeCount, stylePreset, course, rootHeadingLevel, sectionHeadingLevel, insertSiblingSpacers, spacerText, majorFormulaMode }) =>
      bridgeToolResult(
        () =>
          callPlugin('apply_structured_note_batch', {
            stylePreset,
            course,
            rootHeadingLevel,
            sectionHeadingLevel,
            insertSiblingSpacers,
            spacerText,
            majorFormulaMode,
            target,
            operation,
            parentId,
            position,
            root,
            note,
            dryRun,
            idempotencyKey,
            rollbackOnFailure,
            verifyAfterWrite,
            maxDepth,
            maxNodeCount,
          }),
        'Structured note batch request processed.'
      )
  );

  registerTool(
    'create_polished_note_tree',
    {
      title: 'Create polished note tree',
      description:
        'Preferred tool for creating complete polished RemNote notes with hierarchy, rich styling, math, flashcards, idempotency, and optional post-write verification.',
      inputSchema: z.object({
        ...NOTE_STYLE_PRESET_FIELDS_SCHEMA,
        parentId: REM_ID_SCHEMA.describe('Parent Rem ID for the created polished tree.'),
        tree: STYLED_REM_TREE_NODE_SCHEMA.describe('Structured styled Rem tree.'),
        stylingPlan: STYLING_PLAN_SCHEMA.optional().describe('Optional post-create style operations with explicit Rem IDs.'),
        dryRun: z.boolean().default(false).describe('Validate and preview the full polished note plan without writing.'),
        verifyAfterWrite: z.boolean().default(false).describe('Read created Rem IDs after write and report missing IDs.'),
        idempotencyKey: z.string().trim().min(1).max(128).optional().describe('Prevents duplicate note trees for repeated calls in this plugin session.'),
        maxDepth: TREE_DEPTH_SCHEMA.describe('Maximum accepted depth for this note tree.'),
        maxNodeCount: MAX_TREE_NODE_COUNT_SCHEMA.describe('Maximum accepted node count for this note tree.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('create_polished_note_tree'),
    },
    async ({ parentId, tree, stylingPlan, dryRun, verifyAfterWrite, idempotencyKey, maxDepth, maxNodeCount, stylePreset, course, rootHeadingLevel, sectionHeadingLevel, insertSiblingSpacers, spacerText, majorFormulaMode }) =>
      bridgeToolResult(
        () => callPlugin('create_polished_note_tree', { parentId, tree, stylingPlan, dryRun, verifyAfterWrite, idempotencyKey, maxDepth, maxNodeCount, stylePreset, course, rootHeadingLevel, sectionHeadingLevel, insertSiblingSpacers, spacerText, majorFormulaMode }),
        'Create polished note tree request processed.'
      )
  );

}
