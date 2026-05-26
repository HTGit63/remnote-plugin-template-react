import { createHash, randomBytes } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { CompanionServerConfig } from '../config.js';
import { readJsonBody, writeJson, writeText } from '../http.js';
import { hashToken } from '../storage/crypto-utils.js';
import type { StorageProvider, User } from '../storage/types.js';
import { createDashboardSession, generateSessionToken, validateDashboardSession } from './dashboard-session.js';
import type { ScopeGrant } from './types.js';

const DEFAULT_CLIENT_ID = 'remnote-chatgpt-private-client';
const AUTH_CODE_TTL_MS = 5 * 60 * 1000;
const SUPPORTED_SCOPES: ScopeGrant[] = [
  'bridge:read',
  'bridge:write',
  'bridge:trusted_write',
  'bridge:delete',
  'bridge:admin',
  'bridge:pair',
];
const DEFAULT_CHATGPT_SCOPES: ScopeGrant[] = ['bridge:read', 'bridge:write'];

export interface OAuthRouteDeps {
  config: CompanionServerConfig;
  storage: StorageProvider;
}

export function getRequestBaseUrl(req: IncomingMessage, config: CompanionServerConfig): string {
  if (config.publicBaseUrl) {
    return config.publicBaseUrl.replace(/\/+$/, '');
  }
  const host = req.headers.host ?? `127.0.0.1:${config.mcpPort}`;
  const proto = config.allowRemote || config.deploymentMode !== 'local_dev' ? 'https' : 'http';
  return `${proto}://${host}`.replace(/\/+$/, '');
}

export function getExpectedMcpResource(req: IncomingMessage, config: CompanionServerConfig): string {
  return (config.mcpResource || getRequestBaseUrl(req, config)).replace(/\/+$/, '');
}

