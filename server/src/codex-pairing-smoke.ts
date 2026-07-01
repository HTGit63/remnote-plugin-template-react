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
const codexToken = 'codex-pairing-smoke-token-with-enough-entropy';

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
          message: `Unhandled Codex pairing smoke tool ${request.tool}.`,
        },
      };
  }
}

async function createApprovedPluginRegistration(
  baseUrl: string,
  suffix: string
): Promise<{ register: BridgePluginRegister; sessionSecret: string }> {
  const create = await postJson(`${baseUrl}/pairing/create`, {
    oauthState: `codex-pairing-${suffix}`,
    codeChallenge: `codex-pairing-verifier-${suffix}`,
    codeChallengeMethod: 'plain',
    clientId: `codex-pairing-client-${suffix}`,
    clientName: 'Codex Pairing Smoke',
    redirectUri,
    resource: publicBaseUrl,
    requestedScopes: ['bridge:read', 'bridge:write'],
  });
  if (create.response.status !== 201 || !create.json?.pairingCode) {
    throw new Error(`Pairing create failed: ${create.response.status} ${create.text}`);
  }

  const pluginInstanceId = `plugin-codex-pairing-${suffix}`;
  const pluginConnectionId = `conn-codex-pairing-${suffix}`;
  const approve = await postJson(`${baseUrl}/pairing/approve`, {
    pairingCode: create.json.pairingCode,
    pluginInstanceId,
    pluginConnectionId,
    workspaceLabel: `Codex pairing workspace ${suffix}`,
    accessScope: 'current-rem-tree',
    trustedWriteMode: 'trusted-inside-scope',
  });
  if (approve.response.status !== 200 || !approve.json?.sessionSecret) {
    throw new Error(`Pairing approve failed: ${approve.response.status} ${approve.text}`);
  }

  return {
    sessionSecret: approve.json.sessionSecret,
    register: {
      type: 'plugin_register',
      pluginInstanceId,
      pluginConnectionId,
      sessionSecret: approve.json.sessionSecret,
      workspaceLabel: `Codex pairing workspace ${suffix}`,
      supportedTools: ['get_status', 'get_focused_rem'],
      accessScope: 'current-rem-tree',
      trustedWriteMode: 'trusted-inside-scope',
    },
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
    const timer = setTimeout(() => reject(new Error('Codex pairing mock plugin did not receive server_hello.')), 3000);
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
  sessionSecret: 'codex-pairing-smoke-session-secret',
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
  const pluginA = await createApprovedPluginRegistration(baseUrl, 'a');
  const pluginB = await createApprovedPluginRegistration(baseUrl, 'b');

  const start = await postJson(
    `${baseUrl}/codex/pair/start`,
    {},
    { authorization: `Bearer ${codexToken}` }
  );
  if (
    start.response.status !== 201 ||
    !start.json?.pairingId ||
    !start.json?.userCode ||
    !String(start.json?.browserUrl).includes('/codex/connect?code=')
  ) {
    throw new Error(`Codex pairing start failed: ${start.response.status} ${start.text}`);
  }

  const pending = await getJson(
    `${baseUrl}/codex/pair/status?pairingId=${encodeURIComponent(start.json.pairingId)}`,
    { authorization: `Bearer ${codexToken}` }
  );
  if (pending.response.status !== 200 || pending.json?.status !== 'pending') {
    throw new Error(`Codex pairing status did not show pending: ${pending.response.status} ${pending.text}`);
  }

  const unauthorizedApprove = await postJson(`${baseUrl}/codex/pair/approve`, {
    pairingId: start.json.pairingId,
  });
  if (unauthorizedApprove.response.status !== 401) {
    throw new Error(`Codex pairing approve without plugin secret should fail: ${unauthorizedApprove.response.status} ${unauthorizedApprove.text}`);
  }

  const approve = await postJson(
    `${baseUrl}/codex/pair/approve`,
    { pairingId: start.json.pairingId },
    { 'x-remnote-plugin-session-secret': pluginB.sessionSecret }
  );
  if (
    approve.response.status !== 200 ||
    approve.json?.status !== 'approved' ||
    approve.json?.linked !== true
  ) {
    throw new Error(`Codex pairing approve failed: ${approve.response.status} ${approve.text}`);
  }

  const seenToolsA: BridgeToolName[] = [];
  const seenToolsB: BridgeToolName[] = [];
  sockets.push(await connectHostedMockPlugin(wsUrl, pluginA.register, seenToolsA, 'Codex linked Rem A', 'codex-linked-a'));
  sockets.push(await connectHostedMockPlugin(wsUrl, pluginB.register, seenToolsB, 'Codex linked Rem B', 'codex-linked-b'));

  const linkedStatus = await mcpToolCall(mcpUrl, 'get_bridge_status', {}, codexToken);
  if (
    linkedStatus.response.status !== 200 ||
    !linkedStatus.text.includes('"codexRoutingMode":"linked_plugin_session"') ||
    !linkedStatus.text.includes('"codexPairingStatus":"linked"')
  ) {
    throw new Error(`Codex linked status missing linked routing: ${linkedStatus.response.status} ${linkedStatus.text}`);
  }

  const focused = await mcpToolCall(mcpUrl, 'get_focused_rem', {}, codexToken);
  if (
    focused.response.status !== 200 ||
    !focused.text.includes('Codex linked Rem B') ||
    seenToolsA.includes('get_focused_rem') ||
    !seenToolsB.includes('get_focused_rem')
  ) {
    throw new Error(`Codex linked call did not route to plugin B only: ${focused.response.status} ${focused.text}`);
  }

  console.log('Codex pairing smoke passed.');
} finally {
  for (const socket of sockets) {
    socket.close();
  }
  await app.stop();
}
