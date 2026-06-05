import type { BridgeToolName, PermissionMode, PermissionScope } from '../../shared/bridge/protocol';

export const DEFAULT_PERMISSION_MODE: PermissionMode = 'read_create_modify';
export const DEFAULT_PERMISSION_SCOPE: PermissionScope = 'focused_rem_and_descendants';

export interface PermissionDecision {
  allowed: boolean;
  approvalRequired: boolean;
  destructive: boolean;
  reason: string;
}

const READ_TOOLS: ReadonlySet<BridgeToolName> = new Set([
  'ping',
  'get_status',
  'get_focused_rem',
  'get_rem',
  'get_rem_tree',
  'get_rem_rich',
  'debug_get_raw_rich_text',
  'get_current_selection',
  'get_children',
  'get_rem_breadcrumbs',
  'search_rems',
  'get_document_or_folder_tree',
  'preview_markdown_note_tree',
  'verify_note_design',
  'analyze_note_design',
  'list_note_design_templates',
  'preview_note_design_plan',
  'export_note_design_template',
  'verify_note_against_design',
  'verify_card_set',
]);

const SAFE_WRITE_TOOLS: ReadonlySet<BridgeToolName> = new Set([
  'create_rem',
  'append_to_rem',
  'create_document',
  'create_folder',
  'update_rem',
  'move_rem',
  'reorder_children',
  'create_rem_tree',
  'update_rem_rich',
  'set_rem_heading_level',
  'set_rem_text_color',
  'set_rem_highlight_color',
  'set_text_span_color',
  'set_text_span_highlight',
  'set_rem_type',
  'set_hide_bullet',
  'clear_rem_formatting',
  'create_styled_rem_tree',
  'apply_remnote_command',
  'apply_structured_note_batch',
  'create_polished_note_tree',
  'create_or_replace_note_from_markdown',
  'create_note_from_markdown_tree',
  'append_markdown_as_rem_tree',
  'apply_style_plan',
  'save_note_design_template',
  'import_note_design_template',
  'create_designed_note_tree',
  'update_note_with_design',
  'repair_note_design',
  'create_card_set_from_note',
  'create_flashcards_from_markdown',
  'create_cloze_cards_from_note',
  'repair_card_set',
  'create_basic_flashcard',
  'create_concept_card',
  'create_descriptor_card',
  'create_cloze_card',
  'create_multiple_choice_card',
  'create_list_answer_card',
]);
const DANGEROUS_TOOLS: ReadonlySet<BridgeToolName> = new Set([
  'replace_rem',
  'delete_rem_by_id',
]);

const CREATE_TOOLS: ReadonlySet<BridgeToolName> = new Set([
  'create_rem',
  'append_to_rem',
  'create_document',
  'create_folder',
  'create_rem_tree',
  'create_styled_rem_tree',
  'apply_structured_note_batch',
  'create_polished_note_tree',
  'create_or_replace_note_from_markdown',
  'create_note_from_markdown_tree',
  'append_markdown_as_rem_tree',
  'save_note_design_template',
  'import_note_design_template',
  'create_designed_note_tree',
  'create_card_set_from_note',
  'create_flashcards_from_markdown',
  'create_cloze_cards_from_note',
  'create_basic_flashcard',
  'create_concept_card',
  'create_descriptor_card',
  'create_cloze_card',
  'create_multiple_choice_card',
  'create_list_answer_card',
]);

export function normalizePermissionMode(value: string | undefined): PermissionMode {
  switch (value) {
    case 'read_only':
    case 'read_create':
    case 'read_create_modify':
    case 'full_control_delete_approval':
    case 'danger_zone':
      return value;
    case 'confirm_writes':
      return 'read_create_modify';
    case 'trusted_writes':
      return 'full_control_delete_approval';
    default:
      return DEFAULT_PERMISSION_MODE;
  }
}

export function normalizePermissionScope(value: string | undefined): PermissionScope {
  switch (value) {
    case 'focused_rem_only':
    case 'focused_rem_and_descendants':
    case 'selected_rem_only':
    case 'selected_rem_and_descendants':
    case 'approved_document_or_folder':
    case 'workspace_allowed':
      return value;
    case 'descendants_of_selected_rem':
      return 'selected_rem_and_descendants';
    default:
      return DEFAULT_PERMISSION_SCOPE;
  }
}

export function getPermissionModeLabel(mode: PermissionMode): string {
  switch (mode) {
    case 'read_only':
      return 'Read Only';
    case 'read_create':
      return 'Read + Create';
    case 'read_create_modify':
      return 'Read + Create + Modify';
    case 'full_control_delete_approval':
      return 'Full Control With Delete Approval';
    case 'danger_zone':
      return 'Danger Zone';
    default:
      return 'Read + Create + Modify';
  }
}

export function getPermissionScopeLabel(scope: PermissionScope): string {
  switch (scope) {
    case 'focused_rem_and_descendants':
      return 'Focused Rem + Descendants';
    case 'selected_rem_only':
      return 'Selected Rem Only';
    case 'selected_rem_and_descendants':
      return 'Selected Rem + Descendants';
    case 'approved_document_or_folder':
      return 'Approved Document/Folder';
    case 'workspace_allowed':
      return 'Workspace Allowed';
    case 'focused_rem_only':
    default:
      return 'Focused Rem Only';
  }
}

export function getPermissionDecision(
  mode: PermissionMode,
  tool: BridgeToolName
): PermissionDecision {
  if (READ_TOOLS.has(tool)) {
    return {
      allowed: true,
      approvalRequired: false,
      destructive: false,
      reason: 'Read-only RemNote request.',
    };
  }

  if (mode === 'read_only') {
    return {
      allowed: false,
      approvalRequired: false,
      destructive: DANGEROUS_TOOLS.has(tool),
      reason: 'Current permission mode blocks writes.',
    };
  }

  if (DANGEROUS_TOOLS.has(tool)) {
    if (mode !== 'full_control_delete_approval' && mode !== 'danger_zone') {
      return {
        allowed: false,
        approvalRequired: false,
        destructive: true,
        reason: 'Current operation tier blocks destructive writes.',
      };
    }

    return {
      allowed: true,
      approvalRequired: true,
      destructive: true,
      reason: 'Destructive RemNote changes always require approval.',
    };
  }

  if (mode === 'read_create' && !CREATE_TOOLS.has(tool)) {
    return {
      allowed: false,
      approvalRequired: false,
      destructive: false,
      reason: 'Read + Create blocks modifications to existing Rems.',
    };
  }

  if (SAFE_WRITE_TOOLS.has(tool)) {
    return {
      allowed: true,
      approvalRequired: mode === 'read_create' || mode === 'read_create_modify',
      destructive: false,
      reason:
        mode === 'full_control_delete_approval' || mode === 'danger_zone'
          ? 'Safe write is allowed inside approved scope.'
          : 'Safe write is allowed, with RemNote approval when request creates or mutates existing Rems.',
    };
  }

  return {
    allowed: false,
    approvalRequired: false,
    destructive: false,
    reason: 'Unknown bridge tool.',
  };
}
