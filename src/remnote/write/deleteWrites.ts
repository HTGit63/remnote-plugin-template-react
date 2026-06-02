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
import { DELETE_BY_ID_RESULT_CACHE, getWriteIdempotencyKey } from './writeCaches';
import { STRUCTURED_BATCH_CACHE_LIMIT } from './writeTypes';
import { findRequiredRem, getRemPlainString, getRemTitle } from './remnoteSdkHelpers';

export async function buildDeletePreview(
  plugin: RNPlugin,
  remId: string,
  recursive: boolean
): Promise<DeletePreview> {
  const rem = await findRequiredRem(plugin, remId, 'Target');
  const parent = await runSdkOperation('rem.getParentRem', () => rem.getParentRem());
  const descendants = recursive
    ? await runSdkOperation('rem.getDescendants', () => rem.getDescendants())
    : [];

  return {
    targetRemId: rem._id,
    targetTitle: await getRemTitle(plugin, rem),
    parentRemId: parent?._id ?? null,
    parentTitle: parent ? await getRemTitle(plugin, parent) : null,
    childCount: rem.children.length,
    descendantCount: descendants.length,
    recursive,
    requiresConfirmText: 'DELETE',
  };
}

export async function getDeleteTarget(plugin: RNPlugin, rem: Rem): Promise<DeleteRemByIdTarget> {
  const breadcrumbs: DeleteRemByIdTarget['breadcrumbs'] = [];
  const seen = new Set<string>();
  let current: Rem | undefined = rem;

  while (current && !seen.has(current._id)) {
    seen.add(current._id);
    breadcrumbs.unshift({
      id: current._id,
      text: await getRemTitle(plugin, current),
    });

    if (!current.parent) {
      break;
    }

    current = (await plugin.rem.findOne(current.parent)) ?? undefined;
  }

  return {
    remId: rem._id,
    plainText: await getRemPlainString(plugin, rem),
    parentId: rem.parent ?? null,
    breadcrumbs,
    childCount: rem.children.length,
  };
}

export function rememberDeleteByIdResult(idempotencyKey: string, result: DeleteRemByIdResult) {
  DELETE_BY_ID_RESULT_CACHE.delete(idempotencyKey);
  DELETE_BY_ID_RESULT_CACHE.set(idempotencyKey, result);

  while (DELETE_BY_ID_RESULT_CACHE.size > STRUCTURED_BATCH_CACHE_LIMIT) {
    const oldestKey = DELETE_BY_ID_RESULT_CACHE.keys().next().value;
    if (typeof oldestKey !== 'string') {
      return;
    }
    DELETE_BY_ID_RESULT_CACHE.delete(oldestKey);
  }
}

export async function assertSafeDeleteTarget(plugin: RNPlugin, rem: Rem, target: DeleteRemByIdTarget) {
  if (!target.parentId) {
    throw new RemnoteWriteError('INVALID_ARGS', 'delete_rem_by_id refuses to delete top-level/workspace root Rems.', {
      remId: target.remId,
    });
  }

  if (/plugin test|mcp regression test root/i.test(target.plainText)) {
    throw new RemnoteWriteError('INVALID_ARGS', 'delete_rem_by_id refuses to delete Plugin Test / MCP Regression root Rems.', {
      remId: target.remId,
      plainText: target.plainText,
    });
  }

  const isDocument = await rem.isDocument().catch(() => false);
  if (isDocument) {
    throw new RemnoteWriteError('INVALID_ARGS', 'delete_rem_by_id refuses to delete document roots.', {
      remId: target.remId,
    });
  }

  const focusedRem = await plugin.focus.getFocusedRem().catch(() => undefined);
  const focusedPortal = await plugin.focus.getFocusedPortal().catch(() => undefined);
  if (focusedRem?._id === target.remId || focusedPortal?._id === target.remId) {
    throw new RemnoteWriteError('INVALID_ARGS', 'delete_rem_by_id refuses to delete the current focused Rem or focused portal.', {
      remId: target.remId,
    });
  }
}

