import {
  DEFAULT_TOOL_PROFILE,
  normalizeToolProfile,
  type ToolProfile,
} from './tool-policy.js';

export type BridgeDeploymentMode =
  | 'local_dev'
  | 'personal_hosted_token'
  | 'public_hosted_oauth';

export interface CompanionServerConfig {
  deploymentMode: BridgeDeploymentMode;
  storageMode: 'memory' | 'postgres';
  publicBaseUrl: string;
  mcpResource: string;
  dashboardUrl: string;
  databaseUrl: string;
  oauthIssuer: string;
  oauthAccessTokenTtlSeconds: number;
  oauthRefreshTokenTtlSeconds: number;
  oauthClientId: string;
  oauthClientSecret: string;
  oauthAuthUrl: string;
  oauthTokenUrl: string;
  oauthUserinfoUrl: string;
  oauthProvider: string;
  sessionSecret: string;
  adminDebugSecret: string;
  pairingCodeTtlSeconds: number;
  authorizationCodeTtlSeconds: number;
  nodeEnv: string;
  logLevel: string;
  redactSecretsInLogs: boolean;
  pluginHeartbeatIntervalSeconds: number;
  pluginHeartbeatTimeoutSeconds: number;

  bindHost: string;
  port: number;
  bridgePort: number;
  mcpPort: number;
  singlePort: boolean;
  bridgePath: string;
  mcpPath: string;
  bridgeToken: string;
  toolProfile: ToolProfile;
  allowNoToken: boolean;
  allowRemote: boolean;
  allowCors: boolean;
  enableDeleteTool: boolean;
  hostedMode: boolean;
  auditLog: boolean;
  allowedOrigins: string[];
  requestTimeoutMs: number;
  maxBodyBytes: number;
  maxBridgeMessageBytes: number;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}

const DEFAULT_BRIDGE_PORT = 47391;
const DEFAULT_MCP_PORT = 47392;
const DEFAULT_REQUEST_TIMEOUT_MS = 120000;
const DEFAULT_MAX_BODY_BYTES = 128 * 1024;
const DEFAULT_MAX_BRIDGE_MESSAGE_BYTES = 2 * 1024 * 1024;
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;
const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 120;
const DEFAULT_OAUTH_ACCESS_TOKEN_TTL_SECONDS = 900;
const DEFAULT_OAUTH_REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 3600;
const DEFAULT_PAIRING_CODE_TTL_SECONDS = 600;
const DEFAULT_AUTHORIZATION_CODE_TTL_SECONDS = 300;
const DEFAULT_PLUGIN_HEARTBEAT_INTERVAL_SECONDS = 30;
const DEFAULT_PLUGIN_HEARTBEAT_TIMEOUT_SECONDS = 90;

