import { createServer, type IncomingMessage, type Server as HttpServer } from 'node:http';
import type { Duplex } from 'node:stream';
import { randomUUID } from 'node:crypto';
import { WebSocket, WebSocketServer } from 'ws';
import {
  type BridgeClientMessage,
  type BridgeCancelRequest,
  type BridgeLifecycleEvent,
  type BridgeLifecyclePhase,
  type BridgePluginHello,
  type BridgePluginRuntimeInfo,
  type BridgePluginRegister,
  type BridgeRequest,
  type BridgeResponse,
  type BridgeServerHello,
  type BridgeToolArgs,
  type BridgeToolName,
  BRIDGE_TOOL_ANNOTATIONS,
  type BridgeErrorCode,
  createBridgeFailure,
} from '../../shared/bridge/protocol.js';
import type { AuthenticatedPrincipal } from './auth/types.js';
import { DEFAULT_TIMEOUT_BUDGETS, getToolCallAuthMode, type CompanionServerConfig } from './config.js';
import type { BridgeHealthCheckResult } from './health-check-types.js';
import { SessionRouter } from './bridge/session-router.js';
import type { StorageProvider } from './storage/types.js';
import { getToolRegistrySummary } from './tool-registry.js';
import { publicMcpToolNameForBridgeTool } from './mcp-tool-map.js';
import { recordToolHistoryEvent } from './tool-health-history.js';
import { startCodexPairingSession } from './auth/codex-pairing-routes.js';

import {
  type PendingRequest,
  type BridgeHubStatus,
  type BridgeHubRequestSnapshot,
  type BridgeHubRequestOutcome,
  type BridgeHubDiagnostics,
  createLifecycleEvent,
  hashDiagnosticId,
  isRecord,
  stringArrayFrom,
  getUniqueStrings,
  MAX_RECENT_REQUEST_OUTCOMES,
} from './bridge/bridge-hub-types.js';

import {
  isTransientFailure,
  mutationCouldHaveStarted,
  requestReachedPlugin,
  isDryRunBridgeRequest,
  getIdempotencyKey,
  isHighLevelIdempotentWrite,
  targetRootFromArgs,
  requestHash,
  isDeleteTool,
  isRealDeleteAttempt,
  retryableOriginalFailure,
  retryableUnknownWriteFailure,
  retryableUnknownDeleteFailure,
} from './bridge/bridge-hub-retry.js';
import { getExecutionEvidence } from './bridge/bridge-hub-evidence.js';

export class BridgeHub {
  private server: HttpServer | undefined;
  private wsServer: WebSocketServer | undefined;
  private attachedUpgradeHandler:
    | ((req: IncomingMessage, socket: Duplex, head: Buffer) => void)
    | undefined;
  private pluginSocket: WebSocket | undefined;
  private pluginReady = false;
  private pending = new Map<string, PendingRequest>();
  private heartbeatTimer: NodeJS.Timeout | undefined;
  private pluginSocketAlive = false;
  private pluginSocketLastPongAtMs = 0;
  private lastConnectedAt: string | undefined;
  private lastDisconnectedAt: string | undefined;
  private readonly startedAt = new Date().toISOString();
  private readonly recentRequests: BridgeHubRequestOutcome[] = [];
  private readonly lateResponses: NonNullable<BridgeHubDiagnostics['lateResponses']> = [];
  private readonly reconnectAttempts: NonNullable<BridgeHubDiagnostics['reconnectAttempts']> = [];
  private lastHealthCheck: BridgeHealthCheckResult | null = null;
  private pluginRuntimeInfo: BridgePluginRuntimeInfo | null = null;
  private readonly sessionRouter: SessionRouter;
  private readonly socketUsers = new WeakMap<WebSocket, {
    userId: string;
    pairingId: string;
    connectionId: string;
  }>();

  constructor(private readonly config: CompanionServerConfig, private readonly storage?: StorageProvider) {
    this.sessionRouter = new SessionRouter(config, storage);
  }

  start(): Promise<void> {
    this.detachUpgradeHandler();
    this.server = createServer((req, res) => {
      res.writeHead(404, {
        'cache-control': 'no-store',
        'content-type': 'text/plain; charset=utf-8',
        'referrer-policy': 'no-referrer',
        'x-content-type-options': 'nosniff',
      });
      res.end('Not Found');
    });

    this.wsServer = new WebSocketServer({
      server: this.server,
      path: this.config.bridgePath,
      maxPayload: this.config.maxBridgeMessageBytes,
    });

    this.wsServer.on('connection', (socket, req) => this.handleConnection(socket, req));

    return new Promise((resolve, reject) => {
      this.server?.once('error', reject);
      this.server?.listen(this.config.bridgePort, this.config.bindHost, () => {
        this.server?.off('error', reject);
        resolve();
      });
    });
  }

  async stop(options: { closeServer?: boolean } = {}): Promise<void> {
    return this.stopWithOptions(options);
  }

  attachToServer(server: HttpServer): void {
    this.detachUpgradeHandler();
    this.server = server;
    this.wsServer = new WebSocketServer({
      noServer: true,
      maxPayload: this.config.maxBridgeMessageBytes,
    });
    this.wsServer.on('connection', (socket, req) => this.handleConnection(socket, req));

    this.attachedUpgradeHandler = (req, socket, head) => {
      const url = new URL(req.url || '/', `http://${req.headers.host ?? 'localhost'}`);
      if (url.pathname !== this.config.bridgePath) {
        socket.destroy();
        return;
      }

      this.wsServer?.handleUpgrade(req, socket, head, (websocket) => {
        this.wsServer?.emit('connection', websocket, req);
      });
    };

    server.on('upgrade', this.attachedUpgradeHandler);
  }

