import type { ReactRNPlugin, RNPlugin } from '@remnote/plugin-sdk';
import { BrowserBridgeClient } from './client';
import { loadHostedPairingSession } from './pairing';
import { PersistentBridgeRuntime, type PersistentBridgeRuntimeConfig } from './runtime';
import {
  BRIDGE_RUNTIME_ENABLED_KEY,
  BRIDGE_RUNTIME_RECONNECT_GENERATION_KEY,
  BridgeRuntimeChannel,
} from './runtime-channel';
import { DEFAULT_BRIDGE_SERVER_URL } from './status';
import { normalizePermissionMode, normalizePermissionScope } from '../remnote/permissions';

let runtime: PersistentBridgeRuntime | null = null;
let stopTracking: (() => void) | null = null;
let unsubscribeStatus: (() => void) | null = null;

async function loadRuntimeConfig(plugin: RNPlugin): Promise<PersistentBridgeRuntimeConfig> {
  const [
    configuredServerUrl,
    configuredToken,
    configuredMode,
    configuredScope,
    configuredRoot,
    storedMode,
    storedScope,
    storedRoot,
    storedEnabled,
    reconnectGeneration,
    hostedSession,
  ] = await Promise.all([
    plugin.settings.getSetting<string>('bridge-server-url'),
    plugin.settings.getSetting<string>('bridge-token'),
    plugin.settings.getSetting<string>('bridge-permission-mode'),
    plugin.settings.getSetting<string>('bridge-permission-scope'),
    plugin.settings.getSetting<string>('bridge-approved-root-rem-id'),
    plugin.storage.getLocal<string>('bridge-permission-mode'),
    plugin.storage.getLocal<string>('bridge-permission-scope'),
    plugin.storage.getLocal<string>('bridge-approved-root-rem-id'),
    plugin.storage.getLocal<boolean>(BRIDGE_RUNTIME_ENABLED_KEY),
    plugin.storage.getLocal<number>(BRIDGE_RUNTIME_RECONNECT_GENERATION_KEY),
    loadHostedPairingSession(plugin),
  ]);

  return {
    enabled: storedEnabled !== false,
    serverUrl: configuredServerUrl?.trim() || DEFAULT_BRIDGE_SERVER_URL,
    token: configuredToken?.trim() || '',
    hostedSession,
    permissionMode: normalizePermissionMode(storedMode ?? configuredMode),
    permissionScope: normalizePermissionScope(storedScope ?? configuredScope),
    approvedRootRemId: (storedRoot ?? configuredRoot)?.trim() || null,
    reconnectGeneration: Number.isFinite(reconnectGeneration)
      ? Math.max(0, Math.floor(reconnectGeneration as number))
      : 0,
  };
}

export async function startPluginBridgeRuntime(
  plugin: ReactRNPlugin,
  openApprovalPanel: () => Promise<void>
): Promise<void> {
  stopPluginBridgeRuntime();
  const channel = new BridgeRuntimeChannel(plugin, { openApprovalPanel });
  runtime = new PersistentBridgeRuntime({
    createClient: (options) => new BrowserBridgeClient({ plugin, ...options }),
    requestApproval: (request) => channel.requestApproval(request),
    cancelApproval: (requestId, message) => channel.cancelApproval(requestId, message),
  });
  unsubscribeStatus = runtime.subscribe((status) => {
    void channel.publishStatus(status);
  });

  const reconcile = async (reactivePlugin: RNPlugin) => {
    runtime?.update(await loadRuntimeConfig(reactivePlugin));
  };
  await reconcile(plugin);
  stopTracking = plugin.track(reconcile);
}

export function stopPluginBridgeRuntime(): void {
  stopTracking?.();
  stopTracking = null;
  unsubscribeStatus?.();
  unsubscribeStatus = null;
  runtime?.stop();
  runtime = null;
}
