import type { RNPlugin } from '@remnote/plugin-sdk';
import type {
  BridgeRequest,
  BridgeResponse,
  GetRemArgs,
  AppendToRemArgs,
  DeleteRemByIdArgs,
  GetChildrenArgs,
  ReorderChildrenArgs,
  SearchRemsArgs,
  GetDocumentOrFolderTreeArgs,
  CreateRemArgs,
  CreateDocumentArgs,
  CreateFolderArgs,
  CreateRemTreeArgs,
  CreateStyledRemTreeArgs,
  CreatePolishedNoteTreeArgs,
  CreateOrReplaceNoteFromMarkdownArgs,
  CreateCardSetFromNoteArgs,
  CreateNoteFromMarkdownTreeArgs,
  CreateClozeCardsFromNoteArgs,
  CreateDesignedNoteTreeArgs,
  CreateFlashcardsFromMarkdownArgs,
  AppendMarkdownAsRemTreeArgs,
  ApplyStylePlanArgs,
  RepairCardSetArgs,
  RepairNoteDesignArgs,
  VerifyNoteDesignArgs,
  VerifyNoteAgainstDesignArgs,
  VerifyCardSetArgs,
  ApplyRemnoteCommandArgs,
  ApplyStructuredNoteBatchArgs,
  CreateListAnswerCardArgs,
  CreateMultipleChoiceCardArgs,
  CreateClozeCardArgs,
  CreateFlashcardArgs,
  MoveRemArgs,
  UpdateNoteWithDesignArgs,
  InsertMediaFromUrlArgs,
} from '../../../shared/bridge/protocol';
import { createBridgeFailure } from '../../../shared/bridge/protocol';
import { RemnoteWriteError } from '../../remnote/write';
import type { BridgeHandlerContext } from '../handlers';
import { getCurrentSelection } from '../../remnote/read';

export type BridgeErrorLayer =
  | 'validation'
  | 'conflict'
  | 'plugin_scope'
  | 'plugin_permission'
  | 'sdk'
  | 'persistence'
  | 'connection'
  | 'internal';

function errorLayerForCode(code: string): BridgeErrorLayer {
  if (code === 'INVALID_ARGS' || code === 'NO_FOCUSED_REM' || code === 'PARENT_NOT_FOUND') return 'validation';
  if (code === 'STALE_STATE_CONFLICT' || code === 'DEVICE_CONFLICT') return 'conflict';
  if (code === 'OUT_OF_SCOPE' || code === 'INSUFFICIENT_SCOPE' || code === 'REM_NOT_FOUND') return 'plugin_scope';
  if (['PERMISSION_DENIED', 'TRUSTED_WRITE_REQUIRED', 'APPROVAL_REJECTED', 'APPROVAL_TIMEOUT'].includes(code)) return 'plugin_permission';
  if (['SDK_UNSUPPORTED', 'SDK_ERROR', 'SDK_CREATE_TREE_EMPTY_RESULT', 'SDK_CREATE_TREE_UNSUPPORTED', 'TRANSACTION_RETURN_BUG'].includes(code)) return 'sdk';
  if (code === 'ROLLBACK_FAILED') return 'persistence';
  if (['PLUGIN_NOT_CONNECTED', 'PLUGIN_NOT_PAIRED', 'NO_PAIRED_PLUGIN_SESSION', 'HOSTED_SESSION_MISSING', 'PLUGIN_SESSION_EXPIRED', 'PLUGIN_SESSION_REVOKED', 'NO_ACTIVE_DEVICE', 'TIMEOUT', 'CLIENT_DISCONNECTED', 'RETRYABLE_UNKNOWN_WRITE_STATUS', 'RETRYABLE_UNKNOWN_DELETE_STATUS', 'REQUEST_CANCELLED'].includes(code)) return 'connection';
  return 'internal';
}

function recommendedFixForLayer(layer: BridgeErrorLayer, code: string): string {
  switch (layer) {
    case 'validation':
      return 'Fix the tool arguments identified by this error, then retry the same operation.';
    case 'conflict':
      return 'Read the current target state, compare expected and actual values, then issue a new guarded operation if still intended.';
    case 'plugin_scope':
      return 'Focus the intended root Rem, select the target Rem, or use a known in-scope Rem ID before retrying.';
    case 'plugin_permission':
      return 'Approve this write in RemNote or use an operation allowed by the current permission mode; do not widen scope for validation failures.';
    case 'sdk':
      return code === 'SDK_UNSUPPORTED'
        ? 'Inspect the SDK capability report and use the documented supported fallback.'
        : 'Inspect the SDK operation details and target readback before deciding whether a retry is safe.';
    case 'persistence':
      return 'Inspect durable state and live artifact IDs, reconcile them, and do not replay the write blindly.';
    case 'connection':
      return 'Reconnect the same plugin session, restore operation and idempotency identity, then read before retrying any write with an unknown outcome.';
    default:
      return 'Inspect the operation ID and internal diagnostics before retrying.';
  }
}

