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
  | 'connector_compat_no_auth_tools'
  | 'hosted_oauth_required';

export interface BridgeRuntimeInfo {
  deploymentMode: BridgeDeploymentMode;
  toolCallAuthMode: ToolCallAuthMode;
  mcpDiscoveryAuth: 'no_auth_required';
  mcpToolCallAuth: ToolCallAuthMode;
  connectorCompatibilityMode: boolean;
  browserGetMcpIsNotConnectorTest: true;
  mcpEndpoint: string;
  bridgeEndpoint: string;
  hostedPairingEnabled: boolean;
  localTokenRequired: boolean;
  expectedPairingBehavior: string;
  gitCommit?: string;
  gitBranch?: string;
  deployCommit?: string;
  deployBranch?: string;
}

export interface BridgeTimeoutBudgets {
  defaultRequestTimeoutMs: number;
  highLevelWriteTimeoutMs: number;
  bulkStepTimeoutMs: number;
  readTimeoutMs: number;
  mutationTimeoutMs: number;
  writeApprovalTimeoutMs: number;
  reconnectRetryWindowMs: number;
  reconnectRetryIntervalMs: number;
}

export interface CompanionServerConfig {
  deploymentMode: BridgeDeploymentMode;
  hostedPairingEnabled: boolean;
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
  connectorCompatNoAuthTools: boolean;
  allowRemote: boolean;
  allowCors: boolean;
  enableDeleteTool: boolean;
  hostedMode: boolean;
  auditLog: boolean;
  allowedOrigins: string[];
  requestTimeoutMs: number;
  timeoutBudgets: BridgeTimeoutBudgets;
  maxBodyBytes: number;
  maxBridgeMessageBytes: number;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  gitCommit: string;
  gitBranch: string;
  deployCommit: string;
  deployBranch: string;
}

const DEFAULT_BRIDGE_PORT = 47391;
const DEFAULT_MCP_PORT = 47392;
const DEFAULT_REQUEST_TIMEOUT_MS = 120000;
export const DEFAULT_TIMEOUT_BUDGETS: BridgeTimeoutBudgets = {
  defaultRequestTimeoutMs: DEFAULT_REQUEST_TIMEOUT_MS,
  highLevelWriteTimeoutMs: 180000,
  bulkStepTimeoutMs: 240000,
  readTimeoutMs: 30000,
  mutationTimeoutMs: 60000,
  writeApprovalTimeoutMs: 30000,
  reconnectRetryWindowMs: 30000,
  reconnectRetryIntervalMs: 400,
};
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
  'Hosted deployment mode requires REMNOTE_BRIDGE_ENABLE_HOSTED_PAIRING=1.',
  'Without this explicit flag, the server stays in local bridge-token mode and ChatGPT OAuth pairing is disabled.',
].join(' ');

export const LOCAL_PAIRING_DISABLED_MESSAGE =
  'Server is in local-token mode. ChatGPT pairing is disabled. Use hosted mode for ChatGPT connector access.';

