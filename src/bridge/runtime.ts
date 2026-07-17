import type {
  ApprovalResolution,
  BridgeRequest,
  BridgeResponse,
  PendingApprovalRequest,
  PermissionMode,
  PermissionScope,
} from '../../shared/bridge/protocol';
import type { HostedPairingSession } from './pairing';
import type { BridgeStatusSnapshot } from './status';

export interface PersistentBridgeRuntimeConfig {
  enabled: boolean;
  serverUrl: string;
  token?: string;
  hostedSession?: HostedPairingSession | null;
  permissionMode: PermissionMode;
  permissionScope: PermissionScope;
  approvedRootRemId: string | null;
  reconnectGeneration: number;
}

export interface PersistentBridgeClientOptions {
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

export interface PersistentBridgeClient {
  connect(): void;
  disconnect(): void;
}

interface PersistentBridgeRuntimeDependencies {
  createClient: (options: PersistentBridgeClientOptions) => PersistentBridgeClient;
  requestApproval: (request: PendingApprovalRequest) => Promise<ApprovalResolution>;
  cancelApproval: (requestId: string, message: string) => void;
  onRequestStarted?: (request: BridgeRequest) => void;
  onRequestCompleted?: (request: BridgeRequest, response: BridgeResponse) => void;
}

type StatusSubscriber = (status: BridgeStatusSnapshot) => void;

function isHostedBridgeUrl(serverUrl: string): boolean {
  return serverUrl.trim().toLowerCase().startsWith('wss://');
}

function connectionIdentity(config: PersistentBridgeRuntimeConfig): string | null {
  if (!config.enabled) {
    return null;
  }
  if (isHostedBridgeUrl(config.serverUrl) && !config.hostedSession?.sessionSecret) {
    return null;
  }
  return JSON.stringify({
    serverUrl: config.serverUrl,
    token: config.token ?? '',
    pluginInstanceId: config.hostedSession?.pluginInstanceId ?? '',
    pluginConnectionId: config.hostedSession?.pluginConnectionId ?? '',
    sessionSecret: config.hostedSession?.sessionSecret ?? '',
    reconnectGeneration: config.reconnectGeneration,
  });
}

export class PersistentBridgeRuntime {
  private config: PersistentBridgeRuntimeConfig | null = null;
  private client: PersistentBridgeClient | null = null;
  private clientIdentity: string | null = null;
  private latestStatus: BridgeStatusSnapshot | null = null;
  private readonly subscribers = new Set<StatusSubscriber>();

  constructor(private readonly dependencies: PersistentBridgeRuntimeDependencies) {}

  update(config: PersistentBridgeRuntimeConfig): void {
    this.config = config;
    const nextIdentity = connectionIdentity(config);
    if (!nextIdentity) {
      this.client?.disconnect();
      this.client = null;
      this.clientIdentity = null;
      const notPaired = config.enabled && isHostedBridgeUrl(config.serverUrl);
      this.publish({
        state: notPaired ? 'not_paired' : 'disconnected',
        serverUrl: config.serverUrl,
        lastEvent: notPaired
          ? 'Waiting for ChatGPT pairing approval before opening the hosted WebSocket.'
          : 'Bridge disabled by user.',
      });
      return;
    }
    if (nextIdentity === this.clientIdentity && this.client) {
      return;
    }

    this.client?.disconnect();
    this.client = null;
    this.clientIdentity = nextIdentity;
    const client = this.dependencies.createClient({
      serverUrl: config.serverUrl,
      token: config.token,
      hostedSession: config.hostedSession,
      getPermissionMode: () => this.requireConfig().permissionMode,
      getPermissionScope: () => this.requireConfig().permissionScope,
      getApprovedRootRemId: () => this.requireConfig().approvedRootRemId,
      requestApproval: this.dependencies.requestApproval,
      cancelApproval: this.dependencies.cancelApproval,
      onStatus: (status) => this.publish(status),
      onRequestStarted: this.dependencies.onRequestStarted,
      onRequestCompleted: this.dependencies.onRequestCompleted,
    });
    this.client = client;
    client.connect();
  }

  subscribe(subscriber: StatusSubscriber): () => void {
    this.subscribers.add(subscriber);
    if (this.latestStatus) {
      subscriber(this.latestStatus);
    }
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  stop(): void {
    this.client?.disconnect();
    this.client = null;
    this.clientIdentity = null;
    this.config = null;
    this.subscribers.clear();
  }

  private requireConfig(): PersistentBridgeRuntimeConfig {
    if (!this.config) {
      throw new Error('Persistent bridge runtime is not configured.');
    }
    return this.config;
  }

  private publish(status: BridgeStatusSnapshot): void {
    this.latestStatus = status;
    for (const subscriber of this.subscribers) {
      subscriber(status);
    }
  }
}
