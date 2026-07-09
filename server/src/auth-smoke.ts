import { startCompanionApp } from './app.js';
import {
  HOSTED_MODE_NOT_IMPLEMENTED_MESSAGE,
  loadConfig,
  validateConfig,
} from './config.js';
import { validateMcpToolPermission } from './tool-permissions.js';
import type { AuthenticatedPrincipal } from './auth/types.js';

function assertHostedGuard(error: unknown, label: string): void {
  const message = error instanceof Error ? error.message : String(error);
  if (!message.includes(HOSTED_MODE_NOT_IMPLEMENTED_MESSAGE)) {
    throw new Error(`${label} did not fail with hosted mode guard. Received: ${message}`);
  }
}

function toolCall(name: string, args: Record<string, unknown>) {
  return {
    method: 'tools/call',
    params: { name, arguments: args },
  };
}

function scopePrincipal(authMode: 'local_bridge_token' | 'hosted_oauth'): AuthenticatedPrincipal {
  return {
    subject: `scope-smoke:${authMode}`,
    userId: 'scope-smoke',
    authMode,
    scopeGrants: ['bridge:read', 'bridge:write', 'bridge:trusted_write'],
    accessScope: 'focused-rem-only',
    trustedWriteMode: 'trusted-inside-scope',
  };
}

for (const authMode of ['local_bridge_token', 'hosted_oauth'] as const) {
  const blocked = validateMcpToolPermission(
    toolCall('get_rem', { remId: 'outside-current-tree' }),
    scopePrincipal(authMode)
  );
  if (blocked.ok || blocked.code !== 'OUT_OF_SCOPE') {
    throw new Error(`${authMode} bypassed server scope boundary for get_rem.`);
  }
}

const legacyHostedConfig = loadConfig({
  ...process.env,
  REMNOTE_BRIDGE_HOSTED_MODE: '1',
  REMNOTE_BRIDGE_DEPLOYMENT_MODE: 'local',
  SESSION_SECRET: 'auth-smoke-session-secret',
});
if (legacyHostedConfig.deploymentMode !== 'hosted') {
  throw new Error('REMNOTE_BRIDGE_HOSTED_MODE=1 did not derive deploymentMode=hosted.');
}

try {
  validateConfig(legacyHostedConfig);
  throw new Error('REMNOTE_BRIDGE_HOSTED_MODE=1 was not blocked.');
} catch (error: unknown) {
  assertHostedGuard(error, 'validateConfig');
}

const legacyModeAliases = [
  ['local_dev', 'local'],
  ['personal_hosted_token', 'hosted'],
  ['public_hosted_oauth', 'hosted'],
] as const;
for (const [rawMode, expectedMode] of legacyModeAliases) {
  const aliasConfig = loadConfig({
    ...process.env,
    REMNOTE_BRIDGE_HOSTED_MODE: '',
    REMNOTE_BRIDGE_DEPLOYMENT_MODE: rawMode,
    REMNOTE_BRIDGE_ENABLE_HOSTED_PAIRING: '',
    SESSION_SECRET: 'auth-smoke-session-secret',
  });
  if (aliasConfig.deploymentMode !== expectedMode) {
    throw new Error(
      `REMNOTE_BRIDGE_DEPLOYMENT_MODE=${rawMode} did not canonicalize to ${expectedMode}.`
    );
  }
}

const enabledHostedConfig = loadConfig({
  ...process.env,
  REMNOTE_BRIDGE_DEPLOYMENT_MODE: 'hosted',
  REMNOTE_BRIDGE_ENABLE_HOSTED_PAIRING: '1',
  REMNOTE_BRIDGE_PUBLIC_BASE_URL: 'https://remnote-bridge.example.test',
  SESSION_SECRET: 'auth-smoke-session-secret',
});
if (!enabledHostedConfig.hostedPairingEnabled) {
  throw new Error('REMNOTE_BRIDGE_ENABLE_HOSTED_PAIRING=1 did not enable hosted pairing.');
}
validateConfig(enabledHostedConfig);

try {
  await startCompanionApp({
    deploymentMode: 'hosted',
    hostedPairingEnabled: false,
    bridgeToken: '',
    allowNoToken: true,
    sessionSecret: 'auth-smoke-session-secret',
    bridgePort: 0,
    mcpPort: 0,
  });
  throw new Error('Hosted start did not fail.');
} catch (error: unknown) {
  assertHostedGuard(error, 'startCompanionApp');
}

console.log('Hosted guard and deployment-mode alias smoke passed.');
