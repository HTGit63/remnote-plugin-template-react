export interface CompanionServerConfig {
  bindHost: string;
  bridgePort: number;
  mcpPort: number;
  bridgePath: string;
  mcpPath: string;
  bridgeToken: string;
  allowNoToken: boolean;
  allowRemote: boolean;
  allowCors: boolean;
  allowedOrigins: string[];
  requestTimeoutMs: number;
  maxBodyBytes: number;
}

const DEFAULT_BRIDGE_PORT = 47391;
const DEFAULT_MCP_PORT = 47392;
const DEFAULT_REQUEST_TIMEOUT_MS = 120000;
const DEFAULT_MAX_BODY_BYTES = 128 * 1024;

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
  if ((config.allowRemote || config.allowCors) && !config.bridgeToken) {
    throw new Error('REMNOTE_BRIDGE_TOKEN is required when remote access or CORS is enabled.');
  }

  if (!config.bridgeToken && !config.allowNoToken) {
    throw new Error('REMNOTE_BRIDGE_TOKEN is required. Set REMNOTE_BRIDGE_ALLOW_NO_TOKEN=1 only for isolated local development.');
  }

  if (config.allowCors && config.allowedOrigins.length === 0) {
    throw new Error('REMNOTE_BRIDGE_ALLOWED_ORIGINS is required when CORS is enabled.');
  }

  if (!config.allowRemote && config.bindHost !== '127.0.0.1' && config.bindHost !== 'localhost') {
    throw new Error('Remote bind blocked. Set REMNOTE_BRIDGE_ALLOW_REMOTE=1 and REMNOTE_BRIDGE_TOKEN to override.');
  }
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): CompanionServerConfig {
  const allowRemote = boolFromEnv(env.REMNOTE_BRIDGE_ALLOW_REMOTE);
  const allowCors = boolFromEnv(env.REMNOTE_BRIDGE_ALLOW_CORS);
  const allowNoToken = boolFromEnv(env.REMNOTE_BRIDGE_ALLOW_NO_TOKEN);
  const bridgeToken = env.REMNOTE_BRIDGE_TOKEN?.trim() ?? '';
  const bindHost = env.REMNOTE_BRIDGE_HOST?.trim() || '127.0.0.1';
  const config = {
    bindHost,
    bridgePort: numberFromEnv(env.REMNOTE_BRIDGE_WS_PORT, DEFAULT_BRIDGE_PORT),
    mcpPort: numberFromEnv(env.REMNOTE_BRIDGE_MCP_PORT, DEFAULT_MCP_PORT),
    bridgePath: env.REMNOTE_BRIDGE_WS_PATH?.trim() || '/remnote-bridge',
    mcpPath: env.REMNOTE_BRIDGE_MCP_PATH?.trim() || '/mcp',
    bridgeToken,
    allowNoToken,
    allowRemote,
    allowCors,
    allowedOrigins: listFromEnv(env.REMNOTE_BRIDGE_ALLOWED_ORIGINS),
    requestTimeoutMs: numberFromEnv(env.REMNOTE_BRIDGE_TIMEOUT_MS, DEFAULT_REQUEST_TIMEOUT_MS),
    maxBodyBytes: numberFromEnv(env.REMNOTE_BRIDGE_MAX_BODY_BYTES, DEFAULT_MAX_BODY_BYTES),
  };
  return config;
}