  async stopWithOptions(options: { closeServer?: boolean } = {}): Promise<void> {
    for (const id of Array.from(this.pending.keys())) {
      this.sendCancel(id, 'server_shutdown', 'Bridge server stopped before request completed.');
      this.pending.get(id)?.lifecycle.push(
        createLifecycleEvent('cancelled', 'Bridge server stopped before request completed.')
      );
      this.resolvePending(
        id,
        createBridgeFailure(id, 'PLUGIN_NOT_CONNECTED', 'Bridge server stopped.')
      );
    }

    this.pluginSocket?.close();
    this.sessionRouter.closeAll('Bridge server stopped.');
    this.pluginSocket = undefined;
    this.pluginReady = false;
    this.stopHeartbeat();

    this.detachUpgradeHandler();

    await new Promise<void>((resolve) => {
      this.wsServer?.close(() => resolve());
      if (!this.wsServer) {
        resolve();
      }
    });
    this.wsServer = undefined;

    if (options.closeServer ?? true) {
      await new Promise<void>((resolve) => {
        this.server?.close(() => resolve());
        if (!this.server) {
          resolve();
        }
      });
    }
  }

  getStatus(): BridgeHubStatus {
    const runtimeStatus = this.pluginRuntimeStatus();
    if (this.config.deploymentMode === 'hosted') {
      return {
        connected: this.sessionRouter.getStatus().activeConnections > 0,
        lastConnectedAt: this.lastConnectedAt,
        lastDisconnectedAt: this.lastDisconnectedAt,
        pendingRequests: this.pending.size,
        ...runtimeStatus,
      };
    }

    return {
      connected: this.pluginReady && this.pluginSocket?.readyState === WebSocket.OPEN,
      lastConnectedAt: this.lastConnectedAt,
      lastDisconnectedAt: this.lastDisconnectedAt,
      pendingRequests: this.pending.size,
      ...runtimeStatus,
    };
  }

  getDiagnostics(): BridgeHubDiagnostics {
    const now = Date.now();
    const activeConnectionInfos = this.sessionRouter.getActiveConnectionInfos();
    const connectorCompatRouting = !this.config.connectorCompatNoAuthTools
      ? 'disabled'
      : activeConnectionInfos.length === 0
        ? 'no_active_connection'
        : activeConnectionInfos.length === 1
          ? 'single_active_plugin_connection'
          : 'multiple_active_connections';
    return {
      startedAt: this.startedAt,
      status: this.getStatus(),
      timeoutBudgets: this.config.timeoutBudgets ?? DEFAULT_TIMEOUT_BUDGETS,
      reconnectAttempts: [...this.reconnectAttempts],
      pending: Array.from(this.pending.entries()).map(([id, request]) => ({
        id,
        tool: request.tool,
        startedAt: new Date(request.startedAt).toISOString(),
        ageMs: now - request.startedAt,
        timeoutMs: request.timeoutMs,
        status: request.status,
      })),
      recentRequests: [...this.recentRequests],
      lateResponses: [...this.lateResponses],
      lastHealthCheck: this.lastHealthCheck,
      pluginRuntime: this.pluginRuntimeInfo,
      sdkVersion: this.pluginRuntimeInfo?.sdkVersion,
      supportedSdkCapabilities: this.pluginRuntimeInfo?.supportedSdkCapabilities,
      unsupportedSdkCapabilities: this.pluginRuntimeInfo?.unsupportedSdkCapabilities,
      initialSyncComplete: this.pluginRuntimeInfo?.initialSyncComplete,
      initialSyncTimedOut: this.pluginRuntimeInfo?.initialSyncTimedOut,
      initialSyncWarning: this.pluginRuntimeInfo?.initialSyncWarning,
      sessionRouter: this.sessionRouter.getStatus(),
      connectorCompatNoAuthTools: this.config.connectorCompatNoAuthTools,
      connectorCompatRouting,
      activePluginConnectionCount: activeConnectionInfos.length,
      activePluginConnections: activeConnectionInfos.map((connection) => ({
        ...connection,
        userId: connection.userId === '__local__' ? '__local__' : hashDiagnosticId(connection.userId),
        pluginSessionId: hashDiagnosticId(connection.pluginSessionId),
      })),
    };
  }

  getRecentlyCreatedRemIds(): string[] {
    const ids = new Set<string>();
    for (const request of this.recentRequests) {
      for (const remId of request.createdRemIds ?? []) {
        ids.add(remId);
      }
    }
    for (const response of this.lateResponses) {
      for (const remId of response.createdRemIds ?? []) {
        ids.add(remId);
      }
    }
    return [...ids];
  }

  async getCodexRoutingDiagnostics(principal?: AuthenticatedPrincipal) {
    const status = this.sessionRouter.getStatus();
    const activePluginConnectionCount = status.activeConnections;
    const base = {
      authenticated: principal?.authMode === 'codex_bearer',
      linked: false,
      activePluginConnectionCount,
      sessionRouterStatus: status,
      codexPairingStatus: 'not_linked' as const,
      codexRoutingMode: activePluginConnectionCount === 0
        ? 'no_active_plugin_connection'
        : activePluginConnectionCount === 1
          ? 'single_active_plugin_fallback'
          : 'multiple_active_plugin_connections',
      pairingRequired: activePluginConnectionCount !== 1,
      pluginConnectionStatus: activePluginConnectionCount > 0 ? 'connected' : 'offline',
    };

    if (principal?.authMode !== 'codex_bearer') {
      return base;
    }

    const codexClientHash = principal.codexClientHash;
    if (!codexClientHash || !this.storage) {
      return {
        ...base,
        codexRoutingMode: 'pairing_required',
        pairingRequired: true,
      };
    }

    const link = await this.storage.getCodexClientLink(codexClientHash);
    if (!link) {
      return base;
    }

    if (link.revokedAt) {
      return {
        ...base,
        codexPairingStatus: 'revoked' as const,
        codexRoutingMode: 'pairing_required',
        pairingRequired: true,
      };
    }

    const connection = this.sessionRouter.getConnectionForUser(link.linkedUserId);
    return {
      ...base,
      linked: true,
      codexPairingStatus: 'linked' as const,
      codexRoutingMode: 'linked_plugin_session',
      pairingRequired: false,
      pluginConnectionStatus: connection ? 'connected' : 'offline',
      linkedPairingIdHash: hashDiagnosticId(link.linkedPairingId),
      linkedPluginInstanceIdHash: link.linkedPluginInstanceId ? hashDiagnosticId(link.linkedPluginInstanceId) : undefined,
    };
  }

