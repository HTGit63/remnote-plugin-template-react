import type { PluginRem as Rem, RichTextFormatName, RichTextInterface, RNPlugin } from '@remnote/plugin-sdk';

type RichTextItem = RichTextInterface[number];

export class FakeRem {
  _id: string;
  text: RichTextInterface;
  backText: RichTextInterface = [];
  children: string[] = [];
  parent: string | null = null;
  fontSize: 'H1' | 'H2' | 'H3' | undefined;
  private practiceEnabled = false;
  private practiceDirection = 'both';
  private cardItem = false;
  private listItem = true;
  private remType: unknown = 'normal';
  private highlightColor = 'default';

  constructor(
    private readonly plugin: FakePlugin,
    id: string,
    text: RichTextInterface = []
  ) {
    this._id = id;
    this.text = text;
  }

  async setText(text: RichTextInterface) {
    const plain = await this.plugin.richText.toString(text);
    if (this.plugin.failSetTextIncludes && plain.includes(this.plugin.failSetTextIncludes)) {
      throw new Error(`forced setText failure for ${plain}`);
    }
    const mediaFilteredText = this.plugin.dropMediaOnSetText
      ? text.filter((item) => {
          if (typeof item !== 'object' || item === null || Array.isArray(item)) return true;
          const record = item as Record<string, unknown>;
          return record.i !== 'i' && record.i !== 'a';
        }) as RichTextInterface
      : text;
    const storedText = this.plugin.flattenMathToPlainText
      ? mediaFilteredText.map((item) => {
          if (typeof item !== 'object' || item === null || Array.isArray(item)) {
            return item;
          }
          const record = item as Record<string, unknown>;
          if (record.i !== 'x') {
            return item;
          }
          return { i: 'm', text: String(record.text ?? '') } as RichTextItem;
        }) as RichTextInterface
      : mediaFilteredText;
    this.text = JSON.parse(JSON.stringify(storedText));
  }

  async setBackText(text: RichTextInterface) {
    this.backText = JSON.parse(JSON.stringify(text));
  }

  async setEnablePractice(enabled: boolean) {
    this.practiceEnabled = enabled;
  }

  async getEnablePractice() {
    return this.practiceEnabled;
  }

  async setPracticeDirection(direction: string) {
    this.practiceDirection = direction;
  }

  async getPracticeDirection() {
    return this.practiceDirection;
  }

  async setIsCardItem(cardItem: boolean) {
    this.cardItem = cardItem;
  }

  async isCardItem() {
    return this.cardItem;
  }

  async isDocument() {
    return false;
  }

  async setFontSize(level: 'H1' | 'H2' | 'H3' | undefined) {
    this.fontSize = level;
    this.plugin.fontSizeCalls.push({ remId: this._id, level });
    if (this.plugin.polluteFontSizeAsChildren && level) {
      const size = this.plugin.addRem(`font-size-${this.plugin.fontSizeCalls.length}-size`, 'Size');
      await size.setParent(this, this.children.length);
      const value = this.plugin.addRem(`font-size-${this.plugin.fontSizeCalls.length}-${level}`, level);
      await value.setParent(size, 0);
    }
  }
  async getFontSize() {
    return this.fontSize;
  }
  async setHighlightColor(color: string) {
    this.highlightColor = color;
    if (this.plugin.materializeHighlightAsPropertyChild) {
      let existing: FakeRem | undefined;
      for (const child of await this.getChildrenRem()) {
        if ((await this.plugin.richText.toString(child.text)) === 'Color') {
          existing = child as unknown as FakeRem;
          break;
        }
      }
      if (!existing) {
        const property = this.plugin.addRem(`highlight-color-${this.plugin.createRemCount + 1}`, 'Color');
        property.backText = [{ i: 'm', text: color }] as never;
        await property.setParent(this, this.children.length);
      }
    }
    if (this.plugin.materializeUnexpectedHighlightChild) {
      const unexpected = this.plugin.addRem(
        `highlight-unexpected-${this.plugin.createRemCount + 1}`,
        'Unexpected highlight side effect'
      );
      await unexpected.setParent(this, this.children.length);
    }
  }
  async getHighlightColor() {
    return this.highlightColor;
  }
  async setIsListItem(listItem: boolean) {
    this.listItem = listItem;
  }
  async isListItem() {
    return this.listItem;
  }
  async setType(type: unknown) {
    this.remType = type;
  }
  async getType() {
    return this.remType;
  }

