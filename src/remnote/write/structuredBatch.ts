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
import { RemnoteWriteError, getPartialExecutionDetails, getSdkErrorMessage, mapFormattingError, runSdkOperation } from './writeErrors';
import { STRUCTURED_BATCH_RESULT_CACHE, STYLED_TREE_RESULT_CACHE, getWriteIdempotencyKey } from './writeCaches';
import { STRUCTURED_BATCH_CACHE_LIMIT, type TreeValidationState } from './writeTypes';
import { applyRemStyle, buildRichTextFromSpans, buildStyledText, createRemWithRichText, findRequiredRem, getFreshInsertIndex, getRemPlainString } from './remnoteSdkHelpers';
import { assertTreeLimits, collectStyledTreePlan, normalizeStyledNode } from './writeValidation';
import { createFlashcardRem } from './cardWrites';

export async function structuredWriteEngine(
  plugin: RNPlugin,
  args: CreateStyledRemTreeArgs
): Promise<CreateStyledRemTreeResult> {
  const idempotencyKey = getWriteIdempotencyKey(args.idempotencyKey, 'styled-tree');
  if (!args.dryRun) {
    const cached = STYLED_TREE_RESULT_CACHE.get(idempotencyKey);
    if (cached) {
      return {
        ...cached,
        status: 'already_applied',
      };
    }
  }

  const parent = await findRequiredRem(plugin, args.parentId, 'Parent', 'PARENT_NOT_FOUND');
  const validationState: TreeValidationState = { nodeCount: 0 };
  const tree = normalizeStyledNode(args.tree, 1, validationState);
  assertTreeLimits(validationState, { maxDepth: args.maxDepth, maxNodeCount: args.maxNodeCount }, 'Styled tree');
  const plan = collectStyledTreePlan(tree);
  const createdRemIds: string[] = [];
  const createdNodes: CreateStyledRemTreeResult['createdNodes'] = [];
  const idMap: Record<string, string> = {};

  if (args.dryRun) {
    return {
      rootCreatedRemId: '',
      createdNodeCount: 0,
      createdRemIds,
      createdNodes,
      rootInsertPosition: args.position ?? 'end',
      status: 'dry_run',
      dryRun: true,
      plannedNodeCount: validationState.nodeCount,
      idempotencyKey,
      previewOutline: plan.previewOutline,
      styleOperationCount: plan.styleOperationCount,
      mathNodeCount: plan.mathNodeCount,
      cardNodeCount: plan.cardNodeCount,
    };
  }

  async function createNode(
    node: StyledRemTreeNode,
    nodeParent: Rem,
    index: number,
    depth: number
  ): Promise<Rem> {
    const type: StyledRemTreeNodeType = node.type ?? 'rem';
    let created: Rem;
    let childIds: string[] = [];

    if (type === 'basicFlashcard' || type === 'conceptCard' || type === 'descriptorCard') {
      const remType = type === 'conceptCard' ? 'concept' : type === 'descriptorCard' ? 'descriptor' : undefined;
      const card = await createFlashcardRem(
        plugin,
        nodeParent,
        index,
        type === 'conceptCard' ? 'concept' : type === 'descriptorCard' ? 'descriptor' : 'basic',
        node.front ?? node.title ?? node.text ?? '',
        node.back ?? node.answer ?? '',
        node.direction ?? 'both',
        remType
      );
      created = card.rem;
      childIds = card.childIds;
    } else if (type === 'multipleChoiceCard') {
      const choices = node.choices ?? [];
      const back = [`Answer: ${node.correctChoice ?? node.answer ?? ''}`, ...choices.map((choice) => `Choice: ${choice}`)].join('\n');
      const card = await createFlashcardRem(
        plugin,
        nodeParent,
        index,
        'multiple_choice',
        node.front ?? node.title ?? node.text ?? '',
        back,
        node.direction ?? 'forward'
      );
      created = card.rem;
      childIds = card.childIds;
    } else if (type === 'listAnswerCard') {
      const card = await createFlashcardRem(
        plugin,
        nodeParent,
        index,
        'list_answer',
        node.front ?? node.title ?? node.text ?? '',
        (node.items ?? []).join('\n'),
        node.direction ?? 'forward'
      );
      created = card.rem;
      childIds = card.childIds;
    } else if (type === 'clozeCard') {
      const text = node.text ?? node.title ?? '';
      const richText = await buildRichTextFromSpans(plugin, [{ text }]);
      created = await createRemWithRichText(plugin, richText, nodeParent, index);
      const plain = await getRemPlainString(plugin, created);
      const clozeText = node.clozeText ?? plain;
      const start = plain.indexOf(clozeText);
      if (start >= 0) {
        let next: RichTextInterface;
        try {
          next = (await applyClozeToRange(plugin, created.text, start, start + clozeText.length)).richText;
        } catch (error: unknown) {
          throw mapFormattingError(error);
        }
        await runSdkOperation('rem.setText', () => created.setText(next));
      } else if (node.clozeText) {
        throw new RemnoteWriteError('INVALID_ARGS', 'clozeText was not found in clozeCard text.', {
          clozeText: node.clozeText,
        });
      }
      await runSdkOperation('rem.setEnablePractice', () => created.setEnablePractice(true));
      await runSdkOperation('rem.setPracticeDirection', () => created.setPracticeDirection(node.direction ?? 'both'));
    } else {
      const richText =
        node.richText && node.richText.length
          ? await buildRichTextFromSpans(plugin, node.richText)
          : type === 'mathBlock' || type === 'inlineMath'
            ? await buildRichTextFromSpans(plugin, [
                { type, latex: node.latex ?? node.text ?? node.title ?? '' },
              ])
            : await buildStyledText(plugin, node.text ?? node.title ?? '', node.style);
      created = await createRemWithRichText(plugin, richText, nodeParent, index);
    }

    await applyRemStyle(plugin, created, node.style);
    if (node.clientNodeId) {
      idMap[node.clientNodeId] = created._id;
    }
    createdRemIds.push(created._id, ...childIds);
    createdNodes.push({
      remId: created._id,
      parentId: nodeParent._id,
      depth,
      index,
      type,
    });

    const children = node.children ?? [];
    for (let childIndex = 0; childIndex < children.length; childIndex += 1) {
      await createNode(children[childIndex], created, childIndex, depth + 1);
    }

    return created;
  }

  try {
    const rootInsertIndex = await getFreshInsertIndex(plugin, parent, args.position ?? 'end');
    const root = await createNode(tree, parent, rootInsertIndex, 0);

    const result: CreateStyledRemTreeResult = {
      rootCreatedRemId: root._id,
      createdNodeCount: createdRemIds.length,
      createdRemIds,
      createdNodes,
      rootInsertIndex,
      rootInsertPosition: args.position ?? 'end',
      status: 'created_styled_tree',
      idempotencyKey,
      idMap,
      previewOutline: plan.previewOutline,
      styleOperationCount: plan.styleOperationCount,
      mathNodeCount: plan.mathNodeCount,
      cardNodeCount: plan.cardNodeCount,
    };
    rememberStyledTreeResult(idempotencyKey, result);
    return result;
  } catch (error: unknown) {
    if (error instanceof RemnoteWriteError) {
      throw new RemnoteWriteError(error.code, error.message, {
        originalDetails: error.details,
        createdNodeCount: createdRemIds.length,
        createdRemIds,
        partialExecution: {
          ...getPartialExecutionDetails(error.details),
          createdNodeCount: createdRemIds.length,
          createdRemIds,
          failedStage: 'create_styled_rem_tree',
          rollbackStatus: 'not_attempted',
        },
      });
    }

    throw new RemnoteWriteError('SDK_ERROR', 'RemNote styled tree creation failed.', {
      createdNodeCount: createdRemIds.length,
      createdRemIds,
      partialExecution: {
        createdNodeCount: createdRemIds.length,
        createdRemIds,
        failedStage: 'create_styled_rem_tree',
        rollbackStatus: 'not_attempted',
      },
      sdkMessage: getSdkErrorMessage(error),
    });
  }
}

