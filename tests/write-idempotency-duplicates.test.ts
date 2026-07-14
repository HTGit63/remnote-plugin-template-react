import { beforeEach, describe, expect, test } from 'vitest';
import {
  APPEND_RESULT_CACHE,
  CREATE_DOCUMENT_RESULT_CACHE,
  CREATE_REM_RESULT_CACHE,
  FLASHCARD_RESULT_CACHE,
  MARKDOWN_IMPORT_RESULT_CACHE,
  UPDATE_RICH_RESULT_CACHE,
} from '../src/remnote/write/writeCaches';
import { createRemFromMarkdown } from '../src/remnote/write/basicWrites';
import {
  appendMarkdownAsRemTree,
  createOrReplaceNoteFromMarkdown,
} from '../src/remnote/write/markdownImportExecutor';
import {
  createBasicFlashcard,
  createClozeCard,
  createListAnswerCard,
  createMultipleChoiceCard,
} from '../src/remnote/write/cardWrites';
import { verifyCardSet } from '../src/remnote/write/designedNoteTools';
import { FakePlugin } from './helpers/fakeRemnote';

beforeEach(() => {
  CREATE_REM_RESULT_CACHE.clear();
  CREATE_DOCUMENT_RESULT_CACHE.clear();
  APPEND_RESULT_CACHE.clear();
  UPDATE_RICH_RESULT_CACHE.clear();
  FLASHCARD_RESULT_CACHE.clear();
  MARKDOWN_IMPORT_RESULT_CACHE.clear();
});

async function plainTreeAsync(fake: FakePlugin, remId: string): Promise<string[]> {
  const rem = fake.rems.get(remId);
  if (!rem) {
    return [];
  }
  return [
    await fake.richText.toString(rem.text),
    ...(await Promise.all(rem.children.map((childId) => plainTreeAsync(fake, childId)))).flat(),
  ].filter(Boolean);
}

