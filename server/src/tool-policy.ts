export type ToolPolicy =
  | 'preferred'
  | 'fallback'
  | 'debug'
  | 'read'
  | 'cards'
  | 'legacy_hidden'
  | 'dangerous'
  | 'unsupported';

export type ToolProfile = 'simple' | 'full';

export interface ToolPolicyEntry {
  name: string;
  policy: ToolPolicy;
  preferredFor?: string[];
  avoidWhen?: string[];
  replacement?: string;
}

export const DEFAULT_TOOL_PROFILE: ToolProfile = 'full';

export const SIMPLE_PROFILE_TOOLS = [
  'get_bridge_status',
  'get_bridge_diagnostics',
  'run_bridge_health_check',
  'get_remnote_capability_guide',
  'get_plugin_status',
  'get_focused_rem',
  'get_rem',
  'get_rem_tree',
  'get_children',
  'get_rem_breadcrumbs',
  'search_rems',
  'create_polished_note_tree',
  'apply_structured_note_batch',
  'apply_style_plan',
  'verify_note_design',
  'delete_rem_by_id',
  'create_basic_flashcard',
  'create_concept_card',
  'create_descriptor_card',
  'create_cloze_card',
  'create_multiple_choice_card',
  'create_list_answer_card',
] as const;

export const TOOL_POLICY_ENTRIES = [
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
  {
    name: 'delete_rem',
    policy: 'legacy_hidden',
    replacement: 'delete_rem_by_id',
  },
  {
    name: 'delete_focused_rem',
    policy: 'legacy_hidden',
    replacement: 'delete_rem_by_id',
  },
  {
    name: 'delete_selected_rem',
    policy: 'legacy_hidden',
    replacement: 'delete_rem_by_id',
  },
] as const satisfies readonly ToolPolicyEntry[];

const TOOL_POLICY_BY_NAME: ReadonlyMap<string, ToolPolicyEntry> = new Map(
  TOOL_POLICY_ENTRIES.map((entry) => [entry.name, entry])
);

export function normalizeToolProfile(value: string | undefined): ToolProfile {
  return value === 'simple' || value === 'full' ? value : DEFAULT_TOOL_PROFILE;
}

export function getToolPolicyEntry(name: string): ToolPolicyEntry {
  return TOOL_POLICY_BY_NAME.get(name) ?? { name, policy: 'fallback' };
}

export function isToolVisibleInProfile(name: string, profile: ToolProfile): boolean {
  return profile === 'full' || (SIMPLE_PROFILE_TOOLS as readonly string[]).includes(name);
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
    legacy_hidden: [],
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
      reason: 'Hidden by REMNOTE_BRIDGE_TOOL_PROFILE=simple to reduce normal-use tool choice.',
      policy: getToolPolicyEntry(tool).policy,
      replacement: getToolPolicyEntry(tool).replacement,
    }));
}
