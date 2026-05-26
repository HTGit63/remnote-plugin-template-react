export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface Session {
  id: string;
  userId: string;
  accessTokenHash: string;
  accessTokenExpiresAt: string;
  refreshTokenHash: string;
  refreshTokenExpiresAt: string;
  remnoteApiKeyHash?: string;
  tokenUse?: 'dashboard' | 'mcp_access';
  clientId?: string;
  issuer?: string;
  audience?: string;
  scopeGrants?: string[];
  revokedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PairingChallenge {
  pairingCodeHash: string;
  userId: string;
  status: 'pending' | 'paired' | 'expired';
  expiresAt: string;
  createdAt: string;
}

export interface McpClient {
  clientId: string;
  clientName?: string;
  redirectUris: string[];
  createdAt: string;
}

export interface McpAuthorizationCode {
  codeHash: string;
  clientId: string;
  userId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
  resource: string;
  scopeGrants: string[];
  expiresAt: string;
  createdAt: string;
  consumedAt?: string;
}

export interface StoredAuditEvent {
  id: string;
  type: string;
  userId?: string;
  deviceId?: string;
  sessionId?: string;
  tool?: string;
  status?: string;
  errorCode?: string;
  scope?: string;
  permissionMode?: string;
  createdRemIds?: string[];
  updatedRemIds?: string[];
  deletedRemIds?: string[];
  durationMs?: number;
  createdAt: string;
}

export interface IdempotencyRecord {
  id: string;
  userId: string;
  tool: string;
  idempotencyKey: string;
  targetRoot?: string;
  requestHash: string;
  status: 'started' | 'completed' | 'failed' | 'unknown';
  createdRemIds: string[];
  updatedRemIds: string[];
  startedAt: string;
  finishedAt?: string;
  errorCode?: string;
}

export interface StorageProvider {
  // User operations
  createUser(email: string): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;

  // Session operations
  createSession(session: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>): Promise<Session>;
  getSessionById(id: string): Promise<Session | null>;
  getSessionByAccessToken(accessToken: string): Promise<Session | null>;
  getSessionByRefreshToken(refreshToken: string): Promise<Session | null>;
  updateSession(id: string, updates: Partial<Omit<Session, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Session>;
  deleteSession(id: string): Promise<void>;

  // Pairing Challenge operations
  createPairingChallenge(challenge: PairingChallenge): Promise<void>;
  getPairingChallenge(pairingCode: string): Promise<PairingChallenge | null>;
  updatePairingChallengeStatus(pairingCode: string, status: PairingChallenge['status']): Promise<void>;

  // MCP OAuth operations
  upsertMcpClient(client: McpClient): Promise<McpClient>;
  getMcpClient(clientId: string): Promise<McpClient | null>;
  createMcpAuthorizationCode(code: McpAuthorizationCode): Promise<void>;
  consumeMcpAuthorizationCode(code: string): Promise<McpAuthorizationCode | null>;

  // Audit and idempotency operations
  createAuditEvent(event: Omit<StoredAuditEvent, 'id' | 'createdAt'>): Promise<StoredAuditEvent>;
  createOrUpdateIdempotencyRecord(record: Omit<IdempotencyRecord, 'id'>): Promise<IdempotencyRecord>;
  getIdempotencyRecord(userId: string, tool: string, idempotencyKey: string): Promise<IdempotencyRecord | null>;

  // Lifecycle
  initialize(): Promise<void>;
  close(): Promise<void>;
}
