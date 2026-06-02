export type PermissionMode = 'read_only' | 'confirm_writes' | 'trusted_writes' | 'danger_zone';
export type PermissionScope =
  | 'focused_rem_only'
  | 'focused_rem_and_descendants'
  | 'selected_rem_only'
  | 'selected_rem_and_descendants'
  | 'approved_document_or_folder'
  | 'workspace_allowed';

export const WRITE_APPROVAL_TIMEOUT_MS = 30000;

export type BridgeToolName =
  | 'ping'
  | 'get_status'
  | 'get_focused_rem'
  | 'get_rem'
  | 'get_rem_tree'
  | 'get_rem_rich'
  | 'debug_get_raw_rich_text'
  | 'get_current_selection'
  | 'get_children'
  | 'get_rem_breadcrumbs'
  | 'search_rems'
  | 'get_document_or_folder_tree'
  | 'create_rem'
  | 'append_to_rem'
  | 'create_document'
  | 'create_folder'
  | 'update_rem'
  | 'move_rem'
  | 'reorder_children'
  | 'create_rem_tree'
  | 'update_rem_rich'
  | 'set_rem_heading_level'
  | 'set_rem_text_color'
  | 'set_rem_highlight_color'
  | 'set_text_span_color'
  | 'set_text_span_highlight'
  | 'set_rem_type'
  | 'set_hide_bullet'
  | 'clear_rem_formatting'
  | 'create_styled_rem_tree'
  | 'apply_remnote_command'
  | 'apply_structured_note_batch'
  | 'create_polished_note_tree'
  | 'create_or_replace_note_from_markdown'
  | 'apply_style_plan'
  | 'verify_note_design'
  | 'create_basic_flashcard'
  | 'create_concept_card'
  | 'create_descriptor_card'
  | 'create_cloze_card'
  | 'create_multiple_choice_card'
  | 'create_list_answer_card'
  | 'replace_rem'
  | 'delete_rem_by_id';

export type ReadOnlyBridgeToolName =
  | 'get_focused_rem'
  | 'get_rem'
  | 'get_rem_tree'
  | 'get_rem_rich'
  | 'debug_get_raw_rich_text'
  | 'get_current_selection'
  | 'get_children'
  | 'get_rem_breadcrumbs'
  | 'search_rems'
  | 'get_document_or_folder_tree'
  | 'verify_note_design';
export type SafeWriteBridgeToolName =
  | 'create_rem'
  | 'append_to_rem'
  | 'create_document'
  | 'create_folder'
  | 'update_rem'
  | 'move_rem'
  | 'reorder_children'
  | 'create_rem_tree'
  | 'update_rem_rich'
  | 'set_rem_heading_level'
  | 'set_rem_text_color'
  | 'set_rem_highlight_color'
  | 'set_text_span_color'
  | 'set_text_span_highlight'
  | 'set_rem_type'
  | 'set_hide_bullet'
  | 'clear_rem_formatting'
  | 'create_styled_rem_tree'
  | 'apply_remnote_command'
  | 'apply_structured_note_batch'
  | 'create_polished_note_tree'
  | 'create_or_replace_note_from_markdown'
  | 'apply_style_plan'
  | 'create_basic_flashcard'
  | 'create_concept_card'
  | 'create_descriptor_card'
  | 'create_cloze_card'
  | 'create_multiple_choice_card'
  | 'create_list_answer_card';
export type DangerousBridgeToolName =
  | 'replace_rem'
  | 'delete_rem_by_id';

export type BridgeErrorCode =
  | 'NO_FOCUSED_REM'
  | 'REM_NOT_FOUND'
  | 'PARENT_NOT_FOUND'
  | 'PLUGIN_NOT_CONNECTED'
  | 'PLUGIN_NOT_PAIRED'
  | 'NO_PAIRED_PLUGIN_SESSION'
  | 'DEVICE_CONFLICT'
  | 'PLUGIN_SESSION_EXPIRED'
  | 'PLUGIN_SESSION_REVOKED'
  | 'NO_ACTIVE_DEVICE'
  | 'INVALID_ARGS'
  | 'PERMISSION_DENIED'
  | 'OUT_OF_SCOPE'
  | 'APPROVAL_REJECTED'
  | 'APPROVAL_TIMEOUT'
  | 'SDK_UNSUPPORTED'
  | 'SDK_ERROR'
  | 'TIMEOUT'
  | 'CLIENT_DISCONNECTED'
  | 'RETRYABLE_UNKNOWN_WRITE_STATUS'
  | 'RETRYABLE_UNKNOWN_DELETE_STATUS'
  | 'REQUEST_CANCELLED'
  | 'UNKNOWN_TOOL'
  | 'APPROVAL_PENDING'
  | 'OPERATION_PENDING'
  | 'PARTIAL_FAILURE'
  | 'INTERNAL_ERROR';

