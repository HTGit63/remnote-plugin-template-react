export type ToolPolicy =
  | 'preferred'
  | 'fallback'
  | 'debug'
  | 'read'
  | 'cards'
  | 'dangerous'
  | 'unsupported';

export type ToolTier = 'core' | 'advanced_notes' | 'developer_diagnostics' | 'full';
export type ToolProfile = ToolTier;
export type ToolCategory =
  | 'status'
  | 'read'
  | 'write'
  | 'formatting'
  | 'batch'
  | 'cards'
  | 'diagnostics'
  | 'delete'
  | 'debug';
export type ToolRiskLevel = 'low' | 'medium' | 'high' | 'dangerous';

export interface ToolPolicyEntry {
  name: string;
  policy: ToolPolicy;
  preferredFor?: string[];
  avoidWhen?: string[];
  replacement?: string;
}

export interface ToolMetadata {
  name: string;
  tier: ToolTier | 'unsupported';
  category: ToolCategory;
  riskLevel: ToolRiskLevel;
  requiresWrite: boolean;
  requiresDelete: boolean;
  supportsDryRun: boolean;
  supportsIdempotency: boolean;
  recommendedForNormalUse: boolean;
  runtimeVerified: boolean;
  runtimeVerifiedSource: 'server_local' | 'recent_plugin_call' | 'registry_only';
  exposedNormally: boolean;
  sdkSupported: boolean;
}

export const DEFAULT_TOOL_PROFILE: ToolProfile = 'core';
export const TOOL_SCHEMA_VERSION = '2026-06-02.markdown-importer';

export const CORE_TIER_TOOLS = [
  'get_bridge_status',
  'get_plugin_status',
  'get_focused_rem',
  'get_rem',
  'get_children',
  'get_rem_tree',
  'get_rem_breadcrumbs',
  'search_rems',
  'create_basic_flashcard',
  'create_cloze_card',
  'create_multiple_choice_card',
  'create_list_answer_card',
  'delete_rem_by_id',
] as const;

export const ADVANCED_NOTES_TIER_TOOLS = [
  'get_current_selection',
  'get_rem_rich',
  'get_document_or_folder_tree',
  'create_rem',
  'create_document',
  'append_to_rem',
  'update_rem',
  'replace_rem',
  'move_rem',
  'reorder_children',
  'create_rem_tree',
  'update_rem_rich',
  'create_styled_rem_tree',
  'create_polished_note_tree',
  'create_or_replace_note_from_markdown',
  'apply_structured_note_batch',
  'apply_style_plan',
  'verify_note_design',
  'apply_remnote_command',
  'set_rem_heading_level',
  'set_rem_text_color',
  'set_rem_highlight_color',
  'set_text_span_color',
  'set_text_span_highlight',
  'set_rem_type',
  'set_hide_bullet',
  'clear_rem_formatting',
  'create_concept_card',
  'create_descriptor_card',
] as const;

export const DEVELOPER_DIAGNOSTICS_TIER_TOOLS = [
  'ping_remnote_plugin',
  'get_bridge_diagnostics',
  'run_bridge_health_check',
  'get_remnote_capability_guide',
  'debug_get_raw_rich_text',
] as const;

const CORE_SET = new Set<string>(CORE_TIER_TOOLS);
const ADVANCED_SET = new Set<string>(ADVANCED_NOTES_TIER_TOOLS);
const DEVELOPER_SET = new Set<string>(DEVELOPER_DIAGNOSTICS_TIER_TOOLS);

