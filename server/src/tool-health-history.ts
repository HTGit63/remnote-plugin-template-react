export type ToolHistoryEventKind =
  | 'success'
  | 'failure'
  | 'partial_failure'
  | 'sdk_unsupported'
  | 'gateway_block'
  | 'tier_block'
  | 'scope_block'
  | 'health_check';

export interface ToolHistoryEvent {
  tool: string;
  kind: ToolHistoryEventKind;
  at?: string;
  durationMs?: number;
  errorCode?: string;
  gatewayBlocked?: boolean;
  blockedByTier?: boolean;
  blockedByScope?: boolean;
  sdkUnsupported?: boolean;
  partialFailure?: boolean;
  source?: 'bridge' | 'mcp_gateway' | 'health_check';
}

export interface ToolHistoryEntry {
  name: string;
  lastEventAt: string | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastErrorCode: string | null;
  successCount: number;
  failureCount: number;
  partialFailureCount: number;
  gatewayBlockCount: number;
  tierBlockCount: number;
  scopeBlockCount: number;
  sdkUnsupportedCount: number;
  observedCount: number;
  averageDurationMs: number | null;
  lastBenchmarkRunAt: string | null;
  lastBenchmarkStatus: string | null;
}

const MAX_RECENT_TOOL_EVENTS = 200;
const history = new Map<string, ToolHistoryEntry & { totalDurationMs: number; durationCount: number }>();
const recentEvents: Array<ToolHistoryEvent & { at: string; source: NonNullable<ToolHistoryEvent['source']> }> = [];

function emptyEntry(tool: string): ToolHistoryEntry & { totalDurationMs: number; durationCount: number } {
  return {
    name: tool,
    lastEventAt: null,
    lastSuccessAt: null,
    lastFailureAt: null,
    lastErrorCode: null,
    successCount: 0,
    failureCount: 0,
    partialFailureCount: 0,
    gatewayBlockCount: 0,
    tierBlockCount: 0,
    scopeBlockCount: 0,
    sdkUnsupportedCount: 0,
    observedCount: 0,
    averageDurationMs: null,
    lastBenchmarkRunAt: null,
    lastBenchmarkStatus: null,
    totalDurationMs: 0,
    durationCount: 0,
  };
}

export function recordToolHistoryEvent(event: ToolHistoryEvent) {
  const at = event.at ?? new Date().toISOString();
  const entry = history.get(event.tool) ?? emptyEntry(event.tool);
  entry.lastEventAt = at;
  entry.observedCount += 1;

  if (typeof event.durationMs === 'number' && Number.isFinite(event.durationMs)) {
    entry.totalDurationMs += event.durationMs;
    entry.durationCount += 1;
    entry.averageDurationMs = Math.round(entry.totalDurationMs / entry.durationCount);
  }

  if (event.kind === 'success') {
    entry.successCount += 1;
    entry.lastSuccessAt = at;
  }

  if (event.kind === 'failure') {
    entry.failureCount += 1;
    entry.lastFailureAt = at;
    entry.lastErrorCode = event.errorCode ?? entry.lastErrorCode;
  }

  if (event.kind === 'partial_failure' || event.partialFailure) {
    entry.partialFailureCount += 1;
  }

  if (event.kind === 'gateway_block' || event.gatewayBlocked) {
    entry.gatewayBlockCount += 1;
    entry.lastFailureAt = at;
    entry.lastErrorCode = event.errorCode ?? entry.lastErrorCode;
  }

  if (event.kind === 'tier_block' || event.blockedByTier) {
    entry.tierBlockCount += 1;
  }

  if (event.kind === 'scope_block' || event.blockedByScope) {
    entry.scopeBlockCount += 1;
  }

  if (event.kind === 'sdk_unsupported' || event.sdkUnsupported) {
    entry.sdkUnsupportedCount += 1;
    entry.lastFailureAt = at;
    entry.lastErrorCode = event.errorCode ?? 'SDK_UNSUPPORTED';
  }

  if (event.kind === 'health_check') {
    entry.lastBenchmarkRunAt = at;
    entry.lastBenchmarkStatus = event.errorCode ?? 'checked';
  }

  history.set(event.tool, entry);
  recentEvents.unshift({
    tool: event.tool,
    kind: event.kind,
    at,
    gatewayBlocked: Boolean(event.gatewayBlocked),
    blockedByTier: Boolean(event.blockedByTier),
    blockedByScope: Boolean(event.blockedByScope),
    sdkUnsupported: Boolean(event.sdkUnsupported),
    partialFailure: Boolean(event.partialFailure),
    source: event.source ?? 'bridge',
    ...(typeof event.durationMs === 'number' ? { durationMs: event.durationMs } : {}),
    ...(event.errorCode ? { errorCode: event.errorCode } : {}),
  });
  if (recentEvents.length > MAX_RECENT_TOOL_EVENTS) {
    recentEvents.length = MAX_RECENT_TOOL_EVENTS;
  }
}

export function getToolHistoryEntry(tool: string): ToolHistoryEntry {
  const entry = history.get(tool) ?? emptyEntry(tool);
  const { totalDurationMs: _totalDurationMs, durationCount: _durationCount, ...publicEntry } = entry;
  return publicEntry;
}

export function getToolHistorySnapshot() {
  return {
    toolHistory: Object.fromEntries([...history.keys()].sort().map((tool) => [tool, getToolHistoryEntry(tool)])),
    recentToolEvents: recentEvents.map((event) => ({ ...event })),
  };
}
