import { describe, expect, test } from 'vitest';
import {
  getPublicMcpToolNames,
  getToolRegistrySummary,
  SERVER_LOCAL_MCP_TOOLS,
} from '../server/src/tool-registry';
import {
  DEFAULT_TOOL_PROFILE,
  getToolMetadata,
  getToolPolicyEntry,
} from '../server/src/tool-policy';

const problemTools = [
  'update_rem_rich',
  'apply_remnote_command',
  'clear_rem_formatting',
  'preview_markdown_note_tree',
  'create_note_from_markdown_tree',
  'create_folder',
  'delete_rem_by_id',
  'replace_rem',
] as const;

describe('tool status matrix policy', () => {
  test('keeps the default profile focused on safe mass-note writing', () => {
    const tools = getPublicMcpToolNames(false, DEFAULT_TOOL_PROFILE);

    expect(DEFAULT_TOOL_PROFILE).toBe('mass_note_writer');
    expect(tools).toEqual([
      'get_bridge_status',
      'get_plugin_status',
      'get_focused_rem',
      'get_rem',
      'get_children',
      'get_rem_tree',
      'get_rem_breadcrumbs',
      'search_rems',
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
    ]);

    for (const tool of problemTools) {
      expect(tools).not.toContain(tool);
    }
  });

  test('classifies each known problem tool with an explicit reason or safe tier', () => {
    const summary = getToolRegistrySummary(false, DEFAULT_TOOL_PROFILE);
    const hiddenReasons = new Map(summary.hiddenTools.map((tool) => [tool.name, tool.reason]));
    const profileHidden = new Set(summary.profileHiddenTools.map((tool) => tool.name));

    expect(getToolMetadata('update_rem_rich').tier).toBe('power_user');
    expect(getToolMetadata('apply_remnote_command').tier).toBe('power_user');
    expect(getToolMetadata('clear_rem_formatting').tier).toBe('power_user');
    expect(profileHidden.has('update_rem_rich')).toBe(true);
    expect(profileHidden.has('apply_remnote_command')).toBe(true);
    expect(profileHidden.has('clear_rem_formatting')).toBe(true);

    expect(getToolMetadata('preview_markdown_note_tree').requiresWrite).toBe(false);
    expect(SERVER_LOCAL_MCP_TOOLS).toContain('preview_markdown_note_tree');
    expect(profileHidden.has('preview_markdown_note_tree')).toBe(true);

    expect(getToolPolicyEntry('create_note_from_markdown_tree').replacement).toBe(
      'create_or_replace_note_from_markdown'
    );
    expect(profileHidden.has('create_note_from_markdown_tree')).toBe(true);

    expect(hiddenReasons.get('create_folder')).toContain('no modern RemNote SDK folder creation path');
    expect(hiddenReasons.get('delete_rem_by_id')).toContain('REMNOTE_BRIDGE_ENABLE_DELETE_TOOL=1');
    expect(hiddenReasons.get('replace_rem')).toContain('replacement guards');
  });
});
