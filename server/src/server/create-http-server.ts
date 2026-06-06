import { createServer, type Server as HttpServer, type ServerResponse } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { authorizeLocalMcpRequest } from '../auth/local-token.js';
import { validateDashboardSession } from '../auth/dashboard-session.js';
import { handleChatGptPairingRoute } from '../auth/chatgpt-pairing-routes.js';
import { handleDashboardRoute } from '../auth/dashboard-routes.js';
import { handlePairingRoute } from '../auth/pairing-routes.js';
import { buildOauthChallenge, handleOAuthRoute } from '../auth/oauth-routes.js';
import { rateLimitRequest } from '../auth/rate-limit.js';
import { authorizeHostedMcpRequest } from '../auth/token-verifier.js';
import type { AuthenticatedPrincipal, AuthResult, ScopeGrant } from '../auth/types.js';
import { BridgeHub } from '../bridge-hub.js';
import {
  getRuntimeInfo,
  getToolCallAuthMode,
  type CompanionServerConfig,
  loadConfig,
  validateConfig,
} from '../config.js';
import {
  applyCors,
  readJsonBody,
  setSecurityHeaders,
  validateRequestHost,
  writeJson,
  writeText,
} from '../http.js';
import { createMcpServer } from '../mcp-server.js';
import { publicMcpToolNameForBridgeTool } from '../mcp-tool-map.js';
import { ConsoleAuditLogger } from '../sessions/audit-log.js';
import type { AuditLogger } from '../sessions/types.js';
import { createStorageProvider, type ChatGptPairingSession, type StorageProvider } from '../storage/index.js';
import { getAllPublicMcpToolNames, getToolRegistrySummary, isPublicMcpToolName, TOOL_REGISTRY_VERSION } from '../tool-registry.js';
import { validateMcpToolPermission } from '../tool-permissions.js';
import { getToolPolicyEntry, normalizeToolProfile, TOOL_SCHEMA_VERSION, type ToolProfile } from '../tool-policy.js';
import { runBridgeHealthCheck } from '../health-check.js';
import type { BridgeHealthCheckMode } from '../health-check-types.js';
import { renderDashboard } from '../dashboard/templates.js';
import { recordToolHistoryEvent } from '../tool-health-history.js';
import { buildPublicUserDiagnosticSummary, redactDiagnosticValue } from '../diagnostics-redaction.js';

const MCP_DISCOVERY_METHODS = new Set(['initialize', 'notifications/initialized', 'tools/list']);