export type ApprovalResolution =
  | 'APPROVED'
  | 'APPROVAL_REJECTED'
  | 'APPROVAL_TIMEOUT'
  | 'APPROVAL_PENDING'
  | 'REQUEST_CANCELLED';
export type ApprovalRiskLevel = 'safe_write' | 'destructive';
export type BridgeLifecyclePhase =
  | 'received'
  | 'validated'
  | 'waiting_for_chatgpt_permission'
  | 'waiting_for_remnote_approval'
  | 'waiting_for_approval'
  | 'approval_approved'
  | 'approval_rejected'
  | 'approval_timeout'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'partial_failure'
  | 'rollback_started'
  | 'rollback_completed'
  | 'rollback_failed'
  | 'cancelled'
  | 'timeout';

export interface BridgeLifecycleEvent {
  phase: BridgeLifecyclePhase;
  at: string;
  message?: string;
}

export interface SerializedRem {
  remId: string;
  frontText: string;
  backText: string;
  plainText: string;
  breadcrumbs: string[];
  hasChildren: boolean;
  children?: SerializedRem[];
  truncated?: boolean;
}

export type RemStructureType = 'rem' | 'document' | 'folder' | 'unknown';

export interface RemChildSummary {
  remId: string;
  title: string;
  frontText: string;
  plainText: string;
  breadcrumbs: string[];
  index: number;
  hasChildren: boolean;
  type: RemStructureType;
}

export interface RemBreadcrumbSummary {
  remId: string;
  title: string;
  text: string;
}

export interface PingArgs {
  message?: string;
}

export interface PingResult {
  message: string;
}

export interface GetStatusArgs {}

export interface BridgePluginStatus {
  connected: true;
  permissionMode: PermissionMode;
  permissionScope: PermissionScope;
  approvedRootRemId: string | null;
  focusedRem?: {
    found: boolean;
    remId?: string;
    label: string;
    hasChildren?: boolean;
  };
}

export interface GetFocusedRemArgs {}

export interface GetRemArgs {
  remId: string;
}

export interface GetRemTreeArgs {
  remId: string;
  depth?: number;
}

export interface GetRemRichArgs {
  remId: string;
}

export interface DebugGetRawRichTextArgs {
  remId: string;
}

export interface GetCurrentSelectionArgs {}

export interface GetChildrenArgs {
  parentRemId: string;
  maxChildren?: number;
}

export interface GetRemBreadcrumbsArgs {
  remId: string;
}

export interface SearchRemsArgs {
  query: string;
  contextRemId?: string | null;
  maxResults?: number;
  scope?: PermissionScope | 'current_permission_scope';
}

export interface GetDocumentOrFolderTreeArgs {
  rootRemId?: string | null;
  depth?: number;
  maxChildren?: number;
}

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

export interface CreateRemResult {
  createdRemId: string;
  parentId: string | null;
  insertIndex?: number;
  insertPosition?: 'end';
  status: 'created';
  idempotencyKey?: string;
}

export interface CreateDocumentResult {
  createdRemId: string;
  parentId: string | null;
  insertIndex?: number;
  insertPosition?: 'end';
  document: true;
  status: 'created_document';
  idempotencyKey?: string;
}

export interface CreateFolderResult {
  createdRemId: string;
  parentId: string | null;
  insertIndex?: number;
  insertPosition?: 'end';
  folder: true;
  status: 'created_folder';
}

export interface AppendToRemResult {
  targetRemId: string;
  createdRemId: string;
  insertIndex?: number;
  position?: 'start' | 'end';
  status: 'appended';
  idempotencyKey?: string;
}

