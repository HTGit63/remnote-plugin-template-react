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

  const redirectUri = 'http://client.example/callback';
  const registration = await postJson(`${baseUrl}/oauth/register`, {
    client_name: 'Auth smoke client',
    redirect_uris: [redirectUri],
  });
  if (registration.response.status !== 201 || !registration.json.client_id) {
    throw new Error('Dynamic client registration failed.');
  }

  const loginRequiredUrl = new URL(`${baseUrl}/oauth/authorize`);
  loginRequiredUrl.searchParams.set('response_type', 'code');
  loginRequiredUrl.searchParams.set('client_id', registration.json.client_id);
  loginRequiredUrl.searchParams.set('redirect_uri', redirectUri);
  loginRequiredUrl.searchParams.set('code_challenge', b64urlSha256('login-required-verifier'));
  loginRequiredUrl.searchParams.set('code_challenge_method', 'S256');
  loginRequiredUrl.searchParams.set('resource', 'http://127.0.0.1');
  loginRequiredUrl.searchParams.set('scope', 'bridge:read');
  const loginRedirect = await fetch(loginRequiredUrl, { redirect: 'manual' });
  const loginLocation = loginRedirect.headers.get('location') ?? '';
  const loginReturnTo = loginLocation ? new URL(loginLocation).searchParams.get('returnTo') : '';
  if (loginRedirect.status !== 302 || !loginReturnTo?.startsWith('/oauth/authorize?')) {
    throw new Error('OAuth authorize did not redirect unauthenticated users to login with returnTo.');
  }
  const loginPath = `${new URL(loginLocation).pathname}${new URL(loginLocation).search}`;
  const loginPage = await fetch(`${baseUrl}${loginPath}`);
  const loginHtml = await loginPage.text();
  const authStartHref = (loginHtml.match(/href="([^"]*\/auth\/start[^"]*)"/)?.[1] ?? '').replace(/&amp;/g, '&');
  const authStartReturnTo = authStartHref ? new URL(authStartHref, baseUrl).searchParams.get('returnTo') : '';
  if (authStartReturnTo !== loginReturnTo) {
    throw new Error('Login page did not preserve OAuth returnTo in auth/start link.');
  }

  const verifier = randomBytes(32).toString('base64url');
  const authorizeUrl = new URL(`${baseUrl}/oauth/authorize`);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('client_id', registration.json.client_id);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('code_challenge', b64urlSha256(verifier));
  authorizeUrl.searchParams.set('code_challenge_method', 'S256');
  authorizeUrl.searchParams.set('resource', 'http://127.0.0.1');
  authorizeUrl.searchParams.set('scope', 'bridge:read bridge:write');
  authorizeUrl.searchParams.set('state', 'auth-smoke-state');
  authorizeUrl.searchParams.set('login_hint', 'local-dev');

  const authorize = await fetch(authorizeUrl, { redirect: 'manual' });
  const location = authorize.headers.get('location');
  if (authorize.status !== 302 || !location) {
    throw new Error('Authorization endpoint did not redirect with code.');
  }
  const code = new URL(location).searchParams.get('code');
  if (!code) {
    throw new Error('Authorization redirect missed code.');
  }

  const token = await postForm(`${baseUrl}/oauth/token`, {
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
    resource: 'http://127.0.0.1',
  });
  if (token.response.status !== 200 || !token.json.access_token || !token.json.refresh_token) {
    throw new Error(`Token endpoint failed: ${token.text}`);
  }

  const authedStatus = await mcpCall(mcpUrl, 'get_bridge_status', token.json.access_token);
  if (authedStatus.response.status !== 200 || !authedStatus.text.includes('"ok":true')) {
    throw new Error('Bearer token MCP call failed.');
  }

  const readOnlyVerifier = randomBytes(32).toString('base64url');
  const readOnlyAuthorizeUrl = new URL(`${baseUrl}/oauth/authorize`);
  readOnlyAuthorizeUrl.searchParams.set('response_type', 'code');
  readOnlyAuthorizeUrl.searchParams.set('client_id', registration.json.client_id);
  readOnlyAuthorizeUrl.searchParams.set('redirect_uri', redirectUri);
  readOnlyAuthorizeUrl.searchParams.set('code_challenge', b64urlSha256(readOnlyVerifier));
  readOnlyAuthorizeUrl.searchParams.set('code_challenge_method', 'S256');
  readOnlyAuthorizeUrl.searchParams.set('resource', 'http://127.0.0.1');
  readOnlyAuthorizeUrl.searchParams.set('scope', 'bridge:read');
  readOnlyAuthorizeUrl.searchParams.set('login_hint', 'local-dev');
  const readOnlyAuthorize = await fetch(readOnlyAuthorizeUrl, { redirect: 'manual' });
  const readOnlyCode = new URL(readOnlyAuthorize.headers.get('location') ?? '').searchParams.get('code') ?? '';
  const readOnlyToken = await postForm(`${baseUrl}/oauth/token`, {
    grant_type: 'authorization_code',
    code: readOnlyCode,
    redirect_uri: redirectUri,
    code_verifier: readOnlyVerifier,
    resource: 'http://127.0.0.1',
  });
  const insufficient = await mcpCall(mcpUrl, 'create_rem', readOnlyToken.json.access_token);
  if (insufficient.response.status !== 403) {
    throw new Error('Insufficient scope did not return 403.');
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