  recordHealthCheck(result: BridgeHealthCheckResult) {
    this.lastHealthCheck = result;
    for (const toolResult of result.results) {
      recordToolHistoryEvent({
        tool: toolResult.tool,
        kind: 'health_check',
        at: result.finishedAt,
        durationMs: toolResult.durationMs,
        errorCode: toolResult.status,
        sdkUnsupported: toolResult.status === 'unsupported',
        source: 'health_check',
      });
    }
  }

  private pluginRuntimeStatus() {
    return {
      pluginRuntime: this.pluginRuntimeInfo,
      sdkVersion: this.pluginRuntimeInfo?.sdkVersion,
      supportedSdkCapabilities: this.pluginRuntimeInfo?.supportedSdkCapabilities,
      unsupportedSdkCapabilities: this.pluginRuntimeInfo?.unsupportedSdkCapabilities,
      initialSyncComplete: this.pluginRuntimeInfo?.initialSyncComplete,
      initialSyncTimedOut: this.pluginRuntimeInfo?.initialSyncTimedOut,
      initialSyncWarning: this.pluginRuntimeInfo?.initialSyncWarning,
    };
  }

  get bridgePort(): number {
    const address = this.server?.address();
    return typeof address === 'object' && address ? address.port : this.config.bridgePort;
  }

  private detachUpgradeHandler() {
    if (this.server && this.attachedUpgradeHandler) {
      this.server.off('upgrade', this.attachedUpgradeHandler);
      this.attachedUpgradeHandler = undefined;
    }
  }

  async callPlugin<TTool extends BridgeToolName>(
    tool: TTool,
    args: BridgeToolArgs[TTool],
    timeoutMs = this.config.requestTimeoutMs,
    signal?: AbortSignal,
    principal?: AuthenticatedPrincipal
  ): Promise<BridgeResponse> {
    const firstResponse = await this.callPluginOnce(tool, args, timeoutMs, signal, principal);
    const retryPlan = this.getRetryPlan(tool, args, firstResponse);

    if (retryPlan === 'none') {
      return firstResponse;
    }

    if (retryPlan === 'retry') {
      const reconnected = await this.waitForPluginReconnect(signal);
      if (reconnected) {
        const retryResponse = await this.callPluginOnce(tool, args, timeoutMs, signal, principal);
        const retryFailurePlan = this.getRetryPlan(tool, args, retryResponse, false);
        if (retryFailurePlan === 'unknown_delete') {
          return this.recordSyntheticFailure(tool, timeoutMs, retryableUnknownDeleteFailure(tool, retryResponse));
        }
        if (retryFailurePlan === 'unknown_write') {
          return this.recordSyntheticFailure(tool, timeoutMs, retryableUnknownWriteFailure(tool, retryResponse));
        }
        if (retryFailurePlan === 'retryable') {
          return this.recordSyntheticFailure(tool, timeoutMs, retryableOriginalFailure(tool, retryResponse));
        }
        return retryResponse;
      }

      if (mutationCouldHaveStarted(firstResponse) && isRealDeleteAttempt(tool, args)) {
        return this.recordSyntheticFailure(tool, timeoutMs, retryableUnknownDeleteFailure(tool, firstResponse));
      }
      if (
        mutationCouldHaveStarted(firstResponse) &&
        !isDryRunBridgeRequest(tool, args) &&
        !BRIDGE_TOOL_ANNOTATIONS[tool].readOnlyHint
      ) {
        return this.recordSyntheticFailure(tool, timeoutMs, retryableUnknownWriteFailure(tool, firstResponse));
      }
      return this.recordSyntheticFailure(tool, timeoutMs, retryableOriginalFailure(tool, firstResponse));
    }

    if (retryPlan === 'unknown_delete') {
      return this.recordSyntheticFailure(tool, timeoutMs, retryableUnknownDeleteFailure(tool, firstResponse));
    }

    if (retryPlan === 'unknown_write') {
      return this.recordSyntheticFailure(tool, timeoutMs, retryableUnknownWriteFailure(tool, firstResponse));
    }

    return this.recordSyntheticFailure(tool, timeoutMs, retryableOriginalFailure(tool, firstResponse));
  }

