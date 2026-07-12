/**
 * Dashboard authentication route handlers — Phase 4.
 *
 * Implements:
 *  GET  /login         — Renders login page
 *  GET  /auth/start    — Initiates OAuth/OIDC (or local emulator)
 *  GET  /auth/callback — Handles OAuth callback, creates user/session, sets cookies
 *  POST /logout        — Revokes session, clears cookies
 *  GET  /dashboard     — Authenticated dashboard
 *  GET  /pair/panel    — Authenticated pairing UI panel
 */

import { randomUUID, randomBytes } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { CompanionServerConfig } from '../config.js';
import type { StorageProvider } from '../storage/types.js';
import { writeJson } from '../http.js';
import {
  createDashboardSession,
  validateDashboardSession,
  revokeDashboardSession,
  validateCsrfToken,
  setCsrfCookie,
  type DashboardSessionContext,
} from './dashboard-session.js';
import {
  renderLoginPage,
  renderAuthenticatedDashboard,
  renderPairingPanel,
} from '../dashboard/auth-pages.js';
import { getToolRegistrySummary } from '../tool-registry.js';
import type { BridgeHub } from '../bridge-hub.js';

// ─── Ephemeral OAuth state store (in-memory for simplicity) ──────────
const pendingOAuthStates = new Map<string, { expiresAt: number; returnUrl: string }>();

function cleanExpiredStates(): void {
  const now = Date.now();
  for (const [key, val] of pendingOAuthStates) {
    if (val.expiresAt < now) pendingOAuthStates.delete(key);
  }
}

// ─── Secure HTML response helper ─────────────────────────────────────
function writeHtml(res: ServerResponse, statusCode: number, html: string): void {
  res.writeHead(statusCode, {
    'content-type': 'text/html; charset=utf-8',
    'content-security-policy':
      "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src https://fonts.gstatic.com; img-src 'self' data:; script-src 'self' 'unsafe-inline'",
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
    'cache-control': 'no-store',
    'x-frame-options': 'DENY',
  });
  res.end(html);
}

function redirect(res: ServerResponse, location: string, statusCode = 302): void {
  res.writeHead(statusCode, { Location: location });
  res.end();
}

function safeReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.length > 2048) {
    return '/dashboard';
  }
  return value;
}

// ─── Route Handlers ──────────────────────────────────────────────────

export interface DashboardRouterDeps {
  config: CompanionServerConfig;
  storage: StorageProvider;
  hub: BridgeHub;
}

/**
 * Attempts to handle a dashboard/auth route. Returns true if handled.
 */
