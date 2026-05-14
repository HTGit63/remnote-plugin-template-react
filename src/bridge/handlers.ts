import type { RNPlugin } from '@remnote/plugin-sdk';
import {
  type ApplyStructuredNoteBatchArgs,
  type ApprovalResolution,
  type AppendToRemArgs,
  type BridgeLifecycleEvent,
  type BridgeLifecyclePhase,
  type BridgeRequest,
  type BridgeResponse,
  type BridgeToolArgs,
  type BridgeToolName,
  type ClearRemFormattingArgs,
  type CreateDocumentArgs,
  type CreateFlashcardArgs,
  type CreateFolderArgs,
  type CreateListAnswerCardArgs,
  type CreateMultipleChoiceCardArgs,
  type GetChildrenArgs,
  type CreateRemTreeArgs,
  type CreateRemArgs,
  type CreateClozeCardArgs,
  type CreateStyledRemTreeArgs,
  type DeleteFocusedRemArgs,
  type DeleteRemArgs,
  type DeleteSelectedRemArgs,
  type GetDocumentOrFolderTreeArgs,
  type GetCurrentSelectionArgs,
  type GetRemArgs,
  type GetRemBreadcrumbsArgs,
  type GetRemRichArgs,
  type GetRemTreeArgs,
  type MoveRemArgs,
  type PendingApprovalRequest,
  type PermissionMode,
  type PermissionScope,
  type ReplaceRemArgs,
  type ReorderChildrenArgs,
  type RichTextSpanInput,
  type SearchRemsArgs,
  type SetHideBulletArgs,
  type SetRemHeadingLevelArgs,
  type SetRemHighlightColorArgs,
  type SetRemTextColorArgs,
  type SetRemTypeArgs,
  type SetTextSpanColorArgs,
  type SetTextSpanHighlightArgs,
  type StyledRemTreeNode,
  type UpdateRemArgs,
  type UpdateRemRichArgs,
  WRITE_APPROVAL_TIMEOUT_MS,
  createBridgeFailure,
  createBridgeSuccess,
  isBridgeToolName,
} from './protocol';
import { getPermissionDecision } from '../remnote/permissions';
import {
  getCurrentSelection,
  readChildren,
  readDocumentOrFolderTree,
  getFocusedRemStatus,
  readRemBreadcrumbs,
  readFocusedRem,
  readRem,
  readRemRich,
  readRemTree,
  searchRems,
} from '../remnote/read';
import {
  applyStructuredNoteBatch,
  appendMarkdownToRem,
  buildDeletePreview,
  clearRemFormatting,
  createBasicFlashcard,
  createClozeCard,
  createDocumentFromMarkdown,
  createFolderFromMarkdown,
  createListAnswerCard,
  createMultipleChoiceCard,
  createRemFromMarkdown,
  createRemTree,
  createStyledRemTree,
  deleteFocusedRem,
  deleteRem,
  deleteSelectedRem,
  getRemApprovalContext,
  moveRem,
  replaceRemMarkdown,
  reorderChildren,
  RemnoteWriteError,
  setHideBullet,
  setRemHeadingLevel,
  setRemHighlightColor,
  setRemTextColor,
  setRemType,
  setTextSpanColor,
  setTextSpanHighlight,
  updateRemRich,
  updateRemMarkdown,
} from '../remnote/write';

const MAX_REQUEST_ID_CHARS = 128;
const MAX_REM_ID_CHARS = 256;
const MAX_MARKDOWN_CHARS = 20000;
const MAX_SEARCH_QUERY_CHARS = 500;

export interface BridgeHandlerContext {
  permissionMode: PermissionMode;
  permissionScope: PermissionScope;
  approvedRootRemId: string | null;
  requestApproval: (request: PendingApprovalRequest) => Promise<ApprovalResolution>;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getStringField(args: unknown, field: string): string | undefined {
  if (!isPlainObject(args)) {
    return undefined;
  }

  const value = args[field];
  return typeof value === 'string' ? value : undefined;
}

function requiredRemId(args: unknown, field = 'remId'): string {
  const remId = getStringField(args, field)?.trim();

  if (!remId) {
    throw new Error(`Missing ${field}.`);
  }

  if (remId.length > MAX_REM_ID_CHARS) {
    throw new Error(`${field} is too long.`);
  }

  return remId;
}

function requiredRemIdFromFields(args: unknown, fields: string[]): string {
  for (const field of fields) {
    const remId = getStringField(args, field)?.trim();
    if (remId) {
      if (remId.length > MAX_REM_ID_CHARS) {
        throw new Error(`${field} is too long.`);
      }

      return remId;
    }
  }

  throw new Error(`Missing ${fields.join(' or ')}.`);
}

function requiredMarkdown(args: unknown): string {
  const markdown = getStringField(args, 'markdown')?.trim();

  if (!markdown) {
    throw new Error('Missing markdown.');
  }

  if (markdown.length > MAX_MARKDOWN_CHARS) {
    throw new Error(`Markdown exceeds ${MAX_MARKDOWN_CHARS} characters.`);
  }

  return markdown;
}

function requiredTextField(args: unknown, field: string): string {
  const value = getStringField(args, field)?.trim();

  if (!value) {
    throw new Error(`Missing ${field}.`);
  }

  if (value.length > MAX_MARKDOWN_CHARS) {
    throw new Error(`${field} exceeds ${MAX_MARKDOWN_CHARS} characters.`);
  }

  return value;
}

function optionalParentId(args: unknown): string | null {
  if (!isPlainObject(args)) {
    return null;
  }

  const value = args.parentId;
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new Error('parentId must be a string or null.');
  }

  const parentId = value.trim();
  if (parentId.length > MAX_REM_ID_CHARS) {
    throw new Error('parentId is too long.');
  }

  return parentId || null;
}

function requiredParentId(args: unknown, field = 'parentId'): string {
  return requiredRemId(args, field);
}

function optionalRemId(args: unknown, field: string): string | null {
  if (!isPlainObject(args)) {
    return null;
  }

  const value = args[field];
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw new Error(`${field} must be a string or null.`);
  }

  const remId = value.trim();
  if (remId.length > MAX_REM_ID_CHARS) {
    throw new Error(`${field} is too long.`);
  }

  return remId || null;
}

function getTreeDepth(args: unknown): number | undefined {
  if (!isPlainObject(args)) {
    return undefined;
  }

  const value = args.depth;
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error('depth must be a finite number.');
  }

  return value;
}

