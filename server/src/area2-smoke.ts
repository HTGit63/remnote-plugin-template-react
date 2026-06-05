import { WebSocket } from 'ws';
import type {
  BridgePluginRegister,
  BridgeRequest,
  BridgeResponse,
  BridgeServerHello,
  SerializedRem,
} from '../../shared/bridge/protocol.js';
import { startCompanionApp } from './app.js';
import { getToolRegistrySummary } from './tool-registry.js';

const publicBaseUrl = 'https://remnote-plugin-template-react.onrender.com';
const fakeRem: SerializedRem = {
  remId: 'area2-rem-1',
  frontText: 'Area 2 hosted diagnostics Rem',
  backText: '',
  plainText: 'Area 2 hosted diagnostics Rem',
  breadcrumbs: ['Area 2 hosted diagnostics Rem'],
  hasChildren: false,
};

async function postJson(url: string, body: unknown, headers: Record<string, string> = {}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  return { response, text, json: text ? JSON.parse(text) : null };
}

async function getJson(url: string, headers: Record<string, string> = {}) {
  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      ...headers,
    },
  });
  const text = await response.text();
  return { response, text, json: text ? JSON.parse(text) : null };
}

function bridgeResponse(request: BridgeRequest): BridgeResponse {
  switch (request.tool) {
    case 'ping':
      return { id: request.id, ok: true, result: { message: 'pong' } };
    case 'get_status':
      return {
        id: request.id,
        ok: true,
        result: {
          connected: true,
          permissionMode: 'full_control_delete_approval',
          permissionScope: 'focused_rem_and_descendants',
          focusedRem: {
            found: true,
            remId: fakeRem.remId,
            label: fakeRem.frontText,
            hasChildren: false,
          },
        },
      };
    case 'get_focused_rem':
      return { id: request.id, ok: true, result: fakeRem };
    default:
      return {
        id: request.id,
        ok: false,
        error: {
          code: 'UNKNOWN_TOOL',
          message: `Area 2 smoke plugin does not implement ${request.tool}.`,
        },
      };
  }
}

async function connectMockPlugin(wsUrl: string, register: BridgePluginRegister): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const timer = setTimeout(() => reject(new Error('Area 2 mock plugin did not receive server_hello.')), 3000);
    ws.on('open', () => {
      ws.send(JSON.stringify(register));
    });
    ws.on('message', (raw) => {
      const message = JSON.parse(raw.toString()) as BridgeServerHello | BridgeRequest;
      if ('type' in message && message.type === 'server_hello') {
        clearTimeout(timer);
        if (message.activeToolTier !== 'note_writer') {
          reject(new Error(`server_hello active tier mismatch: ${message.activeToolTier}`));
          return;
        }
        resolve(ws);
        return;
      }
      ws.send(JSON.stringify(bridgeResponse(message as BridgeRequest)));
    });
    ws.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

const app = await startCompanionApp({
  deploymentMode: 'hosted',
  hostedPairingEnabled: true,
  storageMode: 'memory',
  publicBaseUrl,
  mcpResource: publicBaseUrl,
  dashboardUrl: `${publicBaseUrl}/dashboard`,
  oauthIssuer: publicBaseUrl,
  bridgeToken: 'local-token-must-not-be-used',
  allowNoToken: false,
  allowRemote: true,
  allowCors: true,
  allowedOrigins: ['https://www.remnote.com', 'https://chatgpt.com', publicBaseUrl],
  sessionSecret: 'area2-smoke-session-secret',
  adminDebugSecret: 'area2-admin-secret',
  bridgePath: '/remnote',
  mcpPath: '/mcp',
  singlePort: true,
  port: 0,
  bridgePort: 0,
  mcpPort: 0,
  rateLimitMaxRequests: 1000,
});

const baseUrl = `http://127.0.0.1:${app.mcpPort}`;
const expectedNoteWriterToolCount = getToolRegistrySummary(false, 'note_writer').publicToolCount;
let ws: WebSocket | undefined;

