import { z } from 'zod';
import {
  NOTE_STYLE_PRESETS,
  NUCLEAR_PHYSICS_SPACER_TEXT,
} from '../../../shared/bridge/protocol.js';

export const REM_ID_SCHEMA = z.string().trim().min(1).max(256);
export const MARKDOWN_SCHEMA = z.string().trim().min(1).max(20000);
export const LONG_MARKDOWN_SCHEMA = z.string().trim().min(1).max(120000);
export const POSITION_SCHEMA = z.enum(['start', 'end']).default('end');
export const MAX_CHILDREN_SCHEMA = z.number().int().min(1).max(100);
export const MAX_SEARCH_RESULTS_SCHEMA = z.number().int().min(1).max(25);
export const TREE_DEPTH_SCHEMA = z.number().int().min(1).max(12).default(8);
export const ORDERED_CHILD_IDS_SCHEMA = z.array(REM_ID_SCHEMA).max(500);
export const DELETE_CONFIRM_SCHEMA = z.literal('DELETE');
export const IDEMPOTENCY_KEY_SCHEMA = z.string().trim().min(1).max(128);
export const DRY_RUN_SCHEMA = z.boolean().default(false);
export const MAX_TREE_NODE_COUNT_SCHEMA = z.number().int().min(1).max(1000).default(200);
export const COLOR_SCHEMA = z.enum([
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'pink',
  'gray',
  'brown',
  'default',
  'Red',
  'Orange',
  'Yellow',
  'Green',
  'Blue',
  'Purple',
  'Gray',
  'Brown',
  'Pink',
]);
export const HEADING_LEVEL_SCHEMA = z.enum(['H1', 'H2', 'H3', 'normal']);
export const NOTE_STYLE_PRESET_SCHEMA = z.enum(NOTE_STYLE_PRESETS as [typeof NOTE_STYLE_PRESETS[number], ...typeof NOTE_STYLE_PRESETS[number][]]);
export const NOTE_STYLE_PRESET_FIELDS_SCHEMA = {
  stylePreset: NOTE_STYLE_PRESET_SCHEMA.optional().describe('Reusable note style preset.'),
  course: z.string().trim().min(1).max(120).default('Nuclear Physics I').optional(),
  rootHeadingLevel: z.literal('H1').default('H1').optional(),
  sectionHeadingLevel: z.literal('H3').default('H3').optional(),
  insertSiblingSpacers: z.boolean().default(true).optional(),
  spacerText: z.string().max(10).default(NUCLEAR_PHYSICS_SPACER_TEXT).optional(),
  majorFormulaMode: z.literal('mathBlockRem').default('mathBlockRem').optional(),
  verifyAfterWrite: z.boolean().default(true).optional(),
};
export const CONNECTOR_SAFE_NOTE_STYLE_PRESET_FIELDS_SCHEMA = {
  stylePreset: NOTE_STYLE_PRESET_SCHEMA.optional().describe('Reusable note style preset.'),
  course: z.string().trim().min(1).max(120).optional(),
  rootHeadingLevel: z.literal('H1').optional(),
  sectionHeadingLevel: z.literal('H3').optional(),
  insertSiblingSpacers: z.boolean().optional(),
  spacerText: z.string().max(10).optional(),
  majorFormulaMode: z.literal('mathBlockRem').optional(),
  verifyAfterWrite: z.boolean().optional(),
};
export const REM_TYPE_SCHEMA = z.enum(['normal', 'concept', 'descriptor']);
export const REM_STYLE_SCHEMA = z
  .object({
    headingLevel: HEADING_LEVEL_SCHEMA.optional().describe('Canonical Rem heading level.'),
    textColor: COLOR_SCHEMA.optional().describe('Canonical whole-Rem text color.'),
    highlightColor: COLOR_SCHEMA.optional().describe('Canonical whole-Rem highlight color.'),
    hideBullet: z.boolean().optional(),
    remType: REM_TYPE_SCHEMA.optional().describe('Canonical Rem type.'),
    color: COLOR_SCHEMA.optional().describe('Legacy alias for textColor.'),
    highlight: COLOR_SCHEMA.optional().describe('Legacy alias for highlightColor.'),
    type: REM_TYPE_SCHEMA.optional().describe('Legacy alias for remType.'),
  })
  .describe('Canonical style shape. Legacy aliases normalize internally and never create child Rems such as Size/H1/H3.');
