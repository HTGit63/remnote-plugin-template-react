import type { RNPlugin } from '@remnote/plugin-sdk';
import {
  type ApprovalResolution,
  type AppendToRemArgs,
  type BridgeRequest,
  type BridgeResponse,
  type BridgeToolArgs,
  type BridgeToolName,
  type CreateRemTreeArgs,
  type CreateRemArgs,
  type DeleteRemArgs,
  type GetCurrentSelectionArgs,
  type GetRemArgs,
  type GetRemRichArgs,
  type GetRemTreeArgs,
  type MoveRemArgs,
  type PendingApprovalRequest,
  type PermissionMode,
  type ReplaceRemArgs,
  type UpdateRemArgs,
  WRITE_APPROVAL_TIMEOUT_MS,
  createBridgeFailure,
  createBridgeSuccess,
  isBridgeToolName,
} from './protocol';
import { getPermissionDecision } from '../remnote/permissions';
import {
  getCurrentSelection,
  getFocusedRemStatus,
  readFocusedRem,
  readRem,
  readRemRich,
  readRemTree,
} from '../remnote/read';
import {
  appendMarkdownToRem,
  createRemFromMarkdown,
  createRemTree,
  deleteRem,
  getRemApprovalContext,
  moveRem,
  replaceRemMarkdown,
  RemnoteWriteError,
  updateRemMarkdown,
} from '../remnote/write';

const MAX_REQUEST_ID_CHARS = 128;
const MAX_REM_ID_CHARS = 256;
const MAX_MARKDOWN_CHARS = 20000;

export interface BridgeHandlerContext {
  permissionMode: PermissionMode;
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
    case 'create_rem_tree':
      return {
        parentId: requiredParentId(args),
        tree: requiredTree(args),
      } as BridgeToolArgs[TTool];
    case 'replace_rem':
      return {
        remId: requiredRemId(args),
        markdown: requiredMarkdown(args),
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
      CreateRemArgs &
      CreateRemTreeArgs
  >;
  if (typeof args.remId === 'string') {
    return args.remId;
  }
  return typeof args.parentId === 'string' ? args.parentId : undefined;
}

function getRequestPreviewMarkdown(request: BridgeRequest): string | undefined {
  const args = request.args as Partial<CreateRemArgs & AppendToRemArgs & UpdateRemArgs & ReplaceRemArgs>;
  return typeof args.markdown === 'string' ? args.markdown.slice(0, 3000) : undefined;
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
  approvalStatus: 'not_required' | 'approved' | 'rejected' | 'timeout' | 'denied' | 'failed',
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
    case 'append_to_rem':
      return `Append one child Rem at ${(request.args as AppendToRemArgs).position ?? 'end'}.`;
    case 'update_rem':
      return 'Replace target Rem text. Children stay untouched.';
    case 'move_rem':
      return `Move Rem to index ${(request.args as MoveRemArgs).index}.`;
    case 'create_rem_tree':
      return 'Create structured Rem tree from JSON.';
    case 'replace_rem':
      return 'Replace target Rem text.';
    case 'delete_rem':
      return 'Delete target Rem.';
    default:
      return 'Run RemNote bridge request.';
  }
}

async function buildApprovalRequest(
  plugin: RNPlugin,
  request: BridgeRequest,
  permissionMode: PermissionMode,
  timeoutMs: number,
  destructive: boolean
): Promise<PendingApprovalRequest> {
  const targetRemId = getRequestTargetRemId(request);
  const target =
    targetRemId && (request.tool === 'create_rem' || request.tool === 'create_rem_tree')
      ? await getRemApprovalContext(plugin, targetRemId, 'Parent', 'PARENT_NOT_FOUND')
      : targetRemId
        ? await getRemApprovalContext(plugin, targetRemId)
        : undefined;
  const hasChildren = target?.hasChildren;
  const deadline = new Date(Date.now() + timeoutMs).toISOString();
  let warning: string | undefined;

  if (request.tool === 'delete_rem') {
    warning = hasChildren
      ? 'This delete request targets a Rem with children. Recursive delete removes descendants.'
      : 'Delete permanently removes the target Rem.';
  } else if (request.tool === 'move_rem' && hasChildren) {
    warning = 'This move request moves a Rem with children.';
  } else if (request.tool === 'update_rem') {
    warning = 'This update replaces the visible text of the target Rem.';
  }

  return {
    id: request.id,
    tool: request.tool,
    args: request.args,
    permissionMode,
    requestedAt: new Date().toISOString(),
    timeoutDeadline: deadline,
    targetRemId,
    targetTitle: target?.title,
    hasChildren,
    previewMarkdown: getRequestPreviewMarkdown(request),
    riskLevel: destructive ? 'destructive' : 'safe_write',
    summary: approvalSummary(request),
    ...(warning ? { warning } : {}),
    ...(request.tool === 'delete_rem' ? { confirmTextRequired: 'DELETE' as const } : {}),
  };
}

