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
    case 'selected_rem_only':
    case 'descendants_of_selected_rem':
    case 'approved_document_or_folder':
    case 'workspace_allowed':
      return value;
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
      return 'Confirm Writes';
  }
}

export function getPermissionScopeLabel(scope: PermissionScope): string {
  switch (scope) {
    case 'selected_rem_only':
      return 'Selected Rem Only';
    case 'descendants_of_selected_rem':
      return 'Selected Descendants';
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
      approvalRequired: mode === 'confirm_writes',
      destructive: false,
      reason:
        mode === 'confirm_writes'
          ? 'Write request requires approval in confirm mode.'
          : 'Permission mode allows safe writes.',
    };
  }

  return {
    allowed: false,
    approvalRequired: false,
    destructive: false,
    reason: 'Unknown bridge tool.',
  };
}
