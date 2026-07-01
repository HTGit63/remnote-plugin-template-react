import { RemType, SetRemType } from '@remnote/plugin-sdk';
import type { PluginRem as Rem, RichTextFormatName, RichTextInterface, RNPlugin } from '@remnote/plugin-sdk';
import type {
  ApplyRemnoteCommandArgs,
  ApplyRemnoteCommandResult,
  ApplyStylePlanArgs,
  ApplyStylePlanResult,
  ApplyStructuredNoteBatchArgs,
  ApplyStructuredNoteBatchResult,
  AppendToRemArgs,
  AppendToRemResult,
  BridgeErrorCode,
  ClearRemFormattingArgs,
  CreateDocumentArgs,
  CreateDocumentResult,
  CreateFlashcardArgs,
  CreateFlashcardResult,
  CreateFolderArgs,
  CreateFolderResult,
  CreateListAnswerCardArgs,
  CreateMultipleChoiceCardArgs,
  CreateOrReplaceNoteFromMarkdownArgs,
  CreateOrReplaceNoteFromMarkdownResult,
  CreatePolishedNoteTreeArgs,
  CreatePolishedNoteTreeResult,
  CreateRemTreeArgs,
  CreateRemTreeNode,
  CreateRemTreeResult,
  CreateRemArgs,
  CreateRemResult,
  CreateClozeCardArgs,
  CreateStyledRemTreeArgs,
  CreateStyledRemTreeResult,
  DeletePreview,
  DeleteRemByIdArgs,
  DeleteRemByIdResult,
  DeleteRemByIdTarget,
  ExpectedStyleMapEntry,
  FormatRemResult,
  MoveRemArgs,
  MoveRemResult,
  PracticeDirection,
  ReplaceRemArgs,
  ReplaceRemResult,
  ReorderChildrenArgs,
  ReorderChildrenResult,
  RemColorName,
  RemnoteCommandName,
  RemHeadingLevel,
  RemStyleInput,
  RemTypeName,
  RichTextSpanInput,
  SetHideBulletArgs,
  SetRemHeadingLevelArgs,
  SetRemHighlightColorArgs,
  SetRemTextColorArgs,
  SetRemTypeArgs,
  SetTextSpanColorArgs,
  SetTextSpanHighlightArgs,
  StyledRemTreeNode,
  StyledRemTreeNodeType,
  UpdateRemArgs,
  UpdateRemRichArgs,
  UpdateRemResult,
  VerifyNoteDesignArgs,
  VerifyNoteDesignResult,
} from '../../../shared/bridge/protocol';
import { getRemPlainText } from '../serialize';
import {
  RichTextFormattingError,
  applyClozeToRange,
  applyFormatsToRichTextRange,
  applyTextColorToAllText,
  applyTextColorToRange,
  applyTextHighlightToRange,
  normalizeHighlightColorTarget,
  normalizeTextColorTarget,
  RICH_TEXT_FONT_COLOR_FIELD,
  RICH_TEXT_HIGHLIGHT_FIELD,
  resolveRangeFromPlainText,
} from '../richTextFormatting';
import { RemnoteWriteError, mapFormattingError, runSdkOperation } from './writeErrors';
import { FLASHCARD_RESULT_CACHE, getWriteIdempotencyKey, rememberCachedResult, rememberCreatedRemIds } from './writeCaches';
import { buildRichTextFromSpans, createRemWithRichText, findRequiredRem, getFreshInsertIndex, getRemTypeValue } from './remnoteSdkHelpers';

export async function createFlashcardRem(
  plugin: RNPlugin,
  parent: Rem,
  index: number,
  cardType: CreateFlashcardResult['cardType'],
  front: string,
  back: string,
  direction: PracticeDirection = 'both',
  remType?: RemTypeName
): Promise<{ rem: Rem; childIds: string[] }> {
  const frontRichText = await buildRichTextFromSpans(plugin, [{ text: front }]);
  const backRichText = await buildRichTextFromSpans(plugin, [{ text: back }]);
  const rem = await createRemWithRichText(plugin, frontRichText, parent, index);
  const childIds: string[] = [];
  const usesCardItemChildren = cardType === 'multiple_choice' || cardType === 'list_answer';

  if (remType) {
    await runSdkOperation('rem.setType', () => rem.setType(getRemTypeValue(remType)));
  }

  if (!usesCardItemChildren) {
    await runSdkOperation('rem.setBackText', () => rem.setBackText(backRichText));
  }
  await runSdkOperation('rem.setEnablePractice', () => rem.setEnablePractice(true));
  await runSdkOperation('rem.setPracticeDirection', () => rem.setPracticeDirection(direction));

  if (usesCardItemChildren) {
    const choices = back
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
    for (let childIndex = 0; childIndex < choices.length; childIndex += 1) {
      const childText = await buildRichTextFromSpans(plugin, [{ text: choices[childIndex] }]);
      const child = await createRemWithRichText(plugin, childText, rem, childIndex);
      await runSdkOperation('rem.setIsCardItem', () => child.setIsCardItem(true));
      childIds.push(child._id);
    }
  }

  return { rem, childIds };
}