export interface UpdateRemResult {
  updatedRemId: string;
  status: 'updated' | 'dry_run' | 'already_applied';
  dryRun?: boolean;
  idempotencyKey?: string;
  previewMarkdown?: string;
  beforePlainText?: string;
  afterPlainText?: string;
  afterPreviewMarkdown?: string;
}

export interface MoveRemResult {
  movedRemId: string;
  newParentId: string;
  index: number;
  status: 'moved' | 'dry_run' | 'already_applied';
  dryRun?: boolean;
  idempotencyKey?: string;
  beforeParentId?: string | null;
  afterParentId?: string;
  beforeBreadcrumbs?: Array<{ id: string; text: string }>;
  afterBreadcrumbs?: Array<{ id: string; text: string }>;
}

export interface ReorderChildrenResult {
  parentRemId: string;
  parentId: string;
  orderedChildRemIds: string[];
  orderedChildIds: string[];
  status: 'reordered' | 'dry_run' | 'already_applied';
  dryRun?: boolean;
  idempotencyKey?: string;
  allowPartial?: boolean;
  missingIds?: string[];
  extraIds?: string[];
  beforeOrder?: string[];
  afterOrder?: string[];
}

export interface CreateRemTreeResult {
  rootCreatedRemId: string;
  createdNodeCount: number;
  createdRemIds: string[];
  rootInsertIndex?: number;
  rootInsertPosition?: 'start' | 'end';
  status: 'created_tree';
  idempotencyKey?: string;
}

export interface FormatRemResult {
  remId: string;
  status:
    | 'updated_rich'
    | 'heading_set'
    | 'text_color_set'
    | 'highlight_set'
    | 'span_color_set'
    | 'span_highlight_set'
    | 'rem_type_set'
    | 'hide_bullet_set'
    | 'formatting_cleared'
    | 'formatting_partially_cleared'
    | 'command_applied';
  ok?: boolean;
  requestedColor?: string;
  normalizedColor?: string;
  methodUsed?: 'rich_text_rebuild' | 'applyTextFormatToRange';
  resolvedPlainText?: string;
  start?: number;
  end?: number;
  verification?: Record<string, unknown>;
  cleared?: {
    heading?: boolean;
    wholeRemHighlight?: boolean;
    hideBullet?: boolean;
    textFormatting?: boolean;
    remType?: boolean;
  };
  unsupported?: {
    wholeRemHighlightReset?: boolean;
    remTypeReset?: boolean;
    reason?: string;
  };
  warnings?: string[];
  idempotencyKey?: string;
}

export interface ApplyRemnoteCommandResult {
  remId: string;
  command: RemnoteCommandName;
  status: 'command_applied' | 'already_applied' | 'dry_run';
  dryRun?: boolean;
  idempotencyKey?: string;
}

export interface CreateStyledRemTreeResult {
  rootCreatedRemId: string;
  createdNodeCount: number;
  createdRemIds: string[];
  createdNodes: Array<{
    remId: string;
    parentId: string;
    depth: number;
    index: number;
    type: StyledRemTreeNodeType;
  }>;
  rootInsertIndex?: number;
  rootInsertPosition?: 'start' | 'end';
  status: 'created_styled_tree' | 'dry_run' | 'already_applied';
  dryRun?: boolean;
  idempotencyKey?: string;
  plannedNodeCount?: number;
  idMap?: Record<string, string>;
  previewOutline?: string[];
  styleOperationCount?: number;
  mathNodeCount?: number;
  cardNodeCount?: number;
}

export interface StructuredNoteBatchVerification {
  ok: boolean;
  checkedRemIds: string[];
  missingRemIds: string[];
  rootPlainText?: string;
}

export interface MarkdownImportVerification {
  passed: boolean;
  checkedNodeCount: number;
  missingTextSnippets: string[];
  extraTextSnippets: string[];
  structureMismatches: string[];
}