export function rememberStructuredBatchResult(idempotencyKey: string, result: ApplyStructuredNoteBatchResult) {
  STRUCTURED_BATCH_RESULT_CACHE.delete(idempotencyKey);
  STRUCTURED_BATCH_RESULT_CACHE.set(idempotencyKey, result);

  while (STRUCTURED_BATCH_RESULT_CACHE.size > STRUCTURED_BATCH_CACHE_LIMIT) {
    const oldestKey = STRUCTURED_BATCH_RESULT_CACHE.keys().next().value;
    if (typeof oldestKey !== 'string') {
      return;
    }
    STRUCTURED_BATCH_RESULT_CACHE.delete(oldestKey);
  }
}


export function rememberStyledTreeResult(idempotencyKey: string, result: CreateStyledRemTreeResult) {
  STYLED_TREE_RESULT_CACHE.delete(idempotencyKey);
  STYLED_TREE_RESULT_CACHE.set(idempotencyKey, result);

  while (STYLED_TREE_RESULT_CACHE.size > STRUCTURED_BATCH_CACHE_LIMIT) {
    const oldestKey = STYLED_TREE_RESULT_CACHE.keys().next().value;
    if (typeof oldestKey !== 'string') {
      return;
    }
    STYLED_TREE_RESULT_CACHE.delete(oldestKey);
  }
}

