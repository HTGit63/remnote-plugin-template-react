export interface CreateRemArgs {
  parentId?: string | null;
  markdown: string;
  idempotencyKey?: string;
}

export interface AppendToRemArgs {
  remId: string;
  markdown: string;
  position?: 'start' | 'end';
  idempotencyKey?: string;
}

export interface CreateDocumentArgs {
  parentId?: string | null;
  markdown: string;
  idempotencyKey?: string;
}

export interface CreateFolderArgs {
  parentId?: string | null;
  markdown: string;
}

export interface UpdateRemArgs {
  remId: string;
  markdown: string;
  dryRun?: boolean;
  idempotencyKey?: string;
  expectedPlainText?: string;
}

export interface MoveRemArgs {
  remId: string;
  newParentId: string;
  index: number;
  dryRun?: boolean;
  idempotencyKey?: string;
  expectedParentId?: string;
  expectedAncestorId?: string;
}

export interface ReorderChildrenArgs {
  parentRemId: string;
  orderedChildRemIds: string[];
  dryRun?: boolean;
  idempotencyKey?: string;
  allowPartial?: boolean;
}

export interface CreateRemTreeNode {
  title: string;
  children?: CreateRemTreeNode[];
}

export interface CreateRemTreeArgs {
  parentId: string;
  position?: 'start' | 'end';
  tree: CreateRemTreeNode;
  idempotencyKey?: string;
}

export interface ReplaceRemArgs {
  remId: string;
  markdown: string;
  dryRun?: boolean;
  idempotencyKey?: string;
  expectedPlainText?: string;
}

export interface DeleteRemByIdArgs {
  remId: string;
  expectedParentId?: string;
  expectedAncestorId?: string;
  confirmTitle?: string;
  dryRun?: boolean;
  idempotencyKey?: string;
}

export type RemHeadingLevel = 'H1' | 'H2' | 'H3' | 'normal';
export type RemColorName =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'gray'
  | 'brown'
  | 'default';
export type RichTextNodeType = 'text' | 'inlineMath' | 'mathBlock';
export type RemTypeName = 'normal' | 'concept' | 'descriptor';
export type PracticeDirection = 'forward' | 'backward' | 'none' | 'both';

export interface TextRange {
  start: number;
  end: number;
}

export interface RichTextSpanStyle {
  color?: RemColorName | string;
  highlight?: RemColorName | string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  quote?: boolean;
  cloze?: boolean;
}

export interface RichTextSpanInput {
  type?: RichTextNodeType;
  text?: string;
  latex?: string;
  styles?: RichTextSpanStyle;
}

export interface RemStyleInput {
  headingLevel?: RemHeadingLevel;
  textColor?: RemColorName | string;
  highlightColor?: RemColorName | string;
  color?: RemColorName | string;
  highlight?: RemColorName | string;
  hideBullet?: boolean;
  remType?: RemTypeName;
  type?: RemTypeName;
}

export type StyledRemTreeNodeType =
  | 'rem'
  | 'mathBlock'
  | 'inlineMath'
  | 'basicFlashcard'
  | 'conceptCard'
  | 'descriptorCard'
  | 'clozeCard'
  | 'multipleChoiceCard'
  | 'listAnswerCard';

export interface StyledRemTreeNode {
  clientNodeId?: string;
  type?: StyledRemTreeNodeType;
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
  direction?: PracticeDirection;
  style?: RemStyleInput;
  children?: StyledRemTreeNode[];
}

export interface UpdateRemRichArgs {
  remId: string;
  richText: RichTextSpanInput[];
  idempotencyKey?: string;
}

export interface SetRemHeadingLevelArgs {
  remId: string;
  level: RemHeadingLevel;
}

export interface SetRemTextColorArgs {
  remId: string;
  color: RemColorName | string;
}

export interface SetRemHighlightColorArgs {
  remId: string;
  color: RemColorName | string;
}

export interface SetTextSpanColorArgs {
  remId: string;
  color: RemColorName | string;
  range?: TextRange;
  start?: number;
  end?: number;
  text?: string;
  occurrence?: number;
  verifyAfterWrite?: boolean;
}

