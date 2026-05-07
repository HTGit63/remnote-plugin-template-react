import { createServer, type Server as HttpServer } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { BridgeHub } from './bridge-hub.js';
import { type CompanionServerConfig, loadConfig, validateConfig } from './config.js';
import {
  applyCors,
  hasValidBearerToken,
  readJsonBody,
  validateRequestHost,
  writeJson,
  writeText,
} from './http.js';
import { createMcpServer } from './mcp-server.js';

export interface RunningCompanionApp {
  config: CompanionServerConfig;
  hub: BridgeHub;
  mcpServer: HttpServer;
  mcpPort: number;
  bridgePort: number;
  stop: () => Promise<void>;
}

function createMcpHttpServer(config: CompanionServerConfig, hub: BridgeHub): HttpServer {
  return createServer(async (req, res) => {
    if (!validateRequestHost(req, config)) {
      writeText(res, 403, 'Forbidden host.');
      return;
    }

    if (req.headers.origin && !config.allowCors) {
      writeText(res, 403, 'Browser origins are not allowed unless CORS is explicitly enabled.');
      return;
    }

    const url = new URL(req.url || '/', `http://${req.headers.host ?? 'localhost'}`);

    if (url.pathname === '/' && req.method === 'GET') {
      writeJson(res, 200, {
        ok: true,
        name: 'remnote-chatgpt-bridge-server',
        mcpPath: config.mcpPath,
        bridgeConnected: hub.getStatus().connected,
      });
      return;
    }

    if (url.pathname === '/health' && req.method === 'GET') {
      writeJson(res, 200, {
        ok: true,
        bridge: hub.getStatus(),
      });
      return;
    }

    if (url.pathname !== config.mcpPath) {
      writeText(res, 404, 'Not Found');
      return;
    }

    if (req.method === 'OPTIONS') {
      const corsAllowed = applyCors(req, res, config);
      res.writeHead(corsAllowed ? 204 : 403);
      res.end();
      return;
    }

    if (!['POST', 'GET', 'DELETE'].includes(req.method || '')) {
      writeText(res, 405, 'Method Not Allowed');
      return;
    }

    if (!hasValidBearerToken(req, config.bridgeToken)) {
      writeJson(res, 401, {
        error: 'Missing or invalid bridge token.',
      });
      return;
    }

    applyCors(req, res, config);

    const mcpServer = createMcpServer(hub);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    res.on('close', () => {
      transport.close();
      mcpServer.close();
    });

    try {
      const body = req.method === 'POST' ? await readJsonBody(req, config.maxBodyBytes) : undefined;
      await mcpServer.connect(transport);
      await transport.handleRequest(req, res, body);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('MCP request failed:', message);
      if (!res.headersSent) {
        if (/body too large/i.test(message)) {
          writeJson(res, 413, { error: 'Request body too large.' });
        } else if (error instanceof SyntaxError) {
          writeJson(res, 400, { error: 'Invalid JSON request body.' });
        } else {
          writeJson(res, 500, {
            error: 'Internal server error.',
          });
        }
      }
    }
  });
}

export async function startCompanionApp(
  overrideConfig: Partial<CompanionServerConfig> = {}
): Promise<RunningCompanionApp> {
  const config = {
    ...loadConfig(),
    ...overrideConfig,
  };
  validateConfig(config);

  const hub = new BridgeHub(config);
  await hub.start();

  const mcpServer = createMcpHttpServer(config, hub);
  await new Promise<void>((resolve, reject) => {
    mcpServer.once('error', reject);
    mcpServer.listen(config.mcpPort, config.bindHost, () => {
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
      await new Promise<void>((resolve) => mcpServer.close(() => resolve()));
      await hub.stop();
    },
  };
}
