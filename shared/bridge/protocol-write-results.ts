import type {
  ApplyStructuredNoteBatchArgs,
  ExpectedStyleMapEntry,
  MarkdownDuplicatePolicy,
  MarkdownImportMode,
  PracticeDirection,
  RemColorName,
  RemHeadingLevel,
  RemnoteCommandName,
  RemTypeName,
  StructuredNoteOperation,
  StyledRemTreeNode,
  StyledRemTreeNodeType,
  StylingPlanOperation,
} from './protocol-write-args.js';
import type { BridgeErrorCode } from './protocol-core.js';

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
  headingCount: number;
  paragraphCount: number;
  bulletCount: number;
  mathBlockCount: number;
  inlineMathCount: number;
  codeBlockCount: number;
  tableCount: number;
  missingTextSnippets: string[];
  extraTextSnippets: string[];
  structureMismatches: string[];
  pollutionRems: string[];
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
