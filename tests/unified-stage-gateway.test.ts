import { describe, expect, test } from 'vitest';
import { loadConfig } from '../server/src/config';
import { classifyDisposableAuditPayload, isSafeDisposableAuditPayload } from '../server/src/audit-payload-safety';
import { getToolRegistrySummary } from '../server/src/tool-registry';
import { validateMcpToolPermission } from '../server/src/tool-permissions';
import { DEFAULT_TOOL_PROFILE } from '../server/src/tool-policy';
import type { AuthenticatedPrincipal } from '../server/src/auth/types';
import { registerBasicWriteTools } from '../server/src/tools/register-write-tools';
import type { McpToolResult, ToolRegistrationContext } from '../server/src/tools/tool-context';
import type { BridgeResponse } from '../shared/bridge/protocol';
import { createRemFromMarkdown } from '../src/remnote/write/basicWrites';
import { FakePlugin } from './helpers/fakeRemnote';

function mcpBody(tool: string, args: Record<string, unknown>) {
  return {
    method: 'tools/call',
    params: {
      name: tool,
      arguments: args,
    },
  };
}

function hostedPrincipal(overrides: Partial<AuthenticatedPrincipal> = {}): AuthenticatedPrincipal {
  return {
    subject: 'pairing:unified-stage',
    userId: 'unified-stage-user',
    authMode: 'hosted_oauth',
    scopeGrants: ['bridge:read'],
    accessScope: 'current-rem-tree',
    trustedWriteMode: 'ask-every-write',
    toolTier: 'danger',
    ...overrides,
  };
}

function success(id: string, result: Record<string, unknown>): BridgeResponse {
  return { id, ok: true, result };
}

function registerBasicHandlers(callPlugin: ToolRegistrationContext['callPlugin']) {
  const handlers: Record<string, (args: any) => Promise<McpToolResult>> = {};
  registerBasicWriteTools({
    registerTool: ((name: string, _config: unknown, handler: (args: any) => Promise<McpToolResult>) => {
      handlers[name] = handler;
      return undefined;
    }) as ToolRegistrationContext['registerTool'],
    callPlugin,
    currentRegistry: (() => getToolRegistrySummary(false, DEFAULT_TOOL_PROFILE)) as ToolRegistrationContext['currentRegistry'],
    exposeDeleteTool: false,
    hub: {} as ToolRegistrationContext['hub'],
  });
  return handlers;
}

