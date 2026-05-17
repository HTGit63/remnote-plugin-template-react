import type { BridgeToolPolicy, BridgeToolProfile } from './protocol';

export type BridgeConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface BridgeStatusSnapshot {
  state: BridgeConnectionState;
  serverUrl: string;
  lastEvent: string;
  lastError?: string;
  toolProfile?: BridgeToolProfile;
  toolRegistryVersion?: string;
  allPublicToolCount?: number;
  allPublicTools?: string[];
  publicToolCount?: number;
  publicTools?: string[];
  callabilitySource?: 'registry_only_not_live_execution' | 'live_execution';
  realPluginVerifiedTools?: string[];
  runtimeUnverifiedTools?: string[];
  sdkUnsupportedTools?: string[];
  preferredTools?: string[];
  fallbackTools?: string[];
  debugTools?: string[];
  readTools?: string[];
  cardTools?: string[];
  dangerousTools?: string[];
  unsupportedTools?: string[];
  profileHiddenTools?: Array<{
    name: string;
    reason: string;
    policy?: BridgeToolPolicy;
    replacement?: string;
  }>;
  hiddenTools?: Array<{ name: string; reason: string }>;
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

export function getBridgeNextAction(status: BridgeStatusSnapshot): string {
  if (status.lastError) {
    return 'Check the companion server URL and bridge token, then reconnect.';
  }

  switch (status.state) {
    case 'connected':
      return 'Ready for RemNote tool calls.';
    case 'connecting':
      return 'Connecting to the companion server.';
    case 'error':
      return 'Check the companion server and bridge token.';
    case 'disconnected':
    default:
      return 'Start the companion server, then keep this widget open.';
  }
}
