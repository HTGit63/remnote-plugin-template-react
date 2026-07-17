import { beforeEach, describe, expect, test } from 'vitest';
import type { NoteDesignRules } from '../shared/bridge/protocol';
import { successToToolResult } from '../server/src/tools/tool-context';
import {
  defaultNoteDesignRules,
  saveNoteDesignTemplate,
} from '../src/remnote/templates/designTemplates';
import {
  createDesignedNoteTree,
  verifyCardSet,
  verifyNoteAgainstDesign,
} from '../src/remnote/write/designedNoteTools';
import {
  createBasicFlashcard,
  createListAnswerCard,
  createMultipleChoiceCard,
} from '../src/remnote/write/cardWrites';
import { FLASHCARD_RESULT_CACHE, POLISHED_TREE_RESULT_CACHE } from '../src/remnote/write/writeCaches';
import { FakePlugin, FakeRem } from './helpers/fakeRemnote';

function installLocalStorage(fake: FakePlugin) {
  const values = new Map<string, unknown>();
  (fake as unknown as { storage: unknown }).storage = {
    getLocal: async <T>(key: string) => structuredClone(values.get(key)) as T | undefined,
    setLocal: async (key: string, value: unknown) => {
      values.set(key, structuredClone(value));
    },
  };
  return values;
}

async function findByText(fake: FakePlugin, text: string): Promise<FakeRem> {
  for (const rem of fake.rems.values()) {
    if ((await fake.richText.toString(rem.text)) === text) return rem;
  }
  throw new Error(`Missing Rem: ${text}`);
}

beforeEach(() => {
  FLASHCARD_RESULT_CACHE.clear();
  POLISHED_TREE_RESULT_CACHE.clear();
});

