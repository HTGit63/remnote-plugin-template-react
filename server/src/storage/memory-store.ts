import { randomUUID } from 'node:crypto';
import type {
  ChatGptPairingSession,
  CodexClientLink,
  CodexPairingSession,
  IdempotencyRecord,
  McpAuthorizationCode,
  McpClient,
  PairingChallenge,
  Session,
  StorageProvider,
  StoredAuditEvent,
  User,
} from './types.js';
import { hashToken } from './crypto-utils.js';
import { normalizeToolProfile } from '../tool-policy.js';

export class MemoryStorageProvider implements StorageProvider {
  private users = new Map<string, User>();
  private sessions = new Map<string, Session>();
  private challenges = new Map<string, PairingChallenge>();
  private clients = new Map<string, McpClient>();
  private authorizationCodes = new Map<string, McpAuthorizationCode>();
  private chatGptPairingSessions = new Map<string, ChatGptPairingSession>();
  private codexPairingSessions = new Map<string, CodexPairingSession>();
  private codexClientLinks = new Map<string, CodexClientLink>();
  private auditEvents: StoredAuditEvent[] = [];
  private idempotencyRecords = new Map<string, IdempotencyRecord>();

  async initialize(): Promise<void> {
    // No-op for in-memory
  }

  async close(): Promise<void> {
    // No-op for in-memory
  }

