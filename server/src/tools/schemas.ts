import { z } from 'zod';

export const REM_ID_SCHEMA = z.string().trim().min(1).max(256);
export const MARKDOWN_SCHEMA = z.string().trim().min(1).max(20000);
export const POSITION_SCHEMA = z.enum(['start', 'end']).default('end');
export const MAX_CHILDREN_SCHEMA = z.number().int().min(1).max(100);
export const MAX_SEARCH_RESULTS_SCHEMA = z.number().int().min(1).max(25);
export const TREE_DEPTH_SCHEMA = z.number().int().min(0).max(3).default(1);
export const ORDERED_CHILD_IDS_SCHEMA = z.array(REM_ID_SCHEMA).max(500);
export const DELETE_CONFIRM_SCHEMA = z.literal('DELETE');
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
export const REM_TYPE_SCHEMA = z.enum(['normal', 'concept', 'descriptor']);
export const PRACTICE_DIRECTION_SCHEMA = z.enum(['forward', 'backward', 'none', 'both']).default('both');
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
  result: z.unknown().optional(),
  error: z.unknown().optional(),
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

export const REORDER_CHILDREN_INPUT_SCHEMA = z
  .object({
    parentRemId: REM_ID_SCHEMA.optional().describe('The parent Rem whose direct children should be reordered.'),
    parentId: REM_ID_SCHEMA.optional().describe('Alias for parentRemId.'),
    orderedChildRemIds: ORDERED_CHILD_IDS_SCHEMA.optional().describe('Full ordered list of current direct child Rem IDs.'),
    orderedChildIds: ORDERED_CHILD_IDS_SCHEMA.optional().describe('Alias for orderedChildRemIds.'),
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
    color?: z.infer<typeof COLOR_SCHEMA>;
    highlight?: z.infer<typeof COLOR_SCHEMA>;
    hideBullet?: boolean;
    remType?: z.infer<typeof REM_TYPE_SCHEMA>;
  };
  children?: StyledRemTreeNodeInput[];
}

export const STYLED_REM_TREE_NODE_SCHEMA: z.ZodType<StyledRemTreeNodeInput> = z.lazy(() =>
  z.object({
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
    style: z
      .object({
        headingLevel: HEADING_LEVEL_SCHEMA.optional(),
        color: COLOR_SCHEMA.optional(),
        highlight: COLOR_SCHEMA.optional(),
        hideBullet: z.boolean().optional(),
        remType: REM_TYPE_SCHEMA.optional(),
      })
      .optional(),
    children: z.array(STYLED_REM_TREE_NODE_SCHEMA).max(100).optional(),
  })
);

export const STRUCTURED_NOTE_SCHEMA = z.object({
  root: STYLED_REM_TREE_NODE_SCHEMA.optional().describe('Optional root payload. Required for create_child_tree and root update operations.'),
  children: z.array(STYLED_REM_TREE_NODE_SCHEMA).max(100).optional().describe('Ordered child nodes to append or replace under the target root.'),
});

export const STYLE_PLAN_OPERATION_SCHEMA = z.object({
  remId: REM_ID_SCHEMA.describe('Target Rem ID for this style operation.'),
  type: z
    .enum([
      'heading',
      'whole_rem_highlight',
      'text_color_span',
      'text_highlight_span',
      'bold_span',
      'italic_span',
      'math_conversion',
    ])
    .describe('Style operation type.'),
  start: z.number().int().min(0).optional(),
  end: z.number().int().min(1).optional(),
  text: z.string().trim().min(1).max(1000).optional(),
  occurrence: z.number().int().min(1).max(100).default(1).optional(),
  value: z.string().trim().min(1).max(1000).describe('Color, heading level, or operation value.'),
});

export const STYLING_PLAN_SCHEMA = z.object({
  operations: z.array(STYLE_PLAN_OPERATION_SCHEMA).max(100).optional(),
});

export const EXPECTED_STYLE_MAP_ENTRY_SCHEMA = z.object({
  plainText: z.string().max(5000).optional(),
  headingLevel: HEADING_LEVEL_SCHEMA.optional(),
  wholeRemHighlight: COLOR_SCHEMA.optional(),
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

