import { startCompanionApp } from './app.js';
import { getRuntimeInfo } from './config.js';

const app = await startCompanionApp();

const displayHost = app.config.bindHost === '0.0.0.0' ? 'localhost' : app.config.bindHost;
const runtimeInfo = getRuntimeInfo(app.config, {
  mcpPort: app.mcpPort,
  bridgePort: app.bridgePort,
}, displayHost);
console.log(`RemNote deployment mode: ${runtimeInfo.deploymentMode}`);
console.log(`RemNote MCP endpoint: ${runtimeInfo.mcpEndpoint}`);
console.log(`RemNote bridge WebSocket: ${runtimeInfo.bridgeEndpoint}`);
console.log(`RemNote local bearer auth required: ${runtimeInfo.localTokenRequired ? 'yes' : 'no'}`);
console.log(`RemNote hosted pairing enabled: ${runtimeInfo.hostedPairingEnabled ? 'yes' : 'no'}`);
console.log(`RemNote tool profile: ${app.config.toolProfile}`);
if (!app.config.bridgeToken) {
  console.warn('No REMNOTE_BRIDGE_TOKEN set. Keep server bound to localhost only.');
}

const shutdown = async () => {
  await app.stop();
  process.exit(0);
};

process.on('SIGINT', () => {
  shutdown().catch((error) => {
    console.error(error);
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  shutdown().catch((error) => {
    console.error(error);
    process.exit(1);
  });
});
