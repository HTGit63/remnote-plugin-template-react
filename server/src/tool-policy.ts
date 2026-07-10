export type ToolPolicy =
  | 'preferred'
  | 'fallback'
  | 'debug'
  | 'read'
  | 'cards'
  | 'dangerous'
  | 'unsupported';

export type ToolTier = 'basic' | 'mass_note_writer' | 'note_writer' | 'power_user' | 'developer' | 'danger';
export type LegacyToolTier = 'core' | 'advanced_notes' | 'developer_diagnostics' | 'full';
export type ToolProfile = ToolTier;
export type ToolCategory =
  | 'system'
  | 'read'
  | 'simple_write'
  | 'markdown_note'
  | 'structured_note'
  | 'design_template'
  | 'study_card'
  | 'table'
  | 'repair'
  | 'debug'
  | 'danger';
export type ToolRiskLevel = 'low' | 'medium' | 'high' | 'dangerous';
export type ToolOperationTier =
  | 'Read Only'
  | 'Read + Create'
  | 'Read + Create + Modify'
  | 'Full Control With Delete Approval'
  | 'Danger Zone';
export type ToolScopeRequirement =
  | 'none'
  | 'focused-rem'
  | 'current-rem-tree'
  | 'approved-root'
  | 'workspace_allowed';

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
  operationTier: ToolOperationTier;
  scopeRequirement: ToolScopeRequirement;
  toolAccessTier: ToolTier | 'unsupported';
  riskLevel: ToolRiskLevel;
  sdkCapability: string | null;
  isPublic: boolean;
  isDebug: boolean;
  isDangerous: boolean;
  liveVerificationRequired: boolean;
  performanceBudgetMs: number;
  userFacingName: string;
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
  hiddenReason?: string;
}

export const DEFAULT_TOOL_PROFILE: ToolProfile = 'mass_note_writer';
export const TOOL_SCHEMA_VERSION = '2026-07-10.file-import-safety';

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

