import { createServer, type Server as HttpServer, type ServerResponse } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { authorizeLocalMcpRequest } from './auth/local-token.js';
import { handleChatGptPairingRoute } from './auth/chatgpt-pairing-routes.js';
import { handleDashboardRoute } from './auth/dashboard-routes.js';
import { handlePairingRoute } from './auth/pairing-routes.js';
import { buildOauthChallenge, handleOAuthRoute } from './auth/oauth-routes.js';
import { rateLimitRequest } from './auth/rate-limit.js';
import { authorizeHostedMcpRequest } from './auth/token-verifier.js';
import type { AuthenticatedPrincipal, AuthResult, ScopeGrant } from './auth/types.js';
import { BridgeHub } from './bridge-hub.js';
import {
  getRuntimeInfo,
  getToolCallAuthMode,
  type CompanionServerConfig,
  loadConfig,
  validateConfig,
} from './config.js';
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
import { createStorageProvider, type StorageProvider } from './storage/index.js';
import { getToolRegistrySummary, isPublicMcpToolName } from './tool-registry.js';
import { validateMcpToolPermission } from './tool-permissions.js';
import { getToolPolicyEntry, normalizeToolProfile, type ToolProfile } from './tool-policy.js';
import { renderDashboard } from './dashboard/templates.js';

const MCP_DISCOVERY_METHODS = new Set(['initialize', 'notifications/initialized', 'tools/list']);

export interface RunningCompanionApp {
  config: CompanionServerConfig;
  hub: BridgeHub;
  mcpServer: HttpServer;
  mcpPort: number;
  bridgePort: number;
  stop: () => Promise<void>;
}

