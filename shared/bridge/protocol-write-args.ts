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

export type NoteStylePreset =
  | 'clean_academic'
  | 'exam_ready'
  | 'colorful_study'
  | 'minimal'
  | 'formula_heavy'
  | 'nuclear_physics_h1_h3_spacer_math';

export interface NoteStylePresetFields {
  stylePreset?: NoteStylePreset;
  course?: string;
  rootHeadingLevel?: 'H1';
  sectionHeadingLevel?: 'H3';
  insertSiblingSpacers?: boolean;
  spacerText?: string;
  majorFormulaMode?: 'mathBlockRem';
  verifyAfterWrite?: boolean;
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
  requireCreatedInCurrentSession?: boolean;
  requirePriorDryRun?: boolean;
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

export interface CreateStyledRemTreeArgs extends NoteStylePresetFields {
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

export interface ApplyStructuredNoteBatchArgs extends NoteStylePresetFields {
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
  latex?: string;
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

export interface CreatePolishedNoteTreeArgs extends NoteStylePresetFields {
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
  | 'append_children_to_target'
  | 'replace_target_children'
  | 'update_target_and_replace_children'
  | 'append_to_target';
export type MarkdownDuplicatePolicy = 'skip' | 'replace' | 'create_new';
export type MarkdownRootHeadingMode = 'first_h1' | 'title_from_first_line' | 'explicit_title';
export type MarkdownParagraphMode = 'child_rem_per_paragraph' | 'merge_paragraphs_under_heading';
export type MarkdownBulletMode = 'preserve_markdown_bullets' | 'plain_child_rems';
export type MarkdownFormulaMode = 'preserve' | 'force_block_for_display_math';
export type MarkdownFlashcardMarkerMode = 'double_colon' | 'cloze' | 'both';

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

export interface MarkdownFlashcardOptions {
  enabled?: boolean;
  marker?: MarkdownFlashcardMarkerMode;
  defaultDirection?: PracticeDirection;
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

export interface CreateOrReplaceNoteFromMarkdownArgs extends NoteStylePresetFields {
  parentRemId?: string;
  targetRemId?: string;
  markdownText: string;
  mode?: MarkdownImportMode;
  duplicatePolicy?: MarkdownDuplicatePolicy;
  headingMapping?: MarkdownImportHeadingMapping;
  remnoteLayout?: MarkdownImportRemnoteLayout;
  mathOptions?: MarkdownMathOptions;
  fidelityOptions?: MarkdownImportFidelityOptions;
  flashcardOptions?: MarkdownFlashcardOptions;
  safetyOptions?: MarkdownImportSafetyOptions;
  limits?: MarkdownImportLimits;
}

export interface PreviewMarkdownNoteTreeArgs extends NoteStylePresetFields {
  markdownText: string;
  headingMapping?: MarkdownImportHeadingMapping;
  remnoteLayout?: MarkdownImportRemnoteLayout;
  mathOptions?: MarkdownMathOptions;
  fidelityOptions?: MarkdownImportFidelityOptions;
  flashcardOptions?: MarkdownFlashcardOptions;
  limits?: MarkdownImportLimits;
}

export interface CreateNoteFromMarkdownTreeArgs extends NoteStylePresetFields {
  parentRemId: string;
  markdownText: string;
  duplicatePolicy?: MarkdownDuplicatePolicy;
  headingMapping?: MarkdownImportHeadingMapping;
  remnoteLayout?: MarkdownImportRemnoteLayout;
  mathOptions?: MarkdownMathOptions;
  fidelityOptions?: MarkdownImportFidelityOptions;
  flashcardOptions?: MarkdownFlashcardOptions;
  safetyOptions?: MarkdownImportSafetyOptions;
  limits?: MarkdownImportLimits;
}

export interface AppendMarkdownAsRemTreeArgs extends NoteStylePresetFields {
  targetRemId: string;
  markdownText: string;
  duplicatePolicy?: Extract<MarkdownDuplicatePolicy, 'skip' | 'create_new'>;
  headingMapping?: MarkdownImportHeadingMapping;
  remnoteLayout?: MarkdownImportRemnoteLayout;
  mathOptions?: MarkdownMathOptions;
  fidelityOptions?: MarkdownImportFidelityOptions;
  flashcardOptions?: MarkdownFlashcardOptions;
  safetyOptions?: MarkdownImportSafetyOptions;
  limits?: MarkdownImportLimits;
}

export interface ApplyStylePlanArgs extends NoteStylePresetFields {
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
  expectedChildCount?: number;
  forbiddenChildTexts?: string[];
  noVisibleMathDelimiters?: boolean;
  allowVisibleMathDelimiters?: boolean;
  mathSpans?: Array<{
    latex?: string;
    block?: boolean;
  }>;
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

export interface NuclearPhysicsStyleExpected {
  rootHeadingLevel?: 'H1';
  sectionHeadingLevel?: 'H3';
  spacersAreRootChildren?: boolean;
  mathBlocksAreSeparateRems?: boolean;
  noContentUnderSpacerRems?: boolean;
  contentNestedUnderSections?: boolean;
  previousNotesUntouched?: boolean;
}

export interface VerifyNoteDesignArgs extends NoteStylePresetFields {
  rootRemId: string;
  expectedStyleMap?: ExpectedStyleMap;
  expectations?: Array<{ remId: string } & ExpectedStyleMapEntry>;
  expectedStyles?: Array<{
    remId: string;
    expected: ExpectedStyleMapEntry;
  }>;
  expected?: NuclearPhysicsStyleExpected;
}

export type NoteDesignTemplateSchemaVersion = 1;
export type NoteDesignConflictBehavior = 'last_write_wins' | 'versioned_reject';

export interface NoteDesignRoleTreatment {
  remStyle?: RemStyleInput;
  fullTextStyle?: RichTextSpanStyle;
  prefixStyle?: RichTextSpanStyle;
  mathStyle?: RichTextSpanStyle;
}

export interface NoteDesignRoleRules {
  root?: NoteDesignRoleTreatment;
  section?: NoteDesignRoleTreatment;
  keyIdea?: NoteDesignRoleTreatment;
  formula?: NoteDesignRoleTreatment;
  workedExample?: NoteDesignRoleTreatment;
  answer?: NoteDesignRoleTreatment;
  warning?: NoteDesignRoleTreatment;
  summary?: NoteDesignRoleTreatment;
  concept?: NoteDesignRoleTreatment;
  descriptor?: NoteDesignRoleTreatment;
}

export interface NoteDesignRules {
  headingPattern: {
    rootHeadingLevel?: RemHeadingLevel;
    sectionHeadingLevel?: RemHeadingLevel;
    headingCounts?: Partial<Record<RemHeadingLevel, number>>;
    directChildHeadingCounts?: Partial<Record<RemHeadingLevel, number>>;
  };
  colorPattern: {
    textColors?: Record<string, number>;
    highlightColors?: Record<string, number>;
    wholeRemHighlights?: Record<string, number>;
  };
  spacingPattern: {
    spacerCount: number;
    spacerTexts: string[];
    blankRemCount: number;
    siblingSpacerLikely: boolean;
  };
  mathPattern: {
    inlineMathCount: number;
    blockMathCount: number;
    visibleDelimiterCount: number;
    malformedMathLikely: boolean;
  };
  bulletNesting: {
    maxDepth: number;
    maxChildrenPerRem: number;
    averageChildrenPerNonLeaf: number;
  };
  formulaPlacement: {
    displayFormulasAsSeparateRems: boolean;
    inlineFormulasInsideText: boolean;
    rawDisplayDelimitersVisible: boolean;
  };
  tableStyle: {
    tableLikeRemCount: number;
    markdownTableCount: number;
    tableHeadings: string[];
  };
  cardStyle: {
    cardLikeRemCount: number;
    clozeLikeRemCount: number;
    doubleColonMarkerCount: number;
  };
  workedExampleStyle: {
    workedExampleCount: number;
    labels: string[];
  };
  roleRules?: NoteDesignRoleRules;
  expectedStyleMap?: ExpectedStyleMap;
  stylePreset?: NoteStylePreset;
}

export interface NoteDesignTemplate {
  schemaVersion: NoteDesignTemplateSchemaVersion;
  templateId: string;
  name: string;
  description?: string;
  sourceRemId?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  conflictBehavior: NoteDesignConflictBehavior;
  rules: NoteDesignRules;
  localOnly: true;
}

export interface NoteDesignTemplateSummary {
  templateId: string;
  name: string;
  description?: string;
  sourceRemId?: string;
  updatedAt: string;
  version: number;
}

export interface AnalyzeNoteDesignArgs {
  rootRemId?: string;
  sampleRemId?: string;
  maxDepth?: number;
  maxNodes?: number;
}

export interface SaveNoteDesignTemplateArgs {
  templateId?: string;
  name: string;
  description?: string;
  sourceRemId?: string;
  rootRemId?: string;
  rules?: NoteDesignRules;
  overwrite?: boolean;
  expectedVersion?: number;
}

export interface ListNoteDesignTemplatesArgs {
  includeRules?: boolean;
}

export type NoteDesignPreviewMode = 'create' | 'append' | 'replace_children' | 'repair';

export interface PreviewNoteDesignPlanArgs {
  templateId?: string;
  templateJson?: string;
  targetRemId?: string;
  parentId?: string;
  title?: string;
  content?: string;
  mode?: NoteDesignPreviewMode;
  rules?: NoteDesignRules;
  stylePreset?: NoteStylePreset;
}

export interface ExportNoteDesignTemplateArgs {
  templateId: string;
}

export interface ImportNoteDesignTemplateArgs {
  templateJson: string;
  overwrite?: boolean;
  expectedVersion?: number;
}

export type DesignedNoteWritingMode = 'markdown' | 'styled_tree';
export type DesignedNoteUpdateMode =
  | 'append_sections'
  | 'replace_children'
  | 'repair_structure'
  | 'convert_markdown_pollution'
  | 'convert_formulas';

export interface CreateDesignedNoteTreeArgs {
  parentId: string;
  title: string;
  content: string | StyledRemTreeNode;
  templateId?: string;
  writingMode?: DesignedNoteWritingMode;
  dryRun?: boolean;
  verifyAfterWrite?: boolean;
  performanceTargetMs?: number;
  idempotencyKey?: string;
  maxDepth?: number;
  maxNodeCount?: number;
}

export interface UpdateNoteWithDesignArgs {
  targetRemId: string;
  mode: DesignedNoteUpdateMode;
  templateId?: string;
  content?: string | StyledRemTreeNode;
  markdownText?: string;
  styleOperations?: StylingPlanOperation[];
  dryRun?: boolean;
  approved?: boolean;
  verifyAfterWrite?: boolean;
  idempotencyKey?: string;
}

export interface VerifyNoteAgainstDesignArgs {
  rootRemId: string;
  templateId?: string;
  rules?: NoteDesignRules;
  expectedStyleMap?: ExpectedStyleMap;
}

export interface RepairNoteDesignArgs {
  rootRemId: string;
  templateId?: string;
  operations?: StylingPlanOperation[];
  dryRun?: boolean;
  approved?: boolean;
  verifyAfterWrite?: boolean;
  idempotencyKey?: string;
}

export interface CreateCardSetFromNoteArgs {
  rootRemId: string;
  parentId?: string;
  maxCards?: number;
  dryRun?: boolean;
  direction?: PracticeDirection;
  idempotencyKey?: string;
}

export interface CreateFlashcardsFromMarkdownArgs {
  parentId: string;
  markdownText: string;
  marker?: MarkdownFlashcardMarkerMode;
  maxCards?: number;
  dryRun?: boolean;
  direction?: PracticeDirection;
  idempotencyKey?: string;
}

export interface CreateClozeCardsFromNoteArgs {
  rootRemId: string;
  parentId?: string;
  maxCards?: number;
  dryRun?: boolean;
  direction?: PracticeDirection;
  idempotencyKey?: string;
}

export interface ExpectedCardPlan {
  front: string;
  back?: string;
  cardType?: 'basic' | 'concept' | 'descriptor' | 'cloze' | 'multiple_choice' | 'list_answer';
}

export interface VerifyCardSetArgs {
  rootRemId: string;
  expectedCards?: ExpectedCardPlan[];
  maxCards?: number;
  maxNodes?: number;
  maxDepth?: number;
  timeoutMs?: number;
}

export interface RepairCardSetArgs {
  rootRemId: string;
  cards?: Array<{ front: string; back: string }>;
  dryRun?: boolean;
  approved?: boolean;
  direction?: PracticeDirection;
  idempotencyKey?: string;
}

export interface CreateFlashcardArgs {
  parentId: string;
  front: string;
  back: string;
  direction?: PracticeDirection;
  idempotencyKey?: string;
  verifyAfterWrite?: boolean;
}

export interface CreateClozeCardArgs {
  parentId: string;
  text: string;
  clozeText?: string;
  direction?: PracticeDirection;
  idempotencyKey?: string;
  verifyAfterWrite?: boolean;
}

export interface CreateMultipleChoiceCardArgs {
  parentId: string;
  question: string;
  choices: string[];
  correctChoice: string;
  direction?: PracticeDirection;
  idempotencyKey?: string;
  verifyAfterWrite?: boolean;
}

export interface CreateListAnswerCardArgs {
  parentId: string;
  prompt: string;
  items: string[];
  direction?: PracticeDirection;
  idempotencyKey?: string;
  verifyAfterWrite?: boolean;
}
