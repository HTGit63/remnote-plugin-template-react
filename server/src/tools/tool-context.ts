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
import { DEFAULT_TIMEOUT_BUDGETS, type BridgeRuntimeInfo, type BridgeTimeoutBudgets } from '../config.js';
import type { StorageProvider } from '../storage/types.js';
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

export type RetryClassification =
  | 'already_applied'
  | 'retryable_unknown'
  | 'partial'
  | 'failed';

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
  timeoutBudgets?: BridgeTimeoutBudgets;
  toolProfile?: ToolProfile;
  principal?: AuthenticatedPrincipal;
  storage?: StorageProvider;
}

export function annotationsFor(tool: BridgeToolName): BridgeToolAnnotations {
  return BRIDGE_TOOL_ANNOTATIONS[tool];
}

export type WriteTimeoutEstimateInput = {
  tool: BridgeToolName;
  args?: unknown;
  nodeCount?: number;
  charCount?: number;
  hasVerification?: boolean;
  isBulkImportStep?: boolean;
  requestedTimeoutMs?: number;
  budgets?: BridgeTimeoutBudgets;
};

const HIGH_LEVEL_WRITE_TOOLS = new Set<BridgeToolName>([
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
]);

function numberFromRecord(record: Record<string, unknown> | undefined, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record?.[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }
  return undefined;
}

function estimateChars(value: unknown): number {
  if (typeof value === 'string') {
    return value.length;
  }
  if (Array.isArray(value)) {
    return value.reduce<number>((sum, item) => sum + estimateChars(item), 0);
  }
  const record = asRecord(value);
  if (!record) {
    return 0;
  }
  return Object.values(record).reduce<number>((sum, item) => sum + estimateChars(item), 0);
}

function estimateNodes(value: unknown): number {
  if (!value || typeof value !== 'object') {
    return 0;
  }
  if (Array.isArray(value)) {
    return value.reduce<number>((sum, item) => sum + estimateNodes(item), 0);
  }
  const record = value as Record<string, unknown>;
  const childValues = [
    record.children,
    record.items,
    record.choices,
    record.root,
    record.note,
    record.tree,
  ];
  const children = childValues.reduce<number>((sum, item) => sum + estimateNodes(item), 0);
  return children + (record.title || record.text || record.markdown || record.markdownText ? 1 : 0);
}

function clampTimeout(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) {
    return minimum;
  }
  return Math.min(Math.max(Math.floor(value), minimum), maximum);
}

export function estimateWriteTimeoutMs(input: WriteTimeoutEstimateInput): number {
  const budgets = input.budgets ?? DEFAULT_TIMEOUT_BUDGETS;
  const annotations = annotationsFor(input.tool);
  const argsRecord = asRecord(input.args);
  const requestedTimeoutMs =
    input.requestedTimeoutMs ??
    numberFromRecord(argsRecord, 'timeoutMs', 'requestedTimeoutMs');
  const charCount = input.charCount ?? numberFromRecord(argsRecord, 'charCount') ?? estimateChars(input.args);
  const nodeCount = input.nodeCount ?? numberFromRecord(argsRecord, 'nodeCount', 'maxNodeCount') ?? estimateNodes(input.args);
  const hasVerification =
    input.hasVerification ??
    (Boolean(argsRecord?.verifyAfterWrite) ||
      Boolean(asRecord(argsRecord?.safetyOptions)?.verifyAfterWrite));
  const isBulkImportStep =
    input.isBulkImportStep ??
    (Boolean(argsRecord?.isBulkImportStep) ||
      Boolean(argsRecord?.jobId) ||
      Boolean(argsRecord?.chunkId));

  if (requestedTimeoutMs !== undefined) {
    return clampTimeout(requestedTimeoutMs, 1000, 300000);
  }

  const budgetMs = getToolPerformanceBudgetMs(publicMcpToolNameForBridgeTool(input.tool));
  const baseTimeoutMs = Math.max(budgetMs + 5000, 6000);
  if (annotations.destructiveHint === true) {
    return Math.max(baseTimeoutMs, budgets.writeApprovalTimeoutMs, budgets.mutationTimeoutMs);
  }

  if (isBulkImportStep) {
    const adaptiveMs =
      budgets.mutationTimeoutMs +
      Math.ceil(charCount / 1000) * 600 +
      Math.ceil(nodeCount / 10) * 1000 +
      (hasVerification ? 20000 : 0);
    return clampTimeout(adaptiveMs, budgets.bulkStepTimeoutMs, 300000);
  }

  if (HIGH_LEVEL_WRITE_TOOLS.has(input.tool)) {
    const adaptiveMs =
      budgets.mutationTimeoutMs +
      Math.ceil(charCount / 2000) * 500 +
      Math.ceil(nodeCount / 25) * 1000 +
      (hasVerification ? 15000 : 0);
    return clampTimeout(adaptiveMs, budgets.highLevelWriteTimeoutMs, 300000);
  }

  if (annotations.readOnlyHint === true) {
    return Math.max(baseTimeoutMs, budgets.readTimeoutMs);
  }

  return Math.max(baseTimeoutMs, budgets.mutationTimeoutMs);
}

export function defaultTimeoutForTool(
  tool: BridgeToolName,
  args?: unknown,
  budgets?: BridgeTimeoutBudgets
): number {
  return estimateWriteTimeoutMs({ tool, args, budgets });
}

