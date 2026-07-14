import { afterEach, describe, expect, test, vi } from 'vitest';
import { BridgeHub } from '../server/src/bridge-hub';
import { loadConfig } from '../server/src/config';
import { BrowserBridgeClient, type BrowserBridgeClientOptions } from '../src/bridge/client';

class TestWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 3;
  static readonly instances: TestWebSocket[] = [];

  readyState = TestWebSocket.CONNECTING;
  private readonly listeners = new Map<string, Array<(event: any) => void>>();

  constructor(readonly url: string) {
    TestWebSocket.instances.push(this);
  }

  addEventListener(type: string, listener: (event: any) => void) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  emit(type: string, event: any = {}) {
    if (type === 'open') this.readyState = TestWebSocket.OPEN;
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }

  close() {
    this.readyState = TestWebSocket.CLOSED;
  }

  send() {}
}

function clientOptions(): BrowserBridgeClientOptions {
  return {
    plugin: {} as BrowserBridgeClientOptions['plugin'],
    serverUrl: 'wss://example.test/remnote',
    getPermissionMode: () => 'read-write',
    getPermissionScope: () => 'full-kb',
    getApprovedRootRemId: () => null,
    requestApproval: async () => ({ approved: false, reason: 'test' }),
    cancelApproval: () => undefined,
    onStatus: () => undefined,
  };
}

afterEach(() => {
  vi.useRealTimers();
  TestWebSocket.instances.length = 0;
  vi.unstubAllGlobals();
});

describe('bridge reconnect resilience', () => {
  test('hosted heartbeat tolerates missed pongs until configured timeout', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-14T16:00:00.000Z'));
    const config = loadConfig({
      NODE_ENV: 'test',
      REMNOTE_BRIDGE_DEPLOYMENT_MODE: 'hosted',
      PLUGIN_HEARTBEAT_INTERVAL_SECONDS: '30',
      PLUGIN_HEARTBEAT_TIMEOUT_SECONDS: '90',
    });
    config.deploymentMode = 'hosted';
    const hub = new BridgeHub(config);
    const close = vi.fn();
    const ping = vi.fn();
    const connection = {
      userId: 'user-1',
      alive: true,
      lastPongAt: new Date().toISOString(),
      close,
      ping,
    };
    const internals = hub as unknown as {
      sessionRouter: {
        getActiveConnectionInfos: () => Array<{ userId: string }>;
        getConnectionForUser: (userId: string) => typeof connection | undefined;
      };
      startHeartbeat: () => void;
      stopHeartbeat: () => void;
    };
    internals.sessionRouter.getActiveConnectionInfos = () => [{ userId: 'user-1' }];
    internals.sessionRouter.getConnectionForUser = () => connection;

    internals.startHeartbeat();
    vi.advanceTimersByTime(60_000);
    expect(close).not.toHaveBeenCalled();
    expect(ping).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(30_000);
    expect(close).toHaveBeenCalledTimes(1);
    internals.stopHeartbeat();
  });

  test('local heartbeat also waits for configured timeout before termination', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-14T16:00:00.000Z'));
    const config = loadConfig({
      NODE_ENV: 'test',
      PLUGIN_HEARTBEAT_INTERVAL_SECONDS: '30',
      PLUGIN_HEARTBEAT_TIMEOUT_SECONDS: '90',
    });
    config.deploymentMode = 'local';
    const hub = new BridgeHub(config);
    const terminate = vi.fn();
    const ping = vi.fn();
    const socket = { readyState: 1, terminate, ping };
    const internals = hub as unknown as {
      pluginSocket: typeof socket;
      pluginSocketAlive: boolean;
      startHeartbeat: () => void;
      stopHeartbeat: () => void;
    };
    internals.pluginSocket = socket;
    internals.pluginSocketAlive = true;

    internals.startHeartbeat();
    vi.advanceTimersByTime(60_000);
    expect(terminate).not.toHaveBeenCalled();
    expect(ping).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(30_000);
    expect(terminate).toHaveBeenCalledTimes(1);
    internals.stopHeartbeat();
  });

  test('connect is idempotent while a socket is connecting', () => {
    vi.stubGlobal('WebSocket', TestWebSocket);
    const client = new BrowserBridgeClient(clientOptions());

    client.connect();
    client.connect();

    expect(TestWebSocket.instances).toHaveLength(1);
    client.disconnect();
  });

  test('a stale socket close cannot replace the current socket', () => {
    vi.useFakeTimers();
    vi.stubGlobal('WebSocket', TestWebSocket);
    const client = new BrowserBridgeClient(clientOptions());
    const internals = client as unknown as {
      ws?: TestWebSocket;
      openSocket: () => void;
    };

    client.connect();
    const staleSocket = TestWebSocket.instances[0];
    staleSocket.readyState = TestWebSocket.CLOSED;
    internals.openSocket();
    const currentSocket = TestWebSocket.instances[1];

    staleSocket.emit('close', { code: 1006, reason: '' });

    expect(internals.ws).toBe(currentSocket);
    expect(vi.getTimerCount()).toBe(0);
    client.disconnect();
  });

  test('registration preparation failure closes the unusable socket', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('WebSocket', TestWebSocket);
    const client = new BrowserBridgeClient(clientOptions());
    const internals = client as unknown as {
      sendHello: () => Promise<void>;
    };
    internals.sendHello = vi.fn().mockRejectedValue(new Error('runtime probe failed'));

    client.connect();
    const socket = TestWebSocket.instances[0];
    socket.emit('open');
    await Promise.resolve();
    await Promise.resolve();

    expect(socket.readyState).toBe(TestWebSocket.CLOSED);
    client.disconnect();
  });

  test('reconnect scheduling coalesces timers and resets backoff only after server hello', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('WebSocket', TestWebSocket);
    const client = new BrowserBridgeClient(clientOptions());
    const internals = client as unknown as {
      reconnectDelayMs: number;
      scheduleReconnect: (reason: string) => void;
      sendHello: () => Promise<void>;
      handleMessage: (rawData: unknown) => Promise<void>;
    };
    internals.sendHello = vi.fn().mockResolvedValue(undefined);

    internals.scheduleReconnect('first');
    internals.scheduleReconnect('second');
    expect(vi.getTimerCount()).toBe(1);

    vi.runOnlyPendingTimers();
    const socket = TestWebSocket.instances[0];
    expect(socket).toBeDefined();
    internals.reconnectDelayMs = 2_000;
    socket.emit('open');
    await Promise.resolve();
    expect(internals.reconnectDelayMs).toBe(2_000);

    await internals.handleMessage(JSON.stringify({ type: 'server_hello' }));
    expect(internals.reconnectDelayMs).toBe(500);
    client.disconnect();
  });
});