function numberFromEnv(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function boundedNumberFromEnv(
  value: string | undefined,
  fallback: number,
  min: number,
  max: number
): number {
  const parsed = numberFromEnv(value, fallback);
  if (!Number.isFinite(parsed) || parsed < min) {
    return fallback;
  }
  return Math.min(Math.floor(parsed), max);
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

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function publicEndpoint(publicBaseUrl: string, protocol: 'http' | 'ws', pathname: string): string {
  const url = new URL(publicBaseUrl);
  url.protocol =
    protocol === 'ws'
      ? url.protocol === 'http:'
        ? 'ws:'
        : 'wss:'
      : url.protocol === 'http:'
        ? 'http:'
        : 'https:';
  url.pathname = pathname;
  url.search = '';
  url.hash = '';
  return url.toString();
}

function defaultHostedAllowedOrigins(publicBaseUrl: string): string[] {
  const origins = new Set([
    'https://chatgpt.com',
    'https://chat.openai.com',
    'https://remnote.com',
    'https://www.remnote.com',
  ]);

  if (publicBaseUrl) {
    try {
      origins.add(new URL(publicBaseUrl).origin);
    } catch {
      // validateConfig reports invalid public URL in hosted mode.
    }
  }

  return [...origins];
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
  if (config.connectorCompatNoAuthTools) {
    return 'connector_compat_no_auth_tools';
  }

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

export function isHostedPairingEnabled(config: CompanionServerConfig): boolean {
  return config.deploymentMode === 'hosted' && config.hostedPairingEnabled;
}

export function getExpectedPairingBehavior(config: CompanionServerConfig): string {
  if (config.deploymentMode === 'local') {
    return LOCAL_PAIRING_DISABLED_MESSAGE;
  }

  return 'hosted ChatGPT OAuth/pairing token required; local bridge token is not used for MCP tool calls';
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
  if (config.publicBaseUrl) {
    const publicBaseUrl = trimTrailingSlash(config.publicBaseUrl);
    return {
      deploymentMode: config.deploymentMode,
      toolCallAuthMode: getToolCallAuthMode(config),
      mcpDiscoveryAuth: 'no_auth_required',
      mcpToolCallAuth: getToolCallAuthMode(config),
      connectorCompatibilityMode: config.connectorCompatNoAuthTools,
      browserGetMcpIsNotConnectorTest: true,
      mcpEndpoint: publicEndpoint(publicBaseUrl, 'http', config.mcpPath),
      bridgeEndpoint: publicEndpoint(publicBaseUrl, 'ws', config.bridgePath),
      hostedPairingEnabled: isHostedPairingEnabled(config),
      localTokenRequired: isLocalTokenRequired(config),
      expectedPairingBehavior: getExpectedPairingBehavior(config),
      gitCommit: config.gitCommit || undefined,
      gitBranch: config.gitBranch || undefined,
      deployCommit: config.deployCommit || config.gitCommit || undefined,
      deployBranch: config.deployBranch || config.gitBranch || undefined,
    };
  }

  const host = endpointHost(config, hostOverride);
  const httpProtocol = config.deploymentMode === 'hosted' || config.allowRemote ? 'https' : 'http';
  const wsProtocol = config.deploymentMode === 'hosted' || config.allowRemote ? 'wss' : 'ws';
  return {
    deploymentMode: config.deploymentMode,
    toolCallAuthMode: getToolCallAuthMode(config),
    mcpDiscoveryAuth: 'no_auth_required',
    mcpToolCallAuth: getToolCallAuthMode(config),
    connectorCompatibilityMode: config.connectorCompatNoAuthTools,
    browserGetMcpIsNotConnectorTest: true,
    mcpEndpoint: `${httpProtocol}://${host}:${ports.mcpPort}${config.mcpPath}`,
    bridgeEndpoint: `${wsProtocol}://${host}:${ports.bridgePort}${config.bridgePath}`,
    hostedPairingEnabled: isHostedPairingEnabled(config),
    localTokenRequired: isLocalTokenRequired(config),
    expectedPairingBehavior: getExpectedPairingBehavior(config),
    gitCommit: config.gitCommit || undefined,
    gitBranch: config.gitBranch || undefined,
    deployCommit: config.deployCommit || config.gitCommit || undefined,
    deployBranch: config.deployBranch || config.gitBranch || undefined,
  };
}

export function validateConfig(config: CompanionServerConfig): void {
  if (config.deploymentMode === 'hosted') {
    if (!config.hostedPairingEnabled) {
      throw new Error(HOSTED_MODE_NOT_IMPLEMENTED_MESSAGE);
    }
    if (!config.sessionSecret) {
      throw new Error('SESSION_SECRET or REMNOTE_BRIDGE_SESSION_SECRET is required in hosted pairing mode.');
    }
    if (config.publicBaseUrl) {
      try {
        new URL(config.publicBaseUrl);
      } catch {
        throw new Error('REMNOTE_BRIDGE_PUBLIC_BASE_URL must be an absolute http(s) URL.');
      }
    }
    if (config.allowedOrigins.length === 0) {
      throw new Error('Hosted pairing mode requires at least one allowed browser origin.');
    }
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
  const deploymentMode = deploymentModeFromEnv(env);
  const hostedPairingEnabled = boolFromEnv(env.REMNOTE_BRIDGE_ENABLE_HOSTED_PAIRING);
  const publicBaseUrl = env.REMNOTE_BRIDGE_PUBLIC_BASE_URL?.trim() || env.PUBLIC_BASE_URL?.trim() || '';
  const configuredAllowedOrigins = listFromEnv(env.REMNOTE_BRIDGE_ALLOWED_ORIGINS ?? env.ALLOWED_ORIGINS);
  const allowedOrigins =
    configuredAllowedOrigins.length > 0
      ? configuredAllowedOrigins
      : deploymentMode === 'hosted'
        ? defaultHostedAllowedOrigins(publicBaseUrl)
        : [];
  const allowRemote = boolFromEnv(env.REMNOTE_BRIDGE_ALLOW_REMOTE) || deploymentMode === 'hosted';
  const allowCors =
    boolFromEnv(env.REMNOTE_BRIDGE_ALLOW_CORS) || (deploymentMode === 'hosted' && allowedOrigins.length > 0);
  const allowNoToken =
    boolFromEnv(env.REMNOTE_BRIDGE_ALLOW_NO_TOKEN) ||
    (nodeEnv === 'development' && boolFromEnv(env.ALLOW_DEV_NO_AUTH));
  const connectorCompatNoAuthTools = boolFromEnv(env.REMNOTE_BRIDGE_CONNECTOR_COMPAT_NO_AUTH_TOOLS);
  const bridgeToken = env.REMNOTE_BRIDGE_TOKEN?.trim() ?? '';
  const bindHost = env.REMNOTE_BRIDGE_HOST?.trim() || '127.0.0.1';
  const singlePort = boolFromEnv(env.REMNOTE_BRIDGE_SINGLE_PORT);
  const port = numberFromEnv(env.PORT ?? env.REMNOTE_BRIDGE_PORT, DEFAULT_MCP_PORT);
  const timeoutBudgets: BridgeTimeoutBudgets = {
    defaultRequestTimeoutMs: boundedNumberFromEnv(
      env.REMNOTE_BRIDGE_DEFAULT_REQUEST_TIMEOUT_MS ?? env.REMNOTE_BRIDGE_TIMEOUT_MS,
      DEFAULT_TIMEOUT_BUDGETS.defaultRequestTimeoutMs,
      1000,
      300000
    ),
    highLevelWriteTimeoutMs: boundedNumberFromEnv(
      env.REMNOTE_BRIDGE_HIGH_LEVEL_WRITE_TIMEOUT_MS,
      DEFAULT_TIMEOUT_BUDGETS.highLevelWriteTimeoutMs,
      30000,
      300000
    ),
    bulkStepTimeoutMs: boundedNumberFromEnv(
      env.REMNOTE_BRIDGE_BULK_STEP_TIMEOUT_MS,
      DEFAULT_TIMEOUT_BUDGETS.bulkStepTimeoutMs,
      30000,
      300000
    ),
    readTimeoutMs: boundedNumberFromEnv(
      env.REMNOTE_BRIDGE_READ_TIMEOUT_MS,
      DEFAULT_TIMEOUT_BUDGETS.readTimeoutMs,
      1000,
      60000
    ),
    mutationTimeoutMs: boundedNumberFromEnv(
      env.REMNOTE_BRIDGE_MUTATION_TIMEOUT_MS,
      DEFAULT_TIMEOUT_BUDGETS.mutationTimeoutMs,
      10000,
      120000
    ),
    writeApprovalTimeoutMs: boundedNumberFromEnv(
      env.REMNOTE_BRIDGE_WRITE_APPROVAL_TIMEOUT_MS,
      DEFAULT_TIMEOUT_BUDGETS.writeApprovalTimeoutMs,
      5000,
      120000
    ),
    reconnectRetryWindowMs: boundedNumberFromEnv(
      env.REMNOTE_BRIDGE_RECONNECT_RETRY_WINDOW_MS,
      DEFAULT_TIMEOUT_BUDGETS.reconnectRetryWindowMs,
      1000,
      120000
    ),
    reconnectRetryIntervalMs: boundedNumberFromEnv(
      env.REMNOTE_BRIDGE_RECONNECT_RETRY_INTERVAL_MS,
      DEFAULT_TIMEOUT_BUDGETS.reconnectRetryIntervalMs,
      50,
      5000
    ),
  };

  const storageMode: CompanionServerConfig['storageMode'] =
    env.REMNOTE_BRIDGE_STORAGE === 'postgres' || env.REMNOTE_BRIDGE_STORAGE === 'memory'
      ? env.REMNOTE_BRIDGE_STORAGE
      : env.DATABASE_URL
        ? 'postgres'
        : 'memory';

  // Canonical URLs
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
    hostedPairingEnabled,
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
    connectorCompatNoAuthTools,
    allowRemote,
    allowCors,
    enableDeleteTool: boolFromEnv(env.REMNOTE_BRIDGE_ENABLE_DELETE_TOOL),
    hostedMode: deploymentMode === 'hosted',
    auditLog: env.REMNOTE_BRIDGE_AUDIT_LOG === undefined ? true : boolFromEnv(env.REMNOTE_BRIDGE_AUDIT_LOG),
    allowedOrigins,
    requestTimeoutMs: timeoutBudgets.defaultRequestTimeoutMs,
    timeoutBudgets,
    maxBodyBytes: numberFromEnv(env.REMNOTE_BRIDGE_MAX_BODY_BYTES, DEFAULT_MAX_BODY_BYTES),
    maxBridgeMessageBytes: numberFromEnv(
      env.REMNOTE_BRIDGE_MAX_WS_MESSAGE_BYTES,
      DEFAULT_MAX_BRIDGE_MESSAGE_BYTES
    ),
    rateLimitWindowMs: numberFromEnv(env.REMNOTE_BRIDGE_RATE_LIMIT_WINDOW_MS, DEFAULT_RATE_LIMIT_WINDOW_MS),
    rateLimitMaxRequests: numberFromEnv(env.REMNOTE_BRIDGE_RATE_LIMIT_MAX_REQUESTS, DEFAULT_RATE_LIMIT_MAX_REQUESTS),
    gitCommit:
      env.RENDER_GIT_COMMIT?.trim() ||
      env.GIT_COMMIT?.trim() ||
      env.COMMIT_SHA?.trim() ||
      env.SOURCE_VERSION?.trim() ||
      '',
    gitBranch:
      env.RENDER_GIT_BRANCH?.trim() ||
      env.GIT_BRANCH?.trim() ||
      env.BRANCH?.trim() ||
      '',
    deployCommit:
      env.RENDER_GIT_COMMIT?.trim() ||
      env.RENDER_COMMIT?.trim() ||
      '',
    deployBranch:
      env.RENDER_GIT_BRANCH?.trim() ||
      env.RENDER_BRANCH?.trim() ||
      '',
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