export const MASS_NOTE_WRITER_TIER_TOOLS = [
  ...BASIC_TIER_TOOLS,
  'get_document_or_folder_tree',
  'create_or_replace_note_from_markdown',
  'plan_note_import',
  'plan_note_import_from_file',
  'start_note_import_job',
  'start_note_import_from_file',
  'run_note_import_job_step',
  'get_note_import_job_status',
  'resume_note_import_job',
  'verify_note_import_job',
  'cancel_note_import_job',
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
  'analyze_note_design',
  'save_note_design_template',
  'list_note_design_templates',
  'preview_note_design_plan',
  'export_note_design_template',
  'import_note_design_template',
  'create_designed_note_tree',
  'verify_note_against_design',
  'create_card_set_from_note',
  'create_flashcards_from_markdown',
  'create_cloze_cards_from_note',
  'verify_card_set',
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
  'update_note_with_design',
  'repair_note_design',
  'repair_card_set',
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
const MASS_NOTE_WRITER_SET = new Set<string>(MASS_NOTE_WRITER_TIER_TOOLS);
const NOTE_WRITER_SET = new Set<string>(NOTE_WRITER_TIER_TOOLS);
const POWER_USER_SET = new Set<string>(POWER_USER_TIER_TOOLS);
const DEVELOPER_SET = new Set<string>(DEVELOPER_TIER_TOOLS);
const DANGER_SET = new Set<string>(DANGER_TIER_TOOLS);

export const TOOL_POLICY_ENTRIES = [
  {
    name: 'create_note_from_markdown_tree',
    policy: 'fallback',
    preferredFor: ['new Markdown notes', 'clean Rem hierarchy', 'formula-heavy notes', 'tables and worked examples'],
    avoidWhen: ['mass note creation', 'normal ChatGPT note writing'],
    replacement: 'create_or_replace_note_from_markdown',
  },
  {
    name: 'append_markdown_as_rem_tree',
    policy: 'fallback',
    preferredFor: ['appending Markdown as child Rem hierarchy', 'structured note extension'],
    avoidWhen: ['mass note creation', 'normal ChatGPT note writing'],
    replacement: 'create_or_replace_note_from_markdown',
  },
  {
    name: 'preview_markdown_note_tree',
    policy: 'preferred',
    preferredFor: ['server-local Markdown import preview', 'checking formulas and hierarchy without writing'],
  },
  {
    name: 'create_or_replace_note_from_markdown',
    policy: 'preferred',
    preferredFor: ['long lecture notes', 'Markdown imports', 'ESSLCE notes', 'math-heavy bulk note transfer'],
  },
  {
    name: 'plan_note_import',
    policy: 'preferred',
    preferredFor: ['planning long Markdown imports into bounded chunks without writing'],
  },
  {
    name: 'plan_note_import_from_file',
    policy: 'preferred',
    preferredFor: ['planning full-source Markdown imports from server-side source files without tool-call text loss'],
  },
  {
    name: 'start_note_import_job',
    policy: 'preferred',
    preferredFor: ['creating resumable bulk import manifests'],
  },
  {
    name: 'start_note_import_from_file',
    policy: 'preferred',
    preferredFor: ['creating resumable bulk import jobs from server-side source files'],
  },
  {
    name: 'run_note_import_job_step',
    policy: 'preferred',
    preferredFor: ['writing one bounded import chunk at a time'],
  },
  {
    name: 'get_note_import_job_status',
    policy: 'preferred',
    preferredFor: ['checking resumable bulk import progress without writing'],
  },
  {
    name: 'resume_note_import_job',
    policy: 'preferred',
    preferredFor: ['continuing from pending or partial import chunks'],
  },
  {
    name: 'verify_note_import_job',
    policy: 'preferred',
    preferredFor: ['checking import manifest and normalized source fidelity'],
  },
  {
    name: 'cancel_note_import_job',
    policy: 'preferred',
    preferredFor: ['stopping future import chunks without deleting content'],
  },
  {
    name: 'create_polished_note_tree',
    policy: 'fallback',
    preferredFor: ['complete notes', 'lessons', 'study trees', 'polished outlines'],
    avoidWhen: ['mass note creation', 'normal ChatGPT note writing'],
    replacement: 'create_or_replace_note_from_markdown',
  },
  {
    name: 'apply_structured_note_batch',
    policy: 'fallback',
    preferredFor: ['atomic structured writing', 'dry-run then apply', 'math-heavy notes'],
    avoidWhen: ['mass note creation', 'normal ChatGPT note writing'],
    replacement: 'create_or_replace_note_from_markdown',
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
    name: 'analyze_note_design',
    policy: 'preferred',
    preferredFor: ['saving sample-based note designs', 'extracting reusable design rules'],
  },
  {
    name: 'save_note_design_template',
    policy: 'preferred',
    preferredFor: ['persisting local design templates'],
  },
  {
    name: 'preview_note_design_plan',
    policy: 'preferred',
    preferredFor: ['previewing design changes before writing'],
  },
  {
    name: 'create_designed_note_tree',
    policy: 'fallback',
    preferredFor: ['one-call polished note creation from content and a saved template'],
    avoidWhen: ['mass note creation', 'normal ChatGPT note writing'],
    replacement: 'create_or_replace_note_from_markdown',
  },
  {
    name: 'verify_note_against_design',
    policy: 'preferred',
    preferredFor: ['checking an existing note against a saved design template'],
  },
  {
    name: 'repair_note_design',
    policy: 'preferred',
    preferredFor: ['approved repair of note design problems'],
  },
  {
    name: 'create_card_set_from_note',
    policy: 'preferred',
    preferredFor: ['creating flashcards from an existing note while keeping the note primary'],
  },
  {
    name: 'create_flashcards_from_markdown',
    policy: 'preferred',
    preferredFor: ['creating clean flashcards from Markdown markers'],
  },
  {
    name: 'create_cloze_cards_from_note',
    policy: 'preferred',
    preferredFor: ['creating cloze cards from cloze-marked notes'],
  },
  {
    name: 'verify_card_set',
    policy: 'preferred',
    preferredFor: ['checking flashcard set cleanliness'],
  },
  {
    name: 'repair_card_set',
    policy: 'preferred',
    preferredFor: ['approved repair of flashcard set issues'],
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
  { name: 'list_note_design_templates', policy: 'read' },
  { name: 'export_note_design_template', policy: 'read' },
  { name: 'import_note_design_template', policy: 'fallback' },
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
  if (MASS_NOTE_WRITER_SET.has(name)) return 'mass_note_writer';
  if (NOTE_WRITER_SET.has(name)) return 'note_writer';
  if (POWER_USER_SET.has(name)) return 'power_user';
  if (DEVELOPER_SET.has(name)) return 'developer';
  if (DANGER_SET.has(name) || name === 'replace_rem') return 'danger';
  return name === 'create_folder' ? 'unsupported' : 'note_writer';
}

const WRITE_CATEGORIES = new Set<ToolCategory>([
  'simple_write',
  'markdown_note',
  'structured_note',
  'design_template',
  'study_card',
  'table',
  'repair',
  'danger',
]);

function userFacingNameForTool(name: string): string {
  return name
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function defaultSdkCapability(name: string, category: ToolCategory): string | null {
  if (name === 'create_folder') return 'no_verified_folder_api';
  if (
    [
      'plan_note_import',
      'plan_note_import_from_file',
      'start_note_import_job',
      'start_note_import_from_file',
      'get_note_import_job_status',
      'verify_note_import_job',
      'cancel_note_import_job',
    ].includes(name)
  ) {
    return 'server_local_bulk_import_manifest';
  }
  if (name === 'run_note_import_job_step' || name === 'resume_note_import_job') {
    return 'server_local_bulk_import_manifest + create_or_replace_note_from_markdown';
  }
  if (
    name === 'save_note_design_template' ||
    name === 'list_note_design_templates' ||
    name === 'export_note_design_template' ||
    name === 'import_note_design_template'
  ) {
    return 'plugin.storage.local';
  }
  if (name === 'analyze_note_design' || name === 'preview_note_design_plan' || name === 'verify_note_against_design') {
    return 'plugin.rem read SDK';
  }
  if (
    name === 'create_designed_note_tree' ||
    name === 'update_note_with_design' ||
    name === 'repair_note_design'
  ) {
    return 'plugin.rem.createTreeWithMarkdown + style setters';
  }
  if (name === 'create_rem' || name === 'create_document') return 'plugin.rem.createSingleRemWithMarkdown';
  if (
    name === 'create_rem_tree' ||
    name === 'create_styled_rem_tree' ||
    name === 'apply_structured_note_batch' ||
    name === 'create_polished_note_tree' ||
    name === 'create_or_replace_note_from_markdown' ||
    name === 'create_note_from_markdown_tree' ||
    name === 'append_markdown_as_rem_tree'
  ) {
    return 'plugin.rem.createTreeWithMarkdown';
  }
  if (category === 'read' || category === 'debug' || category === 'system') return 'bridge_or_read_sdk';
  if (category === 'study_card') return 'plugin.rem.createRem + card setters';
  if (category === 'repair') return 'plugin.rem mutation setters';
  return 'plugin.rem SDK';
}

function defaultScopeRequirement(
  name: string,
  category: ToolCategory,
  requiresDelete: boolean
): ToolScopeRequirement {
  if (requiresDelete || category === 'repair') return 'current-rem-tree';
  if (name === 'search_rems') return 'workspace_allowed';
  if (WRITE_CATEGORIES.has(category)) return 'approved-root';
  if (category === 'read') return 'focused-rem';
  return 'none';
}

function defaultPerformanceBudgetMs(name: string, category: ToolCategory): number {
  if (name === 'run_bridge_health_check') return 12000;
  if (name === 'search_rems') return 2000;
  if (
    category === 'markdown_note' ||
    category === 'structured_note' ||
    category === 'design_template' ||
    category === 'table'
  ) {
    return 5000;
  }
  if (category === 'simple_write' || category === 'study_card' || category === 'repair' || category === 'danger') return 3000;
  return 1000;
}

function operationTierForMetadata(input: {
  name: string;
  category: ToolCategory;
  riskLevel: ToolRiskLevel;
  requiresWrite: boolean;
  requiresDelete: boolean;
}): ToolOperationTier {
  if (input.requiresDelete || input.riskLevel === 'dangerous') {
    return 'Full Control With Delete Approval';
  }
  if (!input.requiresWrite) {
    return 'Read Only';
  }
  if (input.name === 'create_or_replace_note_from_markdown' || input.name === 'apply_structured_note_batch') {
    return 'Read + Create + Modify';
  }
  if (
    input.category === 'simple_write' ||
    input.category === 'markdown_note' ||
    input.category === 'structured_note' ||
    input.category === 'design_template' ||
    input.category === 'study_card' ||
    input.category === 'table'
  ) {
    if (
      input.name.startsWith('create_') ||
      input.name.startsWith('append_') ||
      input.name === 'create_polished_note_tree'
    ) {
      return 'Read + Create';
    }
  }
  return 'Read + Create + Modify';
}

function meta(
  name: string,
  category: ToolCategory,
  riskLevel: ToolRiskLevel,
  flags: Partial<Omit<ToolMetadata, 'name' | 'tier' | 'category' | 'riskLevel'>> = {}
): ToolMetadata {
  const requiresDelete = flags.requiresDelete ?? (riskLevel === 'dangerous' && name.startsWith('delete_'));
  const requiresWrite =
    flags.requiresWrite ?? (requiresDelete || WRITE_CATEGORIES.has(category));
  const tier = tierForTool(name);
  const operationTier =
    flags.operationTier ??
    operationTierForMetadata({
      name,
      category,
      riskLevel,
      requiresWrite,
      requiresDelete,
    });
  const isDangerous = flags.isDangerous ?? (requiresDelete || riskLevel === 'dangerous');
  const isDebug = flags.isDebug ?? (category === 'debug' || category === 'system');
  const isPublic =
    flags.isPublic ?? (tier !== 'unsupported' && flags.exposedNormally !== false && name !== 'replace_rem');
  return {
    name,
    tier,
    category,
    operationTier,
    scopeRequirement: flags.scopeRequirement ?? defaultScopeRequirement(name, category, requiresDelete),
    toolAccessTier: flags.toolAccessTier ?? tier,
    riskLevel,
    sdkCapability: flags.sdkCapability ?? defaultSdkCapability(name, category),
    isPublic,
    isDebug,
    isDangerous,
    liveVerificationRequired:
      flags.liveVerificationRequired ??
      !(flags.runtimeVerified === true && flags.runtimeVerifiedSource === 'server_local'),
    performanceBudgetMs: flags.performanceBudgetMs ?? defaultPerformanceBudgetMs(name, category),
    userFacingName: flags.userFacingName ?? userFacingNameForTool(name),
    requiresWrite,
    requiresDelete,
    supportsDryRun: flags.supportsDryRun ?? false,
    supportsIdempotency: flags.supportsIdempotency ?? false,
    recommendedForNormalUse: flags.recommendedForNormalUse ?? (tier !== 'developer' && riskLevel !== 'dangerous'),
    runtimeVerified: flags.runtimeVerified ?? false,
    runtimeVerifiedSource: flags.runtimeVerifiedSource ?? 'registry_only',
    exposedNormally: flags.exposedNormally ?? tier !== 'unsupported',
    sdkSupported: flags.sdkSupported ?? tier !== 'unsupported',
    agentWarning: flags.agentWarning,
    hiddenReason: flags.hiddenReason,
  };
}

export const TOOL_METADATA = [
  meta('get_bridge_status', 'system', 'low', { runtimeVerified: true, runtimeVerifiedSource: 'server_local' }),
  meta('get_plugin_status', 'system', 'low'),
  meta('get_focused_rem', 'read', 'low'),
  meta('get_rem', 'read', 'low'),
  meta('get_children', 'read', 'low'),
  meta('get_rem_tree', 'read', 'low'),
  meta('get_rem_breadcrumbs', 'read', 'low'),
  meta('search_rems', 'read', 'low'),
  meta('create_basic_flashcard', 'study_card', 'medium', { supportsIdempotency: true }),
  meta('create_cloze_card', 'study_card', 'medium', { supportsIdempotency: true }),
  meta('create_multiple_choice_card', 'study_card', 'medium', { supportsIdempotency: true }),
  meta('create_list_answer_card', 'study_card', 'medium', { supportsIdempotency: true }),
  meta('delete_rem_by_id', 'danger', 'dangerous', {
    requiresDelete: true,
    supportsDryRun: true,
    supportsIdempotency: true,
    recommendedForNormalUse: false,
    hiddenReason: 'delete_rem_by_id is exposed only when REMNOTE_BRIDGE_ENABLE_DELETE_TOOL=1 and active tool tier is danger.',
    agentWarning:
      'DANGER: delete_rem_by_id is destructive. Default dryRun=true. Real delete requires a prior dry-run, dryRun=false, idempotencyKey, confirmTitle, expectedParentId, expectedAncestorId, requirePriorDryRun=true, and user approval.',
  }),
  meta('get_current_selection', 'read', 'low'),
  meta('get_rem_rich', 'read', 'low'),
  meta('get_document_or_folder_tree', 'read', 'low'),
  meta('create_rem', 'simple_write', 'medium', { supportsIdempotency: true }),
  meta('create_document', 'simple_write', 'medium', { supportsIdempotency: true }),
  meta('append_to_rem', 'simple_write', 'medium', { supportsIdempotency: true }),
  meta('update_rem', 'repair', 'high', { supportsDryRun: true, supportsIdempotency: true }),
  meta('replace_rem', 'danger', 'dangerous', {
    requiresDelete: true,
    supportsDryRun: true,
    supportsIdempotency: true,
    recommendedForNormalUse: false,
    exposedNormally: false,
    isPublic: false,
    hiddenReason: 'replace_rem is hidden until replacement guards and readback verification are live-proven safe.',
  }),
  meta('move_rem', 'repair', 'high', { supportsDryRun: true, supportsIdempotency: true }),
  meta('reorder_children', 'repair', 'high', { supportsDryRun: true, supportsIdempotency: true }),
  meta('create_rem_tree', 'structured_note', 'medium', { supportsIdempotency: true }),
  meta('update_rem_rich', 'repair', 'high', { supportsIdempotency: true }),
  meta('create_styled_rem_tree', 'structured_note', 'medium', { supportsDryRun: true, supportsIdempotency: true }),
  meta('create_polished_note_tree', 'design_template', 'medium', { supportsDryRun: true, supportsIdempotency: true }),
  meta('create_or_replace_note_from_markdown', 'markdown_note', 'medium', { supportsDryRun: true, supportsIdempotency: true }),
  meta('plan_note_import', 'markdown_note', 'low', {
    requiresWrite: false,
    scopeRequirement: 'none',
    supportsDryRun: true,
    liveVerificationRequired: false,
    runtimeVerified: true,
    runtimeVerifiedSource: 'server_local',
  }),
  meta('plan_note_import_from_file', 'markdown_note', 'low', {
    requiresWrite: false,
    operationTier: 'Read + Create',
    scopeRequirement: 'approved-root',
    supportsDryRun: true,
    liveVerificationRequired: false,
    runtimeVerified: true,
    runtimeVerifiedSource: 'server_local',
    agentWarning:
      'Local paths require authenticated local/Codex bearer access and canonical allowed-root checks. ChatGPT uses the top-level sourceFile file param on hosted OAuth. Symlinks, root escapes, private-network URLs, and oversized sources are rejected.',
  }),
  meta('start_note_import_job', 'markdown_note', 'low', {
    requiresWrite: false,
    scopeRequirement: 'none',
    supportsDryRun: true,
    liveVerificationRequired: false,
    runtimeVerified: true,
    runtimeVerifiedSource: 'server_local',
    agentWarning:
      'Returns storageDurability. memory_only jobs are lost on server restart; persistent jobs require configured storage.',
  }),
  meta('start_note_import_from_file', 'markdown_note', 'low', {
    requiresWrite: false,
    operationTier: 'Read + Create',
    scopeRequirement: 'approved-root',
    supportsDryRun: true,
    liveVerificationRequired: false,
    runtimeVerified: true,
    runtimeVerifiedSource: 'server_local',
    agentWarning:
      'Accepts authenticated local/Codex paths or hosted-OAuth ChatGPT sourceFile params. Check storageDurability before assuming restart durability.',
  }),
  meta('run_note_import_job_step', 'markdown_note', 'medium', {
    supportsDryRun: true,
    supportsIdempotency: true,
    performanceBudgetMs: 10000,
    runtimeVerified: true,
    runtimeVerifiedSource: 'server_local',
    liveVerificationRequired: true,
    agentWarning:
      'Runs only resumable chunks. Cancelled jobs return JOB_CANCELLED and never delete existing Rems.',
  }),
  meta('get_note_import_job_status', 'markdown_note', 'low', {
    requiresWrite: false,
    scopeRequirement: 'none',
    liveVerificationRequired: false,
    runtimeVerified: true,
    runtimeVerifiedSource: 'server_local',
    agentWarning:
      'Check storageDurability and durabilityWarning before assuming resume will survive a server restart.',
  }),
  meta('resume_note_import_job', 'markdown_note', 'medium', {
    supportsDryRun: true,
    supportsIdempotency: true,
    performanceBudgetMs: 10000,
    runtimeVerified: true,
    runtimeVerifiedSource: 'server_local',
    liveVerificationRequired: true,
    agentWarning:
      'Resumes only pending, failed-safe, partial, or unverified chunks; verified chunks are not rewritten.',
  }),
  meta('verify_note_import_job', 'markdown_note', 'low', {
    requiresWrite: false,
    scopeRequirement: 'none',
    liveVerificationRequired: false,
    runtimeVerified: true,
    runtimeVerifiedSource: 'server_local',
  }),
  meta('cancel_note_import_job', 'markdown_note', 'low', {
    requiresWrite: false,
    scopeRequirement: 'none',
    liveVerificationRequired: false,
    runtimeVerified: true,
    runtimeVerifiedSource: 'server_local',
    agentWarning:
      'Cancels future work only. It does not clean up or delete already written Rems.',
  }),
  meta('preview_markdown_note_tree', 'markdown_note', 'low', {
    requiresWrite: false,
    scopeRequirement: 'none',
    supportsDryRun: true,
    supportsIdempotency: true,
    runtimeVerified: true,
    runtimeVerifiedSource: 'server_local',
    liveVerificationRequired: false,
  }),
  meta('create_note_from_markdown_tree', 'markdown_note', 'medium', {
    supportsDryRun: true,
    supportsIdempotency: true,
    agentWarning:
      'Legacy hierarchy writer. Prefer create_or_replace_note_from_markdown or the resumable bulk import job flow for normal ChatGPT note writing.',
  }),
  meta('append_markdown_as_rem_tree', 'markdown_note', 'medium', { supportsDryRun: true, supportsIdempotency: true }),
  meta('apply_structured_note_batch', 'structured_note', 'medium', { supportsDryRun: true, supportsIdempotency: true }),
  meta('apply_style_plan', 'repair', 'medium', { supportsDryRun: true, supportsIdempotency: true }),
  meta('verify_note_design', 'read', 'low'),
  meta('analyze_note_design', 'design_template', 'low', {
    requiresWrite: false,
    scopeRequirement: 'current-rem-tree',
    supportsDryRun: true,
    supportsIdempotency: true,
  }),
  meta('save_note_design_template', 'design_template', 'medium', { supportsIdempotency: true }),
  meta('list_note_design_templates', 'design_template', 'low', {
    requiresWrite: false,
    scopeRequirement: 'none',
    supportsIdempotency: true,
  }),
  meta('preview_note_design_plan', 'design_template', 'low', {
    requiresWrite: false,
    scopeRequirement: 'none',
    supportsDryRun: true,
    supportsIdempotency: true,
  }),
  meta('export_note_design_template', 'design_template', 'low', {
    requiresWrite: false,
    scopeRequirement: 'none',
    supportsIdempotency: true,
  }),
  meta('import_note_design_template', 'design_template', 'medium', { supportsIdempotency: true }),
  meta('create_designed_note_tree', 'design_template', 'medium', { supportsDryRun: true, supportsIdempotency: true }),
  meta('update_note_with_design', 'repair', 'high', {
    supportsDryRun: true,
    supportsIdempotency: true,
    agentWarning: 'Existing note design updates require dryRun preview or approved=true for real mutation.',
  }),
  meta('verify_note_against_design', 'read', 'low'),
  meta('repair_note_design', 'repair', 'high', {
    supportsDryRun: true,
    supportsIdempotency: true,
    agentWarning: 'repair_note_design defaults to dryRun and requires approved=true for real repair.',
  }),
  meta('create_card_set_from_note', 'study_card', 'medium', { supportsDryRun: true, supportsIdempotency: true }),
  meta('create_flashcards_from_markdown', 'study_card', 'medium', { supportsDryRun: true, supportsIdempotency: true }),
  meta('create_cloze_cards_from_note', 'study_card', 'medium', { supportsDryRun: true, supportsIdempotency: true }),
  meta('verify_card_set', 'read', 'low'),
  meta('repair_card_set', 'repair', 'high', {
    supportsDryRun: true,
    supportsIdempotency: true,
    agentWarning: 'repair_card_set defaults to dryRun and requires approved=true for real repair.',
  }),
  meta('apply_remnote_command', 'repair', 'medium', { supportsDryRun: true, supportsIdempotency: true }),
  meta('set_rem_heading_level', 'repair', 'medium'),
  meta('set_rem_text_color', 'repair', 'medium'),
  meta('set_rem_highlight_color', 'repair', 'medium'),
  meta('set_text_span_color', 'repair', 'medium'),
  meta('set_text_span_highlight', 'repair', 'medium'),
  meta('set_rem_type', 'repair', 'medium'),
  meta('set_hide_bullet', 'repair', 'medium'),
  meta('clear_rem_formatting', 'repair', 'high'),
  meta('create_concept_card', 'study_card', 'medium', { supportsIdempotency: true }),
  meta('create_descriptor_card', 'study_card', 'medium', { supportsIdempotency: true }),
  meta('ping_remnote_plugin', 'debug', 'low'),
  meta('get_bridge_diagnostics', 'debug', 'low', { runtimeVerified: true, runtimeVerifiedSource: 'server_local' }),
  meta('run_bridge_health_check', 'debug', 'high', { runtimeVerified: true, runtimeVerifiedSource: 'server_local' }),
  meta('get_remnote_capability_guide', 'debug', 'low', { runtimeVerified: true, runtimeVerifiedSource: 'server_local' }),
  meta('debug_get_raw_rich_text', 'debug', 'low'),
  meta('create_folder', 'simple_write', 'medium', {
    requiresWrite: true,
    exposedNormally: false,
    isPublic: false,
    sdkSupported: false,
    recommendedForNormalUse: false,
    hiddenReason: 'create_folder is hidden because no modern RemNote SDK folder creation path is live-verified.',
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
    case 'mass_notes':
    case 'mass_note':
    case 'mass_note_writer':
    case 'safe_note_writer':
    case 'advanced_notes':
      return 'mass_note_writer';
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
  return TOOL_METADATA_BY_NAME.get(name) ?? meta(name, 'simple_write', 'medium');
}

export function isToolVisibleInProfile(name: string, profile: ToolProfile): boolean {
  const metadata = getToolMetadata(name);
  if (!metadata.isPublic || !metadata.sdkSupported || !metadata.exposedNormally) {
    return false;
  }
  if (profile === 'danger') {
    return true;
  }
  if (BASIC_SET.has(name)) {
    return true;
  }
  if (profile === 'mass_note_writer') {
    return MASS_NOTE_WRITER_SET.has(name);
  }
  if (profile === 'note_writer') {
    return MASS_NOTE_WRITER_SET.has(name) || NOTE_WRITER_SET.has(name);
  }
  if (profile === 'power_user') {
    return MASS_NOTE_WRITER_SET.has(name) || NOTE_WRITER_SET.has(name) || POWER_USER_SET.has(name);
  }
  if (profile === 'developer') {
    return MASS_NOTE_WRITER_SET.has(name) || NOTE_WRITER_SET.has(name) || POWER_USER_SET.has(name) || DEVELOPER_SET.has(name);
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
  const mcpCatalogNames = TOOL_METADATA.filter((tool) => tool.isPublic && tool.sdkSupported).map((tool) => tool.name);
  return {
    activeTier: profile,
    aliases: {
      simple: 'basic',
      core: 'basic',
      advanced_notes: 'mass_note_writer',
      mass_notes: 'mass_note_writer',
      mass_note: 'mass_note_writer',
      safe_note_writer: 'mass_note_writer',
      developer_diagnostics: 'developer',
      full: 'danger',
    },
    tiers: {
      basic: [...BASIC_TIER_TOOLS],
      mass_note_writer: filterToolsForProfile(mcpCatalogNames, 'mass_note_writer'),
      note_writer: filterToolsForProfile(mcpCatalogNames, 'note_writer'),
      power_user: filterToolsForProfile(mcpCatalogNames, 'power_user'),
      developer: filterToolsForProfile(mcpCatalogNames, 'developer'),
      danger: mcpCatalogNames.filter((tool) => exposeDeleteTool || tool !== 'delete_rem_by_id'),
    },
  };
}

export function requiredOperationTierForTool(name: string): string {
  return getToolMetadata(name).operationTier;
}