  async getCards() {
    return [];
  }

  async setParent(parent: FakeRem, index?: number) {
    if (this.plugin.failSetParent) {
      throw new Error(`forced setParent failure for ${this._id}`);
    }
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
      const fakeChild = child as unknown as FakeRem;
      descendants.push(fakeChild);
      descendants.push(...((await fakeChild.getDescendants()) as unknown as FakeRem[]));
    }
    return descendants as unknown as Rem[];
  }

  async remove() {
    if (this.plugin.failRemoveIds.has(this._id)) {
      throw new Error(`forced remove failure for ${this._id}`);
    }
    if (this.parent) {
      const parent = this.plugin.rems.get(this.parent);
      if (parent) {
        parent.children = parent.children.filter((id) => id !== this._id);
      }
    }
    this.plugin.rems.delete(this._id);
  }
}

export class FakePlugin {
  rems = new Map<string, FakeRem>();
  createRemCount = 0;
  failSetTextIncludes?: string;
  failRemoveIds = new Set<string>();
  flattenMathToPlainText = false;
  dropMediaOnSetText = false;
  failSetParent = false;
  materializeHighlightAsPropertyChild = false;
  materializeUnexpectedHighlightChild = false;
  polluteFontSizeAsChildren = false;
  fontSizeCalls: Array<{ remId: string; level: 'H1' | 'H2' | 'H3' | undefined }> = [];
  mediaBuilderCalls: Array<{
    kind: 'image' | 'audio' | 'video';
    url: string;
    width?: number;
    height?: number;
  }> = [];
  private nextId = 1;

  richText = {
    text: (text: string, formats: RichTextFormatName[] = []) => ({
      value: async () => [{
        i: 'm',
        text,
        ...(formats.includes('bold') ? { b: true } : {}),
        ...(formats.includes('italic') ? { italic: true } : {}),
        ...(formats.includes('underline') ? { u: true } : {}),
        ...(formats.includes('quote') ? { q: true } : {}),
      } as RichTextItem],
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
        output.push(
          typeof item === 'string'
            ? sliced
            : ({ ...(item as Record<string, unknown>), text: sliced } as RichTextItem)
        );
      }
      return output;
    },
    parseFromMarkdown: async (markdown: string) => [{ i: 'm', text: markdown } as RichTextItem],
    latex: (text: string, block = false) => ({ i: 'x', text, block } as RichTextItem),
    image: (url: string, width?: number, height?: number) => {
      this.mediaBuilderCalls.push({ kind: 'image', url, ...(width === undefined ? {} : { width }), ...(height === undefined ? {} : { height }) });
      return this.mediaBuilder([{ i: 'i', url, ...(width === undefined ? {} : { width }), ...(height === undefined ? {} : { height }) } as RichTextItem]);
    },
    audio: (url: string) => {
      this.mediaBuilderCalls.push({ kind: 'audio', url });
      return this.mediaBuilder([{ i: 'a', url, onlyAudio: true } as RichTextItem]);
    },
    video: (url: string) => {
      this.mediaBuilderCalls.push({ kind: 'video', url });
      return this.mediaBuilder([{ i: 'a', url, onlyAudio: false } as RichTextItem]);
    },
  };

  private mediaBuilder(initial: RichTextInterface) {
    const value = [...initial] as RichTextInterface;
    const builder = {
      newline: () => {
        value.push('\n');
        return builder;
      },
      text: (text: string) => {
        value.push(text);
        return builder;
      },
      value: async () => JSON.parse(JSON.stringify(value)) as RichTextInterface,
    };
    return builder;
  }

  rem = {
    findOne: async (id: string) => this.rems.get(id) as unknown as Rem | null,
    createRem: async () => {
      const rem = new FakeRem(this, `generated-${this.nextId}`, []);
      this.nextId += 1;
      this.createRemCount += 1;
      this.rems.set(rem._id, rem);
      return rem as unknown as Rem;
    },
  };

  focus = {
    getFocusedRem: async () => null as Rem | null,
    getFocusedPortal: async () => null as Rem | null,
  };

  addRem(id: string, text: string): FakeRem {
    const rem = new FakeRem(this, id, [{ i: 'm', text } as RichTextItem]);
    this.rems.set(id, rem);
    return rem;
  }

  asPlugin(): RNPlugin {
    return this as unknown as RNPlugin;
  }
}
