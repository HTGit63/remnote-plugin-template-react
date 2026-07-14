import { beforeEach, describe, expect, test } from 'vitest';
import { createOrReplaceNoteFromMarkdown } from '../src/remnote/write/markdownImportExecutor';
import {
  createCardSetFromNote,
  createFlashcardsFromMarkdown,
  verifyCardSet,
} from '../src/remnote/write/designedNoteTools';
import {
  FLASHCARD_RESULT_CACHE,
  MARKDOWN_IMPORT_RESULT_CACHE,
} from '../src/remnote/write/writeCaches';
import { createBasicFlashcard } from '../src/remnote/write/cardWrites';
import { FakePlugin } from './helpers/fakeRemnote';

beforeEach(() => {
  FLASHCARD_RESULT_CACHE.clear();
  MARKDOWN_IMPORT_RESULT_CACHE.clear();
});

describe('verifyCardSet', () => {
  test('marker both does not classify a cloze line as an extra basic card', async () => {
    const fake = new FakePlugin();
    const result = await createFlashcardsFromMarkdown(fake.asPlugin(), {
      parentId: 'unused-dry-run-parent',
      markdownText: [
        'What is alpha decay?::Emission of an alpha particle.',
        'The nucleus contains {{protons::positively charged particles}}.',
      ].join('\n'),
      marker: 'both',
      dryRun: true,
      maxCards: 10,
    });

    expect(result.cardCount).toBe(2);
    expect(result.cards.map((card) => card.cardType)).toEqual(['basic', 'cloze']);
    expect(result.cards.filter((card) => card.cardType === 'basic')).toEqual([
      expect.objectContaining({
        front: 'What is alpha decay?',
        back: 'Emission of an alpha particle.',
      }),
    ]);
  });

  test.each([
    ['double_colon', ['basic']],
    ['cloze', ['cloze']],
    ['both', ['basic', 'cloze']],
  ] as const)('marker %s emits only intended card types', async (marker, expectedTypes) => {
    const fake = new FakePlugin();
    const result = await createFlashcardsFromMarkdown(fake.asPlugin(), {
      parentId: 'unused-dry-run-parent',
      markdownText: [
        'Basic prompt::Basic answer',
        'Cloze prompt {{target::hint}}.',
      ].join('\n'),
      marker,
      dryRun: true,
      maxCards: 10,
    });

    expect(result.cards.map((card) => card.cardType)).toEqual(expectedTypes);
  });

  test('Markdown card retry keeps stable IDs and card count', async () => {
    const fake = new FakePlugin();
    const parent = fake.addRem('markdown-card-root', 'Markdown card root');
    const args = {
      parentId: parent._id,
      markdownText: [
        'Basic prompt::Basic answer',
        'Cloze prompt {{target::hint}}.',
      ].join('\n'),
      marker: 'both' as const,
      idempotencyKey: 'idem:markdown-card-set',
      maxCards: 10,
    };

    const first = await createFlashcardsFromMarkdown(fake.asPlugin(), args);
    const retry = await createFlashcardsFromMarkdown(fake.asPlugin(), args);

    expect(first.createdRemIds).toHaveLength(2);
    expect(retry.createdRemIds).toEqual(first.createdRemIds);
    expect(parent.children).toEqual(first.createdRemIds);
    expect(fake.createRemCount).toBe(2);
  });

  test('empty root returns quickly without traversal', async () => {
    const fake = new FakePlugin();
    const root = fake.addRem('empty-root', 'Empty root');
    const result = await verifyCardSet(fake.asPlugin(), {
      rootRemId: root._id,
      maxDepth: 5,
      timeoutMs: 1000,
    });

    expect(result.ok).toBe(true);
    expect(result.status).toBe('verified');
    expect(result.cardCount).toBe(0);
    expect(result.inspectedNodeCount).toBe(0);
    expect(result.warnings).toContain('No cards found under target root.');
  });

  test('reports malformed practice Rems with repair guidance', async () => {
    const fake = new FakePlugin();
    const root = fake.addRem('malformed-root', 'Malformed root');
    const malformed = fake.addRem('malformed-card', 'Practice without answer');
    await malformed.setParent(root);
    await malformed.setEnablePractice(true);
    await malformed.setType('concept');

    const result = await verifyCardSet(fake.asPlugin(), {
      rootRemId: root._id,
      maxDepth: 2,
      timeoutMs: 1000,
    });

    expect(result.ok).toBe(false);
    expect(result.malformedCards).toEqual([
      expect.objectContaining({
        remId: malformed._id,
        reason: expect.stringMatching(/practice enabled.*no back text or cloze/i),
      }),
    ]);
    expect(result.repairPlan).toEqual([
      expect.stringMatching(new RegExp(`Repair malformed card Rem ${malformed._id}`)),
    ]);
  });

  test('reports duplicate semantic cards with source Rem IDs', async () => {
    const fake = new FakePlugin();
    const root = fake.addRem('duplicate-root', 'Duplicate root');
    await createBasicFlashcard(fake.asPlugin(), {
      parentId: root._id,
      front: 'Duplicate front',
      back: 'Duplicate back',
      idempotencyKey: 'duplicate-card-a',
    });
    await createBasicFlashcard(fake.asPlugin(), {
      parentId: root._id,
      front: 'Duplicate front',
      back: 'Duplicate back',
      idempotencyKey: 'duplicate-card-b',
    });

    const result = await verifyCardSet(fake.asPlugin(), {
      rootRemId: root._id,
      maxDepth: 2,
      timeoutMs: 1000,
    });

    expect(result.ok).toBe(false);
    expect(result.duplicateCards).toEqual([
      expect.objectContaining({
        front: 'Duplicate front',
        sourceRemIds: expect.arrayContaining(result.cards.map((card) => card.sourceRemId)),
      }),
    ]);
    expect(result.repairPlan?.join(' ')).toMatch(/review duplicate basic card/i);
  });

  test('reports expected cards missing from an empty set', async () => {
    const fake = new FakePlugin();
    const root = fake.addRem('missing-root', 'Missing root');
    const expectedCard = {
      front: 'Missing front',
      back: 'Missing back',
      cardType: 'basic' as const,
    };

    const result = await verifyCardSet(fake.asPlugin(), {
      rootRemId: root._id,
      expectedCards: [expectedCard],
      maxDepth: 2,
      timeoutMs: 1000,
    });

    expect(result.ok).toBe(false);
    expect(result.missingCards).toEqual([expectedCard]);
    expect(result.repairPlan).toEqual(['Create missing basic card: Missing front']);
  });

  test('cards-after-note workflow keeps stable card count on retry', async () => {
    const fake = new FakePlugin();
    const sourceParent = fake.addRem('note-root', 'Note root');
    const cardParent = fake.addRem('card-output-root', 'Card output root');
    const note = await createOrReplaceNoteFromMarkdown(fake.asPlugin(), {
      parentRemId: sourceParent._id,
      markdownText: [
        '# Card Source Note',
        '',
        'Alpha decay:: emission of a helium nucleus',
        '',
        'Beta decay:: emission of an electron or positron',
      ].join('\n'),
      mode: 'create_child',
      duplicatePolicy: 'create_new',
      safetyOptions: {
        verifyAfterWrite: true,
        rollbackOnFailure: true,
        idempotencyKey: 'idem:card-source-note',
      },
    });

    const first = await createCardSetFromNote(fake.asPlugin(), {
      rootRemId: note.rootRemId as string,
      parentId: cardParent._id,
      maxCards: 5,
      direction: 'both',
      idempotencyKey: 'idem:cards-after-note',
    });
    const retry = await createCardSetFromNote(fake.asPlugin(), {
      rootRemId: note.rootRemId as string,
      parentId: cardParent._id,
      maxCards: 5,
      direction: 'both',
      idempotencyKey: 'idem:cards-after-note',
    });
    const verification = await verifyCardSet(fake.asPlugin(), {
      rootRemId: cardParent._id,
      maxDepth: 3,
      timeoutMs: 1000,
    });

    expect(first.ok).toBe(true);
    expect(first.cardCount).toBe(2);
    expect(retry.createdRemIds).toEqual(first.createdRemIds);
    expect(cardParent.children).toHaveLength(2);
    expect(verification.ok).toBe(true);
    expect(verification.cardCount).toBe(2);
    expect(verification.cards.map((card) => card.front).sort()).toEqual([
      'Alpha decay',
      'Beta decay',
    ]);
  });
});
