import { describe, expect, test } from 'vitest';
import { readRemTree } from '../src/remnote/read';
import { FakePlugin } from './helpers/fakeRemnote';

describe('deep bounded Rem tree reads', () => {
  test('preserves descendants deeper than three levels for bulk-import verification', async () => {
    const fake = new FakePlugin();
    const root = fake.addRem('root', 'Root');
    const level1 = fake.addRem('level-1', 'Level 1');
    const level2 = fake.addRem('level-2', 'Level 2');
    const level3 = fake.addRem('level-3', 'Level 3');
    const tableCell = fake.addRem('table-cell', 'Fundamental wavelength');

    await level1.setParent(root);
    await level2.setParent(level1);
    await level3.setParent(level2);
    await tableCell.setParent(level3);

    const tree = await readRemTree(fake.asPlugin(), { remId: root._id, depth: 12 });

    expect(
      tree?.children?.[0]?.children?.[0]?.children?.[0]?.children?.[0]?.plainText
    ).toBe('Fundamental wavelength');
    expect(tree?.truncated).toBeFalsy();
  });
});