function numberFromEnv(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function boolFromEnv(value: string | undefined): boolean {
  return value === '1' || value === 'true' || value === 'yes';
}

function listFromEnv(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function validateConfig(config: CompanionServerConfig): void {
  if (config.deploymentMode === 'public_hosted_oauth') {
    const publicBaseIsLoopback =
      config.publicBaseUrl.startsWith('http://127.0.0.1') ||
      config.publicBaseUrl.startsWith('http://localhost');
    if (!config.publicBaseUrl) {
      throw new Error('public_hosted_oauth mode requires REMNOTE_BRIDGE_PUBLIC_BASE_URL.');
    }
    if (!config.mcpResource) {
      throw new Error('public_hosted_oauth mode requires REMNOTE_BRIDGE_MCP_RESOURCE.');
    }
    if (!config.publicBaseUrl.startsWith('https://') && !(config.allowNoToken && publicBaseIsLoopback)) {
      throw new Error(
        `public_hosted_oauth mode requires an HTTPS public base URL. Current: ${config.publicBaseUrl}`
      );
    }
    if (config.storageMode !== 'postgres' && !(config.allowNoToken && publicBaseIsLoopback)) {
      throw new Error(
        'public_hosted_oauth mode requires REMNOTE_BRIDGE_STORAGE=postgres. Memory storage is allowed only for loopback smoke tests with REMNOTE_BRIDGE_ALLOW_NO_TOKEN=1.'
      );
    }
    if (config.storageMode === 'postgres' && !config.databaseUrl) {
      throw new Error('public_hosted_oauth mode requires DATABASE_URL.');
    }
    if (config.bridgeToken) {
      throw new Error('public_hosted_oauth mode must not use REMNOTE_BRIDGE_TOKEN as public MCP auth.');
    }
    if (!config.sessionSecret && !(config.allowNoToken && publicBaseIsLoopback)) {
      throw new Error('public_hosted_oauth mode requires SESSION_SECRET or REMNOTE_BRIDGE_SESSION_SECRET.');
    }
  }

  if (config.deploymentMode === 'personal_hosted_token') {
    if (config.bindHost !== '0.0.0.0') {
      throw new Error(
        `personal_hosted_token mode must bind to 0.0.0.0 to accept remote connections. Current bind: ${config.bindHost}`
      );
    }
    if (!config.publicBaseUrl.startsWith('https://')) {
      throw new Error(
        `personal_hosted_token mode must use an HTTPS public base URL. Current: ${config.publicBaseUrl}`
      );
    }
    if (!config.bridgeToken) {
      throw new Error(
        'personal_hosted_token mode requires a secure REMNOTE_BRIDGE_TOKEN.'
      );
    }
    if (!config.allowCors || config.allowedOrigins.length === 0) {
      throw new Error(
        'personal_hosted_token mode must allow only configured CORS origins. Set REMNOTE_BRIDGE_ALLOW_CORS=1 and configure REMNOTE_BRIDGE_ALLOWED_ORIGINS.'
      );
    }
  }

  if (config.deploymentMode === 'local_dev') {
    if (!config.bridgeToken && !config.allowNoToken) {
      throw new Error(
        'REMNOTE_BRIDGE_TOKEN is required. Set REMNOTE_BRIDGE_ALLOW_NO_TOKEN=1 only for isolated local development.'
      );
    }
    if ((config.allowRemote || config.allowCors) && !config.bridgeToken) {
      throw new Error(
        'REMNOTE_BRIDGE_TOKEN is required when remote access or CORS is enabled.'
      );
    }
    if (config.allowCors && config.allowedOrigins.length === 0) {
      throw new Error(
        'REMNOTE_BRIDGE_ALLOWED_ORIGINS is required when CORS is enabled.'
      );
    }
    if (!config.allowRemote && config.bindHost !== '127.0.0.1' && config.bindHost !== 'localhost') {
      throw new Error(
        'Remote bind blocked. Set REMNOTE_BRIDGE_ALLOW_REMOTE=1 and REMNOTE_BRIDGE_TOKEN to override.'
      );
    }
  }
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): CompanionServerConfig {
  const nodeEnv = env.NODE_ENV?.trim() || 'development';
  const allowRemote = boolFromEnv(env.REMNOTE_BRIDGE_ALLOW_REMOTE);
  const allowCors = boolFromEnv(env.REMNOTE_BRIDGE_ALLOW_CORS);
  const allowNoToken =
    boolFromEnv(env.REMNOTE_BRIDGE_ALLOW_NO_TOKEN) ||
    (nodeEnv === 'development' && boolFromEnv(env.ALLOW_DEV_NO_AUTH));
  const bridgeToken = env.REMNOTE_BRIDGE_TOKEN?.trim() ?? '';
  const bindHost = env.REMNOTE_BRIDGE_HOST?.trim() || '127.0.0.1';
  const singlePort = boolFromEnv(env.REMNOTE_BRIDGE_SINGLE_PORT);
  const port = numberFromEnv(env.PORT ?? env.REMNOTE_BRIDGE_PORT, DEFAULT_MCP_PORT);

  const hostedMode = boolFromEnv(env.REMNOTE_BRIDGE_HOSTED_MODE);
  const storageMode: CompanionServerConfig['storageMode'] =
    env.REMNOTE_BRIDGE_STORAGE === 'postgres' || env.REMNOTE_BRIDGE_STORAGE === 'memory'
      ? env.REMNOTE_BRIDGE_STORAGE
      : env.DATABASE_URL
        ? 'postgres'
        : 'memory';

  // Explicit deployment mode parsing
  let deploymentMode: BridgeDeploymentMode = 'local_dev';
  const rawMode = env.REMNOTE_BRIDGE_DEPLOYMENT_MODE?.trim();
  if (rawMode === 'local_dev' || rawMode === 'personal_hosted_token' || rawMode === 'public_hosted_oauth') {
    deploymentMode = rawMode;
  } else if (hostedMode) {
    deploymentMode = 'personal_hosted_token';
  }

  // Canonical URLs
  const publicBaseUrl = env.REMNOTE_BRIDGE_PUBLIC_BASE_URL?.trim() || env.PUBLIC_BASE_URL?.trim() || '';
  const mcpServerUrl = env.MCP_SERVER_URL?.trim() || '';
  const mcpResource = env.REMNOTE_BRIDGE_MCP_RESOURCE?.trim() || mcpServerUrl || publicBaseUrl;
  const dashboardUrl = env.REMNOTE_BRIDGE_DASHBOARD_URL?.trim() || (publicBaseUrl ? `${publicBaseUrl}/dashboard` : '');

  // Persistent storage & OAuth placeholder variables
  const databaseUrl = env.DATABASE_URL?.trim() || '';
  const oauthIssuer = env.REMNOTE_BRIDGE_OAUTH_ISSUER?.trim() || env.OAUTH_ISSUER?.trim() || publicBaseUrl;
  const oauthAccessTokenTtlSeconds = numberFromEnv(
    env.REMNOTE_BRIDGE_OAUTH_ACCESS_TOKEN_TTL_SECONDS ?? env.ACCESS_TOKEN_TTL_SECONDS,
    DEFAULT_OAUTH_ACCESS_TOKEN_TTL_SECONDS
  );
  const oauthRefreshTokenTtlSeconds = numberFromEnv(
    env.REMNOTE_BRIDGE_OAUTH_REFRESH_TOKEN_TTL_SECONDS ?? env.REFRESH_TOKEN_TTL_SECONDS,
    DEFAULT_OAUTH_REFRESH_TOKEN_TTL_SECONDS
  );
  const oauthClientId = env.REMNOTE_BRIDGE_OAUTH_CLIENT_ID?.trim() || '';
  const oauthClientSecret = env.REMNOTE_BRIDGE_OAUTH_CLIENT_SECRET?.trim() || '';
  const oauthAuthUrl = env.REMNOTE_BRIDGE_OAUTH_AUTH_URL?.trim() || '';
  const oauthTokenUrl = env.REMNOTE_BRIDGE_OAUTH_TOKEN_URL?.trim() || '';
  const oauthUserinfoUrl = env.REMNOTE_BRIDGE_OAUTH_USERINFO_URL?.trim() || '';
  const oauthProvider = env.REMNOTE_BRIDGE_OAUTH_PROVIDER?.trim() || 'google';
  const sessionSecret = env.REMNOTE_BRIDGE_SESSION_SECRET?.trim() || env.SESSION_SECRET?.trim() || '';
  const adminDebugSecret = env.ADMIN_DEBUG_SECRET?.trim() || env.REMNOTE_BRIDGE_ADMIN_DEBUG_SECRET?.trim() || '';

  const config = {
    deploymentMode,
    storageMode,
    publicBaseUrl,
    mcpResource,
    dashboardUrl,
    databaseUrl,
    oauthIssuer,
    oauthAccessTokenTtlSeconds,
    oauthRefreshTokenTtlSeconds,
    oauthClientId,
    oauthClientSecret,
    oauthAuthUrl,
    oauthTokenUrl,
    oauthUserinfoUrl,
    oauthProvider,

    bindHost,
    port,
    bridgePort: numberFromEnv(env.REMNOTE_BRIDGE_WS_PORT, DEFAULT_BRIDGE_PORT),
    mcpPort: numberFromEnv(env.REMNOTE_BRIDGE_MCP_PORT, DEFAULT_MCP_PORT),
    singlePort,
    bridgePath: env.REMNOTE_BRIDGE_WS_PATH?.trim() || env.PLUGIN_WS_PATH?.trim() || '/remnote-bridge',
    mcpPath: env.REMNOTE_BRIDGE_MCP_PATH?.trim() || '/mcp',
    bridgeToken,
    toolProfile: normalizeToolProfile(env.REMNOTE_BRIDGE_TOOL_PROFILE ?? DEFAULT_TOOL_PROFILE),
    allowNoToken,
    allowRemote,
    allowCors,
    enableDeleteTool: boolFromEnv(env.REMNOTE_BRIDGE_ENABLE_DELETE_TOOL),
    hostedMode,
    auditLog: env.REMNOTE_BRIDGE_AUDIT_LOG === undefined ? true : boolFromEnv(env.REMNOTE_BRIDGE_AUDIT_LOG),
    allowedOrigins: listFromEnv(env.REMNOTE_BRIDGE_ALLOWED_ORIGINS ?? env.ALLOWED_ORIGINS),
    requestTimeoutMs: numberFromEnv(env.REMNOTE_BRIDGE_TIMEOUT_MS, DEFAULT_REQUEST_TIMEOUT_MS),
    maxBodyBytes: numberFromEnv(env.REMNOTE_BRIDGE_MAX_BODY_BYTES, DEFAULT_MAX_BODY_BYTES),
    maxBridgeMessageBytes: numberFromEnv(
      env.REMNOTE_BRIDGE_MAX_WS_MESSAGE_BYTES,
      DEFAULT_MAX_BRIDGE_MESSAGE_BYTES
    ),
    rateLimitWindowMs: numberFromEnv(env.REMNOTE_BRIDGE_RATE_LIMIT_WINDOW_MS, DEFAULT_RATE_LIMIT_WINDOW_MS),
    rateLimitMaxRequests: numberFromEnv(env.REMNOTE_BRIDGE_RATE_LIMIT_MAX_REQUESTS, DEFAULT_RATE_LIMIT_MAX_REQUESTS),
    sessionSecret,
    adminDebugSecret,
    pairingCodeTtlSeconds: numberFromEnv(env.PAIRING_CODE_TTL_SECONDS, DEFAULT_PAIRING_CODE_TTL_SECONDS),
    authorizationCodeTtlSeconds: numberFromEnv(
      env.AUTHORIZATION_CODE_TTL_SECONDS,
      DEFAULT_AUTHORIZATION_CODE_TTL_SECONDS
    ),
    nodeEnv,
    logLevel: env.LOG_LEVEL?.trim() || 'info',
    redactSecretsInLogs: env.REDACT_SECRETS_IN_LOGS === undefined ? true : boolFromEnv(env.REDACT_SECRETS_IN_LOGS),
    pluginHeartbeatIntervalSeconds: numberFromEnv(
      env.PLUGIN_HEARTBEAT_INTERVAL_SECONDS,
      DEFAULT_PLUGIN_HEARTBEAT_INTERVAL_SECONDS
    ),
    pluginHeartbeatTimeoutSeconds: numberFromEnv(
      env.PLUGIN_HEARTBEAT_TIMEOUT_SECONDS,
      DEFAULT_PLUGIN_HEARTBEAT_TIMEOUT_SECONDS
    ),
  };
  return config;
}