type CardCreationVerification = NonNullable<CreateFlashcardResult['verification']>;

function looseTextMatch(actual: string, expected: string | undefined): boolean {
  if (!expected) {
    return true;
  }
  const normalizedActual = actual.trim();
  const normalizedExpected = expected.trim();
  if (!normalizedActual) {
    return normalizedExpected.length === 0;
  }
  return (
    normalizedActual === normalizedExpected ||
    normalizedActual.includes(normalizedExpected) ||
    normalizedExpected.includes(normalizedActual)
  );
}

async function verifyCreatedFlashcard(
  plugin: RNPlugin,
  rem: Rem,
  expected: {
    front?: string;
    back?: string;
    childIds?: string[];
    cardType?: CreateFlashcardResult['cardType'];
  }
): Promise<CardCreationVerification> {
  const warnings: string[] = [];
  const readBack = await runSdkOperation('rem.findOne', () => plugin.rem.findOne(rem._id)).catch(() => undefined);
  if (!readBack) {
    warnings.push(`Created card Rem ${rem._id} was not found during read-back verification.`);
    return {
      attempted: true,
      passed: false,
      method: 'rem.findOne',
      warnings,
      after: {
        remId: rem._id,
        frontText: '',
        childIds: [],
      },
    };
  }

  const text = await getRemPlainText(plugin, readBack).catch(() => ({ frontText: '', backText: '', plainText: '' }));
  const practiceEnabled = await runSdkOperation('rem.getEnablePractice', () => readBack.getEnablePractice()).catch(() => undefined);
  const childIds = (await runSdkOperation('rem.getChildrenRem', () => readBack.getChildrenRem()).catch(() => []))
    .map((child) => child._id);
  const cardItemMode = expected.cardType === 'multiple_choice' || expected.cardType === 'list_answer';
  const expectedChildTexts = cardItemMode
    ? (expected.back ?? '').split('\n').map((item) => item.trim()).filter(Boolean)
    : [];
  const childTexts: string[] = [];
  if (cardItemMode && expectedChildTexts.length > 0) {
    const children = await runSdkOperation('rem.getChildrenRem', () => readBack.getChildrenRem()).catch(() => []);
    for (const child of children) {
      if (!(expected.childIds ?? []).includes(child._id)) {
        continue;
      }
      const childText = await getRemPlainText(plugin, child).catch(() => ({ frontText: '', backText: '', plainText: '' }));
      childTexts.push((childText.frontText || childText.plainText).trim());
    }
  }
  const frontMatches = looseTextMatch(text.frontText, expected.front);
  const backMatches = cardItemMode ? true : looseTextMatch(text.backText, expected.back);
  const childrenMatch = (expected.childIds ?? []).every((childId) => childIds.includes(childId));
  const childTextsMatch = expectedChildTexts.every((item) => childTexts.includes(item));
  if (!frontMatches) {
    warnings.push('Created card front text did not match requested front text.');
  }
  if (!backMatches) {
    warnings.push('Created card back text did not match requested back text.');
  }
  if (practiceEnabled !== true) {
    warnings.push('Created card did not read back with practice enabled.');
  }
  if (!childrenMatch) {
    warnings.push('Created card item children did not read back.');
  }
  if (cardItemMode && !childTextsMatch) {
    warnings.push('Created card item child text did not match requested card items.');
  }

  return {
    attempted: true,
    passed: frontMatches && backMatches && practiceEnabled === true && childrenMatch && childTextsMatch,
    method: 'rem.findOne/getRemPlainText/getEnablePractice/getChildrenRem',
    warnings,
    after: {
      remId: readBack._id,
      frontText: text.frontText,
      ...(text.backText ? { backText: text.backText } : {}),
      childIds,
      ...(childTexts.length ? { childTexts } : {}),
      practiceEnabled,
    },
  };
}

export async function createBasicFlashcard(
  plugin: RNPlugin,
  args: CreateFlashcardArgs,
  cardType: CreateFlashcardResult['cardType'] = 'basic',
  remType?: RemTypeName
): Promise<CreateFlashcardResult> {
  const idempotencyKey = getWriteIdempotencyKey(args.idempotencyKey, `card-${cardType}`);
  const cached = FLASHCARD_RESULT_CACHE.get(idempotencyKey);
  if (cached) {
    return {
      ...cached,
      status: 'already_applied',
    };
  }

  const parent = await findRequiredRem(plugin, args.parentId, 'Parent', 'PARENT_NOT_FOUND');
  const insertIndex = await getFreshInsertIndex(plugin, parent, 'end');
  const { rem, childIds } = await createFlashcardRem(
    plugin,
    parent,
    insertIndex,
    cardType,
    args.front,
    args.back,
    args.direction ?? 'both',
    remType
  );
  const verification: CardCreationVerification = (args.verifyAfterWrite ?? true)
    ? await verifyCreatedFlashcard(plugin, rem, { front: args.front, back: args.back, childIds, cardType })
    : { attempted: false, warnings: [] };

  const result: CreateFlashcardResult = {
    createdRemId: rem._id,
    parentId: parent._id,
    cardType,
    direction: args.direction ?? 'both',
    ok: verification.passed ?? true,
    ...(childIds.length ? { createdChildRemIds: childIds } : {}),
    status: 'created_flashcard',
    idempotencyKey,
    verification,
  };
  rememberCreatedRemIds([rem._id, ...childIds]);
  rememberCachedResult(FLASHCARD_RESULT_CACHE, idempotencyKey, result);
  return result;
}

