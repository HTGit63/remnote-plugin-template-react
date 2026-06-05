export type AuthMode =
  | 'local_bridge_token'
  | 'local_no_token'
  | 'mcp_discovery_noauth'
  | 'connector_compat_noauth'
  | 'hosted_oauth';

export type ScopeGrant =
  | 'bridge:read'
  | 'bridge:write'
  | 'bridge:trusted_write'
  | 'bridge:delete'
  | 'bridge:pair'
  | 'bridge:admin';

export interface AuthenticatedPrincipal {
  subject: string;
  userId?: string;
  authMode: AuthMode;
  scopeGrants: ScopeGrant[];
  sessionId?: string;
  deviceId?: string;
  expiresAt?: string;
  pairingId?: string;
  pluginInstanceId?: string;
  accessScope?: 'focused-rem-only' | 'current-rem-tree' | 'full-kb';
  trustedWriteMode?: 'ask-every-write' | 'trusted-inside-scope';
  toolTier?: 'basic' | 'note_writer' | 'power_user' | 'developer' | 'danger';
  requiresConnectorRefresh?: boolean;
}

export type AuthResult =
  | {
      ok: true;
      principal: AuthenticatedPrincipal;
    }
  | {
      ok: false;
      statusCode: 401 | 403;
      error: string;
      auditReason: string;
    };

export interface OAuthAccount {
  provider: string;
  providerSubject: string;
  userId: string;
  email?: string;
  displayName?: string;
}

export interface HostedSessionToken {
  tokenHash: string;
  userId: string;
  sessionId: string;
  deviceId: string;
  scopeGrants: ScopeGrant[];
  expiresAt: string;
  revokedAt?: string;
}

export interface HostedAuthProvider {
  getAuthorizationUrl(state: string): Promise<string>;
  exchangeAuthorizationCode(code: string): Promise<OAuthAccount>;
  validateSessionToken(token: string): Promise<AuthenticatedPrincipal | null>;
  revokeSession(sessionId: string): Promise<void>;
}

export class HostedAuthNotConfiguredError extends Error {
  constructor() {
    super('Hosted OAuth mode is not configured. Local bridge-token mode remains the only active auth path.');
    this.name = 'HostedAuthNotConfiguredError';
  }
}
