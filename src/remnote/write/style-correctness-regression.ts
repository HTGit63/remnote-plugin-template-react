import type { PluginRem as Rem, RichTextInterface, RNPlugin } from '@remnote/plugin-sdk';
import {
  RICH_TEXT_FONT_COLOR_FIELD,
  RICH_TEXT_HIGHLIGHT_FIELD,
} from '../richTextFormatting';

type FakeRichTextItem = RichTextInterface[number];

class FakeRem {
  _id: string;
  text: RichTextInterface;
  children: string[] = [];
  parent: string | null = null;
  type = 'normal';
  private fontSize: 'H1' | 'H2' | 'H3' | undefined;
  private highlightColor = 'default';
  private isList = true;

  constructor(
    private readonly plugin: FakePlugin,
    id: string,
    text: RichTextInterface = []
  ) {
    this._id = id;
    this.text = text;
  }

  async setText(text: RichTextInterface) {
    this.text = JSON.parse(JSON.stringify(text));
  }

  async setFontSize(level: 'H1' | 'H2' | 'H3' | undefined) {
    this.fontSize = level;
  }

  async getFontSize() {
    return this.fontSize;
  }

  async setHighlightColor(color: string) {
    this.highlightColor = color;
  }

  async getHighlightColor() {
    return this.highlightColor;
  }

  async setIsListItem(isList: boolean) {
    this.isList = isList;
  }

  async isListItem() {
    return this.isList;
  }

  async setParent(parent: FakeRem, index?: number) {
    if (this.parent) {
      const oldParent = this.plugin.rems.get(this.parent);
      if (oldParent) {
        oldParent.children = oldParent.children.filter((id) => id !== this._id);
      }
    }
    this.parent = parent._id;
    const insertAt = index === undefined ? parent.children.length : Math.max(0, index);
    parent.children.splice(insertAt, 0, this._id);
  }

  async getChildrenRem(): Promise<Rem[]> {
    return this.children
      .map((id) => this.plugin.rems.get(id))
      .filter((rem): rem is FakeRem => Boolean(rem)) as unknown as Rem[];
  }

  async getDescendants(): Promise<Rem[]> {
    const descendants: FakeRem[] = [];
    for (const child of await this.getChildrenRem()) {
      descendants.push(child as unknown as FakeRem);
      descendants.push(...((await (child as unknown as FakeRem).getDescendants()) as unknown as FakeRem[]));
    }
    return descendants as unknown as Rem[];
  }

  async remove() {
    if (this.parent) {
      const parent = this.plugin.rems.get(this.parent);
      if (parent) {
        parent.children = parent.children.filter((id) => id !== this._id);
      }
    }
    this.plugin.rems.delete(this._id);
  }
}

class FakePlugin {
  rems = new Map<string, FakeRem>();
  private nextId = 1;

  richText = {
    text: (text: string, formats: string[] = []) => ({
      value: async () => {
        const item: Record<string, unknown> = { i: 'm', text };
        if (formats.includes('bold')) item.b = true;
        if (formats.includes('italic')) item.l = true;
        if (formats.includes('underline')) item.u = true;
        if (formats.includes('quote')) item.q = true;
        return [item] as RichTextInterface;
      },
    }),
    toString: async (richText: RichTextInterface) =>
      richText
        .map((item) => typeof item === 'string' ? item : String((item as Record<string, unknown>).text ?? ''))
        .join(''),
    length: async (richText: RichTextInterface) => this.richText.toString(richText).then((text) => text.length),
    substring: async (richText: RichTextInterface, start: number, end?: number) => {
      const output: RichTextInterface = [];
      let cursor = 0;
      const stop = end ?? Number.MAX_SAFE_INTEGER;
      for (const item of richText) {
        const text = typeof item === 'string' ? item : String((item as Record<string, unknown>).text ?? '');
        const itemStart = cursor;
        const itemEnd = cursor + text.length;
        cursor = itemEnd;
        if (itemEnd <= start || itemStart >= stop) {
          continue;
        }
        const sliceStart = Math.max(0, start - itemStart);
        const sliceEnd = Math.min(text.length, stop - itemStart);
        const sliced = text.slice(sliceStart, sliceEnd);
        if (!sliced) {
          continue;
        }
        if (typeof item === 'string') {
          output.push(sliced);
        } else {
          output.push({ ...(item as Record<string, unknown>), text: sliced } as FakeRichTextItem);
        }
      }
      return output;
    },
  };

  rem = {
    findOne: async (id: string) => this.rems.get(id) as unknown as Rem | null,
    createRem: async () => {
      const rem = new FakeRem(this, `generated-${this.nextId}`, []);
      this.nextId += 1;
      this.rems.set(rem._id, rem);
      return rem as unknown as Rem;
    },
  };

  focus = {
    getFocusedRem: async () => this.rems.get('root') as unknown as Rem,
  };

  editor = {
    getSelection: async () => ({ type: 'Rem', remIds: ['root'] }),
  };

