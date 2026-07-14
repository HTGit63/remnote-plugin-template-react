import { RemType } from '@remnote/plugin-sdk';
import { describe, expect, test } from 'vitest';
import type { NoteDesignRules, StyledRemTreeNode } from '../shared/bridge/protocol';
import {
  analyzeNoteDesign,
  defaultNoteDesignRules,
  exportNoteDesignTemplate,
  importNoteDesignTemplate,
  previewNoteDesignPlan,
  saveNoteDesignTemplate,
} from '../src/remnote/templates/designTemplates';
import { createDesignedNoteTree } from '../src/remnote/write/designedNoteTools';
import { FakePlugin, FakeRem } from './helpers/fakeRemnote';

function installLocalStorage(fake: FakePlugin) {
  const values = new Map<string, unknown>();
  (fake as unknown as { storage: unknown }).storage = {
    getLocal: async <T>(key: string) => values.get(key) as T | undefined,
    setLocal: async (key: string, value: unknown) => {
      values.set(key, structuredClone(value));
    },
  };
  return values;
}

async function plain(fake: FakePlugin, rem: FakeRem): Promise<string> {
  return fake.richText.toString(rem.text);
}

async function findByText(fake: FakePlugin, text: string): Promise<FakeRem> {
  for (const rem of fake.rems.values()) {
    if ((await plain(fake, rem)) === text) {
      return rem;
    }
  }
  throw new Error(`Missing Rem with text: ${text}`);
}

function roleRules(): NoteDesignRules {
  return {
    ...defaultNoteDesignRules('clean_academic'),
    headingPattern: {
      rootHeadingLevel: 'H1',
      sectionHeadingLevel: 'H3',
      headingCounts: {},
      directChildHeadingCounts: {},
    },
    spacingPattern: {
      spacerCount: 1,
      spacerTexts: ['\u200b'],
      blankRemCount: 0,
      siblingSpacerLikely: true,
    },
    roleRules: {
      root: { remStyle: { hideBullet: true } },
      section: {
        remStyle: { hideBullet: true },
        fullTextStyle: { color: 'blue' },
      },
      keyIdea: { prefixStyle: { bold: true, highlight: 'yellow' } },
      formula: { fullTextStyle: { highlight: 'blue' } },
      workedExample: { fullTextStyle: { color: 'blue' } },
      answer: { fullTextStyle: { highlight: 'green' } },
      warning: { prefixStyle: { bold: true, color: 'red' } },
      concept: { remStyle: { remType: 'concept' } },
      descriptor: { remStyle: { remType: 'descriptor' } },
    },
  } as NoteDesignRules;
}

const DESIGNED_MARKDOWN = `# Designed Lesson

## 1. Key Concepts

- Key idea: Equilibrium is dynamic.

## 2. Key Formula

- Kc=[C]/[A]

## 3. Worked Example

### Answer

- Kc≈2.96

## 4. Common Pitfall

- Warning: Use equilibrium concentrations.

## 5. Review Cards

- Dynamic equilibrium
  - Forward and reverse rates are equal.`;

