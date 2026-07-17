import { describe, expect, test } from 'vitest';
import { readChildren, readRemTree } from '../src/remnote/read';
import { analyzeNoteDesign } from '../src/remnote/templates/designTemplates';
import { FakePlugin } from './helpers/fakeRemnote';

describe('native style metadata filtering', () => {
  test('content reads and design analysis exclude Size property records', async () => {
    const fake = new FakePlugin();
    fake.polluteFontSizeAsChildren = true;
    const root = fake.addRem('styled-root', 'Styled root');
    const section = fake.addRem('styled-section', 'Styled section');
    await section.setParent(root);
    await root.setFontSize('H1');
    await section.setFontSize('H3');

    const children = await readChildren(fake.asPlugin(), {
      parentRemId: root._id,
      maxChildren: 25,
    });
    const tree = await readRemTree(fake.asPlugin(), { remId: root._id, depth: 3 });
    const analysis = await analyzeNoteDesign(fake.asPlugin(), {
      rootRemId: root._id,
      maxDepth: 3,
      maxNodes: 50,
    });

    expect(children).toMatchObject({
      childCount: 1,
      children: [{ remId: section._id, plainText: 'Styled section', index: 0 }],
    });
    expect(JSON.stringify(tree)).not.toContain('Size');
    expect(analysis.analyzedNodeCount).toBe(2);
    expect(analysis.rules.headingPattern).toMatchObject({
      rootHeadingLevel: 'H1',
      sectionHeadingLevel: 'H3',
    });
  });
});
