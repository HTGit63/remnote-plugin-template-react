export type ToolPolicy =
  | 'preferred'
  | 'fallback'
  | 'debug'
  | 'read'
  | 'cards'
  | 'dangerous'
  | 'unsupported';

export type ToolTier = 'basic' | 'note_writer' | 'power_user' | 'developer' | 'danger';
export type LegacyToolTier = 'core' | 'advanced_notes' | 'developer_diagnostics' | 'full';
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
  agentWarning?: string;
}

export const DEFAULT_TOOL_PROFILE: ToolProfile = 'note_writer';
export const TOOL_SCHEMA_VERSION = '2026-06-05.goal8-tier-model';

export const BASIC_TIER_TOOLS = [
  'get_bridge_status',
  'get_plugin_status',
  'get_focused_rem',
  'get_rem',
  'get_children',
  'get_rem_tree',
  'get_rem_breadcrumbs',
  'search_rems',
] as const;

export const NOTE_WRITER_TIER_TOOLS = [
  'get_current_selection',
  'get_rem_rich',
  'get_document_or_folder_tree',
  'create_rem',
  'create_document',
  'append_to_rem',
  'create_rem_tree',
  'create_styled_rem_tree',
  'create_polished_note_tree',
  'create_or_replace_note_from_markdown',
  'preview_markdown_note_tree',
  'create_note_from_markdown_tree',
  'append_markdown_as_rem_tree',
  'apply_structured_note_batch',
  'verify_note_design',
  'create_basic_flashcard',
  'create_cloze_card',
  'create_multiple_choice_card',
  'create_list_answer_card',
  'create_concept_card',
  'create_descriptor_card',
] as const;

export const POWER_USER_TIER_TOOLS = [
  'update_rem',
  'move_rem',
  'reorder_children',
  'update_rem_rich',
  'apply_style_plan',
  'apply_remnote_command',
  'set_rem_heading_level',
  'set_rem_text_color',
  'set_rem_highlight_color',
  'set_text_span_color',
  'set_text_span_highlight',
  'set_rem_type',
  'set_hide_bullet',
  'clear_rem_formatting',
] as const;

export const DEVELOPER_TIER_TOOLS = [
  'ping_remnote_plugin',
  'get_bridge_diagnostics',
  'run_bridge_health_check',
  'get_remnote_capability_guide',
  'debug_get_raw_rich_text',
] as const;

export const DANGER_TIER_TOOLS = [
  'delete_rem_by_id',
] as const;

const BASIC_SET = new Set<string>(BASIC_TIER_TOOLS);
const NOTE_WRITER_SET = new Set<string>(NOTE_WRITER_TIER_TOOLS);
const POWER_USER_SET = new Set<string>(POWER_USER_TIER_TOOLS);
const DEVELOPER_SET = new Set<string>(DEVELOPER_TIER_TOOLS);
const DANGER_SET = new Set<string>(DANGER_TIER_TOOLS);

