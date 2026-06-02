import type { AuthenticatedPrincipal } from './auth/types.js';
import type { ChatGptAccessScope } from './storage/types.js';

export type ToolPermissionCategory = 'read' | 'write' | 'destructive' | 'status';

export interface ToolPermission {
  toolName: string;
  category: ToolPermissionCategory;
  requiredAccessScope: ChatGptAccessScope;
  requiresTrustedWrite?: boolean;
  alwaysRequirePluginApproval?: boolean;
  disabled?: boolean;
}

const scopeRank: Record<ChatGptAccessScope, number> = {
  'focused-rem-only': 0,
  'current-rem-tree': 1,
  'full-kb': 2,
};

export const TOOL_PERMISSIONS: Record<string, ToolPermission> = {
  get_bridge_status: { toolName: 'get_bridge_status', category: 'status', requiredAccessScope: 'focused-rem-only' },
  get_bridge_diagnostics: { toolName: 'get_bridge_diagnostics', category: 'status', requiredAccessScope: 'focused-rem-only' },
  run_bridge_health_check: { toolName: 'run_bridge_health_check', category: 'status', requiredAccessScope: 'focused-rem-only' },
  get_remnote_capability_guide: { toolName: 'get_remnote_capability_guide', category: 'status', requiredAccessScope: 'focused-rem-only' },
  ping_remnote_plugin: { toolName: 'ping_remnote_plugin', category: 'status', requiredAccessScope: 'focused-rem-only' },
  get_plugin_status: { toolName: 'get_plugin_status', category: 'status', requiredAccessScope: 'focused-rem-only' },

  get_focused_rem: { toolName: 'get_focused_rem', category: 'read', requiredAccessScope: 'focused-rem-only' },
  get_current_selection: { toolName: 'get_current_selection', category: 'read', requiredAccessScope: 'focused-rem-only' },
  get_rem: { toolName: 'get_rem', category: 'read', requiredAccessScope: 'current-rem-tree' },
  get_rem_tree: { toolName: 'get_rem_tree', category: 'read', requiredAccessScope: 'current-rem-tree' },
  get_rem_rich: { toolName: 'get_rem_rich', category: 'read', requiredAccessScope: 'current-rem-tree' },
  debug_get_raw_rich_text: { toolName: 'debug_get_raw_rich_text', category: 'read', requiredAccessScope: 'current-rem-tree' },
  get_children: { toolName: 'get_children', category: 'read', requiredAccessScope: 'current-rem-tree' },
  get_rem_breadcrumbs: { toolName: 'get_rem_breadcrumbs', category: 'read', requiredAccessScope: 'current-rem-tree' },
  get_document_or_folder_tree: { toolName: 'get_document_or_folder_tree', category: 'read', requiredAccessScope: 'current-rem-tree' },
  search_rems: { toolName: 'search_rems', category: 'read', requiredAccessScope: 'full-kb' },

  create_rem: { toolName: 'create_rem', category: 'write', requiredAccessScope: 'current-rem-tree', requiresTrustedWrite: true },
  create_document: { toolName: 'create_document', category: 'write', requiredAccessScope: 'current-rem-tree', requiresTrustedWrite: true },
  create_folder: { toolName: 'create_folder', category: 'write', requiredAccessScope: 'current-rem-tree', requiresTrustedWrite: true },
  append_to_rem: { toolName: 'append_to_rem', category: 'write', requiredAccessScope: 'focused-rem-only', requiresTrustedWrite: true },
  update_rem: { toolName: 'update_rem', category: 'write', requiredAccessScope: 'focused-rem-only', requiresTrustedWrite: true },
  update_rem_rich: { toolName: 'update_rem_rich', category: 'write', requiredAccessScope: 'focused-rem-only', requiresTrustedWrite: true },
  move_rem: { toolName: 'move_rem', category: 'write', requiredAccessScope: 'current-rem-tree', requiresTrustedWrite: true },
  reorder_children: { toolName: 'reorder_children', category: 'write', requiredAccessScope: 'current-rem-tree', requiresTrustedWrite: true },
  create_rem_tree: { toolName: 'create_rem_tree', category: 'write', requiredAccessScope: 'current-rem-tree', requiresTrustedWrite: true },
  create_styled_rem_tree: { toolName: 'create_styled_rem_tree', category: 'write', requiredAccessScope: 'current-rem-tree', requiresTrustedWrite: true },
  apply_structured_note_batch: { toolName: 'apply_structured_note_batch', category: 'write', requiredAccessScope: 'current-rem-tree', requiresTrustedWrite: true },
  create_polished_note_tree: { toolName: 'create_polished_note_tree', category: 'write', requiredAccessScope: 'current-rem-tree', requiresTrustedWrite: true },
  create_or_replace_note_from_markdown: { toolName: 'create_or_replace_note_from_markdown', category: 'write', requiredAccessScope: 'current-rem-tree', requiresTrustedWrite: true },
  apply_style_plan: { toolName: 'apply_style_plan', category: 'write', requiredAccessScope: 'current-rem-tree', requiresTrustedWrite: true },
  apply_remnote_command: { toolName: 'apply_remnote_command', category: 'write', requiredAccessScope: 'focused-rem-only', requiresTrustedWrite: true },
  verify_note_design: { toolName: 'verify_note_design', category: 'read', requiredAccessScope: 'current-rem-tree' },
  set_rem_heading_level: { toolName: 'set_rem_heading_level', category: 'write', requiredAccessScope: 'focused-rem-only', requiresTrustedWrite: true },
  set_rem_text_color: { toolName: 'set_rem_text_color', category: 'write', requiredAccessScope: 'focused-rem-only', requiresTrustedWrite: true },
  set_rem_highlight_color: { toolName: 'set_rem_highlight_color', category: 'write', requiredAccessScope: 'focused-rem-only', requiresTrustedWrite: true },
  set_text_span_color: { toolName: 'set_text_span_color', category: 'write', requiredAccessScope: 'focused-rem-only', requiresTrustedWrite: true },
  set_text_span_highlight: { toolName: 'set_text_span_highlight', category: 'write', requiredAccessScope: 'focused-rem-only', requiresTrustedWrite: true },
  set_rem_type: { toolName: 'set_rem_type', category: 'write', requiredAccessScope: 'focused-rem-only', requiresTrustedWrite: true },
  set_hide_bullet: { toolName: 'set_hide_bullet', category: 'write', requiredAccessScope: 'focused-rem-only', requiresTrustedWrite: true },
  clear_rem_formatting: { toolName: 'clear_rem_formatting', category: 'write', requiredAccessScope: 'focused-rem-only', requiresTrustedWrite: true },
  create_basic_flashcard: { toolName: 'create_basic_flashcard', category: 'write', requiredAccessScope: 'focused-rem-only', requiresTrustedWrite: true },
  create_concept_card: { toolName: 'create_concept_card', category: 'write', requiredAccessScope: 'focused-rem-only', requiresTrustedWrite: true },
  create_descriptor_card: { toolName: 'create_descriptor_card', category: 'write', requiredAccessScope: 'focused-rem-only', requiresTrustedWrite: true },
  create_cloze_card: { toolName: 'create_cloze_card', category: 'write', requiredAccessScope: 'focused-rem-only', requiresTrustedWrite: true },
  create_multiple_choice_card: { toolName: 'create_multiple_choice_card', category: 'write', requiredAccessScope: 'focused-rem-only', requiresTrustedWrite: true },
  create_list_answer_card: { toolName: 'create_list_answer_card', category: 'write', requiredAccessScope: 'focused-rem-only', requiresTrustedWrite: true },

  replace_rem: { toolName: 'replace_rem', category: 'destructive', requiredAccessScope: 'current-rem-tree', alwaysRequirePluginApproval: true },
  delete_rem_by_id: { toolName: 'delete_rem_by_id', category: 'destructive', requiredAccessScope: 'current-rem-tree', alwaysRequirePluginApproval: true },
};

