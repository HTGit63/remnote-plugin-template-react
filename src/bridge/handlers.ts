import type { RNPlugin } from '@remnote/plugin-sdk';
import {
  type AppendToRemArgs,
  type BridgeRequest,
  type BridgeResponse,
  type BridgeToolArgs,
  type BridgeToolName,
  type CreateRemArgs,
  type DeleteRemArgs,
  type GetRemArgs,
  type GetRemTreeArgs,
  type PendingApprovalRequest,
  type PermissionMode,
  type ReplaceRemArgs,
  createBridgeFailure,
  createBridgeSuccess,
  isBridgeToolName,
} from './protocol';
import { getPermissionDecision } from '../remnote/permissions';
import { getFocusedRemStatus, readFocusedRem, readRem, readRemTree } from '../remnote/read';
import {
  appendMarkdownToRem,
  createRemFromMarkdown,
  deleteRem,
  replaceRemMarkdown,
  RemnoteWriteError,
} from '../remnote/write';

const MAX_REQUEST_ID_CHARS = 128;
const MAX_REM_ID_CHARS = 256;
const MAX_MARKDOWN_CHARS = 20000;
const DEFAULT_APPROVAL_TIMEOUT_MS = 90000;

export interface BridgeHandlerContext {
  permissionMode: PermissionMode;
  requestApproval: (request: PendingApprovalRequest) => Promise<boolean>;
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
    case 'create_rem':
      return {
        parentId: optionalParentId(args),
        markdown: requiredMarkdown(args),
      } as BridgeToolArgs[TTool];
    case 'append_to_rem':
      return {
        remId: requiredRemId(args),
        markdown: requiredMarkdown(args),
      } as BridgeToolArgs[TTool];
    case 'replace_rem':
      return {
        remId: requiredRemId(args),
        markdown: requiredMarkdown(args),
      } as BridgeToolArgs[TTool];
    case 'delete_rem':
      return {
        remId: requiredRemId(args),
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
    GetRemArgs & AppendToRemArgs & ReplaceRemArgs & DeleteRemArgs & CreateRemArgs
  >;
  if (typeof args.remId === 'string') {
    return args.remId;
  }
  return typeof args.parentId === 'string' ? args.parentId : undefined;
}

function getRequestPreviewMarkdown(request: BridgeRequest): string | undefined {
  const args = request.args as Partial<CreateRemArgs & AppendToRemArgs & ReplaceRemArgs>;
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
  return typeof result.createdRemId === 'string' ? result.createdRemId : undefined;
}

function logBridgeResponse(
  request: BridgeRequest,
  permissionMode: PermissionMode,
  approvalStatus: 'not_required' | 'approved' | 'rejected' | 'denied',
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
  approve: (request: PendingApprovalRequest) => Promise<boolean>,
  timeoutMs: number
): Promise<boolean> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<boolean>((resolve) => {
    timeoutId = setTimeout(() => resolve(false), timeoutMs);
  });

  const result = await Promise.race([approve(request), timeout]);
  if (timeoutId) {
    clearTimeout(timeoutId);
  }

  return result;
}

export async function handleBridgeRequest(
  plugin: RNPlugin,
  request: BridgeRequest,
  context: BridgeHandlerContext
): Promise<BridgeResponse> {
  const startedAt = Date.now();
  let approvalStatus: 'not_required' | 'approved' | 'rejected' | 'denied' = 'not_required';
  const decision = getPermissionDecision(context.permissionMode, request.tool);

  if (!decision.allowed) {
    approvalStatus = 'denied';
    const response = createBridgeFailure(request.id, 'PERMISSION_DENIED', decision.reason);
    logBridgeResponse(request, context.permissionMode, approvalStatus, response, startedAt);
    return response;
  }

  if (decision.approvalRequired) {
    let approved: boolean;
    try {
      approved = await withApprovalTimeout(
        {
          id: request.id,
          tool: request.tool,
          args: request.args,
          permissionMode: context.permissionMode,
          requestedAt: new Date().toISOString(),
          targetRemId: getRequestTargetRemId(request),
          previewMarkdown: getRequestPreviewMarkdown(request),
        },
        context.requestApproval,
        request.timeoutMs ?? DEFAULT_APPROVAL_TIMEOUT_MS
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const response = createBridgeFailure(request.id, 'INTERNAL_ERROR', 'Approval handling failed.', {
        message,
      });
      logBridgeResponse(request, context.permissionMode, approvalStatus, response, startedAt);
      return response;
    }

    if (!approved) {
      approvalStatus = 'rejected';
      const response = createBridgeFailure(
        request.id,
        'APPROVAL_REJECTED',
        'User rejected or did not approve the request.'
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
      case 'create_rem':
        response = createBridgeSuccess(request, await createRemFromMarkdown(plugin, request.args));
        break;
      case 'append_to_rem':
        response = createBridgeSuccess(request, await appendMarkdownToRem(plugin, request.args));
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