export async function deleteRemByIdSafe(
  plugin: RNPlugin,
  args: DeleteRemByIdArgs
): Promise<DeleteRemByIdResult> {
  const remId = args.remId?.trim();
  if (!remId) {
    throw new RemnoteWriteError('INVALID_ARGS', 'delete_rem_by_id requires remId.');
  }

  const idempotencyKey = getWriteIdempotencyKey(args.idempotencyKey, 'delete-rem');
  if (args.dryRun === false) {
    const cached = DELETE_BY_ID_RESULT_CACHE.get(idempotencyKey);
    if (cached) {
      return {
        ...cached,
        status: cached.status === 'deleted' ? 'already_deleted' : cached.status,
      };
    }
  }

  const rem = await findRequiredRem(plugin, remId, 'Target');
  const target = await getDeleteTarget(plugin, rem);
  const ancestorIds = new Set(target.breadcrumbs.map((item) => item.id));
  const guards: NonNullable<DeleteRemByIdResult['guards']> = {
    ...(args.expectedParentId ? { expectedParentMatches: target.parentId === args.expectedParentId } : {}),
    ...(args.expectedAncestorId ? { expectedAncestorMatches: ancestorIds.has(args.expectedAncestorId) } : {}),
    ...(args.confirmTitle ? { confirmTitleMatches: target.plainText.trim() === args.confirmTitle.trim() } : {}),
  };
  const dryRun = args.dryRun ?? true;
  const baseResult: DeleteRemByIdResult = {
    dryRun,
    target,
    guards,
    wouldDelete: {
      remId: target.remId,
      childCount: target.childCount,
      includesDescendants: target.childCount > 0,
    },
    idempotencyKey,
    status: dryRun ? 'dry_run' : 'deleted',
  };

  if (dryRun) {
    return baseResult;
  }

  await assertSafeDeleteTarget(plugin, rem, target);

  if (args.expectedParentId && !guards.expectedParentMatches) {
    throw new RemnoteWriteError('INVALID_ARGS', 'expectedParentId did not match target parent.', {
      expectedParentId: args.expectedParentId,
      actualParentId: target.parentId,
    });
  }

  if (args.expectedAncestorId && !guards.expectedAncestorMatches) {
    throw new RemnoteWriteError('INVALID_ARGS', 'expectedAncestorId was not found in target breadcrumbs.', {
      expectedAncestorId: args.expectedAncestorId,
      breadcrumbs: target.breadcrumbs,
    });
  }

  if (args.confirmTitle && !guards.confirmTitleMatches) {
    throw new RemnoteWriteError('INVALID_ARGS', 'confirmTitle did not match target plain text.', {
      confirmTitle: args.confirmTitle,
      actualPlainText: target.plainText,
    });
  }

  const hasPassingGuard = Boolean(guards.expectedParentMatches || guards.expectedAncestorMatches);
  if (!hasPassingGuard) {
    throw new RemnoteWriteError(
      'INVALID_ARGS',
      'Real delete requires dryRun:false plus a matching expectedParentId or expectedAncestorId guard.',
      { guards }
    );
  }

  await runSdkOperation('rem.remove', () => rem.remove());
  const afterDelete = await plugin.rem.findOne(remId).catch(() => undefined);
  const result: DeleteRemByIdResult = {
    ...baseResult,
    deletedRemId: remId,
    verifiedDeleted: !afterDelete,
    verification: {
      deleted: !afterDelete,
      readAfterDelete: afterDelete ? 'still_present' : 'not_found',
    },
    status: 'deleted',
  };

  if (afterDelete) {
    throw new RemnoteWriteError('SDK_ERROR', 'Rem still resolved after delete.', {
      remId,
      verification: result.verification,
    });
  }

  rememberDeleteByIdResult(idempotencyKey, result);

  return result;
}
