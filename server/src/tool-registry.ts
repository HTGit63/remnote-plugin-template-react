export const TOOL_REGISTRY_VERSION = '2026-05-09.2';

export const PUBLIC_MCP_TOOL_NAMES = [
  'get_bridge_status',
  'get_bridge_diagnostics',
  'ping_remnote_plugin',
  'get_plugin_status',
  'get_focused_rem',
  'get_rem',
  'get_rem_tree',
  'get_rem_rich',
  'get_current_selection',
  'get_children',
  'get_rem_breadcrumbs',
  'search_rems',
  'get_document_or_folder_tree',
  'create_rem',
  'create_document',
  'create_folder',
  'append_to_rem',
  'update_rem',
  'replace_rem',
  'move_rem',
  'reorder_children',
  'delete_focused_rem',
  'delete_selected_rem',
  'create_rem_tree',
] as const;

export const GATED_MCP_TOOL_NAMES = ['delete_rem'] as const;

export function getToolRegistrySummary(exposeDeleteTool = false) {
  const publicTools = exposeDeleteTool
    ? [...PUBLIC_MCP_TOOL_NAMES, ...GATED_MCP_TOOL_NAMES]
    : [...PUBLIC_MCP_TOOL_NAMES];

  return {
    toolRegistryVersion: TOOL_REGISTRY_VERSION,
    publicToolCount: publicTools.length,
    publicTools,
    deleteToolExposed: exposeDeleteTool,
  };
}