export function validateMcpToolPermission(
  body: unknown,
  principal: AuthenticatedPrincipal
): { ok: true } | { ok: false; error: string; auditReason: string } {
  if (principal.authMode !== 'hosted_oauth') {
    return { ok: true };
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: true };
  }

  const request = body as { method?: unknown; params?: { name?: unknown; arguments?: unknown } };
  if (request.method !== 'tools/call' || typeof request.params?.name !== 'string') {
    return { ok: true };
  }

  const permission = TOOL_PERMISSIONS[request.params.name];
  if (!permission) {
    return { ok: true };
  }

  if (permission.disabled) {
    return {
      ok: false,
      error: 'This RemNote tool is disabled for safety.',
      auditReason: 'tool_disabled',
    };
  }

  const approvedScope = principal.accessScope ?? 'focused-rem-only';
  if (scopeRank[approvedScope] < scopeRank[permission.requiredAccessScope]) {
    return {
      ok: false,
      error: 'This tool requires a broader RemNote access scope. Reconnect and approve the required scope.',
      auditReason: 'insufficient_remnote_access_scope',
    };
  }

  const scopeGrants = new Set(principal.scopeGrants);
  const args =
    typeof request.params.arguments === 'object' && request.params.arguments !== null && !Array.isArray(request.params.arguments)
      ? request.params.arguments as Record<string, unknown>
      : {};

  if (permission.requiresTrustedWrite) {
    if (!scopeGrants.has('bridge:trusted_write') || principal.trustedWriteMode !== 'trusted-inside-scope') {
      return {
        ok: false,
        error: 'TRUSTED_WRITE_REQUIRED: This write requires trusted write approval for the approved RemNote scope.',
        auditReason: 'trusted_write_required',
      };
    }
  }

  if (permission.category === 'destructive') {
    if (!scopeGrants.has('bridge:delete')) {
      return {
        ok: false,
        error: 'INSUFFICIENT_SCOPE: This destructive tool requires bridge:delete.',
        auditReason: 'missing_delete_scope',
      };
    }

    if (request.params.name === 'delete_rem_by_id' && args.dryRun === false) {
      const hasScopeGuard = typeof args.expectedParentId === 'string' || typeof args.expectedAncestorId === 'string';
      const hasTitleGuard = typeof args.confirmTitle === 'string' && args.confirmTitle.trim().length > 0;
      if (!hasScopeGuard || !hasTitleGuard) {
        return {
          ok: false,
          error:
            'INVALID_ARGS: Real delete requires dryRun=false, confirmTitle, and expectedParentId or expectedAncestorId.',
          auditReason: 'missing_delete_guard',
        };
      }
    }

    if (request.params.name === 'replace_rem' && args.dryRun !== true) {
      const hasTextGuard = typeof args.expectedPlainText === 'string' && args.expectedPlainText.trim().length > 0;
      if (!hasTextGuard) {
        return {
          ok: false,
          error: 'INVALID_ARGS: Real replace_rem requires expectedPlainText guard.',
          auditReason: 'missing_replace_guard',
        };
      }
    }
  }

  return { ok: true };
}
