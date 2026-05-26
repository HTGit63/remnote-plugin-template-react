import { randomBytes, randomInt } from 'node:crypto';
import type { ChatGptPairingSession } from '../storage/types.js';

const pairingCodeDeliveries = new Map<string, { pairingCode: string; expiresAt: number }>();
const authorizationCodeDeliveries = new Map<string, { authorizationCode: string; expiresAt: number }>();

export function randomSecret(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export function generatePairingCode(): string {
  const value = randomInt(0, 1_000_000).toString().padStart(6, '0');
  return `${value.slice(0, 3)}-${value.slice(3)}`;
}

export function normalizePairingCode(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 6);
  return digits.length === 6 ? `${digits.slice(0, 3)}-${digits.slice(3)}` : value.trim();
}

export function publicPairingLabel(session: ChatGptPairingSession): string {
  return (
    session.localConnectionLabel ||
    session.chatgptDisplayName ||
    session.clientName ||
    'ChatGPT session'
  );
}

export function rememberPairingCode(pairingId: string, pairingCode: string, expiresAt: string): void {
  pairingCodeDeliveries.set(pairingId, {
    pairingCode,
    expiresAt: new Date(expiresAt).getTime(),
  });
}

export function getRememberedPairingCode(pairingId: string): string | null {
  const item = pairingCodeDeliveries.get(pairingId);
  if (!item || item.expiresAt <= Date.now()) {
    pairingCodeDeliveries.delete(pairingId);
    return null;
  }
  return item.pairingCode;
}

export function rememberAuthorizationCode(pairingId: string, authorizationCode: string, expiresAt: string): void {
  authorizationCodeDeliveries.set(pairingId, {
    authorizationCode,
    expiresAt: new Date(expiresAt).getTime(),
  });
}

export function takeRememberedAuthorizationCode(pairingId: string): string | null {
  const item = authorizationCodeDeliveries.get(pairingId);
  authorizationCodeDeliveries.delete(pairingId);
  if (!item || item.expiresAt <= Date.now()) {
    return null;
  }
  return item.authorizationCode;
}
