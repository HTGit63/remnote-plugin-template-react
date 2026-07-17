import { startCompanionApp } from './app.js';

type JsonResponse = {
  response: Response;
  json: Record<string, any>;
  text: string;
};

async function postJson(url: string, body: unknown, headers: Record<string, string> = {}): Promise<JsonResponse> {
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
  return { response, json: text ? JSON.parse(text) : {}, text };
}

async function getJson(url: string, headers: Record<string, string> = {}): Promise<JsonResponse> {
  const response = await fetch(url, { headers: { accept: 'application/json', ...headers }, redirect: 'manual' });
  const text = await response.text();
  let json: Record<string, any> = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    // Some intentionally hidden routes return plain 404 text.
  }
  return { response, json, text };
}

function assertStatus(actual: number, expected: number | number[], label: string): void {
  const allowed = Array.isArray(expected) ? expected : [expected];
  if (!allowed.includes(actual)) {
    throw new Error(`${label}: expected ${allowed.join('/')}, received ${actual}.`);
  }
}

const publicBaseUrl = 'https://security-auth.example.test';
const app = await startCompanionApp({
  deploymentMode: 'hosted',
  hostedPairingEnabled: true,
  storageMode: 'memory',
  publicBaseUrl,
  mcpResource: publicBaseUrl,
  dashboardUrl: `${publicBaseUrl}/dashboard`,
  oauthIssuer: publicBaseUrl,
  bridgeToken: 'unused-local-token',
  allowNoToken: false,
  connectorCompatNoAuthTools: false,
  allowRemote: true,
  allowCors: true,
  allowedOrigins: ['https://chatgpt.com', publicBaseUrl],
  sessionSecret: 'security-auth-session-secret',
  adminDebugSecret: 'security-auth-admin-secret',
  nodeEnv: 'development',
  singlePort: true,
  port: 0,
  bridgePort: 0,
  mcpPort: 0,
  rateLimitMaxRequests: 1000,
});
const baseUrl = `http://127.0.0.1:${app.mcpPort}`;

try {
  const localProvider = await getJson(`${baseUrl}/auth/start?provider=local`);
  assertStatus(localProvider.response.status, 400, 'Hosted local dashboard provider bypass');
  if (localProvider.response.headers.has('set-cookie') || localProvider.response.headers.has('location')) {
    throw new Error('Hosted local dashboard provider bypass returned auth material or redirect.');
  }

  const metadata = await getJson(`${baseUrl}/.well-known/oauth-authorization-server`);
  const methods = metadata.json.code_challenge_methods_supported;
  if (!Array.isArray(methods) || methods.length !== 1 || methods[0] !== 'S256') {
    throw new Error(`OAuth metadata advertised unsafe PKCE methods: ${JSON.stringify(methods)}.`);
  }

  const registered = await postJson(`${baseUrl}/oauth/register`, {
    client_name: 'Security auth regression',
    redirect_uris: ['http://127.0.0.1:32123/callback'],
  });
  assertStatus(registered.response.status, 201, 'OAuth client registration');
  const plainAuthorize = await getJson(
    `${baseUrl}/oauth/authorize?response_type=code&client_id=${encodeURIComponent(registered.json.client_id)}` +
      `&redirect_uri=${encodeURIComponent('http://127.0.0.1:32123/callback')}` +
      '&code_challenge=plain-verifier&code_challenge_method=plain&state=security-state'
  );
  assertStatus(plainAuthorize.response.status, 400, 'Plain PKCE authorization');

  const created = await postJson(`${baseUrl}/pairing/create`, {
    clientName: 'Security auth regression',
    requestedScopes: ['bridge:read', 'bridge:write'],
  });
  assertStatus(created.response.status, 201, 'Pairing creation');

  const oversizedPairing = await postJson(`${baseUrl}/pairing/create`, {
    clientName: 'x'.repeat(121),
    requestedScopes: ['bridge:read', 'bridge:write'],
  });
  assertStatus(oversizedPairing.response.status, 400, 'Oversized pairing metadata');

  const unknownScopePairing = await postJson(`${baseUrl}/pairing/create`, {
    clientName: 'Security auth regression',
    requestedScopes: ['bridge:read', 'bridge:admin'],
  });
  assertStatus(unknownScopePairing.response.status, 400, 'Unknown pairing scope');
  const approved = await postJson(`${baseUrl}/pairing/approve`, {
    pairingCode: created.json.pairingCode,
    pluginInstanceId: 'security-auth-plugin',
  });
  assertStatus(approved.response.status, 200, 'Pairing approval');

  const idOnlyDisconnect = await postJson(`${baseUrl}/pairing/disconnect`, {
    pairingId: created.json.pairingId,
  });
  assertStatus(idOnlyDisconnect.response.status, [401, 403], 'Pairing ID-only disconnect');

  const statusAfterRejectedDisconnect = await getJson(
    `${baseUrl}/pairing/status?pairing_id=${encodeURIComponent(created.json.pairingId)}`
  );
  assertStatus(statusAfterRejectedDisconnect.response.status, 200, 'Pairing status after rejected disconnect');
  if (statusAfterRejectedDisconnect.json.status === 'disconnected') {
    throw new Error('Rejected ID-only disconnect still revoked pairing.');
  }

  const validDisconnect = await postJson(`${baseUrl}/pairing/disconnect`, {
    pairingId: created.json.pairingId,
    sessionSecret: approved.json.sessionSecret,
  });
  assertStatus(validDisconnect.response.status, 200, 'Authenticated pairing disconnect');

  const debugQuery = await getJson(
    `${baseUrl}/debug/status?admin_debug_secret=security-auth-admin-secret`
  );
  assertStatus(debugQuery.response.status, 404, 'Debug query-string secret');
  const debugHeader = await getJson(`${baseUrl}/debug/status`, {
    'x-admin-debug-secret': 'security-auth-admin-secret',
  });
  assertStatus(debugHeader.response.status, 200, 'Debug header secret');

  const diagnosticsQuery = await getJson(
    `${baseUrl}/diagnostics?admin_debug_secret=security-auth-admin-secret`
  );
  assertStatus(diagnosticsQuery.response.status, 403, 'Diagnostics query-string secret');
  const diagnosticsHeader = await getJson(`${baseUrl}/diagnostics`, {
    'x-admin-debug-secret': 'security-auth-admin-secret',
  });
  assertStatus(diagnosticsHeader.response.status, 200, 'Diagnostics header secret');

  const malformed = await fetch(`${baseUrl}/pairing/create`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{',
  });
  assertStatus(malformed.status, 400, 'Malformed pairing JSON');
  await malformed.text();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const failedGuess = await postJson(`${baseUrl}/pairing/approve`, {
      pairingCode: `000-${String(attempt).padStart(3, '0')}`,
    }, {
      'x-forwarded-for': `198.51.100.${attempt + 1}`,
    });
    assertStatus(failedGuess.response.status, 404, `Failed pairing guess ${attempt + 1}`);
  }
  const spoofedNinthGuess = await postJson(`${baseUrl}/pairing/approve`, {
    pairingCode: '000-999',
  }, {
    'x-forwarded-for': '203.0.113.99',
  });
  assertStatus(spoofedNinthGuess.response.status, 429, 'Spoofed forwarded-IP pairing throttle bypass');

  const health = await getJson(`${baseUrl}/health`);
  assertStatus(health.response.status, 200, 'Health after malformed early-route request');

  console.log('Security auth/session regression smoke passed.');
} finally {
  await app.stop();
}
