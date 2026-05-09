import { createServer, type Server as HttpServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { WebSocket, WebSocketServer } from 'ws';
import {
  type BridgeClientMessage,
  type BridgeCancelRequest,
  type BridgePluginHello,
  type BridgeRequest,
  type BridgeResponse,
  type BridgeServerHello,
  type BridgeToolArgs,
  type BridgeToolName,
  createBridgeFailure,
} from '../../src/bridge/protocol.js';
import type { CompanionServerConfig } from './config.js';
import { getToolRegistrySummary } from './tool-registry.js';

interface PendingRequest {
  resolve: (response: BridgeResponse) => void;
  timeout: NodeJS.Timeout;
  tool: BridgeToolName;
  startedAt: number;
  timeoutMs: number;
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
  ok: boolean;
  errorCode?: string;
}

export interface BridgeHubDiagnostics {
  startedAt: string;
  status: BridgeHubStatus;
  pending: BridgeHubRequestSnapshot[];
  recentRequests: BridgeHubRequestOutcome[];
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
    };
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

    if (signal?.aborted) {
      return createBridgeFailure(id, 'CLIENT_DISCONNECTED', 'MCP caller disconnected before request started.');
    }

    if (!this.pluginReady || !this.pluginSocket || this.pluginSocket.readyState !== WebSocket.OPEN) {
      return createBridgeFailure(id, 'PLUGIN_NOT_CONNECTED', 'RemNote plugin is not connected.');
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
        this.resolvePending(id, createBridgeFailure(id, 'TIMEOUT', `Timed out waiting for ${tool}.`));
      }, timeoutMs);

      const abortHandler = () => {
        this.sendCancel(id, 'client_disconnected', 'MCP caller disconnected before request completed.');
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
        startedAt: Date.now(),
        timeoutMs,
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
        this.pluginSocket?.send(JSON.stringify(request), (error) => {
          if (!error) {
            return;
          }

          this.resolvePending(
            id,
            createBridgeFailure(id, 'PLUGIN_NOT_CONNECTED', 'Failed to send request to RemNote plugin.', {
              message: error.message,
            })
          );
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
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

      if (this.config.bridgeToken && hello.token !== this.config.bridgeToken) {
        socket.close(1008, 'Invalid bridge token.');
        return;
      }

      this.replacePluginSocket(socket);
      const serverHello: BridgeServerHello = {
        type: 'server_hello',
        protocolVersion: 1,
        serverName: 'remnote-companion',
        ...getToolRegistrySummary(this.config.enableDeleteTool),
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
    this.recordRequestOutcome(id, pending, response);
    console.info('Bridge hub request completed', {
      requestId: id,
      tool: pending.tool,
      errorCode: response.ok ? undefined : response.error.code,
      durationMs: Date.now() - pending.startedAt,
    });
    pending.resolve(response);
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

  private recordRequestOutcome(id: string, pending: PendingRequest, response: BridgeResponse) {
    this.recentRequests.unshift({
      id,
      tool: pending.tool,
      startedAt: new Date(pending.startedAt).toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - pending.startedAt,
      ok: response.ok,
      errorCode: response.ok ? undefined : response.error.code,
    });

    if (this.recentRequests.length > 25) {
      this.recentRequests.length = 25;
    }
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
