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
import { RemnoteWriteError, runSdkOperation } from './writeErrors';
import { APPEND_RESULT_CACHE, CREATE_DOCUMENT_RESULT_CACHE, CREATE_REM_RESULT_CACHE, MOVE_RESULT_CACHE, REORDER_RESULT_CACHE, UPDATE_RESULT_CACHE, UPDATE_RICH_RESULT_CACHE, getWriteIdempotencyKey, rememberCachedResult, rememberCreatedRemIds } from './writeCaches';
import { buildRichTextFromSpans, createRemWithRichText, createSingleRemWithMarkdownApi, findRequiredRem, getFreshInsertIndex, getRemApprovalContext, getRemChildCount, getRemPlainString, getRemRichText, getRemSiblingIndex, hasRemSdkApi, parseMarkdownToRichText, assertNewParentIsNotDescendant } from './remnoteSdkHelpers';
import { normalizeMarkdown } from './writeValidation';
import { getDeleteTarget } from './deleteWrites';
import { singleMarkdownFastPathEnabled } from './runtimeFlags';
import { captureStyleMutationSnapshot, withRichReplacementProof } from './styleMutationInvariant';

async function rollbackCreatedRem(plugin: RNPlugin, remId: string): Promise<{
  rollbackStatus: 'completed' | 'failed';
  rollbackRemovedRemIds: string[];
  rollbackFailedRemIds: string[];
  rollbackError?: string;
}> {
  try {
    const rem = await findRequiredRem(plugin, remId, 'Target', 'REM_NOT_FOUND');
    await runSdkOperation('rem.remove', () => rem.remove());
    return {
      rollbackStatus: 'completed',
      rollbackRemovedRemIds: [remId],
      rollbackFailedRemIds: [],
    };
  } catch (error: unknown) {
    return {
      rollbackStatus: 'failed',
      rollbackRemovedRemIds: [],
      rollbackFailedRemIds: [remId],
      rollbackError: error instanceof Error ? error.message : String(error),
    };
  }
}

async function verifyCreatedRemNotBlank(
  plugin: RNPlugin,
  createdRem: Rem,
  expectedMarkdown: string,
  failedStage: string
): Promise<{ afterPlainText: string; matchesRequestedMarkdownText: boolean; afterParentId: string | null }> {
  const refreshed = await findRequiredRem(plugin, createdRem._id, 'Target', 'REM_NOT_FOUND');
  const afterPlainText = await getRemPlainString(plugin, refreshed);
  const expectedText = normalizeMarkdownTextForComparison(expectedMarkdown);
  const actualText = normalizePlainTextForComparison(afterPlainText);
  const matchesRequestedMarkdownText = Boolean(
    actualText && (!expectedText || expectedText.includes(actualText) || actualText.includes(expectedText))
  );

  if (!actualText) {
    const rollback = await rollbackCreatedRem(plugin, createdRem._id);
    throw new RemnoteWriteError('PARTIAL_FAILURE', 'Created Rem was blank after write verification.', {
      partialExecution: {
        createdRemIds: [createdRem._id],
        failedStage,
        ...rollback,
      },
      verification: {
        expectedMarkdownLength: expectedMarkdown.length,
        afterPlainText,
        matchesRequestedMarkdownText: false,
      },
    });
  }

  return { afterPlainText, matchesRequestedMarkdownText, afterParentId: refreshed.parent ?? null };
}

