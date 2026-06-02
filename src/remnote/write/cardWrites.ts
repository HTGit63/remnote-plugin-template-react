import { RemType, SetRemType } from '@remnote/plugin-sdk';
import type { Rem, RichTextFormatName, RichTextInterface, RNPlugin } from '@remnote/plugin-sdk';
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
import { FLASHCARD_RESULT_CACHE, getWriteIdempotencyKey, rememberCachedResult } from './writeCaches';
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

  if (remType) {
    await runSdkOperation('rem.setType', () => rem.setType(getRemTypeValue(remType)));
  }

  await runSdkOperation('rem.setBackText', () => rem.setBackText(backRichText));
  await runSdkOperation('rem.setEnablePractice', () => rem.setEnablePractice(true));
  await runSdkOperation('rem.setPracticeDirection', () => rem.setPracticeDirection(direction));

  if (cardType === 'multiple_choice' || cardType === 'list_answer') {
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

export async function createBasicFlashcard(
  plugin: RNPlugin,
  args: CreateFlashcardArgs,
  cardType: CreateFlashcardResult['cardType'] = 'basic',
  remType?: RemTypeName
): Promise<CreateFlashcardResult> {
  const idempotencyKey = getWriteIdempotencyKey(args.idempotencyKey, `card-${cardType}`);
  const cached = FLASHCARD_RESULT_CACHE.get(idempotencyKey);
  if (cached) {
    return cached;
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

  const result: CreateFlashcardResult = {
    createdRemId: rem._id,
    parentId: parent._id,
    cardType,
    direction: args.direction ?? 'both',
    ...(childIds.length ? { createdChildRemIds: childIds } : {}),
    status: 'created_flashcard',
    idempotencyKey,
  };
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
    return cached;
  }

  const parent = await findRequiredRem(plugin, args.parentId, 'Parent', 'PARENT_NOT_FOUND');
  const insertIndex = await getFreshInsertIndex(plugin, parent, 'end');
  const plainText = args.text;
  let start = args.clozeText ? plainText.indexOf(args.clozeText) : -1;
  let end = start >= 0 && args.clozeText ? start + args.clozeText.length : -1;

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

  const result: CreateFlashcardResult = {
    createdRemId: rem._id,
    parentId: parent._id,
    cardType: 'cloze',
    direction: args.direction ?? 'both',
    status: 'created_flashcard',
    idempotencyKey,
  };
  rememberCachedResult(FLASHCARD_RESULT_CACHE, idempotencyKey, result);
  return result;
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
    },
    'list_answer'
  );
}