function createMcpHttpServer(config: CompanionServerConfig, hub: BridgeHub, storage: StorageProvider): HttpServer {
  const auditLogger: AuditLogger | undefined = config.auditLog ? new ConsoleAuditLogger() : undefined;
  const startedAt = new Date().toISOString();
  const toolCallAuthMode = getToolCallAuthMode(config);

  function registrySummary(registeredToolNames?: readonly string[], toolProfile: ToolProfile = config.toolProfile) {
    return getToolRegistrySummary(config.enableDeleteTool, toolProfile, registeredToolNames, {
      discoveryAuthMode: 'no_auth_required',
      toolCallAuthMode,
    });
  }

  function requestedToolProfile(req: Parameters<typeof authorizeLocalMcpRequest>[0], body: unknown, url: URL): ToolProfile | undefined {
    const header = req.headers['x-remnote-tool-tier'];
    if (typeof header === 'string' && header.trim()) {
      return normalizeToolProfile(header.trim());
    }
    const queryTier = url.searchParams.get('tool_tier') || url.searchParams.get('toolProfile');
    if (queryTier) {
      return normalizeToolProfile(queryTier);
    }
    if (typeof body === 'object' && body !== null && !Array.isArray(body)) {
      const request = body as { params?: { _meta?: { toolTier?: unknown; toolProfile?: unknown } } };
      const value = request.params?._meta?.toolTier ?? request.params?._meta?.toolProfile;
      if (typeof value === 'string') {
        return normalizeToolProfile(value);
      }
    }
    return undefined;
  }

  function activeToolProfile(
    principal: AuthenticatedPrincipal,
    req: Parameters<typeof authorizeLocalMcpRequest>[0],
    body: unknown,
    url: URL
  ): ToolProfile {
    return requestedToolProfile(req, body, url) ?? principal.toolTier ?? config.toolProfile ?? 'core';
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

  function writeUnknownToolCall(body: unknown, res: ServerResponse, toolProfile: ToolProfile): boolean {
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return false;
    }

    const request = body as { id?: unknown; method?: unknown; params?: { name?: unknown } };
    if (request.method !== 'tools/call' || typeof request.params?.name !== 'string') {
      return false;
    }

    if (isPublicMcpToolName(request.params.name, config.enableDeleteTool, toolProfile)) {
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

  function requiredScopesForMcpRequest(body: unknown): ScopeGrant[] {
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return ['bridge:read'];
    }

    const request = body as { method?: unknown; params?: { name?: unknown } };
    if (request.method !== 'tools/call' || typeof request.params?.name !== 'string') {
      return ['bridge:read'];
    }

    const policy = getToolPolicyEntry(request.params.name).policy;
    if (policy === 'dangerous') {
      return ['bridge:read', 'bridge:write', 'bridge:delete'];
    }
    if (policy === 'preferred' || policy === 'fallback' || policy === 'cards') {
      return ['bridge:read', 'bridge:write'];
    }
    return ['bridge:read'];
  }

  async function authorizeMcpRequest(
    req: Parameters<typeof authorizeLocalMcpRequest>[0],
    body: unknown,
    discoveryRequest: boolean
  ): Promise<AuthResult> {
    if (discoveryRequest) {
      return {
        ok: true,
        principal: {
          subject: 'chatgpt-mcp-discovery',
          userId: '__discovery__',
          authMode: 'mcp_discovery_noauth',
          scopeGrants: ['bridge:read'],
        },
      };
    }

    if (config.deploymentMode === 'hosted') {
      return authorizeHostedMcpRequest(req, config, storage, requiredScopesForMcpRequest(body));
    }

    return authorizeLocalMcpRequest(req, config);
  }

  function localMcpPort(req: Parameters<typeof authorizeLocalMcpRequest>[0]): number {
    if (typeof req.socket.localPort === 'number') {
      return req.socket.localPort;
    }
    return config.singlePort ? config.port : config.mcpPort;
  }

  function runtimeInfoForRequest(req: Parameters<typeof authorizeLocalMcpRequest>[0]) {
    const port = localMcpPort(req);
    return getRuntimeInfo(config, {
      mcpPort: port,
      bridgePort: config.singlePort ? port : hub.bridgePort,
    });
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

    if (
      req.headers.origin &&
      (!config.allowCors || !config.allowedOrigins.includes(String(req.headers.origin)))
    ) {
      auditLogger?.record({
        type: 'mcp_request_rejected',
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.url,
        remoteAddress: req.socket.remoteAddress,
        statusCode: 403,
        reason: 'cors_forbidden',
      });
      writeText(res, 403, 'Browser origin is not allowed.');
      return;
    }

    const url = new URL(req.url || '/', `http://${req.headers.host ?? 'localhost'}`);

    if (
      url.pathname.startsWith('/oauth/') ||
      url.pathname === '/.well-known/oauth-protected-resource' ||
      url.pathname === '/.well-known/oauth-authorization-server'
    ) {
      if (!rateLimitRequest(req, res, config, 'oauth')) {
        return;
      }
      const handled = await handleOAuthRoute(req, res, url, { config, storage });
      if (handled) {
        return;
      }
    }

    if (url.pathname === '/' && req.method === 'GET') {
      const registry = registrySummary();
      const status = hub.getStatus();
      const activeClientName = status.connected ? 'RemNote Plugin' : 'None';
      const lastHeartbeatAt = 'N/A';

      const html = renderDashboard({
        config,
        bridgeConnected: status.connected,
        toolRegistryVersion: registry.toolRegistryVersion,
        publicToolCount: registry.publicToolCount,
        startedAt,
        uptimeSeconds: process.uptime(),
        pid: process.pid,
        cwd: process.cwd(),
        activeClientName,
        lastHeartbeatAt,
        mismatchCount: registry.registryMismatch.missing.length + registry.registryMismatch.unexpected.length,
      });

      res.writeHead(200, {
        'content-type': 'text/html; charset=utf-8',
        'content-security-policy': "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; script-src 'self' 'unsafe-inline'",
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'no-referrer',
        'cache-control': 'no-store',
        'x-frame-options': 'DENY',
      });
      res.end(html);
      return;
    }

    if ((url.pathname === '/api/status' || url.pathname === '/status') && req.method === 'GET') {
      const registry = registrySummary();
      writeJson(res, 200, {
        ok: true,
        name: 'remnote-chatgpt-bridge-server',
        deploymentMode: config.deploymentMode,
        mcpPath: config.mcpPath,
        bridgeConnected: hub.getStatus().connected,
        toolTier: registry.toolTier,
        activeToolTier: registry.activeToolTier,
        toolSchemaVersion: registry.toolSchemaVersion,
        toolRegistryVersion: registry.toolRegistryVersion,
        publicToolCount: registry.publicToolCount,
        startedAt,
      });
      return;
    }

    if (
      url.pathname === '/connect' ||
      url.pathname === '/connected' ||
      url.pathname === '/denied' ||
      url.pathname === '/expired' ||
      url.pathname === '/debug/status' ||
      url.pathname.startsWith('/pairing/')
    ) {
      if (req.method === 'OPTIONS') {
        const corsAllowed = applyCors(req, res, config);
        setSecurityHeaders(res);
        res.writeHead(corsAllowed ? 204 : 403);
        res.end();
        return;
      }
      applyCors(req, res, config);
      if (url.pathname.startsWith('/pairing/') && !rateLimitRequest(req, res, config, 'pairing')) {
        return;
      }
      const handled = await handleChatGptPairingRoute(req, res, url, { config, storage });
      if (handled) {
        return;
      }
    }

    if (url.pathname === '/health' && req.method === 'GET') {
      const registry = registrySummary();
      const runtimeInfo = runtimeInfoForRequest(req);
      writeJson(res, 200, {
        ok: true,
        ...runtimeInfo,
        deployment: runtimeInfo,
        bridge: hub.getStatus(),
        activeToolTier: registry.activeToolTier,
        toolTier: registry.toolTier,
        toolSchemaVersion: registry.toolSchemaVersion,
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

      const localPort = localMcpPort(req);
      const runtimeInfo = runtimeInfoForRequest(req);

      writeJson(res, 200, {
        ok: true,
        server: {
          name: 'remnote-chatgpt-bridge-server',
          ...runtimeInfo,
          pid: process.pid,
          cwd: process.cwd(),
          startedAt,
          mcpPath: config.mcpPath,
          bridgePath: config.bridgePath,
          mcpPort: localPort,
          bridgePort: config.singlePort ? localPort : hub.bridgePort,
          singlePort: config.singlePort,
          toolProfile: config.toolProfile,
          toolTier: config.toolProfile,
          activeToolTier: config.toolProfile,
        },
        registry: registrySummary(undefined, config.toolProfile),
        bridge: hub.getDiagnostics(),
      });
      return;
    }

    // ── Phase 4 dashboard auth routes ──────────────────────────────
    const dashboardHandled = await handleDashboardRoute(req, res, url, { config, storage, hub });
    if (dashboardHandled) return;

    // ── Phase 5 plugin pairing routes ─────────────────────────────
    if (url.pathname.startsWith('/api/pair') && !rateLimitRequest(req, res, config, 'pair')) {
      return;
    }
    const pairingHandled = await handlePairingRoute(req, res, url, { config, storage });
    if (pairingHandled) return;

    if (url.pathname !== config.mcpPath) {
      writeText(res, 404, 'Not Found');
      return;
    }

    if (!rateLimitRequest(req, res, config, 'mcp')) {
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
    const auth = await authorizeMcpRequest(req, body, discoveryRequest);
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
      if (config.deploymentMode === 'hosted' && auth.statusCode === 401) {
        res.setHeader(
          'WWW-Authenticate',
          buildOauthChallenge(req, config, requiredScopesForMcpRequest(body).join(' '))
        );
      }
      writeJson(res, auth.statusCode, {
        error: auth.error,
      });
      return;
    }

    const toolPermission = validateMcpToolPermission(body, auth.principal);
    if (!toolPermission.ok) {
      auditLogger?.record({
        type: 'mcp_request_rejected',
        timestamp: new Date().toISOString(),
        method: req.method,
        path: url.pathname,
        remoteAddress: req.socket.remoteAddress,
        statusCode: 403,
        reason: toolPermission.auditReason,
      });
      writeJson(res, 403, { error: toolPermission.error });
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
    const activeProfile = activeToolProfile(auth.principal, req, body, url);

    const requestAbortController = new AbortController();
    const mcpServer = createMcpServer(hub, {
      exposeDeleteTool: config.enableDeleteTool,
      toolProfile: activeProfile,
      requestSignal: requestAbortController.signal,
      discoveryAuthMode: 'no_auth_required',
      toolCallAuthMode,
      runtimeInfo: runtimeInfoForRequest(req),
      principal: auth.principal,
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
      if (writeUnknownToolCall(body, res, activeProfile)) {
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

  // Initialize persistent storage (Phase 3/4)
  const storage = createStorageProvider(config);
  await storage.initialize();

  const hub = new BridgeHub(config, storage);
  const mcpServer = createMcpHttpServer(config, hub, storage);
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
