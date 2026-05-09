import { createServer, type Server as HttpServer } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { authorizeLocalMcpRequest } from './auth/local-token.js';
import { BridgeHub } from './bridge-hub.js';
import { type CompanionServerConfig, loadConfig, validateConfig } from './config.js';
import {
  applyCors,
  readJsonBody,
  setSecurityHeaders,
  validateRequestHost,
  writeJson,
  writeText,
} from './http.js';
import { createMcpServer } from './mcp-server.js';
import { ConsoleAuditLogger } from './sessions/audit-log.js';
import type { AuditLogger } from './sessions/types.js';
import { getToolRegistrySummary } from './tool-registry.js';

export interface RunningCompanionApp {
  config: CompanionServerConfig;
  hub: BridgeHub;
  mcpServer: HttpServer;
  mcpPort: number;
  bridgePort: number;
  stop: () => Promise<void>;
}

function createMcpHttpServer(config: CompanionServerConfig, hub: BridgeHub): HttpServer {
  const auditLogger: AuditLogger | undefined = config.auditLog ? new ConsoleAuditLogger() : undefined;
  const startedAt = new Date().toISOString();

  return createServer(async (req, res) => {
    if (!validateRequestHost(req, config)) {
      auditLogger?.record({
        type: 'mcp_request_rejected',
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.url,
        remoteAddress: req.socket.remoteAddress,
        statusCode: 403,
        reason: 'forbidden_host',
      });
      writeText(res, 403, 'Forbidden host.');
      return;
    }

    if (req.headers.origin && !config.allowCors) {
      auditLogger?.record({
        type: 'mcp_request_rejected',
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.url,
        remoteAddress: req.socket.remoteAddress,
        statusCode: 403,
        reason: 'cors_disabled',
      });
      writeText(res, 403, 'Browser origins are not allowed unless CORS is explicitly enabled.');
      return;
    }

    const url = new URL(req.url || '/', `http://${req.headers.host ?? 'localhost'}`);

    if (url.pathname === '/' && req.method === 'GET') {
      const registry = getToolRegistrySummary(config.enableDeleteTool);
      writeJson(res, 200, {
        ok: true,
        name: 'remnote-chatgpt-bridge-server',
        mcpPath: config.mcpPath,
        bridgeConnected: hub.getStatus().connected,
        toolRegistryVersion: registry.toolRegistryVersion,
        publicToolCount: registry.publicToolCount,
        startedAt,
      });
      return;
    }

    if (url.pathname === '/health' && req.method === 'GET') {
      const registry = getToolRegistrySummary(config.enableDeleteTool);
      writeJson(res, 200, {
        ok: true,
        bridge: hub.getStatus(),
        toolRegistryVersion: registry.toolRegistryVersion,
        publicToolCount: registry.publicToolCount,
        startedAt,
      });
      return;
    }

    if (url.pathname === '/diagnostics' && req.method === 'GET') {
      const auth = authorizeLocalMcpRequest(req, config);
      if (!auth.ok) {
        writeJson(res, auth.statusCode, {
          error: auth.error,
        });
        return;
      }

      writeJson(res, 200, {
        ok: true,
        server: {
          name: 'remnote-chatgpt-bridge-server',
          pid: process.pid,
          cwd: process.cwd(),
          startedAt,
          mcpPath: config.mcpPath,
          bridgePath: config.bridgePath,
          mcpPort: config.mcpPort,
          bridgePort: config.bridgePort,
        },
        registry: getToolRegistrySummary(config.enableDeleteTool),
        bridge: hub.getDiagnostics(),
      });
      return;
    }

    if (url.pathname !== config.mcpPath) {
      writeText(res, 404, 'Not Found');
      return;
    }

    if (req.method === 'OPTIONS') {
      const corsAllowed = applyCors(req, res, config);
      setSecurityHeaders(res);
      res.writeHead(corsAllowed ? 204 : 403);
      res.end();
      return;
    }

    if (!['POST', 'GET', 'DELETE'].includes(req.method || '')) {
      writeText(res, 405, 'Method Not Allowed');
      return;
    }

    const auth = authorizeLocalMcpRequest(req, config);
    if (!auth.ok) {
      auditLogger?.record({
        type: 'mcp_request_rejected',
        timestamp: new Date().toISOString(),
        method: req.method,
        path: url.pathname,
        remoteAddress: req.socket.remoteAddress,
        statusCode: auth.statusCode,
        reason: auth.auditReason,
      });
      writeJson(res, auth.statusCode, {
        error: auth.error,
      });
      return;
    }

    auditLogger?.record({
      type: 'mcp_request_accepted',
      timestamp: new Date().toISOString(),
      actor: {
        subject: auth.principal.subject,
        authMode: auth.principal.authMode,
      },
      method: req.method,
      path: url.pathname,
      remoteAddress: req.socket.remoteAddress,
    });

    applyCors(req, res, config);

    const requestAbortController = new AbortController();
    const mcpServer = createMcpServer(hub, {
      exposeDeleteTool: config.enableDeleteTool,
      requestSignal: requestAbortController.signal,
    });
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    res.on('close', () => {
      if (!res.writableEnded) {
        requestAbortController.abort();
      }
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
