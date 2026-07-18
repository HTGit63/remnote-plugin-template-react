import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { BridgeToolArgs, BridgeToolName } from '../../shared/bridge/protocol.js';
import type { BridgeHub } from './bridge-hub.js';
import type { AuthenticatedPrincipal } from './auth/types.js';
import type { BridgeRuntimeInfo, BridgeTimeoutBudgets } from './config.js';
import type { StorageProvider } from './storage/types.js';
import type { BulkImportSourceFilePolicy } from './bulk-import/source-file-loader.js';
import {
  assertRegisteredToolsMatchRegistry,
  getPublicMcpToolNames,
  getToolRegistrySummary,
  type RegisteredMcpToolName,
} from './tool-registry.js';
import { publicMcpToolNameForBridgeTool } from './mcp-tool-map.js';
import { DEFAULT_TOOL_PROFILE, getToolMetadata, type ToolProfile } from './tool-policy.js';
import { registerCardTools } from './tools/register-card-tools.js';
import { registerBulkImportTools } from './tools/register-bulk-import-tools.js';
import { registerDeleteTools } from './tools/register-delete-tools.js';
import {
  registerDesignedNoteTools,
  registerDesignTemplateTools,
  registerHighLevelCardWorkflowTools,
} from './tools/register-design-tools.js';
import { registerDiagnosticTools } from './tools/register-diagnostic-tools.js';
import { registerFormattingTools, registerStyleVerificationTools } from './tools/register-formatting-tools.js';
import { registerMediaTools } from './tools/register-media-tools.js';
import { registerReadTools } from './tools/register-read-tools.js';
import { registerStatusTools } from './tools/register-status-tools.js';
import {
  registerBasicWriteTools,
  registerHighLevelWriteTools,
  registerTreeWriteTools,
} from './tools/register-write-tools.js';
import { defaultTimeoutForTool, type ToolRegistrationContext } from './tools/tool-context.js';

export interface CreateMcpServerOptions {
  exposeDeleteTool?: boolean;
  toolProfile?: ToolProfile;
  requestSignal?: AbortSignal;
  discoveryAuthMode?: 'no_auth_required' | 'local_bearer_required' | 'hosted_oauth_required';
  toolCallAuthMode?: 'no_auth_allowed' | 'local_bearer_required' | 'connector_compat_no_auth_tools' | 'hosted_oauth_required';
  runtimeInfo?: BridgeRuntimeInfo;
  timeoutBudgets?: BridgeTimeoutBudgets;
  principal?: AuthenticatedPrincipal;
  storage?: StorageProvider;
  sourceFilePolicy?: BulkImportSourceFilePolicy;
}

