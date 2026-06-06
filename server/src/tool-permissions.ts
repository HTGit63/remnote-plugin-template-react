import type { AuthenticatedPrincipal } from './auth/types.js';
import type { ChatGptAccessScope } from './storage/types.js';
import type { PermissionMode, PermissionScope } from '../../shared/bridge/protocol.js';
import { isDryRunRequest } from '../../shared/bridge/protocol.js';
import { bridgeToolNameForPublicMcpTool } from './mcp-tool-map.js';

export type ToolPermissionCategory = 'read' | 'write' | 'destructive' | 'status';

export interface ToolPermission {
  toolName: string;
  category: ToolPermissionCategory;
  requiredAccessScope: ChatGptAccessScope;
  requiresTrustedWrite?: boolean;
  alwaysRequirePluginApproval?: boolean;
  disabled?: boolean;
}

export type DirectWritePolicy = 'allowed' | 'blocked';
export type DirectWriteLayer =
  | 'direct_mcp_tool'
  | 'server_policy'
  | 'plugin_permission'
  | 'health_check_internal';

export interface TrustedWriteDecision {
  tool: string;
  allowed: boolean;
  policy: DirectWritePolicy;
  code: string | null;
  layer: DirectWriteLayer;
  reason: string;
  permissionMode: PermissionMode;
  permissionScope: PermissionScope;
  trustedWriteModeEffective: boolean;
  oauthWriteScope: boolean;
  oauthTrustedWriteScope: boolean;
  writeRoutingSource: 'direct_mcp_tool';
  decidedAt: string;
}

export interface ToolPermissionBlockDetails {
  layer: 'server_policy';
  code: string;
  toolName: string;
  requiredAccessScope: ChatGptAccessScope;
  actualAccessScope: ChatGptAccessScope;
  permissionMode: PermissionMode;
  permissionScope: PermissionScope;
  recommendedFix: string;
}

let lastTrustedWriteDecision: TrustedWriteDecision | null = null;

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
  preview_markdown_note_tree: { toolName: 'preview_markdown_note_tree', category: 'read', requiredAccessScope: 'focused-rem-only' },
  create_note_from_markdown_tree: { toolName: 'create_note_from_markdown_tree', category: 'write', requiredAccessScope: 'current-rem-tree', requiresTrustedWrite: true },
  append_markdown_as_rem_tree: { toolName: 'append_markdown_as_rem_tree', category: 'write', requiredAccessScope: 'focused-rem-only', requiresTrustedWrite: true },
  apply_style_plan: { toolName: 'apply_style_plan', category: 'write', requiredAccessScope: 'current-rem-tree', requiresTrustedWrite: true },
  apply_remnote_command: { toolName: 'apply_remnote_command', category: 'write', requiredAccessScope: 'focused-rem-only', requiresTrustedWrite: true },
  verify_note_design: { toolName: 'verify_note_design', category: 'read', requiredAccessScope: 'current-rem-tree' },
  analyze_note_design: { toolName: 'analyze_note_design', category: 'read', requiredAccessScope: 'current-rem-tree' },
  save_note_design_template: { toolName: 'save_note_design_template', category: 'write', requiredAccessScope: 'current-rem-tree', requiresTrustedWrite: true },
  list_note_design_templates: { toolName: 'list_note_design_templates', category: 'read', requiredAccessScope: 'focused-rem-only' },
  preview_note_design_plan: { toolName: 'preview_note_design_plan', category: 'read', requiredAccessScope: 'focused-rem-only' },
  export_note_design_template: { toolName: 'export_note_design_template', category: 'read', requiredAccessScope: 'focused-rem-only' },
  import_note_design_template: { toolName: 'import_note_design_template', category: 'write', requiredAccessScope: 'focused-rem-only', requiresTrustedWrite: true },
  create_designed_note_tree: { toolName: 'create_designed_note_tree', category: 'write', requiredAccessScope: 'current-rem-tree', requiresTrustedWrite: true },
  update_note_with_design: { toolName: 'update_note_with_design', category: 'write', requiredAccessScope: 'current-rem-tree', requiresTrustedWrite: true },
  verify_note_against_design: { toolName: 'verify_note_against_design', category: 'read', requiredAccessScope: 'current-rem-tree' },
  repair_note_design: { toolName: 'repair_note_design', category: 'write', requiredAccessScope: 'current-rem-tree', requiresTrustedWrite: true },
  create_card_set_from_note: { toolName: 'create_card_set_from_note', category: 'write', requiredAccessScope: 'current-rem-tree', requiresTrustedWrite: true },
  create_flashcards_from_markdown: { toolName: 'create_flashcards_from_markdown', category: 'write', requiredAccessScope: 'current-rem-tree', requiresTrustedWrite: true },
  create_cloze_cards_from_note: { toolName: 'create_cloze_cards_from_note', category: 'write', requiredAccessScope: 'current-rem-tree', requiresTrustedWrite: true },
  verify_card_set: { toolName: 'verify_card_set', category: 'read', requiredAccessScope: 'current-rem-tree' },
  repair_card_set: { toolName: 'repair_card_set', category: 'write', requiredAccessScope: 'current-rem-tree', requiresTrustedWrite: true },
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

