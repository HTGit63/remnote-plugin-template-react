import { describe, expect, test } from 'vitest';
import { mapSdkError } from '../src/bridge/handlers/scope';
import { normalizeArgs } from '../src/bridge/handlers/args';
import { readChildren, readRemTree, searchRems } from '../src/remnote/read';
import { moveRem, updateRemMarkdown } from '../src/remnote/write/basicWrites';
import { RemnoteWriteError } from '../src/remnote/write/writeErrors';
import { failureToToolResult } from '../server/src/tools/tool-context';
import { GET_CHILDREN_INPUT_SCHEMA } from '../server/src/tools/schemas';
import { FakePlugin } from './helpers/fakeRemnote';

describe('Phase 6 bounded reads and error taxonomy', () => {
  test('get_children returns deterministic continuation metadata', async () => {
    const fake = new FakePlugin();
    const parent = fake.addRem('parent', 'Parent');
    for (let index = 0; index < 5; index += 1) {
      await fake.addRem(`child-${index}`, `Child ${index}`).setParent(parent, index);
    }

    const first = await readChildren(fake.asPlugin(), {
      parentRemId: parent._id,
      maxChildren: 2,
      startIndex: 0,
    } as any);
    const second = await readChildren(fake.asPlugin(), {
      parentRemId: parent._id,
      maxChildren: 2,
      startIndex: first?.continuation?.args.startIndex,
    } as any);

    expect(first).toMatchObject({
      childCount: 5,
      returnedRange: { startIndex: 0, endIndexExclusive: 2 },
      appliedLimits: { maxChildren: 2 },
      continuation: {
        tool: 'get_children',
        args: { parentRemId: 'parent', maxChildren: 2, startIndex: 2 },
      },
    });
    expect(second?.children.map((child) => child.remId)).toEqual(['child-2', 'child-3']);
  });

  test('plugin boundary preserves the continuation start index', () => {
    expect(normalizeArgs('get_children', {
      parentRemId: 'parent',
      maxChildren: 2,
      startIndex: 4,
    })).toEqual({ parentRemId: 'parent', maxChildren: 2, startIndex: 4 });
  });

  test('truncated tree identifies limits, reason, and exact branch action', async () => {
    const fake = new FakePlugin();
    const root = fake.addRem('root', 'Root');
    await fake.addRem('child', 'Child').setParent(root, 0);

    const tree = await readRemTree(fake.asPlugin(), { remId: root._id, depth: 0 });

    expect(tree).toMatchObject({
      remId: 'root',
      truncated: true,
      readCoverage: {
        appliedLimits: { depth: 0, maxChildrenPerNode: 25, maxNodes: 50 },
        truncationReasons: ['depth_limit'],
        continuation: {
          tool: 'get_children',
          args: { parentRemId: 'root', maxChildren: 25, startIndex: 0 },
        },
      },
    });
  });

  test('node-limit truncation continues at the first incomplete descendant branch', async () => {
    const fake = new FakePlugin();
    const root = fake.addRem('node-root', 'Root');
    for (let branchIndex = 0; branchIndex < 3; branchIndex += 1) {
      const branch = fake.addRem(`branch-${branchIndex}`, `Branch ${branchIndex}`);
      await branch.setParent(root, branchIndex);
      for (let childIndex = 0; childIndex < 25; childIndex += 1) {
        await fake.addRem(`branch-${branchIndex}-child-${childIndex}`, `Child ${childIndex}`).setParent(branch, childIndex);
      }
    }

    const tree = await readRemTree(fake.asPlugin(), { remId: root._id, depth: 2 });

    expect(tree).toMatchObject({
      truncated: true,
      readCoverage: {
        truncationReasons: expect.arrayContaining(['node_limit']),
        continuation: {
          tool: 'get_children',
          args: { parentRemId: 'branch-1', maxChildren: 25, startIndex: 22 },
        },
      },
    });
  });

  test('empty bounded SDK search never claims exhaustive not-found', async () => {
    const fake = new FakePlugin() as FakePlugin & {
      search: { search: () => Promise<never[]> };
    };
    fake.search = { search: async () => [] };

    const result = await searchRems(fake.asPlugin(), {
      query: 'Σ→β',
      maxResults: 10,
      scope: 'all',
    });

    expect(result).toMatchObject({
      results: [],
      truncated: false,
      coverage: {
        kind: 'bounded_sdk_search',
        exhaustive: false,
        matchState: 'no_match_in_bounded_search',
        maxResults: 10,
        exactTitleVerificationRequired: true,
        fallback: { tool: 'get_rem', requiresKnownRemId: true },
      },
    });
  });

  test('legacy aliases are accepted only when unambiguous', () => {
    expect(GET_CHILDREN_INPUT_SCHEMA.safeParse({ remId: 'parent', limit: 5 }).success).toBe(true);
    expect(GET_CHILDREN_INPUT_SCHEMA.safeParse({ parentRemId: 'a', remId: 'b', maxChildren: 5 }).success).toBe(false);
    expect(GET_CHILDREN_INPUT_SCHEMA.safeParse({ parentRemId: 'a', maxChildren: 5, limit: 6 }).success).toBe(false);
  });

  test('stale guarded update has dedicated conflict code and actual/expected evidence', async () => {
    const fake = new FakePlugin();
    fake.addRem('target', 'Current');

    await expect(updateRemMarkdown(fake.asPlugin(), {
      remId: 'target',
      markdown: 'Replacement',
      expectedPlainText: 'Stale',
      dryRun: false,
      idempotencyKey: 'stale-conflict',
    })).rejects.toMatchObject({
      code: 'STALE_STATE_CONFLICT',
      details: { remId: 'target', expectedPlainText: 'Stale', actualPlainText: 'Current' },
    });
  });

  test('stale guarded move has dedicated conflict code and parent evidence', async () => {
    const fake = new FakePlugin();
    const actualParent = fake.addRem('actual-parent', 'Actual parent');
    const newParent = fake.addRem('new-parent', 'New parent');
    const target = fake.addRem('move-target', 'Move target');
    await target.setParent(actualParent);

    await expect(moveRem(fake.asPlugin(), {
      remId: target._id,
      newParentId: newParent._id,
      index: 0,
      dryRun: false,
      idempotencyKey: 'stale-move-conflict',
      expectedParentId: 'stale-parent',
    })).rejects.toMatchObject({
      code: 'STALE_STATE_CONFLICT',
      details: {
        remId: target._id,
        expectedParentId: 'stale-parent',
        actualParentId: actualParent._id,
      },
    });
  });

  test.each([
    ['INVALID_ARGS', 'validation', 'Fix the tool arguments'],
    ['STALE_STATE_CONFLICT', 'conflict', 'Read the current target state'],
    ['OUT_OF_SCOPE', 'plugin_scope', 'Focus the intended root Rem'],
    ['PERMISSION_DENIED', 'plugin_permission', 'Approve this write'],
    ['SDK_ERROR', 'sdk', 'Inspect the SDK operation'],
    ['CLIENT_DISCONNECTED', 'connection', 'Reconnect the same plugin session'],
  ] as const)('%s maps to %s with layer-specific guidance', (code, layer, guidance) => {
    const response = mapSdkError('operation-1', new RemnoteWriteError(code as any, 'failure', {
      expectedPlainText: 'before',
      actualPlainText: 'after',
    }));
    expect(response).toMatchObject({
      ok: false,
      error: {
        code,
        details: { layer, code },
      },
    });
    if (!response.ok) {
      expect((response.error.details as any).recommendedFix).toContain(guidance);
      const toolResult = failureToToolResult(response, 'update_rem');
      expect(toolResult.structuredContent).toMatchObject({
        operationId: 'operation-1',
        errorLayer: layer,
        recommendedAction: expect.stringContaining(guidance),
        retryClassification: 'failed',
      });
    }
  });
});
