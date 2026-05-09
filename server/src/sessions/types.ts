import type { AuthenticatedPrincipal, ScopeGrant } from '../auth/types.js';

export interface PairedPluginSession {
  sessionId: string;
  userId: string;
  deviceId: string;
  pluginConnectionId?: string;
  scopeGrants: ScopeGrant[];
  createdAt: string;
  expiresAt: string;
  revokedAt?: string;
}

export interface SessionStore {
  create(session: PairedPluginSession): Promise<void>;
  get(sessionId: string): Promise<PairedPluginSession | null>;
  revoke(sessionId: string, revokedAt: string): Promise<void>;
  pruneExpired(now: string): Promise<number>;
}

export type AuditEventType =
  | 'mcp_request_accepted'
  | 'mcp_request_rejected'
  | 'bridge_plugin_connected'
  | 'bridge_plugin_disconnected'
  | 'session_revoked';

export interface AuditEvent {
  type: AuditEventType;
  timestamp: string;
  actor?: Pick<AuthenticatedPrincipal, 'subject' | 'authMode'>;
  method?: string;
  path?: string;
  remoteAddress?: string;
  statusCode?: number;
  reason?: string;
}

export interface AuditLogger {
  record(event: AuditEvent): void;
}