export const PRACTICE_DIRECTION_SCHEMA = z.enum(['forward', 'backward', 'none', 'both']).default('both');
export const CONNECTOR_SAFE_PRACTICE_DIRECTION_SCHEMA = z.enum(['forward', 'backward', 'none', 'both']);
export const REMNOTE_COMMAND_SCHEMA = z.enum([
  'heading_1',
  'heading_2',
  'heading_3',
  'normal_text',
  'highlight_yellow',
  'highlight_blue',
  'highlight_green',
  'highlight_red',
  'hide_bullet',
  'show_bullet',
  'make_concept',
  'make_descriptor',
  'make_normal',
  'insert_inline_math',
  'insert_math_block',
]);
export const REMNOTE_COMMAND_TARGET_SCHEMA = z.object({
  mode: z.enum(['focused_rem', 'selected_rem', 'rem_id']).describe('How to pick the target Rem.'),
  remId: REM_ID_SCHEMA.nullable().optional().describe('Required when mode is rem_id.'),
});
export const STRUCTURED_NOTE_TARGET_SCHEMA = z.object({
  mode: z.enum(['focused_rem', 'rem_id', 'parent_child', 'approved_root']).describe('How to choose the batch root or parent.'),
  remId: REM_ID_SCHEMA.nullable().optional().describe('Existing target Rem for updates/replacements.'),
  parentId: REM_ID_SCHEMA.nullable().optional().describe('Parent Rem for create_child_tree.'),
  createIfMissing: z.boolean().default(false).optional().describe('Reserved for future root creation by title.'),
});
export const STRUCTURED_NOTE_OPERATION_SCHEMA = z
  .enum(['replace_children', 'append_children', 'update_root_and_replace_children', 'create_child_tree'])
  .default('create_child_tree');
export const TEXT_RANGE_SCHEMA = z.object({
  start: z.number().int().min(0).describe('Zero-based start character offset.'),
  end: z.number().int().min(1).describe('Exclusive end character offset.'),
});
export const SPAN_RANGE_INPUT_SCHEMA = {
  range: TEXT_RANGE_SCHEMA.optional().describe('Character range in the Rem plain text.'),
  start: z.number().int().min(0).optional().describe('Zero-based start offset. Alternative to range.'),
  end: z.number().int().min(1).optional().describe('Exclusive end offset. Alternative to range.'),
  text: z.string().trim().min(1).max(1000).optional().describe('Text to locate when start/end are not provided.'),
  occurrence: z.number().int().min(1).max(100).default(1).optional().describe('One-based occurrence for text matching.'),
  verifyAfterWrite: z.boolean().default(false).optional().describe('Return write verification evidence when available.'),
};
export const PERMISSION_SCOPE_SCHEMA = z
  .enum([
    'current_permission_scope',
    'focused_rem_only',
    'focused_rem_and_descendants',
    'selected_rem_only',
    'selected_rem_and_descendants',
    'approved_document_or_folder',
    'workspace_allowed',
  ])
  .default('current_permission_scope');
export const BRIDGE_TOOL_OUTPUT_SCHEMA = z.object({
  ok: z.boolean(),
  status: z
    .enum([
      'PASS',
      'FAIL',
      'PARTIAL',
      'GATED',
      'UNSUPPORTED',
      'SKIPPED',
      'BLOCKED_BY_PERMISSION',
      'BLOCKED_BY_PROFILE',
      'PLATFORM_BLOCKED',
    ])
    .optional(),
  toolName: z.string().optional(),
  operationId: z.string().optional(),
  idempotency: z.string().optional(),
  idempotencyKey: z.string().optional(),
  idempotencyResult: z.string().optional(),
  targetRemId: z.string().optional(),
  parentRemId: z.string().optional(),
  target: z.any().optional(),
  created: z.array(z.string()).optional(),
  updated: z.array(z.string()).optional(),
  deleted: z.array(z.string()).optional(),
  createdRemIds: z.array(z.string()).optional(),
  updatedRemIds: z.array(z.string()).optional(),
  deletedRemIds: z.array(z.string()).optional(),
  counts: z.any().optional(),
  verification: z.any().optional(),
  phaseDurations: z.record(z.string(), z.number()).optional(),
  warnings: z.array(z.string()).optional(),
  result: z.any().optional(),
  error: z.any().optional(),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
  retryable: z.boolean().optional(),
  standard: z.any().optional(),
});
export const REMNOTE_GUIDE_SECTION_SCHEMA = z
  .enum([
    'all',
    'core_model',
    'documents_folders',
    'references_tags_portals',
    'formatting_design',
    'flashcards',
    'bridge_workflow',
  ])
  .default('all');