export const TOOL_POLICY_ENTRIES = [
  {
    name: 'create_or_replace_note_from_markdown',
    policy: 'preferred',
    preferredFor: ['long lecture notes', 'Markdown imports', 'ESSLCE notes', 'math-heavy bulk note transfer'],
  },
  {
    name: 'create_polished_note_tree',
    policy: 'preferred',
    preferredFor: ['complete notes', 'lessons', 'study trees', 'polished outlines'],
  },
  {
    name: 'apply_structured_note_batch',
    policy: 'preferred',
    preferredFor: ['atomic structured writing', 'dry-run then apply', 'math-heavy notes'],
  },
  {
    name: 'apply_style_plan',
    policy: 'preferred',
    preferredFor: ['multiple style changes on existing Rems'],
  },
  {
    name: 'verify_note_design',
    policy: 'preferred',
    preferredFor: ['post-write style and structure verification'],
  },
  {
    name: 'delete_rem_by_id',
    policy: 'preferred',
    preferredFor: ['guarded delete dry-run and disposable-child deletion'],
  },
  { name: 'get_bridge_status', policy: 'debug' },
  { name: 'get_bridge_diagnostics', policy: 'debug' },
  { name: 'run_bridge_health_check', policy: 'debug' },
  { name: 'get_remnote_capability_guide', policy: 'debug' },
  { name: 'debug_get_raw_rich_text', policy: 'debug' },
  { name: 'ping_remnote_plugin', policy: 'debug' },
  { name: 'get_plugin_status', policy: 'debug' },
  { name: 'get_current_selection', policy: 'debug' },
  { name: 'get_rem_rich', policy: 'debug' },
  { name: 'get_focused_rem', policy: 'read' },
  { name: 'get_rem', policy: 'read' },
  { name: 'get_rem_tree', policy: 'read' },
  { name: 'get_children', policy: 'read' },
  { name: 'get_rem_breadcrumbs', policy: 'read' },
  { name: 'search_rems', policy: 'read' },
  { name: 'get_document_or_folder_tree', policy: 'read' },
  {
    name: 'create_rem',
    policy: 'fallback',
    avoidWhen: ['creating complete notes'],
    replacement: 'create_polished_note_tree',
  },
  {
    name: 'create_document',
    policy: 'fallback',
    avoidWhen: ['creating complete notes under an existing parent'],
    replacement: 'create_polished_note_tree',
  },
  {
    name: 'append_to_rem',
    policy: 'fallback',
    avoidWhen: ['building multi-section notes'],
    replacement: 'apply_structured_note_batch',
  },
  { name: 'update_rem', policy: 'fallback' },
  {
    name: 'move_rem',
    policy: 'fallback',
    avoidWhen: ['new tree creation'],
    replacement: 'apply_structured_note_batch',
  },
  {
    name: 'reorder_children',
    policy: 'fallback',
    avoidWhen: ['new tree creation'],
    replacement: 'apply_structured_note_batch',
  },
  {
    name: 'create_rem_tree',
    policy: 'fallback',
    avoidWhen: ['polished notes with style or math'],
    replacement: 'create_polished_note_tree',
  },
  {
    name: 'create_styled_rem_tree',
    policy: 'fallback',
    avoidWhen: ['normal complete note generation'],
    replacement: 'create_polished_note_tree',
  },
  { name: 'update_rem_rich', policy: 'fallback' },
  { name: 'set_rem_heading_level', policy: 'fallback' },
  { name: 'set_rem_text_color', policy: 'fallback' },
  { name: 'set_rem_highlight_color', policy: 'fallback' },
  { name: 'set_text_span_color', policy: 'fallback' },
  { name: 'set_text_span_highlight', policy: 'fallback' },
  { name: 'set_rem_type', policy: 'fallback' },
  { name: 'set_hide_bullet', policy: 'fallback' },
  { name: 'clear_rem_formatting', policy: 'fallback' },
  { name: 'apply_remnote_command', policy: 'fallback' },
  { name: 'create_basic_flashcard', policy: 'cards' },
  { name: 'create_concept_card', policy: 'cards' },
  { name: 'create_descriptor_card', policy: 'cards' },
  { name: 'create_cloze_card', policy: 'cards' },
  { name: 'create_multiple_choice_card', policy: 'cards' },
  { name: 'create_list_answer_card', policy: 'cards' },
  {
    name: 'create_folder',
    policy: 'unsupported',
    replacement: 'create_document',
  },
  {
    name: 'replace_rem',
    policy: 'dangerous',
    avoidWhen: ['normal note creation', 'uncertain target identity'],
    replacement: 'update_rem',
  },
] as const satisfies readonly ToolPolicyEntry[];

const TOOL_POLICY_BY_NAME: ReadonlyMap<string, ToolPolicyEntry> = new Map(
  TOOL_POLICY_ENTRIES.map((entry) => [entry.name, entry])
);

function tierForTool(name: string): ToolMetadata['tier'] {
  if (CORE_SET.has(name)) return 'core';
  if (ADVANCED_SET.has(name)) return 'advanced_notes';
  if (DEVELOPER_SET.has(name)) return 'developer_diagnostics';
  return name === 'create_folder' ? 'unsupported' : 'advanced_notes';
}

