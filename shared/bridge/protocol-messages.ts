import type {
  ApprovalResolution,
  ApprovalRiskLevel,
  BridgeErrorCode,
  BridgeLifecycleEvent,
  BridgeToolName,
  PermissionMode,
  PermissionScope,
} from './protocol-core.js';
import type {
  AppendToRemArgs,
  AnalyzeNoteDesignArgs,
  ApplyRemnoteCommandArgs,
  ApplyStructuredNoteBatchArgs,
  ApplyStylePlanArgs,
  ClearRemFormattingArgs,
  CreateCardSetFromNoteArgs,
  CreateClozeCardsFromNoteArgs,
  CreateDesignedNoteTreeArgs,
  CreateClozeCardArgs,
  CreateDocumentArgs,
  CreateFlashcardsFromMarkdownArgs,
  CreateFlashcardArgs,
  CreateFolderArgs,
  ExportNoteDesignTemplateArgs,
  CreateListAnswerCardArgs,
  CreateNoteFromMarkdownTreeArgs,
  CreateMultipleChoiceCardArgs,
  CreateOrReplaceNoteFromMarkdownArgs,
  CreatePolishedNoteTreeArgs,
  CreateRemArgs,
  CreateRemTreeArgs,
  CreateStyledRemTreeArgs,
  DeleteRemByIdArgs,
  AppendMarkdownAsRemTreeArgs,
  ImportNoteDesignTemplateArgs,
  InsertImageFromUrlArgs,
  InsertMediaFromUrlArgs,
  ListNoteDesignTemplatesArgs,
  MoveRemArgs,
  PreviewNoteDesignPlanArgs,
  PreviewMarkdownNoteTreeArgs,
  RepairCardSetArgs,
  RepairNoteDesignArgs,
  ReplaceRemArgs,
  ReorderChildrenArgs,
  SaveNoteDesignTemplateArgs,
  SetHideBulletArgs,
  SetRemHeadingLevelArgs,
  SetRemHighlightColorArgs,
  SetRemTextColorArgs,
  SetRemTypeArgs,
  SetTextSpanColorArgs,
  SetTextSpanHighlightArgs,
  UpdateRemArgs,
  UpdateRemRichArgs,
  UpdateNoteWithDesignArgs,
  VerifyCardSetArgs,
  VerifyNoteDesignArgs,
  VerifyNoteAgainstDesignArgs,
} from './protocol-write-args.js';
import type {
  DebugGetRawRichTextArgs,
  DebugGetRawRichTextResult,
  GetChildrenArgs,
  GetChildrenResult,
  GetCurrentSelectionArgs,
  GetCurrentSelectionResult,
  GetDocumentOrFolderTreeArgs,
  GetDocumentOrFolderTreeResult,
  GetFocusedRemArgs,
  GetRemArgs,
  GetRemBreadcrumbsArgs,
  GetRemBreadcrumbsResult,
  GetRemRichArgs,
  GetRemRichResult,
  GetRemTreeArgs,
  PingArgs,
  PingResult,
  SearchRemsArgs,
  SearchRemsResult,
  BridgePluginStatus,
  BridgePluginRuntimeInfo,
  GetStatusArgs,
  SerializedRem,
} from './protocol-read.js';
import type {
  AppendToRemResult,
  AnalyzeNoteDesignResult,
  ApplyRemnoteCommandResult,
  ApplyStructuredNoteBatchResult,
  ApplyStylePlanResult,
  CreateCardSetFromNoteResult,
  CreateClozeCardsFromNoteResult,
  CreateDesignedNoteTreeResult,
  CreateDocumentResult,
  CreateFlashcardsFromMarkdownResult,
  CreateFlashcardResult,
  CreateFolderResult,
  ExportNoteDesignTemplateResult,
  CreateNoteFromMarkdownTreeResult,
  CreateOrReplaceNoteFromMarkdownResult,
  CreatePolishedNoteTreeResult,
  CreateRemResult,
  CreateRemTreeResult,
  CreateStyledRemTreeResult,
  DeletePreview,
  DeleteRemByIdResult,
  FormatRemResult,
  AppendMarkdownAsRemTreeResult,
  ImportNoteDesignTemplateResult,
  InsertMediaFromUrlResult,
  ListNoteDesignTemplatesResult,
  MoveRemResult,
  PreviewNoteDesignPlanResult,
  PreviewMarkdownNoteTreeResult,
  RepairCardSetResult,
  RepairNoteDesignResult,
  ReplaceRemResult,
  ReorderChildrenResult,
  SaveNoteDesignTemplateResult,
  UpdateRemResult,
  UpdateNoteWithDesignResult,
  VerifyCardSetResult,
  VerifyNoteAgainstDesignResult,
  VerifyNoteDesignResult,
} from './protocol-write-results.js';

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
  insert_image_from_url: InsertImageFromUrlArgs;
  insert_audio_from_url: InsertMediaFromUrlArgs;
  insert_video_from_url: InsertMediaFromUrlArgs;
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
  preview_markdown_note_tree: PreviewMarkdownNoteTreeArgs;
  create_note_from_markdown_tree: CreateNoteFromMarkdownTreeArgs;
  append_markdown_as_rem_tree: AppendMarkdownAsRemTreeArgs;
  apply_style_plan: ApplyStylePlanArgs;
  verify_note_design: VerifyNoteDesignArgs;
  analyze_note_design: AnalyzeNoteDesignArgs;
  save_note_design_template: SaveNoteDesignTemplateArgs;
  list_note_design_templates: ListNoteDesignTemplatesArgs;
  preview_note_design_plan: PreviewNoteDesignPlanArgs;
  export_note_design_template: ExportNoteDesignTemplateArgs;
  import_note_design_template: ImportNoteDesignTemplateArgs;
  create_designed_note_tree: CreateDesignedNoteTreeArgs;
  update_note_with_design: UpdateNoteWithDesignArgs;
  verify_note_against_design: VerifyNoteAgainstDesignArgs;
  repair_note_design: RepairNoteDesignArgs;
  create_card_set_from_note: CreateCardSetFromNoteArgs;
  create_flashcards_from_markdown: CreateFlashcardsFromMarkdownArgs;
  create_cloze_cards_from_note: CreateClozeCardsFromNoteArgs;
  verify_card_set: VerifyCardSetArgs;
  repair_card_set: RepairCardSetArgs;
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
  insert_image_from_url: InsertMediaFromUrlResult;
  insert_audio_from_url: InsertMediaFromUrlResult;
  insert_video_from_url: InsertMediaFromUrlResult;
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
  preview_markdown_note_tree: PreviewMarkdownNoteTreeResult;
  create_note_from_markdown_tree: CreateNoteFromMarkdownTreeResult;
  append_markdown_as_rem_tree: AppendMarkdownAsRemTreeResult;
  apply_style_plan: ApplyStylePlanResult;
  verify_note_design: VerifyNoteDesignResult;
  analyze_note_design: AnalyzeNoteDesignResult;
  save_note_design_template: SaveNoteDesignTemplateResult;
  list_note_design_templates: ListNoteDesignTemplatesResult;
  preview_note_design_plan: PreviewNoteDesignPlanResult;
  export_note_design_template: ExportNoteDesignTemplateResult;
  import_note_design_template: ImportNoteDesignTemplateResult;
  create_designed_note_tree: CreateDesignedNoteTreeResult;
  update_note_with_design: UpdateNoteWithDesignResult;
  verify_note_against_design: VerifyNoteAgainstDesignResult;
  repair_note_design: RepairNoteDesignResult;
  create_card_set_from_note: CreateCardSetFromNoteResult;
  create_flashcards_from_markdown: CreateFlashcardsFromMarkdownResult;
  create_cloze_cards_from_note: CreateClozeCardsFromNoteResult;
  verify_card_set: VerifyCardSetResult;
  repair_card_set: RepairCardSetResult;
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
  pluginRuntime?: BridgePluginRuntimeInfo;
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
  pluginRuntime?: BridgePluginRuntimeInfo;
  accessScope?: 'focused-rem-only' | 'current-rem-tree' | 'full-kb';
  trustedWriteMode?: 'ask-every-write' | 'trusted-inside-scope';
  toolTier?: BridgeToolProfile;
}

export type BridgeToolProfile = 'basic' | 'mass_note_writer' | 'note_writer' | 'power_user' | 'developer' | 'danger';
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
  callabilitySource?: 'runtime_matrix_not_live_execution' | 'live_execution';
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
  pluginRuntime?: BridgePluginRuntimeInfo | null;
  sdkVersion?: string;
  supportedSdkCapabilities?: BridgePluginRuntimeInfo['supportedSdkCapabilities'];
  unsupportedSdkCapabilities?: BridgePluginRuntimeInfo['unsupportedSdkCapabilities'];
  initialSyncComplete?: boolean;
  initialSyncTimedOut?: boolean;
  initialSyncWarning?: string;
}

export interface BridgeCancelRequest {
  type: 'cancel_request';
  id: string;
  reason: 'client_disconnected' | 'server_timeout' | 'server_shutdown';
  message: string;
}

export type BridgeClientMessage = BridgePluginHello | BridgePluginRegister | BridgeResponse;
export type BridgeServerMessage = BridgeServerHello | BridgeRequest | BridgeCancelRequest;
