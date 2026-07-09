import { WebSocket } from 'ws';
import type {
  BridgePluginRegister,
  BridgeRequest,
  BridgeResponse,
  BridgeServerHello,
  BridgeToolName,
  SerializedRem,
} from '../../shared/bridge/protocol.js';
import { startCompanionApp } from './app.js';

let nextId = 1;

const publicBaseUrl = 'https://remnote-plugin-template-react.onrender.com';
const redirectUri = 'https://chat.openai.com/aip/mock/remnote/callback';
const codexToken = 'codex-routing-smoke-token-with-enough-entropy';

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

async function mcpToolCall(
  url: string,
  name: string,
  args: Record<string, unknown>,
  bearerToken?: string
) {
  return postJson(
    url,
    {
      jsonrpc: '2.0',
      id: nextId++,
      method: 'tools/call',
      params: { name, arguments: args },
    },
    {
      accept: 'application/json, text/event-stream',
      ...(bearerToken ? { authorization: `Bearer ${bearerToken}` } : {}),
    }
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function bridgeResponse(request: BridgeRequest, label: string, remId: string): BridgeResponse {
  const fakeRem: SerializedRem = {
    remId,
    frontText: label,
    backText: '',
    plainText: label,
    breadcrumbs: [label],
    hasChildren: false,
  };
  switch (request.tool) {
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
            remId,
            label,
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
          message: `Unhandled Codex routing smoke tool ${request.tool}.`,
        },
      };
  }
}

async function createApprovedPluginRegistration(
  baseUrl: string,
  suffix: string
): Promise<BridgePluginRegister> {
  const create = await postJson(`${baseUrl}/pairing/create`, {
    oauthState: `codex-routing-${suffix}`,
    codeChallenge: `codex-routing-verifier-${suffix}`,
    codeChallengeMethod: 'plain',
    clientId: `codex-routing-client-${suffix}`,
    clientName: 'Codex Routing Smoke',
    redirectUri,
    resource: publicBaseUrl,
    requestedScopes: ['bridge:read', 'bridge:write'],
  });
  if (create.response.status !== 201 || !create.json?.pairingCode) {
    throw new Error(`Pairing create failed: ${create.response.status} ${create.text}`);
  }

  const pluginInstanceId = `plugin-codex-routing-${suffix}`;
  const pluginConnectionId = `conn-codex-routing-${suffix}`;
  const approve = await postJson(`${baseUrl}/pairing/approve`, {
    pairingCode: create.json.pairingCode,
    pluginInstanceId,
    pluginConnectionId,
    workspaceLabel: `Codex routing workspace ${suffix}`,
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
    workspaceLabel: `Codex routing workspace ${suffix}`,
    supportedTools: ['get_status', 'get_focused_rem'],
    accessScope: 'current-rem-tree',
    trustedWriteMode: 'trusted-inside-scope',
  };
}

async function connectHostedMockPlugin(
  wsUrl: string,
  register: BridgePluginRegister,
  seenTools: BridgeToolName[],
  label: string,
  remId: string
): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const timer = setTimeout(() => reject(new Error('Codex routing mock plugin did not receive server_hello.')), 3000);
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
      ws.send(JSON.stringify(bridgeResponse(request, label, remId)));
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
  codexToken,
  allowNoToken: false,
  allowRemote: true,
  allowCors: true,
  allowedOrigins: ['https://www.remnote.com', 'https://chatgpt.com', publicBaseUrl],
  sessionSecret: 'codex-routing-smoke-session-secret',
  bridgePath: '/remnote',
  mcpPath: '/mcp',
  singlePort: true,
  port: 0,
  bridgePort: 0,
  mcpPort: 0,
  rateLimitMaxRequests: 1000,
});

const baseUrl = `http://127.0.0.1:${app.mcpPort}`;
const mcpUrl = `${baseUrl}${app.config.mcpPath}?tool_tier=mass_note_writer`;
const wsUrl = `ws://127.0.0.1:${app.mcpPort}${app.config.bridgePath}`;
const sockets: WebSocket[] = [];

try {
  const statusNoPlugin = await mcpToolCall(mcpUrl, 'get_bridge_status', {}, codexToken);
  if (
    statusNoPlugin.response.status !== 200 ||
    !statusNoPlugin.text.includes('"codexBearerAuthenticated":true') ||
    !statusNoPlugin.text.includes('"codexRoutingMode":"no_active_plugin_connection"')
  ) {
    throw new Error(`Codex server-local status failed without plugin: ${statusNoPlugin.response.status} ${statusNoPlugin.text}`);
  }

  const noPlugin = await mcpToolCall(mcpUrl, 'get_focused_rem', {}, codexToken);
  if (
    noPlugin.response.status !== 200 ||
    !noPlugin.text.includes('PLUGIN_NOT_CONNECTED') ||
    !noPlugin.text.includes('"pairingRequired":true') ||
    !noPlugin.text.includes('/codex/connect?code=')
  ) {
    throw new Error(`Codex zero-plugin routing did not return pairing instructions: ${noPlugin.response.status} ${noPlugin.text}`);
  }

  const seenToolsA: BridgeToolName[] = [];
  sockets.push(await connectHostedMockPlugin(
    wsUrl,
    await createApprovedPluginRegistration(baseUrl, 'a'),
    seenToolsA,
    'Codex fallback Rem A',
    'codex-fallback-a'
  ));

  const oneConnection = await mcpToolCall(mcpUrl, 'get_focused_rem', {}, codexToken);
  if (
    oneConnection.response.status !== 200 ||
    !oneConnection.text.includes('Codex fallback Rem A') ||
    !seenToolsA.includes('get_focused_rem')
  ) {
    throw new Error(`Codex single-active fallback did not reach plugin A: ${oneConnection.response.status} ${oneConnection.text}`);
  }

  const seenToolsB: BridgeToolName[] = [];
  sockets.push(await connectHostedMockPlugin(
    wsUrl,
    await createApprovedPluginRegistration(baseUrl, 'b'),
    seenToolsB,
    'Codex fallback Rem B',
    'codex-fallback-b'
  ));

  const multipleConnections = await mcpToolCall(mcpUrl, 'get_focused_rem', {}, codexToken);
  if (
    multipleConnections.response.status !== 200 ||
    !multipleConnections.text.includes('DEVICE_CONFLICT') ||
    !multipleConnections.text.includes('"pairingRequired":true') ||
    seenToolsB.includes('get_focused_rem')
  ) {
    throw new Error(`Codex multiple-active routing was not refused safely: ${multipleConnections.response.status} ${multipleConnections.text}`);
  }

  for (const socket of sockets.splice(0)) {
    socket.close();
  }
  await sleep(100);
  const disconnected = await mcpToolCall(mcpUrl, 'get_focused_rem', {}, codexToken);
  if (
    disconnected.response.status !== 200 ||
    !/PLUGIN_NOT_CONNECTED|NO_ACTIVE_DEVICE/.test(disconnected.text) ||
    disconnected.text.includes('Codex fallback Rem A') ||
    disconnected.text.includes('Codex fallback Rem B')
  ) {
    throw new Error(`Codex disconnected sequence did not fail safely: ${disconnected.response.status} ${disconnected.text}`);
  }

  console.log('Codex routing smoke passed.');
} finally {
  for (const socket of sockets) {
    socket.close();
  }
  await app.stop();
}