export function createMcpServer(hub: BridgeHub, options: CreateMcpServerOptions = {}): McpServer {
  const toolProfile = options.toolProfile ?? DEFAULT_TOOL_PROFILE;
  const activeToolNames = new Set(getPublicMcpToolNames(Boolean(options.exposeDeleteTool), toolProfile));
  const server = new McpServer(
    {
      name: 'remnote-local-bridge',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  const registeredToolNames: RegisteredMcpToolName[] = [];
  const currentRegistry = () =>
    getToolRegistrySummary(Boolean(options.exposeDeleteTool), toolProfile, registeredToolNames, {
      discoveryAuthMode: options.discoveryAuthMode ?? 'no_auth_required',
      toolCallAuthMode: options.toolCallAuthMode ?? 'no_auth_allowed',
    });
  const callPlugin = async <TTool extends BridgeToolName>(
    tool: TTool,
    args: BridgeToolArgs[TTool],
    timeoutMs = defaultTimeoutForTool(tool, args, options.timeoutBudgets),
  ) => {
    const response = await hub.callPlugin(tool, args, timeoutMs, options.requestSignal, options.principal);
    const mcpToolName = publicMcpToolNameForBridgeTool(tool);
    if (response.ok) {
      const result =
        typeof response.result === 'object' && response.result !== null && !Array.isArray(response.result)
          ? { ...response.result, toolName: mcpToolName }
          : { value: response.result, toolName: mcpToolName };
      return { ...response, result } as typeof response;
    }
    return { ...response, toolName: mcpToolName } as typeof response;
  };
  const registerTool = ((name: string, config: never, handler: never) => {
    if (!activeToolNames.has(name as RegisteredMcpToolName)) {
      return undefined as never;
    }
    registeredToolNames.push(name as RegisteredMcpToolName);
    const configRecord = config as Record<string, unknown>;
    const existingMeta = (config as { _meta?: Record<string, unknown> })._meta ?? {};
    const meta =
      options.toolCallAuthMode === 'hosted_oauth_required'
        ? {
            ...existingMeta,
            securitySchemes: [
              {
                type: 'oauth2',
                scopes: requiredOAuthScopesForTool(name),
              },
            ],
          }
        : existingMeta;
    return server.registerTool(
      name,
      {
        ...configRecord,
        _meta: meta,
      } as never,
      handler
    );
  }) as McpServer['registerTool'];

  const context: ToolRegistrationContext = {
    hub,
    registerTool,
    callPlugin,
    currentRegistry,
    exposeDeleteTool: Boolean(options.exposeDeleteTool),
    requestSignal: options.requestSignal,
    runtimeInfo: options.runtimeInfo,
    timeoutBudgets: options.timeoutBudgets,
    toolProfile,
    principal: options.principal,
    storage: options.storage,
    sourceFilePolicy: options.sourceFilePolicy,
  };

  registerStatusTools(context);
  registerBulkImportTools(context);
  registerDiagnosticTools(context);
  registerReadTools(context);
  registerBasicWriteTools(context);
  registerMediaTools(context);
  registerDeleteTools(context);
  registerTreeWriteTools(context);
  registerFormattingTools(context);
  registerHighLevelWriteTools(context);
  registerStyleVerificationTools(context);
  registerDesignTemplateTools(context);
  registerDesignedNoteTools(context);
  registerHighLevelCardWorkflowTools(context);
  registerCardTools(context);

  assertRegisteredToolsMatchRegistry(Boolean(options.exposeDeleteTool), registeredToolNames, toolProfile);
  if (options.toolCallAuthMode === 'hosted_oauth_required') {
    exposeOpenAiToolSecuritySchemes(server);
  }

  return server;
}

/**
 * MCP SDK 1.29 retains extension metadata under `_meta` but does not serialize
 * OpenAI's current top-level `securitySchemes` extension. Mirror the already
 * validated scheme into tools/list while keeping `_meta` for older clients.
 */
function exposeOpenAiToolSecuritySchemes(server: McpServer): void {
  type RawHandler = (request: unknown, extra: unknown) => Promise<unknown>;
  type ToolListResult = {
    tools: Array<{
      _meta?: Record<string, unknown>;
      securitySchemes?: unknown;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  };

  const protocol = server.server as unknown as {
    _requestHandlers: Map<string, RawHandler>;
  };
  const original = protocol._requestHandlers.get('tools/list');
  if (!original) {
    throw new Error('MCP SDK tools/list handler is unavailable for OpenAI auth metadata.');
  }

  server.server.setRequestHandler(ListToolsRequestSchema, async (request, extra) => {
    const listed = await original(request, extra) as ToolListResult;
    return {
      ...listed,
      tools: listed.tools.map((tool) => {
        const securitySchemes = tool._meta?.securitySchemes;
        return securitySchemes
          ? { ...tool, securitySchemes }
          : tool;
      }),
    } as never;
  });
}

function requiredOAuthScopesForTool(name: string): string[] {
  const metadata = getToolMetadata(name);
  if (metadata.requiresDelete || metadata.isDangerous) {
    return ['bridge:read', 'bridge:write', 'bridge:delete'];
  }

  if (metadata.requiresWrite) {
    return ['bridge:read', 'bridge:write', 'bridge:trusted_write'];
  }

  return ['bridge:read'];
}