export function buildOauthChallenge(req: IncomingMessage, config: CompanionServerConfig, scope: string): string {
  const baseUrl = getRequestBaseUrl(req, config);
  return `Bearer resource_metadata="${baseUrl}/.well-known/oauth-protected-resource", scope="${scope}"`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringFrom(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

function parseScopes(scope: string | null | undefined): ScopeGrant[] {
  const requested = (scope ?? '')
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const scopes = requested.length ? requested : DEFAULT_CHATGPT_SCOPES;
  return scopes.filter((scopeName): scopeName is ScopeGrant =>
    (SUPPORTED_SCOPES as readonly string[]).includes(scopeName)
  );
}

function verifyPkceS256(verifier: string, challenge: string): boolean {
  const calculated = createHash('sha256').update(verifier).digest('base64url');
  return calculated === challenge;
}

function redirect(res: ServerResponse, location: string): void {
  res.writeHead(302, {
    location,
    'cache-control': 'no-store',
    'referrer-policy': 'no-referrer',
  });
  res.end();
}

async function readFormBody(req: IncomingMessage, maxBodyBytes: number): Promise<URLSearchParams> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    req.on('data', (chunk: Buffer) => {
      total += chunk.length;
      if (total > maxBodyBytes) {
        reject(new Error('Request body too large.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(new URLSearchParams(Buffer.concat(chunks).toString('utf8'))));
    req.on('error', reject);
  });
}

async function getOrCreateLocalDevUser(storage: StorageProvider): Promise<User> {
  const email = 'local-dev@remnote-companion.local';
  const existing = await storage.getUserByEmail(email);
  return existing ?? storage.createUser(email);
}

async function ensureDefaultClient(storage: StorageProvider, redirectUri: string): Promise<string> {
  const existing = await storage.getMcpClient(DEFAULT_CLIENT_ID);
  if (existing) {
    if (!existing.redirectUris.includes(redirectUri)) {
      await storage.upsertMcpClient({
        ...existing,
        redirectUris: [...existing.redirectUris, redirectUri],
      });
    }
    return existing.clientId;
  }

  await storage.upsertMcpClient({
    clientId: DEFAULT_CLIENT_ID,
    clientName: 'RemNote ChatGPT Bridge private client',
    redirectUris: [redirectUri],
    createdAt: new Date().toISOString(),
  });
  return DEFAULT_CLIENT_ID;
}

export async function handleOAuthRoute(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  deps: OAuthRouteDeps
): Promise<boolean> {
  const { config, storage } = deps;
  const baseUrl = getRequestBaseUrl(req, config);
  const resource = getExpectedMcpResource(req, config);

  if (url.pathname === '/.well-known/oauth-protected-resource' && req.method === 'GET') {
    writeJson(res, 200, {
      resource,
      authorization_servers: [baseUrl],
      scopes_supported: SUPPORTED_SCOPES,
      bearer_methods_supported: ['header'],
      resource_documentation: `${baseUrl}/docs/oauth-setup`,
    });
    return true;
  }

  if (url.pathname === '/.well-known/oauth-authorization-server' && req.method === 'GET') {
    writeJson(res, 200, {
      issuer: config.oauthIssuer || baseUrl,
      authorization_endpoint: `${baseUrl}/oauth/authorize`,
      token_endpoint: `${baseUrl}/oauth/token`,
      revocation_endpoint: `${baseUrl}/oauth/revoke`,
      registration_endpoint: `${baseUrl}/oauth/register`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      code_challenge_methods_supported: ['S256'],
      token_endpoint_auth_methods_supported: ['none'],
      scopes_supported: SUPPORTED_SCOPES,
    });
    return true;
  }

  if (url.pathname === '/oauth/register' && req.method === 'POST') {
    const body = await readJsonBody(req, config.maxBodyBytes);
    if (!isRecord(body)) {
      writeJson(res, 400, { error: 'invalid_client_metadata' });
      return true;
    }

    const redirectUris = Array.isArray(body.redirect_uris)
      ? body.redirect_uris.filter((item): item is string => typeof item === 'string' && item.startsWith('http'))
      : [];
    if (!redirectUris.length) {
      writeJson(res, 400, { error: 'invalid_redirect_uri' });
      return true;
    }

    const clientId = `mcp_${randomToken(18)}`;
    const client = await storage.upsertMcpClient({
      clientId,
      clientName: stringFrom(body.client_name),
      redirectUris,
      createdAt: new Date().toISOString(),
    });

    writeJson(res, 201, {
      client_id: client.clientId,
      client_name: client.clientName,
      redirect_uris: client.redirectUris,
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
    });
    return true;
  }

  if (url.pathname === '/oauth/authorize' && req.method === 'GET') {
    const responseType = url.searchParams.get('response_type');
    const redirectUri = url.searchParams.get('redirect_uri');
    const codeChallenge = url.searchParams.get('code_challenge');
    const codeChallengeMethod = url.searchParams.get('code_challenge_method');
    const state = url.searchParams.get('state');
    const requestedResource = (url.searchParams.get('resource') || resource).replace(/\/+$/, '');
    const scopeGrants = parseScopes(url.searchParams.get('scope'));
    let clientId = url.searchParams.get('client_id');

    if (responseType !== 'code' || !redirectUri || !codeChallenge || codeChallengeMethod !== 'S256') {
      writeJson(res, 400, { error: 'invalid_request' });
      return true;
    }
    if (requestedResource !== resource) {
      writeJson(res, 400, { error: 'invalid_target', error_description: 'Resource/audience mismatch.' });
      return true;
    }

    if (!clientId) {
      clientId = await ensureDefaultClient(storage, redirectUri);
    }
    const client = await storage.getMcpClient(clientId);
    if (!client || !client.redirectUris.includes(redirectUri)) {
      writeJson(res, 400, { error: 'invalid_client', error_description: 'Unknown client or redirect URI.' });
      return true;
    }

    let user = (await validateDashboardSession(req, storage))?.user ?? null;
    if (!user && config.allowNoToken && url.searchParams.get('login_hint') === 'local-dev') {
      user = await getOrCreateLocalDevUser(storage);
    }
    if (!user) {
      const loginUrl = new URL('/login', baseUrl);
      loginUrl.searchParams.set('returnTo', `${url.pathname}${url.search}`);
      redirect(res, loginUrl.toString());
      return true;
    }

    const code = randomToken(32);
    const now = new Date();
    await storage.createMcpAuthorizationCode({
      codeHash: hashToken(code),
      clientId,
      userId: user.id,
      redirectUri,
      codeChallenge,
      codeChallengeMethod: 'S256',
      resource,
      scopeGrants,
      expiresAt: new Date(now.getTime() + AUTH_CODE_TTL_MS).toISOString(),
      createdAt: now.toISOString(),
    });

    const redirectTarget = new URL(redirectUri);
    redirectTarget.searchParams.set('code', code);
    if (state) {
      redirectTarget.searchParams.set('state', state);
    }
    redirect(res, redirectTarget.toString());
    return true;
  }

  if (url.pathname === '/oauth/token' && req.method === 'POST') {
    const form = await readFormBody(req, config.maxBodyBytes);
    const grantType = form.get('grant_type');

    if (grantType === 'authorization_code') {
      const code = form.get('code') ?? '';
      const verifier = form.get('code_verifier') ?? '';
      const redirectUri = form.get('redirect_uri') ?? '';
      const requestedResource = (form.get('resource') || resource).replace(/\/+$/, '');
      const codeRecord = await storage.consumeMcpAuthorizationCode(code);

      if (
        !codeRecord ||
        codeRecord.redirectUri !== redirectUri ||
        codeRecord.resource !== requestedResource ||
        new Date(codeRecord.expiresAt) < new Date() ||
        !verifyPkceS256(verifier, codeRecord.codeChallenge)
      ) {
        writeJson(res, 400, { error: 'invalid_grant' });
        return true;
      }

      const accessToken = generateSessionToken();
      const refreshToken = generateSessionToken();
      const now = new Date();
      await storage.createSession({
        userId: codeRecord.userId,
        accessTokenHash: hashToken(accessToken),
        accessTokenExpiresAt: new Date(now.getTime() + config.oauthAccessTokenTtlSeconds * 1000).toISOString(),
        refreshTokenHash: hashToken(refreshToken),
        refreshTokenExpiresAt: new Date(now.getTime() + config.oauthRefreshTokenTtlSeconds * 1000).toISOString(),
        tokenUse: 'mcp_access',
        clientId: codeRecord.clientId,
        issuer: config.oauthIssuer || baseUrl,
        audience: codeRecord.resource,
        scopeGrants: codeRecord.scopeGrants,
      });

      writeJson(res, 200, {
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        expires_in: config.oauthAccessTokenTtlSeconds,
        scope: codeRecord.scopeGrants.join(' '),
        resource: codeRecord.resource,
      });
      return true;
    }

    if (grantType === 'refresh_token') {
      const refreshToken = form.get('refresh_token') ?? '';
      const session = await storage.getSessionByRefreshToken(refreshToken);
      if (!session || session.tokenUse !== 'mcp_access' || new Date(session.refreshTokenExpiresAt) < new Date()) {
        writeJson(res, 400, { error: 'invalid_grant' });
        return true;
      }

      const accessToken = generateSessionToken();
      const rotatedRefreshToken = generateSessionToken();
      const now = new Date();
      const updated = await storage.updateSession(session.id, {
        accessTokenHash: hashToken(accessToken),
        accessTokenExpiresAt: new Date(now.getTime() + config.oauthAccessTokenTtlSeconds * 1000).toISOString(),
        refreshTokenHash: hashToken(rotatedRefreshToken),
        refreshTokenExpiresAt: new Date(now.getTime() + config.oauthRefreshTokenTtlSeconds * 1000).toISOString(),
      });

      writeJson(res, 200, {
        access_token: accessToken,
        refresh_token: rotatedRefreshToken,
        token_type: 'Bearer',
        expires_in: config.oauthAccessTokenTtlSeconds,
        scope: updated.scopeGrants?.join(' ') ?? '',
        resource: updated.audience,
      });
      return true;
    }

    writeJson(res, 400, { error: 'unsupported_grant_type' });
    return true;
  }

  if (url.pathname === '/oauth/revoke' && req.method === 'POST') {
    const form = await readFormBody(req, config.maxBodyBytes);
    const token = form.get('token') ?? '';
    const session = token
      ? (await storage.getSessionByAccessToken(token)) ?? (await storage.getSessionByRefreshToken(token))
      : null;
    if (session) {
      await storage.updateSession(session.id, { revokedAt: new Date().toISOString() });
    }
    writeText(res, 200, '');
    return true;
  }

  return false;
}

export async function createLocalDashboardSessionForTests(
  storage: StorageProvider,
  config: CompanionServerConfig,
  res: ServerResponse
): Promise<User> {
  const user = await getOrCreateLocalDevUser(storage);
  await createDashboardSession(user, storage, config, res);
  return user;
}
