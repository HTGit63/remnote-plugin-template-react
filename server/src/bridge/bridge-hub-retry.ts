import { createHash } from 'node:crypto';
import type {
  BridgeErrorCode,
  BridgeResponse,
  BridgeLifecycleEvent,
  BridgeLifecyclePhase,
  BridgeToolName,
} from '../../../shared/bridge/protocol';
import {
  BRIDGE_TOOL_ANNOTATIONS,
  createBridgeFailure,
} from '../../../shared/bridge/protocol';
import {
  TRANSIENT_BRIDGE_ERRORS,
  isRecord,
} from './bridge-hub-types';

export function isTransientFailure(response: BridgeResponse): boolean {
  return !response.ok && TRANSIENT_BRIDGE_ERRORS.has(response.error.code);
}

export function hasLifecyclePhase(lifecycle: readonly BridgeLifecycleEvent[] | undefined, phase: BridgeLifecyclePhase): boolean {
  return Boolean(lifecycle?.some((event) => event.phase === phase));
}

export function requestReachedPlugin(response: BridgeResponse): boolean {
  return hasLifecyclePhase(response.lifecycle, 'executing') || hasLifecyclePhase(response.lifecycle, 'waiting_for_remnote_approval');
}

export function hasIdempotencyKey(args: unknown): boolean {
  return Boolean(getIdempotencyKey(args));
}

export function getIdempotencyKey(args: unknown): string | undefined {
  if (!isRecord(args)) {
    return undefined;
  }
  if (typeof args.idempotencyKey === 'string' && args.idempotencyKey.trim()) {
    return args.idempotencyKey.trim();
  }
  if (isRecord(args.safetyOptions) && typeof args.safetyOptions.idempotencyKey === 'string') {
    return args.safetyOptions.idempotencyKey.trim() || undefined;
  }
  return undefined;
}

export function isHighLevelIdempotentWrite(tool: BridgeToolName): boolean {
  return [
    'apply_structured_note_batch',
    'create_polished_note_tree',
    'create_styled_rem_tree',
    'create_or_replace_note_from_markdown',
    'apply_style_plan',
    'apply_remnote_command',
    'delete_rem_by_id',
  ].includes(tool);
}

export function targetRootFromArgs(args: unknown): string | undefined {
  if (!isRecord(args)) {
    return undefined;
  }
  for (const key of ['parentId', 'rootRemId', 'remId', 'targetRoot', 'expectedAncestorId', 'expectedParentId']) {
    const value = args[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

export function requestHash(tool: BridgeToolName, args: unknown): string {
  return createHash('sha256').update(JSON.stringify({ tool, args })).digest('hex');
}

export function isDeleteTool(tool: BridgeToolName): boolean {
  return tool === 'delete_rem_by_id';
}

export function isRealDeleteAttempt(tool: BridgeToolName, args: unknown): boolean {
  if (tool === 'delete_rem_by_id') {
    return isRecord(args) && args.dryRun === false;
  }

  return false;
}

export function retryableFailure(
  tool: BridgeToolName,
  response: BridgeResponse,
  code: BridgeErrorCode,
  message: string,
  recommendation: string
): BridgeResponse {
  if (response.ok) {
    return response;
  }

  const lifecycle = response.lifecycle ?? [];
  return createBridgeFailure(
    response.id,
    code,
    message,
    {
      retryable: true,
      errorCode: code,
      originalErrorCode: response.error.code,
      requestId: response.id,
      tool,
      lifecycle,
      recommendation,
      originalError: response.error,
    },
    lifecycle
  );
}

export function retryableOriginalFailure(tool: BridgeToolName, response: BridgeResponse): BridgeResponse {
  if (response.ok) {
    return response;
  }

  const retryKind = BRIDGE_TOOL_ANNOTATIONS[tool].readOnlyHint
    ? 'Retry the read after the RemNote plugin reconnects.'
    : isDeleteTool(tool)
      ? 'Run a fresh dry-run preview, then re-check the target before any real delete retry.'
      : 'Reconnect the RemNote plugin and retry only when the operation is idempotent or you verified no write occurred.';

  return retryableFailure(tool, response, response.error.code, response.error.message, retryKind);
}

export function retryableUnknownWriteFailure(tool: BridgeToolName, response: BridgeResponse): BridgeResponse {
  return retryableFailure(
    tool,
    response,
    'RETRYABLE_UNKNOWN_WRITE_STATUS',
    'The write may have reached RemNote before the bridge connection ended.',
    'Re-check the target Rem state before retrying; retry only with the same idempotencyKey when one was supplied.'
  );
}

export function retryableUnknownDeleteFailure(tool: BridgeToolName, response: BridgeResponse): BridgeResponse {
  return retryableFailure(
    tool,
    response,
    'RETRYABLE_UNKNOWN_DELETE_STATUS',
    'The delete status is unknown because the bridge connection ended during the request.',
    'Run a fresh dry-run preview or get_rem on the target ID before attempting any real delete again.'
  );
}