export interface SetTextSpanHighlightArgs {
  remId: string;
  color: RemColorName | string;
  range?: TextRange;
  start?: number;
  end?: number;
  text?: string;
  occurrence?: number;
  verifyAfterWrite?: boolean;
}

export interface SetRemTypeArgs {
  remId: string;
  type: RemTypeName;
}

export interface SetHideBulletArgs {
  remId: string;
  hideBullet: boolean;
}

export interface ClearRemFormattingArgs {
  remId: string;
}

export interface CreateStyledRemTreeArgs {
  parentId: string;
  position?: 'start' | 'end';
  tree: StyledRemTreeNode;
  dryRun?: boolean;
  idempotencyKey?: string;
  maxDepth?: number;
  maxNodeCount?: number;
}

export type ApplyRemnoteCommandTargetMode = 'focused_rem' | 'selected_rem' | 'rem_id';
export type RemnoteCommandName =
  | 'heading_1'
  | 'heading_2'
  | 'heading_3'
  | 'normal_text'
  | 'highlight_yellow'
  | 'highlight_blue'
  | 'highlight_green'
  | 'highlight_red'
  | 'hide_bullet'
  | 'show_bullet'
  | 'make_concept'
  | 'make_descriptor'
  | 'make_normal'
  | 'insert_inline_math'
  | 'insert_math_block';

export interface ApplyRemnoteCommandArgs {
  target: {
    mode: ApplyRemnoteCommandTargetMode;
    remId?: string | null;
  };
  command: RemnoteCommandName;
  args?: {
    latex?: string;
    text?: string;
  };
  dryRun?: boolean;
  idempotencyKey?: string;
}

export type StructuredNoteTargetMode = 'focused_rem' | 'rem_id' | 'parent_child' | 'approved_root';
export type StructuredNoteOperation =
  | 'replace_children'
  | 'append_children'
  | 'update_root_and_replace_children'
  | 'create_child_tree';

export interface StructuredNoteTarget {
  mode: StructuredNoteTargetMode;
  remId?: string | null;
  parentId?: string | null;
  createIfMissing?: boolean;
}

export interface StructuredNotePayload {
  root?: StyledRemTreeNode;
  children?: StyledRemTreeNode[];
}

export interface ApplyStructuredNoteBatchArgs {
  target?: StructuredNoteTarget;
  operation?: StructuredNoteOperation;
  parentId?: string;
  position?: 'start' | 'end';
  root?: StyledRemTreeNode;
  note?: StructuredNotePayload;
  dryRun?: boolean;
  idempotencyKey?: string;
  rollbackOnFailure?: boolean;
  verifyAfterWrite?: boolean;
  maxDepth?: number;
  maxNodeCount?: number;
}

export interface StylingPlanOperation {
  remId: string;
  type:
    | 'heading'
    | 'whole_rem_highlight'
    | 'text_color_span'
    | 'text_highlight_span'
    | 'bold_span'
    | 'italic_span'
    | 'math_conversion';
  start?: number;
  end?: number;
  text?: string;
  occurrence?: number;
  value?: string;
  color?: RemColorName | string;
  highlightColor?: RemColorName | string;
  headingLevel?: RemHeadingLevel;
}

export interface StylingPlan {
  operations?: StylingPlanOperation[];
  dryRun?: boolean;
  idempotencyKey?: string;
}

export interface CreatePolishedNoteTreeArgs {
  parentId: string;
  tree: StyledRemTreeNode;
  stylingPlan?: StylingPlan;
  dryRun?: boolean;
  verifyAfterWrite?: boolean;
  idempotencyKey?: string;
  maxDepth?: number;
  maxNodeCount?: number;
}

export type MarkdownImportMode =
  | 'create_child'
  | 'replace_target_children'
  | 'update_target_and_replace_children'
  | 'append_to_target';
export type MarkdownDuplicatePolicy = 'skip' | 'replace' | 'create_new';
export type MarkdownRootHeadingMode = 'first_h1' | 'title_from_first_line' | 'explicit_title';
export type MarkdownParagraphMode = 'child_rem_per_paragraph' | 'merge_paragraphs_under_heading';
export type MarkdownBulletMode = 'preserve_markdown_bullets' | 'plain_child_rems';
export type MarkdownFormulaMode = 'preserve' | 'force_block_for_display_math';

