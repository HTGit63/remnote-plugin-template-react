import { beforeEach, describe, expect, test } from 'vitest';
import {
  APPEND_RESULT_CACHE,
  CREATE_DOCUMENT_RESULT_CACHE,
  CREATE_REM_RESULT_CACHE,
  FLASHCARD_RESULT_CACHE,
  UPDATE_RICH_RESULT_CACHE,
} from '../src/remnote/write/writeCaches';
import { createRemFromMarkdown } from '../src/remnote/write/basicWrites';
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
});

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
