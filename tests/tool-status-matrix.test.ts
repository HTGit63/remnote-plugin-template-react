import { describe, expect, test } from 'vitest';
import {
  bridgeToolResult,
  failureToToolResult,
  type McpToolResult,
} from '../server/src/tools/tool-context';
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

  test('exposes diagnostics aliases required for runtime/source alignment', () => {
    const summary = getToolRegistrySummary(false, DEFAULT_TOOL_PROFILE);

    expect(summary.gitSha).toBeDefined();
    expect(summary.branchName).toBeDefined();
    expect(summary.buildTime).toBeDefined();
    expect(summary.toolSchemaVersion).toBeDefined();
    expect(summary.toolRegistryVersion).toBeDefined();
    expect(summary.defaultToolProfile).toBe('mass_note_writer');
    expect(summary.activeToolProfile).toBe('mass_note_writer');
    expect(summary.registeredToolNames).toEqual(summary.mcpRegisteredTools);
    expect(summary.mcpListedToolNames).toEqual(summary.mcpListedTools);
    expect(summary.runtimeVerifiedTools).toEqual(summary.actualMcpCallableTools);
  });

  test('standard bridge envelope exposes required write-audit fields', async () => {
    const output = await bridgeToolResult(
      async () => ({
        id: 'op-1',
        ok: true,
        result: {
          toolName: 'create_or_replace_note_from_markdown',
          status: 'already_applied',
          idempotencyKey: 'idem-1',
          parentRemId: 'parent-1',
          rootRemId: 'root-1',
          createdRemIds: ['root-1'],
          updatedRemIds: ['child-1'],
          verification: { passed: true, method: 'readback' },
          phaseDurationsMs: { planning: 1, verification: 2, total: 3 },
          warnings: ['minor'],
        },
        lifecycle: [],
      }),
      'ok'
    ) as McpToolResult;

    expect(output.structuredContent?.status).toBe('PASS');
    expect(output.structuredContent?.operationId).toBe('op-1');
    expect(output.structuredContent?.idempotencyKey).toBe('idem-1');
    expect(output.structuredContent?.idempotencyResult).toBe('already_applied');
    expect(output.structuredContent?.targetRemId).toBe('root-1');
    expect(output.structuredContent?.parentRemId).toBe('parent-1');
    expect(output.structuredContent?.createdRemIds).toEqual([]);
    expect(output.structuredContent?.updatedRemIds).toEqual([]);
    expect(output.structuredContent?.counts).toMatchObject({ created: 0, updated: 0, deleted: 0 });
    expect((output.structuredContent?.verification as any).attempted).toBe(true);
    expect((output.structuredContent?.verification as any).passed).toBe(true);
    expect((output.structuredContent?.phaseDurations as any).totalMs).toBe(3);
    expect(output.structuredContent?.warnings).toEqual(['minor']);
  });

  test('standard failure envelope exposes error code and retryable flag', () => {
    const output = failureToToolResult({
      id: 'fail-1',
      ok: false,
      error: {
        code: 'TIMEOUT',
        message: 'timed out',
        retryable: true,
      },
      lifecycle: [],
    }, 'run_note_import_job_step');

    expect(output.structuredContent?.status).toBe('PLATFORM_BLOCKED');
    expect(output.structuredContent?.toolName).toBe('run_note_import_job_step');
    expect(output.structuredContent?.errorCode).toBe('TIMEOUT');
    expect(output.structuredContent?.errorMessage).toBe('timed out');
    expect(output.structuredContent?.retryable).toBe(true);
    expect((output.structuredContent?.phaseDurations as any).totalMs).toBe(0);
  });

  test('standard bridge envelope never reports PASS for semantic failed results', async () => {
    const output = await bridgeToolResult(
      async () => ({
        id: 'op-semantic-fail',
        ok: true,
        result: {
          toolName: 'apply_style_plan',
          status: 'failed',
          operations: [
            {
              index: 0,
              remId: 'rem-1',
              type: 'heading',
              status: 'failed',
              error: { code: 'PARTIAL_FAILURE', message: 'Style-only operation created unexpected child Rems.' },
            },
          ],
        },
        lifecycle: [],
      }),
      'ok'
    ) as McpToolResult;

    expect(output.structuredContent?.status).toBe('FAIL');
    expect(output.structuredContent?.standard).toMatchObject({ status: 'FAIL' });
  });

  test('unknown write state is retryable but platform-blocked, never a generic success/fail', () => {
    const output = failureToToolResult({
      id: 'unknown-write-1',
      ok: false,
      error: {
        code: 'RETRYABLE_UNKNOWN_WRITE_STATUS',
        message: 'The write may have reached RemNote before the bridge connection ended.',
        retryable: true,
      },
      lifecycle: [],
    }, 'create_or_replace_note_from_markdown');

    expect(output.structuredContent?.status).toBe('PLATFORM_BLOCKED');
    expect(output.structuredContent?.errorCode).toBe('RETRYABLE_UNKNOWN_WRITE_STATUS');
    expect(output.structuredContent?.retryable).toBe(true);
    expect(output.structuredContent?.standard).toMatchObject({
      status: 'PLATFORM_BLOCKED',
      retryable: true,
    });
  });
});