export const GET_CHILDREN_INPUT_SCHEMA = z
  .object({
    parentRemId: REM_ID_SCHEMA.optional().describe('The parent RemNote Rem ID whose direct children should be read.'),
    remId: REM_ID_SCHEMA.optional().describe('Alias for parentRemId.'),
    maxChildren: MAX_CHILDREN_SCHEMA.optional().describe('Maximum direct children to return, capped at 100.'),
    limit: MAX_CHILDREN_SCHEMA.optional().describe('Alias for maxChildren.'),
  })
  .refine((value) => Boolean(value.parentRemId || value.remId), {
    message: 'Provide parentRemId or remId.',
  });

export const SEARCH_REMS_INPUT_SCHEMA = z.object({
  query: z.string().trim().min(1).max(500).describe('Search text. Keep focused and specific.'),
  contextRemId: REM_ID_SCHEMA.nullable().optional().describe('Optional Rem ID to scope search under.'),
  maxResults: MAX_SEARCH_RESULTS_SCHEMA.optional().describe('Maximum results to return, capped at 25.'),
  limit: MAX_SEARCH_RESULTS_SCHEMA.optional().describe('Alias for maxResults.'),
  scope: PERMISSION_SCOPE_SCHEMA.describe('Requested search scope; never expands beyond the plugin permission scope.'),
});

export const GET_DOCUMENT_OR_FOLDER_TREE_INPUT_SCHEMA = z
  .object({
    rootRemId: REM_ID_SCHEMA.nullable().optional().describe('Optional document, folder, portal, or Rem root ID.'),
    remId: REM_ID_SCHEMA.nullable().optional().describe('Alias for rootRemId.'),
    depth: TREE_DEPTH_SCHEMA.describe('Maximum descendant depth, capped at 3.'),
    maxChildren: MAX_CHILDREN_SCHEMA.optional().describe('Maximum children per node, capped at 100.'),
  })
  .strict();

export const REORDER_CHILDREN_INPUT_SCHEMA = z
  .object({
    parentRemId: REM_ID_SCHEMA.optional().describe('The parent Rem whose direct children should be reordered.'),
    parentId: REM_ID_SCHEMA.optional().describe('Alias for parentRemId.'),
    orderedChildRemIds: ORDERED_CHILD_IDS_SCHEMA.optional().describe('Full ordered list of current direct child Rem IDs. Omit no existing child unless allowPartial=true.'),
    orderedChildIds: ORDERED_CHILD_IDS_SCHEMA.optional().describe('Alias for orderedChildRemIds.'),
    dryRun: DRY_RUN_SCHEMA.describe('Validate and preview without moving children.'),
    idempotencyKey: IDEMPOTENCY_KEY_SCHEMA.optional().describe('Prevents duplicate child reorder requests.'),
    allowPartial: z.boolean().default(false).describe('False requires the complete direct child list; true allows best-effort partial ordering.'),
  })
  .refine((value) => Boolean(value.parentRemId || value.parentId), {
    message: 'Provide parentRemId or parentId.',
  })
  .refine((value) => Boolean(value.orderedChildRemIds || value.orderedChildIds), {
    message: 'Provide orderedChildRemIds or orderedChildIds.',
  });

export interface RemTreeNodeInput {
  title: string;
  children?: RemTreeNodeInput[];
}

export const REM_TREE_NODE_SCHEMA: z.ZodType<RemTreeNodeInput> = z.lazy(() =>
  z.object({
    title: z.string().trim().min(1).max(1000).describe('Text/markdown title for this Rem node.'),
    children: z.array(REM_TREE_NODE_SCHEMA).max(100).optional().describe('Ordered child Rem nodes.'),
  })
);

export interface RichTextSpanInput {
  type?: 'text' | 'inlineMath' | 'mathBlock';
  text?: string;
  latex?: string;
  styles?: {
    color?: z.infer<typeof COLOR_SCHEMA>;
    highlight?: z.infer<typeof COLOR_SCHEMA>;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    quote?: boolean;
    cloze?: boolean;
  };
}

export const RICH_TEXT_SPAN_SCHEMA: z.ZodType<RichTextSpanInput> = z.object({
  type: z.enum(['text', 'inlineMath', 'mathBlock']).optional().describe('Text span or RemNote math node.'),
  text: z.string().max(5000).optional().describe('Text content for text spans, or fallback LaTeX content.'),
  latex: z.string().max(5000).optional().describe('LaTeX for inlineMath or mathBlock spans.'),
  styles: z
    .object({
      color: COLOR_SCHEMA.optional(),
      highlight: COLOR_SCHEMA.optional(),
      bold: z.boolean().optional(),
      italic: z.boolean().optional(),
      underline: z.boolean().optional(),
      quote: z.boolean().optional(),
      cloze: z.boolean().optional(),
    })
    .optional(),
});

