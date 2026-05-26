import { randomUUID } from 'node:crypto';
import type {
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

export class PostgresStorageProvider implements StorageProvider {
  private pool: any = null;
  private databaseUrl: string;

  constructor(databaseUrl: string) {
    this.databaseUrl = databaseUrl;
  }

  async initialize(): Promise<void> {
    if (!this.databaseUrl) {
      throw new Error('Database URL is required for PostgreSQL storage.');
    }

    try {
      const moduleName = 'pg';
      const pgModule = await import(moduleName);
      const Pool = pgModule.default?.Pool || pgModule.Pool;
      if (!Pool) {
        throw new Error('Could not resolve Pool constructor from pg package.');
      }
      this.pool = new Pool({
        connectionString: this.databaseUrl,
        ssl: this.databaseUrl.includes('localhost') || this.databaseUrl.includes('127.0.0.1')
          ? false
          : { rejectUnauthorized: false },
      });

      // Assert connection
      await this.pool.query('SELECT 1');

      // Setup initial schema
      await this.createSchema();
    } catch (error: any) {
      throw new Error(`Failed to initialize PostgreSQL connection: ${error.message}. Ensure "pg" is installed in production.`);
    }
  }

  private async createSchema(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        access_token_hash VARCHAR(64) UNIQUE NOT NULL,
        access_token_expires_at TIMESTAMPTZ NOT NULL,
        refresh_token_hash VARCHAR(64) UNIQUE NOT NULL,
        refresh_token_expires_at TIMESTAMPTZ NOT NULL,
        remnote_api_key_hash VARCHAR(64),
        token_use VARCHAR(32),
        client_id VARCHAR(255),
        issuer TEXT,
        audience TEXT,
        scope_grants JSONB,
        revoked_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS pairing_challenges (
        pairing_code_hash VARCHAR(64) PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS mcp_clients (
        client_id VARCHAR(255) PRIMARY KEY,
        client_name TEXT,
        redirect_uris JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS mcp_authorization_codes (
        code_hash VARCHAR(64) PRIMARY KEY,
        client_id VARCHAR(255) NOT NULL,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        redirect_uri TEXT NOT NULL,
        code_challenge TEXT NOT NULL,
        code_challenge_method VARCHAR(16) NOT NULL,
        resource TEXT NOT NULL,
        scope_grants JSONB NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        consumed_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS audit_events (
        id UUID PRIMARY KEY,
        type TEXT NOT NULL,
        user_id UUID,
        device_id TEXT,
        session_id TEXT,
        tool TEXT,
        status TEXT,
        error_code TEXT,
        scope TEXT,
        permission_mode TEXT,
        created_rem_ids JSONB,
        updated_rem_ids JSONB,
        deleted_rem_ids JSONB,
        duration_ms INTEGER,
        created_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS idempotency_records (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL,
        tool TEXT NOT NULL,
        idempotency_key TEXT NOT NULL,
        target_root TEXT,
        request_hash VARCHAR(64) NOT NULL,
        status TEXT NOT NULL,
        created_rem_ids JSONB NOT NULL,
        updated_rem_ids JSONB NOT NULL,
        started_at TIMESTAMPTZ NOT NULL,
        finished_at TIMESTAMPTZ,
        error_code TEXT,
        UNIQUE (user_id, tool, idempotency_key)
      );
    `);

    await this.pool.query(`
      ALTER TABLE sessions ADD COLUMN IF NOT EXISTS token_use VARCHAR(32);
      ALTER TABLE sessions ADD COLUMN IF NOT EXISTS client_id VARCHAR(255);
      ALTER TABLE sessions ADD COLUMN IF NOT EXISTS issuer TEXT;
      ALTER TABLE sessions ADD COLUMN IF NOT EXISTS audience TEXT;
      ALTER TABLE sessions ADD COLUMN IF NOT EXISTS scope_grants JSONB;
      ALTER TABLE sessions ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;
    `);
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  // User operations
  async createUser(email: string): Promise<User> {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    await this.pool.query(
      'INSERT INTO users (id, email, created_at) VALUES ($1, $2, $3)',
      [id, email.toLowerCase(), createdAt]
    );
    return { id, email, createdAt };
  }

  async getUserById(id: string): Promise<User | null> {
    const res = await this.pool.query('SELECT id, email, created_at as "createdAt" FROM users WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const res = await this.pool.query('SELECT id, email, created_at as "createdAt" FROM users WHERE LOWER(email) = $1', [email.toLowerCase()]);
    return res.rows[0] || null;
  }

  // Session operations
  async createSession(sessionData: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>): Promise<Session> {
    const id = randomUUID();
    const now = new Date().toISOString();
    await this.pool.query(
      `INSERT INTO sessions (
        id, user_id, access_token_hash, access_token_expires_at, 
        refresh_token_hash, refresh_token_expires_at, remnote_api_key_hash, 
        token_use, client_id, issuer, audience, scope_grants, revoked_at,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        id,
        sessionData.userId,
        sessionData.accessTokenHash,
        sessionData.accessTokenExpiresAt,
        sessionData.refreshTokenHash,
        sessionData.refreshTokenExpiresAt,
        sessionData.remnoteApiKeyHash || null,
        sessionData.tokenUse ?? null,
        sessionData.clientId ?? null,
        sessionData.issuer ?? null,
        sessionData.audience ?? null,
        JSON.stringify(sessionData.scopeGrants ?? []),
        sessionData.revokedAt ?? null,
        now,
        now
      ]
    );
    return {
      id,
      ...sessionData,
      createdAt: now,
      updatedAt: now
    };
  }

  async getSessionById(id: string): Promise<Session | null> {
    const res = await this.pool.query(`${this.sessionSelectSql()} WHERE id = $1`, [id]);
    return this.sessionFromRow(res.rows[0]);
  }

  async getSessionByAccessToken(accessToken: string): Promise<Session | null> {
    const hash = hashToken(accessToken);
    const res = await this.pool.query(`${this.sessionSelectSql()} WHERE access_token_hash = $1 AND revoked_at IS NULL`, [hash]);
    return this.sessionFromRow(res.rows[0]);
  }

  async getSessionByRefreshToken(refreshToken: string): Promise<Session | null> {
    const hash = hashToken(refreshToken);
    const res = await this.pool.query(`${this.sessionSelectSql()} WHERE refresh_token_hash = $1 AND revoked_at IS NULL`, [hash]);
    return this.sessionFromRow(res.rows[0]);
  }

  async updateSession(
    id: string,
    updates: Partial<Omit<Session, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Session> {
    const selectRes = await this.pool.query('SELECT 1 FROM sessions WHERE id = $1', [id]);
    if (selectRes.rowCount === 0) {
      throw new Error(`Session with ID ${id} not found.`);
    }

    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.userId !== undefined) {
      setClauses.push(`user_id = $${paramIndex++}`);
      values.push(updates.userId);
    }
    if (updates.accessTokenHash !== undefined) {
      setClauses.push(`access_token_hash = $${paramIndex++}`);
      values.push(updates.accessTokenHash);
    }
    if (updates.accessTokenExpiresAt !== undefined) {
      setClauses.push(`access_token_expires_at = $${paramIndex++}`);
      values.push(updates.accessTokenExpiresAt);
    }
    if (updates.refreshTokenHash !== undefined) {
      setClauses.push(`refresh_token_hash = $${paramIndex++}`);
      values.push(updates.refreshTokenHash);
    }
    if (updates.refreshTokenExpiresAt !== undefined) {
      setClauses.push(`refresh_token_expires_at = $${paramIndex++}`);
      values.push(updates.refreshTokenExpiresAt);
    }
    if (updates.remnoteApiKeyHash !== undefined) {
      setClauses.push(`remnote_api_key_hash = $${paramIndex++}`);
      values.push(updates.remnoteApiKeyHash);
    }
    if (updates.tokenUse !== undefined) {
      setClauses.push(`token_use = $${paramIndex++}`);
      values.push(updates.tokenUse);
    }
    if (updates.clientId !== undefined) {
      setClauses.push(`client_id = $${paramIndex++}`);
      values.push(updates.clientId);
    }
    if (updates.issuer !== undefined) {
      setClauses.push(`issuer = $${paramIndex++}`);
      values.push(updates.issuer);
    }
    if (updates.audience !== undefined) {
      setClauses.push(`audience = $${paramIndex++}`);
      values.push(updates.audience);
    }
    if (updates.scopeGrants !== undefined) {
      setClauses.push(`scope_grants = $${paramIndex++}`);
      values.push(JSON.stringify(updates.scopeGrants));
    }
    if (updates.revokedAt !== undefined) {
      setClauses.push(`revoked_at = $${paramIndex++}`);
      values.push(updates.revokedAt);
    }

    const now = new Date().toISOString();
    setClauses.push(`updated_at = $${paramIndex++}`);
    values.push(now);

    values.push(id);
    const query = `UPDATE sessions SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const res = await this.pool.query(query, values);
    return this.sessionFromRow(res.rows[0])!;
  }

  async deleteSession(id: string): Promise<void> {
    await this.pool.query('DELETE FROM sessions WHERE id = $1', [id]);
  }

  // Pairing challenge operations
  async createPairingChallenge(challenge: PairingChallenge): Promise<void> {
    await this.pool.query(
      `INSERT INTO pairing_challenges (pairing_code_hash, user_id, status, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        challenge.pairingCodeHash,
        challenge.userId,
        challenge.status,
        challenge.expiresAt,
        challenge.createdAt,
      ]
    );
  }

  async getPairingChallenge(pairingCode: string): Promise<PairingChallenge | null> {
    const hash = hashToken(pairingCode);
    const res = await this.pool.query(
      `SELECT 
        pairing_code_hash as "pairingCodeHash", user_id as "userId", 
        status, expires_at as "expiresAt", created_at as "createdAt"
      FROM pairing_challenges WHERE pairing_code_hash = $1`,
      [hash]
    );
    if (!res.rows[0]) return null;
    const row = res.rows[0];
    return {
      ...row,
      expiresAt: row.expiresAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
    };
  }

  async updatePairingChallengeStatus(pairingCode: string, status: PairingChallenge['status']): Promise<void> {
    const hash = hashToken(pairingCode);
    await this.pool.query(
      'UPDATE pairing_challenges SET status = $1 WHERE pairing_code_hash = $2',
      [status, hash]
    );
  }

  async upsertMcpClient(client: McpClient): Promise<McpClient> {
    await this.pool.query(
      `INSERT INTO mcp_clients (client_id, client_name, redirect_uris, created_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (client_id) DO UPDATE SET
         client_name = EXCLUDED.client_name,
         redirect_uris = EXCLUDED.redirect_uris`,
      [client.clientId, client.clientName ?? null, JSON.stringify(client.redirectUris), client.createdAt]
    );
    return client;
  }

  async getMcpClient(clientId: string): Promise<McpClient | null> {
    const res = await this.pool.query(
      'SELECT client_id, client_name, redirect_uris, created_at FROM mcp_clients WHERE client_id = $1',
      [clientId]
    );
    const row = res.rows[0];
    if (!row) {
      return null;
    }
    return {
      clientId: row.client_id,
      clientName: row.client_name ?? undefined,
      redirectUris: Array.isArray(row.redirect_uris) ? row.redirect_uris : [],
      createdAt: row.created_at.toISOString(),
    };
  }

  async createMcpAuthorizationCode(code: McpAuthorizationCode): Promise<void> {
    await this.pool.query(
      `INSERT INTO mcp_authorization_codes (
        code_hash, client_id, user_id, redirect_uri, code_challenge, code_challenge_method,
        resource, scope_grants, expires_at, created_at, consumed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        code.codeHash,
        code.clientId,
        code.userId,
        code.redirectUri,
        code.codeChallenge,
        code.codeChallengeMethod,
        code.resource,
        JSON.stringify(code.scopeGrants),
        code.expiresAt,
        code.createdAt,
        code.consumedAt ?? null,
      ]
    );
  }

  async consumeMcpAuthorizationCode(code: string): Promise<McpAuthorizationCode | null> {
    const codeHash = hashToken(code);
    const res = await this.pool.query(
      `UPDATE mcp_authorization_codes
       SET consumed_at = COALESCE(consumed_at, NOW())
       WHERE code_hash = $1 AND consumed_at IS NULL
       RETURNING *`,
      [codeHash]
    );
    const row = res.rows[0];
    if (!row) {
      return null;
    }
    return {
      codeHash: row.code_hash,
      clientId: row.client_id,
      userId: row.user_id,
      redirectUri: row.redirect_uri,
      codeChallenge: row.code_challenge,
      codeChallengeMethod: 'S256',
      resource: row.resource,
      scopeGrants: Array.isArray(row.scope_grants) ? row.scope_grants : [],
      expiresAt: row.expires_at.toISOString(),
      createdAt: row.created_at.toISOString(),
      consumedAt: row.consumed_at?.toISOString(),
    };
  }

  async createAuditEvent(event: Omit<StoredAuditEvent, 'id' | 'createdAt'>): Promise<StoredAuditEvent> {
    const stored: StoredAuditEvent = {
      id: randomUUID(),
      ...event,
      createdAt: new Date().toISOString(),
    };
    await this.pool.query(
      `INSERT INTO audit_events (
        id, type, user_id, device_id, session_id, tool, status, error_code, scope,
        permission_mode, created_rem_ids, updated_rem_ids, deleted_rem_ids, duration_ms, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        stored.id,
        stored.type,
        stored.userId ?? null,
        stored.deviceId ?? null,
        stored.sessionId ?? null,
        stored.tool ?? null,
        stored.status ?? null,
        stored.errorCode ?? null,
        stored.scope ?? null,
        stored.permissionMode ?? null,
        JSON.stringify(stored.createdRemIds ?? []),
        JSON.stringify(stored.updatedRemIds ?? []),
        JSON.stringify(stored.deletedRemIds ?? []),
        stored.durationMs ?? null,
        stored.createdAt,
      ]
    );
    return stored;
  }

  async createOrUpdateIdempotencyRecord(record: Omit<IdempotencyRecord, 'id'>): Promise<IdempotencyRecord> {
    const id = randomUUID();
    const res = await this.pool.query(
      `INSERT INTO idempotency_records (
        id, user_id, tool, idempotency_key, target_root, request_hash, status,
        created_rem_ids, updated_rem_ids, started_at, finished_at, error_code
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (user_id, tool, idempotency_key) DO UPDATE SET
        target_root = EXCLUDED.target_root,
        request_hash = EXCLUDED.request_hash,
        status = EXCLUDED.status,
        created_rem_ids = EXCLUDED.created_rem_ids,
        updated_rem_ids = EXCLUDED.updated_rem_ids,
        finished_at = EXCLUDED.finished_at,
        error_code = EXCLUDED.error_code
      RETURNING *`,
      [
        id,
        record.userId,
        record.tool,
        record.idempotencyKey,
        record.targetRoot ?? null,
        record.requestHash,
        record.status,
        JSON.stringify(record.createdRemIds),
        JSON.stringify(record.updatedRemIds),
        record.startedAt,
        record.finishedAt ?? null,
        record.errorCode ?? null,
      ]
    );
    return this.idempotencyFromRow(res.rows[0]);
  }

  async getIdempotencyRecord(
    userId: string,
    tool: string,
    idempotencyKey: string
  ): Promise<IdempotencyRecord | null> {
    const res = await this.pool.query(
      `SELECT * FROM idempotency_records WHERE user_id = $1 AND tool = $2 AND idempotency_key = $3`,
      [userId, tool, idempotencyKey]
    );
    return res.rows[0] ? this.idempotencyFromRow(res.rows[0]) : null;
  }

  private sessionSelectSql(): string {
    return `SELECT
      id, user_id, access_token_hash, access_token_expires_at,
      refresh_token_hash, refresh_token_expires_at, remnote_api_key_hash,
      token_use, client_id, issuer, audience, scope_grants, revoked_at,
      created_at, updated_at
      FROM sessions`;
  }

  private sessionFromRow(row: any): Session | null {
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      userId: row.user_id,
      accessTokenHash: row.access_token_hash,
      accessTokenExpiresAt: row.access_token_expires_at.toISOString(),
      refreshTokenHash: row.refresh_token_hash,
      refreshTokenExpiresAt: row.refresh_token_expires_at.toISOString(),
      remnoteApiKeyHash: row.remnote_api_key_hash || undefined,
      tokenUse: row.token_use ?? undefined,
      clientId: row.client_id ?? undefined,
      issuer: row.issuer ?? undefined,
      audience: row.audience ?? undefined,
      scopeGrants: Array.isArray(row.scope_grants) ? row.scope_grants : undefined,
      revokedAt: row.revoked_at?.toISOString(),
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  private idempotencyFromRow(row: any): IdempotencyRecord {
    return {
      id: row.id,
      userId: row.user_id,
      tool: row.tool,
      idempotencyKey: row.idempotency_key,
      targetRoot: row.target_root ?? undefined,
      requestHash: row.request_hash,
      status: row.status,
      createdRemIds: Array.isArray(row.created_rem_ids) ? row.created_rem_ids : [],
      updatedRemIds: Array.isArray(row.updated_rem_ids) ? row.updated_rem_ids : [],
      startedAt: row.started_at.toISOString(),
      finishedAt: row.finished_at?.toISOString(),
      errorCode: row.error_code ?? undefined,
    };
  }
}
