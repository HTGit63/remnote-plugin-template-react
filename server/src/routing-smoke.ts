import { createHash, randomBytes } from 'node:crypto';
import { WebSocket } from 'ws';
import { startCompanionApp } from './app.js';

function b64urlSha256(value: string): string {
  return createHash('sha256').update(value).digest('base64url');
}

function cookieHeader(setCookie: string | null): { cookie: string; csrf: string } {
  if (!setCookie) {
    throw new Error('Missing Set-Cookie header.');
  }
  const parts = setCookie.split(/,(?=\s*rn_)/).map((part) => part.trim());
  const cookies = parts.map((part) => part.split(';')[0]).join('; ');
  const csrf = /rn_csrf=([^;]+)/.exec(setCookie)?.[1];
  if (!csrf) {
    throw new Error('Missing CSRF cookie.');
  }
  return { cookie: cookies, csrf: decodeURIComponent(csrf) };
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

async function localDashboardCookies(baseUrl: string) {
  const authStart = await fetch(`${baseUrl}/auth/start?provider=local`, { redirect: 'manual' });
  const callbackLocation = authStart.headers.get('location');
  if (!callbackLocation) {
    throw new Error('Local dashboard auth failed.');
  }
  const callback = await fetch(`${baseUrl}${callbackLocation}`, { redirect: 'manual' });
  return cookieHeader(callback.headers.get('set-cookie'));
}

async function pairDevice(baseUrl: string, deviceId: string, cookies: { cookie: string; csrf: string }) {
  const start = await postJson(`${baseUrl}/api/pair/start`, { deviceId, deviceName: deviceId });
  const confirm = await postJson(
    `${baseUrl}/api/pair/confirm`,
    { pairingCode: start.json.pairingCode },
    { cookie: cookies.cookie, 'x-csrf-token': cookies.csrf }
  );
  if (confirm.response.status !== 200) {
    throw new Error('Device confirm failed.');
  }
  const status = await postJson(`${baseUrl}/api/pair/status`, {
    pairingCode: start.json.pairingCode,
    deviceId,
  });
  if (status.response.status !== 200) {
    throw new Error('Device status failed.');
  }
  return status.json as {
    deviceId: string;
    pluginSessionId: string;
    pluginSessionToken: string;
  };
}

async function oauthToken(baseUrl: string): Promise<string> {
  const redirectUri = 'http://client.example/callback';
  const registration = await postJson(`${baseUrl}/oauth/register`, {
    client_name: 'Routing smoke client',
    redirect_uris: [redirectUri],
  });
  const verifier = randomBytes(32).toString('base64url');
  const authorizeUrl = new URL(`${baseUrl}/oauth/authorize`);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('client_id', registration.json.client_id);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('code_challenge', b64urlSha256(verifier));
  authorizeUrl.searchParams.set('code_challenge_method', 'S256');
  authorizeUrl.searchParams.set('resource', 'http://127.0.0.1');
  authorizeUrl.searchParams.set('scope', 'bridge:read bridge:write');
  authorizeUrl.searchParams.set('login_hint', 'local-dev');
  const authorize = await fetch(authorizeUrl, { redirect: 'manual' });
  const code = new URL(authorize.headers.get('location') ?? '').searchParams.get('code') ?? '';
  const token = await postForm(`${baseUrl}/oauth/token`, {
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
    resource: 'http://127.0.0.1',
  });
  if (token.response.status !== 200) {
    throw new Error('Routing OAuth token failed.');
  }
  return token.json.access_token;
}

async function connectHostedPlugin(wsUrl: string, session: { deviceId: string; pluginSessionId: string; pluginSessionToken: string }) {
  return new Promise<WebSocket>((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    ws.on('open', () => {
      ws.send(JSON.stringify({
        type: 'plugin_hello',
        protocolVersion: 1,
        clientName: 'remnote-plugin',
        deploymentMode: 'public_hosted_oauth',
        deviceId: session.deviceId,
        pluginSessionId: session.pluginSessionId,
        pluginSessionToken: session.pluginSessionToken,
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
  const cookies = await localDashboardCookies(baseUrl);
  const session = await pairDevice(baseUrl, 'routing-device-a', cookies);
  const badSocket = new WebSocket(wsUrl);
  const badClosed = new Promise<boolean>((resolve) => {
    badSocket.on('close', (code) => resolve(code === 1008));
  });
  badSocket.on('open', () => {
    badSocket.send(JSON.stringify({
      type: 'plugin_hello',
      protocolVersion: 1,
      clientName: 'remnote-plugin',
      deploymentMode: 'public_hosted_oauth',
      deviceId: 'bad-device',
      pluginSessionId: 'bad-session',
      pluginSessionToken: 'bad-token',
    }));
  });
  if (!(await badClosed)) {
    throw new Error('Invalid hosted plugin session was not rejected.');
  }

  ws = await connectHostedPlugin(wsUrl, session);
  const token = await oauthToken(baseUrl);
  const ping = await callPing(`${baseUrl}${app.config.mcpPath}`, token);
  if (!ping.includes('pong')) {
    throw new Error('Hosted OAuth user did not route to paired plugin.');
  }

  console.log('Routing smoke passed.');
} finally {
  ws?.close();
  await app.stop();
}