  // User operations
  async createUser(email: string): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      email,
      createdAt: new Date().toISOString(),
    };
    this.users.set(id, user);
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return user;
      }
    }
    return null;
  }

  // Session operations
  async createSession(sessionData: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>): Promise<Session> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const session: Session = {
      id,
      ...sessionData,
      createdAt: now,
      updatedAt: now,
    };
    this.sessions.set(id, session);
    return session;
  }

  async getSessionById(id: string): Promise<Session | null> {
    return this.sessions.get(id) ?? null;
  }

  async getSessionByAccessToken(accessToken: string): Promise<Session | null> {
    const targetHash = hashToken(accessToken);
    for (const session of this.sessions.values()) {
      if (session.accessTokenHash === targetHash && !session.revokedAt) {
        return session;
      }
    }
    return null;
  }

  async getSessionByRefreshToken(refreshToken: string): Promise<Session | null> {
    const targetHash = hashToken(refreshToken);
    for (const session of this.sessions.values()) {
      if (session.refreshTokenHash === targetHash && !session.revokedAt) {
        return session;
      }
    }
    return null;
  }

  async updateSession(
    id: string,
    updates: Partial<Omit<Session, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Session> {
    const session = this.sessions.get(id);
    if (!session) {
      throw new Error(`Session with ID ${id} not found.`);
    }

    const updatedSession: Session = {
      ...session,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  async deleteSession(id: string): Promise<void> {
    this.sessions.delete(id);
  }

  // Pairing Challenge operations
  async createPairingChallenge(challenge: PairingChallenge): Promise<void> {
    this.challenges.set(challenge.pairingCodeHash, challenge);
  }

  async getPairingChallenge(pairingCode: string): Promise<PairingChallenge | null> {
    const targetHash = hashToken(pairingCode);
    return this.challenges.get(targetHash) ?? null;
  }

  async updatePairingChallengeStatus(pairingCode: string, status: PairingChallenge['status']): Promise<void> {
    const targetHash = hashToken(pairingCode);
    const challenge = this.challenges.get(targetHash);
    if (challenge) {
      challenge.status = status;
      this.challenges.set(targetHash, challenge);
    }
  }

  async upsertMcpClient(client: McpClient): Promise<McpClient> {
    const stored = {
      ...client,
      redirectUris: [...client.redirectUris],
    };
    this.clients.set(stored.clientId, stored);
    return stored;
  }

  async getMcpClient(clientId: string): Promise<McpClient | null> {
    return this.clients.get(clientId) ?? null;
  }

  async createMcpAuthorizationCode(code: McpAuthorizationCode): Promise<void> {
    this.authorizationCodes.set(code.codeHash, code);
  }

  async consumeMcpAuthorizationCode(code: string): Promise<McpAuthorizationCode | null> {
    const targetHash = hashToken(code);
    const stored = this.authorizationCodes.get(targetHash);
    if (!stored || stored.consumedAt) {
      return null;
    }
    const consumed = {
      ...stored,
      consumedAt: new Date().toISOString(),
    };
    this.authorizationCodes.set(targetHash, consumed);
    return consumed;
  }

  async createChatGptPairingSession(
    session: ChatGptPairingSession
  ): Promise<ChatGptPairingSession> {
    const stored = this.clonePairing(session);
    this.chatGptPairingSessions.set(stored.pairingId, stored);
    return this.clonePairing(stored);
  }

  async getChatGptPairingSessionById(pairingId: string): Promise<ChatGptPairingSession | null> {
    const session = this.chatGptPairingSessions.get(pairingId);
    return session ? this.clonePairing(session) : null;
  }

  async getChatGptPairingSessionByPairingCode(pairingCode: string): Promise<ChatGptPairingSession | null> {
    const targetHash = hashToken(pairingCode);
    return this.findPairingByHash('pairingCodeHash', targetHash);
  }

  async getChatGptPairingSessionByAuthorizationCode(code: string): Promise<ChatGptPairingSession | null> {
    return this.findPairingByHash('authorizationCodeHash', hashToken(code));
  }

  async getChatGptPairingSessionByAccessToken(accessToken: string): Promise<ChatGptPairingSession | null> {
    return this.findPairingByHash('accessTokenHash', hashToken(accessToken));
  }

  async getChatGptPairingSessionByRefreshToken(refreshToken: string): Promise<ChatGptPairingSession | null> {
    return this.findPairingByHash('refreshTokenHash', hashToken(refreshToken));
  }

  async getChatGptPairingSessionByPluginSessionSecret(sessionSecret: string): Promise<ChatGptPairingSession | null> {
    return this.findPairingByHash('pluginSessionSecretHash', hashToken(sessionSecret));
  }

  async consumeChatGptPairingAuthorizationCode(code: string): Promise<ChatGptPairingSession | null> {
    const targetHash = hashToken(code);
    for (const session of this.chatGptPairingSessions.values()) {
      if (session.authorizationCodeHash !== targetHash || session.authorizationCodeConsumedAt) {
        continue;
      }

      const updated: ChatGptPairingSession = {
        ...session,
        authorizationCodeConsumedAt: new Date().toISOString(),
      };
      this.chatGptPairingSessions.set(session.pairingId, updated);
      return this.clonePairing(updated);
    }
    return null;
  }

  async updateChatGptPairingSession(
    pairingId: string,
    updates: Partial<Omit<ChatGptPairingSession, 'pairingId' | 'createdAt'>>
  ): Promise<ChatGptPairingSession> {
    const session = this.chatGptPairingSessions.get(pairingId);
    if (!session) {
      throw new Error(`ChatGPT pairing session with ID ${pairingId} not found.`);
    }

    const updated: ChatGptPairingSession = {
      ...session,
      ...updates,
    };
    this.chatGptPairingSessions.set(pairingId, updated);
    return this.clonePairing(updated);
  }

  async listChatGptPairingSessions(limit = 50): Promise<ChatGptPairingSession[]> {
    return Array.from(this.chatGptPairingSessions.values())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
      .map((session) => this.clonePairing(session));
  }

  async createCodexPairingSession(session: CodexPairingSession): Promise<CodexPairingSession> {
    const stored = this.cloneCodexPairing(session);
    this.codexPairingSessions.set(stored.pairingId, stored);
    return this.cloneCodexPairing(stored);
  }

  async getCodexPairingSessionById(pairingId: string): Promise<CodexPairingSession | null> {
    const session = this.codexPairingSessions.get(pairingId);
    return session ? this.cloneCodexPairing(session) : null;
  }

  async getCodexPairingSessionByUserCode(userCode: string): Promise<CodexPairingSession | null> {
    const targetHash = hashToken(userCode);
    for (const session of this.codexPairingSessions.values()) {
      if (session.userCodeHash === targetHash && !session.revokedAt) {
        return this.cloneCodexPairing(session);
      }
    }
    return null;
  }

  async updateCodexPairingSession(
    pairingId: string,
    updates: Partial<Omit<CodexPairingSession, 'pairingId' | 'createdAt'>>
  ): Promise<CodexPairingSession> {
    const session = this.codexPairingSessions.get(pairingId);
    if (!session) {
      throw new Error(`Codex pairing session with ID ${pairingId} not found.`);
    }
    const updated = this.cloneCodexPairing({ ...session, ...updates });
    this.codexPairingSessions.set(pairingId, updated);
    return this.cloneCodexPairing(updated);
  }

  async getCodexClientLink(codexClientHash: string): Promise<CodexClientLink | null> {
    const link = this.codexClientLinks.get(codexClientHash);
    return link ? this.cloneCodexLink(link) : null;
  }

  async upsertCodexClientLink(link: CodexClientLink): Promise<CodexClientLink> {
    const stored = this.cloneCodexLink(link);
    this.codexClientLinks.set(stored.codexClientHash, stored);
    return this.cloneCodexLink(stored);
  }

  async createAuditEvent(event: Omit<StoredAuditEvent, 'id' | 'createdAt'>): Promise<StoredAuditEvent> {
    const stored: StoredAuditEvent = {
      id: randomUUID(),
      ...event,
      createdAt: new Date().toISOString(),
    };
    this.auditEvents.unshift(stored);
    if (this.auditEvents.length > 500) {
      this.auditEvents.length = 500;
    }
    return stored;
  }

  async createOrUpdateIdempotencyRecord(record: Omit<IdempotencyRecord, 'id'>): Promise<IdempotencyRecord> {
    const key = this.idempotencyKey(record.userId, record.tool, record.idempotencyKey);
    const existing = this.idempotencyRecords.get(key);
    const stored: IdempotencyRecord = {
      id: existing?.id ?? randomUUID(),
      ...record,
    };
    this.idempotencyRecords.set(key, stored);
    return stored;
  }

  async getIdempotencyRecord(
    userId: string,
    tool: string,
    idempotencyKey: string
  ): Promise<IdempotencyRecord | null> {
    return this.idempotencyRecords.get(this.idempotencyKey(userId, tool, idempotencyKey)) ?? null;
  }

  private idempotencyKey(userId: string, tool: string, idempotencyKey: string): string {
    return `${userId}\u0000${tool}\u0000${idempotencyKey}`;
  }

  private async findPairingByHash(
    key: 'pairingCodeHash' | 'authorizationCodeHash' | 'accessTokenHash' | 'refreshTokenHash' | 'pluginSessionSecretHash',
    hash: string
  ): Promise<ChatGptPairingSession | null> {
    for (const session of this.chatGptPairingSessions.values()) {
      if (session[key] === hash && !session.revokedAt) {
        return this.clonePairing(session);
      }
    }
    return null;
  }

  private clonePairing(session: ChatGptPairingSession): ChatGptPairingSession {
    return {
      ...session,
      requestedScopes: [...session.requestedScopes],
      approvedScopes: [...session.approvedScopes],
      toolTier: normalizeToolProfile(session.toolTier),
      requiresConnectorRefresh: false,
    };
  }

  private cloneCodexPairing(session: CodexPairingSession): CodexPairingSession {
    return { ...session };
  }

  private cloneCodexLink(link: CodexClientLink): CodexClientLink {
    return { ...link };
  }
}
