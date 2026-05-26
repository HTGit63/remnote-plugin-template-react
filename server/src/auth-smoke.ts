import { createHash, randomBytes } from 'node:crypto';
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
  const json = text ? JSON.parse(text) : null;
  return { response, json, text };
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
  const json = text ? JSON.parse(text) : null;
  return { response, json, text };
}

async function mcpCall(url: string, name: string, token?: string) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      accept: 'application/json, text/event-stream',
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name,
        arguments: name === 'create_rem' ? { parentId: 'root', markdown: 'Auth smoke' } : {},
      },
    }),
  });
  const text = await response.text();
  return { response, text };
}

async function registerClient(baseUrl: string, redirectUri: string) {
  const registration = await postJson(`${baseUrl}/oauth/register`, {
    client_name: 'Auth smoke ChatGPT session',
    redirect_uris: [redirectUri],
  });
  if (registration.response.status !== 201 || !registration.json.client_id) {
    throw new Error(`Dynamic client registration failed: ${registration.text}`);
  }
  return registration.json.client_id as string;
}

async function startOauthPairing(baseUrl: string, options: {
  clientId: string;
  redirectUri: string;
  verifier: string;
  scope: string;
  state: string;
}) {
  const authorizeUrl = new URL(`${baseUrl}/oauth/authorize`);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('client_id', options.clientId);
  authorizeUrl.searchParams.set('redirect_uri', options.redirectUri);
  authorizeUrl.searchParams.set('code_challenge', b64urlSha256(options.verifier));
  authorizeUrl.searchParams.set('code_challenge_method', 'S256');
  authorizeUrl.searchParams.set('resource', 'http://127.0.0.1');
  authorizeUrl.searchParams.set('scope', options.scope);
  authorizeUrl.searchParams.set('state', options.state);

  const authorize = await fetch(authorizeUrl, { redirect: 'manual' });
  const location = authorize.headers.get('location') ?? '';
  if (authorize.status !== 302 || !location.includes('/connect?')) {
    throw new Error(`Authorization endpoint did not redirect to /connect: ${authorize.status} ${location}`);
  }
  const pairingId = new URL(location).searchParams.get('pairing_id') ?? '';
  if (!pairingId) {
    throw new Error('Authorization redirect missed pairing_id.');
  }

  const connect = await fetch(`${baseUrl}/connect?pairing_id=${encodeURIComponent(pairingId)}`);
  const connectHtml = await connect.text();
  const pairingCode = connectHtml.match(/\b\d{3}-\d{3}\b/)?.[0] ?? '';
  if (!connect.ok || !pairingCode) {
    throw new Error('Connect page did not display a pairing code.');
  }
  return { pairingId, pairingCode };
}

