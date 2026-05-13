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
  | 'create_basic_flashcard'
  | 'create_concept_card'
  | 'create_descriptor_card'
  | 'create_cloze_card'
  | 'create_multiple_choice_card'
  | 'create_list_answer_card'
  | 'replace_rem'
  | 'delete_focused_rem'
  | 'delete_selected_rem'
  | 'delete_rem';

export type ReadOnlyBridgeToolName =
  | 'get_focused_rem'
  | 'get_rem'
  | 'get_rem_tree'
  | 'get_rem_rich'
  | 'get_current_selection'
  | 'get_children'
  | 'get_rem_breadcrumbs'
  | 'search_rems'
  | 'get_document_or_folder_tree';
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
  | 'create_basic_flashcard'
  | 'create_concept_card'
  | 'create_descriptor_card'
  | 'create_cloze_card'
  | 'create_multiple_choice_card'
  | 'create_list_answer_card';
export type DangerousBridgeToolName =
  | 'replace_rem'
  | 'delete_focused_rem'
  | 'delete_selected_rem'
  | 'delete_rem';

export type BridgeErrorCode =
  | 'NO_FOCUSED_REM'
  | 'REM_NOT_FOUND'
  | 'PARENT_NOT_FOUND'
  | 'PLUGIN_NOT_CONNECTED'
  | 'INVALID_ARGS'
  | 'PERMISSION_DENIED'
  | 'OUT_OF_SCOPE'
  | 'APPROVAL_REJECTED'
  | 'APPROVAL_TIMEOUT'
  | 'SDK_UNSUPPORTED'
  | 'SDK_ERROR'
  | 'TIMEOUT'
  | 'CLIENT_DISCONNECTED'
  | 'UNKNOWN_TOOL'
  | 'APPROVAL_PENDING'
  | 'INTERNAL_ERROR';

export type ApprovalResolution =
  | 'APPROVED'
  | 'APPROVAL_REJECTED'
  | 'APPROVAL_TIMEOUT'
  | 'APPROVAL_PENDING'
  | 'REQUEST_CANCELLED';
export type ApprovalRiskLevel = 'safe_write' | 'destructive';

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
}

export interface AppendToRemArgs {
  remId: string;
  markdown: string;
  position?: 'start' | 'end';
}

export interface CreateDocumentArgs {
  parentId?: string | null;
  markdown: string;
}

export interface CreateFolderArgs {
  parentId?: string | null;
  markdown: string;
}

export interface UpdateRemArgs {
  remId: string;
  markdown: string;
}

export interface MoveRemArgs {
  remId: string;
  newParentId: string;
  index: number;
}

export interface ReorderChildrenArgs {
  parentRemId: string;
  orderedChildRemIds: string[];
}

export interface CreateRemTreeNode {
  title: string;
  children?: CreateRemTreeNode[];
}

export interface CreateRemTreeArgs {
  parentId: string;
  position?: 'start' | 'end';
  tree: CreateRemTreeNode;
}

export interface ReplaceRemArgs {
  remId: string;
  markdown: string;
}

export interface DeleteRemArgs {
  remId: string;
  recursive?: boolean;
  confirmText: string;
}

export interface DeleteFocusedRemArgs {
  recursive?: boolean;
  confirmText: string;
}

