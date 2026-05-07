import { startCompanionApp } from './app.js';

const app = await startCompanionApp();

console.log(`RemNote bridge WebSocket: ws://${app.config.bindHost}:${app.bridgePort}${app.config.bridgePath}`);
console.log(`RemNote MCP endpoint: http://${app.config.bindHost}:${app.mcpPort}${app.config.mcpPath}`);
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

