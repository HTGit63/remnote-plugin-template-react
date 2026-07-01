import type { PluginRem as Rem, RichTextInterface, RNPlugin } from '@remnote/plugin-sdk';
import {
  RICH_TEXT_FONT_COLOR_FIELD,
  RICH_TEXT_HIGHLIGHT_FIELD,
} from '../richTextFormatting';

type FakeRichTextItem = RichTextInterface[number];

class FakeRem {
  _id: string;
  text: RichTextInterface;
  backText: RichTextInterface = [];
  children: string[] = [];
  parent: string | null = null;
  type: unknown = 'normal';
  private fontSize: 'H1' | 'H2' | 'H3' | undefined;
  private highlightColor = 'default';
  private isList = true;
  private practiceEnabled = false;
  private practiceDirection = 'both';
  private cardItem = false;

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

  async setType(type: unknown) {
    this.type = type;
  }

  async getType() {
    return this.type;
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
  private localStorage = new Map<string, unknown>();

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

  storage = {
    getLocal: async <T>(key: string) => this.localStorage.get(key) as T | undefined,
    setLocal: async <T>(key: string, value: T) => {
      this.localStorage.set(key, value);
    },
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

interface RemSnapshot {
  plainText: string;
  richTextJson: string;
  childIds: string[];
}

async function snapshotRem(plugin: RNPlugin, rem: FakeRem): Promise<RemSnapshot> {
  return {
    plainText: await plugin.richText.toString(rem.text),
    richTextJson: JSON.stringify(rem.text),
    childIds: [...rem.children],
  };
}

function assertStyleInvariant(
  label: string,
  before: RemSnapshot,
  after: RemSnapshot,
  verification?: Record<string, unknown>
) {
  assert(JSON.stringify(after.childIds) === JSON.stringify(before.childIds), `${label} changed child IDs/order.`);
  assert(after.plainText === before.plainText, `${label} changed plain text.`);
  assert(before.richTextJson.length > 0 || after.richTextJson.length > 0, `${label} did not capture rich text snapshots.`);
  assert(verification?.onlyExpectedStyleChanged === true, `${label} did not verify onlyExpectedStyleChanged.`);
  assert(verification?.plainTextUnchanged === true, `${label} did not verify plainTextUnchanged.`);
  assert(verification?.childOrderUnchanged === true, `${label} did not verify childOrderUnchanged.`);
}

async function createTwoChildStyleRoot(fake: FakePlugin, label: string): Promise<FakeRem> {
  const id = `style-${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;
  const root = fake.addRem(id, 'Smoke alpha beta');
  const first = fake.addRem(`${id}-child-a`, 'Known child A');
  const second = fake.addRem(`${id}-child-b`, 'Known child B');
  await first.setParent(root, 0);
  await second.setParent(root, 1);
  return root;
}

async function runTwoChildStyleCase(
  fake: FakePlugin,
  plugin: RNPlugin,
  label: string,
  operation: (root: FakeRem) => Promise<{ verification?: Record<string, unknown> } | undefined>
) {
  const root = await createTwoChildStyleRoot(fake, label);
  const before = await snapshotRem(plugin, root);
  const result = await operation(root);
  const after = await snapshotRem(plugin, root);
  assertStyleInvariant(label, before, after, result?.verification);
}

async function runUnsupportedStyleCase(
  fake: FakePlugin,
  plugin: RNPlugin,
  label: string,
  operation: (root: FakeRem) => Promise<unknown>
) {
  const root = await createTwoChildStyleRoot(fake, label);
  const before = await snapshotRem(plugin, root);
  try {
    await operation(root);
    assert(false, `${label} unexpectedly applied instead of returning SDK_UNSUPPORTED.`);
  } catch (error: unknown) {
    const code = (error as { code?: unknown })?.code;
    assert(code === 'SDK_UNSUPPORTED', `${label} returned ${String(code)} instead of SDK_UNSUPPORTED.`);
  }
  const after = await snapshotRem(plugin, root);
  assert(JSON.stringify(after.childIds) === JSON.stringify(before.childIds), `${label} changed child IDs/order.`);
  assert(after.plainText === before.plainText, `${label} changed plain text.`);
}

function simpleDesignRules() {
  return {
    headingPattern: { rootHeadingLevel: 'H1' as const, sectionHeadingLevel: 'H3' as const },
    colorPattern: { textColors: {}, highlightColors: {}, wholeRemHighlights: {} },
    spacingPattern: { spacerCount: 0, spacerTexts: [], blankRemCount: 0, siblingSpacerLikely: false },
    mathPattern: { inlineMathCount: 0, blockMathCount: 0, visibleDelimiterCount: 0, malformedMathLikely: false },
    bulletNesting: { maxDepth: 2, maxChildrenPerRem: 2, averageChildrenPerNonLeaf: 1 },
    formulaPlacement: { displayFormulasAsSeparateRems: false, inlineFormulasInsideText: false, rawDisplayDelimitersVisible: false },
    tableStyle: { tableLikeRemCount: 0, markdownTableCount: 0, tableHeadings: [] },
    cardStyle: { cardLikeRemCount: 0, clozeLikeRemCount: 0, doubleColonMarkerCount: 0 },
    workedExampleStyle: { workedExampleCount: 0, labels: [] },
  };
}

function massMarkdown(sectionCount: number): string {
  return [
    `# Mass Manifest ${sectionCount}`,
    '',
    ...Array.from({ length: sectionCount }, (_, index) => [
      `## Section ${index + 1}`,
      '',
      `Body ${index + 1} keeps source text, inline math \\(x_${index + 1}\\), and marker ${index + 1}:: answer ${index + 1}.`,
    ]).flat(),
  ].join('\n');
}

async function main() {
  (globalThis as unknown as { self?: unknown }).self = globalThis;
  const {
    applyRemnoteCommand,
    applyStylePlan,
    clearRemFormatting,
    setHideBullet,
    setRemHeadingLevel,
    setRemHighlightColor,
    setRemTextColor,
    setRemType,
    setTextSpanColor,
    setTextSpanHighlight,
  } = await import('./formattingWrites');
  const { updateRemRich } = await import('./basicWrites');
  const { createOrReplaceNoteFromMarkdown } = await import('./markdownImportExecutor');
  const { createNotePlanSummary, notePlanShapeEqual } = await import('./notePlan');
  const { verifyCardSet } = await import('./designedNoteTools');
  const {
    exportNoteDesignTemplate,
    importNoteDesignTemplate,
    saveNoteDesignTemplate,
  } = await import('../templates/designTemplates');
  const { parseMarkdownImportPlan } = await import('../../../shared/bridge/markdown-importer');
  const { verifyNoteDesign } = await import('./verification');
  const fake = new FakePlugin();
  const plugin = fake as unknown as RNPlugin;

  await runUnsupportedStyleCase(fake, plugin, 'set_rem_heading_level', (root) =>
    setRemHeadingLevel(plugin, { remId: root._id, level: 'H1' })
  );
  await runTwoChildStyleCase(fake, plugin, 'set_rem_text_color', async (root) => {
    const result = await setRemTextColor(plugin, { remId: root._id, color: 'Red' });
    assert((root.text[0] as Record<string, unknown>)[RICH_TEXT_FONT_COLOR_FIELD] === 1, 'Red text color not applied as font color.');
    assert((root.text[0] as Record<string, unknown>)[RICH_TEXT_HIGHLIGHT_FIELD] === undefined, 'Text color corrupted highlight.');
    return result;
  });
  await runTwoChildStyleCase(fake, plugin, 'set_rem_highlight_color', async (root) => {
    const result = await setRemHighlightColor(plugin, { remId: root._id, color: 'Blue' });
    assert(root.text.some((item) => typeof item === 'object' && item !== null && (item as Record<string, unknown>)[RICH_TEXT_HIGHLIGHT_FIELD] === 6), 'Whole-text rich highlight missing.');
    return result;
  });
  await runTwoChildStyleCase(fake, plugin, 'set_text_span_color', async (root) => {
    const result = await setTextSpanColor(plugin, { remId: root._id, text: 'alpha', color: 'Blue' });
    assert(root.text.some((item) => typeof item === 'object' && item !== null && (item as Record<string, unknown>).text === 'alpha' && (item as Record<string, unknown>)[RICH_TEXT_FONT_COLOR_FIELD] === 6), 'Span font color missing.');
    return result;
  });
  await runTwoChildStyleCase(fake, plugin, 'set_text_span_highlight', async (root) => {
    const result = await setTextSpanHighlight(plugin, { remId: root._id, text: 'beta', color: 'Yellow' });
    assert(root.text.some((item) => typeof item === 'object' && item !== null && (item as Record<string, unknown>).text === 'beta' && (item as Record<string, unknown>)[RICH_TEXT_HIGHLIGHT_FIELD] === 3), 'Span highlight missing.');
    return result;
  });
  await runTwoChildStyleCase(fake, plugin, 'set_rem_type', (root) =>
    setRemType(plugin, { remId: root._id, type: 'concept' })
  );
  await runTwoChildStyleCase(fake, plugin, 'set_hide_bullet', (root) =>
    setHideBullet(plugin, { remId: root._id, hideBullet: true })
  );
  await runTwoChildStyleCase(fake, plugin, 'clear_rem_formatting', async (root) => {
    await setRemTextColor(plugin, { remId: root._id, color: 'Red' });
    return clearRemFormatting(plugin, { remId: root._id });
  });
  await runTwoChildStyleCase(fake, plugin, 'apply_style_plan', async (root) => {
    const result = await applyStylePlan(plugin, {
      operations: [{ remId: root._id, type: 'bold_span', text: 'alpha' }],
      dryRun: false,
      idempotencyKey: 'style-plan-two-child',
    });
    return result.operations[0].result as { verification?: Record<string, unknown> };
  });
  await runUnsupportedStyleCase(fake, plugin, 'apply_remnote_command_heading', (root) =>
    applyRemnoteCommand(plugin, {
      target: { mode: 'rem_id', remId: root._id },
      command: 'heading_2',
      idempotencyKey: 'command-two-child',
    })
  );
  const headingPlanRoot = await createTwoChildStyleRoot(fake, 'apply-style-plan-heading');
  const headingPlanBefore = await snapshotRem(plugin, headingPlanRoot);
  const headingPlan = await applyStylePlan(plugin, {
    operations: [{ remId: headingPlanRoot._id, type: 'heading', headingLevel: 'H3' }],
    dryRun: false,
    idempotencyKey: 'style-plan-heading-unsupported',
  });
  const headingPlanAfter = await snapshotRem(plugin, headingPlanRoot);
  assert(headingPlan.status === 'partial', 'Heading style plan should be partial when the heading operation is unsupported.');
  assert(headingPlan.operations[0]?.status === 'unsupported', 'Heading style operation should be marked unsupported.');
  assert(JSON.stringify(headingPlanAfter.childIds) === JSON.stringify(headingPlanBefore.childIds), 'Heading style plan changed child IDs/order.');
  assert(headingPlanAfter.plainText === headingPlanBefore.plainText, 'Heading style plan changed plain text.');
  await runTwoChildStyleCase(fake, plugin, 'update_rem_rich', (root) =>
    updateRemRich(plugin, {
      remId: root._id,
      richText: [{ text: 'Smoke alpha beta', styles: { bold: true } }],
      idempotencyKey: 'update-rich-two-child',
    })
  );

  const root = fake.addRem('root', 'Smoke alpha beta');
  await setTextSpanColor(plugin, { remId: root._id, text: 'alpha', color: 'Blue' });
  await setTextSpanHighlight(plugin, { remId: root._id, text: 'beta', color: 'Yellow' });

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

  const emptyRoot = fake.addRem('cards-empty-root', 'Empty cards');
  const emptyVerify = await verifyCardSet(plugin, { rootRemId: emptyRoot._id, maxDepth: 1, timeoutMs: 1000 });
  assert(emptyVerify.ok && emptyVerify.status === 'verified' && emptyVerify.cardCount === 0, 'Empty card root should verify with ok=true.');
  assert(emptyVerify.warnings?.some((warning) => warning.includes('No cards found')), 'Empty card root should warn, not fail.');

  const noCardRoot = fake.addRem('cards-no-card-root', 'No cards');
  await fake.addRem('cards-no-card-a', 'Plain child A').setParent(noCardRoot, 0);
  await fake.addRem('cards-no-card-b', 'Plain child B').setParent(noCardRoot, 1);
  const noCardVerify = await verifyCardSet(plugin, { rootRemId: noCardRoot._id, maxDepth: 1, timeoutMs: 1000 });
  assert(noCardVerify.ok && noCardVerify.status === 'verified' && noCardVerify.cardCount === 0, 'No-card root should pass with warning.');

  const basicCardRoot = fake.addRem('cards-basic-root', 'Basic cards');
  const basicCard = fake.addRem('cards-basic-front', 'Basic front');
  await basicCard.setBackText([{ i: 'm', text: 'Basic back' } as FakeRichTextItem]);
  await basicCard.setEnablePractice(true);
  await basicCard.setParent(basicCardRoot, 0);
  const basicVerify = await verifyCardSet(plugin, { rootRemId: basicCardRoot._id, maxDepth: 1, timeoutMs: 1000 });
  assert(basicVerify.ok && basicVerify.cardCount === 1 && basicVerify.cards[0].cardType === 'basic', 'Basic card should verify.');

  const clozeRoot = fake.addRem('cards-cloze-root', 'Cloze cards');
  const clozeCard = fake.addRem('cards-cloze-front', 'The {{nucleus}} emits energy');
  await clozeCard.setParent(clozeRoot, 0);
  const clozeVerify = await verifyCardSet(plugin, { rootRemId: clozeRoot._id, maxDepth: 1, timeoutMs: 1000 });
  assert(clozeVerify.ok && clozeVerify.cardCount === 1 && clozeVerify.cards[0].cardType === 'cloze', 'Cloze card should verify.');

  const mixedRoot = fake.addRem('cards-mixed-root', 'Mixed cards');
  for (let index = 0; index < 50; index += 1) {
    const child = fake.addRem(`cards-mixed-${index}`, index % 15 === 0 ? `Cloze {{${index}}}` : `Ordinary ${index}`);
    if (index % 10 === 0) {
      await child.setBackText([{ i: 'm', text: `Back ${index}` } as FakeRichTextItem]);
      await child.setEnablePractice(true);
    }
    await child.setParent(mixedRoot, index);
  }
  const mixedVerify = await verifyCardSet(plugin, { rootRemId: mixedRoot._id, maxDepth: 1, maxNodes: 80, maxCards: 80, timeoutMs: 1000 });
  assert(mixedVerify.ok && mixedVerify.cardCount >= 7, '50 mixed card/ordinary Rems should verify within cap.');
  const cappedVerify = await verifyCardSet(plugin, { rootRemId: mixedRoot._id, maxDepth: 1, maxNodes: 10, maxCards: 80, timeoutMs: 1000 });
  assert(!cappedVerify.ok && cappedVerify.status === 'partial' && cappedVerify.truncated, 'Traversal cap should return PARTIAL.');

  const markdownPlan = parseMarkdownImportPlan('# Equivalent\n\n## Alpha\n\nBeta');
  const markdownNotePlan = createNotePlanSummary(markdownPlan.tree, 'markdown');
  const structuredNotePlan = createNotePlanSummary({
    text: 'Equivalent',
    children: [{ text: 'Alpha', children: [{ text: 'Beta' }] }],
  }, 'structured');
  assert(notePlanShapeEqual(markdownNotePlan, structuredNotePlan), 'Markdown and structured NotePlan shapes should be equivalent.');

  for (const size of [25, 50, 100, 250, 500]) {
    const dryRun = await createOrReplaceNoteFromMarkdown(plugin, {
      parentRemId: 'manifest-parent',
      markdownText: massMarkdown(Math.max(1, Math.floor(size / 3))),
      mode: 'create_child',
      duplicatePolicy: 'create_new',
      safetyOptions: {
        dryRun: true,
        verifyAfterWrite: true,
        rollbackOnFailure: true,
        idempotencyKey: `manifest-${size}`,
      },
      limits: { maxNodes: 2000, maxDepth: 12, maxMarkdownChars: 500000 },
      flashcardOptions: { enabled: true, marker: 'both' },
    });
    assert(dryRun.massNoteManifest?.plannedNodeCount === dryRun.nodeCount, `Mass manifest ${size} missing plannedNodeCount.`);
    assert(typeof dryRun.massNoteManifest?.estimatedWriteRisk === 'string', `Mass manifest ${size} missing risk.`);
    assert((dryRun.massNoteManifest?.recommendedChunkSize ?? 0) > 0, `Mass manifest ${size} missing recommendedChunkSize.`);
    assert((dryRun.massNoteManifest?.chunkCount ?? 0) >= 1, `Mass manifest ${size} missing chunkCount.`);
    assert(Array.isArray(dryRun.massNoteManifest?.warnings), `Mass manifest ${size} missing warnings.`);
    if (size >= 250) {
      assert((dryRun.massNoteManifest?.chunkCount ?? 0) > 1, `Mass manifest ${size} should use chunking.`);
    }
  }

  await saveNoteDesignTemplate(plugin, {
    templateId: 's12-template',
    name: 'S12 Template',
    rules: simpleDesignRules(),
    overwrite: true,
  });
  const exported = await exportNoteDesignTemplate(plugin, { templateId: 's12-template' });
  const imported = await importNoteDesignTemplate(plugin, {
    templateJson: exported.templateJson,
    overwrite: true,
  });
  assert(imported.roundTripEqual, 'S12 design template import/export should round-trip normalized equality.');
  assert(imported.normalizedTemplateHash === exported.normalizedTemplateHash, 'S12 design template hash should match after import.');

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
