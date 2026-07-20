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
import { enforceScope } from '../src/bridge/handlers/scope';
import { createRemFromMarkdown } from '../src/remnote/write/basicWrites';
import { deleteRemByIdSafe, RemnoteWriteError } from '../src/remnote/write';
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

  test('local and hosted auth lanes use the same server scope boundary', () => {
    for (const authMode of ['local_bridge_token', 'hosted_oauth'] as const) {
      const result = validateMcpToolPermission(
        mcpBody('get_rem', { remId: 'outside-current-tree' }),
        hostedPrincipal({
          authMode,
          scopeGrants: ['bridge:read', 'bridge:write', 'bridge:trusted_write'],
          accessScope: 'focused-rem-only',
          trustedWriteMode: 'trusted-inside-scope',
        })
      );

      expect(result).toMatchObject({
        ok: false,
        code: 'OUT_OF_SCOPE',
      });
    }
  });

  test('scope denial names required and provided access scopes', () => {
    const result = validateMcpToolPermission(
      mcpBody('get_rem_tree', { remId: 'outside-current-tree' }),
      hostedPrincipal({ accessScope: 'focused-rem-only' })
    );

    expect(result).toMatchObject({
      ok: false,
      code: 'OUT_OF_SCOPE',
    });
    if (!result.ok) {
      expect(result.error).toContain('requires current-rem-tree');
      expect(result.error).toContain('provided focused-rem-only');
      expect(result.details).toMatchObject({
        requiredAccessScope: 'current-rem-tree',
        actualAccessScope: 'focused-rem-only',
      });
    }
  });

  test('trusted-write scope is required for non-dry-run high-risk writes', () => {
    const result = validateMcpToolPermission(
      mcpBody('create_rem', {
        parentId: 'approved-root',
        markdown: 'Trusted write required',
      }),
      hostedPrincipal({
        scopeGrants: ['bridge:read', 'bridge:write'],
        trustedWriteMode: 'trusted-inside-scope',
      })
    );

    expect(result).toMatchObject({
      ok: false,
      code: 'TRUSTED_WRITE_REQUIRED',
    });
    if (!result.ok) {
      expect(result.error).toContain('bridge:trusted_write');
    }
  });

  test('real delete requires prior dry-run plus parent, ancestor, and title guards', () => {
    const destructivePrincipal = hostedPrincipal({
      scopeGrants: ['bridge:read', 'bridge:write', 'bridge:trusted_write', 'bridge:delete'],
      trustedWriteMode: 'trusted-inside-scope',
      toolTier: 'danger',
    });

    const missingAncestorAndDryRun = validateMcpToolPermission(
      mcpBody('delete_rem_by_id', {
        remId: 'delete-target',
        expectedParentId: 'delete-parent',
        confirmTitle: 'Delete target',
        dryRun: false,
        idempotencyKey: 'delete-target-1',
      }),
      destructivePrincipal
    );
    const fullyGuarded = validateMcpToolPermission(
      mcpBody('delete_rem_by_id', {
        remId: 'delete-target',
        expectedParentId: 'delete-parent',
        expectedAncestorId: 'approved-root',
        confirmTitle: 'Delete target',
        dryRun: false,
        requirePriorDryRun: true,
        idempotencyKey: 'delete-target-1',
      }),
      destructivePrincipal
    );

    expect(missingAncestorAndDryRun).toMatchObject({
      ok: false,
      code: 'INVALID_ARGS',
    });
    expect(fullyGuarded).toMatchObject({ ok: true });
  });

  test('plugin scope blocks newer design/card tools outside approved root', async () => {
    const fake = new FakePlugin();
    const approvedRoot = fake.addRem('approved-root', 'Approved Root');
    const outsideRoot = fake.addRem('outside-root', 'Outside Root');
    const outsideTarget = fake.addRem('outside-target', 'Outside Target');
    await outsideTarget.setParent(outsideRoot, 0);
    const context = {
      permissionScope: 'approved_document_or_folder' as const,
      approvedRootRemId: approvedRoot._id,
    };

    for (const request of [
      {
        id: 'update-design-outside',
        tool: 'update_note_with_design' as const,
        args: { targetRemId: outsideTarget._id, mode: 'replace_children' as const, dryRun: true },
      },
      {
        id: 'repair-card-outside',
        tool: 'repair_card_set' as const,
        args: { rootRemId: outsideTarget._id, dryRun: true },
      },
      {
        id: 'create-card-set-outside',
        tool: 'create_card_set_from_note' as const,
        args: { rootRemId: outsideTarget._id, parentId: outsideTarget._id, dryRun: true },
      },
      {
        id: 'verify-design-outside',
        tool: 'verify_note_against_design' as const,
        args: { rootRemId: outsideTarget._id },
      },
    ]) {
      await expect(enforceScope(fake.asPlugin(), request, context as any)).rejects.toMatchObject({
        code: 'OUT_OF_SCOPE',
      });
    }
  });

  test('plugin real delete enforces prior dry-run and all exact guards', async () => {
    const fake = new FakePlugin();
    const root = fake.addRem('delete-root', 'Delete Root');
    const target = fake.addRem('delete-target', 'Delete Target');
    await target.setParent(root, 0);

    await expect(deleteRemByIdSafe(fake.asPlugin(), {
      remId: target._id,
      expectedParentId: root._id,
      confirmTitle: 'Delete Target',
      dryRun: false,
      idempotencyKey: 'plugin-delete-guard',
    })).rejects.toBeInstanceOf(RemnoteWriteError);

    const dryRun = await deleteRemByIdSafe(fake.asPlugin(), {
      remId: target._id,
      expectedParentId: root._id,
      expectedAncestorId: root._id,
      confirmTitle: 'Delete Target',
      dryRun: true,
      requirePriorDryRun: true,
      idempotencyKey: 'plugin-delete-guard',
    });
    const realDelete = await deleteRemByIdSafe(fake.asPlugin(), {
      remId: target._id,
      expectedParentId: root._id,
      expectedAncestorId: root._id,
      confirmTitle: 'Delete Target',
      dryRun: false,
      requirePriorDryRun: true,
      idempotencyKey: 'plugin-delete-guard',
    });

    expect(dryRun.status).toBe('dry_run');
    expect(realDelete).toMatchObject({
      status: 'deleted',
      verifiedDeleted: true,
    });
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
