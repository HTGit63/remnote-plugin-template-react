/**
 * Plugin pairing flow — Phase 5.
 *
 * Implements:
 *  POST /api/pair/start   — Plugin requests a pairing challenge code
 *  POST /api/pair/confirm — Dashboard user confirms pairing with the 6-digit code
 *  POST /api/pair/status  — Plugin polls for confirmed credentials
 *  POST /api/pair/revoke  — Dashboard user revokes a paired device session
 *
 * The pairing protocol:
 *  1. Plugin generates a local deviceId if missing.
 *  2. Plugin calls POST /api/pair/start with { deviceId, deviceName }.
 *  3. Server creates a pairingChallengeId and returns a one-time 6-digit code.
 *  4. User signs into dashboard and enters the code.
 *  5. Server confirms pairing, issues pluginSessionId + pluginSessionToken.
 *  6. Plugin stores credentials in local (non-synced) RemNote storage.
 *  7. Plugin reconnects WSS with session credentials in the hello message.
 */

import { randomBytes, randomInt } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { CompanionServerConfig } from '../config.js';
import type { StorageProvider } from '../storage/types.js';
import { hashToken } from '../storage/crypto-utils.js';
import { readJsonBody, writeJson } from '../http.js';
import {
  validateDashboardSession,
  validateCsrfToken,
  generateSessionToken,
} from '../auth/dashboard-session.js';

// ─── Constants ───────────────────────────────────────────────────────
const PAIRING_CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const PLUGIN_SESSION_EXPIRY_MS = 30 * 24 * 3600 * 1000; // 30 days

// ─── In-memory pending pairing store ─────────────────────────────────
// Pairing challenges are stored in the persistent StorageProvider,
// but we also need to map from raw pairing codes to device metadata,
// since we only store hashed codes in storage.
interface PendingPairing {
  rawCode: string;
  deviceId: string;
  deviceName: string;
  expiresAt: number;
  confirmedAt?: string;
  deliveredAt?: string;
  credentials?: {
    pluginSessionId: string;
    pluginSessionToken: string;
    expiresAt: string;
  };
}
const pendingPairings = new Map<string, PendingPairing>(); // key = rawCode

function cleanExpiredPairings(): void {
  const now = Date.now();
  for (const [key, val] of pendingPairings) {
    if (val.expiresAt < now) pendingPairings.delete(key);
  }
}

// ─── Completed pairing sessions (in-memory for plugin credential lookup) ──
export interface PluginPairingSession {
  pluginSessionId: string;
  pluginSessionTokenHash: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  createdAt: string;
  expiresAt: string;
  revokedAt?: string;
}

const pluginSessions = new Map<string, PluginPairingSession>(); // key = pluginSessionId

export function getPluginSession(pluginSessionId: string): PluginPairingSession | undefined {
  return pluginSessions.get(pluginSessionId);
}

export function getPluginSessionsForUser(userId: string): PluginPairingSession[] {
  return Array.from(pluginSessions.values()).filter((s) => s.userId === userId && !s.revokedAt);
}

export function revokePluginSession(pluginSessionId: string): boolean {
  const session = pluginSessions.get(pluginSessionId);
  if (!session) return false;
  session.revokedAt = new Date().toISOString();
  return true;
}

export function validatePluginSessionToken(
  pluginSessionId: string,
  pluginSessionToken: string
): PluginPairingSession | null {
  const session = pluginSessions.get(pluginSessionId);
  if (!session) return null;
  if (session.revokedAt) return null;
  if (new Date(session.expiresAt) < new Date()) return null;
  if (session.pluginSessionTokenHash !== hashToken(pluginSessionToken)) return null;
  return session;
}

// ─── Route Handler ───────────────────────────────────────────────────
export interface PairingRouterDeps {
  config: CompanionServerConfig;
  storage: StorageProvider;
}

