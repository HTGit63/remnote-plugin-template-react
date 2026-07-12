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
import { createOrReplaceNoteFromMarkdown } from '../src/remnote/write/markdownImportExecutor';
import {
  RICH_TEXT_FONT_COLOR_FIELD,
  RICH_TEXT_HIGHLIGHT_FIELD,
} from '../src/remnote/richTextFormatting';
import { applyStylePlan, setTextSpanColor } from '../src/remnote/write/formattingWrites';
import { countRichTextMathSpans } from '../src/remnote/write/verification';
import { MARKDOWN_IMPORT_RESULT_CACHE } from '../src/remnote/write/writeCaches';
import { FakePlugin } from './helpers/fakeRemnote';

async function plainTreeAsync(fake: FakePlugin, remId: string): Promise<string[]> {
  const rem = fake.rems.get(remId);
  if (!rem) {
    return [];
  }
  const text = await fake.richText.toString(rem.text);
  const children = (await Promise.all(rem.children.map((childId) => plainTreeAsync(fake, childId)))).flat();
  return [text, ...children].filter(Boolean);
}

async function findRemIdByPlainText(fake: FakePlugin, text: string): Promise<string | undefined> {
  for (const [remId, rem] of fake.rems.entries()) {
    if ((await fake.richText.toString(rem.text)) === text) {
      return remId;
    }
  }
  return undefined;
}

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

  test('style-after-write preserves created text and formula readback', async () => {
    MARKDOWN_IMPORT_RESULT_CACHE.clear();
    const fake = new FakePlugin();
    const parent = fake.addRem('style-workflow-parent', 'Style workflow parent');
    const note = await createOrReplaceNoteFromMarkdown(fake.asPlugin(), {
      parentRemId: parent._id,
      markdownText: [
        '# Style Workflow Root',
        '',
        '## Formula Section',
        '',
        'Alpha formula: $qE = qvB$.',
      ].join('\n'),
      mode: 'create_child',
      duplicatePolicy: 'create_new',
      safetyOptions: {
        verifyAfterWrite: true,
        rollbackOnFailure: true,
        idempotencyKey: 'idem:style-after-write',
      },
    });
    const before = await plainTreeAsync(fake, note.rootRemId as string);
    const formulaRemId = await findRemIdByPlainText(fake, 'Alpha formula: qE = qvB.');

    expect(formulaRemId).toBeDefined();
    const formulaRem = fake.rems.get(formulaRemId as string);
    const formulaSpansBefore = countRichTextMathSpans(formulaRem?.text);

    const styled = await setTextSpanColor(fake.asPlugin(), {
      remId: formulaRemId as string,
      text: 'Alpha',
      color: 'blue',
      verifyAfterWrite: true,
    });
    const after = await plainTreeAsync(fake, note.rootRemId as string);

    expect(styled.status).toBe('span_color_set');
    expect(styled.verification).toMatchObject({
      plainTextUnchanged: true,
      childOrderUnchanged: true,
      noChildrenCreated: true,
      onlyExpectedStyleChanged: true,
    });
    expect(after).toEqual(before);
    expect(after).toContain('Alpha formula: qE = qvB.');
    expect(formulaSpansBefore).toEqual({ inlineMathCount: 1, mathBlockCount: 0 });
    expect(countRichTextMathSpans(formulaRem?.text)).toEqual(formulaSpansBefore);
  });

  test('multi-style plan applies only intended spans without visible pollution', async () => {
    const fake = new FakePlugin();
    const target = fake.addRem('multi-style-target', 'Alpha beta gamma');

    const result = await applyStylePlan(fake.asPlugin(), {
      operations: [
        { remId: target._id, type: 'text_color_span', text: 'Alpha', color: 'blue' },
        { remId: target._id, type: 'text_highlight_span', text: 'beta', highlightColor: 'yellow' },
        { remId: target._id, type: 'bold_span', text: 'gamma' },
      ],
      verifyAfterWrite: true,
      idempotencyKey: 'idem:multi-style-plan',
    });

    const spans = target.text.filter((item): item is Record<string, unknown> =>
      typeof item === 'object' && item !== null
    );
    const alpha = spans.find((item) => item.text === 'Alpha');
    const beta = spans.find((item) => item.text === 'beta');
    const gamma = spans.find((item) => item.text === 'gamma');

    expect(result.status).toBe('applied');
    expect(result.operations.map((operation) => operation.status)).toEqual(['applied', 'applied', 'applied']);
    expect(result.operations).toEqual(expect.arrayContaining([
      expect.objectContaining({ result: expect.objectContaining({ verification: expect.objectContaining({ plainTextUnchanged: true }) }) }),
    ]));
    expect(alpha?.[RICH_TEXT_FONT_COLOR_FIELD]).toBe(6);
    expect(alpha?.[RICH_TEXT_HIGHLIGHT_FIELD]).toBeUndefined();
    expect(beta?.[RICH_TEXT_HIGHLIGHT_FIELD]).toBe(3);
    expect(beta?.[RICH_TEXT_FONT_COLOR_FIELD]).toBeUndefined();
    expect(gamma?.b).toBe(true);
    expect(await fake.richText.toString(target.text)).toBe('Alpha beta gamma');
    expect(target.children).toEqual([]);
  });
});
