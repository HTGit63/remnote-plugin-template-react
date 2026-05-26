import type { RNPlugin } from '@remnote/plugin-sdk';

export interface HostedPairingSession {
  deviceId: string;
  deviceName?: string;
  pluginSessionId: string;
  pluginSessionToken: string;
  expiresAt: string;
}

export interface PendingPairingChallenge {
  pairingCode: string;
  deviceId: string;
  expiresAt: string;
}

const DEVICE_ID_KEY = 'bridge-hosted-device-id';
const SESSION_KEY = 'bridge-hosted-session';

export async function getOrCreateDeviceId(plugin: RNPlugin): Promise<string> {
  const existing = await plugin.storage.getLocal<string>(DEVICE_ID_KEY);
  if (existing) {
    return existing;
  }

  const deviceId = `rn_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  await plugin.storage.setLocal(DEVICE_ID_KEY, deviceId);
  return deviceId;
}

export async function loadHostedPairingSession(plugin: RNPlugin): Promise<HostedPairingSession | null> {
  const stored = await plugin.storage.getLocal<HostedPairingSession>(SESSION_KEY);
  if (!stored?.pluginSessionId || !stored.pluginSessionToken || !stored.deviceId) {
    return null;
  }
  if (new Date(stored.expiresAt) <= new Date()) {
    await clearHostedPairingSession(plugin);
    return null;
  }
  return stored;
}

export async function saveHostedPairingSession(plugin: RNPlugin, session: HostedPairingSession): Promise<void> {
  await plugin.storage.setLocal(SESSION_KEY, session);
}

export async function clearHostedPairingSession(plugin: RNPlugin): Promise<void> {
  await plugin.storage.setLocal(SESSION_KEY, null);
}

export function companionHttpBaseUrl(serverUrl: string): string {
  const url = new URL(serverUrl);
  url.protocol = url.protocol === 'wss:' ? 'https:' : 'http:';
  if (url.port === '47391') {
    url.port = '47392';
  }
  url.pathname = '';
  url.search = '';
  url.hash = '';
  return url.toString().replace(/\/+$/, '');
}

export async function startHostedPairing(
  plugin: RNPlugin,
  serverUrl: string
): Promise<PendingPairingChallenge> {
  const deviceId = await getOrCreateDeviceId(plugin);
  const response = await fetch(`${companionHttpBaseUrl(serverUrl)}/api/pair/start`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      deviceId,
      deviceName: 'RemNote plugin',
    }),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.error || 'Pairing start failed.');
  }
  return {
    pairingCode: data.pairingCode,
    deviceId,
    expiresAt: data.expiresAt,
  };
}

export async function finishHostedPairing(
  plugin: RNPlugin,
  serverUrl: string,
  challenge: PendingPairingChallenge
): Promise<HostedPairingSession> {
  const response = await fetch(`${companionHttpBaseUrl(serverUrl)}/api/pair/status`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      pairingCode: challenge.pairingCode,
      deviceId: challenge.deviceId,
    }),
  });
  const data = await response.json();
  if (response.status === 202) {
    throw new Error('Pairing still pending in dashboard.');
  }
  if (!response.ok || !data.ok) {
    throw new Error(data.error || 'Pairing status check failed.');
  }
  const session: HostedPairingSession = {
    deviceId: data.deviceId,
    deviceName: data.deviceName,
    pluginSessionId: data.pluginSessionId,
    pluginSessionToken: data.pluginSessionToken,
    expiresAt: data.expiresAt,
  };
  await saveHostedPairingSession(plugin, session);
  return session;
}
