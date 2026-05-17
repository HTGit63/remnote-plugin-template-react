import {
  DEFAULT_TOOL_PROFILE,
  filterToolsForProfile,
  getProfileHiddenTools,
  groupToolsByPolicy,
  type ToolProfile,
} from './tool-policy.js';

export const TOOL_REGISTRY_VERSION = '2026-05-15.2';
export const MCP_DISCOVERY_VERSION = `mcp-discovery-${TOOL_REGISTRY_VERSION}`;
export const BRIDGE_PLUGIN_PROTOCOL_VERSION = 1;
export const SERVER_VERSION = '0.1.0';
export const STATIC_SDK_UNSUPPORTED_TOOLS = ['create_folder'] as const;
export const SERVER_LOCAL_MCP_TOOLS = [
  'get_bridge_status',
  'get_bridge_diagnostics',
  'run_bridge_health_check',
  'get_remnote_capability_guide',
] as const;

export type McpToolExposure = 'public' | 'gated';

export interface McpToolRegistryEntry {
  name: string;
  exposure: McpToolExposure;
  hiddenReason?: string;
}

export const MCP_TOOL_REGISTRY = [
  { name: 'get_bridge_status', exposure: 'public' },
  { name: 'get_bridge_diagnostics', exposure: 'public' },
  { name: 'run_bridge_health_check', exposure: 'public' },
  { name: 'get_remnote_capability_guide', exposure: 'public' },
  { name: 'ping_remnote_plugin', exposure: 'public' },
  { name: 'get_plugin_status', exposure: 'public' },
  { name: 'get_focused_rem', exposure: 'public' },
  { name: 'get_rem', exposure: 'public' },
  { name: 'get_rem_tree', exposure: 'public' },
  { name: 'get_rem_rich', exposure: 'public' },
  { name: 'debug_get_raw_rich_text', exposure: 'public' },
  { name: 'get_current_selection', exposure: 'public' },
  { name: 'get_children', exposure: 'public' },
  { name: 'get_rem_breadcrumbs', exposure: 'public' },
  { name: 'search_rems', exposure: 'public' },
  { name: 'get_document_or_folder_tree', exposure: 'public' },
  { name: 'create_rem', exposure: 'public' },
  { name: 'create_document', exposure: 'public' },
  { name: 'create_folder', exposure: 'public' },
  { name: 'append_to_rem', exposure: 'public' },
  { name: 'update_rem', exposure: 'public' },
  { name: 'replace_rem', exposure: 'public' },
  { name: 'move_rem', exposure: 'public' },
  { name: 'reorder_children', exposure: 'public' },
  { name: 'delete_rem_by_id', exposure: 'public' },
  { name: 'create_rem_tree', exposure: 'public' },
  { name: 'update_rem_rich', exposure: 'public' },
  { name: 'set_rem_heading_level', exposure: 'public' },
  { name: 'set_rem_text_color', exposure: 'public' },
  { name: 'set_rem_highlight_color', exposure: 'public' },
  { name: 'set_text_span_color', exposure: 'public' },
  { name: 'set_text_span_highlight', exposure: 'public' },
  { name: 'set_rem_type', exposure: 'public' },
  { name: 'set_hide_bullet', exposure: 'public' },
  { name: 'clear_rem_formatting', exposure: 'public' },
  { name: 'create_styled_rem_tree', exposure: 'public' },
  { name: 'apply_remnote_command', exposure: 'public' },
  { name: 'apply_structured_note_batch', exposure: 'public' },
  { name: 'create_polished_note_tree', exposure: 'public' },
  { name: 'apply_style_plan', exposure: 'public' },
  { name: 'verify_note_design', exposure: 'public' },
  { name: 'create_basic_flashcard', exposure: 'public' },
  { name: 'create_concept_card', exposure: 'public' },
  { name: 'create_descriptor_card', exposure: 'public' },
  { name: 'create_cloze_card', exposure: 'public' },
  { name: 'create_multiple_choice_card', exposure: 'public' },
  { name: 'create_list_answer_card', exposure: 'public' },
  {
    name: 'delete_rem',
    exposure: 'gated',
    hiddenReason:
      'Legacy arbitrary Rem ID delete is disabled by default. Use guarded delete_rem_by_id.',
  },
  {
    name: 'delete_focused_rem',
    exposure: 'gated',
    hiddenReason:
      'Legacy focus-based delete is hidden because RemNote focus can point at the wrong root. Use delete_rem_by_id with dryRun and guards.',
  },
  {
    name: 'delete_selected_rem',
    exposure: 'gated',
    hiddenReason:
      'Legacy selection-based delete is hidden because RemNote selection can point at the wrong root. Use delete_rem_by_id with dryRun and guards.',
  },
] as const satisfies readonly McpToolRegistryEntry[];

export type RegisteredMcpToolName = (typeof MCP_TOOL_REGISTRY)[number]['name'];

export function getAllPublicMcpToolNames(exposeDeleteTool = false): string[] {
  return MCP_TOOL_REGISTRY.filter((tool) => tool.exposure === 'public' || exposeDeleteTool).map(
    (tool) => tool.name
  );
}

export function getPublicMcpToolNames(
  exposeDeleteTool = false,
  profile: ToolProfile = DEFAULT_TOOL_PROFILE
): string[] {
  return filterToolsForProfile(getAllPublicMcpToolNames(exposeDeleteTool), profile);
}

export function isPublicMcpToolName(
  name: string,
  exposeDeleteTool = false,
  profile: ToolProfile = DEFAULT_TOOL_PROFILE
): boolean {
  return getPublicMcpToolNames(exposeDeleteTool, profile).includes(name);
}

