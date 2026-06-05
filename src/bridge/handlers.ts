import type { RNPlugin } from '@remnote/plugin-sdk';
import {
  type DeleteRemByIdArgs,
  type ApprovalResolution,
  type BridgeLifecycleEvent,
  type BridgeLifecyclePhase,
  type BridgePluginRuntimeInfo,
  type BridgeRequest,
  type BridgeResponse,
  type PendingApprovalRequest,
  type PermissionMode,
  type PermissionScope,
  type SearchRemsArgs,
  type GetDocumentOrFolderTreeArgs,
  type ApplyStructuredNoteBatchArgs,
  type DebugGetRawRichTextArgs,
  type CreateOrReplaceNoteFromMarkdownArgs,
  WRITE_APPROVAL_TIMEOUT_MS,
  createBridgeFailure,
  createBridgeSuccess,
  isBridgeToolName,
} from '../../shared/bridge/protocol';
import { getPermissionDecision } from '../remnote/permissions';
import {
  debugGetRawRichText,
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
  applyStylePlan,
  appendMarkdownAsRemTree,
  applyRemnoteCommand,
  appendMarkdownToRem,
  clearRemFormatting,
  createBasicFlashcard,
  createClozeCard,
  createDocumentFromMarkdown,
  createFolderFromMarkdown,
  createListAnswerCard,
  createMultipleChoiceCard,
  createOrReplaceNoteFromMarkdown,
  createNoteFromMarkdownTree,
  createPolishedNoteTree,
  createRemFromMarkdown,
  createRemTree,
  createStyledRemTree,
  deleteRemByIdSafe,
  moveRem,
  previewMarkdownNoteTree,
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
  verifyNoteDesign,
} from '../remnote/write';

import { MAX_REQUEST_ID_CHARS, isPlainObject } from './handlers/validation';
import { normalizeArgs } from './handlers/args';
import {
  enforceScope,
  mapSdkError,
  getFocusedRemId,
  getImplicitScopedRootRemId,
} from './handlers/scope';
import {
  buildApprovalRequest,
  shouldForceApproval,
  withApprovalTimeout,
} from './handlers/approval';

export interface BridgeHandlerContext {
  permissionMode: PermissionMode;
  permissionScope: PermissionScope;
  approvedRootRemId: string | null;
  pluginRuntime?: BridgePluginRuntimeInfo;
  requestApproval: (request: PendingApprovalRequest) => Promise<ApprovalResolution>;
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
  const args = request.args as any;
  if (typeof args.remId === 'string') {
    return args.remId;
  }
  if (typeof args.parentRemId === 'string') {
    return args.parentRemId;
  }
  if (typeof args.targetRemId === 'string') {
    return args.targetRemId;
  }
  if (typeof args.rootRemId === 'string') {
    return args.rootRemId;
  }
  if (typeof args.target === 'object' && args.target && 'remId' in args.target && typeof args.target.remId === 'string') {
    return args.target.remId;
  }
  if (typeof args.target === 'object' && args.target && 'parentId' in args.target && typeof args.target.parentId === 'string') {
    return args.target.parentId;
  }
  return typeof args.parentId === 'string' ? args.parentId : undefined;
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

async function effectiveStructuredBatchArgs(
  plugin: RNPlugin,
  request: BridgeRequest,
  context: BridgeHandlerContext
): Promise<ApplyStructuredNoteBatchArgs> {
  const args = request.args as ApplyStructuredNoteBatchArgs;
  const target = args.target;
  if (!target || (target.mode !== 'focused_rem' && target.mode !== 'approved_root')) {
    return args;
  }

  const resolvedRemId =
    target.mode === 'focused_rem'
      ? await getFocusedRemId(plugin)
      : context.approvedRootRemId;
  if (!resolvedRemId) {
    throw new RemnoteWriteError(
      target.mode === 'focused_rem' ? 'NO_FOCUSED_REM' : 'OUT_OF_SCOPE',
      target.mode === 'focused_rem'
        ? 'No Rem is currently focused in RemNote.'
        : 'Approved Document/Folder scope requires an approved root Rem ID.'
    );
  }

  const operation = args.operation ?? 'create_child_tree';
  return {
    ...args,
    target: {
      ...target,
      ...(operation === 'create_child_tree'
        ? { parentId: resolvedRemId, remId: target.remId ?? null }
        : { remId: resolvedRemId, parentId: target.parentId ?? null }),
    },
  };
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
    approvalRequired =
      approvalRequired ||
      ((context.permissionMode === 'read_create' || context.permissionMode === 'read_create_modify') &&
        (await shouldForceApproval(plugin, request)));
    if (request.tool === 'delete_rem_by_id' && (request.args as DeleteRemByIdArgs).dryRun !== false) {
      approvalRequired = false;
    }
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
      recordLifecycle(lifecycle, 'waiting_for_chatgpt_permission', 'ChatGPT-side tool permission already completed before this local bridge request.');
      recordLifecycle(lifecycle, 'waiting_for_remnote_approval', 'Request is waiting for RemNote approval.');
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
      recordLifecycle(lifecycle, 'timeout', 'Approval deadline expired.');
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
          pluginRuntime: context.pluginRuntime,
          sdkVersion: context.pluginRuntime?.sdkVersion,
          supportedSdkCapabilities: context.pluginRuntime?.supportedSdkCapabilities,
          unsupportedSdkCapabilities: context.pluginRuntime?.unsupportedSdkCapabilities,
          initialSyncComplete: context.pluginRuntime?.initialSyncComplete,
          initialSyncTimedOut: context.pluginRuntime?.initialSyncTimedOut,
          initialSyncWarning: context.pluginRuntime?.initialSyncWarning,
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
      case 'debug_get_raw_rich_text': {
        const rem = await debugGetRawRichText(plugin, request.args as DebugGetRawRichTextArgs);
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
      case 'apply_remnote_command':
        response = createBridgeSuccess(request, await applyRemnoteCommand(plugin, request.args));
        break;
      case 'apply_structured_note_batch':
        response = createBridgeSuccess(
          request,
          await applyStructuredNoteBatch(plugin, await effectiveStructuredBatchArgs(plugin, request, context))
        );
        break;
      case 'create_polished_note_tree':
        response = createBridgeSuccess(request, await createPolishedNoteTree(plugin, request.args));
        break;
      case 'create_or_replace_note_from_markdown':
        response = createBridgeSuccess(request, await createOrReplaceNoteFromMarkdown(plugin, request.args));
        break;
      case 'preview_markdown_note_tree':
        response = createBridgeSuccess(request, previewMarkdownNoteTree(request.args));
        break;
      case 'create_note_from_markdown_tree':
        response = createBridgeSuccess(request, await createNoteFromMarkdownTree(plugin, request.args));
        break;
      case 'append_markdown_as_rem_tree':
        response = createBridgeSuccess(request, await appendMarkdownAsRemTree(plugin, request.args));
        break;
      case 'apply_style_plan':
        response = createBridgeSuccess(request, await applyStylePlan(plugin, request.args));
        break;
      case 'verify_note_design':
        response = createBridgeSuccess(request, await verifyNoteDesign(plugin, request.args));
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
      case 'delete_rem_by_id':
        response = createBridgeSuccess(request, await deleteRemByIdSafe(plugin, request.args));
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
