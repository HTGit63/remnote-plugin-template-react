import type { IncomingMessage } from 'node:http';
import type { CompanionServerConfig } from '../config.js';
import { hasValidBearerToken } from '../http.js';
import type { AuthResult, ScopeGrant } from './types.js';

export const LOCAL_BRIDGE_SCOPE_GRANTS: ScopeGrant[] = [
  'bridge:read',
  'bridge:write',
  'bridge:delete',
  'bridge:pair',
];

export function authorizeLocalMcpRequest(
  req: IncomingMessage,
  config: CompanionServerConfig
): AuthResult {
  if (!hasValidBearerToken(req, config.bridgeToken)) {
    return {
      ok: false,
      statusCode: 401,
      error: 'Missing or invalid bridge token.',
      auditReason: 'invalid_bridge_token',
    };
  }

  return {
    ok: true,
    principal: {
      subject: 'local-remnote-bridge',
      authMode: 'local_bridge_token',
      scopeGrants: LOCAL_BRIDGE_SCOPE_GRANTS,
    },
  };
}
