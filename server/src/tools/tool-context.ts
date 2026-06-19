import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type {
  BridgeFailure,
  BridgeLifecycleEvent,
  BridgeResponse,
  BridgeToolAnnotations,
  BridgeToolArgs,
  BridgeToolName,
} from '../../../shared/bridge/protocol.js';
import { BRIDGE_TOOL_ANNOTATIONS } from '../../../shared/bridge/protocol.js';
import type { BridgeHub } from '../bridge-hub.js';
import type { AuthenticatedPrincipal } from '../auth/types.js';
import type { BridgeRuntimeInfo } from '../config.js';
import type { getToolRegistrySummary } from '../tool-registry.js';
import type { ToolProfile } from '../tool-policy.js';
import { publicMcpToolNameForBridgeTool } from '../mcp-tool-map.js';
import { getToolPerformanceBudgetMs } from '../performance/tool-budgets.js';

export type McpToolResult = {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
};

export type StandardToolStatus =
  | 'PASS'
  | 'FAIL'
  | 'PARTIAL'
  | 'GATED'
  | 'UNSUPPORTED'
  | 'SKIPPED'
  | 'BLOCKED_BY_PERMISSION'
  | 'BLOCKED_BY_PROFILE'
  | 'PLATFORM_BLOCKED';

export type CallPluginFunction = <TTool extends BridgeToolName>(
  tool: TTool,
  args: BridgeToolArgs[TTool],
  timeoutMs?: number,
) => Promise<BridgeResponse>;

type RegisterToolArgs = Parameters<McpServer['registerTool']>;
export type RegisterToolFunction = McpServer['registerTool'];
export type ToolRegistrySnapshot = ReturnType<typeof getToolRegistrySummary>;

export interface ToolRegistrationContext {
  hub: BridgeHub;
  registerTool: RegisterToolFunction;
  callPlugin: CallPluginFunction;
  currentRegistry: () => ToolRegistrySnapshot;
  exposeDeleteTool: boolean;
  requestSignal?: AbortSignal;
  runtimeInfo?: BridgeRuntimeInfo;
  toolProfile?: ToolProfile;
  principal?: AuthenticatedPrincipal;
}

export function annotationsFor(tool: BridgeToolName): BridgeToolAnnotations {
  return BRIDGE_TOOL_ANNOTATIONS[tool];
}

export function defaultTimeoutForTool(tool: BridgeToolName): number {
  const annotations = annotationsFor(tool);
  const budgetMs = getToolPerformanceBudgetMs(publicMcpToolNameForBridgeTool(tool));
  const baseTimeoutMs = Math.max(budgetMs + 5000, 6000);
  if (annotations.destructiveHint === true) {
    return Math.max(baseTimeoutMs, 60000);
  }

  if (
    [
      'apply_structured_note_batch',
      'create_styled_rem_tree',
      'create_polished_note_tree',
      'create_or_replace_note_from_markdown',
      'create_note_from_markdown_tree',
      'append_markdown_as_rem_tree',
      'create_designed_note_tree',
      'update_note_with_design',
      'repair_note_design',
      'create_card_set_from_note',
      'create_flashcards_from_markdown',
      'create_cloze_cards_from_note',
      'repair_card_set',
    ].includes(tool)
  ) {
    return Math.max(baseTimeoutMs, 60000);
  }

  if (annotations.readOnlyHint === true) {
    return Math.max(baseTimeoutMs, 12000);
  }

  return Math.max(baseTimeoutMs, 45000);
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

function firstString(...values: unknown[]): string | undefined {
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0);
}

function phaseDurationsFromLifecycle(lifecycle: readonly BridgeLifecycleEvent[] = []): Record<string, number> {
  const phaseDurations: Record<string, number> = {};
  for (let index = 1; index < lifecycle.length; index += 1) {
    const previous = lifecycle[index - 1];
    const current = lifecycle[index];
    const previousAt = Date.parse(previous.at);
    const currentAt = Date.parse(current.at);
    if (!Number.isFinite(previousAt) || !Number.isFinite(currentAt) || currentAt < previousAt) {
      continue;
    }
    const key = `${previous.phase}_to_${current.phase}`;
    phaseDurations[key] = (phaseDurations[key] ?? 0) + currentAt - previousAt;
  }
  if (lifecycle.length >= 2) {
    const firstAt = Date.parse(lifecycle[0].at);
    const lastAt = Date.parse(lifecycle[lifecycle.length - 1].at);
    if (Number.isFinite(firstAt) && Number.isFinite(lastAt) && lastAt >= firstAt) {
      phaseDurations.total = lastAt - firstAt;
    }
  }
  return phaseDurations;
}

function statusFromFailure(failure: BridgeFailure, blockedByProfile = false): StandardToolStatus {
  if (blockedByProfile || failure.error.code === 'TOOL_HIDDEN_BY_PROFILE') {
    return 'BLOCKED_BY_PROFILE';
  }
  if (['PERMISSION_DENIED', 'INSUFFICIENT_SCOPE', 'TRUSTED_WRITE_REQUIRED', 'APPROVAL_REJECTED', 'APPROVAL_TIMEOUT'].includes(failure.error.code)) {
    return 'BLOCKED_BY_PERMISSION';
  }
  if (['SDK_UNSUPPORTED', 'TOOL_UNSUPPORTED'].includes(failure.error.code)) {
    return 'UNSUPPORTED';
  }
  if (['PLUGIN_NOT_CONNECTED', 'PLUGIN_NOT_PAIRED', 'NO_PAIRED_PLUGIN_SESSION', 'HOSTED_SESSION_MISSING', 'NO_ACTIVE_DEVICE', 'TIMEOUT', 'CLIENT_DISCONNECTED', 'REQUEST_CANCELLED'].includes(failure.error.code)) {
    return 'PLATFORM_BLOCKED';
  }
  return 'FAIL';
}