export function legacyDefaultTimeoutForTool(tool: BridgeToolName): number {
  const annotations = annotationsFor(tool);
  const budgetMs = getToolPerformanceBudgetMs(publicMcpToolNameForBridgeTool(tool));
  const baseTimeoutMs = Math.max(budgetMs + 5000, 6000);
  if (annotations.destructiveHint === true) {
    return Math.max(baseTimeoutMs, 60000);
  }

  if (HIGH_LEVEL_WRITE_TOOLS.has(tool)) {
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

function numberRecord(value: unknown): Record<string, number> {
  const record = asRecord(value);
  if (!record) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(record).filter((entry): entry is [string, number] => typeof entry[1] === 'number')
  );
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
      phaseDurations.totalMs = phaseDurations.total;
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
  if (['PLUGIN_NOT_CONNECTED', 'PLUGIN_NOT_PAIRED', 'NO_PAIRED_PLUGIN_SESSION', 'HOSTED_SESSION_MISSING', 'CODEX_PAIRING_REQUIRED', 'NO_ACTIVE_DEVICE', 'TIMEOUT', 'CLIENT_DISCONNECTED', 'REQUEST_CANCELLED', 'RETRYABLE_UNKNOWN_WRITE_STATUS', 'RETRYABLE_UNKNOWN_DELETE_STATUS'].includes(failure.error.code)) {
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
  if (rawStatus.includes('failed') || rawStatus.includes('fail')) {
    return 'FAIL';
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

function verificationFromResult(result: Record<string, unknown> | undefined) {
  const verification = asRecord(result?.verification);
  if (!verification) {
    return {
      attempted: false,
      passed: undefined,
      method: undefined,
      warnings: stringArray(result?.warnings),
    };
  }
  return {
    attempted: verification.attempted ?? true,
    passed: verification.passed ?? verification.ok,
    method: verification.method,
    warnings: stringArray(verification.warnings).concat(stringArray(result?.warnings)),
    ...verification,
  };
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
  const targetRecord = asRecord(result?.target);
  const idempotencyKey = firstString(result?.idempotencyKey, idempotency?.key);
  const rawStatus = firstString(result?.status)?.toLowerCase();
  const idempotencyResult = firstString(
    result?.idempotencyResult,
    idempotency?.status,
    rawStatus === 'already_applied' ? 'already_applied' : undefined
  );
  const idempotencyReplay = idempotencyResult === 'already_applied';
  const lifecycleDurations = phaseDurationsFromLifecycle(input.lifecycle);
  const resultDurations = {
    ...numberRecord(result?.phaseDurations),
    ...numberRecord(result?.phaseDurationsMs),
  };
  const phaseDurations = {
    ...resultDurations,
    ...lifecycleDurations,
  };
  if (typeof phaseDurations.totalMs !== 'number') {
    phaseDurations.totalMs = phaseDurations.total ?? resultDurations.total ?? 0;
  }
  if (typeof phaseDurations.total !== 'number') {
    phaseDurations.total = phaseDurations.totalMs;
  }
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
  const mutationCreated = idempotencyReplay ? [] : created;
  const mutationUpdated = idempotencyReplay ? [] : updated;
  const mutationDeleted = idempotencyReplay ? [] : deleted;
  const counts = {
    created: mutationCreated.length,
    updated: mutationUpdated.length,
    deleted: mutationDeleted.length,
    nodes: typeof result?.nodeCount === 'number'
      ? result.nodeCount
      : typeof result?.createdNodeCount === 'number'
        ? result.createdNodeCount
        : undefined,
  };
  const targetRemId = firstString(
    result?.targetRemId,
    result?.remId,
    result?.rootRemId,
    result?.createdRemId,
    result?.rootCreatedRemId,
    targetRecord?.targetRemId,
    targetRecord?.remId,
    targetRecord?.rootRemId
  );
  const parentRemId = firstString(
    result?.parentRemId,
    result?.parentId,
    targetRecord?.parentRemId,
    targetRecord?.parentId
  );
  const errorCode = firstString(input.error?.code, result?.errorCode);
  const errorMessage = firstString(input.error?.message, result?.errorMessage);
  const errorRecord = asRecord(input.error);
  const retryable = typeof errorRecord?.retryable === 'boolean'
    ? errorRecord.retryable
    : typeof result?.retryable === 'boolean'
      ? result.retryable
      : undefined;
  const retryClassification: RetryClassification | undefined =
    idempotencyReplay
      ? 'already_applied'
      : errorCode === 'RETRYABLE_UNKNOWN_WRITE_STATUS' || errorCode === 'RETRYABLE_UNKNOWN_DELETE_STATUS'
        ? 'retryable_unknown'
        : input.status === 'PARTIAL' || partialExecution || rawStatus?.includes('partial')
          ? 'partial'
          : input.status === 'FAIL'
            ? 'failed'
            : undefined;
  return {
    status: input.status,
    toolName: input.toolName ?? firstString(result?.toolName) ?? 'unknown',
    operationId: input.operationId,
    idempotency: idempotencyKey,
    idempotencyKey,
    idempotencyResult,
    targetRemId,
    parentRemId,
    target,
    created: mutationCreated,
    updated: mutationUpdated,
    deleted: mutationDeleted,
    createdRemIds: mutationCreated,
    updatedRemIds: mutationUpdated,
    deletedRemIds: mutationDeleted,
    counts,
    verification: verificationFromResult(result),
    error: input.error,
    errorCode,
    errorMessage,
    retryable,
    retryClassification,
    phaseDurations,
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
