import type { RNPlugin } from '@remnote/plugin-sdk';
import {
  type BridgePluginHello,
  type BridgeCancelRequest,
  type BridgeRequest,
  type BridgeResponse,
  type BridgeServerHello,
  type PendingApprovalRequest,
  type PermissionMode,
  type PermissionScope,
  type ApprovalResolution,
  createBridgeFailure,
} from './protocol';
import { type BridgeStatusSnapshot } from './status';
import { handleBridgeRequest, parseBridgeRequest } from './handlers';

const PROTOCOL_VERSION = 1;
const INITIAL_RECONNECT_MS = 500;
const MAX_RECONNECT_MS = 8000;

export interface BrowserBridgeClientOptions {
  plugin: RNPlugin;
  serverUrl: string;
  token?: string;
  getPermissionMode: () => PermissionMode;
  getPermissionScope: () => PermissionScope;
  getApprovedRootRemId: () => string | null;
  requestApproval: (request: PendingApprovalRequest) => Promise<ApprovalResolution>;
  cancelApproval: (requestId: string, message: string) => void;
  onStatus: (status: BridgeStatusSnapshot) => void;
}

export class BrowserBridgeClient {
  private ws: WebSocket | undefined;
  private stopped = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  private reconnectDelayMs = INITIAL_RECONNECT_MS;
  private cancelledRequestIds = new Set<string>();
  private serverInfo: Pick<
    BridgeStatusSnapshot,
    | 'toolRegistryVersion'
    | 'publicToolCount'
    | 'publicTools'
    | 'callabilitySource'
    | 'realPluginVerifiedTools'
    | 'runtimeUnverifiedTools'
    | 'sdkUnsupportedTools'
    | 'hiddenTools'
    | 'serverStartedAt'
  > = {};

  constructor(private readonly options: BrowserBridgeClientOptions) {}

  connect() {
    this.stopped = false;
    this.openSocket();
  }

  disconnect() {
    this.stopped = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    this.ws?.close();
    this.ws = undefined;
    this.updateStatus('disconnected', 'Bridge client stopped.');
  }

  private updateStatus(
    state: BridgeStatusSnapshot['state'],
    lastEvent: string,
    lastError?: string,
    serverInfo: Pick<
      BridgeStatusSnapshot,
      | 'toolRegistryVersion'
      | 'publicToolCount'
      | 'publicTools'
      | 'callabilitySource'
      | 'realPluginVerifiedTools'
      | 'runtimeUnverifiedTools'
      | 'sdkUnsupportedTools'
      | 'hiddenTools'
      | 'serverStartedAt'
    > = this.serverInfo
  ) {
    this.options.onStatus({
      state,
      serverUrl: this.options.serverUrl,
      lastEvent,
      ...(lastError ? { lastError } : {}),
      ...serverInfo,
    });
  }

  private scheduleReconnect(reason: string) {
    if (this.stopped) {
      return;
    }

    this.updateStatus('disconnected', reason);
    const delay = this.reconnectDelayMs;
    this.reconnectDelayMs = Math.min(this.reconnectDelayMs * 2, MAX_RECONNECT_MS);
    this.reconnectTimer = setTimeout(() => this.openSocket(), delay);
  }

  private openSocket() {
    if (this.stopped) {
      return;
    }

    this.updateStatus('connecting', 'Connecting to local companion server.');

    try {
      this.ws = new WebSocket(this.options.serverUrl);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.updateStatus('error', 'Failed to create WebSocket.', message);
      this.scheduleReconnect('Retrying after WebSocket creation failure.');
      return;
    }

    this.ws.addEventListener('open', () => {
      this.reconnectDelayMs = INITIAL_RECONNECT_MS;
      this.updateStatus('connected', 'Connected to local companion server.');
      this.sendHello();
    });

    this.ws.addEventListener('message', (event) => {
      this.handleMessage(event.data).catch((error: unknown) => {
        console.error('Bridge client message handling failed:', error);
      });
    });

    this.ws.addEventListener('error', () => {
      this.updateStatus('error', 'WebSocket error. Check server and token.');
    });

    this.ws.addEventListener('close', () => {
      this.ws = undefined;
      this.scheduleReconnect('Disconnected from local companion server.');
    });
  }

  private sendHello() {
    const hello: BridgePluginHello = {
      type: 'plugin_hello',
      protocolVersion: PROTOCOL_VERSION,
      clientName: 'remnote-plugin',
      ...(this.options.token ? { token: this.options.token } : {}),
    };
    this.send(hello);
  }

  private send(message: unknown) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    this.ws.send(JSON.stringify(message));
  }

  private async handleMessage(rawData: unknown) {
    const rawText = typeof rawData === 'string' ? rawData : '';
    if (!rawText) {
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      this.send(createBridgeFailure('unknown', 'INVALID_ARGS', 'Bridge message was not valid JSON.'));
      return;
    }

    if (this.isServerHello(parsed)) {
      this.serverInfo = {
        toolRegistryVersion: parsed.toolRegistryVersion,
        publicToolCount: parsed.publicToolCount,
        publicTools: parsed.publicTools,
        callabilitySource: parsed.callabilitySource,
        realPluginVerifiedTools: parsed.realPluginVerifiedTools,
        runtimeUnverifiedTools: parsed.runtimeUnverifiedTools,
        sdkUnsupportedTools: parsed.sdkUnsupportedTools,
        hiddenTools: parsed.hiddenTools,
        serverStartedAt: parsed.serverStartedAt,
      };
      this.updateStatus('connected', 'Server handshake complete.');
      return;
    }

    if (this.isCancelRequest(parsed)) {
      this.cancelledRequestIds.add(parsed.id);
      this.options.cancelApproval(parsed.id, parsed.message);
      this.updateStatus('connected', `Server cancelled request ${parsed.id}: ${parsed.reason}.`);
      return;
    }

    const requestOrFailure = parseBridgeRequest(parsed);
    if ('ok' in requestOrFailure) {
      this.send(requestOrFailure);
      return;
    }

    let response: BridgeResponse;
    try {
      response = await handleBridgeRequest(this.options.plugin, requestOrFailure as BridgeRequest, {
        permissionMode: this.options.getPermissionMode(),
        permissionScope: this.options.getPermissionScope(),
        approvedRootRemId: this.options.getApprovedRootRemId(),
        requestApproval: this.options.requestApproval,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Bridge request failed internally:', message);
      response = createBridgeFailure(
        (requestOrFailure as BridgeRequest).id,
        'INTERNAL_ERROR',
        'Bridge request failed internally.',
        { message }
      );
    }

    if (this.cancelledRequestIds.delete((requestOrFailure as BridgeRequest).id)) {
      return;
    }

    this.send(response as BridgeResponse);
  }

  private isServerHello(message: unknown): message is BridgeServerHello {
    return (
      typeof message === 'object' &&
      message !== null &&
      (message as { type?: unknown }).type === 'server_hello'
    );
  }

  private isCancelRequest(message: unknown): message is BridgeCancelRequest {
    return (
      typeof message === 'object' &&
      message !== null &&
      (message as { type?: unknown }).type === 'cancel_request' &&
      typeof (message as { id?: unknown }).id === 'string'
    );
  }
}