  addRem(id: string, text: string): FakeRem {
    const rem = new FakeRem(this, id, [{ i: 'm', text } as FakeRichTextItem]);
    this.rems.set(id, rem);
    return rem;
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function hasMath(richText: RichTextInterface, latex: string, block: boolean) {
  return richText.some((item) => {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      return false;
    }
    const record = item as Record<string, unknown>;
    return record.i === 'x' && record.text === latex && Boolean(record.block) === block;
  });
}

async function main() {
  (globalThis as unknown as { self?: unknown }).self = globalThis;
  const {
    applyRemnoteCommand,
    setRemHeadingLevel,
    setRemHighlightColor,
    setRemTextColor,
    setTextSpanColor,
    setTextSpanHighlight,
  } = await import('./formattingWrites');
  const { verifyNoteDesign } = await import('./verification');
  const fake = new FakePlugin();
  const plugin = fake as unknown as RNPlugin;
  const root = fake.addRem('root', 'Smoke alpha beta');

  const headingH1 = await setRemHeadingLevel(plugin, { remId: root._id, level: 'H1' });
  assert(root.children.length === 0, 'H1 setter created child Rem.');
  assert(headingH1.verification?.noChildrenCreated === true, 'H1 setter did not prove no child mutation.');

  const headingH3 = await setRemHeadingLevel(plugin, { remId: root._id, level: 'H3' });
  assert(root.children.length === 0, 'H3 setter created child Rem.');
  assert(headingH3.verification?.noChildrenCreated === true, 'H3 setter did not prove no child mutation.');

  await setRemTextColor(plugin, { remId: root._id, color: 'Red' });
  assert((root.text[0] as Record<string, unknown>)[RICH_TEXT_FONT_COLOR_FIELD] === 1, 'Red text color not applied as font color.');
  assert((root.text[0] as Record<string, unknown>)[RICH_TEXT_HIGHLIGHT_FIELD] === undefined, 'Text color corrupted highlight.');

  await setRemHighlightColor(plugin, { remId: root._id, color: 'Blue' });
  assert(await root.getHighlightColor() !== 'Blue', 'Safe whole-text highlight used native Rem highlight.');
  assert(root.text.some((item) => typeof item === 'object' && item !== null && (item as Record<string, unknown>)[RICH_TEXT_HIGHLIGHT_FIELD] === 6), 'Whole-text rich highlight missing.');
  assert((root.text[0] as Record<string, unknown>)[RICH_TEXT_FONT_COLOR_FIELD] === 1, 'Whole-text highlight corrupted text color.');
  assert(root.children.length === 0, 'Whole-text highlight created child Rem.');

  await setTextSpanColor(plugin, { remId: root._id, text: 'alpha', color: 'Blue' });
  assert(root.text.some((item) => typeof item === 'object' && item !== null && (item as Record<string, unknown>).text === 'alpha' && (item as Record<string, unknown>)[RICH_TEXT_FONT_COLOR_FIELD] === 6), 'Span font color missing.');

  await setTextSpanHighlight(plugin, { remId: root._id, text: 'beta', color: 'Yellow' });
  assert(root.text.some((item) => typeof item === 'object' && item !== null && (item as Record<string, unknown>).text === 'beta' && (item as Record<string, unknown>)[RICH_TEXT_HIGHLIGHT_FIELD] === 3), 'Span highlight missing.');
  assert(root.children.length === 0, 'Span style tools created child Rems.');

  await applyRemnoteCommand(plugin, {
    target: { mode: 'rem_id', remId: root._id },
    command: 'insert_inline_math',
    args: { latex: 'E=mc^2' },
    idempotencyKey: 'style-regression-inline',
  });
  assert(hasMath(root.text, 'E=mc^2', false), 'Inline math was not inserted as inline math rich-text node.');
  assert(root.children.length === 0, 'Inline math insertion created child Rem.');

  const blockResult = await applyRemnoteCommand(plugin, {
    target: { mode: 'rem_id', remId: root._id },
    command: 'insert_math_block',
    args: { latex: 'F=ma' },
    idempotencyKey: 'style-regression-block',
  });
  assert(blockResult.createdRemId, 'Block math insertion did not report created child Rem.');
  assert((root.children as string[]).length === 1, 'Block math insertion did not create exactly one child Rem.');
  const block = fake.rems.get(root.children[0]);
  assert(block && hasMath(block.text, 'F=ma', true), 'Block math child is not a block math rich-text Rem.');

  const verify = await verifyNoteDesign(plugin, {
    rootRemId: root._id,
    expectedStyleMap: {
      [root._id]: {
        headingLevel: 'H3',
        expectedChildCount: 1,
        textColorSpans: [{ text: 'alpha', color: 'Blue' }],
        textHighlightSpans: [{ text: 'beta', color: 'Yellow' }],
        mathSpans: [{ latex: 'E=mc^2', block: false }],
        noVisibleMathDelimiters: true,
      },
      [block._id]: {
        mathSpans: [{ latex: 'F=ma', block: true }],
        noVisibleMathDelimiters: true,
      },
    },
  });
  assert(verify.ok, `Style/math verification failed: ${JSON.stringify(verify.mismatches)}`);

  const pollution = fake.addRem('pollution', 'H1');
  await pollution.setParent(root, 0);
  const pollutedVerify = await verifyNoteDesign(plugin, {
    rootRemId: root._id,
    expectedStyleMap: {
      [root._id]: {
        forbiddenChildTexts: ['H1'],
      },
    },
  });
  assert(!pollutedVerify.ok, 'Verifier did not catch H1 pollution Rem.');
  assert(pollutedVerify.repairSuggestions?.some((suggestion) => suggestion.tool === 'delete_rem_by_id'), 'Verifier did not propose pollution repair signal.');

  console.log('Style correctness regression passed.');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
