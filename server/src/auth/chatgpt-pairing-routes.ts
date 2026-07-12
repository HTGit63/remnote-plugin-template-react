import type { IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import {
  LOCAL_PAIRING_DISABLED_MESSAGE,
  isHostedPairingEnabled,
  type CompanionServerConfig,
} from '../config.js';
import { hasValidHeaderSecret, readJsonBody, writeJson, writeText } from '../http.js';
import { hashToken } from '../storage/crypto-utils.js';
import type {
  ChatGptAccessScope,
  ChatGptPairingSession,
  ChatGptTrustedWriteMode,
  StorageProvider,
} from '../storage/types.js';
import { TOOL_REGISTRY_VERSION } from '../tool-registry.js';
import { normalizeToolProfile, TOOL_SCHEMA_VERSION } from '../tool-policy.js';
import {
  generatePairingCode,
  getRememberedPairingCode,
  normalizePairingCode,
  publicPairingLabel,
  randomSecret,
  rememberAuthorizationCode,
  takeRememberedAuthorizationCode,
} from './pairing-utils.js';
import { safeLog } from '../security/redaction.js';

const FAILED_APPROVE_LIMIT = 8;
const FAILED_APPROVE_WINDOW_MS = 10 * 60 * 1000;

const failedApproveAttempts = new Map<string, { count: number; resetAt: number }>();

export interface ChatGptPairingRouteDeps {
  config: CompanionServerConfig;
  storage: StorageProvider;
}

function requestBaseUrl(req: IncomingMessage, config: CompanionServerConfig): string {
  if (config.publicBaseUrl) {
    return config.publicBaseUrl.replace(/\/+$/, '');
  }
  const host = req.headers.host ?? `127.0.0.1:${config.mcpPort}`;
  const proto = config.allowRemote || config.deploymentMode === 'hosted' ? 'https' : 'http';
  return `${proto}://${host}`.replace(/\/+$/, '');
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function writeHtml(res: ServerResponse, statusCode: number, html: string): void {
  res.writeHead(statusCode, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
    'referrer-policy': 'no-referrer',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'content-security-policy': "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'",
  });
  res.end(html);
}

function pageShell(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #1f2933; background: #f6f8fb; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 32px 16px; }
    main { width: min(760px, 100%); background: #fff; border: 1px solid #d9e2ec; border-radius: 8px; box-shadow: 0 18px 50px rgba(16, 24, 40, .10); }
    .header { padding: 28px 32px 18px; border-bottom: 1px solid #e6edf5; }
    h1 { margin: 0 0 8px; font-size: 28px; line-height: 1.15; letter-spacing: 0; }
    p { margin: 0 0 12px; line-height: 1.55; color: #52606d; }
    .content { padding: 24px 32px 32px; display: grid; gap: 18px; }
    .notice { border: 1px solid #bfd7ff; background: #f3f8ff; border-radius: 8px; padding: 14px 16px; color: #243b53; }
    .list { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
    .list li::before { content: "✓ "; color: #147d64; font-weight: 700; }
    .row { display: grid; grid-template-columns: 180px 1fr; gap: 12px; align-items: center; border-top: 1px solid #eef2f7; padding-top: 12px; }
    .label { color: #627d98; font-size: 13px; font-weight: 700; text-transform: uppercase; }
    .value { font-weight: 650; }
    .code { font: 700 32px/1.1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; letter-spacing: .08em; color: #102a43; }
    input { width: 100%; box-sizing: border-box; border: 1px solid #bcccdc; border-radius: 6px; padding: 10px 12px; font: inherit; }
    .status { border-radius: 8px; padding: 14px 16px; background: #f8fafc; border: 1px solid #d9e2ec; font-weight: 650; }
    .muted { color: #627d98; font-size: 14px; }
    @media (max-width: 640px) { main { border-radius: 0; } .header, .content { padding-left: 18px; padding-right: 18px; } .row { grid-template-columns: 1fr; gap: 4px; } .code { font-size: 28px; } }
  </style>
</head>
<body>
${body}
</body>
</html>`;
}

function normalizeAccessScope(value: unknown): ChatGptAccessScope {
  return value === 'current-rem-tree' || value === 'full-kb' ? value : 'focused-rem-only';
}

function normalizeTrustedWriteMode(value: unknown): ChatGptTrustedWriteMode {
  return value === 'trusted-inside-scope' ? value : 'ask-every-write';
}

function normalizeRequestedToolTier(value: unknown, fallback: CompanionServerConfig['toolProfile']): CompanionServerConfig['toolProfile'] {
  return typeof value === 'string' ? normalizeToolProfile(value) : fallback;
}

function clientIp(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress ?? 'unknown';
}

function approveRateLimited(req: IncomingMessage): boolean {
  const key = clientIp(req);
  const now = Date.now();
  const current = failedApproveAttempts.get(key);
  if (!current || current.resetAt <= now) {
    return false;
  }
  return current.count >= FAILED_APPROVE_LIMIT;
}

function recordFailedApprove(req: IncomingMessage): void {
  const key = clientIp(req);
  const now = Date.now();
  const current = failedApproveAttempts.get(key);
  if (!current || current.resetAt <= now) {
    failedApproveAttempts.set(key, { count: 1, resetAt: now + FAILED_APPROVE_WINDOW_MS });
    return;
  }
  current.count += 1;
}

function buildRedirectUrl(session: ChatGptPairingSession, authorizationCode: string): string | null {
  if (!session.redirectUri) {
    return null;
  }
  const redirectUrl = new URL(session.redirectUri);
  redirectUrl.searchParams.set('code', authorizationCode);
  if (session.oauthState) {
    redirectUrl.searchParams.set('state', session.oauthState);
  }
  return redirectUrl.toString();
}

function publicSession(session: ChatGptPairingSession, includeRedirect = false) {
  let redirectUrl: string | null = null;
  if (includeRedirect && (session.status === 'approved' || session.status === 'connected')) {
    const code = takeRememberedAuthorizationCode(session.pairingId);
    redirectUrl = code ? buildRedirectUrl(session, code) : null;
  }

  return {
    pairingId: session.pairingId,
    status: session.status,
    expiresAt: session.expiresAt,
    clientId: session.clientId,
    clientName: session.clientName,
    chatgptDisplayName: session.chatgptDisplayName,
    localConnectionLabel: session.localConnectionLabel,
    connectionLabel: publicPairingLabel(session),
    workspaceLabel: session.workspaceLabel,
    requestedScopes: session.requestedScopes,
    approvedScopes: session.approvedScopes,
    accessScope: session.accessScope,
    trustedWriteMode: session.trustedWriteMode,
    toolTier: session.toolTier,
    toolTierVersion: session.toolTierVersion,
    toolSchemaVersionAtApproval: session.toolSchemaVersionAtApproval,
    requiresConnectorRefresh: false,
    approvedAt: session.approvedAt,
    connectedAt: session.connectedAt,
    disconnectedAt: session.disconnectedAt,
    redirectUrl,
  };
}

async function expireIfNeeded(storage: StorageProvider, session: ChatGptPairingSession): Promise<ChatGptPairingSession> {
  if (session.status === 'pending' && new Date(session.expiresAt) <= new Date()) {
    return storage.updateChatGptPairingSession(session.pairingId, {
      status: 'expired',
      disconnectedAt: new Date().toISOString(),
    });
  }
  return session;
}

export async function handleChatGptPairingRoute(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  deps: ChatGptPairingRouteDeps
): Promise<boolean> {
  const { config, storage } = deps;

  if (!isHostedPairingEnabled(config)) {
    const body = {
      error: 'hosted_pairing_disabled',
      message: LOCAL_PAIRING_DISABLED_MESSAGE,
      deploymentMode: config.deploymentMode,
      hostedPairingEnabled: false,
    };
    if (
      req.method === 'GET' &&
      (url.pathname === '/connect' ||
        url.pathname === '/connected' ||
        url.pathname === '/denied' ||
        url.pathname === '/expired')
    ) {
      writeHtml(
        res,
        403,
        pageShell(
          'ChatGPT pairing disabled',
          `<main><div class="header"><h1>ChatGPT pairing disabled</h1><p>${escapeHtml(LOCAL_PAIRING_DISABLED_MESSAGE)}</p></div></main>`
        )
      );
      return true;
    }
    writeJson(res, 403, body);
    return true;
  }

  if (url.pathname === '/connect' && req.method === 'GET') {
    const pairingId = url.searchParams.get('pairing_id') ?? '';
    const session = pairingId ? await storage.getChatGptPairingSessionById(pairingId) : null;
    if (!session) {
      writeHtml(res, 404, pageShell('Connection not found', `<main><div class="header"><h1>Connection not found</h1><p>Start connection again from ChatGPT.</p></div></main>`));
      return true;
    }
    const current = await expireIfNeeded(storage, session);
    if (current.status === 'expired') {
      writeHtml(res, 410, pageShell('Pairing expired', `<main><div class="header"><h1>Pairing code expired</h1><p>Start connection again from ChatGPT.</p></div></main>`));
      return true;
    }

    const displayCode = getRememberedPairingCode(current.pairingId) ?? 'Restart required';
    const appName = current.clientName || current.chatgptDisplayName || 'ChatGPT session';
    const html = pageShell('Connect RemNote to ChatGPT', `<main>
  <div class="header">
    <h1>Connect RemNote to ChatGPT</h1>
    <p>${escapeHtml(appName)} is requesting access to your active RemNote plugin.</p>
  </div>
  <div class="content">
    <div class="notice">Render cannot access RemNote by itself. Your RemNote plugin must approve this connection.</div>
    <div>
      <p class="label">Requested access</p>
      <ul class="list">
        <li>Read focused Rem</li>
        <li>Read selected Rem tree</li>
        <li>Create Rem from markdown</li>
        <li>Append markdown</li>
        <li>Apply headings, colors, highlights, math, and flashcards</li>
      </ul>
    </div>
    <div class="row"><div class="label">Connection label</div><div class="value">${escapeHtml(publicPairingLabel(current))}</div></div>
    <div class="row"><div class="label">Pairing code</div><div class="code">${escapeHtml(displayCode)}</div></div>
    <div class="row"><div class="label">Next step</div><div>Open RemNote → open ChatGPT Bridge plugin → enter this code → approve request.</div></div>
    <label>
      <span class="label">Local label (display only)</span>
      <input id="local-label" maxlength="80" placeholder="My ChatGPT" autocomplete="off">
    </label>
    <div id="status" class="status">Waiting for RemNote plugin approval...</div>
    <p class="muted">Display labels are not security identity. Token binding + pairing ID + plugin instance ID are.</p>
  </div>
</main>
<script>
const pairingId = ${JSON.stringify(current.pairingId)};
const statusEl = document.getElementById('status');
const labelEl = document.getElementById('local-label');
async function poll() {
  const params = new URLSearchParams({ pairing_id: pairingId });
  if (labelEl && labelEl.value.trim()) params.set('local_label', labelEl.value.trim());
  const res = await fetch('/pairing/status?' + params.toString(), { headers: { accept: 'application/json' } });
  const data = await res.json();
  if (data.status === 'approved' || data.status === 'connected') {
    statusEl.textContent = 'Approved. Returning to ChatGPT...';
    if (data.redirectUrl) window.location.assign(data.redirectUrl);
    else window.location.assign('/connected?pairing_id=' + encodeURIComponent(pairingId));
    return;
  }
  if (data.status === 'denied') { window.location.assign('/denied'); return; }
  if (data.status === 'expired') { window.location.assign('/expired'); return; }
  setTimeout(poll, 1800);
}
poll().catch(() => { statusEl.textContent = 'Connection check failed. Keep this page open and retry from RemNote.'; setTimeout(poll, 2500); });
</script>`);
    writeHtml(res, 200, html);
    return true;
  }

  if (url.pathname === '/connected' && req.method === 'GET') {
    const pairingId = url.searchParams.get('pairing_id') ?? '';
    const session = pairingId ? await storage.getChatGptPairingSessionById(pairingId) : null;
    writeHtml(res, 200, pageShell('RemNote connected', `<main>
      <div class="header"><h1>RemNote is connected to ChatGPT.</h1><p>You can now return to ChatGPT.</p></div>
      <div class="content">
        <div class="row"><div class="label">Workspace</div><div>${escapeHtml(session?.workspaceLabel ?? 'Active RemNote workspace')}</div></div>
        <div class="row"><div class="label">Connection</div><div>${escapeHtml(session ? publicPairingLabel(session) : 'ChatGPT session')}</div></div>
        <div class="row"><div class="label">Access scope</div><div>${escapeHtml(session?.accessScope ?? 'focused-rem-only')}</div></div>
        <div class="row"><div class="label">Write mode</div><div>${escapeHtml(session?.trustedWriteMode ?? 'ask-every-write')}</div></div>
      </div>
    </main>`));
    return true;
  }

  if (url.pathname === '/denied' && req.method === 'GET') {
    writeHtml(res, 200, pageShell('Connection denied', `<main><div class="header"><h1>Connection denied.</h1><p>Return to ChatGPT and try again if needed.</p></div></main>`));
    return true;
  }

  if (url.pathname === '/expired' && req.method === 'GET') {
    writeHtml(res, 410, pageShell('Pairing expired', `<main><div class="header"><h1>Pairing code expired.</h1><p>Start the connection again from ChatGPT.</p></div></main>`));
    return true;
  }

  if (url.pathname === '/pairing/create' && req.method === 'POST') {
    const body = (await readJsonBody(req, config.maxBodyBytes)) as Record<string, unknown> | undefined;
    if (body?.codeChallengeMethod && body.codeChallengeMethod !== 'S256') {
      writeJson(res, 400, { error: 'Only S256 PKCE is supported.' });
      return true;
    }
    const now = new Date();
    const pairingId = randomUUID();
    const pairingCode = generatePairingCode();
    const expiresAt = new Date(now.getTime() + config.pairingCodeTtlSeconds * 1000).toISOString();
    const session: ChatGptPairingSession = {
      pairingId,
      pairingCodeHash: hashToken(pairingCode),
      oauthState: typeof body?.oauthState === 'string' ? body.oauthState : randomSecret(12),
      codeChallenge: typeof body?.codeChallenge === 'string' ? body.codeChallenge : undefined,
      codeChallengeMethod: 'S256',
      clientId: typeof body?.clientId === 'string' ? body.clientId : 'manual-pairing',
      clientName: typeof body?.clientName === 'string' ? body.clientName : 'ChatGPT session',
      chatgptDisplayName: typeof body?.chatgptDisplayName === 'string' ? body.chatgptDisplayName : undefined,
      localConnectionLabel: typeof body?.localConnectionLabel === 'string' ? body.localConnectionLabel : undefined,
      status: 'pending',
      createdAt: now.toISOString(),
      expiresAt,
      requestedScopes: Array.isArray(body?.requestedScopes) ? body.requestedScopes.filter((s): s is string => typeof s === 'string') : ['bridge:read', 'bridge:write'],
      approvedScopes: [],
      accessScope: 'focused-rem-only',
      trustedWriteMode: 'ask-every-write',
      toolTier: normalizeRequestedToolTier(body?.toolTier, config.toolProfile),
      toolTierVersion: TOOL_REGISTRY_VERSION,
      toolSchemaVersionAtApproval: TOOL_SCHEMA_VERSION,
      requiresConnectorRefresh: false,
      redirectUri: typeof body?.redirectUri === 'string' ? body.redirectUri : undefined,
      resource: typeof body?.resource === 'string' ? body.resource : undefined,
      oauthSubject: pairingId,
    };
    await storage.createChatGptPairingSession(session);
    safeLog('pairing_session_created', { pairingId, clientId: session.clientId, status: session.status });
    writeJson(res, 201, { ok: true, pairingId, pairingCode, expiresAt });
    return true;
  }

  if (url.pathname === '/pairing/approve' && req.method === 'POST') {
    if (approveRateLimited(req)) {
      writeJson(res, 429, { error: 'Too many failed pairing attempts. Wait before trying again.' });
      return true;
    }
    const body = (await readJsonBody(req, config.maxBodyBytes)) as Record<string, unknown> | undefined;
    const pairingCode = normalizePairingCode(String(body?.pairingCode ?? ''));
    const session = pairingCode ? await storage.getChatGptPairingSessionByPairingCode(pairingCode) : null;
    if (!session) {
      recordFailedApprove(req);
      writeJson(res, 404, { error: 'Wrong or expired pairing code.' });
      return true;
    }
    const current = await expireIfNeeded(storage, session);
    if (current.status !== 'pending') {
      writeJson(res, 409, { error: `Pairing session is ${current.status}.` });
      return true;
    }

    const pluginInstanceId = String(body?.pluginInstanceId ?? '').trim();
    if (!pluginInstanceId) {
      writeJson(res, 400, { error: 'Missing pluginInstanceId.' });
      return true;
    }

    const now = new Date();
    const authorizationCode = randomSecret(32);
    const authorizationCodeExpiresAt = new Date(now.getTime() + config.authorizationCodeTtlSeconds * 1000).toISOString();
    const sessionSecret = randomSecret(32);
    const pluginConnectionId = String(body?.pluginConnectionId ?? '').trim() || randomUUID();
    const accessScope = normalizeAccessScope(body?.accessScope);
    const trustedWriteMode = normalizeTrustedWriteMode(body?.trustedWriteMode);
    const toolTier = normalizeRequestedToolTier(body?.toolTier, current.toolTier ?? config.toolProfile);
    const updated = await storage.updateChatGptPairingSession(current.pairingId, {
      status: 'approved',
      approvedAt: now.toISOString(),
      pluginInstanceId,
      pluginConnectionId,
      pluginSessionSecretHash: hashToken(sessionSecret),
      workspaceLabel: typeof body?.workspaceLabel === 'string' ? body.workspaceLabel.slice(0, 120) : undefined,
      localConnectionLabel: typeof body?.localConnectionLabel === 'string' && body.localConnectionLabel.trim()
        ? body.localConnectionLabel.trim().slice(0, 80)
        : current.localConnectionLabel,
      approvedScopes: current.requestedScopes,
      accessScope,
      trustedWriteMode,
      toolTier,
      toolTierVersion: TOOL_REGISTRY_VERSION,
      toolTierChangedAt: current.toolTier !== toolTier ? now.toISOString() : current.toolTierChangedAt,
      toolSchemaVersionAtApproval: TOOL_SCHEMA_VERSION,
      requiresConnectorRefresh: false,
      authorizationCodeHash: hashToken(authorizationCode),
      authorizationCodeExpiresAt,
      oauthSubject: current.oauthSubject || current.pairingId,
    });
    rememberAuthorizationCode(updated.pairingId, authorizationCode, authorizationCodeExpiresAt);
    safeLog('plugin_approved_pairing', {
      pairingId: updated.pairingId,
      pluginInstanceId,
      accessScope,
      trustedWriteMode,
    });
    writeJson(res, 200, {
      ok: true,
      pairingId: updated.pairingId,
      pluginInstanceId,
      pluginConnectionId,
      sessionSecret,
      connectionLabel: publicPairingLabel(updated),
      accessScope,
      trustedWriteMode,
      toolTier,
      toolTierVersion: TOOL_REGISTRY_VERSION,
      toolSchemaVersionAtApproval: TOOL_SCHEMA_VERSION,
      requiresConnectorRefresh: false,
      expiresAt: updated.expiresAt,
    });
    return true;
  }

  if (url.pathname === '/pairing/deny' && req.method === 'POST') {
    const body = (await readJsonBody(req, config.maxBodyBytes)) as Record<string, unknown> | undefined;
    const pairingCode = normalizePairingCode(String(body?.pairingCode ?? ''));
    const session = pairingCode ? await storage.getChatGptPairingSessionByPairingCode(pairingCode) : null;
    if (!session) {
      writeJson(res, 404, { error: 'Wrong or expired pairing code.' });
      return true;
    }
    await storage.updateChatGptPairingSession(session.pairingId, {
      status: 'denied',
      disconnectedAt: new Date().toISOString(),
    });
    safeLog('plugin_denied_pairing', { pairingId: session.pairingId });
    writeJson(res, 200, { ok: true, status: 'denied' });
    return true;
  }

  if (url.pathname === '/pairing/status' && req.method === 'GET') {
    const pairingId = url.searchParams.get('pairing_id') ?? '';
    const pairingCode = normalizePairingCode(url.searchParams.get('pairing_code') ?? '');
    let session = pairingId
      ? await storage.getChatGptPairingSessionById(pairingId)
      : pairingCode
        ? await storage.getChatGptPairingSessionByPairingCode(pairingCode)
        : null;
    if (!session) {
      writeJson(res, 404, { error: 'Pairing session not found.' });
      return true;
    }
    const localLabel = url.searchParams.get('local_label')?.trim();
    if (localLabel && localLabel !== session.localConnectionLabel) {
      session = await storage.updateChatGptPairingSession(session.pairingId, {
        localConnectionLabel: localLabel.slice(0, 80),
      });
    }
    session = await expireIfNeeded(storage, session);
    writeJson(res, 200, publicSession(session, Boolean(pairingId)));
    return true;
  }

  if (url.pathname === '/pairing/disconnect' && req.method === 'POST') {
    const body = (await readJsonBody(req, config.maxBodyBytes)) as Record<string, unknown> | undefined;
    const pairingId = String(body?.pairingId ?? '').trim();
    const sessionSecret = String(body?.sessionSecret ?? '').trim();
    if (!sessionSecret) {
      writeJson(res, 401, { error: 'Plugin session secret is required.' });
      return true;
    }
    const session = await storage.getChatGptPairingSessionByPluginSessionSecret(sessionSecret);
    if (!session) {
      writeJson(res, 403, { error: 'Invalid plugin session secret.' });
      return true;
    }
    if (pairingId && pairingId !== session.pairingId) {
      writeJson(res, 403, { error: 'Pairing identity does not match plugin session secret.' });
      return true;
    }
    await storage.updateChatGptPairingSession(session.pairingId, {
      status: 'disconnected',
      disconnectedAt: new Date().toISOString(),
      revokedAt: new Date().toISOString(),
      accessTokenHash: undefined,
      refreshTokenHash: undefined,
    });
    safeLog('pairing_disconnected', { pairingId: session.pairingId });
    writeJson(res, 200, { ok: true, status: 'disconnected' });
    return true;
  }

  if (url.pathname === '/debug/status' && req.method === 'GET') {
    const secretOk =
      (config.deploymentMode === 'local' && config.nodeEnv === 'development') ||
      hasValidHeaderSecret(req, 'x-admin-debug-secret', config.adminDebugSecret);
    if (!secretOk) {
      writeText(res, 404, 'Not Found');
      return true;
    }
    const sessions = await storage.listChatGptPairingSessions(25);
    writeJson(res, 200, {
      ok: true,
      deploymentMode: config.deploymentMode,
      storageMode: config.storageMode,
      pairings: sessions.map((session) => ({
        pairingId: session.pairingId,
        status: session.status,
        clientId: session.clientId,
        clientName: session.clientName,
        connectionLabel: publicPairingLabel(session),
        accessScope: session.accessScope,
        trustedWriteMode: session.trustedWriteMode,
        toolTier: session.toolTier,
        toolTierVersion: session.toolTierVersion,
        toolSchemaVersionAtApproval: session.toolSchemaVersionAtApproval,
        requiresConnectorRefresh: false,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        approvedAt: session.approvedAt,
        connectedAt: session.connectedAt,
        disconnectedAt: session.disconnectedAt,
        workspaceLabel: session.workspaceLabel,
        hasAccessToken: Boolean(session.accessTokenHash),
        hasRefreshToken: Boolean(session.refreshTokenHash),
        hasPluginBinding: Boolean(session.pluginInstanceId && session.pluginSessionSecretHash),
      })),
    });
    return true;
  }

  return false;
}