export interface ApplyStructuredNoteBatchResult {
  operationId?: string;
  status: 'dry_run' | 'applied' | 'already_applied';
  targetRemId?: string;
  parentId?: string;
  operation?: StructuredNoteOperation;
  plannedNodeCount: number;
  createdNodeCount: number;
  createdRemIds: string[];
  updatedRemIds?: string[];
  deletedRemIds?: string[];
  movedRemIds?: string[];
  rootCreatedRemId?: string;
  rootInsertIndex?: number;
  rootInsertPosition?: 'start' | 'end';
  dryRun: boolean;
  idempotencyKey?: string;
  rollbackOnFailure: boolean;
  verifyAfterWrite: boolean;
  verification?: StructuredNoteBatchVerification;
  styleCount?: number;
  mathCount?: number;
  cardCount?: number;
  rollback?: {
    attempted: boolean;
    completed: boolean;
    removedRemIds?: string[];
    failedRemIds?: string[];
  };
}

export interface ApplyStylePlanResult {
  status: 'applied' | 'partial' | 'failed' | 'dry_run' | 'already_applied';
  operations: Array<{
    index: number;
    remId: string;
    type: StylingPlanOperation['type'];
    status: 'applied' | 'failed' | 'unsupported';
    result?: unknown;
    error?: {
      code: BridgeErrorCode;
      message: string;
      details?: unknown;
    };
  }>;
  continueOnError: boolean;
  verifyAfterWrite: boolean;
  dryRun?: boolean;
  idempotencyKey?: string;
}

export interface CreatePolishedNoteTreeResult extends CreateStyledRemTreeResult {
  stylePlan?: ApplyStylePlanResult;
  verification?: StructuredNoteBatchVerification;
  idempotencyKey?: string;
  rootRemId?: string;
  createdRemCount?: number;
  styleOperationsApplied?: number;
  rollback?: {
    attempted: boolean;
    completed: boolean;
    removedRemIds?: string[];
    failedRemIds?: string[];
  };
  phases?: Array<{
    name: 'validate_tree' | 'create_tree' | 'apply_styles' | 'verify_design' | 'rollback';
    status: 'completed' | 'skipped' | 'failed';
  }>;
}

export interface CreateOrReplaceNoteFromMarkdownResult {
  ok: boolean;
  rootRemId?: string;
  createdRemIds: string[];
  updatedRemIds: string[];
  skippedRemIds?: string[];
  nodeCount: number;
  maxDepth: number;
  sourceHash: string;
  outputHash?: string;
  verification?: MarkdownImportVerification;
  partialExecution?: {
    createdRemIds: string[];
    failedAtPath?: string;
    failedReason?: string;
    rollbackStatus: 'not_attempted' | 'completed' | 'failed';
  };
  dryRun?: boolean;
  idempotencyKey?: string;
  status: 'dry_run' | 'created' | 'updated' | 'appended' | 'replaced' | 'skipped' | 'partial_failure';
  mode: MarkdownImportMode;
  duplicatePolicy: MarkdownDuplicatePolicy;
  plan?: {
    previewOutline: string[];
    headingCount: number;
    mathBlockCount: number;
    inlineMathCount: number;
    codeBlockCount: number;
    tableCount: number;
    paragraphCount: number;
    bulletCount: number;
  };
}

export interface VerifyNoteDesignResult {
  rootRemId: string;
  ok: boolean;
  checkedRemIds: string[];
  mismatches: Array<{
    remId: string;
    type: string;
    expected?: unknown;
    actual?: unknown;
    message: string;
    fixSuggestion?: string;
  }>;
  unsupportedChecks: Array<{
    remId: string;
    type: string;
    reason: string;
  }>;
}

export interface CreateFlashcardResult {
  createdRemId: string;
  parentId: string;
  cardType: 'basic' | 'concept' | 'descriptor' | 'cloze' | 'multiple_choice' | 'list_answer';
  direction: PracticeDirection;
  createdChildRemIds?: string[];
  status: 'created_flashcard';
  idempotencyKey?: string;
}

export interface ReplaceRemResult {
  remId: string;
  status?: 'replaced' | 'dry_run' | 'already_applied';
  dryRun?: boolean;
  idempotencyKey?: string;
}

export interface DeletePreview {
  targetRemId: string;
  targetTitle: string;
  parentRemId: string | null;
  parentTitle: string | null;
  childCount: number;
  descendantCount: number;
  recursive: boolean;
  requiresConfirmText: 'DELETE';
}