function meta(
  name: string,
  category: ToolCategory,
  riskLevel: ToolRiskLevel,
  flags: Partial<Omit<ToolMetadata, 'name' | 'tier' | 'category' | 'riskLevel'>> = {}
): ToolMetadata {
  const requiresDelete = flags.requiresDelete ?? (riskLevel === 'dangerous' && name.startsWith('delete_'));
  const requiresWrite =
    flags.requiresWrite ?? (requiresDelete || ['write', 'formatting', 'batch', 'cards', 'delete'].includes(category));
  return {
    name,
    tier: tierForTool(name),
    category,
    riskLevel,
    requiresWrite,
    requiresDelete,
    supportsDryRun: flags.supportsDryRun ?? false,
    supportsIdempotency: flags.supportsIdempotency ?? false,
    recommendedForNormalUse: flags.recommendedForNormalUse ?? (tierForTool(name) !== 'developer_diagnostics' && riskLevel !== 'dangerous'),
    runtimeVerified: flags.runtimeVerified ?? false,
    runtimeVerifiedSource: flags.runtimeVerifiedSource ?? 'registry_only',
    exposedNormally: flags.exposedNormally ?? tierForTool(name) !== 'unsupported',
    sdkSupported: flags.sdkSupported ?? tierForTool(name) !== 'unsupported',
  };
}

export const TOOL_METADATA = [
  meta('get_bridge_status', 'status', 'low', { runtimeVerified: true, runtimeVerifiedSource: 'server_local' }),
  meta('get_plugin_status', 'status', 'low'),
  meta('get_focused_rem', 'read', 'low'),
  meta('get_rem', 'read', 'low'),
  meta('get_children', 'read', 'low'),
  meta('get_rem_tree', 'read', 'low'),
  meta('get_rem_breadcrumbs', 'read', 'low'),
  meta('search_rems', 'read', 'low'),
  meta('create_basic_flashcard', 'cards', 'medium', { supportsIdempotency: true }),
  meta('create_cloze_card', 'cards', 'medium', { supportsIdempotency: true }),
  meta('create_multiple_choice_card', 'cards', 'medium', { supportsIdempotency: true }),
  meta('create_list_answer_card', 'cards', 'medium', { supportsIdempotency: true }),
  meta('delete_rem_by_id', 'delete', 'dangerous', {
    requiresDelete: true,
    supportsDryRun: true,
    supportsIdempotency: true,
    recommendedForNormalUse: true,
  }),
  meta('get_current_selection', 'read', 'low'),
  meta('get_rem_rich', 'read', 'low'),
  meta('get_document_or_folder_tree', 'read', 'low'),
  meta('create_rem', 'write', 'medium', { supportsIdempotency: true }),
  meta('create_document', 'write', 'medium', { supportsIdempotency: true }),
  meta('append_to_rem', 'write', 'medium', { supportsIdempotency: true }),
  meta('update_rem', 'write', 'high', { supportsDryRun: true, supportsIdempotency: true }),
  meta('replace_rem', 'write', 'dangerous', { supportsDryRun: true, supportsIdempotency: true, recommendedForNormalUse: false }),
  meta('move_rem', 'write', 'high', { supportsDryRun: true, supportsIdempotency: true }),
  meta('reorder_children', 'write', 'high', { supportsDryRun: true, supportsIdempotency: true }),
  meta('create_rem_tree', 'write', 'medium', { supportsIdempotency: true }),
  meta('update_rem_rich', 'write', 'high', { supportsIdempotency: true }),
  meta('create_styled_rem_tree', 'batch', 'medium', { supportsDryRun: true, supportsIdempotency: true }),
  meta('create_polished_note_tree', 'batch', 'medium', { supportsDryRun: true, supportsIdempotency: true }),
  meta('create_or_replace_note_from_markdown', 'batch', 'medium', { supportsDryRun: true, supportsIdempotency: true }),
  meta('apply_structured_note_batch', 'batch', 'medium', { supportsDryRun: true, supportsIdempotency: true }),
  meta('apply_style_plan', 'formatting', 'medium', { supportsDryRun: true, supportsIdempotency: true }),
  meta('verify_note_design', 'read', 'low'),
  meta('apply_remnote_command', 'formatting', 'medium', { supportsDryRun: true, supportsIdempotency: true }),
  meta('set_rem_heading_level', 'formatting', 'medium'),
  meta('set_rem_text_color', 'formatting', 'medium'),
  meta('set_rem_highlight_color', 'formatting', 'medium'),
  meta('set_text_span_color', 'formatting', 'medium'),
  meta('set_text_span_highlight', 'formatting', 'medium'),
  meta('set_rem_type', 'formatting', 'medium'),
  meta('set_hide_bullet', 'formatting', 'medium'),
  meta('clear_rem_formatting', 'formatting', 'high'),
  meta('create_concept_card', 'cards', 'medium', { supportsIdempotency: true }),
  meta('create_descriptor_card', 'cards', 'medium', { supportsIdempotency: true }),
  meta('ping_remnote_plugin', 'diagnostics', 'low'),
  meta('get_bridge_diagnostics', 'diagnostics', 'low', { runtimeVerified: true, runtimeVerifiedSource: 'server_local' }),
  meta('run_bridge_health_check', 'diagnostics', 'high', { runtimeVerified: true, runtimeVerifiedSource: 'server_local' }),
  meta('get_remnote_capability_guide', 'diagnostics', 'low', { runtimeVerified: true, runtimeVerifiedSource: 'server_local' }),
  meta('debug_get_raw_rich_text', 'debug', 'low'),
  meta('create_folder', 'write', 'medium', {
    requiresWrite: true,
    exposedNormally: false,
    sdkSupported: false,
    recommendedForNormalUse: false,
  }),
] as const satisfies readonly ToolMetadata[];

