export type BridgeConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface BridgeStatusSnapshot {
  state: BridgeConnectionState;
  serverUrl: string;
  lastEvent: string;
  lastError?: string;
  toolRegistryVersion?: string;
  publicToolCount?: number;
  publicTools?: string[];
  callabilitySource?: 'registry_only_not_live_execution';
  realPluginVerifiedTools?: string[];
  runtimeUnverifiedTools?: string[];
  sdkUnsupportedTools?: string[];
  serverStartedAt?: string;
}

export const DEFAULT_BRIDGE_SERVER_URL = 'ws://localhost:47391/remnote-bridge';

export const INITIAL_BRIDGE_STATUS: BridgeStatusSnapshot = {
  state: 'disconnected',
  serverUrl: DEFAULT_BRIDGE_SERVER_URL,
  lastEvent: 'Waiting for local companion server.',
};

export function getBridgeStatusLabel(state: BridgeConnectionState): string {
  switch (state) {
    case 'connected':
      return 'Connected';
    case 'connecting':
      return 'Connecting';
    case 'error':
      return 'Error';
    case 'disconnected':
    default:
      return 'Disconnected';
  }
}