export interface DeleteRemByIdTarget {
  remId: string;
  plainText: string;
  parentId: string | null;
  breadcrumbs: Array<{ id: string; text: string }>;
  childCount: number;
}

export interface DeleteRemByIdResult {
  dryRun: boolean;
  target?: DeleteRemByIdTarget;
  guards?: {
    expectedParentMatches?: boolean;
    expectedAncestorMatches?: boolean;
    confirmTitleMatches?: boolean;
  };
  wouldDelete?: {
    remId: string;
    childCount: number;
    includesDescendants: boolean;
  };
  deletedRemId?: string;
  verification?: {
    deleted: boolean;
    readAfterDelete: 'not_found' | 'still_present';
  };
  verifiedDeleted?: boolean;
  idempotencyKey?: string;
  status: 'dry_run' | 'deleted' | 'already_deleted';
}

export type DetectedContentType =
  | 'plain_text'
  | 'inline_math'
  | 'math_block'
  | 'descriptor'
  | 'concept';

export interface GetRemRichResult {
  remId: string;
  frontText: string;
  backText: string;
  plainText: string;
  remStyle?: {
    headingLevel: RemHeadingLevel;
    hideBullet: boolean;
    highlightColor?: RemColorName;
    remType: RemTypeName | 'unknown';
  };
  richText?: RichTextSpanInput[];
  backRichText?: RichTextSpanInput[];
  children?: RemChildSummary[];
  card?: {
    hasCards: boolean;
    cards: Array<{
      id?: string;
      type?: unknown;
    }>;
  };
  rich: {
    front: unknown[];
    back: unknown[];
  };
  richSupported: boolean;
  reason?: string;
  detectedContentTypes: DetectedContentType[];
}

export interface DebugGetRawRichTextResult {
  remId: string;
  rawText: unknown;
  rawBackText?: unknown;
  richLength?: number;
  backRichLength?: number;
  json: string;
  interpretation: {
    fontColorField: string;
    textHighlightField: string;
    wholeRemHighlightSource: string;
  };
}

export interface GetCurrentSelectionResult {
  focusedRemId: string | null;
  selectedRemIds: string[];
  selectionSupported: boolean;
  reason?: string;
}

export interface GetChildrenResult {
  parentRemId: string;
  remId: string;
  children: RemChildSummary[];
  childCount: number;
  truncated: boolean;
}

export interface GetRemBreadcrumbsResult {
  remId: string;
  breadcrumbs: RemBreadcrumbSummary[];
}

export interface SearchRemsResult {
  query: string;
  contextRemId: string | null;
  results: RemChildSummary[];
  truncated: boolean;
  searchSupported: boolean;
  scopeMetadata?: {
    scopeRequested: string;
    scopeEnforcement: 'post_filter_ancestor_chain' | 'none';
    rawResultCount: number;
    filteredResultCount: number;
    filteredOutCount: number;
  };
}

export interface GetDocumentOrFolderTreeResult {
  rootRemId: string;
  rootType: RemStructureType;
  source: 'requested_root' | 'focused_portal' | 'focused_rem';
  tree: SerializedRem;
  truncated: boolean;
}

