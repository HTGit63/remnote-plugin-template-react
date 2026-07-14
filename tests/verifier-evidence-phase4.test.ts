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
});
