import { readFile } from 'node:fs/promises';
import { describe, expect, test, vi } from 'vitest';
import type { ApprovalResolution, PendingApprovalRequest } from '../shared/bridge/protocol';
import type { HostedPairingSession } from '../src/bridge/pairing';
import type { BridgeStatusSnapshot } from '../src/bridge/status';
import {
  PersistentBridgeRuntime,
  type PersistentBridgeClient,
  type PersistentBridgeClientOptions,
  type PersistentBridgeRuntimeConfig,
} from '../src/bridge/runtime';

const hostedSession: HostedPairingSession = {
  deviceId: 'device-1',
  pluginInstanceId: 'plugin-1',
  pluginConnectionId: 'connection-1',
  sessionSecret: 'session-secret',
  expiresAt: '2099-01-01T00:00:00.000Z',
};

function config(overrides: Partial<PersistentBridgeRuntimeConfig> = {}): PersistentBridgeRuntimeConfig {
  return {
    enabled: true,
    serverUrl: 'wss://example.test/remnote',
    token: '',
    hostedSession,
    permissionMode: 'read_create_modify',
    permissionScope: 'approved_document_or_folder',
    approvedRootRemId: 'root-1',
    reconnectGeneration: 0,
    ...overrides,
  };
}

function harness() {
  const clients: Array<{
    adapter: PersistentBridgeClient;
    options: PersistentBridgeClientOptions;
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  }> = [];
  const createClient = vi.fn((options: PersistentBridgeClientOptions): PersistentBridgeClient => {
    const connect = vi.fn();
    const disconnect = vi.fn();
    const adapter = { connect, disconnect };
    clients.push({ adapter, options, connect, disconnect });
    return adapter;
  });
  const requestApproval = vi.fn(
    async (_request: PendingApprovalRequest): Promise<ApprovalResolution> => 'APPROVAL_REJECTED'
  );
  const cancelApproval = vi.fn();
  const runtime = new PersistentBridgeRuntime({ createClient, requestApproval, cancelApproval });
  return { runtime, clients, createClient, requestApproval, cancelApproval };
}

describe('persistent bridge runtime lifecycle', () => {
  test('sidebar detach does not stop plugin-owned transport', () => {
    const { runtime, clients } = harness();
    runtime.update(config());

    expect(clients).toHaveLength(1);
    expect(clients[0].connect).toHaveBeenCalledTimes(1);

    const firstSubscriber = vi.fn();
    const detach = runtime.subscribe(firstSubscriber);
    const connected: BridgeStatusSnapshot = {
      state: 'connected',
      serverUrl: 'wss://example.test/remnote',
      lastEvent: 'Connected to companion server.',
    };
    clients[0].options.onStatus(connected);
    expect(firstSubscriber).toHaveBeenLastCalledWith(connected);

    detach();
    expect(clients[0].disconnect).not.toHaveBeenCalled();

    const replacementSubscriber = vi.fn();
    runtime.subscribe(replacementSubscriber);
    expect(replacementSubscriber).toHaveBeenCalledWith(connected);
    expect(clients).toHaveLength(1);

    runtime.stop();
    expect(clients[0].disconnect).toHaveBeenCalledTimes(1);
  });

  test('permission and focused-scope snapshots update without recreating socket', () => {
    const { runtime, clients } = harness();
    runtime.update(config());
    runtime.update(
      config({
        permissionMode: 'full_control_delete_approval',
        permissionScope: 'focused_rem_and_descendants',
        approvedRootRemId: 'root-2',
      })
    );

    expect(clients).toHaveLength(1);
    expect(clients[0].disconnect).not.toHaveBeenCalled();
    expect(clients[0].options.getPermissionMode()).toBe('full_control_delete_approval');
    expect(clients[0].options.getPermissionScope()).toBe('focused_rem_and_descendants');
    expect(clients[0].options.getApprovedRootRemId()).toBe('root-2');
  });

  test('connection identity change recycles socket exactly once', () => {
    const { runtime, clients } = harness();
    runtime.update(config());
    runtime.update(config({ serverUrl: 'wss://other.example.test/remnote' }));

    expect(clients).toHaveLength(2);
    expect(clients[0].disconnect).toHaveBeenCalledTimes(1);
    expect(clients[1].connect).toHaveBeenCalledTimes(1);
  });

  test('manual reconnect generation recycles an otherwise unchanged socket', () => {
    const { runtime, clients } = harness();
    runtime.update(config());
    runtime.update(config({ reconnectGeneration: 1 }));

    expect(clients).toHaveLength(2);
    expect(clients[0].disconnect).toHaveBeenCalledTimes(1);
    expect(clients[1].connect).toHaveBeenCalledTimes(1);
  });

  test('disabled and unpaired states replace stale connected status', () => {
    const { runtime } = harness();
    const subscriber = vi.fn();
    runtime.subscribe(subscriber);

    runtime.update(config({ enabled: false }));
    expect(subscriber).toHaveBeenLastCalledWith(
      expect.objectContaining({ state: 'disconnected', lastEvent: 'Bridge disabled by user.' })
    );

    runtime.update(config({ hostedSession: null }));
    expect(subscriber).toHaveBeenLastCalledWith(
      expect.objectContaining({ state: 'not_paired' })
    );
  });

  test('index lifecycle owns transport while sidebar is a storage-backed view adapter', async () => {
    const [indexSource, sidebarSource] = await Promise.all([
      readFile(new URL('../src/widgets/index.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../src/widgets/bridge-status.tsx', import.meta.url), 'utf8'),
    ]);

    expect(indexSource).toContain('startPluginBridgeRuntime');
    expect(indexSource).toContain('stopPluginBridgeRuntime');
    expect(sidebarSource).toContain('BRIDGE_RUNTIME_STATUS_KEY');
    expect(sidebarSource).toContain('BRIDGE_RUNTIME_APPROVAL_REQUEST_KEY');
    expect(sidebarSource).toContain('resolveBridgeRuntimeApproval');
    expect(sidebarSource).not.toContain('new BrowserBridgeClient');
    expect(sidebarSource).not.toContain('client.disconnect()');
  });
});