function permissionModeForPrincipal(principal: AuthenticatedPrincipal): PermissionMode {
  return principal.trustedWriteMode === 'trusted-inside-scope'
    ? 'full_control_delete_approval'
    : 'read_create_modify';
}

function permissionScopeForPrincipal(principal: AuthenticatedPrincipal): PermissionScope {
  switch (principal.accessScope) {
    case 'focused-rem-only':
      return 'focused_rem_only';
    case 'current-rem-tree':
      return 'focused_rem_and_descendants';
    case 'full-kb':
      return 'workspace_allowed';
    default:
      return 'focused_rem_only';
  }
}

function recordTrustedWriteDecision(decision: Omit<TrustedWriteDecision, 'decidedAt'>): TrustedWriteDecision {
  lastTrustedWriteDecision = {
    ...decision,
    decidedAt: new Date().toISOString(),
  };
  return lastTrustedWriteDecision;
}

export function getLastTrustedWriteDecision(): TrustedWriteDecision | null {
  return lastTrustedWriteDecision;
}

export function getDirectWritePolicySnapshot(principal?: AuthenticatedPrincipal) {
  const permissionMode = principal ? permissionModeForPrincipal(principal) : 'read_create_modify';
  const permissionScope = principal ? permissionScopeForPrincipal(principal) : 'focused_rem_and_descendants';
  const scopeGrants = new Set(principal?.scopeGrants ?? []);
  const trustedWriteModeEffective = principal?.trustedWriteMode === 'trusted-inside-scope';
  return {
    directWritePolicy: trustedWriteModeEffective || scopeGrants.has('bridge:write') ? 'allowed' : 'blocked',
    directWriteBlockReason:
      trustedWriteModeEffective || scopeGrants.has('bridge:write')
        ? null
        : 'No authenticated principal with bridge:write scope is available for direct MCP writes.',
    trustedWriteModeEffective,
    permissionMode,
    permissionScope,
    writeRoutingSource: 'direct_mcp_tool',
    lastTrustedWriteDecision,
  };
}