export async function handleDashboardRoute(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  deps: DashboardRouterDeps
): Promise<boolean> {
  const { config, storage, hub } = deps;

  // ──── GET /login ───────────────────────────────────────────────────
  if (url.pathname === '/login' && req.method === 'GET') {
    const html = renderLoginPage(config, safeReturnTo(url.searchParams.get('returnTo')));
    writeHtml(res, 200, html);
    return true;
  }

  // ──── GET /auth/start ──────────────────────────────────────────────
  if (url.pathname === '/auth/start' && req.method === 'GET') {
    if (config.deploymentMode === 'hosted' && url.searchParams.get('provider') === 'local') {
      writeJson(res, 400, { error: 'Local dashboard authentication is unavailable in hosted mode.' });
      return true;
    }
    cleanExpiredStates();
    const state = randomBytes(24).toString('hex');
    pendingOAuthStates.set(state, {
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 min
      returnUrl: safeReturnTo(url.searchParams.get('returnTo')),
    });

    const isLocal = config.deploymentMode === 'local';

    if (isLocal) {
      // Local emulator: skip real OAuth, redirect directly to callback with a fake code
      const fakeCode = randomBytes(16).toString('hex');
      redirect(res, `/auth/callback?code=${fakeCode}&state=${state}&provider=local`);
      return true;
    }

    // Production: redirect to real OAuth/OIDC provider
    if (!config.oauthClientId || !config.oauthAuthUrl) {
      writeJson(res, 500, {
        error: 'OAuth provider is not configured. Set REMNOTE_BRIDGE_OAUTH_CLIENT_ID and REMNOTE_BRIDGE_OAUTH_AUTH_URL.',
      });
      return true;
    }

    const authUrl = new URL(config.oauthAuthUrl);
    authUrl.searchParams.set('client_id', config.oauthClientId);
    authUrl.searchParams.set('redirect_uri', `${config.publicBaseUrl}/auth/callback`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('state', state);
    redirect(res, authUrl.toString());
    return true;
  }

  // ──── GET /auth/callback ───────────────────────────────────────────
  if (url.pathname === '/auth/callback' && req.method === 'GET') {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const provider = url.searchParams.get('provider');

    if (config.deploymentMode === 'hosted' && provider === 'local') {
      writeJson(res, 400, { error: 'Local dashboard authentication is unavailable in hosted mode.' });
      return true;
    }

    if (!state || !pendingOAuthStates.has(state)) {
      writeJson(res, 400, { error: 'Invalid or expired OAuth state parameter.' });
      return true;
    }

    const stateData = pendingOAuthStates.get(state)!;
    pendingOAuthStates.delete(state);

    if (stateData.expiresAt < Date.now()) {
      writeJson(res, 400, { error: 'OAuth state expired. Please try again.' });
      return true;
    }

    if (!code) {
      writeJson(res, 400, { error: 'Missing authorization code.' });
      return true;
    }

    let userEmail: string;

    if (config.deploymentMode === 'local') {
      // Local emulator: generate a deterministic local user
      userEmail = 'local-dev@remnote-companion.local';
    } else {
      // Production: exchange code for token and get user info
      // This is where real OIDC token exchange would happen
      try {
        const tokenResponse = await exchangeOAuthCode(code, config);
        userEmail = tokenResponse.email;
      } catch (err: any) {
        writeJson(res, 500, { error: `OAuth token exchange failed: ${err.message}` });
        return true;
      }
    }

    // Find or create user
    let user = await storage.getUserByEmail(userEmail);
    if (!user) {
      user = await storage.createUser(userEmail);
    }

    // Create dashboard session (sets cookies)
    await createDashboardSession(user, storage, config, res);

    redirect(res, stateData.returnUrl);
    return true;
  }

  // ──── POST /logout ─────────────────────────────────────────────────
  if (url.pathname === '/logout' && req.method === 'POST') {
    // Validate CSRF for mutation
    const csrfResult = validateCsrfToken(req);
    if (!csrfResult.valid) {
      writeJson(res, 403, { error: csrfResult.reason || 'CSRF validation failed.' });
      return true;
    }

    await revokeDashboardSession(req, storage, res);
    writeJson(res, 200, { ok: true, message: 'Logged out successfully.' });
    return true;
  }

  // ──── GET /dashboard ───────────────────────────────────────────────
  if (url.pathname === '/dashboard' && req.method === 'GET') {
    const session = await validateDashboardSession(req, storage);
    if (!session) {
      redirect(res, '/login');
      return true;
    }

    const registry = getToolRegistrySummary(config.enableDeleteTool, config.toolProfile);
    const csrf = setCsrfCookie(res, config);

    const html = renderAuthenticatedDashboard({
      config,
      userEmail: session.user.email,
      userId: session.user.id,
      bridgeConnected: hub.getStatus().connected,
      publicToolCount: registry.publicToolCount,
      toolRegistryVersion: registry.toolRegistryVersion,
      uptimeSeconds: process.uptime(),
      csrfToken: csrf,
    });
    writeHtml(res, 200, html);
    return true;
  }

  // ──── GET /pair/panel ──────────────────────────────────────────────
  if (url.pathname === '/pair/panel' && req.method === 'GET') {
    const session = await validateDashboardSession(req, storage);
    if (!session) {
      redirect(res, '/login');
      return true;
    }

    const csrf = setCsrfCookie(res, config);
    const html = renderPairingPanel(csrf, session.user.email);
    writeHtml(res, 200, html);
    return true;
  }

  return false;
}

// ─── OAuth Code Exchange ─────────────────────────────────────────────
interface OAuthTokenResult {
  email: string;
  sub: string;
  accessToken: string;
}

async function exchangeOAuthCode(
  code: string,
  config: CompanionServerConfig
): Promise<OAuthTokenResult> {
  if (!config.oauthTokenUrl || !config.oauthClientSecret || !config.oauthUserinfoUrl) {
    throw new Error('OAuth token endpoint, client secret, or userinfo endpoint is not configured.');
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: config.oauthClientId,
    client_secret: config.oauthClientSecret,
    redirect_uri: `${config.publicBaseUrl}/auth/callback`,
  });

  const tokenRes = await fetch(config.oauthTokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!tokenRes.ok) {
    throw new Error(`Token endpoint returned ${tokenRes.status}`);
  }

  const tokenData = (await tokenRes.json()) as {
    access_token: string;
    token_type?: string;
  };

  if (!tokenData.access_token) {
    throw new Error('OAuth token response did not include an access token.');
  }

  const userinfoRes = await fetch(config.oauthUserinfoUrl, {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: 'application/json',
    },
  });

  if (!userinfoRes.ok) {
    throw new Error(`OAuth userinfo endpoint returned ${userinfoRes.status}`);
  }

  const userinfo = (await userinfoRes.json()) as {
    email?: string;
    email_verified?: boolean;
    sub?: string;
  };
  const email = typeof userinfo.email === 'string' ? userinfo.email.trim().toLowerCase() : '';

  if (!email || !email.includes('@')) {
    throw new Error('OAuth userinfo response did not include a valid email.');
  }
  if (userinfo.email_verified === false) {
    throw new Error('OAuth userinfo email is not verified.');
  }

  return {
    email,
    sub: typeof userinfo.sub === 'string' && userinfo.sub ? userinfo.sub : email,
    accessToken: tokenData.access_token,
  };
}