export interface StyledRemTreeNodeInput {
  clientNodeId?: string;
  type?:
    | 'rem'
    | 'mathBlock'
    | 'inlineMath'
    | 'basicFlashcard'
    | 'conceptCard'
    | 'descriptorCard'
    | 'clozeCard'
    | 'multipleChoiceCard'
    | 'listAnswerCard';
  title?: string;
  text?: string;
  richText?: RichTextSpanInput[];
  latex?: string;
  front?: string;
  back?: string;
  answer?: string;
  clozeText?: string;
  choices?: string[];
  correctChoice?: string;
  items?: string[];
  direction?: z.infer<typeof PRACTICE_DIRECTION_SCHEMA>;
  style?: {
    headingLevel?: z.infer<typeof HEADING_LEVEL_SCHEMA>;
    textColor?: z.infer<typeof COLOR_SCHEMA>;
    highlightColor?: z.infer<typeof COLOR_SCHEMA>;
    color?: z.infer<typeof COLOR_SCHEMA>;
    highlight?: z.infer<typeof COLOR_SCHEMA>;
    hideBullet?: boolean;
    remType?: z.infer<typeof REM_TYPE_SCHEMA>;
    type?: z.infer<typeof REM_TYPE_SCHEMA>;
  };
  children?: StyledRemTreeNodeInput[];
}

export const STYLED_REM_TREE_NODE_SCHEMA: z.ZodType<StyledRemTreeNodeInput> = z.lazy(() =>
  z.object({
    clientNodeId: z.string().trim().min(1).max(128).optional().describe('Client-stable node ID used for dry-run previews and idempotency correlation.'),
    type: z
      .enum([
        'rem',
        'mathBlock',
        'inlineMath',
        'basicFlashcard',
        'conceptCard',
        'descriptorCard',
        'clozeCard',
        'multipleChoiceCard',
        'listAnswerCard',
      ])
      .default('rem')
      .optional(),
    title: z.string().max(1000).optional(),
    text: z.string().max(5000).optional(),
    richText: z.array(RICH_TEXT_SPAN_SCHEMA).max(200).optional(),
    latex: z.string().max(5000).optional(),
    front: z.string().max(5000).optional(),
    back: z.string().max(5000).optional(),
    answer: z.string().max(5000).optional(),
    clozeText: z.string().max(1000).optional(),
    choices: z.array(z.string().min(1).max(1000)).max(20).optional(),
    correctChoice: z.string().max(1000).optional(),
    items: z.array(z.string().min(1).max(1000)).max(50).optional(),
    direction: PRACTICE_DIRECTION_SCHEMA.optional(),
    style: REM_STYLE_SCHEMA.optional(),
    children: z.array(STYLED_REM_TREE_NODE_SCHEMA).max(100).optional(),
  })
);

const SIMPLE_COUNT_MAP_SCHEMA = z.record(z.string(), z.number().int().min(0).max(100000));

export const CONNECTOR_SAFE_EXPECTED_STYLE_SCHEMA = z.object({
  plainText: z.string().max(5000).optional(),
  headingLevel: HEADING_LEVEL_SCHEMA.optional(),
  hideBullet: z.boolean().optional(),
  remType: REM_TYPE_SCHEMA.optional(),
  wholeRemHighlight: COLOR_SCHEMA.optional(),
  expectedChildCount: z.number().int().min(0).max(1000).optional(),
  forbiddenChildTexts: z.array(z.string().trim().min(1).max(1000)).max(50).optional(),
  noVisibleMathDelimiters: z.boolean().optional(),
  allowVisibleMathDelimiters: z.boolean().optional(),
});

export const CONNECTOR_SAFE_EXPECTED_STYLE_MAP_SCHEMA = z.record(
  z.string(),
  CONNECTOR_SAFE_EXPECTED_STYLE_SCHEMA
);

