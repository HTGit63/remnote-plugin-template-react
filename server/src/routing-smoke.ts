import { createHash } from 'node:crypto';
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
const codeVerifier = 'routing-smoke-verifier';
const fakeRem: SerializedRem = {
  remId: 'rem-hosted-routing-1',
  frontText: 'Hosted routing smoke Rem',
  backText: '',
  plainText: 'Hosted routing smoke Rem',
  breadcrumbs: ['Hosted routing smoke Rem'],
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

async function postForm(url: string, body: Record<string, string>) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body),
  });
  const text = await response.text();
  return { response, text, json: text ? JSON.parse(text) : null };
}

async function mcpRequest(
  url: string,
  method: string,
  params: Record<string, unknown>,
  bearerToken?: string
): Promise<{ status: number; text: string; json: unknown }> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      accept: 'application/json, text/event-stream',
      'content-type': 'application/json',
      ...(bearerToken ? { authorization: `Bearer ${bearerToken}` } : {}),
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: nextId++,
      method,
      params,
    }),
  });
  const text = await response.text();
  return {
    status: response.status,
    text,
    json: text ? JSON.parse(text) : null,
  };
}

async function mcpToolCall(
  url: string,
  name: string,
  args: Record<string, unknown>,
  bearerToken?: string
) {
  return mcpRequest(
    url,
    'tools/call',
    {
      name,
      arguments: args,
    },
    bearerToken
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
          message: `Unhandled hosted routing smoke bridge tool ${request.tool}.`,
        },
      };
  }
}

async function connectHostedMockPlugin(
  wsUrl: string,
  register: BridgePluginRegister,
  seenTools: BridgeToolName[]
): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const timer = setTimeout(() => reject(new Error('Hosted mock plugin did not receive server_hello.')), 3000);
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

async function createHostedAccessToken(baseUrl: string): Promise<{
  accessToken: string;
  pairingId: string;
  pluginInstanceId: string;
  pluginConnectionId: string;
  sessionSecret: string;
}> {
  const create = await postJson(`${baseUrl}/pairing/create`, {
    oauthState: 'routing-smoke-state',
    codeChallenge: createHash('sha256').update(codeVerifier).digest('base64url'),
    codeChallengeMethod: 'S256',
    clientId: 'routing-smoke-client',
    clientName: 'Routing Smoke ChatGPT',
    redirectUri,
    resource: publicBaseUrl,
    requestedScopes: ['bridge:read', 'bridge:write'],
  });
  if (create.response.status !== 201 || !create.json?.pairingCode || !create.json?.pairingId) {
    throw new Error(`Hosted pairing create failed: ${create.response.status} ${create.text}`);
  }

  const pluginInstanceId = 'plugin-routing-smoke';
  const pluginConnectionId = 'conn-routing-smoke';
  const approve = await postJson(`${baseUrl}/pairing/approve`, {
    pairingCode: create.json.pairingCode,
    pluginInstanceId,
    pluginConnectionId,
    workspaceLabel: 'Routing smoke workspace',
    accessScope: 'focused-rem-only',
    trustedWriteMode: 'trusted-inside-scope',
  });
  if (approve.response.status !== 200 || !approve.json?.sessionSecret) {
    throw new Error(`Hosted pairing approve failed: ${approve.response.status} ${approve.text}`);
  }

  const status = await fetch(`${baseUrl}/pairing/status?pairing_id=${encodeURIComponent(create.json.pairingId)}`, {
    headers: { accept: 'application/json' },
  });
  const statusText = await status.text();
  const statusJson = statusText ? JSON.parse(statusText) : null;
  if (status.status !== 200 || !statusJson?.redirectUrl) {
    throw new Error(`Hosted pairing status missed redirect code: ${status.status} ${statusText}`);
  }

  const code = new URL(statusJson.redirectUrl).searchParams.get('code');
  if (!code) {
    throw new Error(`Hosted pairing redirect missed authorization code: ${statusJson.redirectUrl}`);
  }

  const token = await postForm(`${baseUrl}/oauth/token`, {
    grant_type: 'authorization_code',
    code,
    code_verifier: codeVerifier,
    redirect_uri: redirectUri,
    resource: publicBaseUrl,
  });
  if (token.response.status !== 200 || !token.json?.access_token) {
    throw new Error(`Hosted OAuth token exchange failed: ${token.response.status} ${token.text}`);
  }

  return {
    accessToken: token.json.access_token,
    pairingId: create.json.pairingId,
    pluginInstanceId,
    pluginConnectionId: approve.json.pluginConnectionId || pluginConnectionId,
    sessionSecret: approve.json.sessionSecret,
  };
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
  sessionSecret: 'routing-smoke-session-secret',
  bridgePath: '/remnote',
  mcpPath: '/mcp',
  singlePort: true,
  port: 0,
  bridgePort: 0,
  mcpPort: 0,
  rateLimitMaxRequests: 1000,
});

