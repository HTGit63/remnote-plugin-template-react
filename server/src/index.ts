import { startCompanionApp } from './app.js';

const app = await startCompanionApp();

const httpProtocol = app.config.allowRemote ? 'https' : 'http';
const wsProtocol = app.config.allowRemote ? 'wss' : 'ws';
const displayHost = app.config.bindHost === '0.0.0.0' ? 'localhost' : app.config.bindHost;
console.log(`RemNote bridge WebSocket: ${wsProtocol}://${displayHost}:${app.bridgePort}${app.config.bridgePath}`);
console.log(`RemNote MCP endpoint: ${httpProtocol}://${displayHost}:${app.mcpPort}${app.config.mcpPath}`);
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
