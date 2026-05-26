import type { RNPlugin } from '@remnote/plugin-sdk';
import type { PermissionMode, PermissionScope } from './protocol';

export interface HostedPairingSession {
  pairingId?: string;
  deviceId: string;
  pluginInstanceId?: string;
  deviceName?: string;
  pluginSessionId?: string;
  pluginSessionToken?: string;
  pluginConnectionId?: string;
  sessionSecret?: string;
  connectedLabel?: string;
  accessScope?: 'focused-rem-only' | 'current-rem-tree' | 'full-kb';
  trustedWriteMode?: 'ask-every-write' | 'trusted-inside-scope';
  expiresAt: string;
}

export interface PendingPairingChallenge {
  pairingCode: string;
  deviceId: string;
  expiresAt: string;
}

export interface ChatGptPairingPreview {
  pairingId: string;
  status: string;
  expiresAt: string;
  connectionLabel: string;
  clientName?: string;
  requestedScopes: string[];
  accessScope: 'focused-rem-only' | 'current-rem-tree' | 'full-kb';
  trustedWriteMode: 'ask-every-write' | 'trusted-inside-scope';
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
  if (!stored) {
    return null;
  }
  const hasLegacySession = Boolean(stored?.pluginSessionId && stored.pluginSessionToken && stored.deviceId);
  const hasChatGptPairing = Boolean(stored?.pairingId && stored.sessionSecret && (stored.pluginInstanceId || stored.deviceId));
  if (!hasLegacySession && !hasChatGptPairing) {
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

function randomId(prefix: string): string {
  const cryptoApi = typeof crypto !== 'undefined' ? crypto : undefined;
  if (cryptoApi?.randomUUID) {
    return `${prefix}_${cryptoApi.randomUUID()}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
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

export function accessScopeForPermissionScope(
  scope: PermissionScope
): 'focused-rem-only' | 'current-rem-tree' | 'full-kb' {
  if (scope === 'workspace_allowed') {
    return 'full-kb';
  }
  if (scope === 'focused_rem_only') {
    return 'focused-rem-only';
  }
  return 'current-rem-tree';
}

export function writeModeForPermissionMode(
  mode: PermissionMode
): 'ask-every-write' | 'trusted-inside-scope' {
  return mode === 'trusted_writes' || mode === 'danger_zone'
    ? 'trusted-inside-scope'
    : 'ask-every-write';
}

export async function approveChatGptPairing(
  plugin: RNPlugin,
  serverUrl: string,
  options: {
    pairingCode: string;
    permissionScope: PermissionScope;
    permissionMode: PermissionMode;
    localConnectionLabel?: string;
    workspaceLabel?: string;
  }
): Promise<HostedPairingSession> {
  const pluginInstanceId = await getOrCreateDeviceId(plugin);
  const pluginConnectionId = randomId('conn');
  const accessScope = accessScopeForPermissionScope(options.permissionScope);
  const trustedWriteMode = writeModeForPermissionMode(options.permissionMode);
  const response = await fetch(`${companionHttpBaseUrl(serverUrl)}/pairing/approve`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      pairingCode: options.pairingCode,
      pluginInstanceId,
      pluginConnectionId,
      workspaceLabel: options.workspaceLabel || 'Active RemNote workspace',
      localConnectionLabel: options.localConnectionLabel,
      accessScope,
      trustedWriteMode,
      supportedTools: [],
    }),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.error || 'Pairing approval failed.');
  }
  const session: HostedPairingSession = {
    pairingId: data.pairingId,
    deviceId: pluginInstanceId,
    pluginInstanceId,
    pluginConnectionId: data.pluginConnectionId || pluginConnectionId,
    sessionSecret: data.sessionSecret,
    connectedLabel: data.connectionLabel,
    accessScope: data.accessScope,
    trustedWriteMode: data.trustedWriteMode,
    expiresAt: data.expiresAt,
  };
  await saveHostedPairingSession(plugin, session);
  return session;
}

export async function lookupChatGptPairing(
  serverUrl: string,
  pairingCode: string
): Promise<ChatGptPairingPreview> {
  const response = await fetch(
    `${companionHttpBaseUrl(serverUrl)}/pairing/status?pairing_code=${encodeURIComponent(pairingCode)}`,
    {
      headers: { accept: 'application/json' },
    }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Pairing lookup failed.');
  }
  return {
    pairingId: data.pairingId,
    status: data.status,
    expiresAt: data.expiresAt,
    connectionLabel: data.connectionLabel || 'ChatGPT session',
    clientName: data.clientName,
    requestedScopes: Array.isArray(data.requestedScopes) ? data.requestedScopes : [],
    accessScope: data.accessScope || 'focused-rem-only',
    trustedWriteMode: data.trustedWriteMode || 'ask-every-write',
  };
}

export async function denyChatGptPairing(
  serverUrl: string,
  pairingCode: string
): Promise<void> {
  const response = await fetch(`${companionHttpBaseUrl(serverUrl)}/pairing/deny`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ pairingCode }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Pairing deny failed.');
  }
}

export async function disconnectChatGptPairing(
  serverUrl: string,
  session: HostedPairingSession
): Promise<void> {
  if (!session.pairingId && !session.sessionSecret) {
    return;
  }
  await fetch(`${companionHttpBaseUrl(serverUrl)}/pairing/disconnect`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      pairingId: session.pairingId,
      sessionSecret: session.sessionSecret,
    }),
  }).catch(() => undefined);
}
