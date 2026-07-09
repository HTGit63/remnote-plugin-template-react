import { beforeEach, describe, expect, test } from 'vitest';
import { createOrReplaceNoteFromMarkdown } from '../src/remnote/write/markdownImportExecutor';
import { createCardSetFromNote, verifyCardSet } from '../src/remnote/write/designedNoteTools';
import {
  FLASHCARD_RESULT_CACHE,
  MARKDOWN_IMPORT_RESULT_CACHE,
} from '../src/remnote/write/writeCaches';
import { FakePlugin } from './helpers/fakeRemnote';

beforeEach(() => {
  FLASHCARD_RESULT_CACHE.clear();
  MARKDOWN_IMPORT_RESULT_CACHE.clear();
});

describe('verifyCardSet', () => {
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
