export type BridgeHealthCheckMode =
  | 'read_only'
  | 'safe_write'
  | 'mutation_on_disposable_rem'
  | 'destructive_on_disposable_rem';
export type BridgeHealthCheckToolStatus = 'passed' | 'failed' | 'skipped' | 'unsupported';
export type BridgeHealthCheckStatus = 'passed' | 'failed' | 'skipped' | 'partial';

export interface BridgeHealthCheckToolResult {
  tool: string;
  status: BridgeHealthCheckToolStatus;
  durationMs: number;
  bridgeTool?: string;
  reason?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface BridgeHealthCheckResult {
  id: string;
  status: BridgeHealthCheckStatus;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  connectedAtStart: boolean;
  mode: BridgeHealthCheckMode;
  includeWrites: boolean;
  includeExistingRemMutations: boolean;
  parentId?: string;
  targetRemId?: string;
  disposableSandboxRemId?: string;
  totalTools: number;
  passedCount: number;
  failedCount: number;
  skippedCount: number;
  unsupportedCount: number;
  results: BridgeHealthCheckToolResult[];
}
