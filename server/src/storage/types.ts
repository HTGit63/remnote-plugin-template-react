import type { BulkImportJob, BulkImportPlan } from '../../../shared/bridge/bulk-import.js';

export type BulkImportJobSaveOptions = {
  expectedRevision?: number;
};

export class BulkImportRevisionConflictError extends Error {
  readonly code = 'BULK_IMPORT_REVISION_CONFLICT';

  constructor(
    public readonly jobId: string,
    public readonly expectedRevision: number,
    public readonly actualRevision: number
  ) {
    super(`Bulk import job ${jobId} revision conflict: expected ${expectedRevision}, actual ${actualRevision}.`);
    this.name = 'BulkImportRevisionConflictError';
  }
}

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

export type ChatGptPairingStatus =
  | 'pending'
  | 'approved'
  | 'denied'
  | 'expired'
  | 'connected'
  | 'disconnected';

export type ChatGptAccessScope =
  | 'focused-rem-only'
  | 'current-rem-tree'
  | 'full-kb';

export type ChatGptTrustedWriteMode =
  | 'ask-every-write'
  | 'trusted-inside-scope';

export type ChatGptToolTier =
  | 'basic'
  | 'mass_note_writer'
  | 'note_writer'
  | 'power_user'
  | 'developer'
  | 'danger';

export interface ChatGptPairingSession {
  pairingId: string;
  pairingCodeHash: string;
  oauthState: string;
  codeChallenge?: string;
  codeChallengeMethod?: 'S256' | 'plain';
  clientId: string;
  clientName?: string;
  chatgptDisplayName?: string;
  localConnectionLabel?: string;

  status: ChatGptPairingStatus;

  createdAt: string;
  expiresAt: string;
  approvedAt?: string;
  connectedAt?: string;
  disconnectedAt?: string;
  lastSeenAt?: string;

  pluginInstanceId?: string;
  pluginConnectionId?: string;
  pluginSessionSecretHash?: string;
  workspaceLabel?: string;

  requestedScopes: string[];
  approvedScopes: string[];

  accessScope: ChatGptAccessScope;
  trustedWriteMode: ChatGptTrustedWriteMode;
  toolTier?: ChatGptToolTier;
  toolTierVersion?: string;
  toolTierChangedAt?: string;
  toolSchemaVersionAtApproval?: string;
  requiresConnectorRefresh?: boolean;

  authorizationCodeHash?: string;
  authorizationCodeExpiresAt?: string;
  authorizationCodeConsumedAt?: string;
  accessTokenHash?: string;
  accessTokenExpiresAt?: string;
  refreshTokenHash?: string;
  refreshTokenExpiresAt?: string;

  redirectUri?: string;
  resource?: string;
  oauthSubject?: string;
  failedAttempts?: number;
  lockedUntil?: string;
  revokedAt?: string;
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

export type HostedMediaStorageDurability = 'memory_only' | 'persistent';

export interface HostedMediaAsset {
  assetId: string;
  ownerId: string;
  idempotencyKey: string;
  sourceFileId: string;
  sha256: string;
  contentType:
    | 'image/png'
    | 'image/jpeg'
    | 'image/webp'
    | 'image/gif'
    | 'audio/mpeg'
    | 'video/mp4';
  fileName: string;
  bytes: Buffer;
  createdAt: string;
}

export class HostedMediaIdempotencyConflictError extends Error {
  readonly code = 'HOSTED_MEDIA_IDEMPOTENCY_CONFLICT';

  constructor(
    public readonly ownerId: string,
    public readonly idempotencyKey: string
  ) {
    super(
      `HOSTED_MEDIA_IDEMPOTENCY_CONFLICT: Hosted media key ${idempotencyKey} was already used with different bytes.`
    );
    this.name = 'HostedMediaIdempotencyConflictError';
  }
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

  // ChatGPT MCP OAuth + RemNote plugin pairing operations
  createChatGptPairingSession(session: ChatGptPairingSession): Promise<ChatGptPairingSession>;
  getChatGptPairingSessionById(pairingId: string): Promise<ChatGptPairingSession | null>;
  getChatGptPairingSessionByPairingCode(pairingCode: string): Promise<ChatGptPairingSession | null>;
  getChatGptPairingSessionByAuthorizationCode(code: string): Promise<ChatGptPairingSession | null>;
  getChatGptPairingSessionByAccessToken(accessToken: string): Promise<ChatGptPairingSession | null>;
  getChatGptPairingSessionByRefreshToken(refreshToken: string): Promise<ChatGptPairingSession | null>;
  getChatGptPairingSessionByPluginSessionSecret(sessionSecret: string): Promise<ChatGptPairingSession | null>;
  consumeChatGptPairingAuthorizationCode(code: string): Promise<ChatGptPairingSession | null>;
  updateChatGptPairingSession(
    pairingId: string,
    updates: Partial<Omit<ChatGptPairingSession, 'pairingId' | 'createdAt'>>
  ): Promise<ChatGptPairingSession>;
  listChatGptPairingSessions(limit?: number): Promise<ChatGptPairingSession[]>;

  // Audit and idempotency operations
  createAuditEvent(event: Omit<StoredAuditEvent, 'id' | 'createdAt'>): Promise<StoredAuditEvent>;
  createOrUpdateIdempotencyRecord(record: Omit<IdempotencyRecord, 'id'>): Promise<IdempotencyRecord>;
  getIdempotencyRecord(userId: string, tool: string, idempotencyKey: string): Promise<IdempotencyRecord | null>;

  // Public opaque media assets referenced by native RemNote rich text
  hostedMediaStorageDurability(): HostedMediaStorageDurability;
  createHostedMediaAsset(asset: HostedMediaAsset): Promise<{ asset: HostedMediaAsset; created: boolean }>;
  getHostedMediaAsset(assetId: string): Promise<HostedMediaAsset | null>;
  getHostedMediaAssetByIdempotency(ownerId: string, idempotencyKey: string): Promise<HostedMediaAsset | null>;
  deleteHostedMediaAsset(assetId: string, ownerId: string): Promise<boolean>;

  // Bulk import job durability
  bulkImportStorageDurability(): BulkImportJob['storageDurability'];
  saveBulkImportPlan(plan: BulkImportPlan): Promise<BulkImportPlan>;
  getBulkImportPlan(planId: string): Promise<BulkImportPlan | null>;
  saveBulkImportJob(job: BulkImportJob, options?: BulkImportJobSaveOptions): Promise<BulkImportJob>;
  getBulkImportJob(jobId: string): Promise<BulkImportJob | null>;

  // Lifecycle
  initialize(): Promise<void>;
  close(): Promise<void>;
}