function optionalBoundedNumber(args: unknown, field: string): number | undefined {
  if (!isPlainObject(args)) {
    return undefined;
  }

  const value = args[field];
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${field} must be a finite number.`);
  }

  return value;
}

function requiredSearchQuery(args: unknown): string {
  const query = getStringField(args, 'query')?.trim();

  if (!query) {
    throw new Error('Missing query.');
  }

  if (query.length > MAX_SEARCH_QUERY_CHARS) {
    throw new Error(`query exceeds ${MAX_SEARCH_QUERY_CHARS} characters.`);
  }

  return query;
}

function optionalAppendPosition(args: unknown): 'start' | 'end' {
  if (!isPlainObject(args)) {
    return 'end';
  }

  const value = args.position;
  if (value === undefined || value === null || value === '') {
    return 'end';
  }

  if (value !== 'start' && value !== 'end') {
    throw new Error('position must be "start" or "end".');
  }

  return value;
}

function requiredIndex(args: unknown): number {
  if (!isPlainObject(args)) {
    throw new Error('Missing index.');
  }

  const value = args.index;
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error('index must be a non-negative integer.');
  }

  return value;
}

function requiredOrderedChildRemIds(args: unknown): string[] {
  if (!isPlainObject(args)) {
    throw new Error('Missing orderedChildRemIds.');
  }

  const rawIds = Array.isArray(args.orderedChildRemIds)
    ? args.orderedChildRemIds
    : Array.isArray(args.orderedChildIds)
      ? args.orderedChildIds
      : undefined;

  if (!rawIds) {
    throw new Error('Missing orderedChildRemIds or orderedChildIds.');
  }

  if (rawIds.length > 500) {
    throw new Error('orderedChildRemIds exceeds 500 IDs.');
  }

  return rawIds.map((item, index) => {
    if (typeof item !== 'string') {
      throw new Error(`orderedChildRemIds[${index}] must be a string.`);
    }

    const remId = item.trim();
    if (!remId || remId.length > MAX_REM_ID_CHARS) {
      throw new Error(`orderedChildRemIds[${index}] is invalid.`);
    }

    return remId;
  });
}

function optionalRecursive(args: unknown): boolean {
  if (!isPlainObject(args)) {
    return false;
  }

  const value = args.recursive;
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value !== 'boolean') {
    throw new Error('recursive must be a boolean.');
  }

  return value;
}

function requiredConfirmText(args: unknown): string {
  return requiredTextField(args, 'confirmText');
}

function requiredTree(args: unknown): CreateRemTreeArgs['tree'] {
  if (!isPlainObject(args) || !isPlainObject(args.tree)) {
    throw new Error('Missing tree.');
  }

  return args.tree as unknown as CreateRemTreeArgs['tree'];
}

function requiredStyledTree(args: unknown): StyledRemTreeNode {
  if (!isPlainObject(args) || !isPlainObject(args.tree)) {
    throw new Error('Missing tree.');
  }

  return args.tree as StyledRemTreeNode;
}

function requiredStructuredBatchRoot(args: unknown): StyledRemTreeNode {
  if (!isPlainObject(args) || !isPlainObject(args.root)) {
    throw new Error('Missing root.');
  }

  return args.root as StyledRemTreeNode;
}

function optionalBoolean(args: unknown, field: string, fallback = false): boolean {
  if (!isPlainObject(args)) {
    return fallback;
  }

  const value = args[field];
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value !== 'boolean') {
    throw new Error(`${field} must be a boolean.`);
  }

  return value;
}

function optionalIdempotencyKey(args: unknown): string | undefined {
  const key = getStringField(args, 'idempotencyKey')?.trim();
  if (!key) {
    return undefined;
  }

  if (key.length > MAX_REQUEST_ID_CHARS) {
    throw new Error('idempotencyKey is too long.');
  }

  return key;
}

function requiredRichText(args: unknown): RichTextSpanInput[] {
  if (!isPlainObject(args) || !Array.isArray(args.richText)) {
    throw new Error('Missing richText.');
  }

  if (args.richText.length > 200) {
    throw new Error('richText exceeds 200 spans.');
  }

  return args.richText as RichTextSpanInput[];
}

function requiredColor(args: unknown, field = 'color') {
  const value = getStringField(args, field);
  switch (value) {
    case 'red':
    case 'orange':
    case 'yellow':
    case 'green':
    case 'blue':
    case 'purple':
    case 'pink':
    case 'gray':
    case 'default':
      return value;
    default:
      throw new Error(`${field} must be a supported RemNote color.`);
  }
}

function requiredHeadingLevel(args: unknown) {
  const value = getStringField(args, 'level');
  switch (value) {
    case 'H1':
    case 'H2':
    case 'H3':
    case 'normal':
      return value;
    default:
      throw new Error('level must be H1, H2, H3, or normal.');
  }
}

function requiredRemType(args: unknown) {
  const value = getStringField(args, 'type');
  switch (value) {
    case 'normal':
    case 'concept':
    case 'descriptor':
      return value;
    default:
      throw new Error('type must be normal, concept, or descriptor.');
  }
}

function optionalPracticeDirection(args: unknown) {
  const value = getStringField(args, 'direction');
  switch (value) {
    case undefined:
    case '':
      return undefined;
    case 'forward':
    case 'backward':
    case 'none':
    case 'both':
      return value;
    default:
      throw new Error('direction must be forward, backward, none, or both.');
  }
}

function requiredBoolean(args: unknown, field: string): boolean {
  if (!isPlainObject(args) || typeof args[field] !== 'boolean') {
    throw new Error(`${field} must be a boolean.`);
  }

  return args[field] as boolean;
}

function requiredRange(args: unknown): { start: number; end: number } {
  if (!isPlainObject(args) || !isPlainObject(args.range)) {
    throw new Error('Missing range.');
  }

  const { start, end } = args.range as Record<string, unknown>;
  if (!Number.isInteger(start) || !Number.isInteger(end)) {
    throw new Error('range.start and range.end must be integers.');
  }

  return { start: start as number, end: end as number };
}

function requiredStringArray(args: unknown, field: string, maxItems = 50): string[] {
  if (!isPlainObject(args) || !Array.isArray(args[field])) {
    throw new Error(`Missing ${field}.`);
  }

  const items = args[field] as unknown[];
  if (!items.length || items.length > maxItems) {
    throw new Error(`${field} must contain 1-${maxItems} items.`);
  }

  return items.map((item, index) => {
    if (typeof item !== 'string' || !item.trim()) {
      throw new Error(`${field}[${index}] must be a non-empty string.`);
    }

    return item.trim();
  });
}

function optionalScope(args: unknown): SearchRemsArgs['scope'] {
  if (!isPlainObject(args)) {
    return undefined;
  }

  const value = args.scope;
  switch (value) {
    case 'current_permission_scope':
    case 'focused_rem_only':
    case 'focused_rem_and_descendants':
    case 'selected_rem_only':
    case 'selected_rem_and_descendants':
    case 'approved_document_or_folder':
    case 'workspace_allowed':
      return value;
    default:
      return undefined;
  }
}

function normalizeArgs<TTool extends BridgeToolName>(
  tool: TTool,
  args: unknown
): BridgeToolArgs[TTool] {
  switch (tool) {
    case 'ping':
      return {
        message: getStringField(args, 'message')?.slice(0, 200),
      } as BridgeToolArgs[TTool];
    case 'get_status':
    case 'get_focused_rem':
      return {} as BridgeToolArgs[TTool];
    case 'get_rem':
      return {
        remId: requiredRemId(args),
      } as BridgeToolArgs[TTool];
    case 'get_rem_tree':
      return {
        remId: requiredRemId(args),
        depth: getTreeDepth(args),
      } as BridgeToolArgs[TTool];
    case 'get_rem_rich':
      return {
        remId: requiredRemId(args),
      } as BridgeToolArgs[TTool];
    case 'get_current_selection':
      return {} as BridgeToolArgs[TTool];
    case 'get_children':
      return {
        parentRemId: requiredRemIdFromFields(args, ['parentRemId', 'remId']),
        maxChildren: optionalBoundedNumber(args, 'maxChildren') ?? optionalBoundedNumber(args, 'limit'),
      } as BridgeToolArgs[TTool];
    case 'get_rem_breadcrumbs':
      return {
        remId: requiredRemId(args),
      } as BridgeToolArgs[TTool];
    case 'search_rems':
      return {
        query: requiredSearchQuery(args),
        contextRemId: optionalRemId(args, 'contextRemId'),
        maxResults: optionalBoundedNumber(args, 'maxResults') ?? optionalBoundedNumber(args, 'limit'),
        scope: optionalScope(args),
      } as BridgeToolArgs[TTool];
    case 'get_document_or_folder_tree':
      return {
        rootRemId: optionalRemId(args, 'rootRemId'),
        depth: getTreeDepth(args),
        maxChildren: optionalBoundedNumber(args, 'maxChildren'),
      } as BridgeToolArgs[TTool];
    case 'create_rem':
      return {
        parentId: optionalParentId(args),
        markdown: requiredMarkdown(args),
      } as BridgeToolArgs[TTool];
    case 'append_to_rem':
      return {
        remId: requiredRemId(args),
        markdown: requiredMarkdown(args),
        position: optionalAppendPosition(args),
      } as BridgeToolArgs[TTool];
    case 'create_document':
    case 'create_folder':
      return {
        parentId: optionalParentId(args),
        markdown: requiredMarkdown(args),
      } as BridgeToolArgs[TTool];
    case 'update_rem':
      return {
        remId: requiredRemId(args),
        markdown: requiredMarkdown(args),
      } as BridgeToolArgs[TTool];
    case 'move_rem':
      return {
        remId: requiredRemId(args),
        newParentId: requiredRemId(args, 'newParentId'),
        index: requiredIndex(args),
      } as BridgeToolArgs[TTool];
    case 'reorder_children':
      return {
        parentRemId: requiredRemIdFromFields(args, ['parentRemId', 'parentId']),
        orderedChildRemIds: requiredOrderedChildRemIds(args),
      } as BridgeToolArgs[TTool];
    case 'create_rem_tree':
      return {
        parentId: requiredParentId(args),
        position: optionalAppendPosition(args),
        tree: requiredTree(args),
      } as BridgeToolArgs[TTool];
    case 'update_rem_rich':
      return {
        remId: requiredRemId(args),
        richText: requiredRichText(args),
      } as BridgeToolArgs[TTool];
    case 'set_rem_heading_level':
      return {
        remId: requiredRemId(args),
        level: requiredHeadingLevel(args),
      } as BridgeToolArgs[TTool];
    case 'set_rem_text_color':
      return {
        remId: requiredRemId(args),
        color: requiredColor(args),
      } as BridgeToolArgs[TTool];
    case 'set_rem_highlight_color':
      return {
        remId: requiredRemId(args),
        color: requiredColor(args),
      } as BridgeToolArgs[TTool];
    case 'set_text_span_color':
      return {
        remId: requiredRemId(args),
        range: requiredRange(args),
        color: requiredColor(args),
      } as BridgeToolArgs[TTool];
    case 'set_text_span_highlight':
      return {
        remId: requiredRemId(args),
        range: requiredRange(args),
        color: requiredColor(args),
      } as BridgeToolArgs[TTool];
    case 'set_rem_type':
      return {
        remId: requiredRemId(args),
        type: requiredRemType(args),
      } as BridgeToolArgs[TTool];
    case 'set_hide_bullet':
      return {
        remId: requiredRemId(args),
        hideBullet: requiredBoolean(args, 'hideBullet'),
      } as BridgeToolArgs[TTool];
    case 'clear_rem_formatting':
      return {
        remId: requiredRemId(args),
      } as BridgeToolArgs[TTool];
    case 'create_styled_rem_tree':
      return {
        parentId: requiredParentId(args),
        position: optionalAppendPosition(args),
        tree: requiredStyledTree(args),
      } as BridgeToolArgs[TTool];
    case 'apply_structured_note_batch':
      return {
        parentId: requiredParentId(args),
        position: optionalAppendPosition(args),
        root: requiredStructuredBatchRoot(args),
        dryRun: optionalBoolean(args, 'dryRun'),
        idempotencyKey: optionalIdempotencyKey(args),
        rollbackOnFailure: optionalBoolean(args, 'rollbackOnFailure', true),
        verifyAfterWrite: optionalBoolean(args, 'verifyAfterWrite'),
      } as BridgeToolArgs[TTool];
    case 'create_basic_flashcard':
    case 'create_concept_card':
    case 'create_descriptor_card':
      return {
        parentId: requiredParentId(args),
        front: requiredTextField(args, 'front'),
        back: requiredTextField(args, 'back'),
        direction: optionalPracticeDirection(args),
      } as BridgeToolArgs[TTool];
    case 'create_cloze_card':
      return {
        parentId: requiredParentId(args),
        text: requiredTextField(args, 'text'),
        clozeText: getStringField(args, 'clozeText')?.trim() || undefined,
        direction: optionalPracticeDirection(args),
      } as BridgeToolArgs[TTool];
    case 'create_multiple_choice_card':
      return {
        parentId: requiredParentId(args),
        question: requiredTextField(args, 'question'),
        choices: requiredStringArray(args, 'choices', 20),
        correctChoice: requiredTextField(args, 'correctChoice'),
        direction: optionalPracticeDirection(args),
      } as BridgeToolArgs[TTool];
    case 'create_list_answer_card':
      return {
        parentId: requiredParentId(args),
        prompt: requiredTextField(args, 'prompt'),
        items: requiredStringArray(args, 'items', 50),
        direction: optionalPracticeDirection(args),
      } as BridgeToolArgs[TTool];
    case 'replace_rem':
      return {
        remId: requiredRemId(args),
        markdown: requiredMarkdown(args),
      } as BridgeToolArgs[TTool];
    case 'delete_focused_rem':
    case 'delete_selected_rem':
      return {
        recursive: optionalRecursive(args),
        confirmText: requiredConfirmText(args),
      } as BridgeToolArgs[TTool];
    case 'delete_rem':
      return {
        remId: requiredRemId(args),
        recursive: optionalRecursive(args),
        confirmText: requiredConfirmText(args),
      } as BridgeToolArgs[TTool];
    default:
      throw new Error('Unknown tool.');
  }
}

export function parseBridgeRequest(raw: unknown): BridgeRequest | BridgeResponse {
  if (!isPlainObject(raw)) {
    return createBridgeFailure('unknown', 'INVALID_ARGS', 'Bridge message must be an object.');
  }

  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  if (!id || id.length > MAX_REQUEST_ID_CHARS) {
    return createBridgeFailure('unknown', 'INVALID_ARGS', 'Bridge request id is missing or invalid.');
  }

  if (!isBridgeToolName(raw.tool)) {
    return createBridgeFailure(id, 'UNKNOWN_TOOL', 'Unknown bridge tool.');
  }

  try {
    return {
      id,
      tool: raw.tool,
      args: normalizeArgs(raw.tool, raw.args),
      timeoutMs: typeof raw.timeoutMs === 'number' ? raw.timeoutMs : undefined,
    } as BridgeRequest;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return createBridgeFailure(id, 'INVALID_ARGS', message);
  }
}

function getRequestTargetRemId(request: BridgeRequest): string | undefined {
  const args = request.args as Partial<
    GetRemArgs &
      GetRemRichArgs &
      AppendToRemArgs &
      UpdateRemArgs &
      MoveRemArgs &
      ReplaceRemArgs &
      DeleteRemArgs &
      CreateDocumentArgs &
      CreateFolderArgs &
      CreateRemArgs &
      CreateRemTreeArgs &
      CreateStyledRemTreeArgs &
      ApplyStructuredNoteBatchArgs &
      UpdateRemRichArgs &
      SetRemHeadingLevelArgs &
      SetRemTextColorArgs &
      SetRemHighlightColorArgs &
      SetTextSpanColorArgs &
      SetTextSpanHighlightArgs &
      SetRemTypeArgs &
      SetHideBulletArgs &
      ClearRemFormattingArgs &
      CreateFlashcardArgs &
      CreateClozeCardArgs &
      CreateMultipleChoiceCardArgs &
      CreateListAnswerCardArgs &
      GetChildrenArgs &
      GetDocumentOrFolderTreeArgs &
      ReorderChildrenArgs
  >;
  if (typeof args.remId === 'string') {
    return args.remId;
  }
  if (typeof args.parentRemId === 'string') {
    return args.parentRemId;
  }
  if (typeof args.rootRemId === 'string') {
    return args.rootRemId;
  }
  return typeof args.parentId === 'string' ? args.parentId : undefined;
}

function getRequestPreviewMarkdown(request: BridgeRequest): string | undefined {
  const args = request.args as Partial<
    CreateRemArgs &
      CreateDocumentArgs &
      CreateFolderArgs &
      AppendToRemArgs &
      UpdateRemArgs &
      ReplaceRemArgs &
      UpdateRemRichArgs &
      CreateStyledRemTreeArgs &
      ApplyStructuredNoteBatchArgs &
      CreateFlashcardArgs &
      CreateClozeCardArgs &
      CreateMultipleChoiceCardArgs &
      CreateListAnswerCardArgs
  >;
  if (typeof args.markdown === 'string') {
    return args.markdown.slice(0, 3000);
  }
  if (typeof args.front === 'string' || typeof args.back === 'string') {
    return `Front: ${args.front ?? ''}\nBack: ${args.back ?? ''}`.slice(0, 3000);
  }
  if (typeof args.text === 'string') {
    return args.text.slice(0, 3000);
  }
  if (typeof args.question === 'string') {
    return `Question: ${args.question}\nChoices: ${(args.choices ?? []).join(', ')}`.slice(0, 3000);
  }
  if (typeof args.prompt === 'string') {
    return `Prompt: ${args.prompt}\nItems: ${(args.items ?? []).join(', ')}`.slice(0, 3000);
  }
  if (args.richText || args.tree) {
    return JSON.stringify(args.richText ?? args.tree, null, 2).slice(0, 3000);
  }
  if (args.root) {
    return JSON.stringify(args.root, null, 2).slice(0, 3000);
  }
  return undefined;
}

function mapSdkError(id: string, error: unknown): BridgeResponse {
  if (error instanceof RemnoteWriteError) {
    return createBridgeFailure(id, error.code, error.message, error.details);
  }

  const message = error instanceof Error ? error.message : String(error);

  if (/not found/i.test(message)) {
    return createBridgeFailure(id, 'REM_NOT_FOUND', message);
  }

  if (/missing|empty|too long|exceeds/i.test(message)) {
    return createBridgeFailure(id, 'INVALID_ARGS', message);
  }

  return createBridgeFailure(id, 'SDK_ERROR', 'RemNote SDK operation failed.');
}

function recordLifecycle(
  lifecycle: BridgeLifecycleEvent[],
  phase: BridgeLifecyclePhase,
  message?: string
) {
  lifecycle.push({
    phase,
    at: new Date().toISOString(),
    ...(message ? { message } : {}),
  });
}

function hasLifecyclePhase(
  lifecycle: BridgeLifecycleEvent[],
  phases: readonly BridgeLifecyclePhase[]
): boolean {
  return lifecycle.some((event) => phases.includes(event.phase));
}

function getRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function hasPartialExecution(response: BridgeResponse): boolean {
  if (response.ok) {
    return false;
  }

  const details = getRecord(response.error.details);
  if (!details) {
    return false;
  }

  const partialExecution = getRecord(details.partialExecution);
  const createdRemIds = Array.isArray(details.createdRemIds) ? details.createdRemIds : undefined;
  return Boolean(partialExecution || createdRemIds?.length);
}

function attachLifecycle<TResponse extends BridgeResponse>(
  response: TResponse,
  lifecycle: BridgeLifecycleEvent[]
): TResponse {
  return {
    ...response,
    lifecycle: [...lifecycle],
  };
}

function uniqueRemIds(ids: Array<string | null | undefined>): string[] {
  return Array.from(new Set(ids.filter((id): id is string => typeof id === 'string' && id.length > 0)));
}

function requestHasWorkspaceCreateTarget(request: BridgeRequest): boolean {
  if (request.tool !== 'create_rem' && request.tool !== 'create_document' && request.tool !== 'create_folder') {
    return false;
  }

  return !(request.args as CreateRemArgs | CreateDocumentArgs | CreateFolderArgs).parentId;
}

function requestNeedsImplicitScopedRoot(request: BridgeRequest): boolean {
  if (request.tool === 'search_rems') {
    return !(request.args as SearchRemsArgs).contextRemId;
  }

  if (request.tool === 'get_document_or_folder_tree') {
    return !(request.args as GetDocumentOrFolderTreeArgs).rootRemId;
  }

  return false;
}

async function getFocusedRemId(plugin: RNPlugin): Promise<string | null> {
  const focusedRem = await plugin.focus.getFocusedRem();
  return focusedRem?._id ?? null;
}

async function getSelectedRemIds(plugin: RNPlugin): Promise<string[]> {
  const selection = await getCurrentSelection(plugin, {});
  return selection.selectedRemIds;
}

async function getSingleSelectedRemId(plugin: RNPlugin): Promise<string> {
  const selectedRemIds = await getSelectedRemIds(plugin);
  if (selectedRemIds.length !== 1) {
    throw new RemnoteWriteError(
      'INVALID_ARGS',
      'delete_selected_rem requires exactly one selected Rem.',
      {
        selectedRemCount: selectedRemIds.length,
      }
    );
  }

  return selectedRemIds[0];
}

async function resolveDeleteTargetRemId(plugin: RNPlugin, request: BridgeRequest): Promise<string | undefined> {
  if (request.tool === 'delete_focused_rem') {
    const focusedRemId = await getFocusedRemId(plugin);
    if (!focusedRemId) {
      throw new RemnoteWriteError('NO_FOCUSED_REM', 'No Rem is currently focused in RemNote.');
    }

    return focusedRemId;
  }

  if (request.tool === 'delete_selected_rem') {
    return getSingleSelectedRemId(plugin);
  }

  return undefined;
}

function getStaticScopeTargetIds(request: BridgeRequest): string[] {
  switch (request.tool) {
    case 'get_rem':
    case 'get_rem_tree':
    case 'get_rem_rich':
    case 'get_rem_breadcrumbs':
    case 'append_to_rem':
    case 'update_rem':
    case 'update_rem_rich':
    case 'set_rem_heading_level':
    case 'set_rem_text_color':
    case 'set_rem_highlight_color':
    case 'set_text_span_color':
    case 'set_text_span_highlight':
    case 'set_rem_type':
    case 'set_hide_bullet':
    case 'clear_rem_formatting':
    case 'replace_rem':
    case 'delete_rem':
      return uniqueRemIds([(request.args as GetRemArgs | AppendToRemArgs | DeleteRemArgs).remId]);
    case 'get_children':
    case 'reorder_children':
      return uniqueRemIds([
        (request.args as GetChildrenArgs | ReorderChildrenArgs).parentRemId,
        ...(request.tool === 'reorder_children' ? (request.args as ReorderChildrenArgs).orderedChildRemIds : []),
      ]);
    case 'search_rems':
      return uniqueRemIds([(request.args as SearchRemsArgs).contextRemId]);
    case 'get_document_or_folder_tree':
      return uniqueRemIds([(request.args as GetDocumentOrFolderTreeArgs).rootRemId]);
    case 'create_rem':
    case 'create_document':
    case 'create_folder':
      return uniqueRemIds([(request.args as CreateRemArgs | CreateDocumentArgs | CreateFolderArgs).parentId]);
    case 'create_rem_tree':
      return uniqueRemIds([(request.args as CreateRemTreeArgs).parentId]);
    case 'create_styled_rem_tree':
      return uniqueRemIds([(request.args as CreateStyledRemTreeArgs).parentId]);
    case 'apply_structured_note_batch':
      return uniqueRemIds([(request.args as ApplyStructuredNoteBatchArgs).parentId]);
    case 'create_basic_flashcard':
    case 'create_concept_card':
    case 'create_descriptor_card':
      return uniqueRemIds([(request.args as CreateFlashcardArgs).parentId]);
    case 'create_cloze_card':
      return uniqueRemIds([(request.args as CreateClozeCardArgs).parentId]);
    case 'create_multiple_choice_card':
      return uniqueRemIds([(request.args as CreateMultipleChoiceCardArgs).parentId]);
    case 'create_list_answer_card':
      return uniqueRemIds([(request.args as CreateListAnswerCardArgs).parentId]);
    case 'move_rem':
      return uniqueRemIds([(request.args as MoveRemArgs).remId, (request.args as MoveRemArgs).newParentId]);
    default:
      return [];
  }
}

async function isRemWithinRoot(plugin: RNPlugin, remId: string, rootRemId: string): Promise<boolean> {
  if (remId === rootRemId) {
    return true;
  }

  const seen = new Set<string>();
  let current = await plugin.rem.findOne(remId);

  while (current && current.parent && !seen.has(current._id)) {
    seen.add(current._id);
    if (current.parent === rootRemId) {
      return true;
    }

    current = await plugin.rem.findOne(current.parent);
  }

  if (!current) {
    throw new RemnoteWriteError('REM_NOT_FOUND', 'Target Rem was not found.', { remId });
  }

  return false;
}

async function assertTargetsInsideRoots(
  plugin: RNPlugin,
  request: BridgeRequest,
  targetRemIds: string[],
  rootRemIds: string[],
  reason: string
): Promise<void> {
  if (rootRemIds.length === 0) {
    throw new RemnoteWriteError('OUT_OF_SCOPE', reason, {
      tool: request.tool,
    });
  }

  for (const targetRemId of targetRemIds) {
    let inside = false;
    for (const rootRemId of rootRemIds) {
      if (await isRemWithinRoot(plugin, targetRemId, rootRemId)) {
        inside = true;
        break;
      }
    }

    if (!inside) {
      throw new RemnoteWriteError('OUT_OF_SCOPE', reason, {
        tool: request.tool,
        targetRemId,
        allowedRootRemIds: rootRemIds,
      });
    }
  }
}

async function getImplicitScopedRootRemId(
  plugin: RNPlugin,
  request: BridgeRequest,
  context: BridgeHandlerContext
): Promise<string | null> {
  if (!requestNeedsImplicitScopedRoot(request)) {
    return null;
  }

  if (context.permissionScope === 'approved_document_or_folder') {
    return context.approvedRootRemId;
  }

  if (context.permissionScope === 'focused_rem_and_descendants') {
    return getFocusedRemId(plugin);
  }

  if (context.permissionScope === 'selected_rem_and_descendants') {
    const selectedRemIds = await getSelectedRemIds(plugin);
    if (selectedRemIds.length === 1) {
      return selectedRemIds[0];
    }

    throw new RemnoteWriteError(
      'OUT_OF_SCOPE',
      'Implicit selected descendant scope requires exactly one selected Rem.',
      { tool: request.tool, selectedRemCount: selectedRemIds.length }
    );
  }

  return null;
}

async function enforceScope(
  plugin: RNPlugin,
  request: BridgeRequest,
  context: BridgeHandlerContext
): Promise<void> {
  if (context.permissionScope === 'workspace_allowed') {
    return;
  }

  if (requestHasWorkspaceCreateTarget(request)) {
    throw new RemnoteWriteError(
      'OUT_OF_SCOPE',
      'Workspace-level create requires workspace_allowed scope.',
      { tool: request.tool, permissionScope: context.permissionScope }
    );
  }

  const implicitScopedRoot = await getImplicitScopedRootRemId(plugin, request, context);

  if (requestNeedsImplicitScopedRoot(request) && !implicitScopedRoot) {
    throw new RemnoteWriteError(
      'OUT_OF_SCOPE',
      'This tool requires an explicit scoped root unless a descendant scope can provide one.',
      { tool: request.tool, permissionScope: context.permissionScope }
    );
  }

  const deleteTargetRemId = await resolveDeleteTargetRemId(plugin, request);
  const targetRemIds = uniqueRemIds([
    ...getStaticScopeTargetIds(request),
    deleteTargetRemId,
    implicitScopedRoot,
  ]);

  if (targetRemIds.length === 0) {
    return;
  }

  if (context.permissionScope === 'focused_rem_only') {
    const focusedRemId = await getFocusedRemId(plugin);
    if (!focusedRemId || targetRemIds.some((targetRemId) => targetRemId !== focusedRemId)) {
      throw new RemnoteWriteError(
        'OUT_OF_SCOPE',
        'Request target is outside the focused Rem scope.',
        { tool: request.tool, focusedRemId, targetRemIds }
      );
    }
    return;
  }

  if (context.permissionScope === 'selected_rem_only') {
    const selectedRemIds = await getSelectedRemIds(plugin);
    const selectedSet = new Set(selectedRemIds);
    if (targetRemIds.some((targetRemId) => !selectedSet.has(targetRemId))) {
      throw new RemnoteWriteError(
        'OUT_OF_SCOPE',
        'Request target is outside the selected Rem scope.',
        { tool: request.tool, selectedRemIds, targetRemIds }
      );
    }
    return;
  }

  if (context.permissionScope === 'focused_rem_and_descendants') {
    await assertTargetsInsideRoots(
      plugin,
      request,
      targetRemIds,
      uniqueRemIds([await getFocusedRemId(plugin)]),
      'Request target is outside the focused Rem descendant scope.'
    );
    return;
  }

  if (context.permissionScope === 'selected_rem_and_descendants') {
    await assertTargetsInsideRoots(
      plugin,
      request,
      targetRemIds,
      await getSelectedRemIds(plugin),
      'Request target is outside the selected Rem descendant scope.'
    );
    return;
  }

  if (context.permissionScope === 'approved_document_or_folder') {
    await assertTargetsInsideRoots(
      plugin,
      request,
      targetRemIds,
      context.approvedRootRemId ? [context.approvedRootRemId] : [],
      'Request target is outside the approved document or folder scope.'
    );
  }
}

async function effectiveSearchArgs(
  plugin: RNPlugin,
  request: BridgeRequest,
  context: BridgeHandlerContext
): Promise<SearchRemsArgs> {
  const args = request.args as SearchRemsArgs;
  if (!args.contextRemId) {
    return {
      ...args,
      contextRemId: await getImplicitScopedRootRemId(plugin, request, context),
    };
  }

  return args;
}

async function effectiveDocumentOrFolderTreeArgs(
  plugin: RNPlugin,
  request: BridgeRequest,
  context: BridgeHandlerContext
): Promise<GetDocumentOrFolderTreeArgs> {
  const args = request.args as GetDocumentOrFolderTreeArgs;
  if (!args.rootRemId) {
    return {
      ...args,
      rootRemId: await getImplicitScopedRootRemId(plugin, request, context),
    };
  }

  return args;
}

function getCreatedRemId(response: BridgeResponse): string | undefined {
  if (!response.ok || typeof response.result !== 'object' || response.result === null) {
    return undefined;
  }

  const result = response.result as Record<string, unknown>;
  if (typeof result.createdRemId === 'string') {
    return result.createdRemId;
  }

  if (typeof result.rootCreatedRemId === 'string') {
    return result.rootCreatedRemId;
  }

  return undefined;
}

function logBridgeResponse(
  request: BridgeRequest,
  permissionMode: PermissionMode,
  approvalStatus: 'not_required' | 'approved' | 'rejected' | 'timeout' | 'cancelled' | 'denied' | 'failed',
  response: BridgeResponse,
  startedAt: number
) {
  console.info('Bridge request completed', {
    requestId: request.id,
    tool: request.tool,
    permissionMode,
    approvalStatus,
    targetRemId: getRequestTargetRemId(request),
    createdRemId: getCreatedRemId(response),
    errorCode: response.ok ? undefined : response.error.code,
    durationMs: Date.now() - startedAt,
  });
}

async function withApprovalTimeout(
  request: PendingApprovalRequest,
  approve: (request: PendingApprovalRequest) => Promise<ApprovalResolution>,
  timeoutMs: number
): Promise<ApprovalResolution> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<ApprovalResolution>((resolve) => {
    timeoutId = setTimeout(() => resolve('APPROVAL_TIMEOUT'), timeoutMs);
  });

  const result = await Promise.race([approve(request), timeout]);
  if (timeoutId) {
    clearTimeout(timeoutId);
  }

  return result;
}

function approvalSummary(request: BridgeRequest): string {
  switch (request.tool) {
    case 'create_rem':
      return 'Create one Rem from markdown.';
    case 'create_document':
      return 'Create one document Rem from markdown.';
    case 'create_folder':
      return 'Create one folder if the SDK supports folders.';
    case 'append_to_rem':
      return `Append one child Rem at ${(request.args as AppendToRemArgs).position ?? 'end'}.`;
    case 'update_rem':
      return 'Replace target Rem text. Children stay untouched.';
    case 'move_rem':
      return `Move Rem to index ${(request.args as MoveRemArgs).index}.`;
    case 'reorder_children':
      return 'Reorder one parent Rem child list.';
    case 'create_rem_tree':
      return 'Create structured Rem tree from JSON.';
    case 'update_rem_rich':
      return 'Replace target Rem with structured rich text.';
    case 'set_rem_heading_level':
      return 'Apply a RemNote heading level.';
    case 'set_rem_text_color':
      return 'Apply whole-Rem text color.';
    case 'set_rem_highlight_color':
      return 'Apply whole-Rem highlight color.';
    case 'set_text_span_color':
      return 'Apply partial text color.';
    case 'set_text_span_highlight':
      return 'Apply partial text highlight.';
    case 'set_rem_type':
      return 'Set Rem type.';
    case 'set_hide_bullet':
      return 'Toggle Rem bullet visibility.';
    case 'clear_rem_formatting':
      return 'Clear visible text formatting.';
    case 'create_styled_rem_tree':
      return 'Create styled nested Rem tree.';
    case 'apply_structured_note_batch':
      return 'Apply one structured note batch with optional dry-run, rollback, and verification.';
    case 'create_basic_flashcard':
      return 'Create a basic flashcard.';
    case 'create_concept_card':
      return 'Create a concept card.';
    case 'create_descriptor_card':
      return 'Create a descriptor card.';
    case 'create_cloze_card':
      return 'Create a cloze card.';
    case 'create_multiple_choice_card':
      return 'Create a multiple-choice card.';
    case 'create_list_answer_card':
      return 'Create a list-answer card.';
    case 'replace_rem':
      return 'Replace target Rem text.';
    case 'delete_focused_rem':
      return 'Delete the currently focused Rem.';
    case 'delete_selected_rem':
      return 'Delete the currently selected Rem.';
    case 'delete_rem':
      return 'Delete target Rem.';
    default:
      return 'Run RemNote bridge request.';
  }
}

async function buildApprovalRequest(
  plugin: RNPlugin,
  request: BridgeRequest,
  context: BridgeHandlerContext,
  timeoutMs: number,
  destructive: boolean
): Promise<PendingApprovalRequest> {
  const targetRemId =
    (await resolveDeleteTargetRemId(plugin, request)) ??
    getRequestTargetRemId(request) ??
    undefined;
  const deletePreview =
    targetRemId &&
    (request.tool === 'delete_rem' ||
      request.tool === 'delete_focused_rem' ||
      request.tool === 'delete_selected_rem')
      ? await buildDeletePreview(plugin, targetRemId, (request.args as DeleteRemArgs | DeleteFocusedRemArgs | DeleteSelectedRemArgs).recursive ?? false)
      : undefined;
  const target =
    deletePreview
      ? undefined
      : targetRemId && (request.tool === 'create_rem' || request.tool === 'create_document' || request.tool === 'create_folder' || request.tool === 'create_rem_tree')
      ? await getRemApprovalContext(plugin, targetRemId, 'Parent', 'PARENT_NOT_FOUND')
      : targetRemId &&
          (request.tool === 'create_styled_rem_tree' ||
            request.tool === 'apply_structured_note_batch' ||
            request.tool === 'create_basic_flashcard' ||
            request.tool === 'create_concept_card' ||
            request.tool === 'create_descriptor_card' ||
            request.tool === 'create_cloze_card' ||
            request.tool === 'create_multiple_choice_card' ||
            request.tool === 'create_list_answer_card')
        ? await getRemApprovalContext(plugin, targetRemId, 'Parent', 'PARENT_NOT_FOUND')
      : targetRemId
        ? await getRemApprovalContext(plugin, targetRemId)
        : undefined;
  const hasChildren = deletePreview ? deletePreview.childCount > 0 : target?.hasChildren;
  const deadline = new Date(Date.now() + timeoutMs).toISOString();
  let warning: string | undefined;

  if (request.tool === 'delete_rem' || request.tool === 'delete_focused_rem' || request.tool === 'delete_selected_rem') {
    warning = deletePreview?.recursive
      ? `Recursive delete removes ${deletePreview.descendantCount} descendants.`
      : hasChildren
        ? 'This Rem has children. Non-recursive delete is blocked.'
        : 'Delete permanently removes the target Rem.';
  } else if (request.tool === 'move_rem' && hasChildren) {
    warning = `This move request moves a Rem with ${target?.childCount ?? 0} direct children.`;
  } else if (request.tool === 'replace_rem') {
    warning = 'This replace request overwrites the visible text of the target Rem.';
  } else if (request.tool === 'update_rem') {
    warning = 'This update replaces the visible text of the target Rem.';
  }

  return {
    id: request.id,
    tool: request.tool,
    args: request.args,
    permissionMode: context.permissionMode,
    permissionScope: context.permissionScope,
    requestedAt: new Date().toISOString(),
    timeoutDeadline: deadline,
    targetRemId,
    targetTitle: deletePreview?.targetTitle ?? target?.title,
    hasChildren,
    previewMarkdown: getRequestPreviewMarkdown(request),
    riskLevel: destructive ? 'destructive' : 'safe_write',
    summary: approvalSummary(request),
    ...(warning ? { warning } : {}),
    ...(deletePreview ? { confirmTextRequired: 'DELETE' as const, deletePreview } : {}),
  };
}

async function shouldForceApproval(_plugin: RNPlugin, request: BridgeRequest): Promise<boolean> {
  switch (request.tool) {
    case 'create_rem':
    case 'create_document':
    case 'create_folder':
      return Boolean((request.args as CreateRemArgs | CreateDocumentArgs | CreateFolderArgs).parentId);
    case 'apply_structured_note_batch':
      return !(request.args as ApplyStructuredNoteBatchArgs).dryRun;
    case 'append_to_rem':
    case 'update_rem':
    case 'move_rem':
    case 'reorder_children':
    case 'create_rem_tree':
    case 'update_rem_rich':
    case 'set_rem_heading_level':
    case 'set_rem_text_color':
    case 'set_rem_highlight_color':
    case 'set_text_span_color':
    case 'set_text_span_highlight':
    case 'set_rem_type':
    case 'set_hide_bullet':
    case 'clear_rem_formatting':
    case 'create_styled_rem_tree':
    case 'create_basic_flashcard':
    case 'create_concept_card':
    case 'create_descriptor_card':
    case 'create_cloze_card':
    case 'create_multiple_choice_card':
    case 'create_list_answer_card':
      return true;
    default:
      return false;
  }
}

export async function handleBridgeRequest(
  plugin: RNPlugin,
  request: BridgeRequest,
  context: BridgeHandlerContext
): Promise<BridgeResponse> {
  const startedAt = Date.now();
  const lifecycle: BridgeLifecycleEvent[] = [];
  let approvalStatus: 'not_required' | 'approved' | 'rejected' | 'timeout' | 'cancelled' | 'denied' | 'failed' =
    'not_required';
  const finish = (
    response: BridgeResponse,
    status: typeof approvalStatus
  ): BridgeResponse => {
    if (hasPartialExecution(response) && !hasLifecyclePhase(lifecycle, ['partial_failure'])) {
      recordLifecycle(lifecycle, 'partial_failure', 'SDK failure occurred after partial execution.');
    }

    if (!hasLifecyclePhase(lifecycle, ['completed', 'failed', 'cancelled'])) {
      if (response.ok) {
        recordLifecycle(lifecycle, 'completed', 'Bridge request completed.');
      } else if (response.error.code === 'CLIENT_DISCONNECTED') {
        recordLifecycle(lifecycle, 'cancelled', response.error.message);
      } else {
        recordLifecycle(lifecycle, 'failed', response.error.message);
      }
    }

    const responseWithLifecycle = attachLifecycle(response, lifecycle);
    logBridgeResponse(request, context.permissionMode, status, responseWithLifecycle, startedAt);
    return responseWithLifecycle;
  };

  recordLifecycle(lifecycle, 'received', 'Plugin handler received the bridge request.');
  const decision = getPermissionDecision(context.permissionMode, request.tool);

  if (!decision.allowed) {
    approvalStatus = 'denied';
    const response = createBridgeFailure(request.id, 'PERMISSION_DENIED', decision.reason);
    return finish(response, approvalStatus);
  }

  try {
    await enforceScope(plugin, request, context);
    recordLifecycle(lifecycle, 'validated', 'Request permissions and scope validated.');
  } catch (error: unknown) {
    const response = mapSdkError(request.id, error);
    return finish(response, 'denied');
  }

  let approvalRequired = decision.approvalRequired;
  try {
    approvalRequired = approvalRequired || (await shouldForceApproval(plugin, request));
  } catch (error: unknown) {
    const response = mapSdkError(request.id, error);
    return finish(response, 'failed');
  }

  if (approvalRequired) {
    let approval: ApprovalResolution;
    try {
      const timeoutMs = request.timeoutMs
        ? Math.min(request.timeoutMs, WRITE_APPROVAL_TIMEOUT_MS)
        : WRITE_APPROVAL_TIMEOUT_MS;
      recordLifecycle(lifecycle, 'waiting_for_approval', 'Request is waiting for RemNote approval.');
      approval = await withApprovalTimeout(
        await buildApprovalRequest(plugin, request, context, timeoutMs, decision.destructive),
        context.requestApproval,
        timeoutMs
      );
    } catch (error: unknown) {
      if (error instanceof RemnoteWriteError) {
        const response = mapSdkError(request.id, error);
        return finish(response, 'failed');
      }

      const message = error instanceof Error ? error.message : String(error);
      const response = createBridgeFailure(request.id, 'INTERNAL_ERROR', 'Approval handling failed.', {
        message,
      });
      return finish(response, approvalStatus);
    }

    if (approval === 'APPROVAL_TIMEOUT') {
      approvalStatus = 'timeout';
      recordLifecycle(lifecycle, 'approval_timeout', 'Approval deadline expired.');
      const response = createBridgeFailure(request.id, 'APPROVAL_TIMEOUT', 'User did not approve the request before timeout.');
      return finish(response, approvalStatus);
    }

    if (approval === 'APPROVAL_PENDING') {
      approvalStatus = 'rejected';
      recordLifecycle(lifecycle, 'approval_rejected', 'Another approval request is already pending.');
      const response = createBridgeFailure(
        request.id,
        'APPROVAL_PENDING',
        'Another approval request is already pending in RemNote.'
      );
      return finish(response, approvalStatus);
    }

    if (approval === 'REQUEST_CANCELLED') {
      approvalStatus = 'cancelled';
      recordLifecycle(lifecycle, 'cancelled', 'Caller disconnected before approval completed.');
      const response = createBridgeFailure(
        request.id,
        'CLIENT_DISCONNECTED',
        'MCP caller disconnected before approval completed.'
      );
      return finish(response, approvalStatus);
    }

    if (approval !== 'APPROVED') {
      approvalStatus = 'rejected';
      recordLifecycle(lifecycle, 'approval_rejected', 'User rejected the request.');
      const response = createBridgeFailure(
        request.id,
        'APPROVAL_REJECTED',
        'User rejected the request.'
      );
      return finish(response, approvalStatus);
    }

    approvalStatus = 'approved';
    recordLifecycle(lifecycle, 'approval_approved', 'User approved the request.');
  }

  try {
    let response: BridgeResponse;
    recordLifecycle(lifecycle, 'executing', 'Executing RemNote bridge operation.');
    switch (request.tool) {
      case 'ping':
        response = createBridgeSuccess(request, {
          message: request.args.message || 'pong',
        });
        break;
      case 'get_status':
        response = createBridgeSuccess(request, {
          connected: true,
          permissionMode: context.permissionMode,
          permissionScope: context.permissionScope,
          approvedRootRemId: context.approvedRootRemId,
          focusedRem: await getFocusedRemStatus(plugin),
        });
        break;
      case 'get_focused_rem': {
        const focusedRem = await readFocusedRem(plugin);
        if (!focusedRem) {
          response = createBridgeFailure(
            request.id,
            'NO_FOCUSED_REM',
            'No Rem is currently focused in RemNote.'
          );
          break;
        }

        response = createBridgeSuccess(request, focusedRem);
        break;
      }
      case 'get_rem': {
        const rem = await readRem(plugin, request.args);
        if (!rem) {
          response = createBridgeFailure(request.id, 'REM_NOT_FOUND', 'Target Rem was not found.');
          break;
        }

        response = createBridgeSuccess(request, rem);
        break;
      }
      case 'get_rem_tree': {
        const rem = await readRemTree(plugin, request.args);
        if (!rem) {
          response = createBridgeFailure(request.id, 'REM_NOT_FOUND', 'Target Rem was not found.');
          break;
        }

        response = createBridgeSuccess(request, rem);
        break;
      }
      case 'get_rem_rich': {
        const rem = await readRemRich(plugin, request.args);
        if (!rem) {
          response = createBridgeFailure(request.id, 'REM_NOT_FOUND', 'Target Rem was not found.');
          break;
        }

        response = createBridgeSuccess(request, rem);
        break;
      }
      case 'get_current_selection':
        response = createBridgeSuccess(request, await getCurrentSelection(plugin, request.args));
        break;
      case 'get_children': {
        const children = await readChildren(plugin, request.args);
        if (!children) {
          response = createBridgeFailure(request.id, 'REM_NOT_FOUND', 'Parent Rem was not found.');
          break;
        }

        response = createBridgeSuccess(request, children);
        break;
      }
      case 'get_rem_breadcrumbs': {
        const breadcrumbs = await readRemBreadcrumbs(plugin, request.args);
        if (!breadcrumbs) {
          response = createBridgeFailure(request.id, 'REM_NOT_FOUND', 'Target Rem was not found.');
          break;
        }

        response = createBridgeSuccess(request, breadcrumbs);
        break;
      }
      case 'search_rems':
        response = createBridgeSuccess(request, await searchRems(plugin, await effectiveSearchArgs(plugin, request, context)));
        break;
      case 'get_document_or_folder_tree': {
        const tree = await readDocumentOrFolderTree(
          plugin,
          await effectiveDocumentOrFolderTreeArgs(plugin, request, context)
        );
        if (!tree) {
          response = createBridgeFailure(
            request.id,
            'NO_FOCUSED_REM',
            'No document, folder, or focused Rem is available.'
          );
          break;
        }

        response = createBridgeSuccess(request, tree);
        break;
      }
      case 'create_rem':
        response = createBridgeSuccess(request, await createRemFromMarkdown(plugin, request.args));
        break;
      case 'append_to_rem':
        response = createBridgeSuccess(request, await appendMarkdownToRem(plugin, request.args));
        break;
      case 'create_document':
        response = createBridgeSuccess(request, await createDocumentFromMarkdown(plugin, request.args));
        break;
      case 'create_folder':
        response = createBridgeSuccess(request, await createFolderFromMarkdown(plugin, request.args));
        break;
      case 'update_rem':
        response = createBridgeSuccess(request, await updateRemMarkdown(plugin, request.args));
        break;
      case 'move_rem':
        response = createBridgeSuccess(request, await moveRem(plugin, request.args));
        break;
      case 'reorder_children':
        response = createBridgeSuccess(request, await reorderChildren(plugin, request.args));
        break;
      case 'create_rem_tree':
        response = createBridgeSuccess(request, await createRemTree(plugin, request.args));
        break;
      case 'update_rem_rich':
        response = createBridgeSuccess(request, await updateRemRich(plugin, request.args));
        break;
      case 'set_rem_heading_level':
        response = createBridgeSuccess(request, await setRemHeadingLevel(plugin, request.args));
        break;
      case 'set_rem_text_color':
        response = createBridgeSuccess(request, await setRemTextColor(plugin, request.args));
        break;
      case 'set_rem_highlight_color':
        response = createBridgeSuccess(request, await setRemHighlightColor(plugin, request.args));
        break;
      case 'set_text_span_color':
        response = createBridgeSuccess(request, await setTextSpanColor(plugin, request.args));
        break;
      case 'set_text_span_highlight':
        response = createBridgeSuccess(request, await setTextSpanHighlight(plugin, request.args));
        break;
      case 'set_rem_type':
        response = createBridgeSuccess(request, await setRemType(plugin, request.args));
        break;
      case 'set_hide_bullet':
        response = createBridgeSuccess(request, await setHideBullet(plugin, request.args));
        break;
      case 'clear_rem_formatting':
        response = createBridgeSuccess(request, await clearRemFormatting(plugin, request.args));
        break;
      case 'create_styled_rem_tree':
        response = createBridgeSuccess(request, await createStyledRemTree(plugin, request.args));
        break;
      case 'apply_structured_note_batch':
        response = createBridgeSuccess(request, await applyStructuredNoteBatch(plugin, request.args));
        break;
      case 'create_basic_flashcard':
        response = createBridgeSuccess(request, await createBasicFlashcard(plugin, request.args));
        break;
      case 'create_concept_card':
        response = createBridgeSuccess(
          request,
          await createBasicFlashcard(plugin, request.args, 'concept', 'concept')
        );
        break;
      case 'create_descriptor_card':
        response = createBridgeSuccess(
          request,
          await createBasicFlashcard(plugin, request.args, 'descriptor', 'descriptor')
        );
        break;
      case 'create_cloze_card':
        response = createBridgeSuccess(request, await createClozeCard(plugin, request.args));
        break;
      case 'create_multiple_choice_card':
        response = createBridgeSuccess(request, await createMultipleChoiceCard(plugin, request.args));
        break;
      case 'create_list_answer_card':
        response = createBridgeSuccess(request, await createListAnswerCard(plugin, request.args));
        break;
      case 'replace_rem':
        response = createBridgeSuccess(request, await replaceRemMarkdown(plugin, request.args));
        break;
      case 'delete_focused_rem':
        response = createBridgeSuccess(request, await deleteFocusedRem(plugin, request.args));
        break;
      case 'delete_selected_rem':
        response = createBridgeSuccess(request, await deleteSelectedRem(plugin, request.args));
        break;
      case 'delete_rem':
        response = createBridgeSuccess(request, await deleteRem(plugin, request.args));
        break;
      default:
        response = createBridgeFailure('unknown', 'UNKNOWN_TOOL', 'Unknown bridge tool.');
        break;
    }
    return finish(response, approvalStatus);
  } catch (error: unknown) {
    const response = mapSdkError(request.id, error);
    return finish(response, approvalStatus);
  }
}