describe('write idempotency and duplicate protection', () => {
  test('create_rem same-key replay reports already_applied and creates no duplicate sibling', async () => {
    const fake = new FakePlugin();
    const parent = fake.addRem('parent', 'Plugin Test');

    const first = await createRemFromMarkdown(fake.asPlugin(), {
      parentId: parent._id,
      markdown: 'Stable child',
      idempotencyKey: 'idem:create-rem',
    });
    const second = await createRemFromMarkdown(fake.asPlugin(), {
      parentId: parent._id,
      markdown: 'Stable child',
      idempotencyKey: 'idem:create-rem',
    });

    expect(second.createdRemId).toBe(first.createdRemId);
    expect(second.status).toBe('already_applied');
    expect(parent.children).toEqual([first.createdRemId]);
    expect(fake.createRemCount).toBe(1);
  });

  test('create_rem different key refuses same title under same parent before write', async () => {
    const fake = new FakePlugin();
    const parent = fake.addRem('parent', 'Plugin Test');

    await createRemFromMarkdown(fake.asPlugin(), {
      parentId: parent._id,
      markdown: 'Duplicate title',
      idempotencyKey: 'idem:first',
    });

    await expect(
      createRemFromMarkdown(fake.asPlugin(), {
        parentId: parent._id,
        markdown: 'Duplicate title',
        idempotencyKey: 'idem:second',
      })
    ).rejects.toMatchObject({
      code: 'INVALID_ARGS',
      details: expect.objectContaining({
        duplicateBehavior: 'refused_same_title_same_parent_different_key',
      }),
    });
    expect(parent.children).toHaveLength(1);
    expect(fake.createRemCount).toBe(1);
  });

  test('markdown content writer does not emit visible heading metadata Rems', async () => {
    const fake = new FakePlugin();
    fake.polluteFontSizeAsChildren = true;
    const parent = fake.addRem('parent', 'Plugin Test');

    const result = await createOrReplaceNoteFromMarkdown(fake.asPlugin(), {
      parentRemId: parent._id,
      markdownText: [
        '# Tiny Markdown Write Test',
        '',
        '## Section A',
        '',
        'Formula: $A=Z+N$',
        '',
        '## Section B',
        '',
        'Formula: $qV=\\frac{1}{2}mv^2$',
      ].join('\n'),
      mode: 'create_child',
      duplicatePolicy: 'create_new',
      safetyOptions: {
        verifyAfterWrite: true,
        rollbackOnFailure: true,
        idempotencyKey: 'idem:markdown-no-heading-pollution',
      },
    });

    expect(result.verification?.passed).toBe(true);
    expect(result.verification).toMatchObject({
      verificationScope: 'semantic_content_math_and_order',
      requestedHeadingCount: 3,
      nativeHeadingCount: 0,
    });
    expect(result.warnings).toEqual(expect.arrayContaining([
      expect.stringMatching(/native heading properties are not written/i),
    ]));
    expect(fake.fontSizeCalls).toEqual([]);
    const visibleText = (await plainTreeAsync(fake, result.rootRemId as string)).map((line) => line.trim());
    expect(visibleText).toEqual(expect.arrayContaining(['Tiny Markdown Write Test', 'Section A', 'Section B']));
    expect(visibleText).not.toEqual(expect.arrayContaining(['Size', 'H1', 'H2', 'H3', 'normal']));
  });

  test('bulk fragment mode appends sibling nodes without a visible chunk wrapper', async () => {
    const fake = new FakePlugin();
    const section = fake.addRem('fragment-section', '1.1 Atomic nuclei');

    const result = await createOrReplaceNoteFromMarkdown(fake.asPlugin(), {
      targetRemId: section._id,
      markdownText: ['- First sibling', '- Second sibling'].join('\n'),
      mode: 'append_children_to_target',
      duplicatePolicy: 'skip',
      safetyOptions: {
        verifyAfterWrite: true,
        rollbackOnFailure: true,
        idempotencyKey: 'idem:markdown-fragment-siblings',
      },
    });

    const childTexts = await Promise.all(
      section.children.map((childId) => fake.richText.toString(fake.rems.get(childId)?.text ?? []))
    );
    expect(result.rootRemId).toBe(section._id);
    expect(childTexts).toEqual(['First sibling', 'Second sibling']);
  });

  test('structured Markdown append places same-level headings as direct siblings', async () => {
    const fake = new FakePlugin();
    const target = fake.addRem('structured-append-target', 'Advanced');

    const result = await appendMarkdownAsRemTree(fake.asPlugin(), {
      targetRemId: target._id,
      markdownText: [
        '### 4.1 First extension',
        '',
        'First body.',
        '',
        '### 4.2 Second extension',
        '',
        'Second body.',
      ].join('\n'),
      remnoteLayout: { preserveBlankLines: false },
      safetyOptions: {
        verifyAfterWrite: true,
        rollbackOnFailure: true,
        idempotencyKey: 'idem:structured-append-sibling-headings',
      },
    });

    const childTexts = await Promise.all(
      target.children.map((childId) => fake.richText.toString(fake.rems.get(childId)?.text ?? []))
    );
    expect(result.status).toBe('appended');
    expect(childTexts).toEqual(['4.1 First extension', '4.2 Second extension']);
  });

  test('markdown readback rejects formulas flattened into plain text', async () => {
    const fake = new FakePlugin();
    fake.flattenMathToPlainText = true;
    const parent = fake.addRem('formula-parent', 'Formula parent');

    await expect(createOrReplaceNoteFromMarkdown(fake.asPlugin(), {
      parentRemId: parent._id,
      markdownText: [
        '# Formula Fidelity',
        '',
        '## Formula Section',
        '',
        'Inline formula: $E=mc^2$.',
        '',
        '$$',
        'F = ma',
        '$$',
      ].join('\n'),
      mode: 'create_child',
      duplicatePolicy: 'create_new',
      safetyOptions: {
        verifyAfterWrite: true,
        rollbackOnFailure: true,
        idempotencyKey: 'idem:flattened-formula-readback',
      },
    })).rejects.toMatchObject({
      code: 'PARTIAL_FAILURE',
      details: expect.objectContaining({
        originalDetails: expect.objectContaining({
          verification: expect.objectContaining({
            structureMismatches: expect.arrayContaining([
              expect.stringMatching(/math span count mismatch/i),
            ]),
          }),
        }),
      }),
    });
  });
});