export interface BridgeToolArgs {
  ping: PingArgs;
  get_status: GetStatusArgs;
  get_focused_rem: GetFocusedRemArgs;
  get_rem: GetRemArgs;
  get_rem_tree: GetRemTreeArgs;
  get_rem_rich: GetRemRichArgs;
  debug_get_raw_rich_text: DebugGetRawRichTextArgs;
  get_current_selection: GetCurrentSelectionArgs;
  get_children: GetChildrenArgs;
  get_rem_breadcrumbs: GetRemBreadcrumbsArgs;
  search_rems: SearchRemsArgs;
  get_document_or_folder_tree: GetDocumentOrFolderTreeArgs;
  create_rem: CreateRemArgs;
  append_to_rem: AppendToRemArgs;
  create_document: CreateDocumentArgs;
  create_folder: CreateFolderArgs;
  update_rem: UpdateRemArgs;
  move_rem: MoveRemArgs;
  reorder_children: ReorderChildrenArgs;
  create_rem_tree: CreateRemTreeArgs;
  update_rem_rich: UpdateRemRichArgs;
  set_rem_heading_level: SetRemHeadingLevelArgs;
  set_rem_text_color: SetRemTextColorArgs;
  set_rem_highlight_color: SetRemHighlightColorArgs;
  set_text_span_color: SetTextSpanColorArgs;
  set_text_span_highlight: SetTextSpanHighlightArgs;
  set_rem_type: SetRemTypeArgs;
  set_hide_bullet: SetHideBulletArgs;
  clear_rem_formatting: ClearRemFormattingArgs;
  create_styled_rem_tree: CreateStyledRemTreeArgs;
  apply_remnote_command: ApplyRemnoteCommandArgs;
  apply_structured_note_batch: ApplyStructuredNoteBatchArgs;
  create_polished_note_tree: CreatePolishedNoteTreeArgs;
  create_or_replace_note_from_markdown: CreateOrReplaceNoteFromMarkdownArgs;
  apply_style_plan: ApplyStylePlanArgs;
  verify_note_design: VerifyNoteDesignArgs;
  create_basic_flashcard: CreateFlashcardArgs;
  create_concept_card: CreateFlashcardArgs;
  create_descriptor_card: CreateFlashcardArgs;
  create_cloze_card: CreateClozeCardArgs;
  create_multiple_choice_card: CreateMultipleChoiceCardArgs;
  create_list_answer_card: CreateListAnswerCardArgs;
  replace_rem: ReplaceRemArgs;
  delete_rem_by_id: DeleteRemByIdArgs;
}

export interface BridgeToolResults {
  ping: PingResult;
  get_status: BridgePluginStatus;
  get_focused_rem: SerializedRem;
  get_rem: SerializedRem;
  get_rem_tree: SerializedRem;
  get_rem_rich: GetRemRichResult;
  debug_get_raw_rich_text: DebugGetRawRichTextResult;
  get_current_selection: GetCurrentSelectionResult;
  get_children: GetChildrenResult;
  get_rem_breadcrumbs: GetRemBreadcrumbsResult;
  search_rems: SearchRemsResult;
  get_document_or_folder_tree: GetDocumentOrFolderTreeResult;
  create_rem: CreateRemResult;
  append_to_rem: AppendToRemResult;
  create_document: CreateDocumentResult;
  create_folder: CreateFolderResult;
  update_rem: UpdateRemResult;
  move_rem: MoveRemResult;
  reorder_children: ReorderChildrenResult;
  create_rem_tree: CreateRemTreeResult;
  update_rem_rich: FormatRemResult;
  set_rem_heading_level: FormatRemResult;
  set_rem_text_color: FormatRemResult;
  set_rem_highlight_color: FormatRemResult;
  set_text_span_color: FormatRemResult;
  set_text_span_highlight: FormatRemResult;
  set_rem_type: FormatRemResult;
  set_hide_bullet: FormatRemResult;
  clear_rem_formatting: FormatRemResult;
  create_styled_rem_tree: CreateStyledRemTreeResult;
  apply_remnote_command: ApplyRemnoteCommandResult;
  apply_structured_note_batch: ApplyStructuredNoteBatchResult;
  create_polished_note_tree: CreatePolishedNoteTreeResult;
  create_or_replace_note_from_markdown: CreateOrReplaceNoteFromMarkdownResult;
  apply_style_plan: ApplyStylePlanResult;
  verify_note_design: VerifyNoteDesignResult;
  create_basic_flashcard: CreateFlashcardResult;
  create_concept_card: CreateFlashcardResult;
  create_descriptor_card: CreateFlashcardResult;
  create_cloze_card: CreateFlashcardResult;
  create_multiple_choice_card: CreateFlashcardResult;
  create_list_answer_card: CreateFlashcardResult;
  replace_rem: ReplaceRemResult;
  delete_rem_by_id: DeleteRemByIdResult;
}

export type BridgeRequest<TTool extends BridgeToolName = BridgeToolName> = {
  [TName in TTool]: {
    id: string;
    tool: TName;
    args: BridgeToolArgs[TName];
    permissionMode?: PermissionMode;
    timeoutMs?: number;
  };
}[TTool];