export function createMcpHttpServer(config: CompanionServerConfig, hub: BridgeHub, storage: StorageProvider): HttpServer {
  const auditLogger: AuditLogger | undefined = config.auditLog ? new ConsoleAuditLogger() : undefined;
  const startedAt = new Date().toISOString();
  const toolCallAuthMode = getToolCallAuthMode(config);

  function registrySummary(registeredToolNames?: readonly string[], toolProfile: ToolProfile = config.toolProfile) {
    return getToolRegistrySummary(config.enableDeleteTool, toolProfile, registeredToolNames, {
      discoveryAuthMode: 'no_auth_required',
      toolCallAuthMode,
    });
  }

  function bearerToken(req: Parameters<typeof authorizeLocalMcpRequest>[0]): string | null {
    const authorization = req.headers.authorization;
    if (typeof authorization !== 'string') {
      return null;
    }
    const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());
    return match?.[1] ?? null;
  }

  function pluginSessionSecret(req: Parameters<typeof authorizeLocalMcpRequest>[0]): string | null {
    const header = req.headers['x-remnote-plugin-session-secret'];
    if (typeof header === 'string' && header.trim()) {
      return header.trim();
    }
    return bearerToken(req);
  }

  function normalizePluginAccessScope(
    value: unknown,
    fallback: ChatGptPairingSession['accessScope']
  ): ChatGptPairingSession['accessScope'] {
    return value === 'current-rem-tree' || value === 'full-kb' || value === 'focused-rem-only'
      ? value
      : fallback;
  }

  function normalizePluginTrustedWriteMode(
    value: unknown,
    fallback: ChatGptPairingSession['trustedWriteMode']
  ): ChatGptPairingSession['trustedWriteMode'] {
    return value === 'trusted-inside-scope' || value === 'ask-every-write'
      ? value
      : fallback;
  }

  function pairingPrincipal(session: ChatGptPairingSession): AuthenticatedPrincipal {
    const scopeGrants = session.approvedScopes.filter((scope): scope is ScopeGrant =>
      [
        'bridge:read',
        'bridge:write',
        'bridge:trusted_write',
        'bridge:delete',
        'bridge:pair',
        'bridge:admin',
      ].includes(scope)
    );
    return {
      subject: `pairing:${session.pairingId}`,
      userId: session.oauthSubject || session.pairingId,
      authMode: 'hosted_oauth',
      scopeGrants: scopeGrants.length ? scopeGrants : ['bridge:read'],
      sessionId: session.pairingId,
      deviceId: session.pluginConnectionId,
      pairingId: session.pairingId,
      pluginInstanceId: session.pluginInstanceId,
      accessScope: session.accessScope,
      trustedWriteMode: session.trustedWriteMode,
      toolTier: session.toolTier,
      requiresConnectorRefresh: false,
    };
  }

  async function authorizeHostedPluginApiRequest(req: Parameters<typeof authorizeLocalMcpRequest>[0]): Promise<
    | { ok: true; session: ChatGptPairingSession; principal: AuthenticatedPrincipal }
    | { ok: false; statusCode: 401 | 403; error: string }
  > {
    if (config.deploymentMode !== 'hosted' || !config.hostedPairingEnabled) {
      return {
        ok: false,
        statusCode: 403,
        error: 'Hosted plugin API is disabled because the server is in local-token mode.',
      };
    }

    const secret = pluginSessionSecret(req);
    if (!secret) {
      return {
        ok: false,
        statusCode: 401,
        error: 'Missing plugin session secret.',
      };
    }

    const session = await storage.getChatGptPairingSessionByPluginSessionSecret(secret);
    if (
      !session ||
      session.revokedAt ||
      (session.status !== 'approved' && session.status !== 'connected')
    ) {
      return {
        ok: false,
        statusCode: 401,
        error: 'Invalid, expired, or revoked plugin session.',
      };
    }

    return { ok: true, session, principal: pairingPrincipal(session) };
  }

  function toolCountsByTier(summary: ReturnType<typeof registrySummary>) {
    const tiers = summary.toolTierSummary.tiers as Record<string, string[]>;
    return Object.fromEntries(Object.entries(tiers).map(([tier, tools]) => [tier, tools.length]));
  }

  function averageLatencyMs(requests: Array<{ durationMs?: number }>): number | null {
    const durations = requests
      .map((request) => request.durationMs)
      .filter((duration): duration is number => typeof duration === 'number' && Number.isFinite(duration));
    if (!durations.length) {
      return null;
    }
    return Math.round(durations.reduce((sum, duration) => sum + duration, 0) / durations.length);
  }

  function p95LatencyMs(requests: Array<{ durationMs?: number }>): number | null {
    const durations = requests
      .map((request) => request.durationMs)
      .filter((duration): duration is number => typeof duration === 'number' && Number.isFinite(duration))
      .sort((a, b) => a - b);
    if (!durations.length) {
      return null;
    }
    const index = Math.max(0, Math.ceil(durations.length * 0.95) - 1);
    return Math.round(durations[index]);
  }

  function runtimeVerificationMatrix(summary: ReturnType<typeof registrySummary>, diagnostics: ReturnType<BridgeHub['getDiagnostics']>) {
    return summary.runtimeVerificationMatrix.map((tool) => {
      const recent = diagnostics.recentRequests.filter((request) => (request.mcpTool ?? publicMcpToolNameForBridgeTool(request.tool)) === tool.name);
      const lastSuccess = recent.find((request) => request.ok);
      const lastFailure = recent.find((request) => !request.ok);
      return {
        ...tool,
        exposed: summary.publicTools.includes(tool.name),
        runtimeVerified: Boolean(lastSuccess) || Boolean(tool.serverLocalVerified),
        runtimeVerifiedSource: lastSuccess
          ? 'recent_plugin_call'
          : tool.serverLocalVerified
            ? 'server_local'
            : tool.runtimeVerifiedSource,
        lastSuccessTimestamp: lastSuccess?.finishedAt ?? null,
        lastFailureTimestamp: lastFailure?.finishedAt ?? null,
        lastSuccessAt: lastSuccess?.finishedAt ?? tool.lastSuccessAt ?? null,
        lastFailureAt: lastFailure?.finishedAt ?? tool.lastFailureAt ?? null,
        lastErrorCode: lastFailure?.errorCode ?? null,
        averageLatencyMs: averageLatencyMs(recent),
        p95LatencyMs: p95LatencyMs(recent),
        schemaWarningStatus:
          lastFailure?.errorCode === 'SDK_UNSUPPORTED' || tool.sdkUnsupported
            ? 'sdk_unsupported'
            : tool.schemaWarningStatus,
      };
    });
  }

  function diagnosticsSummary(summary: ReturnType<typeof registrySummary>, diagnostics: ReturnType<BridgeHub['getDiagnostics']>) {
    const lastSuccessfulTool = diagnostics.recentRequests.find((request) => request.ok);
    const lastFailedTool = diagnostics.recentRequests.find((request) => !request.ok);
    return {
      activeToolTier: summary.activeToolTier,
      toolCountsByTier: toolCountsByTier(summary),
      verifiedToolCount: summary.verifiedToolCount,
      runtimeUnverifiedToolCount: summary.runtimeUnverifiedToolCount,
      lastSuccessfulTool,
      lastFailedTool,
      lastErrorCode: lastFailedTool?.errorCode ?? null,
      lastErrorLayer: lastFailedTool?.pluginLifecycle ? 'plugin' : lastFailedTool ? 'server_or_bridge' : null,
      lastRequestReachedPlugin: lastFailedTool ? Boolean(lastFailedTool.pluginLifecycle?.length) : null,
      averageLatencyMs: averageLatencyMs(diagnostics.recentRequests),
      pluginConnectionStatus: diagnostics.status.connected ? 'connected' : 'offline',
      connectorCompatNoAuthTools: diagnostics.connectorCompatNoAuthTools ?? config.connectorCompatNoAuthTools,
      connectorCompatRouting: diagnostics.connectorCompatRouting,
      activePluginConnectionCount: diagnostics.activePluginConnectionCount ?? 0,
    };
  }

  function publicSummaryFrom(summary: ReturnType<typeof registrySummary>, diagnostics: ReturnType<BridgeHub['getDiagnostics']>) {
    const matrix = runtimeVerificationMatrix(summary, diagnostics);
    const lastFailedTool = diagnostics.recentRequests.find((request) => !request.ok);
    const registryMismatchCount =
      summary.registryMismatch.missing.length +
      summary.registryMismatch.unexpected.length +
      summary.registryToMcpListMismatch.listedButNotDeclared.length +
      summary.mcpListToCallableMismatch.callableButNotListed.length;
    return buildPublicUserDiagnosticSummary({
      connected: diagnostics.status.connected,
      pendingRequests: diagnostics.status.pendingRequests,
      publicToolCount: summary.publicToolCount,
      actualCallableToolCount: summary.actualMcpCallableTools.length,
      runtimeUnverifiedToolCount: matrix.filter((tool) => tool.runtimeVerified !== true && tool.serverLocalVerified !== true && tool.sdkUnsupported !== true).length,
      sdkUnsupportedToolCount: summary.sdkUnsupportedTools.length,
      lastErrorCode: lastFailedTool?.errorCode ?? null,
      deleteToolExposed: summary.deleteToolExposed,
      registryMismatchCount,
    });
  }

  function developerDiagnosticBundle(payload: Record<string, unknown>) {
    return {
      copiedAt: new Date().toISOString(),
      redacted: true,
      payload: redactDiagnosticValue(payload),
    };
  }

  function pluginSessionTierResponse(session: ChatGptPairingSession) {
    const activeTier = session.toolTier ?? config.toolProfile;
    const summary = registrySummary(undefined, activeTier);
    return {
      ok: true,
      toolTier: activeTier,
      activeToolTier: summary.activeToolTier,
      serverDefaultTier: config.toolProfile,
      hostedPairingEnabled: true,
      accessScope: session.accessScope,
      trustedWriteMode: session.trustedWriteMode,
      approvedAccessScope: session.accessScope,
      approvedTrustedWriteMode: session.trustedWriteMode,
      toolTierVersion: session.toolTierVersion ?? TOOL_REGISTRY_VERSION,
      toolSchemaVersionAtApproval: session.toolSchemaVersionAtApproval ?? TOOL_SCHEMA_VERSION,
      toolSchemaVersion: TOOL_SCHEMA_VERSION,
      toolRegistryVersion: TOOL_REGISTRY_VERSION,
      requiresConnectorRefresh: false,
      sessionStale: false,
      publicToolCount: summary.publicToolCount,
      allPublicToolCount: summary.allPublicToolCount,
      toolCountsByTier: toolCountsByTier(summary),
      toolTierSummary: summary.toolTierSummary,
      registry: summary,
    };
  }

  async function latestPairingSummary() {
    if (config.deploymentMode !== 'hosted') {
      return {
        status: 'disabled',
        connected: false,
        stale: false,
        reason: 'local_token_mode',
      };
    }
    const sessions = await storage.listChatGptPairingSessions(25);
    const current = sessions.find((session) => ['connected', 'approved', 'pending'].includes(session.status));
    return {
      status: current?.status ?? 'none',
      connected: current?.status === 'connected',
      stale: false,
      toolTier: current?.toolTier,
      accessScope: current?.accessScope,
      trustedWriteMode: current?.trustedWriteMode,
      requiresConnectorRefresh: false,
    };
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
    return requestedToolProfile(req, body, url) ?? principal.toolTier ?? config.toolProfile;
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

  function isMcpToolCallRequest(body: unknown): boolean {
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return false;
    }

    const request = body as { method?: unknown };
    return request.method === 'tools/call';
  }

  function connectorCompatPrincipal(): AuthenticatedPrincipal {
    return {
      subject: 'chatgpt-connector-compat',
      userId: '__connector_compat__',
      authMode: 'connector_compat_noauth',
      scopeGrants: ['bridge:read', 'bridge:write', 'bridge:trusted_write'],
      accessScope: 'current-rem-tree',
      trustedWriteMode: 'ask-every-write',
      toolTier: config.toolProfile,
      requiresConnectorRefresh: false,
    };
  }

  function writeUnknownToolCall(body: unknown, res: ServerResponse, toolProfile: ToolProfile): boolean {
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return false;
    }

    const request = body as { id?: unknown; method?: unknown; params?: { name?: unknown } };
    if (request.method !== 'tools/call' || typeof request.params?.name !== 'string') {
      return false;
    }

    const name = request.params.name;
    if (isPublicMcpToolName(name, config.enableDeleteTool, toolProfile)) {
      return false;
    }

    const blockedByTier = getAllPublicMcpToolNames(config.enableDeleteTool).includes(name);
    recordToolHistoryEvent({
      tool: name,
      kind: blockedByTier ? 'tier_block' : 'gateway_block',
      gatewayBlocked: true,
      blockedByTier,
      errorCode: 'UNKNOWN_TOOL',
      source: 'mcp_gateway',
    });

    writeJson(res, 200, {
      jsonrpc: '2.0',
      id: typeof request.id === 'string' || typeof request.id === 'number' ? request.id : null,
      result: {
        content: [
          {
            type: 'text',
            text: `UNKNOWN_TOOL: Unknown MCP tool "${name}".`,
          },
        ],
        structuredContent: {
          ok: false,
          error: {
            code: 'UNKNOWN_TOOL',
            message: `Unknown MCP tool "${name}".`,
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

    if (config.connectorCompatNoAuthTools && isMcpToolCallRequest(body)) {
      return {
        ok: true,
        principal: connectorCompatPrincipal(),
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

  async function authorizeProtectedDiagnostics(req: Parameters<typeof authorizeLocalMcpRequest>[0], url: URL) {
    if (config.deploymentMode !== 'hosted') {
      return authorizeLocalMcpRequest(req, config).ok;
    }

    const providedSecret = req.headers['x-admin-debug-secret'] || url.searchParams.get('admin_debug_secret') || '';
    if (config.adminDebugSecret && typeof providedSecret === 'string' && providedSecret === config.adminDebugSecret) {
      return true;
    }

    return Boolean(await validateDashboardSession(req, storage));
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
      const pairing = await latestPairingSummary();
      const registry = registrySummary(undefined, pairing.toolTier ?? config.toolProfile);
      const status = hub.getStatus();
      if (config.deploymentMode === 'hosted') {
        writeJson(res, 200, {
          ok: true,
          name: 'remnote-chatgpt-bridge-server',
          deploymentMode: config.deploymentMode,
          health: status.connected ? 'plugin_connected' : 'waiting_for_plugin_pairing',
          toolRegistryVersion: registry.toolRegistryVersion,
          publicToolCount: registry.publicToolCount,
        });
        return;
      }

      const diagnostics = hub.getDiagnostics();
      const summary = diagnosticsSummary(registry, diagnostics);
      const activeClientName = status.connected ? 'RemNote Plugin' : 'None';
      const lastHeartbeatAt = diagnostics.activePluginConnections?.[0]?.lastPongAt ?? 'N/A';

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
        toolCallAuthMode,
        activeToolTier: registry.activeToolTier,
        toolCountsByTier: summary.toolCountsByTier,
        verifiedToolCount: summary.verifiedToolCount,
        runtimeUnverifiedToolCount: summary.runtimeUnverifiedToolCount,
        lastSuccessfulTool: summary.lastSuccessfulTool?.tool,
        lastFailedTool: summary.lastFailedTool?.tool,
        averageLatencyMs: summary.averageLatencyMs,
        chatGptPairingStatus: pairing.status,
        sessionStale: pairing.stale,
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
      const pairing = await latestPairingSummary();
      const registry = registrySummary(undefined, pairing.toolTier ?? config.toolProfile);
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
        sessionStale: pairing.stale,
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
      const runtimeInfo = runtimeInfoForRequest(req);
      const chatGptPairing = await latestPairingSummary();
      const registry = registrySummary(undefined, chatGptPairing.toolTier ?? config.toolProfile);
      const bridgeStatus = hub.getStatus();
      const bridgeDiagnostics = hub.getDiagnostics();
      if (config.deploymentMode === 'hosted') {
        writeJson(res, 200, {
          ok: true,
          name: 'remnote-chatgpt-bridge-server',
          ...runtimeInfo,
          deployment: runtimeInfo,
          connected: bridgeStatus.connected,
          health: bridgeStatus.connected ? 'plugin_connected' : 'waiting_for_plugin_pairing',
          pluginConnectionStatus: bridgeStatus.connected ? 'connected' : 'offline',
          hostedPairingStatus: chatGptPairing.status,
          sessionStale: chatGptPairing.stale,
          activeToolProfile: registry.activeToolTier,
          publicToolCount: registry.publicToolCount,
          toolRegistryVersion: registry.toolRegistryVersion,
          connectorCompatNoAuthTools: config.connectorCompatNoAuthTools,
          connectorCompatRouting: bridgeDiagnostics.connectorCompatRouting,
          activePluginConnectionCount: bridgeDiagnostics.activePluginConnectionCount ?? 0,
        });
        return;
      }

      writeJson(res, 200, {
        ok: true,
        ...runtimeInfo,
        deployment: runtimeInfo,
        bridge: hub.getStatus(),
        chatGptPairing,
        sessionStale: chatGptPairing.stale,
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
      const authorized = await authorizeProtectedDiagnostics(req, url);
      if (!authorized) {
        writeJson(res, config.deploymentMode === 'hosted' ? 403 : 401, {
          error:
            config.deploymentMode === 'hosted'
              ? 'Admin diagnostics require dashboard session or ADMIN_DEBUG_SECRET.'
              : 'Missing or invalid bridge token.',
        });
        return;
      }

      const localPort = localMcpPort(req);
      const runtimeInfo = runtimeInfoForRequest(req);
      const registry = registrySummary(undefined, config.toolProfile);
      const bridge = hub.getDiagnostics();
      const pairing = await latestPairingSummary();
      const summary = diagnosticsSummary(registry, bridge);
      const publicUserSummary = publicSummaryFrom(registry, bridge);
      const runtimeMatrix = runtimeVerificationMatrix(registry, bridge);
      const payload = {
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
        registry,
        bridge,
        chatGptPairing: pairing,
        summary,
        publicUserSummary,
        runtimeVerificationMatrix: runtimeMatrix,
      };
      writeJson(res, 200, {
        ...payload,
        developerDiagnosticBundle: developerDiagnosticBundle(payload),
      });
      return;
    }

    if (url.pathname.startsWith('/api/plugin/')) {
      if (req.method === 'OPTIONS') {
        const corsAllowed = applyCors(req, res, config);
        setSecurityHeaders(res);
        res.writeHead(corsAllowed ? 204 : 403);
        res.end();
        return;
      }

      applyCors(req, res, config);
      if (!rateLimitRequest(req, res, config, 'plugin')) {
        return;
      }

      const auth = await authorizeHostedPluginApiRequest(req);
      if (!auth.ok) {
        writeJson(res, auth.statusCode, { error: auth.error });
        return;
      }

      let body: Record<string, unknown> = {};
      if (req.method === 'POST') {
        try {
          const parsed = await readJsonBody(req, config.maxBodyBytes);
          body = typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
            ? parsed as Record<string, unknown>
            : {};
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          writeJson(res, /body too large/i.test(message) ? 413 : 400, {
            error: error instanceof SyntaxError ? 'Invalid JSON request body.' : message || 'Invalid request body.',
          });
          return;
        }
      }

      if (url.pathname === '/api/plugin/tool-tier' && req.method === 'GET') {
        writeJson(res, 200, pluginSessionTierResponse(auth.session));
        return;
      }

      if (url.pathname === '/api/plugin/tool-tier' && req.method === 'POST') {
        const nextTier = normalizeToolProfile(
          typeof body.toolTier === 'string' ? body.toolTier : auth.session.toolTier ?? config.toolProfile
        );
        const nextAccessScope = normalizePluginAccessScope(body.accessScope, auth.session.accessScope);
        const nextTrustedWriteMode = normalizePluginTrustedWriteMode(body.trustedWriteMode, auth.session.trustedWriteMode);
        const updated = await storage.updateChatGptPairingSession(auth.session.pairingId, {
          toolTier: nextTier,
          toolTierVersion: TOOL_REGISTRY_VERSION,
          toolTierChangedAt: auth.session.toolTier !== nextTier ? new Date().toISOString() : auth.session.toolTierChangedAt,
          accessScope: nextAccessScope,
          trustedWriteMode: nextTrustedWriteMode,
          requiresConnectorRefresh: false,
          lastSeenAt: new Date().toISOString(),
        });
        writeJson(res, 200, pluginSessionTierResponse(updated));
        return;
      }

      if (url.pathname === '/api/plugin/diagnostics' && req.method === 'POST') {
        const activeTier = auth.session.toolTier ?? config.toolProfile;
        const registry = registrySummary(undefined, activeTier);
        const bridge = hub.getDiagnostics();
        const runtimeInfo = runtimeInfoForRequest(req);
        const summary = diagnosticsSummary(registry, bridge);
        const publicUserSummary = publicSummaryFrom(registry, bridge);
        const runtimeMatrix = runtimeVerificationMatrix(registry, bridge);
        const payload = {
          ok: true,
          level: 'standard',
          server: {
            name: 'remnote-chatgpt-bridge-server',
            ...runtimeInfo,
            startedAt,
            mcpPath: config.mcpPath,
            bridgePath: config.bridgePath,
            toolProfile: activeTier,
            toolTier: activeTier,
            activeToolTier: activeTier,
          },
          session: {
            pairingId: auth.session.pairingId,
            status: auth.session.status,
            accessScope: auth.session.accessScope,
            trustedWriteMode: auth.session.trustedWriteMode,
            toolTier: activeTier,
            requiresConnectorRefresh: false,
          },
          registry,
          bridge,
          summary,
          publicUserSummary,
          runtimeVerificationMatrix: runtimeMatrix,
        };
        writeJson(res, 200, {
          ...payload,
          developerDiagnosticBundle: developerDiagnosticBundle(payload),
        });
        return;
      }

      if (url.pathname === '/api/plugin/health-check' && req.method === 'POST') {
        const level = body.level === 'quick' || body.level === 'standard' || body.level === 'full'
          ? body.level
          : 'quick';
        const activeTier = auth.session.toolTier ?? config.toolProfile;
        const modeByLevel: Record<typeof level, BridgeHealthCheckMode> = {
          quick: 'read_only',
          standard: 'read_only',
          full: 'read_only',
        };
        const timeoutByLevel: Record<typeof level, number> = {
          quick: 4000,
          standard: 9000,
          full: 15000,
        };
        const result = await runBridgeHealthCheck(hub, {
          mode: modeByLevel[level],
          toolProfile: activeTier,
          timeoutMs: timeoutByLevel[level],
          parentId: typeof body.parentId === 'string' ? body.parentId : undefined,
          targetRemId: typeof body.targetRemId === 'string' ? body.targetRemId : undefined,
          principal: auth.principal,
        });
        const registry = registrySummary(undefined, activeTier);
        const bridge = hub.getDiagnostics();
        const summary = diagnosticsSummary(registry, bridge);
        const publicUserSummary = publicSummaryFrom(registry, bridge);
        const runtimeMatrix = runtimeVerificationMatrix(registry, bridge);
        const payload = {
          ok: true,
          level,
          result,
          session: {
            pairingId: auth.session.pairingId,
            status: auth.session.status,
            toolTier: activeTier,
            requiresConnectorRefresh: false,
          },
          registry,
          bridge,
          summary,
          publicUserSummary,
          runtimeVerificationMatrix: runtimeMatrix,
        };
        writeJson(res, 200, {
          ...payload,
          developerDiagnosticBundle: developerDiagnosticBundle(payload),
        });
        return;
      }

      writeText(res, 404, 'Not Found');
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

    const acceptHeader = typeof req.headers.accept === 'string' ? req.headers.accept : '';
    if (
      req.method === 'POST' &&
      (!acceptHeader ||
        acceptHeader.trim() === '*/*' ||
        !acceptHeader.includes('application/json') ||
        !acceptHeader.includes('text/event-stream'))
    ) {
      req.headers.accept = 'application/json, text/event-stream';
      for (let index = req.rawHeaders.length - 2; index >= 0; index -= 2) {
        if (req.rawHeaders[index]?.toLowerCase() === 'accept') {
          req.rawHeaders.splice(index, 2);
        }
      }
      req.rawHeaders.push('Accept', 'application/json, text/event-stream');
    }

    if (req.method === 'GET') {
      writeJson(res, 200, {
        ok: true,
        message: 'MCP endpoint is alive. Use POST initialize/tools/list for connector discovery.',
        mcpPath: config.mcpPath,
        discoveryAuth: 'no_auth_required',
        toolCallAuth: toolCallAuthMode,
        connectorCompatibilityMode: config.connectorCompatNoAuthTools,
        browserGetMcpIsNotConnectorTest: true,
      });
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
      const maybeTool =
        typeof body === 'object' &&
        body !== null &&
        !Array.isArray(body) &&
        (body as { method?: unknown; params?: { name?: unknown } }).method === 'tools/call' &&
        typeof (body as { params?: { name?: unknown } }).params?.name === 'string'
          ? String((body as { params?: { name?: unknown } }).params?.name)
          : 'mcp_request';
      recordToolHistoryEvent({
        tool: maybeTool,
        kind: 'gateway_block',
        gatewayBlocked: true,
        errorCode: auth.auditReason,
        source: 'mcp_gateway',
      });
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
      const blockedTool =
        typeof body === 'object' &&
        body !== null &&
        !Array.isArray(body) &&
        typeof (body as { params?: { name?: unknown } }).params?.name === 'string'
          ? String((body as { params?: { name?: unknown } }).params?.name)
          : 'mcp_request';
      recordToolHistoryEvent({
        tool: blockedTool,
        kind: toolPermission.code === 'OUT_OF_SCOPE' ? 'scope_block' : 'gateway_block',
        gatewayBlocked: true,
        blockedByScope: toolPermission.code === 'OUT_OF_SCOPE',
        errorCode: toolPermission.code,
        source: 'mcp_gateway',
      });
      auditLogger?.record({
        type: 'mcp_request_rejected',
        timestamp: new Date().toISOString(),
        method: req.method,
        path: url.pathname,
        remoteAddress: req.socket.remoteAddress,
        statusCode: 403,
        reason: toolPermission.auditReason,
      });
      writeJson(res, 403, {
        error: toolPermission.error,
        code: toolPermission.code,
        layer: toolPermission.layer,
        toolName: toolPermission.details.toolName,
        requiredAccessScope: toolPermission.details.requiredAccessScope,
        actualAccessScope: toolPermission.details.actualAccessScope,
        permissionMode: toolPermission.details.permissionMode,
        permissionScope: toolPermission.details.permissionScope,
        recommendedFix: toolPermission.details.recommendedFix,
        directWriteDecision: toolPermission.decision,
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
