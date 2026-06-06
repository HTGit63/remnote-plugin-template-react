import { WebSocket } from 'ws';
import type {
  BridgePluginRegister,
  BridgeRequest,
  BridgeResponse,
  BridgeServerHello,
  BridgeToolName,
} from '../../shared/bridge/protocol.js';
import { startCompanionApp } from './app.js';

let nextId = 1;

const publicBaseUrl = 'https://remnote-plugin-template-react.onrender.com';
const redirectUri = 'https://chat.openai.com/aip/mock/remnote/callback';

async function postJson(url: string, body: unknown) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  return { response, text, json: text ? JSON.parse(text) : null };
}

async function mcpToolCall(url: string, name: string, args: Record<string, unknown>) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      accept: 'application/json, text/event-stream',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: nextId++,
      method: 'tools/call',
      params: { name, arguments: args },
    }),
  });
  const text = await response.text();
  return { status: response.status, text };
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
          permissionMode: 'read_create_modify',
          permissionScope: 'focused_rem_and_descendants',
          focusedRem: {
            found: true,
            remId: 'compat-root',
            label: 'Connector compat smoke root',
            hasChildren: false,
          },
        },
      };
    default:
      return {
        id: request.id,
        ok: false,
        error: {
          code: 'UNKNOWN_TOOL',
          message: `Unhandled connector compatibility smoke bridge tool ${request.tool}.`,
        },
      };
  }
}

async function createApprovedPluginRegistration(
  baseUrl: string,
  suffix: string
): Promise<BridgePluginRegister> {
  const create = await postJson(`${baseUrl}/pairing/create`, {
    oauthState: `compat-routing-${suffix}`,
    codeChallenge: `compat-verifier-${suffix}`,
    codeChallengeMethod: 'plain',
    clientId: `compat-client-${suffix}`,
    clientName: 'Connector Compatibility Smoke',
    redirectUri,
    resource: publicBaseUrl,
    requestedScopes: ['bridge:read', 'bridge:write'],
  });
  if (create.response.status !== 201 || !create.json?.pairingCode) {
    throw new Error(`Pairing create failed: ${create.response.status} ${create.text}`);
  }

  const pluginInstanceId = `plugin-compat-${suffix}`;
  const pluginConnectionId = `conn-compat-${suffix}`;
  const approve = await postJson(`${baseUrl}/pairing/approve`, {
    pairingCode: create.json.pairingCode,
    pluginInstanceId,
    pluginConnectionId,
    workspaceLabel: `Connector compat workspace ${suffix}`,
    accessScope: 'current-rem-tree',
    trustedWriteMode: 'trusted-inside-scope',
  });
  if (approve.response.status !== 200 || !approve.json?.sessionSecret) {
    throw new Error(`Pairing approve failed: ${approve.response.status} ${approve.text}`);
  }

  return {
    type: 'plugin_register',
    pluginInstanceId,
    pluginConnectionId,
    sessionSecret: approve.json.sessionSecret,
    workspaceLabel: `Connector compat workspace ${suffix}`,
    supportedTools: ['ping', 'get_status'],
    accessScope: 'current-rem-tree',
    trustedWriteMode: 'trusted-inside-scope',
  };
}

async function connectHostedMockPlugin(
  wsUrl: string,
  register: BridgePluginRegister,
  seenTools: BridgeToolName[]
): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const timer = setTimeout(() => reject(new Error('Mock plugin did not receive server_hello.')), 3000);
    ws.on('open', () => {
      ws.send(JSON.stringify(register));
    });
    ws.on('message', (raw) => {
      const message = JSON.parse(raw.toString()) as BridgeServerHello | BridgeRequest;
      if ('type' in message && message.type === 'server_hello') {
        clearTimeout(timer);
        resolve(ws);
        return;
      }

      const request = message as BridgeRequest;
      seenTools.push(request.tool);
      ws.send(JSON.stringify(bridgeResponse(request)));
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
  connectorCompatNoAuthTools: true,
  allowRemote: true,
  allowCors: true,
  allowedOrigins: ['https://www.remnote.com', 'https://chatgpt.com', publicBaseUrl],
  sessionSecret: 'connector-compat-routing-smoke-secret',
  bridgePath: '/remnote',
  mcpPath: '/mcp',
  singlePort: true,
  port: 0,
  bridgePort: 0,
  mcpPort: 0,
  toolProfile: 'developer',
  rateLimitMaxRequests: 1000,
});

const baseUrl = `http://127.0.0.1:${app.mcpPort}`;
const mcpUrl = `${baseUrl}${app.config.mcpPath}`;
const wsUrl = `ws://127.0.0.1:${app.mcpPort}${app.config.bridgePath}`;
const sockets: WebSocket[] = [];

try {
  const health = await fetch(`${baseUrl}/health`);
  const healthText = await health.text();
  if (
    health.status !== 200 ||
    !healthText.includes('"connectorCompatNoAuthTools":true') ||
    !healthText.includes('"connectorCompatRouting":"no_active_connection"') ||
    !healthText.includes('"activePluginConnectionCount":0')
  ) {
    throw new Error(`/health missed connector compat diagnostics: ${health.status} ${healthText}`);
  }

  const noConnection = await mcpToolCall(mcpUrl, 'ping_remnote_plugin', {});
  if (
    noConnection.status !== 200 ||
    !noConnection.text.includes('PLUGIN_NOT_CONNECTED') ||
    noConnection.text.includes('Missing bearer token') ||
    noConnection.text.includes('__connector_compat__')
  ) {
    throw new Error(`Zero-connection compat route failed wrong way: ${noConnection.status} ${noConnection.text}`);
  }

  const seenToolsA: BridgeToolName[] = [];
  sockets.push(await connectHostedMockPlugin(
    wsUrl,
    await createApprovedPluginRegistration(baseUrl, 'a'),
    seenToolsA
  ));

  const oneConnection = await mcpToolCall(mcpUrl, 'ping_remnote_plugin', {});
  if (
    oneConnection.status !== 200 ||
    !oneConnection.text.includes('pong') ||
    !seenToolsA.includes('ping')
  ) {
    throw new Error(`Single active connection did not receive compat tool call: ${oneConnection.status} ${oneConnection.text}`);
  }

  const statusThroughCompat = await mcpToolCall(mcpUrl, 'get_plugin_status', {});
  if (
    statusThroughCompat.status !== 200 ||
    !statusThroughCompat.text.includes('Connector compat smoke root') ||
    !seenToolsA.includes('get_status')
  ) {
    throw new Error(`Single active connection did not route get_plugin_status: ${statusThroughCompat.status} ${statusThroughCompat.text}`);
  }

  const seenToolsB: BridgeToolName[] = [];
  sockets.push(await connectHostedMockPlugin(
    wsUrl,
    await createApprovedPluginRegistration(baseUrl, 'b'),
    seenToolsB
  ));

  const multipleConnections = await mcpToolCall(mcpUrl, 'ping_remnote_plugin', {});
  if (
    multipleConnections.status !== 200 ||
    !multipleConnections.text.includes('DEVICE_CONFLICT') ||
    seenToolsB.includes('ping')
  ) {
    throw new Error(`Multiple active connections were not refused safely: ${multipleConnections.status} ${multipleConnections.text}`);
  }

  console.log('Connector compatibility routing smoke passed.');
} finally {
  for (const socket of sockets) {
    socket.close();
  }
  await app.stop();
}
