import type { BridgeToolName } from '../../shared/bridge/protocol.js';
import { BRIDGE_TOOL_NAMES } from '../../shared/bridge/protocol-registry.js';

const BRIDGE_TOOL_NAME_SET = new Set<string>(BRIDGE_TOOL_NAMES);

export function publicMcpToolNameForBridgeTool(tool: BridgeToolName): string {
  switch (tool) {
    case 'ping':
      return 'ping_remnote_plugin';
    case 'get_status':
      return 'get_plugin_status';
    default:
      return tool;
  }
}

export function bridgeToolNameForPublicMcpTool(tool: string): BridgeToolName | undefined {
  switch (tool) {
    case 'ping_remnote_plugin':
      return 'ping';
    case 'get_plugin_status':
      return 'get_status';
    default:
      return BRIDGE_TOOL_NAME_SET.has(tool) ? (tool as BridgeToolName) : undefined;
  }
}
