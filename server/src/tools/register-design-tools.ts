import { z } from 'zod';
import {
  BRIDGE_TOOL_OUTPUT_SCHEMA,
  CARD_REPAIR_CARD_SCHEMA,
  CONNECTOR_SAFE_EXPECTED_STYLE_MAP_SCHEMA,
  CONNECTOR_SAFE_PRACTICE_DIRECTION_SCHEMA,
  DESIGN_TEMPLATE_RULES_SCHEMA,
  DESIGNED_NOTE_CONTENT_SCHEMA,
  IDEMPOTENCY_KEY_SCHEMA,
  LONG_MARKDOWN_SCHEMA,
  MAX_TREE_NODE_COUNT_SCHEMA,
  NOTE_STYLE_PRESET_SCHEMA,
  REM_ID_SCHEMA,
  STYLE_PLAN_OPERATION_SCHEMA,
  TREE_DEPTH_SCHEMA,
} from './schemas.js';
import { annotationsFor, bridgeToolResult, type ToolRegistrationContext } from './tool-context.js';

const TEMPLATE_ID_SCHEMA = z.string().trim().min(1).max(128);
const TEMPLATE_JSON_SCHEMA = z.string().trim().min(1).max(120000);
const TEMPLATE_NAME_SCHEMA = z.string().trim().min(1).max(120);
const TEMPLATE_DESCRIPTION_SCHEMA = z.string().trim().min(1).max(1000);
const CARD_LIMIT_SCHEMA = z.number().int().min(1).max(100);
const CARD_TYPE_SCHEMA = z.enum(['basic', 'concept', 'descriptor', 'cloze', 'multiple_choice', 'list_answer']);
const EXPECTED_CARD_SCHEMA = z.object({
  front: z.string().trim().min(1).max(5000).describe('Expected card front or cloze plain text.'),
  back: z.string().trim().min(1).max(5000).optional().describe('Expected back text when the card type uses a back.'),
  cardType: CARD_TYPE_SCHEMA.optional().describe('Expected card type. Omit when type is not part of the assertion.'),
}).strict();