describe('card lifecycle simulation', () => {
  test('card creation replay reports already_applied for all public card types', async () => {
    const fake = new FakePlugin();
    const parent = fake.addRem('cards-root', 'Cards root');

    const basic = await createBasicFlashcard(fake.asPlugin(), {
      parentId: parent._id,
      front: 'What is alpha decay?',
      back: 'Emission of an alpha particle.',
      idempotencyKey: 'idem:basic',
    });
    const basicReplay = await createBasicFlashcard(fake.asPlugin(), {
      parentId: parent._id,
      front: 'What is alpha decay?',
      back: 'Emission of an alpha particle.',
      idempotencyKey: 'idem:basic',
    });

    const cloze = await createClozeCard(fake.asPlugin(), {
      parentId: parent._id,
      text: 'The nucleus contains {{protons}} and neutrons.',
      clozeText: 'protons',
      idempotencyKey: 'idem:cloze',
    });
    const clozeReplay = await createClozeCard(fake.asPlugin(), {
      parentId: parent._id,
      text: 'The nucleus contains {{protons}} and neutrons.',
      clozeText: 'protons',
      idempotencyKey: 'idem:cloze',
    });

    const multipleChoice = await createMultipleChoiceCard(fake.asPlugin(), {
      parentId: parent._id,
      question: 'Which radiation is helium nucleus?',
      choices: ['alpha', 'beta', 'gamma'],
      correctChoice: 'alpha',
      idempotencyKey: 'idem:mcq',
    });
    const multipleChoiceReplay = await createMultipleChoiceCard(fake.asPlugin(), {
      parentId: parent._id,
      question: 'Which radiation is helium nucleus?',
      choices: ['alpha', 'beta', 'gamma'],
      correctChoice: 'alpha',
      idempotencyKey: 'idem:mcq',
    });

    const listAnswer = await createListAnswerCard(fake.asPlugin(), {
      parentId: parent._id,
      prompt: 'List three ionizing radiations.',
      items: ['alpha', 'beta', 'gamma'],
      idempotencyKey: 'idem:list',
    });
    const listAnswerReplay = await createListAnswerCard(fake.asPlugin(), {
      parentId: parent._id,
      prompt: 'List three ionizing radiations.',
      items: ['alpha', 'beta', 'gamma'],
      idempotencyKey: 'idem:list',
    });

    expect([basicReplay, clozeReplay, multipleChoiceReplay, listAnswerReplay].map((result) => result.status)).toEqual([
      'already_applied',
      'already_applied',
      'already_applied',
      'already_applied',
    ]);
    expect(new Set([basic.createdRemId, cloze.createdRemId, multipleChoice.createdRemId, listAnswer.createdRemId]).size).toBe(4);
    expect(parent.children).toHaveLength(4);
    expect(cloze.verification?.passed).toBe(true);
    expect(multipleChoice.verification?.passed).toBe(true);
    expect(listAnswer.verification?.passed).toBe(true);
    expect(fake.rems.get(multipleChoice.createdRemId)?.backText).toEqual([]);
    expect(fake.rems.get(listAnswer.createdRemId)?.backText).toEqual([]);
  });

  test('verify_card_set detects created card types and stays bounded', async () => {
    const fake = new FakePlugin();
    const parent = fake.addRem('cards-root', 'Cards root');
    await createBasicFlashcard(fake.asPlugin(), {
      parentId: parent._id,
      front: 'Basic front',
      back: 'Basic back',
      idempotencyKey: 'idem:verify-basic',
    });
    await createMultipleChoiceCard(fake.asPlugin(), {
      parentId: parent._id,
      question: 'MCQ front',
      choices: ['one', 'two'],
      correctChoice: 'one',
      idempotencyKey: 'idem:verify-mcq',
    });
    await createListAnswerCard(fake.asPlugin(), {
      parentId: parent._id,
      prompt: 'List front',
      items: ['one', 'two'],
      idempotencyKey: 'idem:verify-list',
    });

    const result = await verifyCardSet(fake.asPlugin(), {
      rootRemId: parent._id,
      maxDepth: 4,
      timeoutMs: 1000,
    });

    expect(result.ok).toBe(true);
    expect(result.status).toBe('verified');
    expect(result.truncated).toBe(false);
    expect(result.cardCount).toBe(3);
    expect(result.cards.map((card) => card.cardType).sort()).toEqual(['basic', 'list_answer', 'multiple_choice']);
  });
});