export const DESIGN_TEMPLATE_RULES_SCHEMA = z
  .object({
    headingPattern: z
      .object({
        rootHeadingLevel: HEADING_LEVEL_SCHEMA.optional(),
        sectionHeadingLevel: HEADING_LEVEL_SCHEMA.optional(),
        headingCounts: SIMPLE_COUNT_MAP_SCHEMA.optional(),
        directChildHeadingCounts: SIMPLE_COUNT_MAP_SCHEMA.optional(),
      })
      .optional(),
    colorPattern: z
      .object({
        textColors: SIMPLE_COUNT_MAP_SCHEMA.optional(),
        highlightColors: SIMPLE_COUNT_MAP_SCHEMA.optional(),
        wholeRemHighlights: SIMPLE_COUNT_MAP_SCHEMA.optional(),
      })
      .optional(),
    spacingPattern: z
      .object({
        spacerCount: z.number().int().min(0).max(10000).optional(),
        spacerTexts: z.array(z.string().max(100)).max(50).optional(),
        blankRemCount: z.number().int().min(0).max(10000).optional(),
        siblingSpacerLikely: z.boolean().optional(),
      })
      .optional(),
    mathPattern: z
      .object({
        inlineMathCount: z.number().int().min(0).max(10000).optional(),
        blockMathCount: z.number().int().min(0).max(10000).optional(),
        visibleDelimiterCount: z.number().int().min(0).max(10000).optional(),
        malformedMathLikely: z.boolean().optional(),
      })
      .optional(),
    bulletNesting: z
      .object({
        maxDepth: z.number().int().min(0).max(100).optional(),
        maxChildrenPerRem: z.number().int().min(0).max(10000).optional(),
        averageChildrenPerNonLeaf: z.number().min(0).max(10000).optional(),
      })
      .optional(),
    formulaPlacement: z
      .object({
        displayFormulasAsSeparateRems: z.boolean().optional(),
        inlineFormulasInsideText: z.boolean().optional(),
        rawDisplayDelimitersVisible: z.boolean().optional(),
      })
      .optional(),
    tableStyle: z
      .object({
        tableLikeRemCount: z.number().int().min(0).max(10000).optional(),
        markdownTableCount: z.number().int().min(0).max(10000).optional(),
        tableHeadings: z.array(z.string().max(500)).max(100).optional(),
      })
      .optional(),
    cardStyle: z
      .object({
        cardLikeRemCount: z.number().int().min(0).max(10000).optional(),
        clozeLikeRemCount: z.number().int().min(0).max(10000).optional(),
        doubleColonMarkerCount: z.number().int().min(0).max(10000).optional(),
      })
      .optional(),
    workedExampleStyle: z
      .object({
        workedExampleCount: z.number().int().min(0).max(10000).optional(),
        labels: z.array(z.string().max(200)).max(100).optional(),
      })
      .optional(),
    expectedStyleMap: CONNECTOR_SAFE_EXPECTED_STYLE_MAP_SCHEMA.optional(),
    stylePreset: z.string().trim().min(1).max(120).optional(),
  })
  .describe('Reusable note design rules. Destructive operation rules are rejected by the plugin before storage/import.');

export const DESIGNED_NOTE_CONTENT_SCHEMA = LONG_MARKDOWN_SCHEMA;

export const CARD_REPAIR_CARD_SCHEMA = z.object({
  front: z.string().trim().min(1).max(5000),
  back: z.string().trim().min(1).max(5000),
});

export const MARKDOWN_HEADING_MAPPING_SCHEMA = z.object({
  rootHeading: z.enum(['first_h1', 'title_from_first_line', 'explicit_title']).optional(),
  explicitTitle: z.string().trim().min(1).max(1000).optional(),
  rootHeadingLevel: HEADING_LEVEL_SCHEMA.optional(),
  sectionHeadingLevel: HEADING_LEVEL_SCHEMA.optional(),
  subsectionHeadingLevel: HEADING_LEVEL_SCHEMA.optional(),
});

export const MARKDOWN_REMNOTE_LAYOUT_SCHEMA = z.object({
  insertSpacerBetweenSections: z.boolean().optional(),
  spacerText: z.string().max(100).optional(),
  preserveBlankLines: z.boolean().optional(),
  paragraphMode: z.enum(['child_rem_per_paragraph', 'merge_paragraphs_under_heading']).optional(),
  bulletMode: z.enum(['preserve_markdown_bullets', 'plain_child_rems']).optional(),
});

export const MARKDOWN_MATH_OPTIONS_SCHEMA = z.object({
  inlineMathDelimiters: z.literal('both').optional(),
  blockMathDelimiters: z.literal('both').optional(),
  formulaMode: z.enum(['preserve', 'force_block_for_display_math']).optional(),
  rejectMalformedMath: z.boolean().optional(),
});

export const MARKDOWN_FIDELITY_OPTIONS_SCHEMA = z.object({
  requireExactText: z.boolean().optional(),
  allowWhitespaceNormalization: z.boolean().optional(),
  preserveSourceOrder: z.boolean().optional(),
  failOnContentLoss: z.boolean().optional(),
});

