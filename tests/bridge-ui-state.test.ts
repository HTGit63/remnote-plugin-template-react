import { describe, expect, it } from 'vitest';
import {
  deriveBridgeActivity,
  deriveBridgeUiConnectionState,
} from '../src/widgets/bridge-panel/ui-state';
import { getBridgeCloseState } from '../src/bridge/status';

describe('bridge UI connection state', () => {
  it.each([
    ['not_paired', 'not_paired'],
    ['pairing', 'pairing'],
    ['paired_offline', 'paired_offline'],
    ['connecting', 'connecting'],
    ['connected', 'connected'],
    ['reconnecting', 'reconnecting'],
    ['server_unreachable', 'server_unreachable'],
    ['token_expired', 'token_expired'],
    ['session_revoked', 'session_revoked'],
    ['device_conflict', 'device_conflict'],
    ['stale_connection', 'stale_connection'],
    ['disconnected', 'disconnected'],
    ['error', 'error'],
  ] as const)('preserves transport state %s one-to-one', (transportState, expected) => {
    expect(deriveBridgeUiConnectionState({ transportState })).toBe(expected);
  });

  it('downgrades connected when hosted pairing and plugin connection disagree', () => {
    expect(
      deriveBridgeUiConnectionState({
        transportState: 'connected',
        hosted: true,
        hasHostedSession: true,
        health: {
          hostedPairingStatus: 'connected',
          pluginConnectionStatus: 'offline',
        },
      })
    ).toBe('paired_offline');
  });

  it('shows stale when any backend stale/refresh field requires action', () => {
    expect(
      deriveBridgeUiConnectionState({
        transportState: 'connected',
        toolTierSessionStale: true,
      })
    ).toBe('stale_connection');
    expect(
      deriveBridgeUiConnectionState({
        transportState: 'connected',
        requiresConnectorRefresh: true,
      })
    ).toBe('stale_connection');
    expect(
      deriveBridgeUiConnectionState({
        transportState: 'connected',
        health: { sessionStale: true },
      })
    ).toBe('stale_connection');
  });

  it('maps hosted pairing lifecycle facts without claiming connection', () => {
    expect(
      deriveBridgeUiConnectionState({
        transportState: 'not_paired',
        hosted: true,
        health: { hostedPairingStatus: 'pending' },
      })
    ).toBe('pairing');
    expect(
      deriveBridgeUiConnectionState({
        transportState: 'connecting',
        hosted: true,
        health: { hostedPairingStatus: 'expired' },
      })
    ).toBe('token_expired');
    expect(
      deriveBridgeUiConnectionState({
        transportState: 'connecting',
        hosted: true,
        health: { hostedPairingStatus: 'denied' },
      })
    ).toBe('session_revoked');
  });
});

describe('bridge UI activity', () => {
  it('prioritizes pending approval and current work', () => {
    expect(
      deriveBridgeActivity({
        connectionState: 'connected',
        hasPendingApproval: true,
        activeOperation: 'Running standard health check',
      })
    ).toMatchObject({ kind: 'pending', title: 'Approval Pending' });

    expect(
      deriveBridgeActivity({
        connectionState: 'connected',
        activeOperation: 'Running standard health check',
      })
    ).toMatchObject({ kind: 'progress', title: 'In Progress' });
  });

  it('shows current failures before a stale connected label', () => {
    expect(
      deriveBridgeActivity({
        connectionState: 'connected',
        lastOperationError: 'Health endpoint timed out.',
      })
    ).toEqual({
      kind: 'failed',
      title: 'Operation Failed',
      copy: 'Health endpoint timed out.',
    });
  });

  it('distinguishes connected and blocked states', () => {
    expect(deriveBridgeActivity({ connectionState: 'connected' }).kind).toBe('connected');
    expect(deriveBridgeActivity({ connectionState: 'paired_offline' }).kind).toBe('blocked');
  });
});

describe('bridge close reason mapping', () => {
  it.each([
    [1008, 'Invalid bridge token.', false, 'token_expired'],
    [1008, 'PLUGIN_SESSION_EXPIRED: Re-pair required.', true, 'token_expired'],
    [1008, 'PLUGIN_SESSION_EXPIRED: Session revoked.', true, 'session_revoked'],
    [1012, 'DEVICE_CONFLICT: New paired session connected.', true, 'device_conflict'],
    [1011, 'Stale connection heartbeat missed.', true, 'stale_connection'],
    [1006, '', true, 'paired_offline'],
    [1006, '', false, 'server_unreachable'],
  ] as const)(
    'maps close %s %s to %s',
    (code, reason, hosted, expected) => {
      expect(getBridgeCloseState({ code, reason, hosted })).toBe(expected);
    }
  );
});
