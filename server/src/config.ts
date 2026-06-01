import {
  DEFAULT_TOOL_PROFILE,
  normalizeToolProfile,
  type ToolProfile,
} from './tool-policy.js';

export type BridgeDeploymentMode =
  | 'local'
  | 'hosted';

export type ToolCallAuthMode =
  | 'no_auth_allowed'
  | 'local_bearer_required'
  | 'hosted_oauth_required';

export interface BridgeRuntimeInfo {
  deploymentMode: BridgeDeploymentMode;
  toolCallAuthMode: ToolCallAuthMode;
  mcpEndpoint: string;
  bridgeEndpoint: string;
  hostedPairingEnabled: boolean;
  localTokenRequired: boolean;
  expectedPairingBehavior: string;
}

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

export const HOSTED_MODE_NOT_IMPLEMENTED_MESSAGE = [
  'Hosted deployment mode is disabled for this local-token bridge.',
  'Do not set REMNOTE_BRIDGE_HOSTED_MODE=1 or REMNOTE_BRIDGE_DEPLOYMENT_MODE=hosted/public_hosted_oauth/personal_hosted_token until real hosted pairing is implemented.',
  'Future hosted mode must include OAuth user identity, pairing code/device registration, persistent user-session/device-session storage, MCP caller user to active RemNote plugin WebSocket routing, revocation and audit logging, and NO_PAIRED_PLUGIN_SESSION errors only in hosted mode.',
].join(' ');

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

function deploymentModeFromEnv(env: NodeJS.ProcessEnv): BridgeDeploymentMode {
  const rawMode = env.REMNOTE_BRIDGE_DEPLOYMENT_MODE?.trim();
  const hostedModeRequested = boolFromEnv(env.REMNOTE_BRIDGE_HOSTED_MODE);

  if (hostedModeRequested) {
    return 'hosted';
  }

  if (!rawMode) {
    return 'local';
  }

  if (rawMode === 'local' || rawMode === 'local_dev') {
    return 'local';
  }

  if (rawMode === 'hosted' || rawMode === 'personal_hosted_token' || rawMode === 'public_hosted_oauth') {
    return 'hosted';
  }

  throw new Error(
    `REMNOTE_BRIDGE_DEPLOYMENT_MODE must be "local" or "hosted". Received: ${rawMode}`
  );
}

export function getToolCallAuthMode(config: CompanionServerConfig): ToolCallAuthMode {
  if (config.deploymentMode === 'hosted') {
    return 'hosted_oauth_required';
  }

  return config.bridgeToken && !config.allowNoToken
    ? 'local_bearer_required'
    : 'no_auth_allowed';
}

export function isLocalTokenRequired(config: CompanionServerConfig): boolean {
  return config.deploymentMode === 'local' && Boolean(config.bridgeToken) && !config.allowNoToken;
}

export function isHostedPairingEnabled(_config: CompanionServerConfig): boolean {
  return false;
}

export function getExpectedPairingBehavior(config: CompanionServerConfig): string {
  if (config.deploymentMode === 'local') {
    return 'local bridge token only; no hosted user pairing';
  }

  return 'hosted user pairing required; unavailable until hosted mode is implemented';
}

function endpointHost(config: CompanionServerConfig, hostOverride?: string): string {
  if (hostOverride) {
    return hostOverride;
  }
  if (config.bindHost === '0.0.0.0' || config.bindHost === '::') {
    return '127.0.0.1';
  }
  return config.bindHost;
}

export function getRuntimeInfo(
  config: CompanionServerConfig,
  ports: { mcpPort: number; bridgePort: number },
  hostOverride?: string
): BridgeRuntimeInfo {
  const host = endpointHost(config, hostOverride);
  const httpProtocol = config.deploymentMode === 'hosted' || config.allowRemote ? 'https' : 'http';
  const wsProtocol = config.deploymentMode === 'hosted' || config.allowRemote ? 'wss' : 'ws';
  return {
    deploymentMode: config.deploymentMode,
    toolCallAuthMode: getToolCallAuthMode(config),
    mcpEndpoint: `${httpProtocol}://${host}:${ports.mcpPort}${config.mcpPath}`,
    bridgeEndpoint: `${wsProtocol}://${host}:${ports.bridgePort}${config.bridgePath}`,
    hostedPairingEnabled: isHostedPairingEnabled(config),
    localTokenRequired: isLocalTokenRequired(config),
    expectedPairingBehavior: getExpectedPairingBehavior(config),
  };
}

export function validateConfig(config: CompanionServerConfig): void {
  if (config.deploymentMode === 'hosted') {
    throw new Error(HOSTED_MODE_NOT_IMPLEMENTED_MESSAGE);
  }

  if (config.deploymentMode === 'local') {
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

  const storageMode: CompanionServerConfig['storageMode'] =
    env.REMNOTE_BRIDGE_STORAGE === 'postgres' || env.REMNOTE_BRIDGE_STORAGE === 'memory'
      ? env.REMNOTE_BRIDGE_STORAGE
      : env.DATABASE_URL
        ? 'postgres'
        : 'memory';

  const deploymentMode = deploymentModeFromEnv(env);

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
    hostedMode: deploymentMode === 'hosted',
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