async function approveAndGetCode(baseUrl: string, pairingId: string, pairingCode: string) {
  const approval = await postJson(`${baseUrl}/pairing/approve`, {
    pairingCode,
    pluginInstanceId: `plugin-${pairingId}`,
    pluginConnectionId: `conn-${pairingId}`,
    workspaceLabel: 'Auth smoke workspace',
    accessScope: 'focused-rem-only',
    trustedWriteMode: 'ask-every-write',
  });
  if (approval.response.status !== 200 || !approval.json.sessionSecret) {
    throw new Error(`Pairing approval failed: ${approval.text}`);
  }

  const status = await fetch(`${baseUrl}/pairing/status?pairing_id=${encodeURIComponent(pairingId)}`);
  const statusJson = await status.json() as { redirectUrl?: string; status?: string };
  if (!status.ok || !statusJson.redirectUrl) {
    throw new Error('Approved pairing status did not provide OAuth redirect URL.');
  }
  const code = new URL(statusJson.redirectUrl).searchParams.get('code') ?? '';
  if (!code) {
    throw new Error('OAuth redirect URL missed authorization code.');
  }
  return { code, pluginSession: approval.json };
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
const mcpUrl = `${baseUrl}${app.config.mcpPath}`;

try {
  const protectedResource = await fetch(`${baseUrl}/.well-known/oauth-protected-resource`);
  const protectedJson = await protectedResource.json() as { resource?: string; authorization_servers?: string[] };
  if (!protectedResource.ok || protectedJson.resource !== 'http://127.0.0.1') {
    throw new Error('Protected resource metadata failed.');
  }

  const authServer = await fetch(`${baseUrl}/.well-known/oauth-authorization-server`);
  const authJson = await authServer.json() as { code_challenge_methods_supported?: string[] };
  if (!authServer.ok || !authJson.code_challenge_methods_supported?.includes('S256')) {
    throw new Error('Authorization server metadata failed.');
  }

  const unauth = await mcpCall(mcpUrl, 'get_bridge_status');
  if (
    unauth.response.status !== 401 ||
    !unauth.response.headers.get('www-authenticate')?.includes('oauth-protected-resource')
  ) {
    throw new Error('Unauthenticated MCP call did not return OAuth challenge.');
  }

  const redirectUri = 'https://client.example/callback';
  const clientId = await registerClient(baseUrl, redirectUri);

  const missingStateUrl = new URL(`${baseUrl}/oauth/authorize`);
  missingStateUrl.searchParams.set('response_type', 'code');
  missingStateUrl.searchParams.set('client_id', clientId);
  missingStateUrl.searchParams.set('redirect_uri', redirectUri);
  missingStateUrl.searchParams.set('code_challenge', b64urlSha256('missing-state-verifier'));
  missingStateUrl.searchParams.set('code_challenge_method', 'S256');
  missingStateUrl.searchParams.set('resource', 'http://127.0.0.1');
  const missingState = await fetch(missingStateUrl);
  if (missingState.status !== 400) {
    throw new Error('Missing OAuth state was not rejected.');
  }

  const verifier = randomBytes(32).toString('base64url');
  const started = await startOauthPairing(baseUrl, {
    clientId,
    redirectUri,
    verifier,
    scope: 'bridge:read bridge:write',
    state: 'auth-smoke-state',
  });
  const { code } = await approveAndGetCode(baseUrl, started.pairingId, started.pairingCode);

  const badPkce = await postForm(`${baseUrl}/oauth/token`, {
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: 'wrong-verifier',
    resource: 'http://127.0.0.1',
  });
  if (badPkce.response.status !== 400) {
    throw new Error('Invalid PKCE verifier was not rejected.');
  }

  const retryAfterBadPkce = await postForm(`${baseUrl}/oauth/token`, {
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
    resource: 'http://127.0.0.1',
  });
  if (retryAfterBadPkce.response.status !== 400) {
    throw new Error('Consumed authorization code was reusable after bad PKCE attempt.');
  }

  const verifier2 = randomBytes(32).toString('base64url');
  const started2 = await startOauthPairing(baseUrl, {
    clientId,
    redirectUri,
    verifier: verifier2,
    scope: 'bridge:read bridge:write',
    state: 'auth-smoke-state-2',
  });
  const { code: code2 } = await approveAndGetCode(baseUrl, started2.pairingId, started2.pairingCode);
  const token = await postForm(`${baseUrl}/oauth/token`, {
    grant_type: 'authorization_code',
    code: code2,
    redirect_uri: redirectUri,
    code_verifier: verifier2,
    resource: 'http://127.0.0.1',
  });
  if (token.response.status !== 200 || !token.json.access_token || !token.json.refresh_token) {
    throw new Error(`Token endpoint failed: ${token.text}`);
  }

  const reused = await postForm(`${baseUrl}/oauth/token`, {
    grant_type: 'authorization_code',
    code: code2,
    redirect_uri: redirectUri,
    code_verifier: verifier2,
    resource: 'http://127.0.0.1',
  });
  if (reused.response.status !== 400) {
    throw new Error('Authorization code was reusable.');
  }

  const authedStatus = await mcpCall(mcpUrl, 'get_bridge_status', token.json.access_token);
  if (authedStatus.response.status !== 200 || !authedStatus.text.includes('"ok":true')) {
    throw new Error('Bearer token MCP status call failed.');
  }

  const verifier3 = randomBytes(32).toString('base64url');
  const started3 = await startOauthPairing(baseUrl, {
    clientId,
    redirectUri,
    verifier: verifier3,
    scope: 'bridge:read',
    state: 'auth-smoke-state-3',
  });
  const { code: readOnlyCode } = await approveAndGetCode(baseUrl, started3.pairingId, started3.pairingCode);
  const readOnlyToken = await postForm(`${baseUrl}/oauth/token`, {
    grant_type: 'authorization_code',
    code: readOnlyCode,
    redirect_uri: redirectUri,
    code_verifier: verifier3,
    resource: 'http://127.0.0.1',
  });
  const insufficient = await mcpCall(mcpUrl, 'create_rem', readOnlyToken.json.access_token);
  if (insufficient.response.status !== 403) {
    throw new Error('Insufficient OAuth scope did not return 403.');
  }

  const revoke = await postForm(`${baseUrl}/oauth/revoke`, {
    token: token.json.access_token,
  });
  if (revoke.response.status !== 200) {
    throw new Error('OAuth revoke failed.');
  }
  const revoked = await mcpCall(mcpUrl, 'get_bridge_status', token.json.access_token);
  if (revoked.response.status !== 401) {
    throw new Error('Revoked token did not return 401.');
  }

  console.log('Auth smoke passed.');
} finally {
  await app.stop();
}