export function mapSdkError(id: string, error: unknown): BridgeResponse {
  if (error instanceof RemnoteWriteError) {
    const layer = errorLayerForCode(error.code);
    const recommendedFix = recommendedFixForLayer(layer, error.code);
    return createBridgeFailure(id, error.code, error.message, {
      ...(error.details && typeof error.details === 'object' ? error.details : {}),
      layer,
      code: error.code,
      recommendedFix,
    });
  }

  const message = error instanceof Error ? error.message : String(error);

  if (/not found/i.test(message)) {
    return createBridgeFailure(id, 'REM_NOT_FOUND', message, {
      layer: 'plugin_scope',
      code: 'REM_NOT_FOUND',
      recommendedFix: 'Verify the Rem ID still exists and is inside the approved RemnoteMCP scope.',
    });
  }

  if (/missing|empty|too long|exceeds/i.test(message)) {
    return createBridgeFailure(id, 'INVALID_ARGS', message, {
      layer: 'validation',
      code: 'INVALID_ARGS',
      recommendedFix: recommendedFixForLayer('validation', 'INVALID_ARGS'),
    });
  }

  return createBridgeFailure(id, 'SDK_ERROR', 'RemNote SDK operation failed.', {
    layer: 'sdk',
    code: 'SDK_ERROR',
    recommendedFix: 'Retry with a smaller payload. If it repeats, run diagnostics and use the markdown hierarchy fallback.',
  });
}

export function uniqueRemIds(ids: Array<string | null | undefined>): string[] {
  return Array.from(new Set(ids.filter((id): id is string => typeof id === 'string' && id.length > 0)));
}

export function requestHasWorkspaceCreateTarget(request: BridgeRequest): boolean {
  if (request.tool !== 'create_rem' && request.tool !== 'create_document' && request.tool !== 'create_folder') {
    return false;
  }

  return !(request.args as CreateRemArgs | CreateDocumentArgs | CreateFolderArgs).parentId;
}

export function getStructuredBatchScopeTargetIds(args: ApplyStructuredNoteBatchArgs): string[] {
  return uniqueRemIds([
    args.parentId,
    args.target?.parentId,
    args.target?.remId,
  ]);
}

export function getCommandStaticScopeTargetIds(args: ApplyRemnoteCommandArgs): string[] {
  return args.target.mode === 'rem_id' ? uniqueRemIds([args.target.remId]) : [];
}

export function requestNeedsImplicitScopedRoot(request: BridgeRequest): boolean {
  if (request.tool === 'search_rems') {
    return !(request.args as SearchRemsArgs).contextRemId;
  }

  if (request.tool === 'get_document_or_folder_tree') {
    return !(request.args as GetDocumentOrFolderTreeArgs).rootRemId;
  }

  return false;
}

export async function getFocusedRemId(plugin: RNPlugin): Promise<string | null> {
  const focusedRem = await plugin.focus.getFocusedRem();
  return focusedRem?._id ?? null;
}

export async function getSelectedRemIds(plugin: RNPlugin): Promise<string[]> {
  const selection = await getCurrentSelection(plugin, {});
  return selection.selectedRemIds;
}

export async function getSingleSelectedRemId(plugin: RNPlugin): Promise<string> {
  const selectedRemIds = await getSelectedRemIds(plugin);
  if (selectedRemIds.length !== 1) {
    throw new RemnoteWriteError(
      'INVALID_ARGS',
      'selected_rem target requires exactly one selected Rem.',
      {
        selectedRemCount: selectedRemIds.length,
      }
    );
  }

  return selectedRemIds[0];
}

export async function resolveCommandTargetRemId(plugin: RNPlugin, request: BridgeRequest): Promise<string | undefined> {
  if (request.tool !== 'apply_remnote_command') {
    return undefined;
  }

  const args = request.args as ApplyRemnoteCommandArgs;
  if (args.target.mode === 'rem_id') {
    return args.target.remId ?? undefined;
  }
  if (args.target.mode === 'focused_rem') {
    const focusedRemId = await getFocusedRemId(plugin);
    if (!focusedRemId) {
      throw new RemnoteWriteError('NO_FOCUSED_REM', 'No Rem is currently focused in RemNote.');
    }
    return focusedRemId;
  }

  return getSingleSelectedRemId(plugin);
}

export async function resolveStructuredBatchScopeRemId(
  plugin: RNPlugin,
  request: BridgeRequest,
  context: BridgeHandlerContext
): Promise<string | undefined> {
  if (request.tool !== 'apply_structured_note_batch') {
    return undefined;
  }

  const args = request.args as ApplyStructuredNoteBatchArgs;
  if (args.target?.mode === 'focused_rem') {
    const focusedRemId = await getFocusedRemId(plugin);
    if (!focusedRemId) {
      throw new RemnoteWriteError('NO_FOCUSED_REM', 'No Rem is currently focused in RemNote.');
    }
    return focusedRemId;
  }
  if (args.target?.mode === 'approved_root') {
    return context.approvedRootRemId ?? undefined;
  }
  return undefined;
}