export function readCreatedRemIdsFromError(error: RemnoteWriteError): string[] {
  const details = typeof error.details === 'object' && error.details !== null
    ? (error.details as Record<string, unknown>)
    : {};
  const direct = Array.isArray(details.createdRemIds) ? details.createdRemIds : [];
  const partial = getPartialExecutionDetails(error.details);
  const partialIds = Array.isArray(partial.createdRemIds) ? partial.createdRemIds : [];
  return Array.from(
    new Set(
      [...direct, ...partialIds].filter((id): id is string => typeof id === 'string' && id.length > 0)
    )
  );
}

export async function rollbackCreatedRems(plugin: RNPlugin, createdRemIds: string[]) {
  const removedRemIds: string[] = [];
  const failedRemIds: string[] = [];

  for (const remId of [...createdRemIds].reverse()) {
    const rem = await plugin.rem.findOne(remId);
    if (!rem) {
      continue;
    }

    try {
      await runSdkOperation('rem.remove', () => rem.remove());
      removedRemIds.push(remId);
    } catch {
      failedRemIds.push(remId);
    }
  }

  return {
    status: failedRemIds.length ? 'failed' as const : 'completed' as const,
    removedRemIds,
    failedRemIds,
  };
}

export async function verifyCreatedRems(
  plugin: RNPlugin,
  createdRemIds: string[],
  rootCreatedRemId?: string
): Promise<ApplyStructuredNoteBatchResult['verification']> {
  const checkedRemIds: string[] = [];
  const missingRemIds: string[] = [];
  let rootPlainText: string | undefined;

  for (const remId of createdRemIds) {
    const rem = await plugin.rem.findOne(remId);
    if (!rem) {
      missingRemIds.push(remId);
      continue;
    }

    checkedRemIds.push(remId);
    if (rootCreatedRemId && remId === rootCreatedRemId) {
      rootPlainText = await getRemPlainString(plugin, rem);
    }
  }

  return {
    ok: missingRemIds.length === 0,
    checkedRemIds,
    missingRemIds,
    ...(rootPlainText !== undefined ? { rootPlainText } : {}),
  };
}

export async function createStyledRemTree(
  plugin: RNPlugin,
  args: CreateStyledRemTreeArgs
): Promise<CreateStyledRemTreeResult> {
  return structuredWriteEngine(plugin, args);
}


