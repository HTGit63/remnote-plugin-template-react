import type { IncomingMessage } from 'node:http';
import type { CompanionServerConfig } from '../config.js';
import type { StorageProvider } from '../storage/types.js';
import type { AuthResult, ScopeGrant } from './types.js';
import { getExpectedMcpResource, getRequestBaseUrl } from './oauth-routes.js';

function bearerToken(req: IncomingMessage): string | null {
  const authorization = req.headers.authorization;
  if (typeof authorization !== 'string') {
    return null;
  }
  const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());
  return match?.[1] ?? null;
}

export async function authorizeHostedMcpRequest(
  req: IncomingMessage,
  config: CompanionServerConfig,
  storage: StorageProvider,
  requiredScopes: readonly ScopeGrant[]
): Promise<AuthResult> {
  const token = bearerToken(req);
  if (!token) {
    return {
      ok: false,
      statusCode: 401,
      error: 'Missing bearer token.',
      auditReason: 'missing_oauth_token',
    };
  }

  const session = await storage.getSessionByAccessToken(token);
  const pairingSession = session ? null : await storage.getChatGptPairingSessionByAccessToken(token);
  if (pairingSession) {
    if (pairingSession.revokedAt) {
      return {
        ok: false,
        statusCode: 401,
        error: 'Bearer token revoked.',
        auditReason: 'revoked_oauth_token',
      };
    }

    if (!pairingSession.accessTokenExpiresAt || new Date(pairingSession.accessTokenExpiresAt) <= new Date()) {
      return {
        ok: false,
        statusCode: 401,
        error: 'Bearer token expired.',
        auditReason: 'expired_oauth_token',
      };
    }

    if (config.oauthIssuer && pairingSession.resource && pairingSession.resource !== getExpectedMcpResource(req, config)) {
      return {
        ok: false,
        statusCode: 401,
        error: 'Bearer token audience mismatch.',
        auditReason: 'oauth_audience_mismatch',
      };
    }

    if (pairingSession.status !== 'approved' && pairingSession.status !== 'connected') {
      return {
        ok: false,
        statusCode: 401,
        error: 'Bearer token is not connected to an approved RemNote plugin.',
        auditReason: 'pairing_not_approved',
      };
    }

    const scopeGrants = pairingSession.approvedScopes.filter((scope): scope is ScopeGrant =>
      [
        'bridge:read',
        'bridge:write',
        'bridge:trusted_write',
        'bridge:delete',
        'bridge:pair',
        'bridge:admin',
      ].includes(scope)
    );
    const missingScope = requiredScopes.find((scope) => !scopeGrants.includes(scope));
    if (missingScope) {
      return {
        ok: false,
        statusCode: 403,
        error: `Insufficient scope: ${missingScope}.`,
        auditReason: 'insufficient_oauth_scope',
      };
    }

    return {
      ok: true,
      principal: {
        subject: `pairing:${pairingSession.pairingId}`,
        userId: pairingSession.oauthSubject || pairingSession.pairingId,
        authMode: 'hosted_oauth',
        scopeGrants,
        sessionId: pairingSession.pairingId,
        deviceId: pairingSession.pluginConnectionId,
        expiresAt: pairingSession.accessTokenExpiresAt,
        pairingId: pairingSession.pairingId,
        pluginInstanceId: pairingSession.pluginInstanceId,
        accessScope: pairingSession.accessScope,
        trustedWriteMode: pairingSession.trustedWriteMode,
      },
    };
  }

  if (!session || session.tokenUse !== 'mcp_access') {
    return {
      ok: false,
      statusCode: 401,
      error: 'Invalid bearer token.',
      auditReason: 'invalid_oauth_token',
    };
  }

  if (session.revokedAt) {
    return {
      ok: false,
      statusCode: 401,
      error: 'Bearer token revoked.',
      auditReason: 'revoked_oauth_token',
    };
  }

  if (new Date(session.accessTokenExpiresAt) <= new Date()) {
    return {
      ok: false,
      statusCode: 401,
      error: 'Bearer token expired.',
      auditReason: 'expired_oauth_token',
    };
  }

  const expectedIssuer = config.oauthIssuer || getRequestBaseUrl(req, config);
  if (session.issuer && session.issuer !== expectedIssuer) {
    return {
      ok: false,
      statusCode: 401,
      error: 'Bearer token issuer mismatch.',
      auditReason: 'oauth_issuer_mismatch',
    };
  }

  const expectedAudience = getExpectedMcpResource(req, config);
  if (session.audience !== expectedAudience) {
    return {
      ok: false,
      statusCode: 401,
      error: 'Bearer token audience mismatch.',
      auditReason: 'oauth_audience_mismatch',
    };
  }

  const scopeGrants = (session.scopeGrants ?? []).filter((scope): scope is ScopeGrant =>
    [
      'bridge:read',
      'bridge:write',
      'bridge:trusted_write',
      'bridge:delete',
      'bridge:pair',
      'bridge:admin',
    ].includes(scope)
  );
  const missingScope = requiredScopes.find((scope) => !scopeGrants.includes(scope));
  if (missingScope) {
    return {
      ok: false,
      statusCode: 403,
      error: `Insufficient scope: ${missingScope}.`,
      auditReason: 'insufficient_oauth_scope',
    };
  }

  return {
    ok: true,
    principal: {
      subject: session.userId,
      userId: session.userId,
      authMode: 'hosted_oauth',
      scopeGrants,
      sessionId: session.id,
      expiresAt: session.accessTokenExpiresAt,
    },
  };
}