const baseUrl = `http://127.0.0.1:${app.mcpPort}`;
const mcpUrl = `${baseUrl}${app.config.mcpPath}`;
let ws: WebSocket | undefined;

try {
  const health = await fetch(`${baseUrl}/health`);
  const healthText = await health.text();
  if (
    health.status !== 200 ||
    !healthText.includes('"deploymentMode":"hosted"') ||
    !healthText.includes('"toolCallAuthMode":"hosted_oauth_required"') ||
    !healthText.includes('"hostedPairingEnabled":true') ||
    !healthText.includes(`"mcpEndpoint":"${publicBaseUrl}/mcp"`) ||
    !healthText.includes(`"bridgeEndpoint":"wss://remnote-plugin-template-react.onrender.com/remnote"`)
  ) {
    throw new Error(`/health missed hosted runtime proof: ${health.status} ${healthText}`);
  }

  const discovery = await mcpRequest(mcpUrl, 'tools/list', {});
  const discoveredTools = (discovery.json as {
    result?: { tools?: Array<{ name?: string; securitySchemes?: Array<{ type?: string; scopes?: string[] }> }> };
  })?.result?.tools ?? [];
  if (discovery.status !== 200 || discoveredTools.length !== 19) {
    throw new Error(`Hosted tools/list missed default mass_note_writer surface: ${discovery.status} ${discovery.text}`);
  }
  for (const tool of discoveredTools) {
    if (
      tool.securitySchemes?.length !== 1 ||
      tool.securitySchemes[0]?.type !== 'oauth2' ||
      !tool.securitySchemes[0]?.scopes?.includes('bridge:read')
    ) {
      throw new Error(`Hosted tools/list missed top-level OAuth securitySchemes for ${tool.name}: ${discovery.text}`);
    }
  }

  const missingBearer = await mcpToolCall(mcpUrl, 'get_bridge_status', {});
  if (
    missingBearer.status !== 200 ||
    !missingBearer.text.includes('mcp/www_authenticate') ||
    !missingBearer.text.includes('error=\\\"invalid_token\\\"') ||
    !missingBearer.text.includes('error_description=\\\"Missing bearer token.') ||
    missingBearer.text.includes('Missing or invalid bridge token')
  ) {
    throw new Error(`Hosted MCP without OAuth missed ChatGPT tool auth challenge: ${missingBearer.status} ${missingBearer.text}`);
  }

  const pairing = await createHostedAccessToken(baseUrl);

  const statusCall = await mcpToolCall(mcpUrl, 'get_bridge_status', {}, pairing.accessToken);
  if (
    statusCall.status !== 200 ||
    !statusCall.text.includes('"deploymentMode":"hosted"') ||
    !statusCall.text.includes('"hosted_oauth_required"')
  ) {
    throw new Error(`Hosted OAuth token did not authorize status tool: ${statusCall.status} ${statusCall.text}`);
  }

  const noPlugin = await mcpToolCall(mcpUrl, 'get_focused_rem', {}, pairing.accessToken);
  if (
    noPlugin.status !== 200 ||
    !/PLUGIN_NOT_CONNECTED|NO_PAIRED_PLUGIN_SESSION/.test(noPlugin.text) ||
    noPlugin.text.includes('Missing or invalid bridge token')
  ) {
    throw new Error(`Hosted no-plugin result used wrong auth/routing path: ${noPlugin.status} ${noPlugin.text}`);
  }

  const seenTools: BridgeToolName[] = [];
  ws = await connectHostedMockPlugin(
    `ws://127.0.0.1:${app.mcpPort}${app.config.bridgePath}`,
    {
      type: 'plugin_register',
      pluginInstanceId: pairing.pluginInstanceId,
      pluginConnectionId: pairing.pluginConnectionId,
      sessionSecret: pairing.sessionSecret,
      workspaceLabel: 'Routing smoke workspace',
      supportedTools: ['get_status', 'get_focused_rem'],
      accessScope: 'focused-rem-only',
      trustedWriteMode: 'trusted-inside-scope',
    },
    seenTools
  );

  const connectedHealth = await fetch(`${baseUrl}/health`);
  const connectedHealthText = await connectedHealth.text();
  if (connectedHealth.status !== 200 || !connectedHealthText.includes('"connected":true')) {
    throw new Error(`Hosted plugin_register did not mark bridge connected: ${connectedHealth.status} ${connectedHealthText}`);
  }

  const focused = await mcpToolCall(mcpUrl, 'get_focused_rem', {}, pairing.accessToken);
  if (
    focused.status !== 200 ||
    !focused.text.includes(fakeRem.frontText) ||
    !seenTools.includes('get_focused_rem')
  ) {
    throw new Error(`Hosted get_focused_rem did not reach paired plugin: ${focused.status} ${focused.text}`);
  }

  ws.close();
  ws = undefined;
  await sleep(100);
  const offlineHealth = await fetch(`${baseUrl}/health`);
  const offlineHealthText = await offlineHealth.text();
  if (
    offlineHealth.status !== 200 ||
    !offlineHealthText.includes('"connected":false') ||
    !offlineHealthText.includes('"hostedPairingStatus":"disconnected"') ||
    !offlineHealthText.includes('"sessionStale":true')
  ) {
    throw new Error(`Hosted disconnect did not report offline/stale pairing truth: ${offlineHealth.status} ${offlineHealthText}`);
  }
  const disconnected = await mcpToolCall(mcpUrl, 'get_focused_rem', {}, pairing.accessToken);
  if (
    disconnected.status !== 200 ||
    !/PLUGIN_NOT_CONNECTED|NO_ACTIVE_DEVICE|NO_PAIRED_PLUGIN_SESSION/.test(disconnected.text) ||
    disconnected.text.includes(fakeRem.frontText) ||
    disconnected.text.includes('mcp/www_authenticate')
  ) {
    throw new Error(`Hosted disconnected sequence did not fail safely: ${disconnected.status} ${disconnected.text}`);
  }

  const firstReconnect = await connectHostedMockPlugin(
    `ws://127.0.0.1:${app.mcpPort}${app.config.bridgePath}`,
    {
      type: 'plugin_register',
      pluginInstanceId: pairing.pluginInstanceId,
      pluginConnectionId: `${pairing.pluginConnectionId}-reconnect-1`,
      sessionSecret: pairing.sessionSecret,
      workspaceLabel: 'Routing smoke workspace',
      supportedTools: ['get_status', 'get_focused_rem'],
      accessScope: 'focused-rem-only',
      trustedWriteMode: 'trusted-inside-scope',
    },
    seenTools
  );
  ws = await connectHostedMockPlugin(
    `ws://127.0.0.1:${app.mcpPort}${app.config.bridgePath}`,
    {
      type: 'plugin_register',
      pluginInstanceId: pairing.pluginInstanceId,
      pluginConnectionId: `${pairing.pluginConnectionId}-reconnect-2`,
      sessionSecret: pairing.sessionSecret,
      workspaceLabel: 'Routing smoke workspace',
      supportedTools: ['get_status', 'get_focused_rem'],
      accessScope: 'focused-rem-only',
      trustedWriteMode: 'trusted-inside-scope',
    },
    seenTools
  );
  firstReconnect.close();
  await sleep(100);

  const reconnected = await mcpToolCall(mcpUrl, 'get_focused_rem', {}, pairing.accessToken);
  const reconnectedHealth = await fetch(`${baseUrl}/health`);
  const reconnectedHealthText = await reconnectedHealth.text();
  if (
    reconnected.status !== 200 ||
    !reconnected.text.includes(fakeRem.frontText) ||
    reconnectedHealth.status !== 200 ||
    !reconnectedHealthText.includes('"connected":true') ||
    !reconnectedHealthText.includes('"hostedPairingStatus":"connected"') ||
    !reconnectedHealthText.includes('"sessionStale":false')
  ) {
    throw new Error(`Hosted reconnect did not recover or old close removed the new route: ${reconnected.status} ${reconnected.text} ${reconnectedHealthText}`);
  }

  console.log('Hosted routing smoke passed.');
} finally {
  ws?.close();
  await app.stop();
}
