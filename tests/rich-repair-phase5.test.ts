import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { updateRemRich } from '../src/remnote/write/basicWrites';
import { readRemRich } from '../src/remnote/read';
import {
  applyStylePlan,
  clearRemFormatting,
  setRemHeadingLevel,
  setRemHighlightColor,
  setTextSpanHighlight,
} from '../src/remnote/write/formattingWrites';
import {
  STYLE_PLAN_RESULT_CACHE,
  UPDATE_RICH_RESULT_CACHE,
} from '../src/remnote/write/writeCaches';
import { FakePlugin } from './helpers/fakeRemnote';

const HEADING_FLAG = 'REMNOTE_BRIDGE_ENABLE_EXISTING_REM_HEADING_STYLE';
const HIGHLIGHT_FLAG = 'REMNOTE_BRIDGE_ENABLE_NATIVE_REM_HIGHLIGHT';

beforeEach(() => {
  STYLE_PLAN_RESULT_CACHE.clear();
  UPDATE_RICH_RESULT_CACHE.clear();
  delete process.env[HEADING_FLAG];
  delete process.env[HIGHLIGHT_FLAG];
});

afterEach(() => {
  delete process.env[HEADING_FLAG];
  delete process.env[HIGHLIGHT_FLAG];
});

describe('Phase 5 rich repair invariants', () => {
  test('plain-text lookup after a math node maps to SDK rich offsets', async () => {
    const fake = new FakePlugin();
    const target = fake.addRem('mixed-offset-target', 'placeholder');
    target.text = [
      { i: 'm', text: 'alpha ', b: true },
      { i: 'x', text: 'E=mc^2', block: false },
      { i: 'm', text: ' omega', l: true },
    ] as never;

    const plainLength = fake.richText.length;
    const plainSubstring = fake.richText.substring;
    fake.richText.length = async (richText) => richText.reduce((sum, item) => {
      if (typeof item === 'object' && item !== null && (item as { i?: string }).i === 'x') return sum + 2;
      return sum + (typeof item === 'string' ? item.length : String((item as { text?: string }).text ?? '').length);
    }, 0);
    fake.richText.substring = async (richText, start, end) => {
      const output: typeof richText = [];
      let cursor = 0;
      const stop = end ?? Number.MAX_SAFE_INTEGER;
      for (const item of richText) {
        const record = typeof item === 'object' && item !== null ? item as Record<string, unknown> : undefined;
        const text = typeof item === 'string' ? item : String(record?.text ?? '');
        const width = record?.i === 'x' ? 2 : text.length;
        const itemStart = cursor;
        const itemEnd = cursor + width;
        cursor = itemEnd;
        if (itemEnd <= start || itemStart >= stop) continue;
        if (record?.i === 'x') {
          if (start <= itemStart && stop >= itemEnd) output.push(item);
          continue;
        }
        const sliceStart = Math.max(0, start - itemStart);
        const sliceEnd = Math.min(text.length, stop - itemStart);
        const sliced = text.slice(sliceStart, sliceEnd);
        if (!sliced) continue;
        output.push(typeof item === 'string' ? sliced : ({ ...record, text: sliced } as never));
      }
      return output;
    };

    try {
      const result = await setTextSpanHighlight(fake.asPlugin(), {
        remId: target._id,
        text: 'omega',
        color: 'yellow',
      });

      expect(result).toMatchObject({
        status: 'span_highlight_set',
        resolvedPlainText: 'omega',
        start: 13,
        end: 18,
      });
      expect(target.text).toEqual([
        { i: 'm', text: 'alpha ', b: true },
        { i: 'x', text: 'E=mc^2', block: false },
        { i: 'm', text: ' ' , l: true },
        { i: 'm', text: 'omega', l: true, h: 3 },
      ]);
    } finally {
      fake.richText.length = plainLength;
      fake.richText.substring = plainSubstring;
    }
  });

  test('rich replacement preserves and verifies supported styles on math nodes', async () => {
    const fake = new FakePlugin();
    const target = fake.addRem('math-style-replacement', 'placeholder');

    const result = await updateRemRich(fake.asPlugin(), {
      remId: target._id,
      richText: [{ type: 'mathBlock', latex: 'E=mc^2', styles: { color: 'blue', highlight: 'yellow', bold: true } }],
      idempotencyKey: 'phase5-math-style-replacement',
    });

    expect(result.ok).toBe(true);
    expect(result.verification).toMatchObject({ richTextMatchesRequested: true });
    expect(target.text).toEqual([{ i: 'x', text: 'E=mc^2', block: true, tc: 6, h: 3, b: true }]);
    const readback = await readRemRich(fake.asPlugin(), { remId: target._id });
    expect(readback?.richText).toEqual([
      expect.objectContaining({
        type: 'mathBlock',
        latex: 'E=mc^2',
        styles: expect.objectContaining({ color: 'blue', highlight: 'yellow', bold: true }),
      }),
    ]);
  });

  test('full rich replacement may change text while preserving identity and structure', async () => {
    const fake = new FakePlugin();
    const parent = fake.addRem('replace-parent', 'Parent');
    const beforeSibling = fake.addRem('replace-before', 'Before');
    const target = fake.addRem('replace-target', 'Old text');
    const afterSibling = fake.addRem('replace-after', 'After');
    const child = fake.addRem('replace-child', 'Child');
    await beforeSibling.setParent(parent);
    await target.setParent(parent);
    await afterSibling.setParent(parent);
    await child.setParent(target);

    const result = await updateRemRich(fake.asPlugin(), {
      remId: target._id,
      richText: [
        { text: 'New ', styles: { bold: true } },
        { type: 'inlineMath', latex: 'E=mc^2' },
      ],
      idempotencyKey: 'phase5-rich-replace',
    });

    expect(result.ok).toBe(true);
    expect(result.status).toBe('updated_rich');
    expect(result.verification).toMatchObject({
      operationInvariant: 'rich_replacement',
      plainTextMatchesRequested: true,
      parentUnchanged: true,
      siblingOrderUnchanged: true,
      childOrderUnchanged: true,
      noChildrenCreated: true,
    });
    expect(target._id).toBe('replace-target');
    expect(target.parent).toBe(parent._id);
    expect(parent.children).toEqual([beforeSibling._id, target._id, afterSibling._id]);
    expect(target.children).toEqual([child._id]);
  });

  test('whole-Rem highlight uses native SDK for math and preserves the rich node', async () => {
    const fake = new FakePlugin();
    const target = fake.addRem('math-highlight-target', 'placeholder');
    target.text = [{ i: 'x', text: 'E=mc^2', block: true }] as never;
    const before = JSON.stringify(target.text);

    const result = await setRemHighlightColor(fake.asPlugin(), {
      remId: target._id,
      color: 'yellow',
    });

    expect(result).toMatchObject({
      ok: true,
      remId: target._id,
      status: 'highlight_set',
    });
    expect(await target.getHighlightColor()).toBe('Yellow');
    expect(JSON.stringify(target.text)).toBe(before);
  });

  test('whole-Rem highlight accepts only the SDK Color property Rem as native metadata', async () => {
    const fake = new FakePlugin();
    fake.materializeHighlightAsPropertyChild = true;
    const target = fake.addRem('native-highlight-property-target', 'Formula block');

    const result = await setRemHighlightColor(fake.asPlugin(), {
      remId: target._id,
      color: 'yellow',
    });

    expect(result).toMatchObject({
      ok: true,
      status: 'highlight_set',
      verification: {
        nativeHighlightReadback: 'Yellow',
        sdkMetadataChildCount: 1,
        onlyExpectedStyleChanged: true,
      },
    });
    expect(target.children).toHaveLength(1);
  });

  test('whole-Rem highlight still rejects unrelated children beside SDK metadata', async () => {
    const fake = new FakePlugin();
    fake.materializeHighlightAsPropertyChild = true;
    fake.materializeUnexpectedHighlightChild = true;
    const target = fake.addRem('native-highlight-unexpected-child-target', 'Formula block');

    await expect(setRemHighlightColor(fake.asPlugin(), {
      remId: target._id,
      color: 'yellow',
    })).rejects.toMatchObject({
      code: 'PARTIAL_FAILURE',
      details: expect.objectContaining({
        partialExecution: expect.objectContaining({
          failedStage: 'style_child_pollution_check',
        }),
      }),
    });
  });

  test('math conversion preserves target style fields and untouched rich nodes', async () => {
    const fake = new FakePlugin();
    const target = fake.addRem('math-conversion-target', 'placeholder');
    target.text = [
      { i: 'm', text: 'Before ', italic: true },
      { i: 'm', text: 'E=mc^2', b: true, tc: 6, h: 3 },
      { i: 'm', text: ' after', u: true },
    ] as never;

    const result = await applyStylePlan(fake.asPlugin(), {
      operations: [{
        remId: target._id,
        type: 'math_conversion',
        text: 'E=mc^2',
        latex: 'E=mc^2',
      }],
      idempotencyKey: 'phase5-math-conversion',
      verifyAfterWrite: true,
    });

    expect(result.status).toBe('applied');
    expect(result.operations[0]).toMatchObject({ status: 'applied' });
    expect(target.text).toEqual([
      { i: 'm', text: 'Before ', italic: true },
      { i: 'x', text: 'E=mc^2', block: false, b: true, tc: 6, h: 3 },
      { i: 'm', text: ' after', u: true },
    ]);
  });

  test('range crossing a math node fails without changing rich content', async () => {
    const fake = new FakePlugin();
    const target = fake.addRem('mixed-range-target', 'placeholder');
    target.text = [
      { i: 'm', text: 'A' },
      { i: 'x', text: 'x^2', block: false },
      { i: 'm', text: 'B' },
    ] as never;
    const before = JSON.stringify(target.text);

    await expect(setTextSpanHighlight(fake.asPlugin(), {
      remId: target._id,
      color: 'blue',
      start: 0,
      end: 5,
    })).rejects.toMatchObject({ code: 'INVALID_ARGS' });
    expect(JSON.stringify(target.text)).toBe(before);
  });

  test('heading mutation requires direct property readback and creates no metadata children', async () => {
    const fake = new FakePlugin();
    const target = fake.addRem('heading-target', 'Heading');

    await expect(setRemHeadingLevel(fake.asPlugin(), {
      remId: target._id,
      level: 'H2',
    })).rejects.toMatchObject({ code: 'SDK_UNSUPPORTED' });
    expect(target.children).toEqual([]);
    expect(target.fontSize).toBeUndefined();

    process.env[HEADING_FLAG] = '1';
    const result = await setRemHeadingLevel(fake.asPlugin(), {
      remId: target._id,
      level: 'H2',
    });
    expect(result.verification).toMatchObject({
      expectedHeadingLevel: 'H2',
      actualHeadingLevel: 'H2',
      headingRoundTripPassed: true,
      noChildrenCreated: true,
    });
    expect(target.children).toEqual([]);
  });

  test('heading no-op SDK response cannot claim success', async () => {
    const fake = new FakePlugin();
    const target = fake.addRem('heading-noop-target', 'Heading');
    target.setFontSize = async () => undefined;
    process.env[HEADING_FLAG] = '1';

    await expect(setRemHeadingLevel(fake.asPlugin(), {
      remId: target._id,
      level: 'H3',
    })).rejects.toMatchObject({
      code: 'PARTIAL_FAILURE',
      details: expect.objectContaining({ expectedHeadingLevel: 'H3', actualHeadingLevel: 'normal' }),
    });
    expect(target.children).toEqual([]);
  });

  test('clear formatting does not attempt unsafe heading reset without live capability opt-in', async () => {
    const fake = new FakePlugin();
    const target = fake.addRem('clear-formatting-target', 'Styled');
    target.fontSize = 'H2';
    fake.polluteFontSizeAsChildren = true;

    const result = await clearRemFormatting(fake.asPlugin(), { remId: target._id });

    expect(result).toMatchObject({
      status: 'formatting_partially_cleared',
      ok: false,
      cleared: { heading: false },
      unsupported: { headingReset: true },
    });
    expect(fake.fontSizeCalls).toEqual([]);
    expect(target.children).toEqual([]);
    expect(target.fontSize).toBe('H2');
  });
});
