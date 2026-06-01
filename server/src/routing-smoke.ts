import { startCompanionApp } from './app.js';
import { HOSTED_MODE_NOT_IMPLEMENTED_MESSAGE } from './config.js';

try {
  await startCompanionApp({
    deploymentMode: 'hosted',
    bridgeToken: '',
    allowNoToken: true,
    bridgePort: 0,
    mcpPort: 0,
  });
  throw new Error('Hosted routing started before real hosted pairing was implemented.');
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (!message.includes(HOSTED_MODE_NOT_IMPLEMENTED_MESSAGE)) {
    throw new Error(`Hosted routing guard returned wrong error: ${message}`);
  }
}

console.log('Hosted routing guard smoke passed.');
