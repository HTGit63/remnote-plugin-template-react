import { describe, expect, test } from 'vitest';
import {
  applyStylePresetToMarkdownArgs,
  applyStylePresetToTree,
  DEFAULT_NOTE_STYLE_PRESET,
  FORMULA_HEAVY_STYLE_PRESET,
  MINIMAL_STYLE_PRESET,
  NOTE_STYLE_PRESETS,
  NUCLEAR_PHYSICS_SPACER_TEXT,
  NUCLEAR_PHYSICS_STYLE_PRESET,
  normalizeStylePresetFields,
} from '../shared/bridge/style-presets';
import { CREATE_OR_REPLACE_NOTE_FROM_MARKDOWN_INPUT_SCHEMA } from '../server/src/tools/schemas';

describe('note style presets', () => {
  test('exposes named presets and keeps clean academic as the default preset contract', () => {
    expect(NOTE_STYLE_PRESETS).toEqual([
      'clean_academic',
      'exam_ready',
      'colorful_study',
      'minimal',
      'formula_heavy',
      'nuclear_physics_h1_h3_spacer_math',
    ]);
    expect(DEFAULT_NOTE_STYLE_PRESET).toBe('clean_academic');
    expect(normalizeStylePresetFields({})?.stylePreset).toBe('clean_academic');
  });

  test('schema accepts all named presets', () => {
    for (const stylePreset of NOTE_STYLE_PRESETS) {
      expect(CREATE_OR_REPLACE_NOTE_FROM_MARKDOWN_INPUT_SCHEMA.safeParse({
        parentRemId: 'parent',
        markdownText: '# Root\n\n## Section\n\nText',
        mode: 'create_child',
        stylePreset,
      }).success).toBe(true);
    }
  });

  test('formula-heavy markdown preset preserves formula text and enables verification', () => {
    const args = applyStylePresetToMarkdownArgs({
      parentRemId: 'parent',
      markdownText: 'Formula: $qE = qvB$',
      mode: 'create_child',
      stylePreset: FORMULA_HEAVY_STYLE_PRESET,
    });

    expect(args.markdownText).toBe('Formula: $qE = qvB$');
    expect(args.headingMapping?.rootHeadingLevel).toBe('H1');
    expect(args.headingMapping?.sectionHeadingLevel).toBe('H3');
    expect(args.remnoteLayout?.insertSpacerBetweenSections).toBe(true);
    expect(args.safetyOptions?.verifyAfterWrite).toBe(true);
  });

  test('minimal preset styles headings without inserting spacer Rems', () => {
    const tree = applyStylePresetToTree({
      text: 'Root',
      children: [
        { text: 'One', children: [{ text: '$E=mc^2$' }] },
        { text: 'Two' },
      ],
    }, { stylePreset: MINIMAL_STYLE_PRESET });

    expect(tree.style?.headingLevel).toBe('H1');
    expect(tree.children?.map((child) => child.text)).toEqual(['One', 'Two']);
    expect(tree.children?.[0]?.children?.[0]?.text).toBe('$E=mc^2$');
  });

  test('legacy nuclear alias remains compatible', () => {
    const tree = applyStylePresetToTree({
      text: 'Root',
      children: [{ text: 'One' }, { text: 'Two' }],
    }, { stylePreset: NUCLEAR_PHYSICS_STYLE_PRESET });

    expect(tree.style?.headingLevel).toBe('H1');
    expect(tree.children?.[0]?.style?.headingLevel).toBe('H3');
    expect(tree.children?.[1]?.text).toBe(NUCLEAR_PHYSICS_SPACER_TEXT);
    expect(tree.children?.[2]?.style?.headingLevel).toBe('H3');
  });
});