export const TOOL_POLICY_ENTRIES = [
  {
    name: 'create_note_from_markdown_tree',
    policy: 'preferred',
    preferredFor: ['new Markdown notes', 'clean Rem hierarchy', 'formula-heavy notes', 'tables and worked examples'],
  },
  {
    name: 'append_markdown_as_rem_tree',
    policy: 'preferred',
    preferredFor: ['appending Markdown as child Rem hierarchy', 'structured note extension'],
  },
  {
    name: 'preview_markdown_note_tree',
    policy: 'preferred',
    preferredFor: ['dry-run Markdown import preview', 'checking formulas and hierarchy before writing'],
  },
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
    policy: 'dangerous',
    avoidWhen: ['normal note writing', 'uncertain target identity'],
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
  if (BASIC_SET.has(name)) return 'basic';
  if (NOTE_WRITER_SET.has(name)) return 'note_writer';
  if (POWER_USER_SET.has(name)) return 'power_user';
  if (DEVELOPER_SET.has(name)) return 'developer';
  if (DANGER_SET.has(name) || name === 'replace_rem') return 'danger';
  return name === 'create_folder' ? 'unsupported' : 'note_writer';
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
    recommendedForNormalUse: flags.recommendedForNormalUse ?? (tierForTool(name) !== 'developer' && riskLevel !== 'dangerous'),
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
    recommendedForNormalUse: false,
    agentWarning:
      'DANGER: delete_rem_by_id is destructive. Default dryRun=true. Real delete requires dryRun=false, confirmTitle, and expectedParentId or expectedAncestorId after user approval.',
  }),
  meta('get_current_selection', 'read', 'low'),
  meta('get_rem_rich', 'read', 'low'),
  meta('get_document_or_folder_tree', 'read', 'low'),
  meta('create_rem', 'write', 'medium', { supportsIdempotency: true }),
  meta('create_document', 'write', 'medium', { supportsIdempotency: true }),
  meta('append_to_rem', 'write', 'medium', { supportsIdempotency: true }),
  meta('update_rem', 'write', 'high', { supportsDryRun: true, supportsIdempotency: true }),
  meta('replace_rem', 'delete', 'dangerous', {
    requiresDelete: true,
    supportsDryRun: true,
    supportsIdempotency: true,
    recommendedForNormalUse: false,
    exposedNormally: false,
  }),
  meta('move_rem', 'write', 'high', { supportsDryRun: true, supportsIdempotency: true }),
  meta('reorder_children', 'write', 'high', { supportsDryRun: true, supportsIdempotency: true }),
  meta('create_rem_tree', 'write', 'medium', { supportsIdempotency: true }),
  meta('update_rem_rich', 'write', 'high', { supportsIdempotency: true }),
  meta('create_styled_rem_tree', 'batch', 'medium', { supportsDryRun: true, supportsIdempotency: true }),
  meta('create_polished_note_tree', 'batch', 'medium', { supportsDryRun: true, supportsIdempotency: true }),
  meta('create_or_replace_note_from_markdown', 'batch', 'medium', { supportsDryRun: true, supportsIdempotency: true }),
  meta('preview_markdown_note_tree', 'batch', 'low', {
    requiresWrite: false,
    supportsDryRun: true,
    supportsIdempotency: true,
  }),
  meta('create_note_from_markdown_tree', 'batch', 'medium', { supportsDryRun: true, supportsIdempotency: true }),
  meta('append_markdown_as_rem_tree', 'batch', 'medium', { supportsDryRun: true, supportsIdempotency: true }),
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
    case 'basic':
      return 'basic';
    case 'advanced_notes':
    case 'note_writer':
      return 'note_writer';
    case 'power_user':
      return 'power_user';
    case 'developer_diagnostics':
    case 'developer':
      return 'developer';
    case 'full':
    case 'danger':
      return 'danger';
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
  if (profile === 'danger') {
    return true;
  }
  if (BASIC_SET.has(name)) {
    return true;
  }
  if (profile === 'note_writer') {
    return NOTE_WRITER_SET.has(name);
  }
  if (profile === 'power_user') {
    return NOTE_WRITER_SET.has(name) || POWER_USER_SET.has(name);
  }
  if (profile === 'developer') {
    return NOTE_WRITER_SET.has(name) || POWER_USER_SET.has(name) || DEVELOPER_SET.has(name);
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
  if (profile === 'danger') {
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

export function getToolTierSummary(profile: ToolProfile, exposeDeleteTool = false) {
  return {
    activeTier: profile,
    aliases: {
      simple: 'basic',
      core: 'basic',
      advanced_notes: 'note_writer',
      developer_diagnostics: 'developer',
      full: 'danger',
    },
    tiers: {
      basic: [...BASIC_TIER_TOOLS],
      note_writer: filterToolsForProfile(TOOL_METADATA.map((tool) => tool.name), 'note_writer'),
      power_user: filterToolsForProfile(TOOL_METADATA.map((tool) => tool.name), 'power_user'),
      developer: filterToolsForProfile(TOOL_METADATA.map((tool) => tool.name), 'developer'),
      danger: TOOL_METADATA.filter((tool) => tool.exposedNormally && (exposeDeleteTool || tool.name !== 'delete_rem_by_id')).map((tool) => tool.name),
    },
  };
}

export function requiredOperationTierForTool(name: string): string {
  const metadata = getToolMetadata(name);
  if (metadata.requiresDelete || metadata.riskLevel === 'dangerous') {
    return 'Full Control With Delete Approval';
  }
  if (!metadata.requiresWrite) {
    return 'Read Only';
  }
  if (name === 'create_or_replace_note_from_markdown' || name === 'apply_structured_note_batch') {
    return 'Read + Create + Modify';
  }
  if (metadata.category === 'write' || metadata.category === 'cards' || metadata.category === 'batch') {
    if (
      name.startsWith('create_') ||
      name.startsWith('append_') ||
      name === 'apply_structured_note_batch' ||
      name === 'create_polished_note_tree' ||
      name === 'create_or_replace_note_from_markdown'
    ) {
      return 'Read + Create';
    }
  }
  return 'Read + Create + Modify';
}
