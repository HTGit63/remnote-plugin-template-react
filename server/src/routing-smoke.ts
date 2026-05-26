import { createHash, randomBytes } from 'node:crypto';
import { WebSocket } from 'ws';
import { startCompanionApp } from './app.js';

function b64urlSha256(value: string): string {
  return createHash('sha256').update(value).digest('base64url');
}

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
  return { response, json: text ? JSON.parse(text) : null, text };
}

async function postForm(url: string, body: Record<string, string>) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body).toString(),
  });
  const text = await response.text();
  return { response, json: text ? JSON.parse(text) : null, text };
}

async function registerClient(baseUrl: string, redirectUri: string): Promise<string> {
  const registration = await postJson(`${baseUrl}/oauth/register`, {
    client_name: 'Routing smoke ChatGPT session',
    redirect_uris: [redirectUri],
  });
  if (registration.response.status !== 201) {
    throw new Error(`Client registration failed: ${registration.text}`);
  }
  return registration.json.client_id;
}

async function authorizePairing(baseUrl: string, clientId: string, redirectUri: string) {
  const verifier = randomBytes(32).toString('base64url');
  const authorizeUrl = new URL(`${baseUrl}/oauth/authorize`);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('code_challenge', b64urlSha256(verifier));
  authorizeUrl.searchParams.set('code_challenge_method', 'S256');
  authorizeUrl.searchParams.set('resource', 'http://127.0.0.1');
  authorizeUrl.searchParams.set('scope', 'bridge:read bridge:write');
  authorizeUrl.searchParams.set('state', `routing-${Date.now()}`);
  const authorize = await fetch(authorizeUrl, { redirect: 'manual' });
  const location = authorize.headers.get('location') ?? '';
  const pairingId = new URL(location).searchParams.get('pairing_id') ?? '';
  const connect = await fetch(`${baseUrl}/connect?pairing_id=${encodeURIComponent(pairingId)}`);
  const pairingCode = (await connect.text()).match(/\b\d{3}-\d{3}\b/)?.[0] ?? '';
  if (!pairingId || !pairingCode) {
    throw new Error('OAuth authorize did not create a pairing code.');
  }
  return { pairingId, pairingCode, verifier };
}

async function approvePairing(baseUrl: string, pairingId: string, pairingCode: string) {
  const pluginInstanceId = `plugin-${pairingId}`;
  const pluginConnectionId = `conn-${pairingId}`;
  const approval = await postJson(`${baseUrl}/pairing/approve`, {
    pairingCode,
    pluginInstanceId,
    pluginConnectionId,
    workspaceLabel: 'Routing smoke workspace',
    accessScope: 'focused-rem-only',
    trustedWriteMode: 'ask-every-write',
  });
  if (approval.response.status !== 200) {
    throw new Error(`Pairing approval failed: ${approval.text}`);
  }
  const status = await fetch(`${baseUrl}/pairing/status?pairing_id=${encodeURIComponent(pairingId)}`);
  const statusJson = await status.json() as { redirectUrl?: string };
  const code = statusJson.redirectUrl ? new URL(statusJson.redirectUrl).searchParams.get('code') ?? '' : '';
  if (!code) {
    throw new Error('Approved pairing did not expose OAuth code.');
  }
  return {
    code,
    pluginInstanceId,
    pluginConnectionId,
    sessionSecret: approval.json.sessionSecret as string,
  };
}

async function oauthToken(baseUrl: string, code: string, verifier: string, redirectUri: string): Promise<string> {
  const token = await postForm(`${baseUrl}/oauth/token`, {
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
    resource: 'http://127.0.0.1',
  });
  if (token.response.status !== 200) {
    throw new Error(`Routing OAuth token failed: ${token.text}`);
  }
  return token.json.access_token;
}

async function connectHostedPlugin(
  wsUrl: string,
  session: { pluginInstanceId: string; pluginConnectionId: string; sessionSecret: string }
) {
  return new Promise<WebSocket>((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    ws.on('open', () => {
      ws.send(JSON.stringify({
        type: 'plugin_register',
        pluginInstanceId: session.pluginInstanceId,
        pluginConnectionId: session.pluginConnectionId,
        sessionSecret: session.sessionSecret,
        workspaceLabel: 'Routing smoke workspace',
        supportedTools: ['ping'],
      }));
    });
    ws.on('message', (raw) => {
      const message = JSON.parse(raw.toString());
      if (message.type === 'server_hello') {
        resolve(ws);
        return;
      }
      ws.send(JSON.stringify({ id: message.id, ok: true, result: { message: 'pong' } }));
    });
    ws.on('error', reject);
  });
}

async function callPing(mcpUrl: string, token: string): Promise<string> {
  const response = await fetch(mcpUrl, {
    method: 'POST',
    headers: {
      accept: 'application/json, text/event-stream',
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'ping_remnote_plugin',
        arguments: { message: 'routing smoke' },
      },
    }),
  });
  return response.text();
}

const app = await startCompanionApp({
  deploymentMode: 'public_hosted_oauth',
  storageMode: 'memory',
  allowNoToken: true,
  bridgeToken: '',
  publicBaseUrl: 'http://127.0.0.1',
  mcpResource: 'http://127.0.0.1',
  dashboardUrl: 'http://127.0.0.1/dashboard',
  oauthIssuer: 'http://127.0.0.1',
  bridgePort: 0,
  mcpPort: 0,
  allowRemote: false,
  allowCors: false,
  rateLimitMaxRequests: 1000,
});

const baseUrl = `http://127.0.0.1:${app.mcpPort}`;
const wsUrl = `ws://127.0.0.1:${app.bridgePort}${app.config.bridgePath}`;
let ws: WebSocket | undefined;

try {
  const redirectUri = 'https://client.example/callback';
  const clientId = await registerClient(baseUrl, redirectUri);
  const pairing = await authorizePairing(baseUrl, clientId, redirectUri);
  const approved = await approvePairing(baseUrl, pairing.pairingId, pairing.pairingCode);
  const token = await oauthToken(baseUrl, approved.code, pairing.verifier, redirectUri);

  const badSocket = new WebSocket(wsUrl);
  const badClosed = new Promise<boolean>((resolve) => {
    badSocket.on('close', (code) => resolve(code === 1008));
  });
  badSocket.on('open', () => {
    badSocket.send(JSON.stringify({
      type: 'plugin_register',
      pluginInstanceId: 'wrong-plugin',
      pluginConnectionId: 'wrong-connection',
      sessionSecret: approved.sessionSecret,
      supportedTools: ['ping'],
    }));
  });
  if (!(await badClosed)) {
    throw new Error('Wrong plugin instance was not rejected.');
  }

  const offlinePing = await callPing(`${baseUrl}${app.config.mcpPath}`, token);
  if (!offlinePing.includes('RemNote plugin is not connected. Open RemNote and reconnect the ChatGPT Bridge plugin.')) {
    throw new Error('Offline plugin did not return reconnect error.');
  }

  ws = await connectHostedPlugin(wsUrl, approved);
  const ping = await callPing(`${baseUrl}${app.config.mcpPath}`, token);
  if (!ping.includes('pong')) {
    throw new Error('Hosted OAuth session did not route to approved plugin.');
  }

  console.log('Routing smoke passed.');
} finally {
  ws?.close();
  await app.stop();
}
