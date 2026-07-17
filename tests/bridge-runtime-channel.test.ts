import { afterEach, describe, expect, test, vi } from 'vitest';
import type { RNPlugin } from '@remnote/plugin-sdk';
import type { PendingApprovalRequest } from '../shared/bridge/protocol';
import {
  BRIDGE_RUNTIME_APPROVAL_REQUEST_KEY,
  BRIDGE_RUNTIME_APPROVAL_RESOLUTION_KEY,
  BRIDGE_RUNTIME_RECONNECT_GENERATION_KEY,
  BRIDGE_RUNTIME_STATUS_KEY,
  BridgeRuntimeChannel,
  requestBridgeRuntimeReconnect,
  resolveBridgeRuntimeApproval,
} from '../src/bridge/runtime-channel';

function request(id = 'request-1'): PendingApprovalRequest {
  return {
    id,
    tool: 'update_rem',
    args: { remId: 'target-1', text: 'replacement' },
    permissionMode: 'read_create_modify',
    permissionScope: 'approved_document_or_folder',
    requestedAt: new Date().toISOString(),
    timeoutDeadline: new Date(Date.now() + 5_000).toISOString(),
    riskLevel: 'safe_write',
    summary: 'Update one approved Rem.',
  } as PendingApprovalRequest;
}

function fakePlugin() {
  const values = new Map<string, unknown>();
  const storage = {
    getSession: vi.fn(async (key: string) => values.get(key)),
    setSession: vi.fn(async (key: string, value: unknown) => {
      values.set(key, value);
    }),
    getLocal: vi.fn(async (key: string) => values.get(key)),
    setLocal: vi.fn(async (key: string, value: unknown) => {
      values.set(key, value);
    }),
  };
  return {
    plugin: { storage } as unknown as RNPlugin,
    storage,
    values,
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('bridge runtime storage channel', () => {
  test('approval survives outside sidebar and resolves only for matching request', async () => {
    vi.useFakeTimers();
    const { plugin, values } = fakePlugin();
    const openApprovalPanel = vi.fn(async () => undefined);
    const channel = new BridgeRuntimeChannel(plugin, { openApprovalPanel, pollIntervalMs: 25 });

    const pending = channel.requestApproval(request());
    await vi.advanceTimersByTimeAsync(1);
    expect(values.get(BRIDGE_RUNTIME_APPROVAL_REQUEST_KEY)).toMatchObject({ id: 'request-1' });
    expect(openApprovalPanel).toHaveBeenCalledTimes(1);

    await resolveBridgeRuntimeApproval(plugin, 'wrong-request', 'APPROVED');
    await vi.advanceTimersByTimeAsync(25);
    expect(values.get(BRIDGE_RUNTIME_APPROVAL_RESOLUTION_KEY)).toMatchObject({
      requestId: 'wrong-request',
    });

    await resolveBridgeRuntimeApproval(plugin, 'request-1', 'APPROVED');
    await vi.advanceTimersByTimeAsync(25);
    await expect(pending).resolves.toBe('APPROVED');
    expect(values.get(BRIDGE_RUNTIME_APPROVAL_REQUEST_KEY)).toBeNull();
    expect(values.get(BRIDGE_RUNTIME_APPROVAL_RESOLUTION_KEY)).toBeNull();
  });

  test('server cancellation resolves active approval without approving it', async () => {
    vi.useFakeTimers();
    const { plugin, values } = fakePlugin();
    const channel = new BridgeRuntimeChannel(plugin, {
      openApprovalPanel: async () => undefined,
      pollIntervalMs: 25,
    });

    const pending = channel.requestApproval(request('request-cancel'));
    await vi.advanceTimersByTimeAsync(1);
    channel.cancelApproval('request-cancel', 'server timeout');
    await vi.advanceTimersByTimeAsync(1);

    await expect(pending).resolves.toBe('REQUEST_CANCELLED');
    expect(values.get(BRIDGE_RUNTIME_APPROVAL_REQUEST_KEY)).toBeNull();
  });

  test('publishes latest runtime status for replacement sidebar', async () => {
    const { plugin, values } = fakePlugin();
    const channel = new BridgeRuntimeChannel(plugin, {
      openApprovalPanel: async () => undefined,
    });

    await channel.publishStatus({
      state: 'connected',
      serverUrl: 'wss://example.test/remnote',
      lastEvent: 'Connected to companion server.',
    });

    expect(values.get(BRIDGE_RUNTIME_STATUS_KEY)).toMatchObject({
      state: 'connected',
      lastEvent: 'Connected to companion server.',
    });
  });

  test('manual reconnect increments the runtime generation', async () => {
    const { plugin, values } = fakePlugin();

    await requestBridgeRuntimeReconnect(plugin);
    await requestBridgeRuntimeReconnect(plugin);

    expect(values.get(BRIDGE_RUNTIME_RECONNECT_GENERATION_KEY)).toBe(2);
  });

  test('malformed approval deadline still times out within bounded fallback', async () => {
    vi.useFakeTimers();
    const { plugin } = fakePlugin();
    const channel = new BridgeRuntimeChannel(plugin, {
      openApprovalPanel: async () => undefined,
      pollIntervalMs: 10,
      defaultTimeoutMs: 40,
    });
    const malformed = request('request-invalid-deadline');
    malformed.timeoutDeadline = 'not-a-date';

    const pending = channel.requestApproval(malformed);
    await vi.advanceTimersByTimeAsync(60);

    await expect(pending).resolves.toBe('APPROVAL_TIMEOUT');
  });
});
