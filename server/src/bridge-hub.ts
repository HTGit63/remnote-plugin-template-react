import { createServer, type Server as HttpServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { WebSocket, WebSocketServer } from 'ws';
import {
  type BridgeClientMessage,
  type BridgeCancelRequest,
  type BridgeLifecycleEvent,
  type BridgeLifecyclePhase,
  type BridgePluginHello,
  type BridgeRequest,
  type BridgeResponse,
  type BridgeServerHello,
  type BridgeToolArgs,
  type BridgeToolName,
  createBridgeFailure,
} from '../../src/bridge/protocol.js';
import type { CompanionServerConfig } from './config.js';
import type { BridgeHealthCheckResult } from './health-check-types.js';
import { getToolRegistrySummary } from './tool-registry.js';

interface PendingRequest {
  resolve: (response: BridgeResponse) => void;
  timeout: NodeJS.Timeout;
  tool: BridgeToolName;
  startedAt: number;
  timeoutMs: number;
  lifecycle: BridgeLifecycleEvent[];
  cleanupAbortListener?: () => void;
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
}

export interface BridgeHubRequestOutcome {
  id: string;
  tool: BridgeToolName;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  timeoutMs: number;
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
}

function createLifecycleEvent(phase: BridgeLifecyclePhase, message?: string): BridgeLifecycleEvent {
  return {
    phase,
    at: new Date().toISOString(),
    ...(message ? { message } : {}),
  };
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

export class BridgeHub {
  private server: HttpServer | undefined;
  private wsServer: WebSocketServer | undefined;
  private pluginSocket: WebSocket | undefined;
  private pluginReady = false;
  private pending = new Map<string, PendingRequest>();
  private lastConnectedAt: string | undefined;
  private lastDisconnectedAt: string | undefined;
  private readonly startedAt = new Date().toISOString();
  private readonly recentRequests: BridgeHubRequestOutcome[] = [];
  private lastHealthCheck: BridgeHealthCheckResult | null = null;

  constructor(private readonly config: CompanionServerConfig) {}

  start(): Promise<void> {
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

    this.wsServer.on('connection', (socket) => this.handleConnection(socket));

    return new Promise((resolve, reject) => {
      this.server?.once('error', reject);
      this.server?.listen(this.config.bridgePort, this.config.bindHost, () => {
        this.server?.off('error', reject);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
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
    this.pluginSocket = undefined;
    this.pluginReady = false;

    await new Promise<void>((resolve) => {
      this.wsServer?.close(() => resolve());
      if (!this.wsServer) {
        resolve();
      }
    });

    await new Promise<void>((resolve) => {
      this.server?.close(() => resolve());
      if (!this.server) {
        resolve();
      }
    });
  }

  getStatus(): BridgeHubStatus {
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
      })),
      recentRequests: [...this.recentRequests],
      lastHealthCheck: this.lastHealthCheck,
    };
  }

  recordHealthCheck(result: BridgeHealthCheckResult) {
    this.lastHealthCheck = result;
  }

  get bridgePort(): number {
    const address = this.server?.address();
    return typeof address === 'object' && address ? address.port : this.config.bridgePort;
  }

  async callPlugin<TTool extends BridgeToolName>(
    tool: TTool,
    args: BridgeToolArgs[TTool],
    timeoutMs = this.config.requestTimeoutMs,
    signal?: AbortSignal
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

    if (!this.pluginReady || !this.pluginSocket || this.pluginSocket.readyState !== WebSocket.OPEN) {
      lifecycle.push(createLifecycleEvent('failed', 'RemNote plugin is not connected.'));
      const response = createBridgeFailure(
        id,
        'PLUGIN_NOT_CONNECTED',
        'RemNote plugin is not connected.',
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
        startedAt,
        timeoutMs,
        lifecycle,
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
        this.pluginSocket?.send(JSON.stringify(request), (error) => {
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

  private handleConnection(socket: WebSocket) {
    socket.once('message', (raw) => {
      const hello = this.parseClientMessage(raw);
      if (!this.isPluginHello(hello)) {
        socket.close(1008, 'Expected plugin hello.');
        return;
      }

      if (this.config.bridgeToken && !this.config.allowNoToken && hello.token !== this.config.bridgeToken) {
        socket.close(1008, 'Invalid bridge token.');
        return;
      }

      const toolCallAuthMode =
        this.config.bridgeToken && !this.config.allowNoToken
          ? 'local_bearer_required'
          : 'no_auth_allowed';
      this.replacePluginSocket(socket);
      const serverHello: BridgeServerHello = {
        type: 'server_hello',
        protocolVersion: 1,
        serverName: 'remnote-companion',
        ...getToolRegistrySummary(this.config.enableDeleteTool, undefined, {
          discoveryAuthMode: 'no_auth_required',
          toolCallAuthMode,
        }),
        serverStartedAt: this.startedAt,
      };
      socket.send(JSON.stringify(serverHello));
    });
  }

  private replacePluginSocket(socket: WebSocket) {
    this.pluginSocket?.close(1012, 'New RemNote plugin connection opened.');
    this.pluginSocket = socket;
    this.pluginReady = true;
    this.lastConnectedAt = new Date().toISOString();

    socket.on('message', (raw) => this.handlePluginMessage(socket, raw));
    socket.on('close', () => this.handlePluginClose(socket));
    socket.on('error', () => this.handlePluginClose(socket));
  }

  private handlePluginClose(socket: WebSocket) {
    if (!this.pluginReady || socket !== this.pluginSocket) {
      return;
    }

    this.pluginReady = false;
    this.pluginSocket = undefined;
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

  private handlePluginMessage(socket: WebSocket, raw: WebSocket.RawData) {
    if (socket !== this.pluginSocket) {
      return;
    }

    const message = this.parseClientMessage(raw);
    if (!message || !('ok' in message)) {
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
    if (!this.pluginSocket || this.pluginSocket.readyState !== WebSocket.OPEN) {
      return;
    }

    const cancel: BridgeCancelRequest = {
      type: 'cancel_request',
      id,
      reason,
      message,
    };

    try {
      this.pluginSocket.send(JSON.stringify(cancel));
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
    this.recentRequests.unshift({
      id,
      tool: pending.tool,
      startedAt: new Date(pending.startedAt).toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - pending.startedAt,
      timeoutMs: pending.timeoutMs,
      ok: response.ok,
      errorCode: response.ok ? undefined : response.error.code,
      lifecycle,
      ...(pluginLifecycle ? { pluginLifecycle } : {}),
      ...this.getExecutionEvidence(response),
    });

    if (this.recentRequests.length > 25) {
      this.recentRequests.length = 25;
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
      startedAt: new Date(startedAt).toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      timeoutMs,
      ok: response.ok,
      errorCode: response.ok ? undefined : response.error.code,
      lifecycle,
      ...this.getExecutionEvidence(response),
    });

    if (this.recentRequests.length > 25) {
      this.recentRequests.length = 25;
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

  private parseClientMessage(raw: WebSocket.RawData): BridgeClientMessage | undefined {
    const text = raw.toString('utf8');
    try {
      return JSON.parse(text) as BridgeClientMessage;
    } catch {
      return undefined;
    }
  }
}