const TOOL_METADATA_BY_NAME: ReadonlyMap<string, ToolMetadata> = new Map(
  TOOL_METADATA.map((entry) => [entry.name, entry])
);

export function normalizeToolProfile(value: string | undefined): ToolProfile {
  switch (value) {
    case 'simple':
    case 'core':
      return 'core';
    case 'advanced_notes':
      return 'advanced_notes';
    case 'developer_diagnostics':
      return 'developer_diagnostics';
    case 'full':
      return 'full';
    default:
      return DEFAULT_TOOL_PROFILE;
  }
}

export function getToolPolicyEntry(name: string): ToolPolicyEntry {
  return TOOL_POLICY_BY_NAME.get(name) ?? { name, policy: 'fallback' };
}

export function getToolMetadata(name: string): ToolMetadata {
  return TOOL_METADATA_BY_NAME.get(name) ?? meta(name, 'write', 'medium');
}

export function isToolVisibleInProfile(name: string, profile: ToolProfile): boolean {
  if (!getToolMetadata(name).exposedNormally) {
    return false;
  }
  if (profile === 'full') {
    return true;
  }
  if (CORE_SET.has(name)) {
    return true;
  }
  if (profile === 'advanced_notes') {
    return ADVANCED_SET.has(name);
  }
  if (profile === 'developer_diagnostics') {
    return DEVELOPER_SET.has(name);
  }
  return false;
}

export function filterToolsForProfile<T extends string>(tools: readonly T[], profile: ToolProfile): T[] {
  return tools.filter((tool) => isToolVisibleInProfile(tool, profile));
}

export function groupToolsByPolicy(toolNames: readonly string[]) {
  const groups: Record<ToolPolicy, string[]> = {
    preferred: [],
    fallback: [],
    debug: [],
    read: [],
    cards: [],
    dangerous: [],
    unsupported: [],
  };

  for (const toolName of toolNames) {
    groups[getToolPolicyEntry(toolName).policy].push(toolName);
  }

  return groups;
}

export function getProfileHiddenTools(allPublicTools: readonly string[], profile: ToolProfile) {
  if (profile === 'full') {
    return [];
  }

  return allPublicTools
    .filter((tool) => !isToolVisibleInProfile(tool, profile))
    .map((tool) => ({
      name: tool,
      reason: `Hidden by active RemNote MCP tool tier "${profile}".`,
      policy: getToolPolicyEntry(tool).policy,
      replacement: getToolPolicyEntry(tool).replacement,
      tier: getToolMetadata(tool).tier,
    }));
}

export function getToolTierSummary(profile: ToolProfile) {
  return {
    activeTier: profile,
    aliases: {
      simple: 'core',
      full: 'full',
    },
    tiers: {
      core: [...CORE_TIER_TOOLS],
      advanced_notes: [...ADVANCED_NOTES_TIER_TOOLS],
      developer_diagnostics: [...DEVELOPER_DIAGNOSTICS_TIER_TOOLS],
      full: TOOL_METADATA.filter((tool) => tool.exposedNormally).map((tool) => tool.name),
    },
  };
}