function stripMarkdownPrefixForComparison(line: string): string {
  return line
    .trim()
    .replace(/^#{1,6}\s+/, '')
    .replace(/^>\s*/, '')
    .replace(/^[-*+]\s+/, '')
    .replace(/^\d+[.)]\s+/, '')
    .replace(/^`([^`]+)`$/, '$1')
    .trim();
}

function normalizePlainTextForComparison(text: string): string {
  return text.normalize('NFC').replace(/\s+/g, ' ').trim();
}

function normalizeMarkdownTextForComparison(markdown: string): string {
  return normalizePlainTextForComparison(
    markdown
      .replace(/\r\n?/g, '\n')
      .split('\n')
      .map(stripMarkdownPrefixForComparison)
      .filter(Boolean)
      .join(' ')
  );
}

async function createRemFromMarkdownSafely(
  plugin: RNPlugin,
  markdown: string,
  parent: Rem | null
): Promise<{ createdRem: Rem; insertIndex?: number; verification: Record<string, unknown> }> {
  const useFastPath = singleMarkdownFastPathEnabled() && hasRemSdkApi(plugin, 'createSingleRemWithMarkdown');
  let insertIndex: number | undefined;
  let createdRem: Rem;

  if (useFastPath) {
    createdRem = await createSingleRemWithMarkdownApi(plugin, markdown, parent);
    insertIndex = parent ? await getRemSiblingIndex(createdRem) : undefined;
  } else {
    const richText = await parseMarkdownToRichText(plugin, markdown);
    insertIndex = parent ? await getFreshInsertIndex(plugin, parent, 'end') : undefined;
    createdRem = await createRemWithRichText(plugin, richText, parent, insertIndex);
  }

  const verification = await verifyCreatedRemNotBlank(
    plugin,
    createdRem,
    markdown,
    useFastPath ? 'rem.createSingleRemWithMarkdown.verifyText' : 'manual_create.verifyText'
  );
  return {
    createdRem,
    ...(insertIndex !== undefined ? { insertIndex } : {}),
    verification: {
      ...verification,
      creationPath: useFastPath ? 'createSingleRemWithMarkdown' : 'manual_parse_create_setText_setParent',
      singleMarkdownFastPathEnabled: useFastPath,
      parentProof: {
        requestedParentId: parent?._id ?? null,
        afterParentId: verification.afterParentId,
        parentMatches: (parent?._id ?? null) === verification.afterParentId,
      },
    },
  };
}

async function findSameTitleChild(
  plugin: RNPlugin,
  parent: Rem | null,
  markdown: string
): Promise<{ remId: string; plainText: string } | null> {
  if (!parent) {
    return null;
  }

  const requestedText = normalizeMarkdownTextForComparison(markdown);
  const children = await runSdkOperation('rem.getChildrenRem', () => parent.getChildrenRem());
  for (const child of children) {
    const plainText = await getRemPlainString(plugin, child);
    const normalizedChildText = normalizePlainTextForComparison(plainText);
    if (normalizedChildText && normalizedChildText === requestedText) {
      return { remId: child._id, plainText };
    }
  }
  return null;
}

export async function createRemFromMarkdown(
  plugin: RNPlugin,
  args: CreateRemArgs
): Promise<CreateRemResult> {
  const idempotencyKey = getWriteIdempotencyKey(args.idempotencyKey, 'create-rem');
  const cached = CREATE_REM_RESULT_CACHE.get(idempotencyKey);
  if (cached) {
    return {
      ...cached,
      status: 'already_applied',
    };
  }

  const markdown = normalizeMarkdown(args.markdown);
  const parentId = args.parentId ?? null;
  const parent = parentId ? await findRequiredRem(plugin, parentId, 'Parent', 'PARENT_NOT_FOUND') : null;
  const duplicate = await findSameTitleChild(plugin, parent, markdown);
  if (duplicate) {
    throw new RemnoteWriteError('INVALID_ARGS', 'A sibling Rem with the same plain text already exists under this parent.', {
      parentId,
      duplicateRemId: duplicate.remId,
      duplicatePlainText: duplicate.plainText,
      duplicateBehavior: 'refused_same_title_same_parent_different_key',
      idempotencyKey,
    });
  }
  const { createdRem, insertIndex, verification } = await createRemFromMarkdownSafely(plugin, markdown, parent);

  const result: CreateRemResult = {
    createdRemId: createdRem._id,
    parentId,
    ...(insertIndex !== undefined ? { insertIndex, insertPosition: 'end' as const } : {}),
    status: 'created',
    idempotencyKey,
    verification,
  };
  rememberCreatedRemIds([createdRem._id]);
  rememberCachedResult(CREATE_REM_RESULT_CACHE, idempotencyKey, result);
  return result;
}

export async function createDocumentFromMarkdown(
  plugin: RNPlugin,
  args: CreateDocumentArgs
): Promise<CreateDocumentResult> {
  const idempotencyKey = getWriteIdempotencyKey(args.idempotencyKey, 'create-document');
  const cached = CREATE_DOCUMENT_RESULT_CACHE.get(idempotencyKey);
  if (cached) {
    return {
      ...cached,
      status: 'already_applied',
    };
  }

  const markdown = normalizeMarkdown(args.markdown);
  const parentId = args.parentId ?? null;
  const parent = parentId ? await findRequiredRem(plugin, parentId, 'Parent', 'PARENT_NOT_FOUND') : null;
  const { createdRem, insertIndex, verification: createVerification } = await createRemFromMarkdownSafely(plugin, markdown, parent);

  await runSdkOperation('rem.setIsDocument', () => createdRem.setIsDocument(true));
  const verification = await verifyCreatedRemNotBlank(plugin, createdRem, markdown, 'rem.setIsDocument.verifyText');

  const result: CreateDocumentResult = {
    createdRemId: createdRem._id,
    parentId,
    ...(insertIndex !== undefined ? { insertIndex, insertPosition: 'end' as const } : {}),
    document: true,
    status: 'created_document',
    idempotencyKey,
    verification: {
      ...createVerification,
      afterSetIsDocument: verification,
    },
  };
  rememberCreatedRemIds([createdRem._id]);
  rememberCachedResult(CREATE_DOCUMENT_RESULT_CACHE, idempotencyKey, result);
  return result;
}

export async function createFolderFromMarkdown(
  _plugin: RNPlugin,
  _args: CreateFolderArgs
): Promise<CreateFolderResult> {
  throw new RemnoteWriteError(
    'SDK_UNSUPPORTED',
    'Folder creation is hidden until the modern RemNote SDK folder path is live-verified. Document creation is supported through setIsDocument(true).'
  );
}

export async function appendMarkdownToRem(
  plugin: RNPlugin,
  args: AppendToRemArgs
): Promise<AppendToRemResult> {
  const idempotencyKey = getWriteIdempotencyKey(args.idempotencyKey, 'append-rem');
  const cached = APPEND_RESULT_CACHE.get(idempotencyKey);
  if (cached) {
    return {
      ...cached,
      status: 'already_applied',
    };
  }

  const parent = await findRequiredRem(plugin, args.remId, 'Target');
  const markdown = normalizeMarkdown(args.markdown);
  const richText = await parseMarkdownToRichText(plugin, markdown);
  const insertIndex = await getFreshInsertIndex(plugin, parent, args.position ?? 'end');
  const createdRem = await createRemWithRichText(
    plugin,
    richText,
    parent,
    insertIndex
  );

  const result: AppendToRemResult = {
    targetRemId: parent._id,
    createdRemId: createdRem._id,
    insertIndex,
    position: args.position ?? 'end',
    status: 'appended',
    idempotencyKey,
  };
  rememberCreatedRemIds([createdRem._id]);
  rememberCachedResult(APPEND_RESULT_CACHE, idempotencyKey, result);
  return result;
}

export async function updateRemMarkdown(
  plugin: RNPlugin,
  args: UpdateRemArgs
): Promise<UpdateRemResult> {
  const idempotencyKey = getWriteIdempotencyKey(args.idempotencyKey, 'update-rem');
  if (!args.dryRun) {
    const cached = UPDATE_RESULT_CACHE.get(idempotencyKey);
    if (cached) {
      return {
        ...cached,
        status: 'already_applied',
      };
    }
  }

  const rem = await findRequiredRem(plugin, args.remId, 'Target');
  const beforePlainText = await getRemPlainString(plugin, rem);
  if (args.expectedPlainText !== undefined && beforePlainText !== args.expectedPlainText) {
    throw new RemnoteWriteError('STALE_STATE_CONFLICT', 'expectedPlainText did not match current Rem text.', {
      remId: rem._id,
      expectedPlainText: args.expectedPlainText,
      actualPlainText: beforePlainText,
    });
  }
  const markdown = normalizeMarkdown(args.markdown);
  const richText = await parseMarkdownToRichText(plugin, markdown);

  if (args.dryRun) {
    return {
      updatedRemId: rem._id,
      status: 'dry_run',
      dryRun: true,
      previewMarkdown: markdown,
      beforePlainText,
      afterPreviewMarkdown: markdown,
      idempotencyKey,
    };
  }

  await runSdkOperation('rem.setText', () => rem.setText(richText));
  const refreshed = await findRequiredRem(plugin, rem._id, 'Target');
  const afterPlainText = await getRemPlainString(plugin, refreshed);

  const result: UpdateRemResult = {
    updatedRemId: rem._id,
    status: 'updated',
    idempotencyKey,
    beforePlainText,
    afterPlainText,
    verification: {
      before: { plainText: beforePlainText },
      after: { plainText: afterPlainText },
      matchesRequestedMarkdownText: afterPlainText.length > 0,
    },
  };
  rememberCachedResult(UPDATE_RESULT_CACHE, idempotencyKey, result);
  return result;
}

export async function updateRemRich(
  plugin: RNPlugin,
  args: UpdateRemRichArgs
): Promise<FormatRemResult> {
  const idempotencyKey = getWriteIdempotencyKey(args.idempotencyKey, 'update-rich');
  const cached = UPDATE_RICH_RESULT_CACHE.get(idempotencyKey);
  if (cached) {
    return {
      ...cached,
      status: 'already_applied',
    };
  }

  const rem = await findRequiredRem(plugin, args.remId, 'Target');
  const beforePlainText = await getRemPlainString(plugin, rem);
  const before = await captureStyleMutationSnapshot(plugin, rem);
  const richText = await buildRichTextFromSpans(plugin, args.richText);
  const expectedPlainText = await plugin.richText.toString(richText);

  await runSdkOperation('rem.setText', () => rem.setText(richText));
  const refreshed = await findRequiredRem(plugin, rem._id, 'Target');
  const afterPlainText = await getRemPlainString(plugin, refreshed);
  const after = await captureStyleMutationSnapshot(plugin, refreshed);
  const richTextMatchesRequested = JSON.stringify(getRemRichText(refreshed)) === JSON.stringify(richText);

  const result: FormatRemResult = withRichReplacementProof({
    remId: rem._id,
    status: 'updated_rich',
    idempotencyKey,
    ok: true,
    verification: {
      before: { plainText: beforePlainText },
      after: { plainText: afterPlainText },
    },
  }, before, after, expectedPlainText, richTextMatchesRequested);
  rememberCachedResult(UPDATE_RICH_RESULT_CACHE, idempotencyKey, result);
  return result;
}


export async function moveRem(plugin: RNPlugin, args: MoveRemArgs): Promise<MoveRemResult> {
  const idempotencyKey = getWriteIdempotencyKey(args.idempotencyKey, 'move-rem');
  if (!args.dryRun) {
    const cached = MOVE_RESULT_CACHE.get(idempotencyKey);
    if (cached) {
      return {
        ...cached,
        status: 'already_applied',
      };
    }
  }

  const rem = await findRequiredRem(plugin, args.remId, 'Target');
  const newParent = await findRequiredRem(plugin, args.newParentId, 'Parent', 'PARENT_NOT_FOUND');
  const beforeTarget = await getDeleteTarget(plugin, rem);
  const beforeAncestorIds = new Set(beforeTarget.breadcrumbs.map((item) => item.id));

  if (args.expectedParentId && rem.parent !== args.expectedParentId) {
    throw new RemnoteWriteError('STALE_STATE_CONFLICT', 'expectedParentId did not match current parent.', {
      remId: rem._id,
      expectedParentId: args.expectedParentId,
      actualParentId: rem.parent ?? null,
    });
  }
  if (args.expectedAncestorId && !beforeAncestorIds.has(args.expectedAncestorId)) {
    throw new RemnoteWriteError('INVALID_ARGS', 'expectedAncestorId was not found in current breadcrumbs.', {
      remId: rem._id,
      expectedAncestorId: args.expectedAncestorId,
      breadcrumbs: beforeTarget.breadcrumbs,
    });
  }

  await assertNewParentIsNotDescendant(plugin, rem, newParent);

  const sameParent = rem.parent === newParent._id;
  const newParentChildCount = getRemChildCount(newParent);
  const maxIndex = sameParent ? Math.max(newParentChildCount - 1, 0) : newParentChildCount;
  if (args.index > maxIndex) {
    throw new RemnoteWriteError('INVALID_ARGS', 'index is outside the target parent child range.', {
      index: args.index,
      maxIndex,
    });
  }

  if (args.dryRun) {
    return {
      movedRemId: rem._id,
      newParentId: newParent._id,
      index: args.index,
      status: 'dry_run',
      dryRun: true,
      idempotencyKey,
      beforeParentId: rem.parent ?? null,
      afterParentId: newParent._id,
      beforeBreadcrumbs: beforeTarget.breadcrumbs,
    };
  }

  if (!args.expectedParentId && !args.expectedAncestorId) {
    throw new RemnoteWriteError('INVALID_ARGS', 'Real move requires expectedParentId or expectedAncestorId guard.', {
      remId: rem._id,
      currentParentId: rem.parent ?? null,
      breadcrumbs: beforeTarget.breadcrumbs,
    });
  }

  await runSdkOperation('rem.setParent', () => rem.setParent(newParent, args.index));
  const moved = (await plugin.rem.findOne(rem._id)) ?? rem;
  const afterTarget = await getDeleteTarget(plugin, moved);

  const result: MoveRemResult = {
    movedRemId: rem._id,
    newParentId: newParent._id,
    index: args.index,
    status: 'moved',
    idempotencyKey,
    beforeParentId: beforeTarget.parentId,
    afterParentId: newParent._id,
    beforeBreadcrumbs: beforeTarget.breadcrumbs,
    afterBreadcrumbs: afterTarget.breadcrumbs,
  };
  rememberCachedResult(MOVE_RESULT_CACHE, idempotencyKey, result);
  return result;
}

export async function reorderChildren(
  plugin: RNPlugin,
  args: ReorderChildrenArgs
): Promise<ReorderChildrenResult> {
  const idempotencyKey = getWriteIdempotencyKey(args.idempotencyKey, 'reorder-children');
  if (!args.dryRun) {
    const cached = REORDER_RESULT_CACHE.get(idempotencyKey);
    if (cached) {
      return {
        ...cached,
        status: 'already_applied',
      };
    }
  }

  const parent = await findRequiredRem(plugin, args.parentRemId, 'Parent', 'PARENT_NOT_FOUND');
  const currentChildren = await runSdkOperation('rem.getChildrenRem', () => parent.getChildrenRem());
  const currentIds = currentChildren.map((child) => child._id);
  const requestedIds = args.orderedChildRemIds;
  const currentSet = new Set(currentIds);
  const requestedSet = new Set(requestedIds);

  if (requestedSet.size !== requestedIds.length) {
    throw new RemnoteWriteError('INVALID_ARGS', 'orderedChildRemIds contains duplicate Rem IDs.');
  }

  const missingIds = currentIds.filter((id) => !requestedSet.has(id));
  const extraIds = requestedIds.filter((id) => !currentSet.has(id));
  if (!args.allowPartial && (missingIds.length > 0 || extraIds.length > 0)) {
    throw new RemnoteWriteError(
      'INVALID_ARGS',
      'orderedChildRemIds must contain exactly the current direct child IDs.',
      {
        parentRemId: parent._id,
        missingIds,
        extraIds,
      }
    );
  }
  if (args.allowPartial && extraIds.length > 0) {
    throw new RemnoteWriteError('INVALID_ARGS', 'orderedChildRemIds contains Rem IDs that are not current direct children.', {
      parentRemId: parent._id,
      extraIds,
    });
  }

  if (args.dryRun) {
    return {
      parentRemId: parent._id,
      parentId: parent._id,
      orderedChildRemIds: requestedIds,
      orderedChildIds: requestedIds,
      status: 'dry_run',
      dryRun: true,
      allowPartial: args.allowPartial,
      missingIds,
      extraIds,
      beforeOrder: currentIds,
      afterOrder: requestedIds,
      idempotencyKey,
    };
  }

  const childrenById = new Map(currentChildren.map((child) => [child._id, child]));
  for (let index = 0; index < requestedIds.length; index += 1) {
    const child = childrenById.get(requestedIds[index]);
    if (!child) {
      throw new RemnoteWriteError('REM_NOT_FOUND', 'Child Rem was not found during reorder.', {
        remId: requestedIds[index],
      });
    }

    await runSdkOperation('rem.setParent', () => child.setParent(parent, index));
  }

  const result: ReorderChildrenResult = {
    parentRemId: parent._id,
    parentId: parent._id,
    orderedChildRemIds: requestedIds,
    orderedChildIds: requestedIds,
    status: 'reordered',
    allowPartial: args.allowPartial,
    beforeOrder: currentIds,
    afterOrder: requestedIds,
    idempotencyKey,
  };
  rememberCachedResult(REORDER_RESULT_CACHE, idempotencyKey, result);
  return result;
}


export async function replaceRemMarkdown(
  plugin: RNPlugin,
  args: ReplaceRemArgs
): Promise<ReplaceRemResult> {
  const updated = await updateRemMarkdown(plugin, args);

  return {
    remId: updated.updatedRemId,
    status: updated.status === 'updated' ? 'replaced' : updated.status,
    dryRun: updated.dryRun,
    idempotencyKey: updated.idempotencyKey,
  };
}