export interface BridgeSuccess<TResult = unknown> {
  id: string;
  ok: true;
  result: TResult;
  lifecycle?: BridgeLifecycleEvent[];
}

export interface BridgeFailure {
  id: string;
  ok: false;
  error: {
    code: BridgeErrorCode;
    message: string;
    details?: unknown;
  };
  lifecycle?: BridgeLifecycleEvent[];
}

export type BridgeResponse<TResult = unknown> = BridgeSuccess<TResult> | BridgeFailure;

export interface PendingApprovalRequest<TTool extends BridgeToolName = BridgeToolName> {
  id: string;
  tool: TTool;
  args: BridgeToolArgs[TTool];
  permissionMode: PermissionMode;
  permissionScope: PermissionScope;
  requestedAt: string;
  timeoutDeadline: string;
  targetRemId?: string;
  targetTitle?: string;
  hasChildren?: boolean;
  previewMarkdown?: string;
  riskLevel: ApprovalRiskLevel;
  summary: string;
  warning?: string;
  confirmTextRequired?: 'DELETE';
  deletePreview?: DeletePreview;
}

export interface BridgePluginHello {
  type: 'plugin_hello';
  protocolVersion: 1;
  clientName: 'remnote-plugin';
  deploymentMode?: 'local' | 'hosted';
  deviceId?: string;
  pluginSessionId?: string;
  pluginSessionToken?: string;
  token?: string;
}

export interface BridgePluginRegister {
  type: 'plugin_register';
  pluginInstanceId: string;
  pluginConnectionId: string;
  sessionSecret: string;
  workspaceLabel?: string;
  supportedTools: string[];
  accessScope?: 'focused-rem-only' | 'current-rem-tree' | 'full-kb';
  trustedWriteMode?: 'ask-every-write' | 'trusted-inside-scope';
  toolTier?: BridgeToolProfile;
}

export type BridgeToolProfile = 'core' | 'advanced_notes' | 'developer_diagnostics' | 'full';
export type BridgeToolPolicy =
  | 'preferred'
  | 'fallback'
  | 'debug'
  | 'read'
  | 'cards'
  | 'dangerous'
  | 'unsupported';

export interface BridgeServerHello {
  type: 'server_hello';
  protocolVersion: 1;
  serverName: 'remnote-companion';
  toolProfile?: BridgeToolProfile;
  toolTier?: BridgeToolProfile;
  activeToolTier?: BridgeToolProfile;
  defaultToolTier?: BridgeToolProfile;
  toolSchemaVersion?: string;
  toolRegistryVersion?: string;
  serverToolRegistryVersion?: string;
  mcpDiscoveryVersion?: string;
  pluginProtocolVersion?: number;
  registeredTools?: string[];
  allPublicTools?: string[];
  allPublicToolCount?: number;
  publicTools?: string[];
  publicToolCount?: number;
  exposedTools?: string[];
  registryDeclaredTools?: string[];
  mcpRegisteredTools?: string[];
  mcpListedTools?: string[];
  callabilitySource?: 'registry_only_not_live_execution' | 'live_execution';
  callableTools?: string[];
  actualMcpCallableTools?: string[];
  unauthMcpCallableTools?: string[];
  realPluginVerifiedTools?: string[];
  runtimeUnverifiedTools?: string[];
  sdkUnsupportedTools?: string[];
  preferredTools?: string[];
  fallbackTools?: string[];
  debugTools?: string[];
  readTools?: string[];
  cardTools?: string[];
  dangerousTools?: string[];
  unsupportedTools?: string[];
  profileHiddenTools?: Array<{
    name: string;
    reason: string;
    policy?: BridgeToolPolicy;
    replacement?: string;
    tier?: string;
  }>;
  toolMetadata?: Record<string, unknown>;
  toolTierSummary?: Record<string, unknown>;
  runtimeVerificationMatrix?: Array<Record<string, unknown>>;
  hiddenTools?: Array<{ name: string; reason: string }>;
  requiresConnectorRefresh?: boolean;
  serverStartedAt?: string;
}