export function validateMcpToolPermission(
  body: unknown,
  principal: AuthenticatedPrincipal
): { ok: true } | { ok: false; error: string; auditReason: string; code: string; layer: DirectWriteLayer; details: ToolPermissionBlockDetails; decision?: TrustedWriteDecision } {
  if (principal.authMode !== 'hosted_oauth' && principal.authMode !== 'connector_compat_noauth') {
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

  const approvedScope = principal.accessScope ?? 'focused-rem-only';
  const args =
    typeof request.params.arguments === 'object' && request.params.arguments !== null && !Array.isArray(request.params.arguments)
      ? request.params.arguments as Record<string, unknown>
      : {};
  const bridgeToolName = bridgeToolNameForPublicMcpTool(request.params.name);
  const dryRunRequest = bridgeToolName ? isDryRunRequest(bridgeToolName, args as never) : false;
  let requiredAccessScope = permission.requiredAccessScope;
  if (request.params.name === 'search_rems') {
    const hasContextRemId = typeof args.contextRemId === 'string' && args.contextRemId.trim().length > 0;
    if (hasContextRemId || approvedScope === 'current-rem-tree') {
      requiredAccessScope = 'current-rem-tree';
    }
  }
  const baseDetails = (
    code: string,
    recommendedFix: string
  ): ToolPermissionBlockDetails => ({
    layer: 'server_policy',
    code,
    toolName: permission.toolName,
    requiredAccessScope,
    actualAccessScope: approvedScope,
    permissionMode: permissionModeForPrincipal(principal),
    permissionScope: permissionScopeForPrincipal(principal),
    recommendedFix,
  });

  if (permission.disabled) {
    return {
      ok: false,
      error: 'This RemNote tool is disabled for safety.',
      auditReason: 'tool_disabled',
      code: 'TOOL_HIDDEN_BY_PROFILE',
      layer: 'server_policy',
      details: baseDetails('TOOL_HIDDEN_BY_PROFILE', 'Choose a visible supported tool, or enable the required tool tier/settings first.'),
    };
  }

  if (scopeRank[approvedScope] < scopeRank[requiredAccessScope]) {
    return {
      ok: false,
      error: 'This tool requires a broader RemNote access scope. Reconnect and approve the required scope.',
      auditReason: 'insufficient_remnote_access_scope',
      code: 'OUT_OF_SCOPE',
      layer: 'server_policy',
      details: baseDetails(
        'OUT_OF_SCOPE',
        requiredAccessScope === 'current-rem-tree'
          ? 'Set writing mode/access scope to Focused Rem + descendants, then focus the target root Rem in RemNote.'
          : 'Approve Workspace access only if this read/write operation truly needs workspace search.'
      ),
    };
  }

  const scopeGrants = new Set(principal.scopeGrants);

  if (permission.requiresTrustedWrite && !dryRunRequest) {
    const trustedWriteModeEffective = principal.trustedWriteMode === 'trusted-inside-scope';
    const hasWriteScope = scopeGrants.has('bridge:write');
    const hasTrustedWriteScope = scopeGrants.has('bridge:trusted_write');
    const allowed = hasWriteScope;
    const decision = recordTrustedWriteDecision({
      tool: request.params.name,
      allowed,
      policy: allowed ? 'allowed' : 'blocked',
      code: allowed ? null : 'INSUFFICIENT_SCOPE',
      layer: allowed ? 'direct_mcp_tool' : 'server_policy',
      reason: allowed
        ? trustedWriteModeEffective
          ? hasTrustedWriteScope
            ? 'Full Control With Delete Approval permits safe write inside approved scope'
            : 'Full Control With Delete Approval permits safe write inside approved scope; bridge:trusted_write scope is recommended'
          : 'Read + Create + Modify direct route allowed; RemNote plugin approval may be required'
        : 'SERVER_POLICY_BLOCKED: Direct safe write requires bridge:write scope.',
      permissionMode: permissionModeForPrincipal(principal),
      permissionScope: permissionScopeForPrincipal(principal),
      trustedWriteModeEffective,
      oauthWriteScope: hasWriteScope,
      oauthTrustedWriteScope: hasTrustedWriteScope,
      writeRoutingSource: 'direct_mcp_tool',
    });
    if (!allowed) {
      return {
        ok: false,
        error: 'SERVER_POLICY_BLOCKED: INSUFFICIENT_SCOPE: Direct safe write requires bridge:write scope.',
        auditReason: 'missing_write_scope',
        code: 'INSUFFICIENT_SCOPE',
        layer: 'server_policy',
        details: baseDetails(
          'INSUFFICIENT_SCOPE',
          'Reconnect the ChatGPT connector with bridge:write scope, or enable the plugin setting that grants safe writes inside the approved scope.'
        ),
        decision,
      };
    }
  }

  if (permission.category === 'destructive' && !dryRunRequest) {
    if (!scopeGrants.has('bridge:delete')) {
      return {
        ok: false,
        error: 'INSUFFICIENT_SCOPE: This destructive tool requires bridge:delete.',
        auditReason: 'missing_delete_scope',
        code: 'INSUFFICIENT_SCOPE',
        layer: 'server_policy',
        details: baseDetails(
          'INSUFFICIENT_SCOPE',
          'Enter Danger Zone explicitly and reconnect/authorize a session with bridge:delete. Keep dryRun=true until the target and guard are verified.'
        ),
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
          code: 'INVALID_ARGS',
          layer: 'server_policy',
          details: baseDetails(
            'INVALID_ARGS',
            'Run delete_rem_by_id with dryRun=true first, then provide confirmTitle plus expectedParentId or expectedAncestorId for real delete.'
          ),
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
          code: 'INVALID_ARGS',
          layer: 'server_policy',
          details: baseDetails(
            'INVALID_ARGS',
            'Run replace_rem with dryRun=true first, then include expectedPlainText matching the current Rem before real replacement.'
          ),
        };
      }
    }
  }

  return { ok: true };
}
