import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type {
  BridgeFailure,
  BridgeResponse,
  BridgeToolAnnotations,
  BridgeToolArgs,
  BridgeToolName,
} from '../../../src/bridge/protocol.js';
import { BRIDGE_TOOL_ANNOTATIONS } from '../../../src/bridge/protocol.js';
import type { BridgeHub } from '../bridge-hub.js';
import type { getToolRegistrySummary } from '../tool-registry.js';

export type McpToolResult = {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
};

export type CallPluginFunction = <TTool extends BridgeToolName>(
  tool: TTool,
  args: BridgeToolArgs[TTool],
  timeoutMs?: number,
) => Promise<BridgeResponse>;

type RegisterToolArgs = Parameters<McpServer['registerTool']>;
export type RegisterToolFunction = McpServer['registerTool'];
export type ToolRegistrySnapshot = ReturnType<typeof getToolRegistrySummary>;

export interface ToolRegistrationContext {
  hub: BridgeHub;
  registerTool: RegisterToolFunction;
  callPlugin: CallPluginFunction;
  currentRegistry: () => ToolRegistrySnapshot;
  exposeDeleteTool: boolean;
  requestSignal?: AbortSignal;
}

export function annotationsFor(tool: BridgeToolName): BridgeToolAnnotations {
  return BRIDGE_TOOL_ANNOTATIONS[tool];
}

export function defaultTimeoutForTool(tool: BridgeToolName): number {
  const annotations = annotationsFor(tool);
  return annotations.destructiveHint === true ? 20000 : 12000;
}

export function failureToToolResult(failure: BridgeFailure): McpToolResult {
  return {
    isError: true,
    content: [
      {
        type: 'text',
        text: `${failure.error.code}: ${failure.error.message}`,
      },
    ],
    structuredContent: {
      ok: false,
      error: failure.error,
    },
  };
}

export function internalErrorToToolResult(error: unknown): McpToolResult {
  const message = error instanceof Error ? error.message : String(error);
  console.error('MCP bridge tool failed:', message);
  return failureToToolResult({
    id: 'unknown',
    ok: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Bridge tool call failed internally.',
      details: {
        message,
      },
    },
  });
}

export function successToToolResult(response: BridgeResponse, message: string): McpToolResult {
  if (!response.ok) {
    return failureToToolResult(response);
  }

  return {
    content: [
      {
        type: 'text',
        text: message,
      },
    ],
    structuredContent: {
      ok: true,
      result: response.result,
    },
  };
}

export async function bridgeToolResult(
  call: () => Promise<BridgeResponse>,
  successMessage: string,
): Promise<McpToolResult> {
  try {
    return successToToolResult(await call(), successMessage);
  } catch (error) {
    return internalErrorToToolResult(error);
  }
}
