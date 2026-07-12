import type { BridgeConnectionState } from '../../bridge/status';

type RuntimeFacts = Record<string, unknown> | null | undefined;

export interface BridgeUiConnectionInput {
  transportState: BridgeConnectionState;
  hosted?: boolean;
  hasHostedSession?: boolean;
  requiresConnectorRefresh?: boolean;
  toolTierSessionStale?: boolean;
  health?: RuntimeFacts;
}

function textFact(source: RuntimeFacts, ...keys: string[]): string | undefined {
  if (!source) {
    return undefined;
  }
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim().toLowerCase();
    }
  }
  return undefined;
}

function booleanFact(source: RuntimeFacts, ...keys: string[]): boolean | undefined {
  if (!source) {
    return undefined;
  }
  for (const key of keys) {
    if (typeof source[key] === 'boolean') {
      return source[key] as boolean;
    }
  }
  return undefined;
}

/**
 * Produces the single connection state shown by the widget.
 * Structured server facts may downgrade stale or contradictory transport state,
 * but never upgrade an unconnected WebSocket to "connected".
 */
export function deriveBridgeUiConnectionState(
  input: BridgeUiConnectionInput
): BridgeConnectionState {
  const pairingStatus = textFact(
    input.health,
    'hostedPairingStatus',
    'chatGptPairingStatus',
    'pairingStatus'
  );
  const pluginConnectionStatus = textFact(
    input.health,
    'pluginConnectionStatus',
    'plugin_connection_status'
  );
  const serverConnected = booleanFact(
    input.health,
    'connected',
    'bridgeConnected',
    'pluginConnected'
  );
  const healthSessionStale = booleanFact(input.health, 'sessionStale', 'session_stale');

  if (
    input.requiresConnectorRefresh ||
    input.toolTierSessionStale ||
    healthSessionStale === true
  ) {
    return 'stale_connection';
  }

  if (input.hosted && pairingStatus === 'expired') {
    return 'token_expired';
  }

  if (input.hosted && (pairingStatus === 'denied' || pairingStatus === 'revoked')) {
    return 'session_revoked';
  }

  if (input.hosted && pairingStatus === 'pending' && !input.hasHostedSession) {
    return 'pairing';
  }

  const pluginReportedOffline =
    pluginConnectionStatus === 'offline' ||
    (serverConnected === false && pluginConnectionStatus !== 'connected');
  const pairingWasEstablished =
    input.hasHostedSession ||
    pairingStatus === 'approved' ||
    pairingStatus === 'connected' ||
    pairingStatus === 'disconnected';

  if (input.hosted && pluginReportedOffline && pairingWasEstablished) {
    return 'paired_offline';
  }

  return input.transportState;
}

export type BridgeActivityKind =
  | 'pending'
  | 'progress'
  | 'failed'
  | 'warning'
  | 'connected'
  | 'blocked';

export interface BridgeActivity {
  kind: BridgeActivityKind;
  title: string;
  copy: string;
}

export function deriveBridgeActivity(input: {
  connectionState: BridgeConnectionState;
  hasPendingApproval?: boolean;
  activeOperation?: string | null;
  lastOperationError?: string | null;
  nextAction?: string;
}): BridgeActivity {
  if (input.hasPendingApproval) {
    return {
      kind: 'pending',
      title: 'Approval Pending',
      copy: 'Review the requested write before RemNote changes.',
    };
  }

  if (input.activeOperation) {
    return {
      kind: 'progress',
      title: 'In Progress',
      copy: `${input.activeOperation}.`,
    };
  }

  if (input.lastOperationError) {
    return {
      kind: 'failed',
      title: 'Operation Failed',
      copy: input.lastOperationError,
    };
  }

  if (input.connectionState === 'connected') {
    return {
      kind: 'connected',
      title: 'Connected',
      copy: 'ChatGPT and the RemNote plugin agree that the bridge is connected.',
    };
  }

  if (
    input.connectionState === 'connecting' ||
    input.connectionState === 'reconnecting' ||
    input.connectionState === 'pairing'
  ) {
    return {
      kind: 'progress',
      title: 'In Progress',
      copy: input.nextAction ?? 'Connection work is still in progress.',
    };
  }

  return {
    kind: 'blocked',
    title: 'Connection Blocked',
    copy: input.nextAction ?? 'Resolve the connection issue before using RemNote tools.',
  };
}
