import type { RNPlugin } from '@remnote/plugin-sdk';
import {
  type BridgePluginHello,
  type BridgePluginRuntimeInfo,
  type BridgePluginRegister,
  type BridgeCancelRequest,
  type BridgeLifecycleEvent,
  type BridgeRequest,
  type BridgeResponse,
  type BridgeServerHello,
  type PendingApprovalRequest,
  type PermissionMode,
  type PermissionScope,
  type ApprovalResolution,
  createBridgeFailure,
  BRIDGE_TOOL_NAMES,
} from '../../shared/bridge/protocol';
import { getBridgeCloseState, type BridgeStatusSnapshot } from './status';
import { handleBridgeRequest, parseBridgeRequest } from './handlers';
import type { HostedPairingSession } from './pairing';
import { getBridgePluginRuntimeInfo } from '../remnote/capabilities';

const PROTOCOL_VERSION = 1;
const INITIAL_RECONNECT_MS = 500;
const MAX_RECONNECT_MS = 8000;

export interface BrowserBridgeClientOptions {
  plugin: RNPlugin;
  serverUrl: string;
  token?: string;
  hostedSession?: HostedPairingSession | null;
  getPermissionMode: () => PermissionMode;
  getPermissionScope: () => PermissionScope;
  getApprovedRootRemId: () => string | null;
  requestApproval: (request: PendingApprovalRequest) => Promise<ApprovalResolution>;
  cancelApproval: (requestId: string, message: string) => void;
  onStatus: (status: BridgeStatusSnapshot) => void;
  onRequestStarted?: (request: BridgeRequest) => void;
  onRequestCompleted?: (request: BridgeRequest, response: BridgeResponse) => void;
}

export class BrowserBridgeClient {
  private ws: WebSocket | undefined;
  private stopped = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  private reconnectDelayMs = INITIAL_RECONNECT_MS;
  private connectivityEventsAttached = false;
  private cancelledRequestIds = new Set<string>();
  private pluginRuntimeInfo: BridgePluginRuntimeInfo | undefined;
  private serverInfo: Pick<
    BridgeStatusSnapshot,
    | 'toolProfile'
    | 'toolTier'
    | 'activeToolTier'
    | 'defaultToolTier'
    | 'toolSchemaVersion'
    | 'toolRegistryVersion'
    | 'allPublicToolCount'
    | 'allPublicTools'
    | 'publicToolCount'
    | 'publicTools'
    | 'callabilitySource'
    | 'realPluginVerifiedTools'
    | 'runtimeUnverifiedTools'
    | 'sdkUnsupportedTools'
    | 'preferredTools'
    | 'fallbackTools'
    | 'debugTools'
    | 'readTools'
    | 'cardTools'
    | 'dangerousTools'
    | 'unsupportedTools'
    | 'profileHiddenTools'
    | 'toolMetadata'
    | 'toolTierSummary'
    | 'runtimeVerificationMatrix'
    | 'hiddenTools'
    | 'requiresConnectorRefresh'
    | 'serverStartedAt'
    | 'pluginRuntime'
    | 'sdkVersion'
    | 'supportedSdkCapabilities'
    | 'unsupportedSdkCapabilities'
    | 'initialSyncComplete'
    | 'initialSyncTimedOut'
    | 'initialSyncWarning'
  > = {};

  constructor(private readonly options: BrowserBridgeClientOptions) {}

  connect() {
    this.stopped = false;
    this.attachConnectivityEvents();
    this.openSocket();
  }

  disconnect() {
    this.stopped = true;
    this.detachConnectivityEvents();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    this.ws?.close();
    this.ws = undefined;
    this.updateStatus('disconnected', 'Bridge client stopped.');
  }

  private readonly handleBrowserOnline = () => {
    if (this.stopped || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    this.reconnectDelayMs = INITIAL_RECONNECT_MS;
    const staleSocket = this.ws;
    this.ws = undefined;
    staleSocket?.close();
    this.updateStatus('reconnecting', 'Network restored. Reconnecting bridge immediately.');
    this.openSocket();
  };

  private attachConnectivityEvents() {
    if (this.connectivityEventsAttached || typeof globalThis.addEventListener !== 'function') {
      return;
    }
    globalThis.addEventListener('online', this.handleBrowserOnline);
    this.connectivityEventsAttached = true;
  }

  private detachConnectivityEvents() {
    if (!this.connectivityEventsAttached || typeof globalThis.removeEventListener !== 'function') {
      return;
    }
    globalThis.removeEventListener('online', this.handleBrowserOnline);
    this.connectivityEventsAttached = false;
  }

  private updateStatus(
    state: BridgeStatusSnapshot['state'],
    lastEvent: string,
    lastError?: string,
    serverInfo: Pick<
      BridgeStatusSnapshot,
      | 'toolProfile'
      | 'toolTier'
      | 'activeToolTier'
      | 'defaultToolTier'
      | 'toolSchemaVersion'
      | 'toolRegistryVersion'
      | 'allPublicToolCount'
      | 'allPublicTools'
      | 'publicToolCount'
      | 'publicTools'
      | 'callabilitySource'
      | 'realPluginVerifiedTools'
      | 'runtimeUnverifiedTools'
      | 'sdkUnsupportedTools'
      | 'preferredTools'
      | 'fallbackTools'
      | 'debugTools'
      | 'readTools'
      | 'cardTools'
      | 'dangerousTools'
      | 'unsupportedTools'
      | 'profileHiddenTools'
      | 'toolMetadata'
      | 'toolTierSummary'
      | 'runtimeVerificationMatrix'
      | 'hiddenTools'
      | 'requiresConnectorRefresh'
      | 'serverStartedAt'
      | 'pluginRuntime'
      | 'sdkVersion'
      | 'supportedSdkCapabilities'
      | 'unsupportedSdkCapabilities'
      | 'initialSyncComplete'
      | 'initialSyncTimedOut'
      | 'initialSyncWarning'
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

  private scheduleReconnect(
    reason: string,
    lastError?: string,
    state: BridgeStatusSnapshot['state'] = 'reconnecting'
  ) {
    if (this.stopped) {
      return;
    }

    this.updateStatus(state, reason, lastError);
    if (this.reconnectTimer) {
      return;
    }
    const delay = this.reconnectDelayMs;
    this.reconnectDelayMs = Math.min(this.reconnectDelayMs * 2, MAX_RECONNECT_MS);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      this.openSocket();
    }, delay);
  }

