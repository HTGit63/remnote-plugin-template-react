import { describe, expect, test } from 'vitest';
import { verifyCardSet } from '../src/remnote/write/designedNoteTools';
import { FakePlugin } from './helpers/fakeRemnote';

describe('verifyCardSet', () => {
  test('empty root returns quickly without traversal', async () => {
    const fake = new FakePlugin();
    const root = fake.addRem('empty-root', 'Empty root');
    const result = await verifyCardSet(fake.asPlugin(), {
      rootRemId: root._id,
      maxDepth: 5,
      timeoutMs: 1000,
    });

    expect(result.ok).toBe(true);
    expect(result.status).toBe('verified');
    expect(result.cardCount).toBe(0);
    expect(result.inspectedNodeCount).toBe(0);
    expect(result.warnings).toContain('No cards found under target root.');
  });
});
