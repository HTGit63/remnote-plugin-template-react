import type { RNPlugin } from '@remnote/plugin-sdk';
import type {
  BridgePluginRuntimeInfo,
  RemnoteInitialSyncStatus,
  RemnoteSdkCapabilityDetail,
  RemnoteSdkCapabilityName,
  RemnoteSdkCapabilityReport,
} from '../../shared/bridge/protocol';

export const REMNOTE_PLUGIN_SDK_VERSION = '0.0.46';
const INITIAL_SYNC_TIMEOUT_MS = 5000;

const CAPABILITY_PROBES: Array<{
  name: RemnoteSdkCapabilityName;
  namespace: RemnoteSdkCapabilityDetail['namespace'];
  api: string;
}> = [
  { name: 'plugin.app.transaction', namespace: 'app', api: 'transaction' },
  { name: 'plugin.app.waitForInitialSync', namespace: 'app', api: 'waitForInitialSync' },
  { name: 'plugin.rem.createSingleRemWithMarkdown', namespace: 'rem', api: 'createSingleRemWithMarkdown' },
  { name: 'plugin.rem.createTreeWithMarkdown', namespace: 'rem', api: 'createTreeWithMarkdown' },
  { name: 'plugin.rem.createTable', namespace: 'rem', api: 'createTable' },
  { name: 'plugin.reader.addHighlight', namespace: 'reader', api: 'addHighlight' },
  { name: 'plugin.queue.getCurrentCard', namespace: 'queue', api: 'getCurrentCard' },
  { name: 'plugin.queue.getNumRemainingCards', namespace: 'queue', api: 'getNumRemainingCards' },
  { name: 'plugin.queue.getCurrentStreak', namespace: 'queue', api: 'getCurrentStreak' },
  { name: 'plugin.queue.inLookbackMode', namespace: 'queue', api: 'inLookbackMode' },
];

function namespaceRecord(plugin: RNPlugin, namespace: RemnoteSdkCapabilityDetail['namespace']): Record<string, unknown> {
  const record = plugin as unknown as Record<string, unknown>;
  const value = record[namespace];
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function hasFunction(plugin: RNPlugin, namespace: RemnoteSdkCapabilityDetail['namespace'], api: string): boolean {
  return typeof namespaceRecord(plugin, namespace)[api] === 'function';
}

export function detectRemnoteSdkCapabilities(plugin: RNPlugin): RemnoteSdkCapabilityReport {
  const supportedSdkCapabilities: RemnoteSdkCapabilityName[] = [];
  const unsupportedSdkCapabilities: RemnoteSdkCapabilityName[] = [];
  const sdkCapabilityDetails = {} as Record<RemnoteSdkCapabilityName, RemnoteSdkCapabilityDetail>;

  for (const probe of CAPABILITY_PROBES) {
    const supported = hasFunction(plugin, probe.namespace, probe.api);
    sdkCapabilityDetails[probe.name] = {
      supported,
      namespace: probe.namespace,
      api: probe.api,
    };
    if (supported) {
      supportedSdkCapabilities.push(probe.name);
    } else {
      unsupportedSdkCapabilities.push(probe.name);
    }
  }

  return {
    sdkVersion: REMNOTE_PLUGIN_SDK_VERSION,
    supportedSdkCapabilities,
    unsupportedSdkCapabilities,
    sdkCapabilityDetails,
  };
}

export function sdkCapabilitySupported(
  report: RemnoteSdkCapabilityReport,
  capability: RemnoteSdkCapabilityName
): boolean {
  return Boolean(report.sdkCapabilityDetails[capability]?.supported);
}

export async function waitForInitialSyncWithTimeout(
  plugin: RNPlugin,
  report: RemnoteSdkCapabilityReport,
  timeoutMs = INITIAL_SYNC_TIMEOUT_MS
): Promise<RemnoteInitialSyncStatus> {
  const startedAt = Date.now();
  if (!sdkCapabilitySupported(report, 'plugin.app.waitForInitialSync')) {
    return {
      initialSyncSupported: false,
      initialSyncComplete: false,
      initialSyncTimedOut: false,
      initialSyncDurationMs: Date.now() - startedAt,
      initialSyncWarning: 'plugin.app.waitForInitialSync is not available in this RemNote runtime.',
    };
  }

  try {
    await Promise.race([
      plugin.app.waitForInitialSync(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`waitForInitialSync timed out after ${timeoutMs} ms`)), timeoutMs);
      }),
    ]);
    return {
      initialSyncSupported: true,
      initialSyncComplete: true,
      initialSyncTimedOut: false,
      initialSyncDurationMs: Date.now() - startedAt,
      initialSyncCompletedAt: new Date().toISOString(),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const timedOut = /timed out/i.test(message);
    return {
      initialSyncSupported: true,
      initialSyncComplete: false,
      initialSyncTimedOut: timedOut,
      initialSyncDurationMs: Date.now() - startedAt,
      initialSyncWarning: message || 'waitForInitialSync failed before bridge registration.',
    };
  }
}

export async function getBridgePluginRuntimeInfo(plugin: RNPlugin): Promise<BridgePluginRuntimeInfo> {
  const capabilityReport = detectRemnoteSdkCapabilities(plugin);
  const syncStatus = await waitForInitialSyncWithTimeout(plugin, capabilityReport);
  return {
    ...capabilityReport,
    ...syncStatus,
  };
}
