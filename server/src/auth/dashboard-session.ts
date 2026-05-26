/**
 * Dashboard session management — Phase 4.
 *
 * Handles:
 *  - Secure HttpOnly session cookie issuance, rotation, and revocation
 *  - CSRF token generation and verification for mutation routes
 *  - Cookie-based session validation middleware
 */

import { randomBytes, createHmac } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { CompanionServerConfig } from '../config.js';
import type { StorageProvider, User, Session } from '../storage/types.js';
import { hashToken, timingSafeCompare } from '../storage/crypto-utils.js';

// ─── Constants ───────────────────────────────────────────────────────
const SESSION_COOKIE_NAME = 'rn_dash_sid';
const CSRF_COOKIE_NAME = 'rn_csrf';
const SESSION_MAX_AGE_SECONDS = 3600; // 1 hour
const CSRF_TOKEN_BYTES = 32;
const SESSION_TOKEN_BYTES = 48;

// ─── Types ───────────────────────────────────────────────────────────
export interface DashboardSessionContext {
  user: User;
  session: Session;
}

export interface CsrfValidationResult {
  valid: boolean;
  reason?: string;
}

// ─── Cookie Helpers ──────────────────────────────────────────────────
function parseCookies(req: IncomingMessage): Record<string, string> {
  const header = req.headers.cookie || '';
  const cookies: Record<string, string> = {};
  for (const pair of header.split(';')) {
    const eqIdx = pair.indexOf('=');
    if (eqIdx < 0) continue;
    const key = pair.slice(0, eqIdx).trim();
    const value = pair.slice(eqIdx + 1).trim();
    cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}

function buildSetCookieHeader(
  name: string,
  value: string,
  config: CompanionServerConfig,
  maxAgeSeconds: number
): string {
  const isHosted = config.deploymentMode !== 'local_dev';
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (isHosted) {
    parts.push('Secure');
  }
  return parts.join('; ');
}

function buildClearCookieHeader(name: string): string {
  return `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

// ─── Token Generation ────────────────────────────────────────────────
export function generateSessionToken(): string {
  return randomBytes(SESSION_TOKEN_BYTES).toString('hex');
}

export function generateCsrfToken(): string {
  return randomBytes(CSRF_TOKEN_BYTES).toString('hex');
}

// ─── CSRF Functions ──────────────────────────────────────────────────
export function setCsrfCookie(res: ServerResponse, config: CompanionServerConfig): string {
  const csrf = generateCsrfToken();
  const isHosted = config.deploymentMode !== 'local_dev';
  const parts = [
    `${CSRF_COOKIE_NAME}=${encodeURIComponent(csrf)}`,
    `Path=/`,
    `SameSite=Lax`,
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
  ];
  if (isHosted) {
    parts.push('Secure');
  }
  // CSRF cookie must NOT be HttpOnly so client JS can read it for headers
  appendSetCookie(res, parts.join('; '));
  return csrf;
}

export function validateCsrfToken(req: IncomingMessage): CsrfValidationResult {
  const cookies = parseCookies(req);
  const cookieCsrf = cookies[CSRF_COOKIE_NAME];
  const headerCsrf = typeof req.headers['x-csrf-token'] === 'string'
    ? req.headers['x-csrf-token']
    : undefined;

  if (!cookieCsrf || !headerCsrf) {
    return { valid: false, reason: 'Missing CSRF cookie or header.' };
  }

  if (!timingSafeCompare(cookieCsrf, headerCsrf)) {
    return { valid: false, reason: 'CSRF token mismatch.' };
  }

  return { valid: true };
}

// ─── Session Cookie Functions ────────────────────────────────────────
export async function createDashboardSession(
  user: User,
  storage: StorageProvider,
  config: CompanionServerConfig,
  res: ServerResponse
): Promise<Session> {
  const accessToken = generateSessionToken();
  const refreshToken = generateSessionToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000);

  const session = await storage.createSession({
    userId: user.id,
    accessTokenHash: hashToken(accessToken),
    accessTokenExpiresAt: expiresAt.toISOString(),
    refreshTokenHash: hashToken(refreshToken),
    refreshTokenExpiresAt: new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString(),
  });

  // Set session cookie
  appendSetCookie(
    res,
    buildSetCookieHeader(SESSION_COOKIE_NAME, accessToken, config, SESSION_MAX_AGE_SECONDS)
  );

  // Set CSRF cookie alongside
  setCsrfCookie(res, config);

  return session;
}

export async function validateDashboardSession(
  req: IncomingMessage,
  storage: StorageProvider
): Promise<DashboardSessionContext | null> {
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE_NAME];
  if (!token) return null;

  const session = await storage.getSessionByAccessToken(token);
  if (!session) return null;

  // Check expiration
  if (new Date(session.accessTokenExpiresAt) < new Date()) {
    return null;
  }

  const user = await storage.getUserById(session.userId);
  if (!user) return null;

  return { user, session };
}

export async function revokeDashboardSession(
  req: IncomingMessage,
  storage: StorageProvider,
  res: ServerResponse
): Promise<boolean> {
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE_NAME];
  if (!token) return false;

  const session = await storage.getSessionByAccessToken(token);
  if (session) {
    await storage.deleteSession(session.id);
  }

  // Clear cookies
  appendSetCookie(res, buildClearCookieHeader(SESSION_COOKIE_NAME));
  appendSetCookie(res, buildClearCookieHeader(CSRF_COOKIE_NAME));
  return true;
}

// ─── Helper: append Set-Cookie safely ────────────────────────────────
function appendSetCookie(res: ServerResponse, cookie: string): void {
  const existing = res.getHeader('Set-Cookie');
  if (!existing) {
    res.setHeader('Set-Cookie', cookie);
  } else if (Array.isArray(existing)) {
    res.setHeader('Set-Cookie', [...existing, cookie]);
  } else {
    res.setHeader('Set-Cookie', [String(existing), cookie]);
  }
}
