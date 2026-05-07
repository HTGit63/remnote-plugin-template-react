export type BridgeConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface BridgeStatusSnapshot {
  state: BridgeConnectionState;
  serverUrl: string;
  lastEvent: string;
  lastError?: string;
}

export const DEFAULT_BRIDGE_SERVER_URL = 'ws://localhost:47391/remnote-bridge';

export const INITIAL_BRIDGE_STATUS: BridgeStatusSnapshot = {
  state: 'disconnected',
  serverUrl: DEFAULT_BRIDGE_SERVER_URL,
  lastEvent: 'WebSocket client pending Milestone 6.',
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