function statusFromResult(result: unknown): StandardToolStatus {
  const record = asRecord(result);
  const rawStatus = firstString(record?.status)?.toLowerCase() ?? '';
  if (record?.ok === false) {
    return rawStatus.includes('partial') ? 'PARTIAL' : 'FAIL';
  }
  if (rawStatus.includes('partial')) {
    return 'PARTIAL';
  }
  if (rawStatus.includes('unsupported')) {
    return 'UNSUPPORTED';
  }
  if (rawStatus.includes('blocked')) {
    return 'PLATFORM_BLOCKED';
  }
  if (rawStatus.includes('skipped')) {
    return 'SKIPPED';
  }
  return 'PASS';
}

function standardResponse(input: {
  ok: boolean;
  status: StandardToolStatus;
  operationId: string;
  toolName?: string;
  result?: unknown;
  error?: BridgeFailure['error'];
  lifecycle?: BridgeLifecycleEvent[];
  blockedByProfile?: boolean;
}) {
  const result = asRecord(input.result);
  const partialExecution = asRecord(result?.partialExecution);
  const idempotency = asRecord(result?.idempotency);
  const target = result?.target ?? {
    remId: result?.remId,
    parentId: result?.parentId,
    rootRemId: result?.rootRemId,
  };
  const created = Array.from(new Set([
    ...stringArray(result?.createdRemIds),
    ...stringArray(partialExecution?.createdRemIds),
    ...stringArray(result?.createdRemIdsBeforeError),
    ...stringArray(result?.rollbackRemovedRemIds),
    ...[firstString(result?.createdRemId, result?.rootCreatedRemId)].filter((value): value is string => Boolean(value)),
  ]));
  const updated = Array.from(new Set([
    ...stringArray(result?.updatedRemIds),
    ...[firstString(result?.updatedRemId)].filter((value): value is string => Boolean(value)),
  ]));
  const deleted = Array.from(new Set([
    ...stringArray(result?.deletedRemIds),
    ...[firstString(result?.deletedRemId)].filter((value): value is string => Boolean(value)),
  ]));
  const counts = {
    created: created.length,
    updated: updated.length,
    deleted: deleted.length,
    nodes: typeof result?.nodeCount === 'number'
      ? result.nodeCount
      : typeof result?.createdNodeCount === 'number'
        ? result.createdNodeCount
        : undefined,
  };
  return {
    status: input.status,
    toolName: input.toolName ?? firstString(result?.toolName) ?? 'unknown',
    operationId: input.operationId,
    idempotency: firstString(result?.idempotencyKey, idempotency?.key),
    target,
    created,
    updated,
    deleted,
    counts,
    verification: result?.verification,
    error: input.error,
    phaseDurations: phaseDurationsFromLifecycle(input.lifecycle),
    warnings: stringArray(result?.warnings),
    blockedByProfile: input.blockedByProfile,
  };
}

export function failureToToolResult(failure: BridgeFailure, toolName?: string, blockedByProfile = false): McpToolResult {
  const failureToolName = toolName ?? (failure as { toolName?: string }).toolName;
  const standard = standardResponse({
    ok: false,
    status: statusFromFailure(failure, blockedByProfile),
    operationId: failure.id,
    toolName: failureToolName,
    error: failure.error,
    lifecycle: failure.lifecycle,
    blockedByProfile,
  });
  return {
    isError: true,
    content: [
      {
        type: 'text',
        text: `${failure.error.code}: ${failure.error.message}`,
      },
    ],
    structuredContent: {
      ok: false,
      ...standard,
      error: failure.error,
      lifecycle: failure.lifecycle ?? [],
      standard,
    },
  };
}

export function internalErrorToToolResult(error: unknown): McpToolResult {
  const message = error instanceof Error ? error.message : String(error);
  console.error('MCP bridge tool failed:', message);
  return failureToToolResult({
    id: 'unknown',
    ok: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Bridge tool call failed internally.',
      details: {
        message,
      },
    },
  });
}

export function successToToolResult(response: BridgeResponse, message: string): McpToolResult {
  if (!response.ok) {
    return failureToToolResult(response);
  }

  const standard = standardResponse({
    ok: true,
    status: statusFromResult(response.result),
    operationId: response.id,
    result: response.result,
    lifecycle: response.lifecycle,
  });
  return {
    content: [
      {
        type: 'text',
        text: message,
      },
    ],
    structuredContent: {
      ok: true,
      ...standard,
      result: response.result,
      lifecycle: response.lifecycle ?? [],
      standard,
    },
  };
}

export async function bridgeToolResult(
  call: () => Promise<BridgeResponse>,
  successMessage: string,
): Promise<McpToolResult> {
  try {
    return successToToolResult(await call(), successMessage);
  } catch (error) {
    return internalErrorToToolResult(error);
  }
}
