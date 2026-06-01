/**
 * Session router — Phase 6.
 *
 * Replaces single-global-plugin-socket behavior with per-user/per-device routing.
 *
 * Responsibilities:
 *  - Maps userId → active PluginConnection
 *  - Enforces device conflict policy (one active device per user by default)
 *  - Routes MCP tool calls to the correct user's paired plugin
 *  - Falls back to single-socket mode for local
 *
 * Error codes:
 *  NO_PAIRED_PLUGIN_SESSION, PLUGIN_NOT_CONNECTED, DEVICE_CONFLICT,
 *  PLUGIN_SESSION_EXPIRED, PLUGIN_SESSION_REVOKED, NO_ACTIVE_DEVICE
 */

import type WebSocket from 'ws';
import { randomUUID } from 'node:crypto';
import { PluginConnection, type PluginConnectionInfo } from './plugin-connection.js';
import { validatePluginSessionToken } from '../auth/pairing-routes.js';
import type { CompanionServerConfig } from '../config.js';
import type { StorageProvider } from '../storage/types.js';
import { TOOL_REGISTRY_VERSION } from '../tool-registry.js';
import { normalizeToolProfile, TOOL_SCHEMA_VERSION } from '../tool-policy.js';

// ─── Types ───────────────────────────────────────────────────────────

export type SessionRouterErrorCode =
  | 'NO_PAIRED_PLUGIN_SESSION'
  | 'PLUGIN_NOT_CONNECTED'
  | 'DEVICE_CONFLICT'
  | 'PLUGIN_SESSION_EXPIRED'
  | 'PLUGIN_SESSION_REVOKED'
  | 'NO_ACTIVE_DEVICE';

export interface RoutingPrincipal {
  userId: string;
  sessionId?: string;
  scopes?: string[];
  authMode: string;
}

export interface SessionRouterStatus {
  mode: 'local' | 'hosted';
  activeConnections: number;
  connectedUsers: string[];
}

// ─── Hello message types ─────────────────────────────────────────────

interface LegacyPluginHello {
  type: 'plugin_hello';
  protocolVersion: number;
  clientName: string;
  token?: string;
}

interface HostedPluginHello {
  type: 'plugin_hello';
  protocolVersion: number;
  clientName: string;
  deploymentMode: 'local' | 'hosted';
  deviceId: string;
  pluginSessionId: string;
  pluginSessionToken: string;
}

type PluginHelloMessage = LegacyPluginHello | HostedPluginHello;

interface PluginRegisterMessage {
  type: 'plugin_register';
  pluginInstanceId: string;
  pluginConnectionId: string;
  sessionSecret: string;
  workspaceLabel?: string;
  supportedTools?: string[];
  accessScope?: 'focused-rem-only' | 'current-rem-tree' | 'full-kb';
  trustedWriteMode?: 'ask-every-write' | 'trusted-inside-scope';
  toolTier?: 'core' | 'advanced_notes' | 'developer_diagnostics' | 'full';
}

type PluginRegistrationMessage = PluginHelloMessage | PluginRegisterMessage;

// ─── Session Router ──────────────────────────────────────────────────

export class SessionRouter {
  private connections = new Map<string, PluginConnection>(); // userId → connection
  private config: CompanionServerConfig;

  constructor(config: CompanionServerConfig, private readonly storage?: StorageProvider) {
    this.config = config;
  }

  get isHostedMode(): boolean {
    return this.config.deploymentMode === 'hosted';
  }