try {
  const create = await postJson(`${baseUrl}/pairing/create`, {
    clientId: 'area2-smoke-client',
    clientName: 'Area 2 Smoke ChatGPT',
    redirectUri: 'https://chat.openai.com/aip/mock/remnote/callback',
    resource: publicBaseUrl,
    requestedScopes: ['bridge:read', 'bridge:write'],
    toolTier: 'basic',
  });
  if (create.response.status !== 201 || !create.json?.pairingCode) {
    throw new Error(`pairing/create failed: ${create.response.status} ${create.text}`);
  }

  const pluginInstanceId = 'plugin-area2-smoke';
  const pluginConnectionId = 'conn-area2-smoke';
  const approve = await postJson(`${baseUrl}/pairing/approve`, {
    pairingCode: create.json.pairingCode,
    pluginInstanceId,
    pluginConnectionId,
    workspaceLabel: 'Area 2 smoke workspace',
    accessScope: 'focused-rem-only',
    trustedWriteMode: 'ask-every-write',
    toolTier: 'basic',
  });
  if (approve.response.status !== 200 || !approve.json?.sessionSecret) {
    throw new Error(`pairing/approve failed: ${approve.response.status} ${approve.text}`);
  }

  const headers = {
    'x-remnote-plugin-session-secret': approve.json.sessionSecret,
  };
  const initialTier = await getJson(`${baseUrl}/api/plugin/tool-tier`, headers);
  if (initialTier.response.status !== 200 || initialTier.json?.toolTier !== 'basic') {
    throw new Error(`initial tool-tier failed: ${initialTier.response.status} ${initialTier.text}`);
  }

  const changedTier = await postJson(`${baseUrl}/api/plugin/tool-tier`, {
    toolTier: 'note_writer',
    accessScope: 'current-rem-tree',
    trustedWriteMode: 'trusted-inside-scope',
  }, headers);
  if (
    changedTier.response.status !== 200 ||
    changedTier.json?.toolTier !== 'note_writer' ||
    changedTier.json?.publicToolCount !== expectedNoteWriterToolCount ||
    changedTier.json?.sessionStale !== false ||
    changedTier.json?.requiresConnectorRefresh !== false
  ) {
    throw new Error(`tool tier change did not apply live: ${changedTier.response.status} ${changedTier.text}`);
  }

  const diagnostics = await postJson(`${baseUrl}/api/plugin/diagnostics`, {}, headers);
  if (
    diagnostics.response.status !== 200 ||
    diagnostics.json?.server?.toolCallAuthMode !== 'hosted_oauth_required' ||
    diagnostics.text.includes('Missing or invalid bridge token')
  ) {
    throw new Error(`hosted diagnostics failed: ${diagnostics.response.status} ${diagnostics.text}`);
  }

  const noSecret = await getJson(`${baseUrl}/api/plugin/tool-tier`);
  if (noSecret.response.status !== 401 || !noSecret.text.includes('Missing plugin session secret')) {
    throw new Error(`plugin API without session secret should 401: ${noSecret.response.status} ${noSecret.text}`);
  }

  ws = await connectMockPlugin(
    `ws://127.0.0.1:${app.mcpPort}${app.config.bridgePath}`,
    {
      type: 'plugin_register',
      pluginInstanceId,
      pluginConnectionId,
      sessionSecret: approve.json.sessionSecret,
      workspaceLabel: 'Area 2 smoke workspace',
      supportedTools: ['get_status', 'get_focused_rem', 'ping'],
      accessScope: 'current-rem-tree',
      trustedWriteMode: 'trusted-inside-scope',
      toolTier: 'note_writer',
    }
  );

  const connectedHealth = await getJson(`${baseUrl}/health`);
  if (
    connectedHealth.response.status !== 200 ||
    connectedHealth.json?.pluginConnectionStatus !== 'connected' ||
    connectedHealth.json?.sessionStale !== false
  ) {
    throw new Error(`health missed connected live plugin state: ${connectedHealth.response.status} ${connectedHealth.text}`);
  }

  const quick = await postJson(`${baseUrl}/api/plugin/health-check`, { level: 'quick' }, headers);
  if (
    quick.response.status !== 200 ||
    quick.json?.level !== 'quick' ||
    !quick.json?.runtimeVerificationMatrix ||
    quick.text.includes('Missing or invalid bridge token')
  ) {
    throw new Error(`hosted quick health failed: ${quick.response.status} ${quick.text}`);
  }

  const full = await postJson(`${baseUrl}/api/plugin/health-check`, { level: 'full' }, headers);
  if (full.response.status !== 200 || full.json?.level !== 'full') {
    throw new Error(`hosted full health failed: ${full.response.status} ${full.text}`);
  }

  const dashboard = await fetch(`${baseUrl}/`);
  const dashboardText = await dashboard.text();
  if (
    dashboard.status !== 200 ||
    !dashboardText.includes('"deploymentMode":"hosted"') ||
    !dashboardText.includes(`"publicToolCount":${expectedNoteWriterToolCount}`) ||
    dashboardText.includes('"pid"') ||
    dashboardText.includes('"cwd"') ||
    dashboardText.includes('Session Stale')
  ) {
    throw new Error(`hosted root leaked internals or missed safe facts: ${dashboard.status} ${dashboardText.slice(0, 500)}`);
  }

  const publicDiagnostics = await fetch(`${baseUrl}/diagnostics`);
  if (publicDiagnostics.status !== 403) {
    throw new Error(`hosted diagnostics without admin auth should be 403: ${publicDiagnostics.status}`);
  }

  const adminDiagnostics = await fetch(`${baseUrl}/diagnostics`, {
    headers: { 'x-admin-debug-secret': 'area2-admin-secret' },
  });
  const adminDiagnosticsText = await adminDiagnostics.text();
  if (
    adminDiagnostics.status !== 200 ||
    !adminDiagnosticsText.includes('"deploymentMode":"hosted"') ||
    adminDiagnosticsText.includes('area2-smoke-session-secret') ||
    adminDiagnosticsText.includes('area2-admin-secret')
  ) {
    throw new Error(`hosted diagnostics admin route failed/redaction failed: ${adminDiagnostics.status} ${adminDiagnosticsText.slice(0, 500)}`);
  }

  console.log('Area 2 hosted UI/API smoke passed.');
} finally {
  ws?.close();
  await app.stop();
}
