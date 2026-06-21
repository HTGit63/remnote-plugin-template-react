import { beforeEach, describe, expect, test } from 'vitest';
import { applyStructuredNoteBatch, createStyledRemTree } from '../src/remnote/write/structuredBatch';
import {
  STRUCTURED_BATCH_IN_FLIGHT,
  STRUCTURED_BATCH_RESULT_CACHE,
  STYLED_TREE_IN_FLIGHT,
  STYLED_TREE_RESULT_CACHE,
} from '../src/remnote/write/writeCaches';
import { FakePlugin } from './helpers/fakeRemnote';

beforeEach(() => {
  STRUCTURED_BATCH_RESULT_CACHE.clear();
  STRUCTURED_BATCH_IN_FLIGHT.clear();
  STYLED_TREE_RESULT_CACHE.clear();
  STYLED_TREE_IN_FLIGHT.clear();
});

describe('structured batch idempotency', () => {
  test('concurrent same-key calls share one write', async () => {
    const fake = new FakePlugin();
    fake.addRem('parent', 'Parent');
    const plugin = fake.asPlugin();
    const args = {
      parentId: 'parent',
      operation: 'create_child_tree' as const,
      idempotencyKey: 'same-key',
      verifyAfterWrite: false,
      root: {
        text: 'Root',
        children: [{ text: 'Child' }],
      },
    };

    const [first, second] = await Promise.all([
      applyStructuredNoteBatch(plugin, args),
      applyStructuredNoteBatch(plugin, args),
    ]);

    expect(fake.createRemCount).toBe(2);
    expect(first.rootCreatedRemId).toBe(second.rootCreatedRemId);
    expect(first.createdRemIds).toEqual(second.createdRemIds);
    expect(STRUCTURED_BATCH_IN_FLIGHT.size).toBe(0);
  });
});

describe('direct styled tree rollback', () => {
  test('partial create failure rolls back only created Rems', async () => {
    const fake = new FakePlugin();
    fake.addRem('parent', 'Parent');
    fake.failSetTextIncludes = 'Boom';

    await expect(
      createStyledRemTree(fake.asPlugin(), {
        parentId: 'parent',
        tree: {
          text: 'Root',
          children: [{ text: 'Boom child' }],
        },
        idempotencyKey: 'rollback-key',
      })
    ).rejects.toMatchObject({
      code: 'SDK_ERROR',
    });

    expect(fake.rems.has('parent')).toBe(true);
    expect([...fake.rems.keys()].filter((id) => id.startsWith('generated-'))).toEqual([]);
    expect(STYLED_TREE_IN_FLIGHT.size).toBe(0);
  });
});
