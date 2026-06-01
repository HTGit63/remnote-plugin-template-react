import { startCompanionApp } from './app.js';
import {
  HOSTED_MODE_NOT_IMPLEMENTED_MESSAGE,
  loadConfig,
  validateConfig,
} from './config.js';

function assertHostedGuard(error: unknown, label: string): void {
  const message = error instanceof Error ? error.message : String(error);
  if (!message.includes(HOSTED_MODE_NOT_IMPLEMENTED_MESSAGE)) {
    throw new Error(`${label} did not fail with hosted mode guard. Received: ${message}`);
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

console.log('Hosted guard smoke passed.');
