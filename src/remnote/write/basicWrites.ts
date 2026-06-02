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
import { RemnoteWriteError, runSdkOperation } from './writeErrors';
import { APPEND_RESULT_CACHE, CREATE_DOCUMENT_RESULT_CACHE, CREATE_REM_RESULT_CACHE, MOVE_RESULT_CACHE, REORDER_RESULT_CACHE, UPDATE_RESULT_CACHE, UPDATE_RICH_RESULT_CACHE, getWriteIdempotencyKey, rememberCachedResult } from './writeCaches';
import { buildRichTextFromSpans, createRemWithRichText, findRequiredRem, getFreshInsertIndex, getRemApprovalContext, getRemPlainString, parseMarkdownToRichText, assertNewParentIsNotDescendant } from './remnoteSdkHelpers';
import { normalizeMarkdown } from './writeValidation';
import { getDeleteTarget } from './deleteWrites';

export async function createRemFromMarkdown(
  plugin: RNPlugin,
  args: CreateRemArgs
): Promise<CreateRemResult> {
  const idempotencyKey = getWriteIdempotencyKey(args.idempotencyKey, 'create-rem');
  const cached = CREATE_REM_RESULT_CACHE.get(idempotencyKey);
  if (cached) {
    return cached;
  }

  const markdown = normalizeMarkdown(args.markdown);
  const parentId = args.parentId ?? null;
  const parent = parentId ? await findRequiredRem(plugin, parentId, 'Parent', 'PARENT_NOT_FOUND') : null;
  const richText = await parseMarkdownToRichText(plugin, markdown);
  const insertIndex = parent ? await getFreshInsertIndex(plugin, parent, 'end') : undefined;
  const createdRem = await createRemWithRichText(
    plugin,
    richText,
    parent,
    insertIndex
  );

  const result: CreateRemResult = {
    createdRemId: createdRem._id,
    parentId,
    ...(insertIndex !== undefined ? { insertIndex, insertPosition: 'end' as const } : {}),
    status: 'created',
    idempotencyKey,
  };
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
    return cached;
  }

  const markdown = normalizeMarkdown(args.markdown);
  const parentId = args.parentId ?? null;
  const parent = parentId ? await findRequiredRem(plugin, parentId, 'Parent', 'PARENT_NOT_FOUND') : null;
  const richText = await parseMarkdownToRichText(plugin, markdown);
  const insertIndex = parent ? await getFreshInsertIndex(plugin, parent, 'end') : undefined;
  const createdRem = await createRemWithRichText(plugin, richText, parent, insertIndex);

  await runSdkOperation('rem.setIsDocument', () => createdRem.setIsDocument(true));

  const result: CreateDocumentResult = {
    createdRemId: createdRem._id,
    parentId,
    ...(insertIndex !== undefined ? { insertIndex, insertPosition: 'end' as const } : {}),
    document: true,
    status: 'created_document',
    idempotencyKey,
  };
  rememberCachedResult(CREATE_DOCUMENT_RESULT_CACHE, idempotencyKey, result);
  return result;
}

export async function createFolderFromMarkdown(
  _plugin: RNPlugin,
  _args: CreateFolderArgs
): Promise<CreateFolderResult> {
  throw new RemnoteWriteError(
    'SDK_UNSUPPORTED',
    'Folder creation is not exposed by the installed @remnote/plugin-sdk typings. Document creation is supported through setIsDocument(true).'
  );
}

export async function appendMarkdownToRem(
  plugin: RNPlugin,
  args: AppendToRemArgs
): Promise<AppendToRemResult> {
  const idempotencyKey = getWriteIdempotencyKey(args.idempotencyKey, 'append-rem');
  const cached = APPEND_RESULT_CACHE.get(idempotencyKey);
  if (cached) {
    return cached;
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
    throw new RemnoteWriteError('INVALID_ARGS', 'expectedPlainText did not match current Rem text.', {
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
  const afterPlainText = await getRemPlainString(plugin, rem);

  const result: UpdateRemResult = {
    updatedRemId: rem._id,
    status: 'updated',
    idempotencyKey,
    beforePlainText,
    afterPlainText,
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
    return cached;
  }

  const rem = await findRequiredRem(plugin, args.remId, 'Target');
  const richText = await buildRichTextFromSpans(plugin, args.richText);

  await runSdkOperation('rem.setText', () => rem.setText(richText));

  const result: FormatRemResult = {
    remId: rem._id,
    status: 'updated_rich',
    idempotencyKey,
  };
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
    throw new RemnoteWriteError('INVALID_ARGS', 'expectedParentId did not match current parent.', {
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
  const maxIndex = sameParent ? Math.max(newParent.children.length - 1, 0) : newParent.children.length;
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