describe('unified staged live-proof gateway regressions', () => {
  test('isSafeDisposableAuditPayload accepts only bounded disposable audit/test payloads', () => {
    expect(isSafeDisposableAuditPayload({
      operation: 'create_rem',
      parentId: 'unified-root-1',
      markdown: 'Stage 02 — Read Search Scope',
    })).toBe(true);
    expect(classifyDisposableAuditPayload({
      operation: 'create_rem',
      parentId: 'stage-12-container',
      markdown: `Compact Report — Unified Staged Live-Proof\n${'Stage summary: pass.\n'.repeat(500)}`,
    })).toMatchObject({
      safe: false,
      errorCode: 'COMPACT_REPORT_TOO_LARGE',
    });
    expect(isSafeDisposableAuditPayload({
      operation: 'create_rem',
      parentId: 'unified-root-1',
      markdown: 'Delete all old notes',
    })).toBe(false);
  });

  test('exact safe stage container titles pass the server write gate without broad write scope', () => {
    for (const title of [
      'Stage 02 — Read Search Scope',
      'Stage 03 — Safe Write and Idempotency',
      'Stage 06 — Resume Duplicate and Scope Protection',
      'Stage 12 — Compact Report Container',
    ]) {
      expect(validateMcpToolPermission(
        mcpBody('create_rem', {
          parentId: 'unified-root-1',
          markdown: title,
          idempotencyKey: `stage:${title}`,
        }),
        hostedPrincipal()
      )).toMatchObject({ ok: true });

      expect(validateMcpToolPermission(
        mcpBody('create_rem_tree', {
          parentId: 'unified-root-1',
          position: 'end',
          tree: { title },
          idempotencyKey: `tree:${title}`,
        }),
        hostedPrincipal()
      )).toMatchObject({ ok: true });
    }
  });

  test('unsafe audit-shaped payloads stay blocked without broad write scope', () => {
    for (const markdown of [
      'Delete all old notes',
      'Move entire workspace',
      'Replace Plugin Test',
      'Raw SDK command',
    ]) {
      expect(validateMcpToolPermission(
        mcpBody('create_rem', {
          parentId: 'unified-root-1',
          markdown,
          idempotencyKey: `unsafe:${markdown}`,
        }),
        hostedPrincipal()
      )).toMatchObject({
        ok: false,
        code: 'INSUFFICIENT_SCOPE',
      });
    }
  });

  test('bounded compact report payload is allowed but oversized compact report is classified clearly', () => {
    const allowed = validateMcpToolPermission(
      mcpBody('create_rem', {
        parentId: 'stage-12-container',
        markdown: [
          'Compact Report — Unified Staged Live-Proof',
          'Verdict: PARTIAL_PROOF',
          'Stage summary: Stage 00 created; Stage 01 created; Stage 02 pending.',
        ].join('\n'),
        idempotencyKey: 'compact-report:small',
      }),
      hostedPrincipal()
    );
    const tooLarge = validateMcpToolPermission(
      mcpBody('create_rem', {
        parentId: 'stage-12-container',
        markdown: `Compact Report — Unified Staged Live-Proof\n${'Stage summary: pass.\n'.repeat(500)}`,
        idempotencyKey: 'compact-report:large',
      }),
      hostedPrincipal()
    );

    expect(allowed).toMatchObject({ ok: true });
    expect(tooLarge).toMatchObject({
      ok: false,
      code: 'COMPACT_REPORT_TOO_LARGE',
    });
  });

  test('compact report writer forwards bounded report and rejects oversized report before plugin call', async () => {
    const calls: Array<{ tool: string; args: unknown }> = [];
    const handlers = registerBasicHandlers(async (tool, args) => {
      calls.push({ tool, args });
      return success('compact-report-op', {
        toolName: tool,
        status: 'created',
        createdRemId: 'compact-report-rem',
        parentId: 'stage-12-container',
      });
    });

    const small = await handlers.create_rem({
      parentId: 'stage-12-container',
      markdown: [
        'Compact Report — Unified Staged Live-Proof',
        'Verdict: PARTIAL_PROOF',
        'Stage summary: Stage 12 report created.',
      ].join('\n'),
      idempotencyKey: 'compact-report:small',
    });
    const large = await handlers.create_rem({
      parentId: 'stage-12-container',
      markdown: `Compact Report — Unified Staged Live-Proof\n${'Stage summary: pass.\n'.repeat(500)}`,
      idempotencyKey: 'compact-report:large',
    });

    expect(small.structuredContent).toMatchObject({
      ok: true,
      targetRemId: 'compact-report-rem',
      parentRemId: 'stage-12-container',
    });
    expect(large.structuredContent).toMatchObject({
      ok: false,
      errorCode: 'COMPACT_REPORT_TOO_LARGE',
    });
    expect(calls).toHaveLength(1);
  });

  test('title-only create_rem comparison preserves em dash, hyphen, and underscores', async () => {
    const fake = new FakePlugin();
    const parent = fake.addRem('parent', 'Plugin Test');

    const result = await createRemFromMarkdown(fake.asPlugin(), {
      parentId: parent._id,
      markdown: 'RemNote MCP Unified Staged Live-Proof — unified-live-proof_test',
      idempotencyKey: 'title-only-stage-root',
    });

    expect(result.verification?.matchesRequestedMarkdownText).toBe(true);
  });

  test('current-session get_rem readback can pass server scope gate for created Rem IDs', () => {
    const blocked = validateMcpToolPermission(
      mcpBody('get_rem', { remId: 'created-root-1' }),
      hostedPrincipal({ accessScope: 'focused-rem-only' })
    );
    const allowed = validateMcpToolPermission(
      mcpBody('get_rem', { remId: 'created-root-1' }),
      hostedPrincipal({ accessScope: 'focused-rem-only' }),
      { currentSessionCreatedRemIds: new Set(['created-root-1']) }
    );

    expect(blocked).toMatchObject({
      ok: false,
      code: 'OUT_OF_SCOPE',
    });
    expect(allowed).toMatchObject({ ok: true });
  });


  test('profile pinning alias and registry metadata expose effective profile state', () => {
    const config = loadConfig({
      REMNOTE_BRIDGE_TOKEN: 'token',
      REMNOTE_MCP_TOOL_PROFILE: 'mass_note_writer',
    });
    const summary = getToolRegistrySummary(false, DEFAULT_TOOL_PROFILE);

    expect(config.toolProfile).toBe('mass_note_writer');
    expect(summary).toMatchObject({
      activeToolProfile: 'mass_note_writer',
      defaultToolProfile: 'mass_note_writer',
      activeProfileExceedsDefault: false,
      buildTime: 'dev_runtime_not_embedded',
    });
    expect(summary.effectivePublicToolNames).toEqual(summary.mcpListedToolNames);
    expect(summary.profileSwitchHint).toContain('REMNOTE_MCP_TOOL_PROFILE=mass_note_writer');
  });
});
