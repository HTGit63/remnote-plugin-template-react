import type { Server as HttpServer } from 'node:http';
import { BridgeHub } from './bridge-hub.js';
import { type CompanionServerConfig, loadConfig, validateConfig } from './config.js';
import { createMcpHttpServer } from './server/create-http-server.js';
import { createStorageProvider } from './storage/index.js';
import type { StorageProvider } from './storage/types.js';
import type {
  HostedImageFileLoader,
  HostedMediaFileLoader,
} from './media/hosted-image-loader.js';

export interface RunningCompanionApp {
  config: CompanionServerConfig;
  hub: BridgeHub;
  mcpServer: HttpServer;
  mcpPort: number;
  bridgePort: number;
  stop: () => Promise<void>;
}

export async function startCompanionApp(
  overrideConfig: Partial<CompanionServerConfig> = {},
  dependencies: {
    storage?: StorageProvider;
    hostedImageLoader?: HostedImageFileLoader;
    hostedMediaLoader?: HostedMediaFileLoader;
  } = {}
): Promise<RunningCompanionApp> {
  const baseConfig = loadConfig();
  const timeoutBudgets =
    overrideConfig.timeoutBudgets ??
    (overrideConfig.requestTimeoutMs !== undefined
      ? {
          ...baseConfig.timeoutBudgets,
          defaultRequestTimeoutMs: overrideConfig.requestTimeoutMs,
          highLevelWriteTimeoutMs: overrideConfig.requestTimeoutMs,
          bulkStepTimeoutMs: overrideConfig.requestTimeoutMs,
          readTimeoutMs: overrideConfig.requestTimeoutMs,
          mutationTimeoutMs: overrideConfig.requestTimeoutMs,
          writeApprovalTimeoutMs: overrideConfig.requestTimeoutMs,
        }
      : baseConfig.timeoutBudgets);
  const config = {
    ...baseConfig,
    ...overrideConfig,
    timeoutBudgets,
  };
  validateConfig(config);

  // Initialize persistent storage (Phase 3/4)
  const storage = dependencies.storage ?? createStorageProvider(config);
  await storage.initialize();

  const hub = new BridgeHub(config, storage);
  const mcpServer = createMcpHttpServer(config, hub, storage, {
    hostedImageLoader: dependencies.hostedImageLoader,
    hostedMediaLoader: dependencies.hostedMediaLoader,
  });
  if (config.singlePort) {
    hub.attachToServer(mcpServer);
  } else {
    await hub.start();
  }

  await new Promise<void>((resolve, reject) => {
    mcpServer.once('error', reject);
    const listenPort = config.singlePort ? config.port : config.mcpPort;
    mcpServer.listen(listenPort, config.bindHost, () => {
      mcpServer.off('error', reject);
      resolve();
    });
  });

  const mcpAddress = mcpServer.address();
  const mcpPort = typeof mcpAddress === 'object' && mcpAddress ? mcpAddress.port : config.mcpPort;

  return {
    config,
    hub,
    mcpServer,
    mcpPort,
    bridgePort: hub.bridgePort,
    stop: async () => {
      if (config.singlePort) {
        await hub.stop({ closeServer: false });
        await new Promise<void>((resolve) => mcpServer.close(() => resolve()));
        return;
      }

      await new Promise<void>((resolve) => mcpServer.close(() => resolve()));
      await hub.stop({ closeServer: true });
    },
  };
}