  private openSocket() {
    if (this.stopped) {
      return;
    }
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    this.updateStatus('connecting', 'Connecting to local companion server.');

    let socket: WebSocket;
    try {
      socket = new WebSocket(this.options.serverUrl);
      this.ws = socket;
    } catch (error: unknown) {
      this.ws = undefined;
      const message = error instanceof Error ? error.message : String(error);
      this.updateStatus('error', 'Failed to create WebSocket.', message);
      this.scheduleReconnect('Retrying after WebSocket creation failure.', message, 'server_unreachable');
      return;
    }

    socket.addEventListener('open', () => {
      if (this.stopped || this.ws !== socket) {
        socket.close();
        return;
      }
      this.updateStatus('connecting', 'WebSocket opened. Registering RemNote plugin...');
      this.sendHello().catch((error: unknown) => {
        if (this.stopped || this.ws !== socket) {
          return;
        }
        const message = error instanceof Error ? error.message : String(error);
        this.updateStatus('error', 'Failed to prepare RemNote plugin registration.', message);
        socket.close(1011, 'RemNote plugin registration failed.');
      });
    });

    socket.addEventListener('message', (event) => {
      if (this.ws !== socket) {
        return;
      }
      this.handleMessage(event.data).catch((error: unknown) => {
        console.error('Bridge client message handling failed:', error);
      });
    });

    socket.addEventListener('error', () => {
      if (this.ws !== socket) {
        return;
      }
      this.updateStatus('error', 'WebSocket error. Check server and token.');
    });

    socket.addEventListener('close', (event) => {
      if (this.ws !== socket) {
        return;
      }
      this.ws = undefined;
      if (this.stopped) {
        return;
      }
      const closeReason = event.reason?.trim() || 'Companion server connection closed.';
      const closeState = getBridgeCloseState({
        code: event.code,
        reason: event.reason,
        hosted: Boolean(this.options.hostedSession?.sessionSecret),
      });
      this.updateStatus(closeState, closeReason, closeReason);
      if (
        closeState !== 'token_expired' &&
        closeState !== 'session_revoked' &&
        closeState !== 'device_conflict' &&
        closeState !== 'not_paired'
      ) {
        this.scheduleReconnect(
          `Retrying after ${closeReason.toLowerCase()}`,
          closeReason,
          closeState
        );
      }
    });
  }

  private async getRuntimeInfoForHello(): Promise<BridgePluginRuntimeInfo> {
    if (this.pluginRuntimeInfo?.initialSyncComplete) {
      return this.pluginRuntimeInfo;
    }

    this.updateStatus('connecting', 'Checking RemNote SDK capabilities and initial sync status.');
    this.pluginRuntimeInfo = await getBridgePluginRuntimeInfo(this.options.plugin);
    if (this.pluginRuntimeInfo.initialSyncComplete) {
      this.updateStatus('connecting', 'RemNote initial sync complete. Registering bridge.');
    } else {
      this.updateStatus(
        'connecting',
        'Registering bridge with initial-sync diagnostic warning.',
        this.pluginRuntimeInfo.initialSyncWarning
      );
    }
    return this.pluginRuntimeInfo;
  }

