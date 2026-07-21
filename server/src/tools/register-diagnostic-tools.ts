import { z } from 'zod';
import { runBridgeHealthCheck } from '../health-check.js';
import { publicMcpToolNameForBridgeTool } from '../mcp-tool-map.js';
import {
  getRemnoteCapabilityGuide,
  type RemnoteCapabilityGuideSection,
} from '../remnote-capability-guide.js';
import {
  SERVER_LOCAL_MCP_TOOLS,
  STATIC_SDK_UNSUPPORTED_TOOLS,
} from '../tool-registry.js';
import { getDirectWritePolicySnapshot } from '../tool-permissions.js';
import { buildPublicUserDiagnosticSummary, redactDiagnosticValue } from '../diagnostics-redaction.js';
import {
  BRIDGE_TOOL_OUTPUT_SCHEMA,
  MEDIA_URL_SCHEMA,
  REM_ID_SCHEMA,
  REMNOTE_GUIDE_SECTION_SCHEMA,
} from './schemas.js';
import type { ToolRegistrationContext } from './tool-context.js';

export function registerDiagnosticTools({
  hub,
  registerTool,
  currentRegistry,
  exposeDeleteTool,
  requestSignal,
  runtimeInfo,
  toolProfile,
  principal,
}: ToolRegistrationContext): void {
  registerTool(
    'get_bridge_diagnostics',
    {
      title: 'Get bridge diagnostics',
      description:
        'Use this when the RemNote connector looks stale, a tool call did not return, or you need the live tool registry and recent request outcomes.',
      inputSchema: z.object({}),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async () => {
      const diagnostics = hub.getDiagnostics();
      const registry = currentRegistry();
      const directWrite = getDirectWritePolicySnapshot(principal);
      const serverLocalTools = SERVER_LOCAL_MCP_TOOLS.filter((tool) => registry.publicTools.includes(tool));
      const successfulPluginTools = Array.from(
        new Set(
          diagnostics.recentRequests
            .filter((request) => request.ok)
            .map((request) => request.mcpTool ?? publicMcpToolNameForBridgeTool(request.tool))
        )
      );
      const sdkUnsupportedTools = Array.from(
        new Set([
          ...STATIC_SDK_UNSUPPORTED_TOOLS,
          ...diagnostics.recentRequests
            .filter((request) => request.errorCode === 'SDK_UNSUPPORTED' || request.sdkUnsupported)
            .map((request) => request.mcpTool ?? publicMcpToolNameForBridgeTool(request.tool)),
        ])
      ).filter((tool) => registry.publicTools.includes(tool));
      const runtimeVerifiedTools = Array.from(new Set([...serverLocalTools, ...successfulPluginTools]));
      const callableTools = [...registry.actualMcpCallableTools];
      const runtimeUnverifiedTools = registry.publicTools.filter(
        (tool) => !runtimeVerifiedTools.includes(tool) && !sdkUnsupportedTools.includes(tool)
      );
      const lastSuccessfulToolCalls = diagnostics.recentRequests
        .filter((request) => request.ok)
        .map((request) => ({
          ...request,
          mcpTool: request.mcpTool ?? publicMcpToolNameForBridgeTool(request.tool),
        }));
      const lastFailedToolCalls = diagnostics.recentRequests
        .filter((request) => !request.ok)
        .map((request) => ({
          ...request,
          mcpTool: request.mcpTool ?? publicMcpToolNameForBridgeTool(request.tool),
        }));
      const partialExecutions = diagnostics.recentRequests
        .filter((request) => request.partialExecution)
        .map((request) => ({
          ...request,
          mcpTool: request.mcpTool ?? publicMcpToolNameForBridgeTool(request.tool),
        }));
      const lastFailedTool = diagnostics.recentRequests.find((request) => !request.ok);
      const registryMismatchCount =
        registry.registryMismatch.missing.length +
        registry.registryMismatch.unexpected.length +
        registry.registryToMcpListMismatch.listedButNotDeclared.length +
        registry.mcpListToCallableMismatch.callableButNotListed.length;
      const publicUserSummary = buildPublicUserDiagnosticSummary({
        connected: diagnostics.status.connected,
        pendingRequests: diagnostics.status.pendingRequests,
        publicToolCount: registry.publicToolCount,
        actualCallableToolCount: callableTools.length,
        runtimeUnverifiedToolCount: runtimeUnverifiedTools.length,
        sdkUnsupportedToolCount: sdkUnsupportedTools.length,
        lastErrorCode: lastFailedTool?.errorCode ?? null,
        deleteToolExposed: registry.deleteToolExposed,
        registryMismatchCount,
      });
      const lastFailedRequest = lastFailedToolCalls[0] ?? null;
      const executionSummary = {
        pluginConnected: diagnostics.status.connected,
        hostedMode: runtimeInfo?.deploymentMode === 'hosted',
        connectorCompatNoAuthTools: diagnostics.connectorCompatNoAuthTools ?? false,
        connectorCompatRouting: diagnostics.connectorCompatRouting ?? 'disabled',
        pluginAuthMode: principal?.authMode ?? 'unauthenticated_or_discovery',
        sharedPluginAuthentication: principal?.authMode === 'hosted_oauth',
        sessionRouterStatus: diagnostics.sessionRouter,
        activePluginConnectionCount: diagnostics.activePluginConnectionCount ?? diagnostics.activePluginConnections?.length ?? 0,
        activePluginUsers: (diagnostics.activePluginConnections ?? []).map((connection) => connection.userId),
        selectedToolTier: registry.activeToolTier,
        listedToolCount: registry.publicToolCount,
        callableToolCount: callableTools.length,
        liveVerifiedToolCount: successfulPluginTools.length,
        failedToolCount: lastFailedToolCalls.length,
        lastFailedTool: lastFailedRequest?.mcpTool ?? null,
        lastErrorCode: lastFailedRequest?.errorCode ?? null,
        lastErrorLayer: lastFailedRequest
          ? lastFailedRequest.pluginLifecycle?.length
            ? 'plugin'
            : 'server_or_bridge'
          : null,
        lastRequestReachedPlugin: lastFailedRequest
          ? Boolean(lastFailedRequest.pluginLifecycle?.length)
          : null,
        lastRemNoteApprovalStatus: lastFailedRequest?.lifecycle.some((event) =>
          event.phase === 'approval_approved' || event.phase === 'approval_rejected' || event.phase === 'approval_timeout'
        )
          ? lastFailedRequest.lifecycle.find((event) =>
              event.phase === 'approval_approved' || event.phase === 'approval_rejected' || event.phase === 'approval_timeout'
            )?.phase ?? null
          : null,
        lastSdkErrorCode: lastFailedRequest?.sdkUnsupported ? 'SDK_UNSUPPORTED' : null,
      };
      const result = {
        ...registry,
        ...directWrite,
        ...(runtimeInfo ?? {}),
        ...diagnostics,
        executionSummary,
        pendingRequests: diagnostics.status.pendingRequests,
        pendingApproval: diagnostics.pending[0] ?? null,
        recentErrors: diagnostics.recentRequests.filter((request) => !request.ok),
        recentRequestLifecycle: diagnostics.recentRequests,
        lastSuccessfulToolCalls,
        lastFailedToolCalls,
        partialExecutions,
        lastPartialExecution: partialExecutions[0] ?? null,
        serverLocalVerifiedTools: serverLocalTools,
        serverLocalVerifiedToolCount: serverLocalTools.length,
        realPluginVerifiedTools: successfulPluginTools,
        verifiedToolCount: runtimeVerifiedTools.length,
        runtimeUnverifiedTools,
        runtimeUnverifiedToolCount: runtimeUnverifiedTools.length,
        sdkUnsupportedTools,
        callableTools,
        actualMcpCallableTools: callableTools,
        runtimeVerifiedTools,
        unauthMcpCallableTools:
          registry.toolCallAuthMode === 'no_auth_allowed' ? callableTools : [],
        publicUserSummary,
      };
      const operationId = `diagnostics-${Date.now().toString(36)}`;
      const standard = {
        status: 'PASS',
        toolName: 'get_bridge_diagnostics',
        operationId,
        target: { toolProfile: registry.activeToolTier },
        created: [],
        updated: [],
        deleted: [],
        counts: { created: 0, updated: 0, deleted: 0 },
        verification: executionSummary,
        phaseDurations: {},
        warnings: [],
      };
      return {
        content: [
          {
            type: 'text',
            text: `Bridge diagnostics: ${registry.publicToolCount} listed tools, ${callableTools.length} callable tools, ${successfulPluginTools.length} recently live-verified, ${diagnostics.status.pendingRequests} pending requests.`,
          },
        ],
        structuredContent: {
          ok: true,
          ...standard,
          result: {
            ...result,
            developerDiagnosticBundle: {
              copiedAt: new Date().toISOString(),
              redacted: true,
              payload: redactDiagnosticValue(result),
            },
          },
          standard,
        },
      };
    }
  );

  registerTool(
    'run_bridge_health_check',
    {
      title: 'Run bridge health check',
      description:
        'Use this to test registered RemNote bridge tools and record pass/fail/skipped/unsupported results in diagnostics. read_only is default; write/delete modes use disposable Rems under parentId.',
      inputSchema: z.object({
        mode: z.enum(['read_only', 'safe_write', 'mutation_on_disposable_rem', 'destructive_on_disposable_rem']).default('read_only').describe('read_only only probes reads; safe_write creates disposable content under parentId; mutation_on_disposable_rem mutates a disposable Rem; destructive_on_disposable_rem deletes only its own disposable Rem with delete_rem_by_id.'),
        includeWrites: z.boolean().default(false).describe('False runs read-only checks plus a structured batch dry run when parentId is provided. True executes safe create/write checks under parentId.'),
        includeExistingRemMutations: z.boolean().default(false).describe('True also tests updates/formatting against targetRemId, which requires RemNote approval. Destructive deletes are never executed.'),
        parentId: REM_ID_SCHEMA.optional().describe('Existing parent Rem ID for dry-run/batch/create checks.'),
        targetRemId: REM_ID_SCHEMA.optional().describe('Existing target Rem ID for read and explicit existing-Rem mutation checks. Defaults to parentId when omitted.'),
        timeoutMs: z.number().int().min(1000).max(30000).default(5000).describe('Per-tool bridge timeout.'),
        toolNames: z.array(z.string().trim().min(1).max(128)).max(12).optional().describe('Optional public-tool allowlist for a focused health probe.'),
        useParentDirectly: z.boolean().default(false).describe('Use parentId directly only when toolNames contains media insertion tools; otherwise a disposable sandbox Rem is created.'),
        mediaFixtures: z.object({
          imageUrl: MEDIA_URL_SCHEMA.optional(),
          audioUrl: MEDIA_URL_SCHEMA.optional(),
          videoUrl: MEDIA_URL_SCHEMA.optional(),
        }).strict().optional().describe('Stable HTTP(S) fixtures for focused media insertion proof.'),
        mediaIdempotencyKeyPrefix: z.string().trim().min(1).max(110).optional().describe('Stable prefix reused across media probe retries.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: {
        readOnlyHint: false,
        openWorldHint: true,
        destructiveHint: false,
        idempotentHint: false,
      },
    },
    async ({ mode, includeWrites, includeExistingRemMutations, parentId, targetRemId, timeoutMs, toolNames, useParentDirectly, mediaFixtures, mediaIdempotencyKeyPrefix }) => {
      const result = await runBridgeHealthCheck(hub, {
        mode,
        exposeDeleteTool,
        includeWrites,
        includeExistingRemMutations,
        parentId,
        targetRemId,
        timeoutMs,
        toolNames,
        useParentDirectly,
        mediaFixtures,
        mediaIdempotencyKeyPrefix,
        signal: requestSignal,
        toolProfile,
        principal,
      });
      const operationId = `health-${Date.now().toString(36)}`;
      const standard = {
        status: result.status === 'failed' ? 'FAIL' : result.status === 'partial' ? 'PARTIAL' : 'PASS',
        toolName: 'run_bridge_health_check',
        operationId,
        target: { mode, parentId, targetRemId },
        created: [],
        updated: [],
        deleted: [],
        counts: {
          created: 0,
          updated: 0,
          deleted: 0,
          passed: result.passedCount,
          failed: result.failedCount,
          skipped: result.skippedCount,
          unsupported: result.unsupportedCount,
        },
        verification: {
          status: result.status,
          passedCount: result.passedCount,
          failedCount: result.failedCount,
          skippedCount: result.skippedCount,
          unsupportedCount: result.unsupportedCount,
        },
        phaseDurations: {},
        warnings: [],
      };
      return {
        content: [
          {
            type: 'text',
            text: `Bridge health check ${result.status}: ${result.passedCount} passed, ${result.failedCount} failed, ${result.skippedCount} skipped, ${result.unsupportedCount} unsupported.`,
          },
        ],
        structuredContent: {
          ok: result.status !== 'failed',
          ...standard,
          result,
          standard,
        },
      };
    }
  );

  registerTool(
    'get_remnote_capability_guide',
    {
      title: 'Get RemNote capability guide',
      description:
        'Use this before planning RemNote notes. Returns a compact knowledge pool for Rems, documents, folders, hierarchy, formatting, flashcards, references, tags, portals, and the safest bridge workflow.',
      inputSchema: z.object({
        section: REMNOTE_GUIDE_SECTION_SCHEMA.describe('Guide section to return. Use all for the complete knowledge pool.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async ({ section }) => {
      const guide = getRemnoteCapabilityGuide(section as RemnoteCapabilityGuideSection);
      const operationId = `guide-${Date.now().toString(36)}`;
      const standard = {
        status: 'PASS',
        toolName: 'get_remnote_capability_guide',
        operationId,
        target: { section },
        created: [],
        updated: [],
        deleted: [],
        counts: { created: 0, updated: 0, deleted: 0, sections: guide.blocks.length },
        verification: { section },
        phaseDurations: {},
        warnings: [],
      };
      return {
        content: [
          {
            type: 'text',
            text: guide.blocks
              .map((block) => `${block.title}\n${block.facts.join('\n')}\nBridge use:\n${block.bridgeUse.join('\n')}`)
              .join('\n\n'),
          },
        ],
        structuredContent: {
          ok: true,
          ...standard,
          result: guide,
          standard,
        },
      };
    }
  );
}