export const MARKDOWN_FLASHCARD_OPTIONS_SCHEMA = z.object({
  enabled: z.boolean().optional().describe('False keeps flashcard-looking markers as plain Rem text.'),
  marker: z.enum(['double_colon', 'cloze', 'both']).optional(),
  defaultDirection: CONNECTOR_SAFE_PRACTICE_DIRECTION_SCHEMA.optional(),
});

export const MARKDOWN_SAFETY_OPTIONS_SCHEMA = z.object({
  dryRun: z.boolean().optional(),
  verifyAfterWrite: z.boolean().optional(),
  rollbackOnFailure: z.boolean().optional(),
  idempotencyKey: IDEMPOTENCY_KEY_SCHEMA.optional(),
});

export const MARKDOWN_IMPORT_LIMITS_SCHEMA = z.object({
  maxMarkdownChars: z.number().int().min(1).max(120000).optional(),
  maxDepth: z.number().int().min(1).max(12).optional(),
  maxNodes: z.number().int().min(1).max(1000).optional(),
});

export const CREATE_OR_REPLACE_NOTE_FROM_MARKDOWN_INPUT_SCHEMA = z.object({
  ...CONNECTOR_SAFE_NOTE_STYLE_PRESET_FIELDS_SCHEMA,
  parentRemId: REM_ID_SCHEMA.optional().describe('Parent Rem ID for mode=create_child.'),
  targetRemId: REM_ID_SCHEMA.optional().describe('Existing target Rem ID for append/replace/update modes.'),
  markdownText: LONG_MARKDOWN_SCHEMA.describe('Full source Markdown. Content is preserved; no summarization or compression.'),
  mode: z
    .enum(['create_child', 'replace_target_children', 'update_target_and_replace_children', 'append_to_target'])
    .describe('Bulk import mode. create_child creates one root under parentRemId; target modes write under targetRemId.'),
  duplicatePolicy: z.enum(['skip', 'replace', 'create_new']).optional(),
  headingMapping: MARKDOWN_HEADING_MAPPING_SCHEMA.optional(),
  remnoteLayout: MARKDOWN_REMNOTE_LAYOUT_SCHEMA.optional(),
  mathOptions: MARKDOWN_MATH_OPTIONS_SCHEMA.optional(),
  fidelityOptions: MARKDOWN_FIDELITY_OPTIONS_SCHEMA.optional(),
  flashcardOptions: MARKDOWN_FLASHCARD_OPTIONS_SCHEMA.optional(),
  safetyOptions: MARKDOWN_SAFETY_OPTIONS_SCHEMA.optional(),
  limits: MARKDOWN_IMPORT_LIMITS_SCHEMA.optional(),
});

export const PREVIEW_MARKDOWN_NOTE_TREE_INPUT_SCHEMA = z.object({
  ...CONNECTOR_SAFE_NOTE_STYLE_PRESET_FIELDS_SCHEMA,
  markdownText: LONG_MARKDOWN_SCHEMA.describe('Full source Markdown. Preview parses only and never writes.'),
  headingMapping: MARKDOWN_HEADING_MAPPING_SCHEMA.optional(),
  remnoteLayout: MARKDOWN_REMNOTE_LAYOUT_SCHEMA.optional(),
  mathOptions: MARKDOWN_MATH_OPTIONS_SCHEMA.optional(),
  fidelityOptions: MARKDOWN_FIDELITY_OPTIONS_SCHEMA.optional(),
  flashcardOptions: MARKDOWN_FLASHCARD_OPTIONS_SCHEMA.optional(),
  limits: MARKDOWN_IMPORT_LIMITS_SCHEMA.optional(),
});

export const CREATE_NOTE_FROM_MARKDOWN_TREE_INPUT_SCHEMA = z.object({
  ...CONNECTOR_SAFE_NOTE_STYLE_PRESET_FIELDS_SCHEMA,
  parentRemId: REM_ID_SCHEMA.describe('Parent Rem ID for the created Markdown hierarchy root.'),
  markdownText: LONG_MARKDOWN_SCHEMA.describe('Full source Markdown. Content is preserved as clean Rem hierarchy.'),
  duplicatePolicy: z.enum(['skip', 'replace', 'create_new']).optional(),
  headingMapping: MARKDOWN_HEADING_MAPPING_SCHEMA.optional(),
  remnoteLayout: MARKDOWN_REMNOTE_LAYOUT_SCHEMA.optional(),
  mathOptions: MARKDOWN_MATH_OPTIONS_SCHEMA.optional(),
  fidelityOptions: MARKDOWN_FIDELITY_OPTIONS_SCHEMA.optional(),
  flashcardOptions: MARKDOWN_FLASHCARD_OPTIONS_SCHEMA.optional(),
  safetyOptions: MARKDOWN_SAFETY_OPTIONS_SCHEMA.optional(),
  limits: MARKDOWN_IMPORT_LIMITS_SCHEMA.optional(),
});