export function getHiddenMcpTools(exposeDeleteTool = false): Array<{ name: string; reason: string }> {
  return MCP_TOOL_REGISTRY.filter((tool) => tool.exposure === 'gated' && !exposeDeleteTool).map((tool) => ({
    name: tool.name,
    reason:
      'hiddenReason' in tool
        ? tool.hiddenReason
        : 'Tool is not exposed by current server configuration.',
  }));
}

export function getRegistryMismatch(
  exposeDeleteTool: boolean,
  registeredToolNames: readonly string[],
  profile: ToolProfile = DEFAULT_TOOL_PROFILE
) {
  const expected = getPublicMcpToolNames(exposeDeleteTool, profile);
  const registered = [...registeredToolNames];
  return {
    missing: expected.filter((tool) => !registered.includes(tool)),
    unexpected: registered.filter((tool) => !expected.includes(tool)),
  };
}

export function assertRegisteredToolsMatchRegistry(
  exposeDeleteTool: boolean,
  registeredToolNames: readonly string[],
  profile: ToolProfile = DEFAULT_TOOL_PROFILE
) {
  const mismatch = getRegistryMismatch(exposeDeleteTool, registeredToolNames, profile);
  if (mismatch.missing.length || mismatch.unexpected.length) {
    throw new Error(
      `MCP tool registry mismatch. Missing: ${mismatch.missing.join(', ') || 'none'}; unexpected: ${
        mismatch.unexpected.join(', ') || 'none'
      }.`
    );
  }
}

export function getToolRegistrySummary(
  exposeDeleteTool = false,
  profile: ToolProfile = DEFAULT_TOOL_PROFILE,
  registeredToolNames?: readonly string[],
  auth?: {
    discoveryAuthMode?: 'no_auth_required' | 'local_bearer_required';
    toolCallAuthMode?: 'no_auth_allowed' | 'local_bearer_required';
  }
) {
  const allPublicTools = getAllPublicMcpToolNames(exposeDeleteTool);
  const publicTools = getPublicMcpToolNames(exposeDeleteTool, profile);
  const registeredTools = registeredToolNames ? [...registeredToolNames] : [...publicTools];
  const hiddenTools = getHiddenMcpTools(exposeDeleteTool);
  const hiddenReasons = Object.fromEntries(hiddenTools.map((tool) => [tool.name, tool.reason]));
  const profileHiddenTools = getProfileHiddenTools(allPublicTools, profile);
  const policyGroups = groupToolsByPolicy(allPublicTools);
  const activePolicyGroups = groupToolsByPolicy(publicTools);
  const mismatch = getRegistryMismatch(exposeDeleteTool, registeredTools, profile);
  const sdkUnsupportedTools = publicTools.filter((tool) =>
    (STATIC_SDK_UNSUPPORTED_TOOLS as readonly string[]).includes(tool)
  );
  const serverLocalVerifiedTools = publicTools.filter((tool) =>
    (SERVER_LOCAL_MCP_TOOLS as readonly string[]).includes(tool)
  );
  const runtimeUnverifiedTools = publicTools.filter(
    (tool) => !sdkUnsupportedTools.includes(tool) && !serverLocalVerifiedTools.includes(tool)
  );

  return {
    serverVersion: SERVER_VERSION,
    pluginVersion: 'reported-by-plugin-status',
    toolProfile: profile,
    toolRegistryVersion: TOOL_REGISTRY_VERSION,
    serverToolRegistryVersion: TOOL_REGISTRY_VERSION,
    mcpDiscoveryVersion: MCP_DISCOVERY_VERSION,
    lastDiscoveryRefreshAt: new Date().toISOString(),
    pluginProtocolVersion: BRIDGE_PLUGIN_PROTOCOL_VERSION,
    registeredTools,
    allPublicTools,
    allPublicToolCount: allPublicTools.length,
    publicToolCount: publicTools.length,
    publicTools,
    exposedTools: [...publicTools],
    registryDeclaredTools: [...publicTools],
    mcpRegisteredTools: [...registeredTools],
    mcpListedTools: [...publicTools],
    callabilitySource: 'registry_only_not_live_execution' as const,
    serverLocalVerifiedTools,
    serverLocalVerifiedToolCount: serverLocalVerifiedTools.length,
    callableTools: [...serverLocalVerifiedTools],
    discoverableTools: [...publicTools],
    unauthDiscoverableTools:
      auth?.discoveryAuthMode === 'local_bearer_required' ? [] : [...publicTools],
    actualMcpCallableTools: [...serverLocalVerifiedTools],
    unauthMcpCallableTools:
      auth?.toolCallAuthMode === 'local_bearer_required' ? [] : [...serverLocalVerifiedTools],
    unauthToolCallAllowedTools:
      auth?.toolCallAuthMode === 'local_bearer_required' ? [] : [...publicTools],
    realPluginVerifiedTools: [],
    verifiedToolCount: serverLocalVerifiedTools.length,
    runtimeUnverifiedTools,
    runtimeUnverifiedToolCount: runtimeUnverifiedTools.length,
    sdkUnsupportedTools,
    preferredTools: activePolicyGroups.preferred,
    fallbackTools: activePolicyGroups.fallback,
    debugTools: activePolicyGroups.debug,
    readTools: activePolicyGroups.read,
    cardTools: activePolicyGroups.cards,
    dangerousTools: activePolicyGroups.dangerous,
    unsupportedTools: activePolicyGroups.unsupported,
    policyGroups,
    activePolicyGroups,
    profileHiddenTools,
    hiddenTools,
    hiddenReasons,
    registryMismatch: mismatch,
    deleteToolExposed: exposeDeleteTool,
    discoveryAuthMode: auth?.discoveryAuthMode ?? 'no_auth_required',
    toolCallAuthMode: auth?.toolCallAuthMode ?? 'no_auth_allowed',
  };
}