  private async sendHello() {
    const pluginRuntime = await this.getRuntimeInfoForHello();
    const hostedSession = this.options.hostedSession;
    if (hostedSession?.sessionSecret) {
      const register: BridgePluginRegister = {
        type: 'plugin_register',
        pluginInstanceId: hostedSession.pluginInstanceId || hostedSession.deviceId,
        pluginConnectionId: hostedSession.pluginConnectionId || hostedSession.pluginSessionId || `conn_${Date.now().toString(36)}`,
        sessionSecret: hostedSession.sessionSecret,
        workspaceLabel: hostedSession.deviceName || 'Active RemNote workspace',
        supportedTools: [...BRIDGE_TOOL_NAMES],
        pluginRuntime,
        accessScope: hostedSession.accessScope,
        trustedWriteMode: hostedSession.trustedWriteMode,
        toolTier: hostedSession.toolTier,
      };
      this.send(register);
      return;
    }

    const hello: BridgePluginHello = {
      type: 'plugin_hello',
      protocolVersion: PROTOCOL_VERSION,
      clientName: 'remnote-plugin',
      pluginRuntime,
      ...(hostedSession
        ? {
            deploymentMode: 'hosted' as const,
            deviceId: hostedSession.deviceId,
            pluginSessionId: hostedSession.pluginSessionId,
            pluginSessionToken: hostedSession.pluginSessionToken,
          }
        : this.options.token
          ? { token: this.options.token }
          : {}),
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
      this.reconnectDelayMs = INITIAL_RECONNECT_MS;
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = undefined;
      }
      this.serverInfo = {
        toolProfile: parsed.toolProfile,
        toolTier: parsed.toolTier,
        activeToolTier: parsed.activeToolTier,
        defaultToolTier: parsed.defaultToolTier,
        toolSchemaVersion: parsed.toolSchemaVersion,
        toolRegistryVersion: parsed.toolRegistryVersion,
        allPublicToolCount: parsed.allPublicToolCount,
        allPublicTools: parsed.allPublicTools,
        publicToolCount: parsed.publicToolCount,
        publicTools: parsed.publicTools,
        callabilitySource: parsed.callabilitySource,
        realPluginVerifiedTools: parsed.realPluginVerifiedTools,
        runtimeUnverifiedTools: parsed.runtimeUnverifiedTools,
        sdkUnsupportedTools: parsed.sdkUnsupportedTools,
        preferredTools: parsed.preferredTools,
        fallbackTools: parsed.fallbackTools,
        debugTools: parsed.debugTools,
        readTools: parsed.readTools,
        cardTools: parsed.cardTools,
        dangerousTools: parsed.dangerousTools,
        unsupportedTools: parsed.unsupportedTools,
        profileHiddenTools: parsed.profileHiddenTools,
        toolMetadata: parsed.toolMetadata,
        toolTierSummary: parsed.toolTierSummary,
        runtimeVerificationMatrix: parsed.runtimeVerificationMatrix,
        hiddenTools: parsed.hiddenTools,
        requiresConnectorRefresh: parsed.requiresConnectorRefresh,
        serverStartedAt: parsed.serverStartedAt,
        pluginRuntime: parsed.pluginRuntime ?? this.pluginRuntimeInfo ?? null,
        sdkVersion: parsed.sdkVersion ?? this.pluginRuntimeInfo?.sdkVersion,
        supportedSdkCapabilities:
          parsed.supportedSdkCapabilities ?? this.pluginRuntimeInfo?.supportedSdkCapabilities,
        unsupportedSdkCapabilities:
          parsed.unsupportedSdkCapabilities ?? this.pluginRuntimeInfo?.unsupportedSdkCapabilities,
        initialSyncComplete:
          parsed.initialSyncComplete ?? this.pluginRuntimeInfo?.initialSyncComplete,
        initialSyncTimedOut:
          parsed.initialSyncTimedOut ?? this.pluginRuntimeInfo?.initialSyncTimedOut,
        initialSyncWarning:
          parsed.initialSyncWarning ?? this.pluginRuntimeInfo?.initialSyncWarning,
      };
      this.updateStatus('connected', 'Connected to companion server.');
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

    const request = requestOrFailure as BridgeRequest;
    this.options.onRequestStarted?.(request);

    let response: BridgeResponse;
    try {
      response = await handleBridgeRequest(this.options.plugin, request, {
        permissionMode: this.options.getPermissionMode(),
        permissionScope: this.options.getPermissionScope(),
        approvedRootRemId: this.options.getApprovedRootRemId(),
        pluginRuntime: this.pluginRuntimeInfo,
        requestApproval: this.options.requestApproval,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Bridge request failed internally:', message);
      response = createBridgeFailure(
        request.id,
        'INTERNAL_ERROR',
        'Bridge request failed internally.',
        { message }
      );
    }

    const responseToSend = this.withResponseSentLifecycle(response as BridgeResponse);
    if (this.cancelledRequestIds.delete(request.id)) {
      console.info('Bridge request completed after server cancel; sending terminal response for diagnostics.', {
        requestId: request.id,
        ok: responseToSend.ok,
        errorCode: responseToSend.ok ? undefined : responseToSend.error.code,
      });
    }

    this.send(responseToSend);
    this.options.onRequestCompleted?.(request, responseToSend);
  }

  private withResponseSentLifecycle(response: BridgeResponse): BridgeResponse {
    const lifecycle: BridgeLifecycleEvent[] = [
      ...(response.lifecycle ?? []),
      {
        phase: 'response_sent',
        at: new Date().toISOString(),
        message: 'Plugin sent terminal bridge response to companion server.',
      },
    ];
    return {
      ...response,
      lifecycle,
    } as BridgeResponse;
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
