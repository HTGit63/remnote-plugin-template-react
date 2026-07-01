import type { IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { codexClientHashForRequest } from './codex-token.js';
import { generatePairingCode, normalizePairingCode } from './pairing-utils.js';
import type { CompanionServerConfig } from '../config.js';
import { readJsonBody, writeJson } from '../http.js';
import { hashToken } from '../storage/crypto-utils.js';
import type { ChatGptPairingSession, CodexPairingSession, StorageProvider } from '../storage/types.js';
import { safeLog } from '../security/redaction.js';

export interface CodexPairingRouteDeps {
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
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #17202a; background: #f6f8fb; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 32px 16px; }
    main { width: min(720px, 100%); background: #fff; border: 1px solid #d9e2ec; border-radius: 8px; box-shadow: 0 18px 50px rgba(16, 24, 40, .10); }
    .header { padding: 28px 32px 18px; border-bottom: 1px solid #e6edf5; }
    h1 { margin: 0 0 8px; font-size: 28px; line-height: 1.15; letter-spacing: 0; }
    p { margin: 0 0 12px; line-height: 1.55; color: #52606d; }
    .content { padding: 24px 32px 32px; display: grid; gap: 18px; }
    .notice { border: 1px solid #bfd7ff; background: #f3f8ff; border-radius: 8px; padding: 14px 16px; color: #243b53; }
    .row { display: grid; grid-template-columns: 180px 1fr; gap: 12px; align-items: center; border-top: 1px solid #eef2f7; padding-top: 12px; }
    .label { color: #627d98; font-size: 13px; font-weight: 700; text-transform: uppercase; }
    .code { font: 700 32px/1.1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; letter-spacing: .08em; color: #102a43; }
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

function browserUrlForCode(baseUrl: string, userCode: string): string {
  const url = new URL('/codex/connect', baseUrl);
  url.searchParams.set('code', userCode);
  return url.toString();
}

function publicCodexPairing(session: CodexPairingSession, options: { baseUrl: string; userCode?: string }) {
  return {
    ok: true,
    pairingId: session.pairingId,
    status: session.status,
    expiresAt: session.expiresAt,
    approvedAt: session.approvedAt,
    linked: session.status === 'approved' && Boolean(session.linkedPairingId && !session.revokedAt),
    linkedPairingId: session.linkedPairingId,
    linkedPluginInstanceId: session.linkedPluginInstanceId,
    linkedPluginConnectionId: session.linkedPluginConnectionId,
    linkedUserIdHash: session.linkedUserId ? hashToken(session.linkedUserId).slice(0, 16) : undefined,
    browserUrl: options.userCode ? browserUrlForCode(options.baseUrl, options.userCode) : undefined,
    userCode: options.userCode,
    instructions: options.userCode
      ? 'Open the browser URL, then approve this Codex code from the connected RemNote plugin.'
      : 'Approve this Codex pairing from the connected RemNote plugin, then retry the Codex tool call.',
  };
}

export async function expireCodexPairingIfNeeded(
  storage: StorageProvider,
  session: CodexPairingSession
): Promise<CodexPairingSession> {
  if (session.status === 'pending' && new Date(session.expiresAt) <= new Date()) {
    return storage.updateCodexPairingSession(session.pairingId, {
      status: 'expired',
      lastSeenAt: new Date().toISOString(),
    });
  }
  return session;
}

export async function startCodexPairingSession(input: {
  config: CompanionServerConfig;
  storage: StorageProvider;
  codexClientHash: string;
  baseUrl: string;
}): Promise<{ session: CodexPairingSession; userCode: string; browserUrl: string }> {
  const now = new Date();
  const pairingId = randomUUID();
  const userCode = generatePairingCode();
  const expiresAt = new Date(now.getTime() + input.config.pairingCodeTtlSeconds * 1000).toISOString();
  const session: CodexPairingSession = {
    pairingId,
    userCodeHash: hashToken(userCode),
    codexClientHash: input.codexClientHash,
    status: 'pending',
    createdAt: now.toISOString(),
    expiresAt,
    lastSeenAt: now.toISOString(),
  };
  const stored = await input.storage.createCodexPairingSession(session);
  safeLog('codex_pairing_session_created', { pairingId, status: stored.status });
  return {
    session: stored,
    userCode,
    browserUrl: browserUrlForCode(input.baseUrl, userCode),
  };
}

function pluginSessionSecret(req: IncomingMessage, body: Record<string, unknown> | undefined): string {
  const header = req.headers['x-remnote-plugin-session-secret'];
  if (typeof header === 'string' && header.trim()) {
    return header.trim();
  }
  return typeof body?.sessionSecret === 'string' ? body.sessionSecret.trim() : '';
}

async function pairingFromBodyOrUrl(
  storage: StorageProvider,
  body: Record<string, unknown> | undefined,
  url: URL
): Promise<CodexPairingSession | null> {
  const pairingId =
    (typeof body?.pairingId === 'string' ? body.pairingId : undefined) ??
    url.searchParams.get('pairingId') ??
    url.searchParams.get('pairing_id') ??
    '';
  if (pairingId.trim()) {
    return storage.getCodexPairingSessionById(pairingId.trim());
  }
  const rawCode =
    (typeof body?.userCode === 'string' ? body.userCode : undefined) ??
    url.searchParams.get('code') ??
    url.searchParams.get('userCode') ??
    '';
  const userCode = normalizePairingCode(rawCode);
  return userCode ? storage.getCodexPairingSessionByUserCode(userCode) : null;
}

async function approvedPluginSession(
  storage: StorageProvider,
  secret: string
): Promise<ChatGptPairingSession | null> {
  if (!secret) {
    return null;
  }
  const session = await storage.getChatGptPairingSessionByPluginSessionSecret(secret);
  if (
    !session ||
    session.revokedAt ||
    (session.status !== 'approved' && session.status !== 'connected')
  ) {
    return null;
  }
  return session;
}

export async function handleCodexPairingRoute(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  deps: CodexPairingRouteDeps
): Promise<boolean> {
  const { config, storage } = deps;
  if (!url.pathname.startsWith('/codex/')) {
    return false;
  }

  if (config.deploymentMode !== 'hosted' || !config.codexToken) {
    writeJson(res, 403, {
      error: 'codex_pairing_disabled',
      deploymentMode: config.deploymentMode,
      codexBearerAuthConfigured: Boolean(config.codexToken),
    });
    return true;
  }

  const baseUrl = requestBaseUrl(req, config);

  if (url.pathname === '/codex/pair/start' && req.method === 'POST') {
    const codexClientHash = codexClientHashForRequest(req, config);
    if (!codexClientHash) {
      writeJson(res, 401, { error: 'Missing or invalid Codex bearer token.' });
      return true;
    }
    const started = await startCodexPairingSession({ config, storage, codexClientHash, baseUrl });
    writeJson(res, 201, publicCodexPairing(started.session, { baseUrl, userCode: started.userCode }));
    return true;
  }

  if (url.pathname === '/codex/pair/status' && req.method === 'GET') {
    const session = await pairingFromBodyOrUrl(storage, undefined, url);
    if (!session) {
      writeJson(res, 404, { error: 'Codex pairing session not found.' });
      return true;
    }
    const code = normalizePairingCode(url.searchParams.get('code') ?? '');
    const codexClientHash = codexClientHashForRequest(req, config);
    if (!code && codexClientHash !== session.codexClientHash) {
      writeJson(res, 401, { error: 'Codex pairing status requires a valid Codex bearer token or the user code.' });
      return true;
    }
    const current = await expireCodexPairingIfNeeded(storage, session);
    writeJson(res, 200, publicCodexPairing(current, { baseUrl }));
    return true;
  }

  if ((url.pathname === '/codex/connect' || url.pathname.startsWith('/codex/pair/')) && req.method === 'GET') {
    const pairingIdFromPath = url.pathname.startsWith('/codex/pair/')
      ? decodeURIComponent(url.pathname.slice('/codex/pair/'.length))
      : '';
    const userCode = normalizePairingCode(url.searchParams.get('code') ?? '');
    const session = pairingIdFromPath
      ? await storage.getCodexPairingSessionById(pairingIdFromPath)
      : userCode
        ? await storage.getCodexPairingSessionByUserCode(userCode)
        : null;
    if (!session) {
      writeHtml(res, 404, pageShell('Codex pairing not found', `<main><div class="header"><h1>Codex pairing not found</h1><p>Start Codex pairing again from the MCP response.</p></div></main>`));
      return true;
    }
    const current = await expireCodexPairingIfNeeded(storage, session);
    const displayCode = userCode || 'Open RemNote plugin';
    writeHtml(res, current.status === 'expired' ? 410 : 200, pageShell('Connect Codex to RemNote', `<main>
  <div class="header">
    <h1>Connect Codex to RemNote</h1>
    <p>Codex is authenticated to the MCP server. RemNote plugin approval is still required before tool calls can use your workspace.</p>
  </div>
  <div class="content">
    <div class="notice">Same IP or browser is never used as authorization. Approve only from the RemNote plugin session you trust.</div>
    <div class="row"><div class="label">Codex code</div><div class="code">${escapeHtml(displayCode)}</div></div>
    <div class="row"><div class="label">Status</div><div id="status" class="status">${escapeHtml(current.status)}</div></div>
    <div class="row"><div class="label">Next step</div><div>Open RemNote -> ChatGPT Bridge plugin -> approve this Codex code.</div></div>
    <p class="muted">This page exposes no token or plugin session secret.</p>
  </div>
</main>
<script>
const pairingId = ${JSON.stringify(current.pairingId)};
const code = ${JSON.stringify(userCode)};
const statusEl = document.getElementById('status');
async function poll() {
  const params = new URLSearchParams();
  if (code) params.set('code', code); else params.set('pairingId', pairingId);
  const res = await fetch('/codex/pair/status?' + params.toString(), { headers: { accept: 'application/json' } });
  const data = await res.json();
  statusEl.textContent = data.status || 'unknown';
  if (data.status === 'approved' || data.status === 'revoked' || data.status === 'expired') return;
  setTimeout(poll, 1800);
}
poll().catch(() => { statusEl.textContent = 'status check failed'; setTimeout(poll, 2500); });
</script>`));
    return true;
  }

  if (url.pathname === '/codex/pair/approve' && req.method === 'POST') {
    const body = (await readJsonBody(req, config.maxBodyBytes)) as Record<string, unknown> | undefined;
    const pluginSession = await approvedPluginSession(storage, pluginSessionSecret(req, body));
    if (!pluginSession) {
      writeJson(res, 401, { error: 'Codex approval requires a valid RemNote plugin session secret.' });
      return true;
    }
    const session = await pairingFromBodyOrUrl(storage, body, url);
    if (!session) {
      writeJson(res, 404, { error: 'Codex pairing session not found.' });
      return true;
    }
    const current = await expireCodexPairingIfNeeded(storage, session);
    if (current.status !== 'pending') {
      writeJson(res, 409, { error: `Codex pairing session is ${current.status}.`, status: current.status });
      return true;
    }

    const now = new Date().toISOString();
    const linkedUserId = pluginSession.oauthSubject || pluginSession.pairingId;
    const updated = await storage.updateCodexPairingSession(current.pairingId, {
      status: 'approved',
      approvedAt: now,
      linkedPairingId: pluginSession.pairingId,
      linkedPluginInstanceId: pluginSession.pluginInstanceId,
      linkedPluginConnectionId: pluginSession.pluginConnectionId,
      linkedUserId,
      lastSeenAt: now,
    });
    await storage.upsertCodexClientLink({
      codexClientHash: current.codexClientHash,
      linkedPairingId: pluginSession.pairingId,
      linkedUserId,
      linkedPluginInstanceId: pluginSession.pluginInstanceId,
      linkedPluginConnectionId: pluginSession.pluginConnectionId,
      createdAt: now,
      updatedAt: now,
    });
    safeLog('codex_pairing_approved', {
      pairingId: updated.pairingId,
      linkedPairingId: pluginSession.pairingId,
    });
    writeJson(res, 200, publicCodexPairing(updated, { baseUrl }));
    return true;
  }

  return false;
}