  private async callPluginOnce<TTool extends BridgeToolName>(
    tool: TTool,
    args: BridgeToolArgs[TTool],
    timeoutMs = this.config.requestTimeoutMs,
    signal?: AbortSignal,
    principal?: AuthenticatedPrincipal
  ): Promise<BridgeResponse> {
    const id = randomUUID();
    const startedAt = Date.now();
    const lifecycle: BridgeLifecycleEvent[] = [
      createLifecycleEvent('server_received', 'Companion server received MCP bridge request.'),
      createLifecycleEvent('received', 'Companion server received MCP bridge request.'),
    ];

    if (signal?.aborted) {
      lifecycle.push(createLifecycleEvent('cancelled', 'MCP caller disconnected before request started.'));
      const response = createBridgeFailure(
        id,
        'CLIENT_DISCONNECTED',
        'MCP caller disconnected before request started.',
        undefined,
        lifecycle
      );
      this.recordImmediateOutcome(id, tool, startedAt, timeoutMs, response, lifecycle);
      return response;
    }

    const target = await this.getTargetSocket(principal);
    if (!target.ok) {
      lifecycle.push(createLifecycleEvent('failed', 'RemNote plugin is not connected.'));
      const response = createBridgeFailure(
        id,
        target.error,
        target.message,
        target.details,
        lifecycle
      );
      this.recordImmediateOutcome(id, tool, startedAt, timeoutMs, response, lifecycle);
      return response;
    }

    const request: BridgeRequest<TTool> = {
      id,
      tool,
      args,
      timeoutMs,
    };
    const idempotencyKey = getIdempotencyKey(args);
    const idempotency =
      principal?.userId && idempotencyKey && isHighLevelIdempotentWrite(tool)
        ? {
            userId: principal.userId,
            tool,
            idempotencyKey,
            targetRoot: targetRootFromArgs(args),
            requestHash: requestHash(tool, args),
            startedAt: new Date(startedAt).toISOString(),
          }
        : undefined;

    if (idempotency) {
      this.storage
        ?.createOrUpdateIdempotencyRecord({
          ...idempotency,
          status: 'started',
          createdRemIds: [],
          updatedRemIds: [],
        })
        .catch((error: unknown) => {
          console.error('Failed to write idempotency start record:', error instanceof Error ? error.message : String(error));
        });
    }

    return new Promise<BridgeResponse>((resolve) => {
      const timeout = setTimeout(() => {
        const pending = this.pending.get(id);
        this.sendCancel(id, 'server_timeout', `Timed out waiting for ${tool}.`);
        pending?.lifecycle.push(
          createLifecycleEvent('cancelled_by_server_timeout', `Server cancelled ${tool} after timeout.`),
          createLifecycleEvent('response_dropped', `Late plugin response may arrive after ${tool} timeout.`),
          createLifecycleEvent('timeout', `Timed out waiting for ${tool}.`)
        );
        const timeoutLifecycle = pending?.lifecycle ?? [...lifecycle];
        this.resolvePending(
          id,
          createBridgeFailure(id, 'TIMEOUT', `Timed out waiting for ${tool}.`, {
            code: 'TIMEOUT',
            tool,
            timeoutMs,
            idempotencyKey,
            startedAt: new Date(startedAt).toISOString(),
            durationMs: Date.now() - startedAt,
            lifecycle: timeoutLifecycle,
            mutationCouldHaveStarted:
              !BRIDGE_TOOL_ANNOTATIONS[tool].readOnlyHint &&
              !isDryRunBridgeRequest(tool, args),
            retrySafety: BRIDGE_TOOL_ANNOTATIONS[tool].readOnlyHint
              ? 'retry_read_after_reconnect'
              : isDryRunBridgeRequest(tool, args)
                ? 'retry_dry_run_safe'
                : 'unknown_write_status',
            recommendation: BRIDGE_TOOL_ANNOTATIONS[tool].readOnlyHint
              ? 'Reconnect the RemNote plugin and retry the read.'
              : isDryRunBridgeRequest(tool, args)
                ? 'Retry the dry run after reconnect.'
                : 'Inspect target state or resume with the same idempotency key.',
          }, timeoutLifecycle)
        );
      }, timeoutMs);

      const abortHandler = () => {
        this.sendCancel(id, 'client_disconnected', 'MCP caller disconnected before request completed.');
        this.pending.get(id)?.lifecycle.push(
          createLifecycleEvent('cancelled', 'MCP caller disconnected before request completed.')
        );
        this.resolvePending(
          id,
          createBridgeFailure(id, 'CLIENT_DISCONNECTED', 'MCP caller disconnected before request completed.')
        );
      };

      if (signal) {
        signal.addEventListener('abort', abortHandler, { once: true });
      }

      this.pending.set(id, {
        resolve,
        timeout,
        tool,
        status: 'pending',
        startedAt,
        timeoutMs,
        lifecycle,
        targetSocket: target.socket,
        targetUserId: target.userId,
        idempotency,
        cleanupAbortListener: signal ? () => signal.removeEventListener('abort', abortHandler) : undefined,
      });

      if (signal?.aborted) {
        abortHandler();
        return;
      }

      console.info('Bridge hub request started', {
        requestId: id,
        tool,
        timeoutMs,
        pendingRequests: this.pending.size,
      });

      try {
        lifecycle.push(createLifecycleEvent('forwarded_to_plugin', 'Request forwarded to RemNote plugin WebSocket.'));
        target.socket.send(JSON.stringify(request), (error) => {
          if (!error) {
            return;
          }

          this.pending.get(id)?.lifecycle.push(
            createLifecycleEvent('failed', 'Failed to send request to RemNote plugin.')
          );
          this.resolvePending(
            id,
            createBridgeFailure(id, 'PLUGIN_NOT_CONNECTED', 'Failed to send request to RemNote plugin.', {
              message: error.message,
            })
          );
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.pending.get(id)?.lifecycle.push(
          createLifecycleEvent('failed', 'Failed to send request to RemNote plugin.')
        );
        this.resolvePending(
          id,
          createBridgeFailure(id, 'PLUGIN_NOT_CONNECTED', 'Failed to send request to RemNote plugin.', {
            message,
          })
        );
      }
    });
  }

  private getRetryPlan<TTool extends BridgeToolName>(
    tool: TTool,
    args: BridgeToolArgs[TTool],
    response: BridgeResponse,
    allowRetry = true
  ): 'none' | 'retry' | 'retryable' | 'unknown_write' | 'unknown_delete' {
    if (!isTransientFailure(response)) {
      return 'none';
    }

    const mutationStarted = mutationCouldHaveStarted(response);
    const reachedPlugin = requestReachedPlugin(response);
    const dryRun = isDryRunBridgeRequest(tool, args);
    if (!response.ok && response.error.code === 'TIMEOUT') {
      if (dryRun) {
        return 'retryable';
      }
      if (isRealDeleteAttempt(tool, args)) {
        return mutationStarted ? 'unknown_delete' : 'retryable';
      }
      if (mutationStarted && !BRIDGE_TOOL_ANNOTATIONS[tool].readOnlyHint) {
        return 'unknown_write';
      }
      return 'retryable';
    }

    if (isRealDeleteAttempt(tool, args)) {
      return mutationStarted ? 'unknown_delete' : 'retryable';
    }

    if (allowRetry && reachedPlugin && BRIDGE_TOOL_ANNOTATIONS[tool].readOnlyHint) {
      return 'retry';
    }

    if (
      allowRetry &&
      reachedPlugin &&
      !BRIDGE_TOOL_ANNOTATIONS[tool].destructiveHint &&
      getIdempotencyKey(args)
    ) {
      return 'retry';
    }

    if (mutationStarted && isDeleteTool(tool)) {
      return 'unknown_delete';
    }

    if (mutationStarted && !dryRun && !BRIDGE_TOOL_ANNOTATIONS[tool].readOnlyHint) {
      return 'unknown_write';
    }

    return 'retryable';
  }

  private async waitForPluginReconnect(signal?: AbortSignal): Promise<boolean> {
    const budgets = this.config.timeoutBudgets ?? DEFAULT_TIMEOUT_BUDGETS;
    const startedAt = Date.now();
    const deadline = startedAt + budgets.reconnectRetryWindowMs;
    let attemptCount = 0;
    while (Date.now() <= deadline) {
      if (signal?.aborted) {
        this.recordReconnectAttempt(startedAt, budgets.reconnectRetryWindowMs, budgets.reconnectRetryIntervalMs, attemptCount, false);
        return false;
      }

      attemptCount += 1;
      if (this.getStatus().connected) {
        this.recordReconnectAttempt(startedAt, budgets.reconnectRetryWindowMs, budgets.reconnectRetryIntervalMs, attemptCount, true);
        return true;
      }

      await new Promise((resolve) => setTimeout(resolve, budgets.reconnectRetryIntervalMs));
    }

    const connected = this.getStatus().connected;
    this.recordReconnectAttempt(startedAt, budgets.reconnectRetryWindowMs, budgets.reconnectRetryIntervalMs, attemptCount, connected);
    return connected;
  }

  private recordReconnectAttempt(
    startedAtMs: number,
    windowMs: number,
    intervalMs: number,
    attemptCount: number,
    connected: boolean
  ) {
    this.reconnectAttempts.unshift({
      startedAt: new Date(startedAtMs).toISOString(),
      finishedAt: new Date().toISOString(),
      windowMs,
      intervalMs,
      attemptCount,
      connected,
    });
    if (this.reconnectAttempts.length > 20) {
      this.reconnectAttempts.length = 20;
    }
  }

  private recordSyntheticFailure(
    tool: BridgeToolName,
    timeoutMs: number,
    response: BridgeResponse
  ): BridgeResponse {
    if (!response.ok) {
      const now = Date.now();
      this.recordImmediateOutcome(response.id, tool, now, timeoutMs, response, response.lifecycle ?? []);
    }

    return response;
  }

  private getTargetSocket(
    principal?: AuthenticatedPrincipal
  ):
    Promise<
    | { ok: true; socket: WebSocket; userId: string }
    | { ok: false; error: BridgeErrorCode; message: string; details?: unknown }
    > {
    if (this.config.deploymentMode === 'hosted') {
      if (principal?.authMode === 'codex_bearer') {
        return this.getCodexTargetSocket(principal);
      }

      if (principal?.authMode === 'connector_compat_noauth') {
        const singleActive = this.sessionRouter.getSingleActiveConnection();
        if (!singleActive.ok) {
          return Promise.resolve({
            ok: false,
            error: singleActive.error,
            message: singleActive.message,
          });
        }

        return Promise.resolve({
          ok: true,
          socket: singleActive.connection.socketRef,
          userId: singleActive.userId,
        });
      }

      const userId = principal?.userId;
      if (!userId) {
        return Promise.resolve({
          ok: false,
          error: 'NO_PAIRED_PLUGIN_SESSION',
          message: 'MCP request has no paired hosted plugin session.',
        });
      }

      const connection = this.sessionRouter.getConnectionForUser(userId);
      if (!connection) {
        return Promise.resolve({
          ok: false,
          error: 'PLUGIN_NOT_CONNECTED',
          message: 'RemNote plugin is not connected. Open RemNote and reconnect the ChatGPT Bridge plugin.',
        });
      }

      return Promise.resolve({
        ok: true,
        socket: connection.socketRef,
        userId,
      });
    }

    if (!this.pluginReady || !this.pluginSocket || this.pluginSocket.readyState !== WebSocket.OPEN) {
      return Promise.resolve({
        ok: false,
        error: 'PLUGIN_NOT_CONNECTED',
        message: 'RemNote plugin is not connected.',
      });
    }

    return Promise.resolve({
      ok: true,
      socket: this.pluginSocket,
      userId: '__local__',
    });
  }

  private async getCodexTargetSocket(
    principal: AuthenticatedPrincipal
  ): Promise<
    | { ok: true; socket: WebSocket; userId: string }
    | { ok: false; error: BridgeErrorCode; message: string; details?: unknown }
  > {
    const routing = await this.getCodexRoutingDiagnostics(principal);
    const codexClientHash = principal.codexClientHash;
    if (codexClientHash && this.storage) {
      const link = await this.storage.getCodexClientLink(codexClientHash);
      if (link && !link.revokedAt) {
        const linkedConnection = this.sessionRouter.getConnectionForUser(link.linkedUserId);
        if (linkedConnection) {
          return {
            ok: true,
            socket: linkedConnection.socketRef,
            userId: link.linkedUserId,
          };
        }
        return {
          ok: false,
          error: 'PLUGIN_NOT_CONNECTED',
          message: 'Codex is linked to a RemNote plugin session, but that plugin connection is not currently open.',
          details: {
            codexRouting: routing,
            recommendation: 'Open RemNote and reconnect the approved ChatGPT Bridge plugin session, then retry.',
          },
        };
      }
      if (link?.revokedAt) {
        return {
          ok: false,
          error: 'CODEX_PAIRING_REQUIRED',
          message: 'Codex pairing was revoked. Start a new Codex pairing.',
          details: await this.codexPairingRequiredDetails(principal, routing),
        };
      }
    }

    const singleActive = this.sessionRouter.getSingleActiveConnection();
    if (singleActive.ok) {
      return {
        ok: true,
        socket: singleActive.connection.socketRef,
        userId: singleActive.userId,
      };
    }

    const noActive = singleActive.error === 'PLUGIN_NOT_CONNECTED';
    return {
      ok: false,
      error: noActive ? 'PLUGIN_NOT_CONNECTED' : 'DEVICE_CONFLICT',
      message: noActive
        ? 'No active RemNote plugin connection is available.'
        : 'Multiple active RemNote plugin connections are available. Codex requires explicit pairing.',
      details: await this.codexPairingRequiredDetails(principal, routing),
    };
  }

  private async codexPairingRequiredDetails(principal: AuthenticatedPrincipal, routing: Awaited<ReturnType<BridgeHub['getCodexRoutingDiagnostics']>>) {
    let codexPairing:
      | {
          pairingRequired: true;
          pairingId: string;
          userCode: string;
          browserUrl: string;
          expiresAt: string;
        }
      | undefined;
    if (this.storage && principal.codexClientHash) {
      const baseUrl = this.config.publicBaseUrl || `http://127.0.0.1:${this.config.singlePort ? this.config.port : this.config.mcpPort}`;
      const started = await startCodexPairingSession({
        config: this.config,
        storage: this.storage,
        codexClientHash: principal.codexClientHash,
        baseUrl,
      });
      codexPairing = {
        pairingRequired: true,
        pairingId: started.session.pairingId,
        userCode: started.userCode,
        browserUrl: started.browserUrl,
        expiresAt: started.session.expiresAt,
      };
    }

    return {
      codexRouting: {
        ...routing,
        authenticated: true,
        pairingRequired: true,
      },
      codexPairing,
      recommendation: 'Start Codex pairing from the browser URL, approve it in RemNote, then retry the tool call.',
    };
  }

  private handleConnection(socket: WebSocket, req?: IncomingMessage) {
    if (!this.isAllowedWebSocketOrigin(req)) {
      socket.close(1008, 'WebSocket origin not allowed.');
      return;
    }

    socket.once('message', (raw) => {
      void this.handleInitialPluginMessage(socket, raw);
    });
  }

  private extractPluginRuntimeInfo(message: BridgePluginHello | BridgePluginRegister): BridgePluginRuntimeInfo | null {
    const runtime = message.pluginRuntime;
    if (!runtime || typeof runtime !== 'object') {
      return null;
    }
    return runtime;
  }

  private async handleInitialPluginMessage(socket: WebSocket, raw: WebSocket.RawData) {
      const hello = this.parseClientMessage(raw);
      if (!this.isPluginHello(hello) && !this.isPluginRegister(hello)) {
        socket.close(1008, 'Expected plugin registration.');
        return;
      }
      if (this.config.deploymentMode !== 'hosted' && !this.isPluginHello(hello)) {
        socket.close(1008, 'Expected plugin hello.');
        return;
      }

      if (
        this.config.deploymentMode !== 'hosted' &&
        this.config.bridgeToken &&
        !this.config.allowNoToken &&
        (hello as BridgePluginHello).token !== this.config.bridgeToken
      ) {
        socket.close(1008, 'Invalid bridge token.');
        return;
      }

      const pluginRuntime = this.extractPluginRuntimeInfo(hello);
      this.pluginRuntimeInfo = pluginRuntime;
      let registeredToolTier = this.config.toolProfile;
      let requiresConnectorRefresh = false;
      if (this.config.deploymentMode === 'hosted') {
        const routed = await this.sessionRouter.authenticateAndRegister(socket, hello);
        if (!routed.ok) {
          socket.close(1008, `${routed.error}: ${routed.message}`);
          this.lastDisconnectedAt = new Date().toISOString();
          return;
        }
        registeredToolTier = routed.toolTier ?? this.config.toolProfile;
        requiresConnectorRefresh = Boolean(routed.requiresConnectorRefresh);
        this.socketUsers.set(socket, {
          userId: routed.connection.userId,
          pairingId: routed.connection.pluginSessionId,
          connectionId: routed.connection.connectionId,
        });
        this.pluginReady = this.sessionRouter.getStatus().activeConnections > 0;
        this.lastConnectedAt = new Date().toISOString();
        socket.on('message', (message) => this.handlePluginMessage(socket, message));
        socket.on('close', () => { void this.handleHostedPluginClose(socket); });
        socket.on('error', () => { void this.handleHostedPluginClose(socket); });
        this.startHeartbeat();
      } else {
        this.replacePluginSocket(socket);
      }

      const toolCallAuthMode = getToolCallAuthMode(this.config);
      const serverHello: BridgeServerHello = {
        type: 'server_hello',
        protocolVersion: 1,
        serverName: 'remnote-companion',
        ...getToolRegistrySummary(this.config.enableDeleteTool, registeredToolTier, undefined, {
          discoveryAuthMode: 'no_auth_required',
          toolCallAuthMode,
        }),
        requiresConnectorRefresh,
        serverStartedAt: this.startedAt,
        pluginRuntime,
        sdkVersion: pluginRuntime?.sdkVersion,
        supportedSdkCapabilities: pluginRuntime?.supportedSdkCapabilities,
        unsupportedSdkCapabilities: pluginRuntime?.unsupportedSdkCapabilities,
        initialSyncComplete: pluginRuntime?.initialSyncComplete,
        initialSyncTimedOut: pluginRuntime?.initialSyncTimedOut,
        initialSyncWarning: pluginRuntime?.initialSyncWarning,
      };
      socket.send(JSON.stringify(serverHello));
  }

  private replacePluginSocket(socket: WebSocket) {
    this.pluginSocket?.close(1012, 'New RemNote plugin connection opened.');
    this.pluginSocket = socket;
    this.pluginReady = true;
    this.pluginSocketAlive = true;
    this.lastConnectedAt = new Date().toISOString();

    socket.on('message', (raw) => this.handlePluginMessage(socket, raw));
    socket.on('pong', () => {
      if (socket === this.pluginSocket) {
        this.pluginSocketAlive = true;
        this.pluginSocketLastPongAtMs = Date.now();
      }
    });
    socket.on('close', () => this.handlePluginClose(socket));
    socket.on('error', () => this.handlePluginClose(socket));
    this.startHeartbeat();
  }

  private handlePluginClose(socket: WebSocket) {
    if (!this.pluginReady || socket !== this.pluginSocket) {
      return;
    }

    this.pluginReady = false;
    this.pluginSocket = undefined;
    this.stopHeartbeat();
    this.lastDisconnectedAt = new Date().toISOString();

    for (const id of Array.from(this.pending.keys())) {
      this.pending.get(id)?.lifecycle.push(
        createLifecycleEvent('failed', 'RemNote plugin disconnected before request completed.')
      );
      this.resolvePending(
        id,
        createBridgeFailure(id, 'PLUGIN_NOT_CONNECTED', 'RemNote plugin disconnected.')
      );
    }
  }

  private async handleHostedPluginClose(socket: WebSocket) {
    const socketRoute = this.socketUsers.get(socket);
    if (!socketRoute) {
      return;
    }

    this.socketUsers.delete(socket);
    const removedCurrentRoute = this.sessionRouter.removeConnection(
      socketRoute.userId,
      socketRoute.connectionId
    );
    if (removedCurrentRoute && this.storage) {
      try {
        const session = await this.storage.getChatGptPairingSessionById(socketRoute.pairingId);
        if (
          session &&
          !session.revokedAt &&
          session.status === 'connected' &&
          session.pluginConnectionId === socketRoute.connectionId
        ) {
          const disconnectedAt = new Date().toISOString();
          await this.storage.updateChatGptPairingSession(socketRoute.pairingId, {
            status: 'disconnected',
            disconnectedAt,
            lastSeenAt: disconnectedAt,
          });
        }
      } catch (error: unknown) {
        console.error(
          'Failed to persist hosted plugin disconnect state:',
          error instanceof Error ? error.message : String(error)
        );
      }
    }
    this.pluginReady = this.sessionRouter.getStatus().activeConnections > 0;
    this.lastDisconnectedAt = new Date().toISOString();
    if (!this.pluginReady) {
      this.stopHeartbeat();
    }

    for (const [id, request] of Array.from(this.pending.entries())) {
      if (request.targetSocket !== socket) {
        continue;
      }
      request.lifecycle.push(
        createLifecycleEvent('failed', 'Paired RemNote plugin disconnected before request completed.')
      );
      this.resolvePending(
        id,
        createBridgeFailure(id, 'PLUGIN_NOT_CONNECTED', 'Paired RemNote plugin disconnected.')
      );
    }
  }

  private handlePluginMessage(socket: WebSocket, raw: WebSocket.RawData) {
    if (this.config.deploymentMode !== 'hosted' && socket !== this.pluginSocket) {
      return;
    }

    const message = this.parseClientMessage(raw);
    if (!message || !('ok' in message)) {
      return;
    }

    const pending = this.pending.get(message.id);
    if (!pending) {
      const priorOutcome = this.recentRequests.find((request) => request.id === message.id);
      const lifecycle = [
        createLifecycleEvent('response_dropped', 'Plugin response arrived after companion server pending request expired.'),
        ...(message.lifecycle ?? []),
      ];
      this.lateResponses.unshift({
        id: message.id,
        tool: priorOutcome?.tool,
        receivedAt: new Date().toISOString(),
        ok: message.ok,
        errorCode: message.ok ? undefined : message.error.code,
        lifecycle,
        ...getExecutionEvidence(message),
      });
      if (this.lateResponses.length > 50) {
        this.lateResponses.length = 50;
      }
      console.warn('Late bridge response received after pending request expired', {
        requestId: message.id,
        ok: message.ok,
        errorCode: message.ok ? undefined : message.error.code,
      });
      return;
    }
    if (this.config.deploymentMode === 'hosted' && pending?.targetSocket !== socket) {
      return;
    }

    this.resolvePending(message.id, message);
  }

  private resolvePending(id: string, response: BridgeResponse) {
    const pending = this.pending.get(id);
    if (!pending) {
      return;
    }

    clearTimeout(pending.timeout);
    pending.cleanupAbortListener?.();
    this.pending.delete(id);
    const pluginLifecycle = response.lifecycle;
    if (pluginLifecycle?.some((event) => event.phase === 'waiting_for_remnote_approval')) {
      pending.status = 'waiting_for_remnote_approval';
    }
    this.ensureTerminalLifecycle(pending.lifecycle, response, pluginLifecycle);
    const lifecycle = this.mergeLifecycle(pending.lifecycle, pluginLifecycle);
    const responseWithLifecycle = {
      ...response,
      lifecycle,
    } as BridgeResponse;
    this.recordRequestOutcome(id, pending, responseWithLifecycle, lifecycle, pluginLifecycle);
    console.info('Bridge request completed', {
      requestId: id,
      tool: pending.tool,
      errorCode: response.ok ? undefined : response.error.code,
      durationMs: Date.now() - pending.startedAt,
    });
    pending.resolve(responseWithLifecycle);
  }

  private sendCancel(id: string, reason: BridgeCancelRequest['reason'], message: string) {
    const targetSocket = this.pending.get(id)?.targetSocket ?? this.pluginSocket;
    if (!targetSocket || targetSocket.readyState !== WebSocket.OPEN) {
      return;
    }

    const cancel: BridgeCancelRequest = {
      type: 'cancel_request',
      id,
      reason,
      message,
    };

    try {
      targetSocket.send(JSON.stringify(cancel));
    } catch {
      // Best effort: the server-side pending request still resolves locally.
    }
  }

  private recordRequestOutcome(
    id: string,
    pending: PendingRequest,
    response: BridgeResponse,
    lifecycle: BridgeLifecycleEvent[],
    pluginLifecycle?: BridgeLifecycleEvent[]
  ) {
    const evidence = getExecutionEvidence(response);
    const mcpTool = publicMcpToolNameForBridgeTool(pending.tool);
    recordToolHistoryEvent({
      tool: mcpTool,
      kind: response.ok ? 'success' : 'failure',
      durationMs: Date.now() - pending.startedAt,
      errorCode: response.ok ? undefined : response.error.code,
      sdkUnsupported: !response.ok && response.error.code === 'SDK_UNSUPPORTED',
      partialFailure: Boolean(evidence.partialExecution),
      source: 'bridge',
    });
    this.recentRequests.unshift({
      id,
      tool: pending.tool,
      mcpTool,
      status: this.terminalStatus(response),
      startedAt: new Date(pending.startedAt).toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - pending.startedAt,
      timeoutMs: pending.timeoutMs,
      ok: response.ok,
      errorCode: response.ok ? undefined : response.error.code,
      lifecycle,
      ...(pluginLifecycle ? { pluginLifecycle } : {}),
      ...evidence,
    });

    if (pending.idempotency) {
      const status =
        response.ok
          ? 'completed'
          : response.error.code === 'RETRYABLE_UNKNOWN_WRITE_STATUS' ||
              response.error.code === 'RETRYABLE_UNKNOWN_DELETE_STATUS'
            ? 'unknown'
            : 'failed';
      this.storage
        ?.createOrUpdateIdempotencyRecord({
          ...pending.idempotency,
          status,
          createdRemIds: 'createdRemIds' in evidence ? evidence.createdRemIds ?? [] : [],
          updatedRemIds: 'updatedRemIds' in evidence ? evidence.updatedRemIds ?? [] : [],
          finishedAt: new Date().toISOString(),
          errorCode: response.ok ? undefined : response.error.code,
        })
        .catch((error: unknown) => {
          console.error('Failed to write idempotency outcome record:', error instanceof Error ? error.message : String(error));
        });
    }

    if (this.recentRequests.length > MAX_RECENT_REQUEST_OUTCOMES) {
      this.recentRequests.length = MAX_RECENT_REQUEST_OUTCOMES;
    }
  }

  private recordImmediateOutcome(
    id: string,
    tool: BridgeToolName,
    startedAt: number,
    timeoutMs: number,
    response: BridgeResponse,
    lifecycle: BridgeLifecycleEvent[]
  ) {
    const mcpTool = publicMcpToolNameForBridgeTool(tool);
    recordToolHistoryEvent({
      tool: mcpTool,
      kind: response.ok ? 'success' : 'failure',
      durationMs: Date.now() - startedAt,
      errorCode: response.ok ? undefined : response.error.code,
      sdkUnsupported: !response.ok && response.error.code === 'SDK_UNSUPPORTED',
      source: 'bridge',
    });
    this.recentRequests.unshift({
      id,
      tool,
      mcpTool,
      status: this.terminalStatus(response),
      startedAt: new Date(startedAt).toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      timeoutMs,
      ok: response.ok,
      errorCode: response.ok ? undefined : response.error.code,
      lifecycle,
      ...getExecutionEvidence(response),
    });

    if (this.recentRequests.length > MAX_RECENT_REQUEST_OUTCOMES) {
      this.recentRequests.length = MAX_RECENT_REQUEST_OUTCOMES;
    }
  }

  private mergeLifecycle(
    serverLifecycle: BridgeLifecycleEvent[],
    pluginLifecycle?: BridgeLifecycleEvent[]
  ): BridgeLifecycleEvent[] {
    const merged = [...serverLifecycle, ...(pluginLifecycle ?? [])];
    return merged.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  }

  private ensureTerminalLifecycle(
    serverLifecycle: BridgeLifecycleEvent[],
    response: BridgeResponse,
    pluginLifecycle?: BridgeLifecycleEvent[]
  ) {
    const terminalPhases: BridgeLifecyclePhase[] = ['completed', 'failed', 'cancelled'];
    if ([...serverLifecycle, ...(pluginLifecycle ?? [])].some((event) => terminalPhases.includes(event.phase))) {
      return;
    }

    if (response.ok) {
      serverLifecycle.push(createLifecycleEvent('completed', 'Plugin returned a successful response.'));
      return;
    }

    if (response.error.code === 'CLIENT_DISCONNECTED') {
      serverLifecycle.push(createLifecycleEvent('cancelled', response.error.message));
      return;
    }

    serverLifecycle.push(createLifecycleEvent('failed', response.error.message));
  }

  private terminalStatus(response: BridgeResponse): BridgeHubRequestOutcome['status'] {
    if (response.ok) {
      return 'completed';
    }

    if (response.error.code === 'TIMEOUT' || response.error.code === 'APPROVAL_TIMEOUT') {
      return 'timed_out';
    }

    if (response.error.code === 'CLIENT_DISCONNECTED' || response.error.code === 'REQUEST_CANCELLED') {
      return 'cancelled';
    }

    return 'failed';
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    if (this.config.deploymentMode !== 'hosted' && this.pluginSocket?.readyState === WebSocket.OPEN) {
      this.pluginSocketLastPongAtMs = Date.now();
    }
    this.heartbeatTimer = setInterval(() => {
      const heartbeatTimeoutMs = Math.max(1, this.config.pluginHeartbeatTimeoutSeconds) * 1000;
      if (this.config.deploymentMode === 'hosted') {
        for (const connection of this.sessionRouter.getActiveConnectionInfos()) {
          const liveConnection = this.sessionRouter.getConnectionForUser(connection.userId);
          if (!liveConnection) {
            continue;
          }
          const lastPongAtMs = Date.parse(liveConnection.lastPongAt);
          if (!Number.isFinite(lastPongAtMs) || Date.now() - lastPongAtMs >= heartbeatTimeoutMs) {
            liveConnection.close(1011, 'Stale connection heartbeat missed.');
            continue;
          }
          liveConnection.ping();
        }
        return;
      }

      const socket = this.pluginSocket;
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        return;
      }

      if (
        this.pluginSocketLastPongAtMs <= 0 ||
        Date.now() - this.pluginSocketLastPongAtMs >= heartbeatTimeoutMs
      ) {
        socket.terminate();
        return;
      }

      try {
        socket.ping();
      } catch {
        socket.terminate();
      }
    }, Math.max(5, this.config.pluginHeartbeatIntervalSeconds) * 1000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
    this.pluginSocketAlive = false;
    this.pluginSocketLastPongAtMs = 0;
  }



  private isPluginHello(message: BridgeClientMessage | undefined): message is BridgePluginHello {
    return (
      typeof message === 'object' &&
      message !== null &&
      (message as { type?: unknown }).type === 'plugin_hello' &&
      (message as { protocolVersion?: unknown }).protocolVersion === 1 &&
      (message as { clientName?: unknown }).clientName === 'remnote-plugin'
    );
  }

  private isPluginRegister(message: BridgeClientMessage | undefined): message is BridgePluginRegister {
    return (
      typeof message === 'object' &&
      message !== null &&
      (message as { type?: unknown }).type === 'plugin_register' &&
      typeof (message as { pluginInstanceId?: unknown }).pluginInstanceId === 'string' &&
      typeof (message as { pluginConnectionId?: unknown }).pluginConnectionId === 'string' &&
      typeof (message as { sessionSecret?: unknown }).sessionSecret === 'string'
    );
  }

  private isAllowedWebSocketOrigin(req?: IncomingMessage): boolean {
    const origin = req?.headers.origin;
    if (!origin || this.config.deploymentMode === 'local') {
      return true;
    }
    if (!this.config.allowedOrigins.length) {
      return false;
    }
    return this.config.allowedOrigins.includes(origin);
  }

  private parseClientMessage(raw: WebSocket.RawData): BridgeClientMessage | undefined {
    const text = raw.toString('utf8');
    try {
      return JSON.parse(text) as BridgeClientMessage;
    } catch {
      return undefined;
    }
  }
}