export async function createClozeCard(
  plugin: RNPlugin,
  args: CreateClozeCardArgs
): Promise<CreateFlashcardResult> {
  const idempotencyKey = getWriteIdempotencyKey(args.idempotencyKey, 'card-cloze');
  const cached = FLASHCARD_RESULT_CACHE.get(idempotencyKey);
  if (cached) {
    return {
      ...cached,
      status: 'already_applied',
    };
  }

  const parent = await findRequiredRem(plugin, args.parentId, 'Parent', 'PARENT_NOT_FOUND');
  const insertIndex = await getFreshInsertIndex(plugin, parent, 'end');
  const normalized = normalizeClozeInput(args.text, args.clozeText);
  const plainText = normalized.plainText;
  let start = normalized.start;
  let end = normalized.end;

  if (start < 0) {
    if (args.clozeText) {
      throw new RemnoteWriteError('INVALID_ARGS', 'clozeText was not found in text.', {
        clozeText: args.clozeText,
      });
    }

    const match = /\{\{(.+?)\}\}/.exec(plainText);
    if (match?.index !== undefined) {
      start = match.index;
      end = match.index + match[0].length;
    } else {
      start = 0;
      end = plainText.length;
    }
  }

  const baseRichText = await buildRichTextFromSpans(plugin, [{ text: plainText }]);
  let clozeRichText: RichTextInterface;
  try {
    clozeRichText = (await applyClozeToRange(plugin, baseRichText, start, end)).richText;
  } catch (error: unknown) {
    throw mapFormattingError(error);
  }
  const rem = await createRemWithRichText(plugin, clozeRichText, parent, insertIndex);
  await runSdkOperation('rem.setEnablePractice', () => rem.setEnablePractice(true));
  await runSdkOperation('rem.setPracticeDirection', () => rem.setPracticeDirection(args.direction ?? 'both'));
  const verification: CardCreationVerification = (args.verifyAfterWrite ?? true)
    ? await verifyCreatedFlashcard(plugin, rem, { front: plainText, cardType: 'cloze' })
    : { attempted: false, warnings: [] };

  const result: CreateFlashcardResult = {
    createdRemId: rem._id,
    parentId: parent._id,
    cardType: 'cloze',
    direction: args.direction ?? 'both',
    ok: verification.passed ?? true,
    status: 'created_flashcard',
    idempotencyKey,
    verification,
  };
  rememberCreatedRemIds([rem._id]);
  rememberCachedResult(FLASHCARD_RESULT_CACHE, idempotencyKey, result);
  return result;
}

function normalizeClozeInput(text: string, requestedClozeText?: string): { plainText: string; start: number; end: number } {
  const markerPattern = /\{\{(.+?)\}\}/g;
  let plainText = '';
  let lastIndex = 0;
  let selectedRange: { start: number; end: number } | undefined;

  for (const match of text.matchAll(markerPattern)) {
    const matchIndex = match.index ?? 0;
    plainText += text.slice(lastIndex, matchIndex);
    const inner = match[1] ?? '';
    const start = plainText.length;
    plainText += inner;
    const end = plainText.length;
    if (!selectedRange && (!requestedClozeText || requestedClozeText === inner)) {
      selectedRange = { start, end };
    }
    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex > 0) {
    plainText += text.slice(lastIndex);
    if (selectedRange) {
      return { plainText, ...selectedRange };
    }
  } else {
    plainText = text;
  }

  if (requestedClozeText) {
    const start = plainText.indexOf(requestedClozeText);
    return {
      plainText,
      start,
      end: start >= 0 ? start + requestedClozeText.length : -1,
    };
  }

  return { plainText, start: -1, end: -1 };
}

export async function createMultipleChoiceCard(
  plugin: RNPlugin,
  args: CreateMultipleChoiceCardArgs
): Promise<CreateFlashcardResult> {
  const back = [`Answer: ${args.correctChoice}`, ...args.choices.map((choice) => `Choice: ${choice}`)].join('\n');
  return createBasicFlashcard(
    plugin,
    {
      parentId: args.parentId,
      front: args.question,
      back,
      direction: args.direction ?? 'forward',
      idempotencyKey: args.idempotencyKey,
      verifyAfterWrite: args.verifyAfterWrite,
    },
    'multiple_choice'
  );
}

export async function createListAnswerCard(
  plugin: RNPlugin,
  args: CreateListAnswerCardArgs
): Promise<CreateFlashcardResult> {
  return createBasicFlashcard(
    plugin,
    {
      parentId: args.parentId,
      front: args.prompt,
      back: args.items.join('\n'),
      direction: args.direction ?? 'forward',
      idempotencyKey: args.idempotencyKey,
      verifyAfterWrite: args.verifyAfterWrite,
    },
    'list_answer'
  );
}
