import { createServer, type IncomingMessage, type Server as HttpServer } from 'node:http';
import type { Duplex } from 'node:stream';
import { createHash, randomUUID } from 'node:crypto';
import { WebSocket, WebSocketServer } from 'ws';
import {
  type BridgeClientMessage,
  type BridgeCancelRequest,
  type BridgeLifecycleEvent,
  type BridgeLifecyclePhase,
  type BridgePluginHello,
  type BridgePluginRegister,
  type BridgeRequest,
  type BridgeResponse,
  type BridgeServerHello,
  type BridgeToolArgs,
  type BridgeToolName,
  BRIDGE_TOOL_ANNOTATIONS,
  type BridgeErrorCode,
  createBridgeFailure,
} from '../../src/bridge/protocol.js';
import type { AuthenticatedPrincipal } from './auth/types.js';
import type { CompanionServerConfig } from './config.js';
import type { BridgeHealthCheckResult } from './health-check-types.js';
import { SessionRouter } from './bridge/session-router.js';
import type { StorageProvider } from './storage/types.js';
import { getToolRegistrySummary } from './tool-registry.js';

interface PendingRequest {
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
  pending: BridgeHubRequestSnapshot[];
  recentRequests: BridgeHubRequestOutcome[];
  lastHealthCheck: BridgeHealthCheckResult | null;
  sessionRouter?: ReturnType<SessionRouter['getStatus']>;
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

function createLifecycleEvent(phase: BridgeLifecyclePhase, message?: string): BridgeLifecycleEvent {
  return {
    phase,
    at: new Date().toISOString(),
    ...(message ? { message } : {}),
  };
}

function hashDiagnosticId(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return `hash_${hash.toString(16)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringArrayFrom(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : [];
}

function getUniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

const TRANSIENT_BRIDGE_ERRORS = new Set<BridgeErrorCode>([
  'PLUGIN_NOT_CONNECTED',
  'TIMEOUT',
  'CLIENT_DISCONNECTED',
]);
const MAX_RECENT_REQUEST_OUTCOMES = 200;
const RECONNECT_RETRY_WINDOW_MS = 1200;
const RECONNECT_RETRY_INTERVAL_MS = 50;

function isTransientFailure(response: BridgeResponse): boolean {
  return !response.ok && TRANSIENT_BRIDGE_ERRORS.has(response.error.code);
}

function hasLifecyclePhase(lifecycle: readonly BridgeLifecycleEvent[] | undefined, phase: BridgeLifecyclePhase): boolean {
  return Boolean(lifecycle?.some((event) => event.phase === phase));
}

function requestReachedPlugin(response: BridgeResponse): boolean {
  return hasLifecyclePhase(response.lifecycle, 'executing') || hasLifecyclePhase(response.lifecycle, 'waiting_for_remnote_approval');
}

function hasIdempotencyKey(args: unknown): boolean {
  return Boolean(getIdempotencyKey(args));
}

function getIdempotencyKey(args: unknown): string | undefined {
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

function isHighLevelIdempotentWrite(tool: BridgeToolName): boolean {
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

function targetRootFromArgs(args: unknown): string | undefined {
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

function requestHash(tool: BridgeToolName, args: unknown): string {
  return createHash('sha256').update(JSON.stringify({ tool, args })).digest('hex');
}

function isDeleteTool(tool: BridgeToolName): boolean {
  return tool === 'delete_rem_by_id';
}

function isRealDeleteAttempt(tool: BridgeToolName, args: unknown): boolean {
  if (tool === 'delete_rem_by_id') {
    return isRecord(args) && args.dryRun === false;
  }

  return false;
}

function retryableFailure(
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

function retryableOriginalFailure(tool: BridgeToolName, response: BridgeResponse): BridgeResponse {
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

function retryableUnknownWriteFailure(tool: BridgeToolName, response: BridgeResponse): BridgeResponse {
  return retryableFailure(
    tool,
    response,
    'RETRYABLE_UNKNOWN_WRITE_STATUS',
    'The write may have reached RemNote before the bridge connection ended.',
    'Re-check the target Rem state before retrying; retry only with the same idempotencyKey when one was supplied.'
  );
}

function retryableUnknownDeleteFailure(tool: BridgeToolName, response: BridgeResponse): BridgeResponse {
  return retryableFailure(
    tool,
    response,
    'RETRYABLE_UNKNOWN_DELETE_STATUS',
    'The delete status is unknown because the bridge connection ended during the request.',
    'Run a fresh dry-run preview or get_rem on the target ID before attempting any real delete again.'
  );
}

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
  private lastConnectedAt: string | undefined;
  private lastDisconnectedAt: string | undefined;
  private readonly startedAt = new Date().toISOString();
  private readonly recentRequests: BridgeHubRequestOutcome[] = [];
  private lastHealthCheck: BridgeHealthCheckResult | null = null;
  private readonly sessionRouter: SessionRouter;
  private readonly socketUsers = new WeakMap<WebSocket, string>();

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
    if (this.config.deploymentMode === 'hosted') {
      return {
        connected: this.sessionRouter.getStatus().activeConnections > 0,
        lastConnectedAt: this.lastConnectedAt,
        lastDisconnectedAt: this.lastDisconnectedAt,
        pendingRequests: this.pending.size,
      };
    }

    return {
      connected: this.pluginReady && this.pluginSocket?.readyState === WebSocket.OPEN,
      lastConnectedAt: this.lastConnectedAt,
      lastDisconnectedAt: this.lastDisconnectedAt,
      pendingRequests: this.pending.size,
    };
  }

  getDiagnostics(): BridgeHubDiagnostics {
    const now = Date.now();
    return {
      startedAt: this.startedAt,
      status: this.getStatus(),
      pending: Array.from(this.pending.entries()).map(([id, request]) => ({
        id,
        tool: request.tool,
        startedAt: new Date(request.startedAt).toISOString(),
        ageMs: now - request.startedAt,
        timeoutMs: request.timeoutMs,
        status: request.status,
      })),
      recentRequests: [...this.recentRequests],
      lastHealthCheck: this.lastHealthCheck,
      sessionRouter: this.sessionRouter.getStatus(),
      activePluginConnections: this.sessionRouter.getActiveConnectionInfos().map((connection) => ({
        ...connection,
        userId: connection.userId === '__local__' ? '__local__' : hashDiagnosticId(connection.userId),
        pluginSessionId: hashDiagnosticId(connection.pluginSessionId),
      })),
    };
  }

  recordHealthCheck(result: BridgeHealthCheckResult) {
    this.lastHealthCheck = result;
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

      if (requestReachedPlugin(firstResponse) && isRealDeleteAttempt(tool, args)) {
        return this.recordSyntheticFailure(tool, timeoutMs, retryableUnknownDeleteFailure(tool, firstResponse));
      }
      if (requestReachedPlugin(firstResponse) && !BRIDGE_TOOL_ANNOTATIONS[tool].readOnlyHint) {
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

    const target = this.getTargetSocket(principal);
    if (!target.ok) {
      lifecycle.push(createLifecycleEvent('failed', 'RemNote plugin is not connected.'));
      const response = createBridgeFailure(
        id,
        target.error,
        target.message,
        undefined,
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
        this.sendCancel(id, 'server_timeout', `Timed out waiting for ${tool}.`);
        this.pending.get(id)?.lifecycle.push(
          createLifecycleEvent('timeout', `Timed out waiting for ${tool}.`)
        );
        this.resolvePending(id, createBridgeFailure(id, 'TIMEOUT', `Timed out waiting for ${tool}.`));
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
        lifecycle.push(createLifecycleEvent('executing', 'Request forwarded to RemNote plugin WebSocket.'));
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

    const reachedPlugin = requestReachedPlugin(response);
    if (!response.ok && response.error.code === 'TIMEOUT') {
      if (isRealDeleteAttempt(tool, args)) {
        return reachedPlugin ? 'unknown_delete' : 'retryable';
      }
      if (reachedPlugin && !BRIDGE_TOOL_ANNOTATIONS[tool].readOnlyHint) {
        return 'unknown_write';
      }
      return 'retryable';
    }

    if (isRealDeleteAttempt(tool, args)) {
      return reachedPlugin ? 'unknown_delete' : 'retryable';
    }

    if (allowRetry && BRIDGE_TOOL_ANNOTATIONS[tool].readOnlyHint) {
      return 'retry';
    }

    if (allowRetry && !BRIDGE_TOOL_ANNOTATIONS[tool].destructiveHint && hasIdempotencyKey(args)) {
      return 'retry';
    }

    if (reachedPlugin && isDeleteTool(tool)) {
      return 'unknown_delete';
    }

    if (reachedPlugin && !BRIDGE_TOOL_ANNOTATIONS[tool].readOnlyHint) {
      return 'unknown_write';
    }

    return 'retryable';
  }

  private async waitForPluginReconnect(signal?: AbortSignal): Promise<boolean> {
    const deadline = Date.now() + RECONNECT_RETRY_WINDOW_MS;
    while (Date.now() <= deadline) {
      if (signal?.aborted) {
        return false;
      }

      if (this.getStatus().connected) {
        return true;
      }

      await new Promise((resolve) => setTimeout(resolve, RECONNECT_RETRY_INTERVAL_MS));
    }

    return this.getStatus().connected;
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
    | { ok: true; socket: WebSocket; userId: string }
    | { ok: false; error: BridgeErrorCode; message: string } {
    if (this.config.deploymentMode === 'hosted') {
      const userId = principal?.userId;
      if (!userId) {
        return {
          ok: false,
          error: 'NO_PAIRED_PLUGIN_SESSION',
          message: 'MCP request has no paired hosted plugin session.',
        };
      }

      const connection = this.sessionRouter.getConnectionForUser(userId);
      if (!connection) {
        return {
          ok: false,
          error: 'PLUGIN_NOT_CONNECTED',
          message: 'RemNote plugin is not connected. Open RemNote and reconnect the ChatGPT Bridge plugin.',
        };
      }

      return {
        ok: true,
        socket: connection.socketRef,
        userId,
      };
    }

    if (!this.pluginReady || !this.pluginSocket || this.pluginSocket.readyState !== WebSocket.OPEN) {
      return {
        ok: false,
        error: 'PLUGIN_NOT_CONNECTED',
        message: 'RemNote plugin is not connected.',
      };
    }

    return {
      ok: true,
      socket: this.pluginSocket,
      userId: '__local__',
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
        this.socketUsers.set(socket, routed.connection.userId);
        this.pluginReady = this.sessionRouter.getStatus().activeConnections > 0;
        this.lastConnectedAt = new Date().toISOString();
        socket.on('message', (message) => this.handlePluginMessage(socket, message));
        socket.on('close', () => this.handleHostedPluginClose(socket));
        socket.on('error', () => this.handleHostedPluginClose(socket));
        this.startHeartbeat();
      } else {
        this.replacePluginSocket(socket);
      }

      const toolCallAuthMode =
        this.config.deploymentMode === 'hosted'
          ? 'hosted_oauth_required'
          : this.config.bridgeToken && !this.config.allowNoToken
            ? 'local_bearer_required'
            : 'no_auth_allowed';
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

  private handleHostedPluginClose(socket: WebSocket) {
    const userId = this.socketUsers.get(socket);
    if (!userId) {
      return;
    }

    this.socketUsers.delete(socket);
    this.sessionRouter.removeConnection(userId);
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
    console.info('Bridge hub request completed', {
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
    const evidence = this.getExecutionEvidence(response);
    this.recentRequests.unshift({
      id,
      tool: pending.tool,
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
    this.recentRequests.unshift({
      id,
      tool,
      status: this.terminalStatus(response),
      startedAt: new Date(startedAt).toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      timeoutMs,
      ok: response.ok,
      errorCode: response.ok ? undefined : response.error.code,
      lifecycle,
      ...this.getExecutionEvidence(response),
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
    this.heartbeatTimer = setInterval(() => {
      if (this.config.deploymentMode === 'hosted') {
        for (const connection of this.sessionRouter.getActiveConnectionInfos()) {
          const liveConnection = this.sessionRouter.getConnectionForUser(connection.userId);
          if (!liveConnection) {
            continue;
          }
          if (!liveConnection.alive) {
            liveConnection.close(1011, 'Stale connection heartbeat missed.');
            continue;
          }
          liveConnection.alive = false;
          liveConnection.ping();
        }
        return;
      }

      const socket = this.pluginSocket;
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        return;
      }

      if (!this.pluginSocketAlive) {
        socket.terminate();
        return;
      }

      this.pluginSocketAlive = false;
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
  }

  private getExecutionEvidence(response: BridgeResponse) {
    const createdRemIds = this.extractCreatedRemIds(response);
    const partialExecution = this.extractPartialExecution(response, createdRemIds);
    return {
      ...(createdRemIds.length ? { createdRemIds } : {}),
      ...this.getUpdatedDeletedEvidence(response),
      ...(partialExecution ? { partialExecution } : {}),
      ...(!response.ok && response.error.code === 'SDK_UNSUPPORTED' ? { sdkUnsupported: true } : {}),
    };
  }

  private getUpdatedDeletedEvidence(response: BridgeResponse) {
    const payload = response.ok ? response.result : response.error.details;
    if (!isRecord(payload)) {
      return {};
    }

    const updatedRemIds = getUniqueStrings([
      ...stringArrayFrom(payload.updatedRemIds),
      ...(typeof payload.updatedRemId === 'string' ? [payload.updatedRemId] : []),
      ...(typeof payload.remId === 'string' ? [payload.remId] : []),
    ]);
    const deletedRemIds = getUniqueStrings([
      ...stringArrayFrom(payload.deletedRemIds),
      ...(typeof payload.deletedRemId === 'string' ? [payload.deletedRemId] : []),
    ]);
    return {
      ...(updatedRemIds.length ? { updatedRemIds } : {}),
      ...(deletedRemIds.length ? { deletedRemIds } : {}),
    };
  }

  private extractCreatedRemIds(response: BridgeResponse): string[] {
    const ids: string[] = [];
    const payload = response.ok ? response.result : response.error.details;

    if (isRecord(payload)) {
      if (typeof payload.createdRemId === 'string') {
        ids.push(payload.createdRemId);
      }
      if (typeof payload.rootCreatedRemId === 'string') {
        ids.push(payload.rootCreatedRemId);
      }
      ids.push(...stringArrayFrom(payload.createdRemIds));
      ids.push(...stringArrayFrom(payload.createdChildRemIds));

      const partialExecution = isRecord(payload.partialExecution)
        ? payload.partialExecution
        : undefined;
      if (partialExecution) {
        if (typeof partialExecution.createdRemId === 'string') {
          ids.push(partialExecution.createdRemId);
        }
        if (typeof partialExecution.rootCreatedRemId === 'string') {
          ids.push(partialExecution.rootCreatedRemId);
        }
        ids.push(...stringArrayFrom(partialExecution.createdRemIds));
        ids.push(...stringArrayFrom(partialExecution.createdChildRemIds));
      }

      const originalDetails = isRecord(payload.originalDetails)
        ? payload.originalDetails
        : undefined;
      const nestedPartial = originalDetails && isRecord(originalDetails.partialExecution)
        ? originalDetails.partialExecution
        : undefined;
      if (nestedPartial) {
        ids.push(...stringArrayFrom(nestedPartial.createdRemIds));
      }
    }

    return getUniqueStrings(ids);
  }

  private extractPartialExecution(
    response: BridgeResponse,
    createdRemIds: string[]
  ): unknown | undefined {
    if (response.ok) {
      return undefined;
    }

    const details = isRecord(response.error.details) ? response.error.details : undefined;
    if (!details) {
      return createdRemIds.length ? { createdRemIds } : undefined;
    }

    if (isRecord(details.partialExecution)) {
      return details.partialExecution;
    }

    if (createdRemIds.length) {
      return {
        createdRemIds,
        rollbackStatus: 'not_attempted',
      };
    }

    return undefined;
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
