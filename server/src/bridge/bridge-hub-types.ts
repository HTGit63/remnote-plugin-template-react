import type { WebSocket } from 'ws';
import type {
  BridgeLifecycleEvent,
  BridgeLifecyclePhase,
  BridgeResponse,
  BridgeToolName,
  BridgeErrorCode,
  BridgePluginRuntimeInfo,
} from '../../../shared/bridge/protocol.js';
import type { BridgeHealthCheckResult } from '../health-check-types.js';
import type { SessionRouter } from './session-router.js';
import type { BridgeTimeoutBudgets } from '../config.js';

export interface PendingRequest {
  resolve: (response: BridgeResponse) => void;
  timeout: NodeJS.Timeout;
  tool: BridgeToolName;
  status: 'pending' | 'waiting_for_remnote_approval';
  startedAt: number;
  timeoutMs: number;
  lifecycle: BridgeLifecycleEvent[];
  cleanupAbortListener?: () => void;
  targetSocket?: WebSocket;
  targetUserId?: string;
  idempotency?: {
    userId: string;
    tool: BridgeToolName;
    idempotencyKey: string;
    targetRoot?: string;
    requestHash: string;
    startedAt: string;
  };
}

export interface BridgeHubStatus {
  connected: boolean;
  lastConnectedAt?: string;
  lastDisconnectedAt?: string;
  pendingRequests: number;
  pluginRuntime?: BridgePluginRuntimeInfo | null;
  sdkVersion?: string;
  supportedSdkCapabilities?: BridgePluginRuntimeInfo['supportedSdkCapabilities'];
  unsupportedSdkCapabilities?: BridgePluginRuntimeInfo['unsupportedSdkCapabilities'];
  initialSyncComplete?: boolean;
  initialSyncTimedOut?: boolean;
  initialSyncWarning?: string;
}

export interface BridgeHubRequestSnapshot {
  id: string;
  tool: BridgeToolName;
  startedAt: string;
  ageMs: number;
  timeoutMs: number;
  status: 'pending' | 'waiting_for_remnote_approval';
}

export interface BridgeHubRequestOutcome {
  id: string;
  tool: BridgeToolName;
  mcpTool?: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  timeoutMs: number;
  status: 'completed' | 'failed' | 'timed_out' | 'cancelled';
  ok: boolean;
  errorCode?: string;
  lifecycle: BridgeLifecycleEvent[];
  pluginLifecycle?: BridgeLifecycleEvent[];
  partialExecution?: unknown;
  createdRemIds?: string[];
  updatedRemIds?: string[];
  deletedRemIds?: string[];
  sdkUnsupported?: boolean;
}

export interface BridgeHubDiagnostics {
  startedAt: string;
  status: BridgeHubStatus;
  timeoutBudgets?: BridgeTimeoutBudgets;
  reconnectAttempts?: Array<{
    startedAt: string;
    finishedAt: string;
    windowMs: number;
    intervalMs: number;
    attemptCount: number;
    connected: boolean;
  }>;
  pending: BridgeHubRequestSnapshot[];
  recentRequests: BridgeHubRequestOutcome[];
  lateResponses?: Array<{
    id: string;
    tool?: BridgeToolName;
    receivedAt: string;
    ok: boolean;
    errorCode?: string;
    lifecycle: BridgeLifecycleEvent[];
    createdRemIds?: string[];
    updatedRemIds?: string[];
    deletedRemIds?: string[];
    partialExecution?: unknown;
  }>;
  lastHealthCheck: BridgeHealthCheckResult | null;
  pluginRuntime?: BridgePluginRuntimeInfo | null;
  sdkVersion?: string;
  supportedSdkCapabilities?: BridgePluginRuntimeInfo['supportedSdkCapabilities'];
  unsupportedSdkCapabilities?: BridgePluginRuntimeInfo['unsupportedSdkCapabilities'];
  initialSyncComplete?: boolean;
  initialSyncTimedOut?: boolean;
  initialSyncWarning?: string;
  sessionRouter?: ReturnType<SessionRouter['getStatus']>;
  connectorCompatNoAuthTools?: boolean;
  connectorCompatRouting?:
    | 'disabled'
    | 'single_active_plugin_connection'
    | 'no_active_connection'
    | 'multiple_active_connections';
  activePluginConnectionCount?: number;
  activePluginConnections?: Array<{
    connectionId: string;
    userId: string;
    deviceId: string;
    pluginSessionId: string;
    connectedAt: string;
    lastPongAt: string;
    alive: boolean;
  }>;
}

export function createLifecycleEvent(phase: BridgeLifecyclePhase, message?: string): BridgeLifecycleEvent {
  return {
    phase,
    at: new Date().toISOString(),
    ...(message ? { message } : {}),
  };
}

export function hashDiagnosticId(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return `hash_${hash.toString(16)}`;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function stringArrayFrom(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : [];
}

export function getUniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

export const MAX_RECENT_REQUEST_OUTCOMES = 200;
export const TRANSIENT_BRIDGE_ERRORS = new Set<BridgeErrorCode>([
  'PLUGIN_NOT_CONNECTED',
  'TIMEOUT',
  'CLIENT_DISCONNECTED',
]);