  /**
   * Authenticate and register a new plugin WebSocket connection.
   * Returns null on success, or an error code string on failure.
   */
  async authenticateAndRegister(
    socket: WebSocket,
    hello: PluginRegistrationMessage
  ): Promise<{ ok: true; connection: PluginConnection } | { ok: false; error: SessionRouterErrorCode; message: string }> {
    // ─── Local mode ─────────────────────────────────────────────
    if (!this.isHostedMode) {
      const userId = '__local__';
      const deviceId = '__local_device__';

      // Close existing connection for this user (single-device policy)
      const existing = this.connections.get(userId);
      if (existing) {
        existing.close(1012, 'New RemNote plugin connection opened.');
        this.connections.delete(userId);
      }

      const conn = new PluginConnection(
        socket,
        randomUUID(),
        userId,
        deviceId,
        '__local_session__'
      );
      this.connections.set(userId, conn);
      return { ok: true, connection: conn };
    }

    if (hello.type === 'plugin_register') {
      if (!this.storage) {
        return {
          ok: false,
          error: 'NO_PAIRED_PLUGIN_SESSION',
          message: 'Pairing storage is unavailable.',
        };
      }
      const pairingSession = await this.storage.getChatGptPairingSessionByPluginSessionSecret(hello.sessionSecret);
      if (
        !pairingSession ||
        pairingSession.revokedAt ||
        (pairingSession.status !== 'approved' && pairingSession.status !== 'connected')
      ) {
        return {
          ok: false,
          error: 'PLUGIN_SESSION_EXPIRED',
          message: 'Plugin session is invalid, expired, or revoked. Re-pair required.',
        };
      }
      if (pairingSession.pluginInstanceId !== hello.pluginInstanceId) {
        return {
          ok: false,
          error: 'NO_PAIRED_PLUGIN_SESSION',
          message: 'Plugin instance does not match the approved pairing.',
        };
      }

      const userId = pairingSession.oauthSubject || pairingSession.pairingId;
      const existing = this.connections.get(userId);
      if (existing && existing.pluginSessionId !== pairingSession.pairingId && existing.isOpen) {
        existing.close(1012, 'DEVICE_CONFLICT: New paired session connected.');
        this.connections.delete(userId);
      }

      const conn = new PluginConnection(
        socket,
        hello.pluginConnectionId,
        userId,
        hello.pluginInstanceId,
        pairingSession.pairingId
      );
      this.connections.set(userId, conn);
      await this.storage.updateChatGptPairingSession(pairingSession.pairingId, {
        status: 'connected',
        connectedAt: pairingSession.connectedAt ?? new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        pluginConnectionId: hello.pluginConnectionId,
        workspaceLabel: hello.workspaceLabel ?? pairingSession.workspaceLabel,
        accessScope: hello.accessScope ?? pairingSession.accessScope,
        trustedWriteMode: hello.trustedWriteMode ?? pairingSession.trustedWriteMode,
        toolTier: hello.toolTier ? normalizeToolProfile(hello.toolTier) : pairingSession.toolTier,
        toolTierVersion: TOOL_REGISTRY_VERSION,
        toolSchemaVersionAtApproval: pairingSession.toolSchemaVersionAtApproval ?? TOOL_SCHEMA_VERSION,
        requiresConnectorRefresh:
          Boolean(pairingSession.requiresConnectorRefresh) ||
          Boolean(hello.toolTier && pairingSession.toolTier && normalizeToolProfile(hello.toolTier) !== pairingSession.toolTier),
      });
      return { ok: true, connection: conn };
    }

    // ─── Hosted mode: validate plugin session credentials ───────
    const hosted = hello as HostedPluginHello;
    if (!hosted.pluginSessionId || !hosted.pluginSessionToken || !hosted.deviceId) {
      return {
        ok: false,
        error: 'NO_PAIRED_PLUGIN_SESSION',
        message: 'Missing pluginSessionId, pluginSessionToken, or deviceId in hello.',
      };
    }

    const pairingSession = validatePluginSessionToken(
      hosted.pluginSessionId,
      hosted.pluginSessionToken
    );

    if (!pairingSession) {
      // Determine specific reason
      return {
        ok: false,
        error: 'PLUGIN_SESSION_EXPIRED',
        message: 'Plugin session is invalid, expired, or revoked. Re-pair required.',
      };
    }

    // Device conflict policy: one active device per user
    const existing = this.connections.get(pairingSession.userId);
    if (existing && existing.deviceId !== hosted.deviceId && existing.isOpen) {
      // Replace existing connection (policy: replace old + record reason)
      existing.close(1012, 'DEVICE_CONFLICT: New device connected, replacing old connection.');
      this.connections.delete(pairingSession.userId);
    }

    const conn = new PluginConnection(
      socket,
      randomUUID(),
      pairingSession.userId,
      hosted.deviceId,
      hosted.pluginSessionId
    );
    this.connections.set(pairingSession.userId, conn);
    return { ok: true, connection: conn };
  }

  /**
   * Get the active plugin connection for a given user.
   */
  getConnectionForUser(userId: string): PluginConnection | null {
    const conn = this.connections.get(userId);
    if (!conn || !conn.isOpen) return null;
    return conn;
  }

  /**
   * Get the active plugin connection for the local/legacy mode.
   */
  getLocalConnection(): PluginConnection | null {
    return this.getConnectionForUser('__local__');
  }

  /**
   * Remove a connection when a plugin disconnects.
   */
  removeConnection(userId: string): void {
    this.connections.delete(userId);
  }

  /**
   * Close all connections (used during shutdown).
   */
  closeAll(reason: string): void {
    for (const [userId, conn] of this.connections) {
      conn.close(1012, reason);
    }
    this.connections.clear();
  }

  /**
   * Get router status information.
   */
  getStatus(): SessionRouterStatus {
    const activeConnections: string[] = [];
    for (const [userId, conn] of this.connections) {
      if (conn.isOpen) {
        activeConnections.push(userId);
      }
    }
    return {
      mode: this.isHostedMode ? 'hosted' : 'local',
      activeConnections: activeConnections.length,
      connectedUsers: activeConnections,
    };
  }

  /**
   * Get all active connection infos (for diagnostics).
   */
  getActiveConnectionInfos(): PluginConnectionInfo[] {
    const infos: PluginConnectionInfo[] = [];
    for (const conn of this.connections.values()) {
      if (conn.isOpen) {
        infos.push(conn.getInfo());
      }
    }
    return infos;
  }
}
