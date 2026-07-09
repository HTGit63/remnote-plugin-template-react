import { startCompanionApp } from './app.js';

let nextId = 1;

const publicBaseUrl = 'https://remnote-plugin-template-react.onrender.com';
const codexToken = 'codex-smoke-token-with-enough-entropy';

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

async function mcpRequest(
  url: string,
  method: string,
  params: Record<string, unknown>,
  bearerToken?: string
) {
  return postJson(
    url,
    {
      jsonrpc: '2.0',
      id: nextId++,
      method,
      params,
    },
    {
      accept: 'application/json, text/event-stream',
      ...(bearerToken ? { authorization: `Bearer ${bearerToken}` } : {}),
    }
  );
}

async function mcpToolCall(url: string, name: string, args: Record<string, unknown>, bearerToken?: string) {
  return mcpRequest(url, 'tools/call', { name, arguments: args }, bearerToken);
}

function assertNoSecret(label: string, text: string) {
  if (text.includes(codexToken)) {
    throw new Error(`${label} leaked REMNOTE_CODEX_TOKEN.`);
  }
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
  connectorCompatNoAuthTools: true,
  allowRemote: true,
  allowCors: true,
  allowedOrigins: ['https://www.remnote.com', 'https://chatgpt.com', 'https://chat.openai.com', publicBaseUrl],
  sessionSecret: 'codex-bearer-smoke-session-secret',
  adminDebugSecret: 'codex-bearer-smoke-admin-secret',
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

try {
  const health = await fetch(`${baseUrl}/health`);
  const healthText = await health.text();
  assertNoSecret('/health', healthText);
  if (
    health.status !== 200 ||
    !healthText.includes('"codexBearerAuthAvailable":true') ||
    !healthText.includes('"codexBearerAuthConfigured":true') ||
    !healthText.includes('"hosted_pairing"') ||
    !healthText.includes('"codex_bearer"') ||
    healthText.includes('"connector_compat_no_auth_tools"')
  ) {
    throw new Error(`/health missed Codex auth diagnostics: ${health.status} ${healthText}`);
  }

  const mcpGet = await fetch(mcpUrl, { headers: { accept: 'application/json' } });
  const mcpGetText = await mcpGet.text();
  assertNoSecret('GET /mcp', mcpGetText);
  if (
    mcpGet.status !== 200 ||
    !mcpGetText.includes('"discoveryAuth":"no_auth_required"') ||
    !mcpGetText.includes('"codexBearerAuthAvailable":true') ||
    !mcpGetText.includes('"codex_bearer"') ||
    mcpGetText.includes('"connector_compat_no_auth_tools"')
  ) {
    throw new Error(`GET /mcp missed Codex/discovery diagnostics: ${mcpGet.status} ${mcpGetText}`);
  }

  const adminDiagnostics = await fetch(`${baseUrl}/diagnostics`, {
    headers: { 'x-admin-debug-secret': 'codex-bearer-smoke-admin-secret' },
  });
  const adminDiagnosticsText = await adminDiagnostics.text();
  assertNoSecret('/diagnostics', adminDiagnosticsText);
  if (adminDiagnostics.status !== 200 || !adminDiagnosticsText.includes('"codexBearerAuthConfigured":true')) {
    throw new Error(`/diagnostics missed Codex facts: ${adminDiagnostics.status} ${adminDiagnosticsText.slice(0, 500)}`);
  }

  const connectMissing = await fetch(`${baseUrl}/connect?pairing_id=missing-pairing`);
  const connectMissingText = await connectMissing.text();
  if (connectMissing.status !== 404 || !connectMissingText.includes('Connection not found')) {
    throw new Error(`/connect pairing route was not preserved: ${connectMissing.status} ${connectMissingText.slice(0, 200)}`);
  }

  const codexDcr = await postJson(`${baseUrl}/oauth/register`, {
    client_name: 'Codex loopback client',
    redirect_uris: [
      'http://127.0.0.1:49152/codex/callback',
      'http://localhost:49153/codex/callback',
    ],
  });
  if (
    codexDcr.response.status !== 201 ||
    !Array.isArray(codexDcr.json?.redirect_uris) ||
    !codexDcr.json.redirect_uris.includes('http://127.0.0.1:49152/codex/callback') ||
    !codexDcr.json.redirect_uris.includes('http://localhost:49153/codex/callback')
  ) {
    throw new Error(`Codex loopback DCR failed: ${codexDcr.response.status} ${codexDcr.text}`);
  }

  const chatGptDcr = await postJson(`${baseUrl}/oauth/register`, {
    client_name: 'ChatGPT client',
    redirect_uris: ['https://chat.openai.com/aip/mock/remnote/callback'],
  });
  if (chatGptDcr.response.status !== 201) {
    throw new Error(`ChatGPT HTTPS DCR regressed: ${chatGptDcr.response.status} ${chatGptDcr.text}`);
  }

  for (const redirectUri of [
    'https://evil.example.test/callback',
    'http://192.168.1.20:49152/callback',
    'javascript:alert(1)',
    'file:///tmp/callback',
    'data:text/plain,callback',
    'chrome-extension://extension-id/callback',
  ]) {
    const invalid = await postJson(`${baseUrl}/oauth/register`, {
      client_name: 'Invalid client',
      redirect_uris: [redirectUri],
    });
    if (invalid.response.status !== 400 || !invalid.text.includes('invalid_redirect_uri')) {
      throw new Error(`Unsafe redirect URI was accepted: ${redirectUri} -> ${invalid.response.status} ${invalid.text}`);
    }
  }

  const discovery = await mcpRequest(mcpUrl, 'tools/list', {});
  if (
    discovery.response.status !== 200 ||
    !discovery.text.includes('get_bridge_status') ||
    discovery.text.includes('delete_rem_by_id') ||
    discovery.text.includes('Missing bearer token')
  ) {
    throw new Error(`Discovery failed or exposed danger tools: ${discovery.response.status} ${discovery.text}`);
  }

  const missing = await mcpToolCall(mcpUrl, 'get_bridge_status', {});
  if (missing.response.status !== 401 || !missing.text.includes('Missing bearer token')) {
    throw new Error(`Missing Codex bearer should be rejected: ${missing.response.status} ${missing.text}`);
  }

  const invalid = await mcpToolCall(mcpUrl, 'get_bridge_status', {}, 'wrong-codex-token');
  if (invalid.response.status !== 401 || !invalid.text.includes('Invalid bearer token')) {
    throw new Error(`Invalid Codex bearer should be rejected: ${invalid.response.status} ${invalid.text}`);
  }

  const valid = await mcpToolCall(mcpUrl, 'get_focused_rem', {}, codexToken);
  assertNoSecret('valid Codex tool call', valid.text);
  if (
    valid.response.status !== 200 ||
    !valid.text.includes('PLUGIN_NOT_CONNECTED') ||
    valid.text.includes('Missing bearer token')
  ) {
    throw new Error(`Valid Codex bearer did not reach MCP/plugin routing layer: ${valid.response.status} ${valid.text}`);
  }

  const untrustedWrite = await mcpToolCall(mcpUrl, 'create_or_replace_note_from_markdown', {
    parentRemId: 'codex-parent',
    markdownText: '# Codex write without trusted scope',
    mode: 'create_child',
    safetyOptions: { dryRun: false },
  }, codexToken);
  assertNoSecret('Codex untrusted write block', untrustedWrite.text);
  if (
    untrustedWrite.response.status !== 403 ||
    !untrustedWrite.text.includes('TRUSTED_WRITE_REQUIRED') ||
    untrustedWrite.text.includes('PLUGIN_NOT_CONNECTED')
  ) {
    throw new Error(`Codex write bypassed trusted-write scope: ${untrustedWrite.response.status} ${untrustedWrite.text}`);
  }

  console.log('Codex bearer hosted smoke passed.');
} finally {
  await app.stop();
}