export interface MarkdownImportHeadingMapping {
  rootHeading?: MarkdownRootHeadingMode;
  explicitTitle?: string;
  rootHeadingLevel?: RemHeadingLevel;
  sectionHeadingLevel?: RemHeadingLevel;
  subsectionHeadingLevel?: RemHeadingLevel;
}

export interface MarkdownImportRemnoteLayout {
  insertSpacerBetweenSections?: boolean;
  spacerText?: string;
  preserveBlankLines?: boolean;
  paragraphMode?: MarkdownParagraphMode;
  bulletMode?: MarkdownBulletMode;
}

export interface MarkdownMathOptions {
  inlineMathDelimiters?: ['$', '$'] | ['\\(', '\\)'] | 'both';
  blockMathDelimiters?: ['$$', '$$'] | ['\\[', '\\]'] | 'both';
  formulaMode?: MarkdownFormulaMode;
  rejectMalformedMath?: boolean;
}

export interface MarkdownImportFidelityOptions {
  requireExactText?: boolean;
  allowWhitespaceNormalization?: boolean;
  preserveSourceOrder?: boolean;
  failOnContentLoss?: boolean;
}

export interface MarkdownImportSafetyOptions {
  dryRun?: boolean;
  verifyAfterWrite?: boolean;
  rollbackOnFailure?: boolean;
  idempotencyKey?: string;
}

export interface MarkdownImportLimits {
  maxMarkdownChars?: number;
  maxDepth?: number;
  maxNodes?: number;
}

export interface CreateOrReplaceNoteFromMarkdownArgs {
  parentRemId?: string;
  targetRemId?: string;
  markdownText: string;
  mode?: MarkdownImportMode;
  duplicatePolicy?: MarkdownDuplicatePolicy;
  headingMapping?: MarkdownImportHeadingMapping;
  remnoteLayout?: MarkdownImportRemnoteLayout;
  mathOptions?: MarkdownMathOptions;
  fidelityOptions?: MarkdownImportFidelityOptions;
  safetyOptions?: MarkdownImportSafetyOptions;
  limits?: MarkdownImportLimits;
}

export interface ApplyStylePlanArgs {
  operations: StylingPlanOperation[];
  continueOnError?: boolean;
  verifyAfterWrite?: boolean;
  dryRun?: boolean;
  idempotencyKey?: string;
}

export interface ExpectedStyleMapEntry {
  plainText?: string;
  headingLevel?: RemHeadingLevel;
  hideBullet?: boolean;
  remType?: RemTypeName;
  wholeRemHighlight?: RemColorName | string;
  textColorSpans?: Array<{
    text?: string;
    start?: number;
    end?: number;
    color: RemColorName | string;
  }>;
  textHighlightSpans?: Array<{
    text?: string;
    start?: number;
    end?: number;
    color: RemColorName | string;
  }>;
  childOrder?: string[];
}

export type ExpectedStyleMap = Record<string, ExpectedStyleMapEntry>;

export interface VerifyNoteDesignArgs {
  rootRemId: string;
  expectedStyleMap: ExpectedStyleMap;
  expectations?: Array<{ remId: string } & ExpectedStyleMapEntry>;
  expectedStyles?: Array<{
    remId: string;
    expected: ExpectedStyleMapEntry;
  }>;
}

export interface CreateFlashcardArgs {
  parentId: string;
  front: string;
  back: string;
  direction?: PracticeDirection;
  idempotencyKey?: string;
}

export interface CreateClozeCardArgs {
  parentId: string;
  text: string;
  clozeText?: string;
  direction?: PracticeDirection;
  idempotencyKey?: string;
}

export interface CreateMultipleChoiceCardArgs {
  parentId: string;
  question: string;
  choices: string[];
  correctChoice: string;
  direction?: PracticeDirection;
  idempotencyKey?: string;
}

export interface CreateListAnswerCardArgs {
  parentId: string;
  prompt: string;
  items: string[];
  direction?: PracticeDirection;
  idempotencyKey?: string;
}