export async function handlePairingRoute(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  deps: PairingRouterDeps
): Promise<boolean> {
  const { config, storage } = deps;

  // ──── POST /api/pair/start ─────────────────────────────────────────
  if (url.pathname === '/api/pair/start' && req.method === 'POST') {
    const body = (await readJsonBody(req, config.maxBodyBytes)) as {
      deviceId?: string;
      deviceName?: string;
    } | undefined;

    if (!body || !body.deviceId) {
      writeJson(res, 400, { error: 'Missing required field: deviceId' });
      return true;
    }

    cleanExpiredPairings();

    // Generate a 6-digit pairing code
    const rawCode = String(randomInt(100000, 999999));
    const codeHash = hashToken(rawCode);
    const expiresAt = Date.now() + PAIRING_CODE_EXPIRY_MS;

    // Store in pending pairings (in-memory for raw code lookup)
    pendingPairings.set(rawCode, {
      rawCode,
      deviceId: body.deviceId,
      deviceName: body.deviceName || 'Unknown Device',
      expiresAt,
    });

    writeJson(res, 200, {
      ok: true,
      pairingCode: rawCode,
      expiresAt: new Date(expiresAt).toISOString(),
      message: 'Enter this code in the RemNote Companion dashboard to complete pairing.',
    });
    return true;
  }

  // ──── POST /api/pair/confirm ───────────────────────────────────────
  if (url.pathname === '/api/pair/confirm' && req.method === 'POST') {
    // Must be authenticated with a dashboard session
    const session = await validateDashboardSession(req, storage);
    if (!session) {
      writeJson(res, 401, { error: 'Dashboard login required.' });
      return true;
    }

    // Validate CSRF
    const csrfResult = validateCsrfToken(req);
    if (!csrfResult.valid) {
      writeJson(res, 403, { error: csrfResult.reason || 'CSRF validation failed.' });
      return true;
    }

    const body = (await readJsonBody(req, config.maxBodyBytes)) as {
      pairingCode?: string;
    } | undefined;

    if (!body || !body.pairingCode) {
      writeJson(res, 400, { error: 'Missing required field: pairingCode' });
      return true;
    }

    cleanExpiredPairings();

    const pending = pendingPairings.get(body.pairingCode);
    if (!pending || pending.expiresAt < Date.now() || pending.confirmedAt) {
      writeJson(res, 400, { error: 'Invalid or expired pairing code.' });
      return true;
    }

    // Generate plugin session credentials
    const pluginSessionId = randomBytes(16).toString('hex');
    const pluginSessionToken = generateSessionToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + PLUGIN_SESSION_EXPIRY_MS);

    const pairingSession: PluginPairingSession = {
      pluginSessionId,
      pluginSessionTokenHash: hashToken(pluginSessionToken),
      userId: session.user.id,
      deviceId: pending.deviceId,
      deviceName: pending.deviceName,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    pluginSessions.set(pluginSessionId, pairingSession);
    pending.confirmedAt = now.toISOString();
    pending.credentials = {
      pluginSessionId,
      pluginSessionToken,
      expiresAt: expiresAt.toISOString(),
    };
    pendingPairings.set(body.pairingCode, pending);

    // Also persist the pairing in storage
    await storage.createPairingChallenge({
      pairingCodeHash: hashToken(body.pairingCode),
      userId: session.user.id,
      status: 'paired',
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
    });

    writeJson(res, 200, {
      ok: true,
      deviceId: pending.deviceId,
      expiresAt: expiresAt.toISOString(),
      message: 'Device paired successfully. Return to the RemNote plugin to finish pairing.',
    });
    return true;
  }

  // ──── POST /api/pair/status ────────────────────────────────────────
  if (url.pathname === '/api/pair/status' && req.method === 'POST') {
    const body = (await readJsonBody(req, config.maxBodyBytes)) as {
      pairingCode?: string;
      deviceId?: string;
    } | undefined;

    if (!body?.pairingCode || !body.deviceId) {
      writeJson(res, 400, { error: 'Missing required fields: pairingCode and deviceId.' });
      return true;
    }

    cleanExpiredPairings();
    const pending = pendingPairings.get(body.pairingCode);
    if (!pending || pending.deviceId !== body.deviceId || pending.expiresAt < Date.now()) {
      writeJson(res, 404, { error: 'Pairing challenge not found or expired.' });
      return true;
    }

    if (!pending.credentials || !pending.confirmedAt) {
      writeJson(res, 202, {
        ok: false,
        status: 'pending',
        message: 'Pairing code has not been confirmed in the dashboard yet.',
      });
      return true;
    }

    if (pending.deliveredAt) {
      writeJson(res, 410, {
        error: 'Pairing credentials were already delivered. Start pairing again if this device was not configured.',
      });
      return true;
    }

    pending.deliveredAt = new Date().toISOString();
    pendingPairings.delete(body.pairingCode);
    writeJson(res, 200, {
      ok: true,
      status: 'paired',
      deviceId: pending.deviceId,
      deviceName: pending.deviceName,
      ...pending.credentials,
    });
    return true;
  }

  // ──── POST /api/pair/revoke ────────────────────────────────────────
  if (url.pathname === '/api/pair/revoke' && req.method === 'POST') {
    const session = await validateDashboardSession(req, storage);
    if (!session) {
      writeJson(res, 401, { error: 'Dashboard login required.' });
      return true;
    }

    const csrfResult = validateCsrfToken(req);
    if (!csrfResult.valid) {
      writeJson(res, 403, { error: csrfResult.reason || 'CSRF validation failed.' });
      return true;
    }

    const body = (await readJsonBody(req, config.maxBodyBytes)) as {
      pluginSessionId?: string;
    } | undefined;

    if (!body || !body.pluginSessionId) {
      writeJson(res, 400, { error: 'Missing required field: pluginSessionId' });
      return true;
    }

    const targetSession = pluginSessions.get(body.pluginSessionId);
    if (!targetSession || targetSession.userId !== session.user.id) {
      writeJson(res, 404, { error: 'Plugin session not found or does not belong to this user.' });
      return true;
    }

    revokePluginSession(body.pluginSessionId);

    writeJson(res, 200, {
      ok: true,
      message: 'Plugin session revoked.',
      pluginSessionId: body.pluginSessionId,
    });
    return true;
  }

  return false;
}