export function registerDesignTemplateTools({ registerTool, callPlugin }: ToolRegistrationContext): void {
  registerTool(
    'analyze_note_design',
    {
      title: 'Analyze note design',
      description:
        'Extract reusable RemNote design rules from a sample Rem tree: headings, colors, spacing, formulas, tables, cards, and worked examples.',
      inputSchema: z.object({
        rootRemId: REM_ID_SCHEMA.optional().describe('Exact sample/root Rem to analyze.'),
        sampleRemId: REM_ID_SCHEMA.optional().describe('Alias for rootRemId.'),
        maxDepth: TREE_DEPTH_SCHEMA.optional(),
        maxNodes: MAX_TREE_NODE_COUNT_SCHEMA.optional(),
      })
        .refine((value) => Boolean(value.rootRemId || value.sampleRemId), {
          message: 'Provide rootRemId or sampleRemId; focus fallback is disabled.',
        })
        .refine((value) => !(value.rootRemId && value.sampleRemId && value.rootRemId !== value.sampleRemId), {
          message: 'rootRemId and sampleRemId must match when both are provided.',
        }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('analyze_note_design'),
    },
    async (args) => bridgeToolResult(() => callPlugin('analyze_note_design', args), 'Analyzed note design.')
  );

  registerTool(
    'save_note_design_template',
    {
      title: 'Save note design template',
      description:
        'Persist safe reusable note design rules in RemNote plugin local storage. Use analyze_note_design first unless rules are supplied.',
      inputSchema: z.object({
        templateId: TEMPLATE_ID_SCHEMA.optional(),
        name: TEMPLATE_NAME_SCHEMA,
        description: TEMPLATE_DESCRIPTION_SCHEMA.optional(),
        sourceRemId: REM_ID_SCHEMA.optional(),
        rootRemId: REM_ID_SCHEMA.optional(),
        rules: DESIGN_TEMPLATE_RULES_SCHEMA.optional(),
        overwrite: z.boolean().optional(),
        expectedVersion: z.number().int().min(1).optional(),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('save_note_design_template'),
    },
    async (args) => bridgeToolResult(() => callPlugin('save_note_design_template', args as never), 'Saved note design template.')
  );

  registerTool(
    'list_note_design_templates',
    {
      title: 'List note design templates',
      description: 'List locally saved RemNote design templates.',
      inputSchema: z.object({
        includeRules: z.boolean().optional(),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('list_note_design_templates'),
    },
    async (args) => bridgeToolResult(() => callPlugin('list_note_design_templates', args), 'Listed note design templates.')
  );

  registerTool(
    'preview_note_design_plan',
    {
      title: 'Preview note design plan',
      description: 'Dry-run preview of design-template changes before creating, appending, replacing, or repairing Rems.',
      inputSchema: z.object({
        templateId: TEMPLATE_ID_SCHEMA.optional(),
        templateJson: TEMPLATE_JSON_SCHEMA.optional(),
        targetRemId: REM_ID_SCHEMA.optional(),
        parentId: REM_ID_SCHEMA.optional(),
        title: z.string().trim().min(1).max(1000).optional(),
        content: LONG_MARKDOWN_SCHEMA.optional(),
        mode: z.enum(['create', 'append', 'replace_children', 'repair']).optional(),
        rules: DESIGN_TEMPLATE_RULES_SCHEMA.optional(),
        stylePreset: NOTE_STYLE_PRESET_SCHEMA.optional(),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('preview_note_design_plan'),
    },
    async (args) => bridgeToolResult(() => callPlugin('preview_note_design_plan', args as never), 'Previewed note design plan.')
  );

  registerTool(
    'export_note_design_template',
    {
      title: 'Export note design template',
      description: 'Export a locally saved design template as validated JSON for backup or sharing.',
      inputSchema: z.object({
        templateId: TEMPLATE_ID_SCHEMA,
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('export_note_design_template'),
    },
    async (args) => bridgeToolResult(() => callPlugin('export_note_design_template', args), 'Exported note design template.')
  );

  registerTool(
    'import_note_design_template',
    {
      title: 'Import note design template',
      description: 'Import safe design-template JSON into local plugin storage. Unsafe operation rules are rejected.',
      inputSchema: z.object({
        templateJson: TEMPLATE_JSON_SCHEMA,
        overwrite: z.boolean().optional(),
        expectedVersion: z.number().int().min(1).optional(),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('import_note_design_template'),
    },
    async (args) => bridgeToolResult(() => callPlugin('import_note_design_template', args), 'Imported note design template.')
  );
}

export function registerDesignedNoteTools({ registerTool, callPlugin }: ToolRegistrationContext): void {
  registerTool(
    'create_designed_note_tree',
    {
      title: 'Create designed note tree',
      description:
        'High-level one-call creator for polished RemNote notes from content and an optional saved design template.',
      inputSchema: z.object({
        parentId: REM_ID_SCHEMA,
        title: z.string().trim().min(1).max(1000),
        content: DESIGNED_NOTE_CONTENT_SCHEMA,
        templateId: TEMPLATE_ID_SCHEMA.optional(),
        writingMode: z.enum(['markdown', 'styled_tree']).optional(),
        dryRun: z.boolean().optional(),
        verifyAfterWrite: z.boolean().optional(),
        performanceTargetMs: z.number().int().min(100).max(60000).optional(),
        idempotencyKey: IDEMPOTENCY_KEY_SCHEMA.optional(),
        maxDepth: z.number().int().min(1).max(12).optional(),
        maxNodeCount: z.number().int().min(1).max(1000).optional(),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('create_designed_note_tree'),
    },
    async (args) => bridgeToolResult(() => callPlugin('create_designed_note_tree', args), 'Created designed note tree.')
  );

  registerTool(
    'update_note_with_design',
    {
      title: 'Update note with design',
      description:
        'Preview or apply approved updates to an existing note design. Real mutation requires dryRun=false and approved=true.',
      inputSchema: z.object({
        targetRemId: REM_ID_SCHEMA,
        mode: z.enum(['append_sections', 'replace_children', 'repair_structure', 'convert_markdown_pollution', 'convert_formulas']),
        templateId: TEMPLATE_ID_SCHEMA.optional(),
        content: DESIGNED_NOTE_CONTENT_SCHEMA.optional(),
        markdownText: LONG_MARKDOWN_SCHEMA.optional(),
        styleOperations: z.array(STYLE_PLAN_OPERATION_SCHEMA).max(100).optional(),
        dryRun: z.boolean().optional(),
        approved: z.boolean().optional(),
        verifyAfterWrite: z.boolean().optional(),
        idempotencyKey: IDEMPOTENCY_KEY_SCHEMA.optional(),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('update_note_with_design'),
    },
    async (args) => bridgeToolResult(() => callPlugin('update_note_with_design', args), 'Updated note design.')
  );

  registerTool(
    'verify_note_against_design',
    {
      title: 'Verify note against design',
      description: 'Check an existing note against a saved template or explicit design rules.',
      inputSchema: z.object({
        rootRemId: REM_ID_SCHEMA,
        templateId: TEMPLATE_ID_SCHEMA.optional(),
        rules: DESIGN_TEMPLATE_RULES_SCHEMA.optional(),
        expectedStyleMap: CONNECTOR_SAFE_EXPECTED_STYLE_MAP_SCHEMA.optional(),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('verify_note_against_design'),
    },
    async (args) => bridgeToolResult(() => callPlugin('verify_note_against_design', args as never), 'Verified note against design.')
  );

  registerTool(
    'repair_note_design',
    {
      title: 'Repair note design',
      description:
        'Preview or apply approved safe design repairs. Defaults to dry-run; real repair requires approved=true.',
      inputSchema: z.object({
        rootRemId: REM_ID_SCHEMA,
        templateId: TEMPLATE_ID_SCHEMA.optional(),
        operations: z.array(STYLE_PLAN_OPERATION_SCHEMA).max(100).optional(),
        dryRun: z.boolean().optional(),
        approved: z.boolean().optional(),
        verifyAfterWrite: z.boolean().optional(),
        idempotencyKey: IDEMPOTENCY_KEY_SCHEMA.optional(),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('repair_note_design'),
    },
    async (args) => bridgeToolResult(() => callPlugin('repair_note_design', args), 'Repaired note design.')
  );
}

export function registerHighLevelCardWorkflowTools({ registerTool, callPlugin }: ToolRegistrationContext): void {
  registerTool(
    'create_card_set_from_note',
    {
      title: 'Create card set from note',
      description: 'Create clean RemNote flashcards from an existing note while leaving the note as the source of truth.',
      inputSchema: z.object({
        rootRemId: REM_ID_SCHEMA,
        parentId: REM_ID_SCHEMA.optional(),
        maxCards: CARD_LIMIT_SCHEMA.optional(),
        dryRun: z.boolean().optional(),
        direction: CONNECTOR_SAFE_PRACTICE_DIRECTION_SCHEMA.optional(),
        idempotencyKey: IDEMPOTENCY_KEY_SCHEMA.optional(),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('create_card_set_from_note'),
    },
    async (args) => bridgeToolResult(() => callPlugin('create_card_set_from_note', args), 'Created card set from note.')
  );

  registerTool(
    'create_flashcards_from_markdown',
    {
      title: 'Create flashcards from Markdown',
      description: 'Create clean RemNote flashcards from Markdown double-colon or cloze markers.',
      inputSchema: z.object({
        parentId: REM_ID_SCHEMA,
        markdownText: LONG_MARKDOWN_SCHEMA,
        marker: z.enum(['double_colon', 'cloze', 'both']).optional(),
        maxCards: CARD_LIMIT_SCHEMA.optional(),
        dryRun: z.boolean().optional(),
        direction: CONNECTOR_SAFE_PRACTICE_DIRECTION_SCHEMA.optional(),
        idempotencyKey: IDEMPOTENCY_KEY_SCHEMA.optional(),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('create_flashcards_from_markdown'),
    },
    async (args) => bridgeToolResult(() => callPlugin('create_flashcards_from_markdown', args), 'Created flashcards from Markdown.')
  );

  registerTool(
    'create_cloze_cards_from_note',
    {
      title: 'Create cloze cards from note',
      description: 'Create cloze cards from cloze-marked note text while preserving the source note.',
      inputSchema: z.object({
        rootRemId: REM_ID_SCHEMA,
        parentId: REM_ID_SCHEMA.optional(),
        maxCards: CARD_LIMIT_SCHEMA.optional(),
        dryRun: z.boolean().optional(),
        direction: CONNECTOR_SAFE_PRACTICE_DIRECTION_SCHEMA.optional(),
        idempotencyKey: IDEMPOTENCY_KEY_SCHEMA.optional(),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('create_cloze_cards_from_note'),
    },
    async (args) => bridgeToolResult(() => callPlugin('create_cloze_cards_from_note', args), 'Created cloze cards from note.')
  );

  registerTool(
    'verify_card_set',
    {
      title: 'Verify card set',
      description: 'Verify bounded card readback; report malformed, duplicate, and expected-missing cards with repair guidance.',
      inputSchema: z.object({
        rootRemId: REM_ID_SCHEMA,
        expectedCards: z.array(EXPECTED_CARD_SCHEMA).max(100).optional().describe('Optional cards that must exist in the verified set.'),
        maxCards: CARD_LIMIT_SCHEMA.optional(),
        maxNodes: z.number().int().min(1).max(500).optional().describe('Maximum Rem nodes to inspect before returning a partial verification result.'),
        maxDepth: z.number().int().min(0).max(4).optional().describe('Maximum descendant depth to inspect. Default 1 for direct card children.'),
        timeoutMs: z.number().int().min(100).max(10000).optional().describe('Verifier time budget. Returns partial instead of hanging.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('verify_card_set'),
    },
    async (args) => bridgeToolResult(() => callPlugin('verify_card_set', args), 'Verified card set.')
  );

  registerTool(
    'repair_card_set',
    {
      title: 'Repair card set',
      description: 'Preview or apply approved flashcard-set repairs. Defaults to dry-run; real repair requires approved=true.',
      inputSchema: z.object({
        rootRemId: REM_ID_SCHEMA,
        cards: z.array(CARD_REPAIR_CARD_SCHEMA).max(100).optional(),
        dryRun: z.boolean().optional(),
        approved: z.boolean().optional(),
        direction: CONNECTOR_SAFE_PRACTICE_DIRECTION_SCHEMA.optional(),
        idempotencyKey: IDEMPOTENCY_KEY_SCHEMA.optional(),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('repair_card_set'),
    },
    async (args) => bridgeToolResult(() => callPlugin('repair_card_set', args), 'Repaired card set.')
  );
}
