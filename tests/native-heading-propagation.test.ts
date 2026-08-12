import { describe, expect, test } from 'vitest';
import { applyStylePresetToTree } from '../shared/bridge/style-presets';
import { existingRemHeadingStyleEnabled } from '../src/remnote/write/runtimeFlags';

describe('native heading propagation', () => {
  test('applies explicit root and section heading fields without requiring a style preset', () => {
    const tree = applyStylePresetToTree(
      {
        text: 'Root',
        children: [
          { text: 'Section A', children: [{ text: 'Body A' }] },
          { type: 'mathBlock', latex: 'E=mc^2' },
          { text: 'Section B' },
        ],
      },
      {
        rootHeadingLevel: 'H1',
        sectionHeadingLevel: 'H3',
      }
    );

    expect(tree.style?.headingLevel).toBe('H1');
    expect(tree.children?.[0]?.style?.headingLevel).toBe('H3');
    expect(tree.children?.[0]?.children?.[0]?.style?.headingLevel).toBeUndefined();
    expect(tree.children?.[1]?.style?.headingLevel).toBeUndefined();
    expect(tree.children?.[2]?.style?.headingLevel).toBe('H3');
    expect(tree.children?.map((child) => child.text ?? child.latex)).toEqual([
      'Section A',
      'E=mc^2',
      'Section B',
    ]);
  });

  test('does not add spacer Rems when only explicit heading fields are requested', () => {
    const tree = applyStylePresetToTree(
      {
        text: 'Root',
        children: [{ text: 'Section A' }, { text: 'Section B' }],
      },
      {
        rootHeadingLevel: 'H1',
        sectionHeadingLevel: 'H3',
      }
    );

    expect(tree.children).toHaveLength(2);
    expect(tree.children?.map((child) => child.text)).toEqual(['Section A', 'Section B']);
  });

  test('enables existing-Rem heading repair in browser runtime when process env is unavailable', () => {
    const runtime = globalThis as typeof globalThis & { process?: typeof process };
    const originalProcess = runtime.process;

    try {
      runtime.process = undefined;
      expect(existingRemHeadingStyleEnabled()).toBe(true);
    } finally {
      runtime.process = originalProcess;
    }
  });
});