describe('Phase 3 design-template identity and compiler', () => {
  test('analyzes only the explicit source and rejects ambiguous or missing identity', async () => {
    const fake = new FakePlugin();
    const focused = fake.addRem('focused-wrong', 'Focused wrong source');
    const requested = fake.addRem('requested-source', 'Requested source');
    (fake.focus as { getFocusedRem: () => Promise<unknown> }).getFocusedRem = async () => focused;

    const before = JSON.stringify({ text: requested.text, children: requested.children });
    const result = await analyzeNoteDesign(fake.asPlugin(), { sampleRemId: requested._id });

    expect(result.sourceRemId).toBe(requested._id);
    expect(result.sourceIdentity).toEqual({
      requestedSourceRemId: requested._id,
      resolvedSourceRemId: requested._id,
      sourceField: 'sampleRemId',
    });
    expect(JSON.stringify({ text: requested.text, children: requested.children })).toBe(before);

    await expect(analyzeNoteDesign(fake.asPlugin(), {
      rootRemId: requested._id,
      sampleRemId: focused._id,
    })).rejects.toMatchObject({ code: 'INVALID_ARGS' });
    await expect(analyzeNoteDesign(fake.asPlugin(), {})).rejects.toMatchObject({ code: 'INVALID_ARGS' });
  });

  test('extracts reusable role treatments without embedding source Rem IDs', async () => {
    const fake = new FakePlugin();
    const root = fake.addRem('source-root', 'Reference Design');
    const section = fake.addRem('source-section', '1. Key Concepts');
    section.text = [{ i: 'm', text: '1. Key Concepts', tc: 6 }] as never;
    const spacer = fake.addRem('source-spacer', '\u200b');
    const keyIdea = fake.addRem('source-key', 'Key idea: Source-specific sentence.');
    keyIdea.text = [
      { i: 'm', text: 'Key idea:', b: true, h: 3 },
      { i: 'm', text: ' Source-specific sentence.' },
    ] as never;
    const concept = fake.addRem('source-concept', 'Source-only concept');
    const descriptor = fake.addRem('source-descriptor', 'Source-only definition');
    const formula = fake.addRem('source-formula', 'N=N₀e^(-λt)');
    formula.text = [{ i: 'm', text: 'N=N₀e^(-λt)', h: 6 }] as never;
    (concept as unknown as { getType: () => Promise<RemType> }).getType = async () => RemType.CONCEPT;
    (descriptor as unknown as { getType: () => Promise<RemType> }).getType = async () => RemType.DESCRIPTOR;
    await section.setParent(root);
    await keyIdea.setParent(section);
    await spacer.setParent(root);
    await concept.setParent(root);
    await descriptor.setParent(concept);
    await formula.setParent(root);

    const result = await analyzeNoteDesign(fake.asPlugin(), { rootRemId: root._id });
    const serialized = JSON.stringify(result.rules);

    expect(result.rules.roleRules?.section?.fullTextStyle?.color).toBe('blue');
    expect(result.rules.roleRules?.keyIdea?.prefixStyle).toMatchObject({ bold: true, highlight: 'yellow' });
    expect(result.rules.roleRules?.concept?.remStyle?.remType).toBe('concept');
    expect(result.rules.roleRules?.descriptor?.remStyle?.remType).toBe('descriptor');
    expect(result.rules.roleRules?.formula?.fullTextStyle?.highlight).toBe('blue');
    expect(result.rules.formulaPlacement.displayFormulasAsSeparateRems).toBe(true);
    expect(result.rules.cardStyle.cardLikeRemCount).toBe(1);
    expect(result.rules.spacingPattern).toMatchObject({ spacerCount: 1, siblingSpacerLikely: true });
    expect(serialized).not.toContain(root._id);
    expect(serialized).not.toContain(keyIdea._id);
    expect(serialized).not.toContain('Source-specific sentence');
  });

  test('learns warning, answer, and math-node treatments from reusable role labels', async () => {
    const fake = new FakePlugin();
    const root = fake.addRem('role-source-root', 'Reusable treatment source');
    const warning = fake.addRem('role-source-warning', 'Warning treatment');
    warning.text = [{ i: 'm', text: 'Warning treatment', h: 3 }] as never;
    const answer = fake.addRem('role-source-answer', 'Answer treatment');
    answer.text = [{ i: 'm', text: 'Answer treatment', h: 4 }] as never;
    const formula = fake.addRem('role-source-formula', 'Formula E=mc^2');
    formula.text = [
      { i: 'm', text: 'Formula ' },
      { i: 'x', text: 'E=mc^2', block: false, tc: 6 },
    ] as never;
    await warning.setParent(root);
    await answer.setParent(root);
    await formula.setParent(root);

    const analyzed = await analyzeNoteDesign(fake.asPlugin(), { rootRemId: root._id });

    expect(analyzed.rules.roleRules?.warning?.fullTextStyle).toMatchObject({ highlight: 'yellow' });
    expect(analyzed.rules.roleRules?.answer?.fullTextStyle).toMatchObject({ highlight: 'green' });
    expect(analyzed.rules.roleRules?.formula?.mathStyle).toMatchObject({ color: 'blue' });

    installLocalStorage(fake);
    const targetParent = fake.addRem('role-target-parent', 'Role target parent');
    const saved = await saveNoteDesignTemplate(fake.asPlugin(), {
      templateId: 'learned-role-template',
      name: 'Learned role template',
      rules: analyzed.rules,
    });
    const created = await createDesignedNoteTree(fake.asPlugin(), {
      parentId: targetParent._id,
      title: 'Role target',
      content: '## Warning treatment\n\nWarning body.\n\n## Answer treatment\n\nAnswer body.\n\n## Formula treatment\n\n$$E=mc^2$$',
      templateId: saved.template.templateId,
      writingMode: 'markdown',
      verifyAfterWrite: true,
      idempotencyKey: 'learned-role-target',
    });
    expect(created.materializationEvidence).toEqual(expect.arrayContaining([
      expect.objectContaining({ ruleId: 'role.warning', status: 'verified' }),
      expect.objectContaining({ ruleId: 'role.answer', status: 'verified' }),
      expect.objectContaining({ ruleId: 'role.formula', status: 'verified' }),
    ]));
    const targetFormula = await findByText(fake, 'E=mc^2');
    expect(targetFormula.text).toEqual(expect.arrayContaining([
      expect.objectContaining({ i: 'x', text: 'E=mc^2', tc: 6 }),
    ]));
  });

  test('promotes a leading H1 body wrapper beneath the explicit designed-note title', async () => {
    const fake = new FakePlugin();
    installLocalStorage(fake);
    const parent = fake.addRem('wrapper-parent', 'Wrapper parent');

    const created = await createDesignedNoteTree(fake.asPlugin(), {
      parentId: parent._id,
      title: 'Explicit root title',
      content: '# Source body title\n\n## Section\n\nBody.',
      writingMode: 'markdown',
      verifyAfterWrite: true,
      idempotencyKey: 'phase3-leading-h1-wrapper',
    });
    const root = fake.rems.get(created.rootRemId as string) as FakeRem;
    const childTexts = await Promise.all(root.children.map((id) => plain(fake, fake.rems.get(id) as FakeRem)));

    expect(childTexts).toContain('Section');
    expect(childTexts).not.toContain('Source body title');
  });

  test('uses one deterministic manifest for preview, markdown creation, styled creation, and UI selection', async () => {
    const fake = new FakePlugin();
    const storage = installLocalStorage(fake);
    const directParent = fake.addRem('direct-parent', 'Direct Parent');
    const uiParent = fake.addRem('ui-parent', 'UI Parent');
    const styledParent = fake.addRem('styled-parent', 'Styled Parent');
    const rules = roleRules();
    const saved = await saveNoteDesignTemplate(fake.asPlugin(), {
      templateId: 'phase-3-template',
      name: 'Phase 3 Template',
      sourceRemId: 'reference-provenance-only',
      rules: {
        ...rules,
        expectedStyleMap: {
          'source-specific-rem-id': { headingLevel: 'H1' },
        },
      },
    });
    expect(saved.template.rules.expectedStyleMap).toBeUndefined();

    const directPreview = await previewNoteDesignPlan(fake.asPlugin(), {
      templateId: saved.template.templateId,
      parentId: directParent._id,
      title: 'Designed Lesson',
      content: DESIGNED_MARKDOWN,
      mode: 'create',
    });
    storage.set('bridge-selected-template-id', saved.template.templateId);
    const uiPreview = await previewNoteDesignPlan(fake.asPlugin(), {
      parentId: uiParent._id,
      title: 'Designed Lesson',
      content: DESIGNED_MARKDOWN,
      mode: 'create',
    });

    expect(uiPreview.templateId).toBe(saved.template.templateId);
    expect(uiPreview.compiledManifest).toEqual(directPreview.compiledManifest);
    expect(directPreview.compiledManifest.templateVersion).toBe(saved.template.version);
    expect(directPreview.compiledManifest.ruleResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: 'role.section', status: 'supported', matchedNodeCount: 5 }),
        expect.objectContaining({ ruleId: 'role.keyIdea', status: 'supported', matchedNodeCount: 1 }),
        expect.objectContaining({ ruleId: 'role.concept', status: 'supported', matchedNodeCount: 1 }),
        expect.objectContaining({ ruleId: 'role.descriptor', status: 'supported', matchedNodeCount: 1 }),
      ])
    );

    const directCreated = await createDesignedNoteTree(fake.asPlugin(), {
      parentId: directParent._id,
      title: 'Designed Lesson',
      content: DESIGNED_MARKDOWN,
      templateId: saved.template.templateId,
      writingMode: 'markdown',
      verifyAfterWrite: true,
      idempotencyKey: 'phase3-direct-create',
    });
    const uiCreated = await createDesignedNoteTree(fake.asPlugin(), {
      parentId: uiParent._id,
      title: 'Designed Lesson',
      content: DESIGNED_MARKDOWN,
      writingMode: 'markdown',
      verifyAfterWrite: true,
      idempotencyKey: 'phase3-ui-create',
    });
    const styledTree: StyledRemTreeNode = directPreview.compiledTree;
    const styledCreated = await createDesignedNoteTree(fake.asPlugin(), {
      parentId: styledParent._id,
      title: 'Designed Lesson',
      content: styledTree,
      templateId: saved.template.templateId,
      writingMode: 'styled_tree',
      verifyAfterWrite: true,
      idempotencyKey: 'phase3-styled-create',
    });
    const replay = await createDesignedNoteTree(fake.asPlugin(), {
      parentId: directParent._id,
      title: 'Designed Lesson',
      content: DESIGNED_MARKDOWN,
      templateId: saved.template.templateId,
      writingMode: 'markdown',
      verifyAfterWrite: true,
      idempotencyKey: 'phase3-direct-create',
    });

    expect(directParent.children).toHaveLength(1);
    expect(uiParent.children).toHaveLength(1);
    expect(styledParent.children).toHaveLength(1);
    expect(directCreated.templateId).toBe(saved.template.templateId);
    expect(replay.rootRemId).toBe(directCreated.rootRemId);
    expect(uiCreated.templateId).toBe(saved.template.templateId);
    expect(directCreated.compiledManifest).toEqual(uiCreated.compiledManifest);
    expect(styledCreated.compiledManifest.ruleResults).toEqual(directCreated.compiledManifest.ruleResults);
    expect(directCreated.materializationEvidence.filter((evidence) => evidence.status === 'failed')).toEqual([]);
    expect(directCreated.materializationEvidence).toEqual(expect.arrayContaining([
      expect.objectContaining({ ruleId: 'role.keyIdea', status: 'verified', targetRemIds: [expect.any(String)] }),
      expect.objectContaining({ ruleId: 'role.formula', status: 'verified', targetRemIds: [expect.any(String)] }),
      expect.objectContaining({ ruleId: 'role.concept', status: 'verified', targetRemIds: [expect.any(String)] }),
      expect.objectContaining({ ruleId: 'role.descriptor', status: 'verified', targetRemIds: [expect.any(String)] }),
    ]));

    const root = fake.rems.get(directCreated.rootRemId as string) as FakeRem;
    expect(await plain(fake, root)).toBe('Designed Lesson');
    const directChildTexts = await Promise.all(root.children.map((id) => plain(fake, fake.rems.get(id) as FakeRem)));
    expect(directChildTexts.filter((text) => text === 'Designed Lesson')).toHaveLength(0);
    expect(directChildTexts.filter((text) => text === '\u200b')).toHaveLength(4);

    const section = await findByText(fake, '1. Key Concepts');
    const keyIdea = await findByText(fake, 'Key idea: Equilibrium is dynamic.');
    const formula = await findByText(fake, 'Kc=[C]/[A]');
    const answer = await findByText(fake, 'Kc≈2.96');
    const warning = await findByText(fake, 'Warning: Use equilibrium concentrations.');
    expect(section.text).toEqual(expect.arrayContaining([expect.objectContaining({ tc: 6 })]));
    expect(keyIdea.text).toEqual(expect.arrayContaining([expect.objectContaining({ text: 'Key idea:', b: true, h: 3 })]));
    expect(formula.text).toEqual(expect.arrayContaining([expect.objectContaining({ h: 6 })]));
    expect(answer.text).toEqual(expect.arrayContaining([expect.objectContaining({ h: 4 })]));
    expect(warning.text).toEqual(expect.arrayContaining([expect.objectContaining({ text: 'Warning:', b: true, tc: 1 })]));
  });

  test('round-trips role rules and rejects stale versioned overwrites', async () => {
    const source = new FakePlugin();
    installLocalStorage(source);
    const initial = await saveNoteDesignTemplate(source.asPlugin(), {
      templateId: 'versioned-template',
      name: 'Versioned Template',
      sourceRemId: 'reference-only',
      rules: roleRules(),
    });
    const exported = await exportNoteDesignTemplate(source.asPlugin(), { templateId: initial.template.templateId });

    const destination = new FakePlugin();
    installLocalStorage(destination);
    const imported = await importNoteDesignTemplate(destination.asPlugin(), {
      templateJson: exported.templateJson,
    });
    expect(imported.roundTripEqual).toBe(true);
    expect(imported.template.rules.roleRules).toEqual(initial.template.rules.roleRules);

    await expect(saveNoteDesignTemplate(source.asPlugin(), {
      templateId: initial.template.templateId,
      name: 'Versioned Template',
      rules: roleRules(),
      overwrite: true,
      expectedVersion: initial.template.version + 1,
    })).rejects.toMatchObject({ code: 'STALE_STATE_CONFLICT' });
  });
});