export const APPEND_MARKDOWN_AS_REM_TREE_INPUT_SCHEMA = z.object({
  ...CONNECTOR_SAFE_NOTE_STYLE_PRESET_FIELDS_SCHEMA,
  targetRemId: REM_ID_SCHEMA.describe('Existing Rem ID that receives the parsed Markdown tree as children.'),
  markdownText: LONG_MARKDOWN_SCHEMA.describe('Full source Markdown to append as clean child Rem hierarchy.'),
  headingMapping: MARKDOWN_HEADING_MAPPING_SCHEMA.optional(),
  remnoteLayout: MARKDOWN_REMNOTE_LAYOUT_SCHEMA.optional(),
  mathOptions: MARKDOWN_MATH_OPTIONS_SCHEMA.optional(),
  fidelityOptions: MARKDOWN_FIDELITY_OPTIONS_SCHEMA.optional(),
  flashcardOptions: MARKDOWN_FLASHCARD_OPTIONS_SCHEMA.optional(),
  safetyOptions: MARKDOWN_SAFETY_OPTIONS_SCHEMA.optional(),
  limits: MARKDOWN_IMPORT_LIMITS_SCHEMA.optional(),
});

export const STRUCTURED_NOTE_SCHEMA = z.object({
  root: STYLED_REM_TREE_NODE_SCHEMA.optional().describe('Optional root payload. Required for create_child_tree and root update operations.'),
  children: z.array(STYLED_REM_TREE_NODE_SCHEMA).max(100).optional().describe('Ordered child nodes to append or replace under the target root.'),
});

const STYLE_OPERATION_BASE_SCHEMA = {
  remId: REM_ID_SCHEMA.describe('Target Rem ID for this style operation.'),
};

const STYLE_SPAN_SELECTOR_SCHEMA = {
  range: TEXT_RANGE_SCHEMA.optional().describe('Character range in plain text.'),
  start: z.number().int().min(0).optional().describe('Zero-based start offset.'),
  end: z.number().int().min(1).optional().describe('Exclusive end offset.'),
  text: z.string().trim().min(1).max(1000).optional().describe('Text selector when offsets are unavailable.'),
  occurrence: z.number().int().min(1).max(100).default(1).optional(),
};

const HEADING_STYLE_PLAN_OPERATION_SCHEMA = z
  .object({
    ...STYLE_OPERATION_BASE_SCHEMA,
    type: z.literal('heading'),
    headingLevel: HEADING_LEVEL_SCHEMA.optional().describe('Heading level to apply.'),
    value: z.string().trim().min(1).max(1000).optional().describe('Legacy alias for headingLevel.'),
  })
  .superRefine((value, ctx) => {
    const valueHeading = value.value as z.infer<typeof HEADING_LEVEL_SCHEMA> | undefined;
    if (!value.headingLevel && !value.value) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'heading operation requires headingLevel or value.',
        path: ['headingLevel'],
      });
      return;
    }
    if (value.value && !HEADING_LEVEL_SCHEMA.safeParse(value.value).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'heading value must be H1, H2, H3, or normal.',
        path: ['value'],
      });
      return;
    }
    if (value.headingLevel && valueHeading && value.headingLevel !== valueHeading) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'headingLevel and value conflict.',
        path: ['value'],
      });
    }
  });

