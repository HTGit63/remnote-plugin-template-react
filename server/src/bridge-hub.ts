import { createServer, type Server as HttpServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { WebSocket, WebSocketServer } from 'ws';
import {
  type BridgeClientMessage,
  type BridgePluginHello,
  type BridgeRequest,
  type BridgeResponse,
  type BridgeServerHello,
  type BridgeToolArgs,
  type BridgeToolName,
  createBridgeFailure,
} from '../../src/bridge/protocol.js';
import type { CompanionServerConfig } from './config.js';

interface PendingRequest {
  resolve: (response: BridgeResponse) => void;
  timeout: NodeJS.Timeout;
  tool: BridgeToolName;
  startedAt: number;
}

export interface BridgeHubStatus {
  connected: boolean;
  lastConnectedAt?: string;
  lastDisconnectedAt?: string;
  pendingRequests: number;
}

export class BridgeHub {
  private server: HttpServer | undefined;
  private wsServer: WebSocketServer | undefined;
  private pluginSocket: WebSocket | undefined;
  private pluginReady = false;
  private pending = new Map<string, PendingRequest>();
  private lastConnectedAt: string | undefined;
  private lastDisconnectedAt: string | undefined;

  constructor(private readonly config: CompanionServerConfig) {}

  start(): Promise<void> {
    this.server = createServer((req, res) => {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
    });

    this.wsServer = new WebSocketServer({
      server: this.server,
      path: this.config.bridgePath,
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

  get bridgePort(): number {
    const address = this.server?.address();
    return typeof address === 'object' && address ? address.port : this.config.bridgePort;
  }

  async callPlugin<TTool extends BridgeToolName>(
    tool: TTool,
    args: BridgeToolArgs[TTool],
    timeoutMs = this.config.requestTimeoutMs
  ): Promise<BridgeResponse> {
    if (!this.pluginReady || !this.pluginSocket || this.pluginSocket.readyState !== WebSocket.OPEN) {
      return createBridgeFailure('unknown', 'PLUGIN_NOT_CONNECTED', 'RemNote plugin is not connected.');
    }

    const id = randomUUID();
    const request: BridgeRequest<TTool> = {
      id,
      tool,
      args,
      timeoutMs,
    };

    return new Promise<BridgeResponse>((resolve) => {
      const timeout = setTimeout(() => {
        this.resolvePending(id, createBridgeFailure(id, 'TIMEOUT', `Timed out waiting for ${tool}.`));
      }, timeoutMs);

      this.pending.set(id, {
        resolve,
        timeout,
        tool,
        startedAt: Date.now(),
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
    this.pending.delete(id);
    console.info('Bridge hub request completed', {
      requestId: id,
      tool: pending.tool,
      errorCode: response.ok ? undefined : response.error.code,
      durationMs: Date.now() - pending.startedAt,
    });
    pending.resolve(response);
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
