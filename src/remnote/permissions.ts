import type { BridgeToolName, PermissionMode } from '../bridge/protocol';

export const DEFAULT_PERMISSION_MODE: PermissionMode = 'confirm_writes';

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
]);

const SAFE_WRITE_TOOLS: ReadonlySet<BridgeToolName> = new Set(['create_rem', 'append_to_rem']);
const DANGEROUS_TOOLS: ReadonlySet<BridgeToolName> = new Set(['replace_rem', 'delete_rem']);

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