async function shouldForceApproval(plugin: RNPlugin, request: BridgeRequest): Promise<boolean> {
  if (request.tool !== 'move_rem') {
    return false;
  }

  const context = await getRemApprovalContext(plugin, request.args.remId);
  return context.hasChildren;
}

export async function handleBridgeRequest(
  plugin: RNPlugin,
  request: BridgeRequest,
  context: BridgeHandlerContext
): Promise<BridgeResponse> {
  const startedAt = Date.now();
  let approvalStatus: 'not_required' | 'approved' | 'rejected' | 'timeout' | 'denied' | 'failed' =
    'not_required';
  const decision = getPermissionDecision(context.permissionMode, request.tool);

  if (!decision.allowed) {
    approvalStatus = 'denied';
    const response = createBridgeFailure(request.id, 'PERMISSION_DENIED', decision.reason);
    logBridgeResponse(request, context.permissionMode, approvalStatus, response, startedAt);
    return response;
  }

  let approvalRequired = decision.approvalRequired;
  try {
    approvalRequired = approvalRequired || (await shouldForceApproval(plugin, request));
  } catch (error: unknown) {
    const response = mapSdkError(request.id, error);
    logBridgeResponse(request, context.permissionMode, 'failed', response, startedAt);
    return response;
  }

  if (approvalRequired) {
    let approval: ApprovalResolution;
    try {
      const timeoutMs = request.timeoutMs
        ? Math.min(request.timeoutMs, WRITE_APPROVAL_TIMEOUT_MS)
        : WRITE_APPROVAL_TIMEOUT_MS;
      approval = await withApprovalTimeout(
        await buildApprovalRequest(plugin, request, context.permissionMode, timeoutMs, decision.destructive),
        context.requestApproval,
        timeoutMs
      );
    } catch (error: unknown) {
      if (error instanceof RemnoteWriteError) {
        const response = mapSdkError(request.id, error);
        logBridgeResponse(request, context.permissionMode, 'failed', response, startedAt);
        return response;
      }

      const message = error instanceof Error ? error.message : String(error);
      const response = createBridgeFailure(request.id, 'INTERNAL_ERROR', 'Approval handling failed.', {
        message,
      });
      logBridgeResponse(request, context.permissionMode, approvalStatus, response, startedAt);
      return response;
    }

    if (approval === 'APPROVAL_TIMEOUT') {
      approvalStatus = 'timeout';
      const response = createBridgeFailure(request.id, 'APPROVAL_TIMEOUT', 'User did not approve the request before timeout.');
      logBridgeResponse(request, context.permissionMode, approvalStatus, response, startedAt);
      return response;
    }

    if (approval !== 'APPROVED') {
      approvalStatus = 'rejected';
      const response = createBridgeFailure(
        request.id,
        'APPROVAL_REJECTED',
        'User rejected the request.'
      );
      logBridgeResponse(request, context.permissionMode, approvalStatus, response, startedAt);
      return response;
    }

    approvalStatus = 'approved';
  }

  try {
    let response: BridgeResponse;
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
      case 'create_rem':
        response = createBridgeSuccess(request, await createRemFromMarkdown(plugin, request.args));
        break;
      case 'append_to_rem':
        response = createBridgeSuccess(request, await appendMarkdownToRem(plugin, request.args));
        break;
      case 'update_rem':
        response = createBridgeSuccess(request, await updateRemMarkdown(plugin, request.args));
        break;
      case 'move_rem':
        response = createBridgeSuccess(request, await moveRem(plugin, request.args));
        break;
      case 'create_rem_tree':
        response = createBridgeSuccess(request, await createRemTree(plugin, request.args));
        break;
      case 'replace_rem':
        response = createBridgeSuccess(request, await replaceRemMarkdown(plugin, request.args));
        break;
      case 'delete_rem':
        response = createBridgeSuccess(request, await deleteRem(plugin, request.args));
        break;
      default:
        response = createBridgeFailure('unknown', 'UNKNOWN_TOOL', 'Unknown bridge tool.');
        break;
    }
    logBridgeResponse(request, context.permissionMode, approvalStatus, response, startedAt);
    return response;
  } catch (error: unknown) {
    const response = mapSdkError(request.id, error);
    logBridgeResponse(request, context.permissionMode, approvalStatus, response, startedAt);
    return response;
  }
}