describe('Phase 4 verifier evidence routing', () => {
  test('literal cloze syntax is advisory and not a functional card without metadata', async () => {
    const fake = new FakePlugin();
    const root = fake.addRem('literal-root', 'Literal examples');
    const literal = fake.addRem('literal-child', 'Template syntax: {{term::hint}}');
    await literal.setParent(root);

    const result = await verifyCardSet(fake.asPlugin(), { rootRemId: root._id });

    expect(result.ok).toBe(true);
    expect(result.cardCount).toBe(0);
    expect(result.malformedCards).toBeUndefined();
    expect(result.advisoryFindings).toEqual([
      expect.objectContaining({
        remId: literal._id,
        evidenceMethod: 'generic_heuristic',
        message: expect.stringMatching(/literal cloze syntax/i),
      }),
    ]);
  });

  test('organizational heading is not malformed from practice default alone', async () => {
    const fake = new FakePlugin();
    const root = fake.addRem('heading-root', 'Cards');
    const heading = fake.addRem('heading-child', 'Multiple Choice Cards');
    heading.fontSize = 'H3';
    await heading.setEnablePractice(true);
    await heading.setParent(root);

    const result = await verifyCardSet(fake.asPlugin(), { rootRemId: root._id });

    expect(result.ok).toBe(true);
    expect(result.cardCount).toBe(0);
    expect(result.malformedCards).toBeUndefined();
    expect(result.advisoryFindings).toEqual([
      expect.objectContaining({ remId: heading._id, evidenceMethod: 'live_property_readback' }),
    ]);
  });

  test('direct metadata verifies all specialized card storage forms', async () => {
    const fake = new FakePlugin();
    const root = fake.addRem('family-root', 'Families');
    await createBasicFlashcard(fake.asPlugin(), {
      parentId: root._id,
      front: 'Concept front',
      back: 'Concept back',
      idempotencyKey: 'phase4-concept',
    }, 'concept', 'concept');
    await createBasicFlashcard(fake.asPlugin(), {
      parentId: root._id,
      front: 'Descriptor front',
      back: 'Descriptor back',
      idempotencyKey: 'phase4-descriptor',
    }, 'descriptor', 'descriptor');
    await createMultipleChoiceCard(fake.asPlugin(), {
      parentId: root._id,
      question: 'MCQ front',
      choices: ['A', 'B'],
      correctChoice: 'B',
      idempotencyKey: 'phase4-mcq',
    });
    await createListAnswerCard(fake.asPlugin(), {
      parentId: root._id,
      prompt: 'List front',
      items: ['One', 'Two'],
      idempotencyKey: 'phase4-list',
    });

    const result = await verifyCardSet(fake.asPlugin(), { rootRemId: root._id, maxDepth: 3 });

    expect(result.ok).toBe(true);
    expect(result.cards.map((card) => card.cardType).sort()).toEqual([
      'concept', 'descriptor', 'list_answer', 'multiple_choice',
    ]);
    expect(result.cards).toEqual(expect.arrayContaining([
      expect.objectContaining({ evidenceMethod: 'live_property_readback', sourceRemId: expect.any(String) }),
    ]));
    expect(result.verificationMode).toBe('live_property_readback');
    expect(result.verification).toEqual({
      attempted: true,
      passed: true,
      method: 'live_property_readback',
      warnings: [],
    });
  });

  test('saved applied manifest drives read-only non-heading design verification', async () => {
    const fake = new FakePlugin();
    const storage = installLocalStorage(fake);
    const parent = fake.addRem('design-parent', 'Design parent');
    const rules: NoteDesignRules = {
      ...defaultNoteDesignRules(),
      headingPattern: {
        rootHeadingLevel: 'normal',
        sectionHeadingLevel: 'normal',
        headingCounts: {},
        directChildHeadingCounts: {},
      },
      roleRules: {
        keyIdea: { prefixStyle: { bold: true, highlight: 'yellow' } },
      },
    };
    const saved = await saveNoteDesignTemplate(fake.asPlugin(), {
      templateId: 'phase4-design',
      name: 'Phase 4 design',
      rules,
    });
    const created = await createDesignedNoteTree(fake.asPlugin(), {
      parentId: parent._id,
      title: 'Manifest target',
      content: '## Section\n\n- Key idea: Exact metadata wins.',
      templateId: saved.template.templateId,
      idempotencyKey: 'phase4-design-create',
    });
    const keyIdea = await findByText(fake, 'Key idea: Exact metadata wins.');
    await keyIdea.setText([{ i: 'm', text: 'Key idea: Exact metadata wins.' }] as never);
    const beforeStorage = JSON.stringify(Array.from(storage.entries()));
    const beforeTree = JSON.stringify(Array.from(fake.rems.entries()).map(([id, rem]) => [id, rem.text, rem.children]));

    const result = await verifyNoteAgainstDesign(fake.asPlugin(), {
      rootRemId: created.rootRemId as string,
      templateId: saved.template.templateId,
    });

    expect(result.ok).toBe(false);
    expect(result.evidenceMode).toBe('exact_manifest');
    expect(result.verification).toMatchObject({
      attempted: true,
      passed: false,
      method: 'exact_manifest',
    });
    expect(result.checkedRemIds).toContain(keyIdea._id);
    expect(result.mismatches).toEqual(expect.arrayContaining([
      expect.objectContaining({
        remId: keyIdea._id,
        type: 'designRule',
        property: 'role.keyIdea',
        evidenceMethod: 'live_property_readback',
        expected: rules.roleRules?.keyIdea,
        safeNextStep: expect.stringMatching(/repair_note_design/i),
      }),
    ]));
    expect(JSON.stringify(Array.from(storage.entries()))).toBe(beforeStorage);
    expect(JSON.stringify(Array.from(fake.rems.entries()).map(([id, rem]) => [id, rem.text, rem.children]))).toBe(beforeTree);
  });

  test('exact applied-manifest verification does not add generic preset assumptions', async () => {
    const fake = new FakePlugin();
    installLocalStorage(fake);
    const parent = fake.addRem('exact-design-parent', 'Exact design parent');
    const rules: NoteDesignRules = {
      ...defaultNoteDesignRules('clean_academic'),
      headingPattern: {
        rootHeadingLevel: 'normal',
        sectionHeadingLevel: 'normal',
        headingCounts: {},
        directChildHeadingCounts: {},
      },
      spacingPattern: {
        spacerCount: 0,
        spacerTexts: [],
        blankRemCount: 0,
        siblingSpacerLikely: false,
      },
      roleRules: {
        keyIdea: { prefixStyle: { bold: true, highlight: 'yellow' } },
      },
    };
    const saved = await saveNoteDesignTemplate(fake.asPlugin(), {
      templateId: 'exact-no-generic-preset',
      name: 'Exact no generic preset',
      rules,
    });
    const created = await createDesignedNoteTree(fake.asPlugin(), {
      parentId: parent._id,
      title: 'Exact target',
      content: '## Section\n\n- Key idea: Exact metadata is sufficient.',
      templateId: saved.template.templateId,
      idempotencyKey: 'phase4-exact-no-generic',
    });

    const result = await verifyNoteAgainstDesign(fake.asPlugin(), {
      rootRemId: created.rootRemId as string,
      templateId: saved.template.templateId,
    });

    expect(result.evidenceMode).toBe('exact_manifest');
    expect(result.ok).toBe(true);
    expect(result.mismatches).toEqual([]);
  });

  test('inner failure cannot retain outer success envelope', () => {
    const result = successToToolResult({
      id: 'phase4-envelope',
      ok: true,
      result: { ok: false, status: 'verified', issues: ['exact failure'] },
    } as never, 'Verification processed.');

    expect(result.isError).toBe(true);
    expect(result.structuredContent).toMatchObject({
      ok: false,
      status: 'FAIL',
      operationId: 'phase4-envelope',
      standard: { status: 'FAIL' },
    });
  });

  test('failed verification cannot retain an outer PASS envelope', () => {
    const result = successToToolResult({
      id: 'phase4-verification-envelope',
      ok: true,
      result: {
        ok: true,
        status: 'repaired',
        verification: { attempted: true, passed: false, method: 'live_property_readback' },
      },
    } as never, 'Repair processed.');

    expect(result.isError).toBe(true);
    expect(result.structuredContent).toMatchObject({
      ok: false,
      status: 'FAIL',
      verification: { attempted: true, passed: false },
      standard: { status: 'FAIL' },
    });
  });

  test('partial execution keeps structured evidence visible to the MCP client', () => {
    const result = successToToolResult({
      id: 'phase4-partial-envelope',
      ok: true,
      result: {
        ok: false,
        status: 'partial',
        applied: [{ remId: 'styled-rem', property: 'bold' }],
        unsupported: [{ remId: 'heading-rem', property: 'headingLevel' }],
        warnings: ['One requested mutation is unsupported.'],
      },
    } as never, 'Style plan processed.');

    expect(result.isError).toBeUndefined();
    expect(result.structuredContent).toMatchObject({
      ok: false,
      status: 'PARTIAL',
      result: {
        applied: [{ remId: 'styled-rem', property: 'bold' }],
        unsupported: [{ remId: 'heading-rem', property: 'headingLevel' }],
      },
      standard: { status: 'PARTIAL' },
    });
  });

  test('dry-run results never claim mutation evidence', () => {
    const result = successToToolResult({
      id: 'phase4-dry-run-envelope',
      ok: true,
      result: {
        status: 'dry_run',
        dryRun: true,
        updatedRemId: 'preview-only-rem',
      },
    } as never, 'Update preview processed.');

    expect(result.structuredContent).toMatchObject({
      ok: true,
      status: 'PASS',
      updatedRemIds: [],
      counts: { updated: 0 },
      standard: {
        updatedRemIds: [],
        counts: { updated: 0 },
      },
    });
  });

  test('real move reports the moved Rem as updated evidence', () => {
    const result = successToToolResult({
      id: 'phase4-move-envelope',
      ok: true,
      result: {
        status: 'moved',
        movedRemId: 'moved-rem',
        beforeParentId: 'old-parent',
        afterParentId: 'new-parent',
      },
    } as never, 'Move processed.');

    expect(result.structuredContent).toMatchObject({
      updatedRemIds: ['moved-rem'],
      counts: { updated: 1 },
      standard: {
        updatedRemIds: ['moved-rem'],
        counts: { updated: 1 },
      },
    });
  });

  test('real reorder reports only children whose indexes changed', () => {
    const result = successToToolResult({
      id: 'phase4-reorder-envelope',
      ok: true,
      result: {
        status: 'reordered',
        beforeOrder: ['stable', 'second', 'third', 'fourth'],
        afterOrder: ['stable', 'third', 'second', 'fourth'],
      },
    } as never, 'Reorder processed.');

    expect(result.structuredContent).toMatchObject({
      updatedRemIds: ['third', 'second'],
      counts: { updated: 2 },
      standard: {
        updatedRemIds: ['third', 'second'],
        counts: { updated: 2 },
      },
    });
  });
});
