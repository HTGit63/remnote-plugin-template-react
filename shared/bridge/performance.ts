export type WritePerformanceBottleneckLayer =
  | 'model_payload'
  | 'mcp_transport'
  | 'server'
  | 'bridge_websocket'
  | 'remnote_sdk'
  | 'verification'
  | 'approval_wait';

export interface WritePerformanceBudgetMs {
  planning: number;
  singleWriteExecution: number;
  verification: number;
  total: number;
}

export interface WritePerformancePhaseDurationsMs {
  planning: number;
  singleWriteExecution: number;
  verification: number;
  total: number;
}

export interface WritePerformanceReport {
  status: 'success' | 'success_with_performance_warning';
  targetMs: number;
  budgetMs: WritePerformanceBudgetMs;
  phaseDurationsMs: WritePerformancePhaseDurationsMs;
  primaryToolCallCount: number;
  bridgeRequestCount?: number;
  sdkOperationCount?: number;
  fallbackUsed: boolean;
  fallbackReason?: string;
  bottleneckLayer?: WritePerformanceBottleneckLayer;
  warnings: string[];
}

export const DEFAULT_WRITE_PERFORMANCE_BUDGET_MS: WritePerformanceBudgetMs = {
  planning: 500,
  singleWriteExecution: 3000,
  verification: 1000,
  total: 5000,
};

function bottleneckForPhase(phase: keyof WritePerformancePhaseDurationsMs): WritePerformanceBottleneckLayer {
  switch (phase) {
    case 'planning':
      return 'server';
    case 'singleWriteExecution':
      return 'remnote_sdk';
    case 'verification':
      return 'verification';
    case 'total':
    default:
      return 'mcp_transport';
  }
}

export function buildWritePerformanceReport(input: {
  budgetMs?: Partial<WritePerformanceBudgetMs>;
  phaseDurationsMs: Partial<WritePerformancePhaseDurationsMs>;
  primaryToolCallCount?: number;
  bridgeRequestCount?: number;
  sdkOperationCount?: number;
  fallbackUsed?: boolean;
  fallbackReason?: string;
  bottleneckLayer?: WritePerformanceBottleneckLayer;
}): WritePerformanceReport {
  const budgetMs = {
    ...DEFAULT_WRITE_PERFORMANCE_BUDGET_MS,
    ...input.budgetMs,
  };
  const phaseDurationsMs: WritePerformancePhaseDurationsMs = {
    planning: Math.max(0, input.phaseDurationsMs.planning ?? 0),
    singleWriteExecution: Math.max(0, input.phaseDurationsMs.singleWriteExecution ?? 0),
    verification: Math.max(0, input.phaseDurationsMs.verification ?? 0),
    total: Math.max(0, input.phaseDurationsMs.total ?? 0),
  };
  if (phaseDurationsMs.total === 0) {
    phaseDurationsMs.total =
      phaseDurationsMs.planning +
      phaseDurationsMs.singleWriteExecution +
      phaseDurationsMs.verification;
  }

  const warnings: string[] = [];
  const exceeded = [
    ['planning', phaseDurationsMs.planning, budgetMs.planning] as const,
    ['singleWriteExecution', phaseDurationsMs.singleWriteExecution, budgetMs.singleWriteExecution] as const,
    ['verification', phaseDurationsMs.verification, budgetMs.verification] as const,
    ['total', phaseDurationsMs.total, budgetMs.total] as const,
  ].filter(([, actual, budget]) => actual > budget);

  for (const [phase, actual, budget] of exceeded) {
    warnings.push(`${phase} exceeded budget: ${actual}ms > ${budget}ms.`);
  }
  if (input.fallbackUsed && input.fallbackReason) {
    warnings.push(`fallback used: ${input.fallbackReason}`);
  }

  const worst = exceeded
    .map(([phase, actual, budget]) => ({ phase, ratio: budget > 0 ? actual / budget : 0 }))
    .sort((a, b) => b.ratio - a.ratio)[0];

  return {
    status: warnings.length ? 'success_with_performance_warning' : 'success',
    targetMs: budgetMs.total,
    budgetMs,
    phaseDurationsMs,
    primaryToolCallCount: input.primaryToolCallCount ?? 1,
    bridgeRequestCount: input.bridgeRequestCount,
    sdkOperationCount: input.sdkOperationCount,
    fallbackUsed: Boolean(input.fallbackUsed),
    fallbackReason: input.fallbackReason,
    bottleneckLayer: input.bottleneckLayer ?? (worst ? bottleneckForPhase(worst.phase) : undefined),
    warnings,
  };
}
