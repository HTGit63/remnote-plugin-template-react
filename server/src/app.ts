import { createServer, type Server as HttpServer, type ServerResponse } from 'node:http';
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
import { getToolRegistrySummary, isPublicMcpToolName } from './tool-registry.js';

const MCP_DISCOVERY_METHODS = new Set(['initialize', 'notifications/initialized', 'tools/list']);

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
  const toolCallAuthMode =
    config.bridgeToken && !config.allowNoToken ? 'local_bearer_required' : 'no_auth_allowed';

  function registrySummary(registeredToolNames?: readonly string[]) {
    return getToolRegistrySummary(config.enableDeleteTool, config.toolProfile, registeredToolNames, {
      discoveryAuthMode: 'no_auth_required',
      toolCallAuthMode,
    });
  }

  function isMcpDiscoveryRequest(body: unknown): boolean {
    if (typeof body !== 'object' || body === null) {
      return false;
    }

    const requests = Array.isArray(body) ? body : [body];
    if (requests.length === 0) {
      return false;
    }

    return requests.every((request) => {
      if (typeof request !== 'object' || request === null) {
        return false;
      }

      const method = (request as { method?: unknown }).method;
      return typeof method === 'string' && MCP_DISCOVERY_METHODS.has(method);
    });
  }

  function writeUnknownToolCall(body: unknown, res: ServerResponse): boolean {
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return false;
    }

    const request = body as { id?: unknown; method?: unknown; params?: { name?: unknown } };
    if (request.method !== 'tools/call' || typeof request.params?.name !== 'string') {
      return false;
    }

    if (isPublicMcpToolName(request.params.name, config.enableDeleteTool, config.toolProfile)) {
      return false;
    }

    writeJson(res, 200, {
      jsonrpc: '2.0',
      id: typeof request.id === 'string' || typeof request.id === 'number' ? request.id : null,
      result: {
        content: [
          {
            type: 'text',
            text: `UNKNOWN_TOOL: Unknown MCP tool "${request.params.name}".`,
          },
        ],
        structuredContent: {
          ok: false,
          error: {
            code: 'UNKNOWN_TOOL',
            message: `Unknown MCP tool "${request.params.name}".`,
          },
        },
        isError: true,
      },
    });
    return true;
  }

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
      const registry = registrySummary();
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
      const registry = registrySummary();
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

      const localPort =
        typeof req.socket.localPort === 'number'
          ? req.socket.localPort
          : config.singlePort
            ? config.port
            : config.mcpPort;

      writeJson(res, 200, {
        ok: true,
        server: {
          name: 'remnote-chatgpt-bridge-server',
          pid: process.pid,
          cwd: process.cwd(),
          startedAt,
          mcpPath: config.mcpPath,
          bridgePath: config.bridgePath,
          mcpPort: config.singlePort ? localPort : config.mcpPort,
          bridgePort: config.singlePort ? localPort : config.bridgePort,
          singlePort: config.singlePort,
          toolProfile: config.toolProfile,
        },
        registry: registrySummary(),
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

    let body: unknown;
    try {
      body = req.method === 'POST' ? await readJsonBody(req, config.maxBodyBytes) : undefined;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (/body too large/i.test(message)) {
        writeJson(res, 413, { error: 'Request body too large.' });
      } else if (error instanceof SyntaxError) {
        writeJson(res, 400, { error: 'Invalid JSON request body.' });
      } else {
        writeJson(res, 400, { error: 'Invalid MCP request body.' });
      }
      return;
    }

    const discoveryRequest = req.method === 'POST' && isMcpDiscoveryRequest(body);
    const auth = discoveryRequest
      ? {
          ok: true as const,
          principal: {
            subject: 'chatgpt-mcp-discovery',
            authMode: 'mcp_discovery_noauth' as const,
            scopeGrants: ['bridge:read' as const],
          },
        }
      : authorizeLocalMcpRequest(req, config);
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
      toolProfile: config.toolProfile,
      requestSignal: requestAbortController.signal,
      discoveryAuthMode: 'no_auth_required',
      toolCallAuthMode,
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
      if (writeUnknownToolCall(body, res)) {
        return;
      }

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
  const mcpServer = createMcpHttpServer(config, hub);
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
