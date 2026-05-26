import { startCompanionApp } from './app.js';

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

const app = await startCompanionApp({
  bridgePort: 0,
  mcpPort: 0,
  bridgeToken: 'pairing-smoke-token',
  allowRemote: false,
  allowCors: false,
  rateLimitMaxRequests: 1000,
});
const baseUrl = `http://127.0.0.1:${app.mcpPort}`;

try {
  const start = await postJson(`${baseUrl}/api/pair/start`, {
    deviceId: 'device-pairing-smoke',
    deviceName: 'Pairing smoke device',
  });
  if (start.response.status !== 200 || !start.json.pairingCode) {
    throw new Error('Pair start failed.');
  }

  const authStart = await fetch(`${baseUrl}/auth/start?provider=local`, { redirect: 'manual' });
  const callbackLocation = authStart.headers.get('location');
  if (authStart.status !== 302 || !callbackLocation) {
    throw new Error('Local dashboard auth start failed.');
  }
  const callback = await fetch(`${baseUrl}${callbackLocation}`, { redirect: 'manual' });
  const cookies = cookieHeader(callback.headers.get('set-cookie'));

  const confirm = await postJson(
    `${baseUrl}/api/pair/confirm`,
    { pairingCode: start.json.pairingCode },
    {
      cookie: cookies.cookie,
      'x-csrf-token': cookies.csrf,
    }
  );
  if (confirm.response.status !== 200 || !confirm.json.ok || confirm.text.includes('pluginSessionToken')) {
    throw new Error('Pair confirm failed or leaked plugin token to dashboard.');
  }

  const status = await postJson(`${baseUrl}/api/pair/status`, {
    pairingCode: start.json.pairingCode,
    deviceId: 'device-pairing-smoke',
  });
  if (status.response.status !== 200 || !status.json.pluginSessionToken || !status.json.pluginSessionId) {
    throw new Error('Pair status did not deliver plugin credentials once.');
  }

  const reused = await postJson(`${baseUrl}/api/pair/status`, {
    pairingCode: start.json.pairingCode,
    deviceId: 'device-pairing-smoke',
  });
  if (reused.response.status !== 404) {
    throw new Error('Delivered pairing code was reusable.');
  }

  const revoke = await postJson(
    `${baseUrl}/api/pair/revoke`,
    { pluginSessionId: status.json.pluginSessionId },
    {
      cookie: cookies.cookie,
      'x-csrf-token': cookies.csrf,
    }
  );
  if (revoke.response.status !== 200 || !revoke.json.ok) {
    throw new Error('Plugin session revocation failed.');
  }

  console.log('Pairing smoke passed.');
} finally {
  await app.stop();
}
