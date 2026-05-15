import type { BridgeToolName, PermissionMode, PermissionScope } from '../bridge/protocol';

export const DEFAULT_PERMISSION_MODE: PermissionMode = 'confirm_writes';
export const DEFAULT_PERMISSION_SCOPE: PermissionScope = 'focused_rem_only';

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
  'get_current_selection',
  'get_children',
  'get_rem_breadcrumbs',
  'search_rems',
  'get_document_or_folder_tree',
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
  'create_basic_flashcard',
  'create_concept_card',
  'create_descriptor_card',
  'create_cloze_card',
  'create_multiple_choice_card',
  'create_list_answer_card',
]);
const DANGEROUS_TOOLS: ReadonlySet<BridgeToolName> = new Set([
  'replace_rem',
  'delete_focused_rem',
  'delete_selected_rem',
  'delete_rem',
]);

export function normalizePermissionMode(value: string | undefined): PermissionMode {
  switch (value) {
    case 'read_only':
    case 'confirm_writes':
    case 'trusted_writes':
    case 'danger_zone':
      return value;
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
    case 'trusted_writes':
      return 'Trusted Writes';
    case 'danger_zone':
      return 'Danger Zone';
    case 'confirm_writes':
    default:
      return 'Confirm Existing Writes';
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
    return {
      allowed: true,
      approvalRequired: true,
      destructive: true,
      reason: 'Destructive RemNote changes always require approval.',
    };
  }

  if (SAFE_WRITE_TOOLS.has(tool)) {
    return {
      allowed: true,
      approvalRequired: false,
      destructive: false,
      reason:
        'Safe write is allowed by mode. The bridge still asks approval when the request creates inside, updates, moves, reorders, or deletes existing Rems.',
    };
  }

  return {
    allowed: false,
    approvalRequired: false,
    destructive: false,
    reason: 'Unknown bridge tool.',
  };
}