export interface DeleteSelectedRemArgs {
  recursive?: boolean;
  confirmText: string;
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
  | 'default';
export type RichTextNodeType = 'text' | 'inlineMath' | 'mathBlock';
export type RemTypeName = 'normal' | 'concept' | 'descriptor';
export type PracticeDirection = 'forward' | 'backward' | 'none' | 'both';

export interface TextRange {
  start: number;
  end: number;
}

export interface RichTextSpanStyle {
  color?: RemColorName;
  highlight?: RemColorName;
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
  color?: RemColorName;
  highlight?: RemColorName;
  hideBullet?: boolean;
  remType?: RemTypeName;
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
}

export interface SetRemHeadingLevelArgs {
  remId: string;
  level: RemHeadingLevel;
}

export interface SetRemTextColorArgs {
  remId: string;
  color: RemColorName;
}

export interface SetRemHighlightColorArgs {
  remId: string;
  color: RemColorName;
}

export interface SetTextSpanColorArgs {
  remId: string;
  range: TextRange;
  color: RemColorName;
}

export interface SetTextSpanHighlightArgs {
  remId: string;
  range: TextRange;
  color: RemColorName;
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
}

export interface CreateFlashcardArgs {
  parentId: string;
  front: string;
  back: string;
  direction?: PracticeDirection;
}

export interface CreateClozeCardArgs {
  parentId: string;
  text: string;
  clozeText?: string;
  direction?: PracticeDirection;
}

export interface CreateMultipleChoiceCardArgs {
  parentId: string;
  question: string;
  choices: string[];
  correctChoice: string;
  direction?: PracticeDirection;
}

export interface CreateListAnswerCardArgs {
  parentId: string;
  prompt: string;
  items: string[];
  direction?: PracticeDirection;
}

export interface CreateRemResult {
  createdRemId: string;
  parentId: string | null;
  insertIndex?: number;
  insertPosition?: 'end';
  status: 'created';
}

export interface CreateDocumentResult {
  createdRemId: string;
  parentId: string | null;
  insertIndex?: number;
  insertPosition?: 'end';
  document: true;
  status: 'created_document';
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
}

export interface UpdateRemResult {
  updatedRemId: string;
  status: 'updated';
}

export interface MoveRemResult {
  movedRemId: string;
  newParentId: string;
  index: number;
  status: 'moved';
}

export interface ReorderChildrenResult {
  parentRemId: string;
  parentId: string;
  orderedChildRemIds: string[];
  orderedChildIds: string[];
  status: 'reordered';
}

export interface CreateRemTreeResult {
  rootCreatedRemId: string;
  createdNodeCount: number;
  createdRemIds: string[];
  rootInsertIndex?: number;
  rootInsertPosition?: 'start' | 'end';
  status: 'created_tree';
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
    | 'formatting_cleared';
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
  status: 'created_styled_tree';
}

export interface CreateFlashcardResult {
  createdRemId: string;
  parentId: string;
  cardType: 'basic' | 'concept' | 'descriptor' | 'cloze' | 'multiple_choice' | 'list_answer';
  direction: PracticeDirection;
  createdChildRemIds?: string[];
  status: 'created_flashcard';
}

export interface ReplaceRemResult {
  remId: string;
}

export interface DeleteRemResult {
  deletedRemId: string;
  recursive: boolean;
  preview: DeletePreview;
  status: 'deleted';
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
  create_basic_flashcard: CreateFlashcardArgs;
  create_concept_card: CreateFlashcardArgs;
  create_descriptor_card: CreateFlashcardArgs;
  create_cloze_card: CreateClozeCardArgs;
  create_multiple_choice_card: CreateMultipleChoiceCardArgs;
  create_list_answer_card: CreateListAnswerCardArgs;
  replace_rem: ReplaceRemArgs;
  delete_focused_rem: DeleteFocusedRemArgs;
  delete_selected_rem: DeleteSelectedRemArgs;
  delete_rem: DeleteRemArgs;
}

export interface BridgeToolResults {
  ping: PingResult;
  get_status: BridgePluginStatus;
  get_focused_rem: SerializedRem;
  get_rem: SerializedRem;
  get_rem_tree: SerializedRem;
  get_rem_rich: GetRemRichResult;
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
  create_basic_flashcard: CreateFlashcardResult;
  create_concept_card: CreateFlashcardResult;
  create_descriptor_card: CreateFlashcardResult;
  create_cloze_card: CreateFlashcardResult;
  create_multiple_choice_card: CreateFlashcardResult;
  create_list_answer_card: CreateFlashcardResult;
  replace_rem: ReplaceRemResult;
  delete_focused_rem: DeleteRemResult;
  delete_selected_rem: DeleteRemResult;
  delete_rem: DeleteRemResult;
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
}

export interface BridgeFailure {
  id: string;
  ok: false;
  error: {
    code: BridgeErrorCode;
    message: string;
    details?: unknown;
  };
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
  token?: string;
}

export interface BridgeServerHello {
  type: 'server_hello';
  protocolVersion: 1;
  serverName: 'remnote-companion';
  toolRegistryVersion?: string;
  serverToolRegistryVersion?: string;
  mcpDiscoveryVersion?: string;
  pluginProtocolVersion?: number;
  registeredTools?: string[];
  publicTools?: string[];
  publicToolCount?: number;
  exposedTools?: string[];
  callableTools?: string[];
  hiddenTools?: Array<{ name: string; reason: string }>;
  serverStartedAt?: string;
}

export interface BridgeCancelRequest {
  type: 'cancel_request';
  id: string;
  reason: 'client_disconnected' | 'server_timeout' | 'server_shutdown';
  message: string;
}

export type BridgeClientMessage = BridgePluginHello | BridgeResponse;
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
  'create_basic_flashcard',
  'create_concept_card',
  'create_descriptor_card',
  'create_cloze_card',
  'create_multiple_choice_card',
  'create_list_answer_card',
  'replace_rem',
  'delete_focused_rem',
  'delete_selected_rem',
  'delete_rem',
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
  delete_focused_rem: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: true,
  },
  delete_selected_rem: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: true,
  },
  delete_rem: {
    readOnlyHint: false,
    openWorldHint: false,
    destructiveHint: true,
  },
};

export function isBridgeToolName(value: unknown): value is BridgeToolName {
  return typeof value === 'string' && (BRIDGE_TOOL_NAMES as readonly string[]).includes(value);
}

export function createBridgeSuccess<TTool extends BridgeToolName>(
  request: Pick<BridgeRequest<TTool>, 'id'>,
  result: BridgeToolResults[TTool]
): BridgeSuccess<BridgeToolResults[TTool]> {
  return {
    id: request.id,
    ok: true,
    result,
  };
}

export function createBridgeFailure(
  id: string,
  code: BridgeErrorCode,
  message: string,
  details?: unknown
): BridgeFailure {
  return {
    id,
    ok: false,
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    },
  };
}