export const STYLE_PLAN_OPERATION_SCHEMA = z.union([
  HEADING_STYLE_PLAN_OPERATION_SCHEMA,
  z.object({
    ...STYLE_OPERATION_BASE_SCHEMA,
    type: z.literal('whole_rem_highlight'),
    highlightColor: COLOR_SCHEMA.describe('Whole Rem highlight color.'),
    value: z.string().trim().min(1).max(1000).optional().describe('Legacy alias for highlightColor.'),
  }),
  z.object({
    ...STYLE_OPERATION_BASE_SCHEMA,
    type: z.literal('text_color_span'),
    ...STYLE_SPAN_SELECTOR_SCHEMA,
    color: COLOR_SCHEMA.describe('Font color for the selected text span.'),
    value: z.string().trim().min(1).max(1000).optional().describe('Legacy alias for color.'),
  }),
  z.object({
    ...STYLE_OPERATION_BASE_SCHEMA,
    type: z.literal('text_highlight_span'),
    ...STYLE_SPAN_SELECTOR_SCHEMA,
    highlightColor: COLOR_SCHEMA.describe('Highlight color for the selected text span.'),
    value: z.string().trim().min(1).max(1000).optional().describe('Legacy alias for highlightColor.'),
  }),
  z.object({
    ...STYLE_OPERATION_BASE_SCHEMA,
    type: z.literal('bold_span'),
    ...STYLE_SPAN_SELECTOR_SCHEMA,
    value: z.string().trim().min(1).max(1000).optional().describe('Optional legacy operation value.'),
  }),
  z.object({
    ...STYLE_OPERATION_BASE_SCHEMA,
    type: z.literal('italic_span'),
    ...STYLE_SPAN_SELECTOR_SCHEMA,
    value: z.string().trim().min(1).max(1000).optional().describe('Optional legacy operation value.'),
  }),
  z.object({
    ...STYLE_OPERATION_BASE_SCHEMA,
    type: z.literal('math_conversion'),
    ...STYLE_SPAN_SELECTOR_SCHEMA,
    latex: z.string().trim().min(1).max(5000).describe('LaTeX payload for explicit math conversion plans.'),
    value: z.string().trim().min(1).max(1000).optional().describe('Legacy operation value.'),
  }),
]);

export const STYLING_PLAN_SCHEMA = z.object({
  ...NOTE_STYLE_PRESET_FIELDS_SCHEMA,
  operations: z.array(STYLE_PLAN_OPERATION_SCHEMA).max(100).optional(),
  dryRun: DRY_RUN_SCHEMA.describe('Validate styling operations without writing.'),
  idempotencyKey: IDEMPOTENCY_KEY_SCHEMA.optional().describe('Prevents duplicate post-create styling plans.'),
});

export const EXPECTED_STYLE_MAP_ENTRY_SCHEMA = z.object({
  plainText: z.string().max(5000).optional(),
  headingLevel: HEADING_LEVEL_SCHEMA.optional(),
  hideBullet: z.boolean().optional(),
  remType: REM_TYPE_SCHEMA.optional(),
  wholeRemHighlight: COLOR_SCHEMA.optional(),
  expectedChildCount: z.number().int().min(0).max(1000).optional(),
  forbiddenChildTexts: z.array(z.string().trim().min(1).max(1000)).max(50).optional(),
  noVisibleMathDelimiters: z.boolean().default(false).optional(),
  allowVisibleMathDelimiters: z.boolean().default(false).optional(),
  mathSpans: z
    .array(
      z.object({
        latex: z.string().trim().min(1).max(5000).optional(),
        block: z.boolean().optional(),
      })
    )
    .max(50)
    .optional(),
  textColorSpans: z
    .array(
      z.object({
        text: z.string().trim().min(1).max(1000).optional(),
        start: z.number().int().min(0).optional(),
        end: z.number().int().min(1).optional(),
        color: COLOR_SCHEMA,
      })
    )
    .max(50)
    .optional(),
  textHighlightSpans: z
    .array(
      z.object({
        text: z.string().trim().min(1).max(1000).optional(),
        start: z.number().int().min(0).optional(),
        end: z.number().int().min(1).optional(),
        color: COLOR_SCHEMA,
      })
    )
    .max(50)
    .optional(),
  childOrder: z.array(REM_ID_SCHEMA).max(200).optional(),
});

export const EXPECTED_STYLE_EXPECTATION_SCHEMA = z.object({
  remId: REM_ID_SCHEMA.describe('Rem ID whose design should match the expected style entry.'),
  expected: EXPECTED_STYLE_MAP_ENTRY_SCHEMA.describe('Expected text, style spans, and child order for this Rem.'),
});

export const EXPECTED_STYLE_PUBLIC_EXPECTATION_SCHEMA = EXPECTED_STYLE_MAP_ENTRY_SCHEMA.extend({
  remId: REM_ID_SCHEMA.describe('Rem ID whose design should match this expectation.'),
});

export const NUCLEAR_PHYSICS_STYLE_EXPECTED_SCHEMA = z.object({
  rootHeadingLevel: z.literal('H1').default('H1').optional(),
  sectionHeadingLevel: z.literal('H3').default('H3').optional(),
  spacersAreRootChildren: z.boolean().default(true).optional(),
  mathBlocksAreSeparateRems: z.boolean().default(true).optional(),
  noContentUnderSpacerRems: z.boolean().default(true).optional(),
  contentNestedUnderSections: z.boolean().default(true).optional(),
  previousNotesUntouched: z.boolean().default(true).optional(),
});