export interface BridgeCancelRequest {
  type: 'cancel_request';
  id: string;
  reason: 'client_disconnected' | 'server_timeout' | 'server_shutdown';
  message: string;
}

export type BridgeClientMessage = BridgePluginHello | BridgePluginRegister | BridgeResponse;
export type BridgeServerMessage = BridgeServerHello | BridgeRequest | BridgeCancelRequest;

export interface BridgeToolAnnotations {
  readOnlyHint: boolean;
  openWorldHint: boolean;
  destructiveHint: boolean;
  idempotentHint?: boolean;
}

export const BRIDGE_TOOL_NAMES: readonly BridgeToolName[] = [
  'ping',
  'get_status',
  'get_focused_rem',
  'get_rem',
  'get_rem_tree',
  'get_rem_rich',
  'debug_get_raw_rich_text',
  'get_current_selection',
  'get_children',
  'get_rem_breadcrumbs',
  'search_rems',
  'get_document_or_folder_tree',
  'create_rem',
  'append_to_rem',
  'create_document',
  'create_folder',
  'update_rem',
  'move_rem',
  'reorder_children',
  'create_rem_tree',
  'update_rem_rich',
  'set_rem_heading_level',
  'set_rem_text_color',
  'set_rem_highlight_color',
  'set_text_span_color',
  'set_text_span_highlight',
  'set_rem_type',
  'set_hide_bullet',
  'clear_rem_formatting',
  'create_styled_rem_tree',
  'apply_remnote_command',
  'apply_structured_note_batch',
  'create_polished_note_tree',
  'create_or_replace_note_from_markdown',
  'apply_style_plan',
  'verify_note_design',
  'create_basic_flashcard',
  'create_concept_card',
  'create_descriptor_card',
  'create_cloze_card',
  'create_multiple_choice_card',
  'create_list_answer_card',
  'replace_rem',
  'delete_rem_by_id',
] as const;

export const BRIDGE_TOOL_ANNOTATIONS: Record<BridgeToolName, BridgeToolAnnotations> = {
  ping: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  get_status: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  get_focused_rem: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  get_rem: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  get_rem_tree: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  get_rem_rich: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  debug_get_raw_rich_text: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  get_current_selection: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  get_children: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  get_rem_breadcrumbs: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  search_rems: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  get_document_or_folder_tree: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  create_rem: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  append_to_rem: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  create_document: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  create_folder: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  update_rem: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  move_rem: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  reorder_children: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  create_rem_tree: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  update_rem_rich: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  set_rem_heading_level: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  set_rem_text_color: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  set_rem_highlight_color: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  set_text_span_color: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  set_text_span_highlight: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  set_rem_type: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  set_hide_bullet: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  clear_rem_formatting: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  create_styled_rem_tree: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  apply_remnote_command: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  apply_structured_note_batch: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  create_polished_note_tree: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  create_or_replace_note_from_markdown: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  apply_style_plan: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  verify_note_design: {
    readOnlyHint: true,
    openWorldHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  create_basic_flashcard: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  create_concept_card: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  create_descriptor_card: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  create_cloze_card: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  create_multiple_choice_card: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  create_list_answer_card: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: false,
  },
  replace_rem: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: true,
  },
  delete_rem_by_id: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: true,
    idempotentHint: true,
  },
};

export function isBridgeToolName(value: unknown): value is BridgeToolName {
  return typeof value === 'string' && (BRIDGE_TOOL_NAMES as readonly string[]).includes(value);
}

export function createBridgeSuccess<TTool extends BridgeToolName>(
  request: Pick<BridgeRequest<TTool>, 'id'>,
  result: BridgeToolResults[TTool],
  lifecycle?: BridgeLifecycleEvent[]
): BridgeSuccess<BridgeToolResults[TTool]> {
  return {
    id: request.id,
    ok: true,
    result,
    ...(lifecycle ? { lifecycle } : {}),
  };
}

export function createBridgeFailure(
  id: string,
  code: BridgeErrorCode,
  message: string,
  details?: unknown,
  lifecycle?: BridgeLifecycleEvent[]
): BridgeFailure {
  return {
    id,
    ok: false,
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    },
    ...(lifecycle ? { lifecycle } : {}),
  };
}