export async function applyStructuredNoteBatch(
  plugin: RNPlugin,
  args: ApplyStructuredNoteBatchArgs
): Promise<ApplyStructuredNoteBatchResult> {
  const operation = args.operation ?? 'create_child_tree';
  const target = args.target ?? {
    mode: 'parent_child' as const,
    parentId: args.parentId ?? null,
  };
  const noteRoot = args.note?.root ?? args.root;
  const rawNoteChildren = args.note?.children;
  const noteChildren = Array.isArray(rawNoteChildren) ? rawNoteChildren : [];
  if (!noteRoot && !noteChildren.length) {
    throw new RemnoteWriteError('INVALID_ARGS', 'Structured note batch requires root, note.root, or note.children.');
  }
  if (!noteRoot && (operation === 'create_child_tree' || operation === 'update_root_and_replace_children')) {
    throw new RemnoteWriteError('INVALID_ARGS', `${operation} requires root or note.root.`);
  }

  const validationState: TreeValidationState = { nodeCount: 0 };
  const root = noteRoot
    ? normalizeStyledNode(
        {
          ...noteRoot,
          children: [
            ...(Array.isArray(noteRoot.children) ? noteRoot.children : []),
            ...noteChildren,
          ],
        },
        1,
        validationState
      )
    : undefined;
  const childNodes = root?.children ?? noteChildren.map((child) => normalizeStyledNode(child, 1, validationState));
  assertTreeLimits(validationState, { maxDepth: args.maxDepth, maxNodeCount: args.maxNodeCount }, 'Structured note batch');
  const batchStats = (root ? [root] : childNodes).reduce(
    (acc, node) => {
      const nodeStats = collectStyledTreePlan(node, 0, acc.previewOutline);
      acc.styleOperationCount += nodeStats.styleOperationCount;
      acc.mathNodeCount += nodeStats.mathNodeCount;
      acc.cardNodeCount += nodeStats.cardNodeCount;
      return acc;
    },
    { styleOperationCount: 0, mathNodeCount: 0, cardNodeCount: 0, previewOutline: [] as string[] }
  );
  const idempotencyKey = getWriteIdempotencyKey(args.idempotencyKey, 'structured-batch');
  const rollbackOnFailure = args.rollbackOnFailure ?? true;
  const verifyAfterWrite = args.verifyAfterWrite ?? false;
  const operationId = `structured-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  if (!args.dryRun) {
    const cached = STRUCTURED_BATCH_RESULT_CACHE.get(idempotencyKey);
    if (cached) {
      return {
        ...cached,
        status: 'already_applied',
        dryRun: false,
      };
    }
  }

  const targetRemId = target.remId ?? null;
  const requestedParentId = target.parentId ?? args.parentId ?? null;
  const parentId =
    operation === 'create_child_tree'
      ? requestedParentId ?? targetRemId
      : targetRemId ?? requestedParentId;
  if (!parentId) {
    throw new RemnoteWriteError('INVALID_ARGS', 'Structured note batch target did not resolve to a Rem ID.');
  }

  const parent = await findRequiredRem(
    plugin,
    parentId,
    operation === 'create_child_tree' ? 'Parent' : 'Target',
    operation === 'create_child_tree' ? 'PARENT_NOT_FOUND' : 'REM_NOT_FOUND'
  );

  if (args.dryRun) {
    return {
      operationId,
      status: 'dry_run',
      targetRemId: operation === 'create_child_tree' ? undefined : parent._id,
      parentId: operation === 'create_child_tree' ? parent._id : undefined,
      operation,
      plannedNodeCount: validationState.nodeCount,
      createdNodeCount: 0,
      createdRemIds: [],
      updatedRemIds: [],
      deletedRemIds: [],
      dryRun: true,
      idempotencyKey,
      rollbackOnFailure,
      verifyAfterWrite,
      styleCount: batchStats.styleOperationCount,
      mathCount: batchStats.mathNodeCount,
      cardCount: batchStats.cardNodeCount,
      rollback: {
        attempted: false,
        completed: false,
      },
    };
  }

  const createdRemIds: string[] = [];
  const updatedRemIds: string[] = [];
  const deletedRemIds: string[] = [];

  async function updateExistingRoot(rem: Rem, node: StyledRemTreeNode) {
    const richText =
      node.richText && node.richText.length
        ? await buildRichTextFromSpans(plugin, node.richText)
        : node.type === 'mathBlock' || node.type === 'inlineMath'
          ? await buildRichTextFromSpans(plugin, [
              { type: node.type, latex: node.latex ?? node.text ?? node.title ?? '' },
            ])
          : await buildStyledText(plugin, node.text ?? node.title ?? '', node.style);
    await runSdkOperation('rem.setText', () => rem.setText(richText));
    await applyRemStyle(plugin, rem, node.style);
    updatedRemIds.push(rem._id);
  }

  async function deleteDirectChildren(rem: Rem) {
    const children = await runSdkOperation('rem.getChildrenRem', () => rem.getChildrenRem());
    for (const child of children) {
      const descendants = await runSdkOperation('rem.getDescendants', () => child.getDescendants());
      deletedRemIds.push(child._id, ...descendants.map((descendant) => descendant._id));
      await runSdkOperation('rem.remove', () => child.remove());
    }
  }

  async function createChildNodes(rem: Rem, nodes: StyledRemTreeNode[]) {
    for (let index = 0; index < nodes.length; index += 1) {
      const created = await structuredWriteEngine(plugin, {
        parentId: rem._id,
        position: 'end',
        tree: nodes[index],
      });
      createdRemIds.push(...created.createdRemIds);
    }
  }

  try {
    let rootCreatedRemId: string | undefined;
    let rootInsertIndex: number | undefined;
    let rootInsertPosition: 'start' | 'end' | undefined;

    if (operation === 'create_child_tree') {
      if (!root) {
        throw new RemnoteWriteError('INVALID_ARGS', 'create_child_tree requires root or note.root.');
      }
      const created = await structuredWriteEngine(plugin, {
        parentId: parent._id,
        position: args.position ?? 'end',
        tree: root,
      });
      createdRemIds.push(...created.createdRemIds);
      rootCreatedRemId = created.rootCreatedRemId;
      rootInsertIndex = created.rootInsertIndex;
      rootInsertPosition = created.rootInsertPosition;
    } else {
      if (operation === 'update_root_and_replace_children') {
        if (!root) {
          throw new RemnoteWriteError('INVALID_ARGS', 'update_root_and_replace_children requires root or note.root.');
        }
        await updateExistingRoot(parent, root);
      }
      if (operation === 'replace_children' || operation === 'update_root_and_replace_children') {
        await deleteDirectChildren(parent);
      }
      if (
        operation === 'append_children' ||
        operation === 'replace_children' ||
        operation === 'update_root_and_replace_children'
      ) {
        await createChildNodes(parent, childNodes);
      }
    }

    const verification = verifyAfterWrite
      ? await verifyCreatedRems(
          plugin,
          Array.from(new Set([...createdRemIds, ...updatedRemIds])),
          rootCreatedRemId ?? parent._id
        )
      : undefined;
    const result: ApplyStructuredNoteBatchResult = {
      operationId,
      status: 'applied',
      targetRemId: operation === 'create_child_tree' ? rootCreatedRemId : parent._id,
      parentId: operation === 'create_child_tree' ? parent._id : parent.parent ?? undefined,
      operation,
      plannedNodeCount: validationState.nodeCount,
      createdNodeCount: createdRemIds.length,
      createdRemIds,
      updatedRemIds,
      deletedRemIds: Array.from(new Set(deletedRemIds)),
      rootCreatedRemId,
      rootInsertIndex,
      rootInsertPosition,
      dryRun: false,
      idempotencyKey,
      rollbackOnFailure,
      verifyAfterWrite,
      styleCount: batchStats.styleOperationCount,
      mathCount: batchStats.mathNodeCount,
      cardCount: batchStats.cardNodeCount,
      rollback: {
        attempted: false,
        completed: false,
      },
      ...(verification ? { verification } : {}),
    };

    rememberStructuredBatchResult(idempotencyKey, result);

    return result;
  } catch (error: unknown) {
    if (error instanceof RemnoteWriteError) {
      const nestedCreatedRemIds = readCreatedRemIdsFromError(error);
      for (const remId of nestedCreatedRemIds) {
        createdRemIds.push(remId);
      }
      const uniqueCreatedRemIds = Array.from(new Set(createdRemIds));
      const hasPartial = uniqueCreatedRemIds.length > 0 || updatedRemIds.length > 0 || deletedRemIds.length > 0;
      const rollback = rollbackOnFailure && uniqueCreatedRemIds.length
        ? await rollbackCreatedRems(plugin, uniqueCreatedRemIds)
        : { status: 'not_attempted' as const, removedRemIds: [], failedRemIds: [] };
      throw new RemnoteWriteError(hasPartial ? 'PARTIAL_FAILURE' : error.code, hasPartial ? 'Structured note batch failed after partial execution.' : error.message, {
        originalDetails: error.details,
        operationId,
        idempotencyKey,
        partialExecution: {
          ...getPartialExecutionDetails(error.details),
          createdNodeCount: uniqueCreatedRemIds.length,
          createdRemIds: uniqueCreatedRemIds,
          updatedRemIds,
          deletedRemIds: Array.from(new Set(deletedRemIds)),
          failedStage: 'apply_structured_note_batch',
          rollbackStatus: rollback.status,
          rollbackRemovedRemIds: rollback.removedRemIds,
          rollbackFailedRemIds: rollback.failedRemIds,
        },
      });
    }

    throw new RemnoteWriteError('SDK_ERROR', 'Structured note batch failed.', {
      sdkMessage: getSdkErrorMessage(error),
      operationId,
      idempotencyKey,
      partialExecution: {
        createdRemIds,
        updatedRemIds,
        deletedRemIds: Array.from(new Set(deletedRemIds)),
        failedStage: 'apply_structured_note_batch',
        rollbackStatus: 'not_attempted',
      },
    });
  }
}

