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
import {
  BRIDGE_TOOL_OUTPUT_SCHEMA,
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
      const serverLocalTools = SERVER_LOCAL_MCP_TOOLS.filter((tool) => registry.publicTools.includes(tool));
      const successfulPluginTools = Array.from(
        new Set(
          diagnostics.recentRequests
            .filter((request) => request.ok)
            .map((request) => publicMcpToolNameForBridgeTool(request.tool))
        )
      );
      const sdkUnsupportedTools = Array.from(
        new Set([
          ...STATIC_SDK_UNSUPPORTED_TOOLS,
          ...diagnostics.recentRequests
            .filter((request) => request.errorCode === 'SDK_UNSUPPORTED' || request.sdkUnsupported)
            .map((request) => publicMcpToolNameForBridgeTool(request.tool)),
        ])
      ).filter((tool) => registry.publicTools.includes(tool));
      const callableTools = Array.from(new Set([...serverLocalTools, ...successfulPluginTools]));
      const runtimeUnverifiedTools = registry.publicTools.filter(
        (tool) => !callableTools.includes(tool) && !sdkUnsupportedTools.includes(tool)
      );
      const lastSuccessfulToolCalls = diagnostics.recentRequests
        .filter((request) => request.ok)
        .map((request) => ({
          ...request,
          mcpTool: publicMcpToolNameForBridgeTool(request.tool),
        }));
      const lastFailedToolCalls = diagnostics.recentRequests
        .filter((request) => !request.ok)
        .map((request) => ({
          ...request,
          mcpTool: publicMcpToolNameForBridgeTool(request.tool),
        }));
      const partialExecutions = diagnostics.recentRequests
        .filter((request) => request.partialExecution)
        .map((request) => ({
          ...request,
          mcpTool: publicMcpToolNameForBridgeTool(request.tool),
        }));
      return {
        content: [
          {
            type: 'text',
            text: `Bridge diagnostics: ${registry.publicToolCount} listed tools, ${successfulPluginTools.length} recently verified, ${diagnostics.status.pendingRequests} pending requests.`,
          },
        ],
        structuredContent: {
          ok: true,
          result: {
            ...registry,
            ...diagnostics,
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
            verifiedToolCount: successfulPluginTools.length,
            runtimeUnverifiedTools,
            runtimeUnverifiedToolCount: runtimeUnverifiedTools.length,
            sdkUnsupportedTools,
            callableTools,
            actualMcpCallableTools: callableTools,
            unauthMcpCallableTools:
              registry.toolCallAuthMode === 'no_auth_allowed' ? callableTools : [],
          },
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
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: {
        readOnlyHint: false,
        openWorldHint: false,
        destructiveHint: false,
        idempotentHint: false,
      },
    },
    async ({ mode, includeWrites, includeExistingRemMutations, parentId, targetRemId, timeoutMs }) => {
      const result = await runBridgeHealthCheck(hub, {
        mode,
        exposeDeleteTool,
        includeWrites,
        includeExistingRemMutations,
        parentId,
        targetRemId,
        timeoutMs,
        signal: requestSignal,
      });
      return {
        content: [
          {
            type: 'text',
            text: `Bridge health check ${result.status}: ${result.passedCount} passed, ${result.failedCount} failed, ${result.skippedCount} skipped, ${result.unsupportedCount} unsupported.`,
          },
        ],
        structuredContent: {
          ok: result.status !== 'failed',
          result,
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
          result: guide,
        },
      };
    }
  );
}