export function getStaticScopeTargetIds(request: BridgeRequest): string[] {
  switch (request.tool) {
    case 'get_rem':
    case 'get_rem_tree':
    case 'get_rem_rich':
    case 'debug_get_raw_rich_text':
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
    case 'delete_rem_by_id':
      return uniqueRemIds([(request.args as GetRemArgs | AppendToRemArgs | DeleteRemByIdArgs).remId]);
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
    case 'insert_image_from_url':
    case 'insert_audio_from_url':
    case 'insert_video_from_url':
      return uniqueRemIds([(request.args as InsertMediaFromUrlArgs).parentId]);
    case 'create_styled_rem_tree':
      return uniqueRemIds([(request.args as CreateStyledRemTreeArgs).parentId]);
    case 'create_polished_note_tree':
      return uniqueRemIds([
        (request.args as CreatePolishedNoteTreeArgs).parentId,
        ...((request.args as CreatePolishedNoteTreeArgs).stylingPlan?.operations ?? []).map((operation) => operation.remId),
      ]);
    case 'create_or_replace_note_from_markdown':
      return uniqueRemIds([
        (request.args as CreateOrReplaceNoteFromMarkdownArgs).parentRemId,
        (request.args as CreateOrReplaceNoteFromMarkdownArgs).targetRemId,
      ]);
    case 'create_note_from_markdown_tree':
      return uniqueRemIds([(request.args as CreateNoteFromMarkdownTreeArgs).parentRemId]);
    case 'append_markdown_as_rem_tree':
      return uniqueRemIds([(request.args as AppendMarkdownAsRemTreeArgs).targetRemId]);
    case 'apply_style_plan':
      return uniqueRemIds((request.args as ApplyStylePlanArgs).operations.map((operation) => operation.remId));
    case 'verify_note_design':
      return uniqueRemIds([
        (request.args as VerifyNoteDesignArgs).rootRemId,
        ...Object.keys((request.args as VerifyNoteDesignArgs).expectedStyleMap ?? {}),
      ]);
    case 'create_designed_note_tree':
      return uniqueRemIds([(request.args as CreateDesignedNoteTreeArgs).parentId]);
    case 'update_note_with_design':
      return uniqueRemIds([
        (request.args as UpdateNoteWithDesignArgs).targetRemId,
        ...((request.args as UpdateNoteWithDesignArgs).styleOperations ?? []).map((operation) => operation.remId),
      ]);
    case 'verify_note_against_design':
      return uniqueRemIds([
        (request.args as VerifyNoteAgainstDesignArgs).rootRemId,
        ...Object.keys((request.args as VerifyNoteAgainstDesignArgs).expectedStyleMap ?? {}),
      ]);
    case 'repair_note_design':
      return uniqueRemIds([
        (request.args as RepairNoteDesignArgs).rootRemId,
        ...((request.args as RepairNoteDesignArgs).operations ?? []).map((operation) => operation.remId),
      ]);
    case 'create_card_set_from_note':
      return uniqueRemIds([
        (request.args as CreateCardSetFromNoteArgs).rootRemId,
        (request.args as CreateCardSetFromNoteArgs).parentId,
      ]);
    case 'create_flashcards_from_markdown':
      return uniqueRemIds([(request.args as CreateFlashcardsFromMarkdownArgs).parentId]);
    case 'create_cloze_cards_from_note':
      return uniqueRemIds([
        (request.args as CreateClozeCardsFromNoteArgs).rootRemId,
        (request.args as CreateClozeCardsFromNoteArgs).parentId,
      ]);
    case 'verify_card_set':
      return uniqueRemIds([(request.args as VerifyCardSetArgs).rootRemId]);
    case 'repair_card_set':
      return uniqueRemIds([(request.args as RepairCardSetArgs).rootRemId]);
    case 'apply_remnote_command':
      return getCommandStaticScopeTargetIds(request.args as ApplyRemnoteCommandArgs);
    case 'apply_structured_note_batch':
      return getStructuredBatchScopeTargetIds(request.args as ApplyStructuredNoteBatchArgs);
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

export async function isRemWithinRoot(plugin: RNPlugin, remId: string, rootRemId: string): Promise<boolean> {
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

export async function assertTargetsInsideRoots(
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

export async function getImplicitScopedRootRemId(
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

export async function enforceScope(
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

  const commandTargetRemId = await resolveCommandTargetRemId(plugin, request);
  const structuredBatchTargetRemId = await resolveStructuredBatchScopeRemId(plugin, request, context);
  const targetRemIds = uniqueRemIds([
    ...getStaticScopeTargetIds(request),
    commandTargetRemId,
    structuredBatchTargetRemId,
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
