import type { BridgeToolPolicy, BridgeToolProfile } from './protocol';

export type BridgeConnectionState =
  | 'not_paired'
  | 'pairing'
  | 'paired_offline'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'server_unreachable'
  | 'token_expired'
  | 'session_revoked'
  | 'device_conflict'
  | 'stale_connection'
  | 'disconnected'
  | 'error';

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
    case 'not_paired':
      return 'Not Paired';
    case 'pairing':
      return 'Pairing';
    case 'paired_offline':
      return 'Paired Offline';
    case 'connecting':
      return 'Connecting';
    case 'reconnecting':
      return 'Reconnecting';
    case 'server_unreachable':
      return 'Server Unreachable';
    case 'token_expired':
      return 'Token Expired';
    case 'session_revoked':
      return 'Session Revoked';
    case 'device_conflict':
      return 'Device Conflict';
    case 'stale_connection':
      return 'Stale Connection';
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
    case 'not_paired':
      return 'Pair this RemNote device from the dashboard.';
    case 'pairing':
      return 'Enter the pairing code in the dashboard.';
    case 'paired_offline':
      return 'Paired device is offline. Reconnect bridge.';
    case 'connecting':
      return 'Connecting to the companion server.';
    case 'reconnecting':
      return 'Connection lost. Reconnecting safely.';
    case 'server_unreachable':
      return 'Server unreachable. Check hosted URL or local server.';
    case 'token_expired':
      return 'Session expired. Pair this device again.';
    case 'session_revoked':
      return 'Session revoked. Pair this device again.';
    case 'device_conflict':
      return 'Another RemNote device replaced this connection.';
    case 'stale_connection':
      return 'Stale connection detected. Reconnect.';
    case 'error':
      return 'Check the companion server and bridge token.';
    case 'disconnected':
    default:
      return 'Start the companion server, then keep this widget open.';
  }
}
