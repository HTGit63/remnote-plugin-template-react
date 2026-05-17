import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BridgeToolArgs, BridgeToolName } from '../../src/bridge/protocol.js';
import type { BridgeHub } from './bridge-hub.js';
import {
  assertRegisteredToolsMatchRegistry,
  getPublicMcpToolNames,
  getToolRegistrySummary,
  type RegisteredMcpToolName,
} from './tool-registry.js';
import { DEFAULT_TOOL_PROFILE, type ToolProfile } from './tool-policy.js';
import { registerCardTools } from './tools/register-card-tools.js';
import { registerDeleteTools } from './tools/register-delete-tools.js';
import { registerDiagnosticTools } from './tools/register-diagnostic-tools.js';
import { registerFormattingTools, registerStyleVerificationTools } from './tools/register-formatting-tools.js';
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
  discoveryAuthMode?: 'no_auth_required' | 'local_bearer_required';
  toolCallAuthMode?: 'no_auth_allowed' | 'local_bearer_required';
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
  const callPlugin = <TTool extends BridgeToolName>(
    tool: TTool,
    args: BridgeToolArgs[TTool],
    timeoutMs = defaultTimeoutForTool(tool),
  ) => hub.callPlugin(tool, args, timeoutMs, options.requestSignal);
  const registerTool = ((name: string, config: never, handler: never) => {
    if (!activeToolNames.has(name as RegisteredMcpToolName)) {
      return undefined as never;
    }
    registeredToolNames.push(name as RegisteredMcpToolName);
    return server.registerTool(name, config, handler);
  }) as McpServer['registerTool'];

  const context: ToolRegistrationContext = {
    hub,
    registerTool,
    callPlugin,
    currentRegistry,
    exposeDeleteTool: Boolean(options.exposeDeleteTool),
    requestSignal: options.requestSignal,
  };

  registerStatusTools(context);
  registerDiagnosticTools(context);
  registerReadTools(context);
  registerBasicWriteTools(context);
  registerDeleteTools(context);
  registerTreeWriteTools(context);
  registerFormattingTools(context);
  registerHighLevelWriteTools(context);
  registerStyleVerificationTools(context);
  registerCardTools(context);

  assertRegisteredToolsMatchRegistry(Boolean(options.exposeDeleteTool), registeredToolNames, toolProfile);

  return server;
}
