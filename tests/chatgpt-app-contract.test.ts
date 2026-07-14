import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { createMcpServer } from '../server/src/mcp-server';
import { getPublicMcpToolNames } from '../server/src/tool-registry';
import { DEFAULT_TOOL_PROFILE } from '../server/src/tool-policy';

type ToolDescriptor = {
  description?: string;
  annotations?: {
    readOnlyHint?: boolean;
    openWorldHint?: boolean;
    destructiveHint?: boolean;
  };
};

const submission = JSON.parse(
  readFileSync(resolve(process.cwd(), 'chatgpt-app-submission.json'), 'utf8')
) as {
  $schema?: string;
  tools: Record<string, unknown>;
  test_cases: Array<{ tools_triggered: string | null }>;
};

function registeredMassNoteTools(): Record<string, ToolDescriptor> {
  const server = createMcpServer({} as never, {
    toolProfile: DEFAULT_TOOL_PROFILE,
    toolCallAuthMode: 'hosted_oauth_required',
  });
  return (server as unknown as { _registeredTools: Record<string, ToolDescriptor> })._registeredTools;
}

describe('ChatGPT app contract', () => {
  test('submission worksheet matches the exact default mass-note surface', () => {
    expect(submission.$schema, 'submission uses live endpoint scan, not obsolete JSON schema').toBeUndefined();
    const expected = getPublicMcpToolNames(false, DEFAULT_TOOL_PROFILE);
    expect(Object.keys(submission.tools)).toEqual(expected);

    const submissionTools = new Set(Object.keys(submission.tools));
    for (const testCase of submission.test_cases) {
      for (const tool of (testCase.tools_triggered ?? '').split(',').map((value) => value.trim()).filter(Boolean)) {
        expect(submissionTools.has(tool), `test case references hidden tool ${tool}`).toBe(true);
      }
    }
  });

  test('default tools use current discovery descriptions and honest impact annotations', () => {
    const tools = registeredMassNoteTools();
    for (const [name, descriptor] of Object.entries(tools)) {
      expect(descriptor.description, `${name} description`).toMatch(/^Use this when\b/);
      expect(descriptor.annotations?.readOnlyHint, `${name} readOnlyHint`).toBeTypeOf('boolean');
      expect(descriptor.annotations?.openWorldHint, `${name} openWorldHint`).toBeTypeOf('boolean');
      expect(descriptor.annotations?.destructiveHint, `${name} destructiveHint`).toBeTypeOf('boolean');
    }

    for (const name of [
      'plan_note_import',
      'plan_note_import_from_file',
      'start_note_import_job',
      'start_note_import_from_file',
      'run_note_import_job_step',
      'resume_note_import_job',
      'reconcile_note_import_job_chunk',
      'cancel_note_import_job',
    ]) {
      expect(tools[name].annotations?.readOnlyHint, `${name} persists state`).toBe(false);
    }

    expect(tools.get_note_import_job_status.annotations?.readOnlyHint).toBe(true);
    expect(tools.verify_note_import_job.annotations?.readOnlyHint).toBe(true);
    expect(tools.plan_note_import_from_file.annotations?.openWorldHint).toBe(false);
    expect(tools.start_note_import_from_file.annotations?.openWorldHint).toBe(false);
    expect(tools.create_or_replace_note_from_markdown.annotations?.destructiveHint).toBe(true);
  });

  test('serialized tools/list advertises canonical and compatibility OAuth scopes', async () => {
    const server = createMcpServer({} as never, {
      toolProfile: DEFAULT_TOOL_PROFILE,
      toolCallAuthMode: 'hosted_oauth_required',
    });
    const handler = (server.server as unknown as {
      _requestHandlers: Map<string, (request: unknown, extra: unknown) => Promise<unknown>>;
    })._requestHandlers.get('tools/list');
    expect(handler).toBeDefined();
    const listed = await handler?.(
      { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} },
      {}
    ) as {
      tools: Array<{
        name: string;
        securitySchemes?: Array<{ type?: string; scopes?: string[] }>;
        _meta?: { securitySchemes?: Array<{ type?: string; scopes?: string[] }> };
      }>;
    };
    expect(listed.tools).toHaveLength(20);
    for (const descriptor of listed.tools) {
      expect(descriptor.securitySchemes, `${descriptor.name} top-level securitySchemes`).toEqual([
        expect.objectContaining({ type: 'oauth2', scopes: expect.arrayContaining(['bridge:read']) }),
      ]);
      expect(descriptor._meta?.securitySchemes, `${descriptor.name} mirrored securitySchemes`).toEqual([
        expect.objectContaining({ type: 'oauth2', scopes: expect.arrayContaining(['bridge:read']) }),
      ]);
    }
  });
});
