import { timingSafeEqual } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { CompanionServerConfig } from '../config.js';
import { hashToken } from '../storage/crypto-utils.js';

export function codexBearerToken(req: IncomingMessage): string | null {
  const authorization = req.headers.authorization;
  if (typeof authorization !== 'string') {
    return null;
  }

  const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());
  return match?.[1] ?? null;
}

function safeTokenEquals(actual: string | null, expected: string): boolean {
  if (!actual || !expected) {
    return false;
  }

  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function hasValidCodexBearerToken(req: IncomingMessage, config: CompanionServerConfig): boolean {
  return safeTokenEquals(codexBearerToken(req), config.codexToken);
}

export function codexClientHashForRequest(req: IncomingMessage, config: CompanionServerConfig): string | null {
  const token = codexBearerToken(req);
  if (!safeTokenEquals(token, config.codexToken)) {
    return null;
  }
  return hashToken(token as string);
}
