import { RemType, SetRemType } from '@remnote/plugin-sdk';
import type {
  PluginRem as Rem,
  RichTextFormatName,
  RichTextInterface,
  RNPlugin,
} from '@remnote/plugin-sdk';
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
import { applyStylePresetToTree } from '../../../shared/bridge/style-presets';
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
import {
  RemnoteWriteError,
  getPartialExecutionDetails,
  getSdkErrorMessage,
  mapFormattingError,
  runSdkOperation,
} from './writeErrors';
import {
  STRUCTURED_BATCH_RESULT_CACHE,
  STYLED_TREE_RESULT_CACHE,
  getWriteIdempotencyKey,
} from './writeCaches';
import { STRUCTURED_BATCH_CACHE_LIMIT, type TreeValidationState } from './writeTypes';
import {
  applyRemStyle,
  buildRichTextFromSpans,
  buildStyledText,
  createRemTreeWithMarkdownApi,
  createRemWithRichText,
  getRemSiblingIndex,
  hasRemSdkApi,
  findRequiredRem,
  getFreshInsertIndex,
  getRemPlainString,
  getRemRichText,
} from './remnoteSdkHelpers';
import { assertTreeLimits, collectStyledTreePlan, normalizeStyledNode } from './writeValidation';
import { createFlashcardRem } from './cardWrites';
import { buildWriteOperationPlan } from '../write-engine/plan';
import { buildWritePerformanceReport } from '../../../shared/bridge/performance';
import {
  executeWriteOperation,
  finalizeWriteOperationPlan,
  writeEngineExecutionFromPlan,
} from '../write-engine/execute';
import { rollbackCreatedRems as rollbackCreatedRemsFromEngine } from '../write-engine/rollback';
import {
  verifyCreatedRems as verifyCreatedRemsFromEngine,
  verifyStagedReplacement,
} from '../write-engine/verify';
import type { WriteOperationPlan } from '../write-engine/types';

function styledNodeMarkdownText(node: StyledRemTreeNode): string {
  const direct = node.text ?? node.title;
  if (direct) {
    return direct.replace(/\s+/g, ' ').trim();
  }
  if (node.richText?.length) {
    return node.richText
      .map((span) => span.text ?? span.latex ?? '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  if (node.latex) {
    return node.latex.replace(/\s+/g, ' ').trim();
  }
  return '';
}

function canUseMarkdownTreeFastPath(node: StyledRemTreeNode): boolean {
  const type = node.type ?? 'rem';
  if (type !== 'rem' && type !== 'mathBlock' && type !== 'inlineMath') {
    return false;
  }
  if (
    node.front ||
    node.back ||
    node.answer ||
    node.clozeText ||
    node.choices?.length ||
    node.items?.length
  ) {
    return false;
  }
  if (!styledNodeMarkdownText(node)) {
    return false;
  }
  return (node.children ?? []).every(canUseMarkdownTreeFastPath);
}

function styledNodeToMarkdownLines(node: StyledRemTreeNode, depth = 0): string[] {
  const text = styledNodeMarkdownText(node);
  return [
    `${'  '.repeat(depth)}- ${text}`,
    ...(node.children ?? []).flatMap((child) => styledNodeToMarkdownLines(child, depth + 1)),
  ];
}

function flattenStyledNodes(node: StyledRemTreeNode): StyledRemTreeNode[] {
  return [node, ...(node.children ?? []).flatMap(flattenStyledNodes)];
}

async function collectRemRecordsPreOrder(
  roots: Rem[],
  parentId: string,
  depth = 0
): Promise<Array<{ rem: Rem; parentId: string; depth: number; index: number }>> {
  const records: Array<{ rem: Rem; parentId: string; depth: number; index: number }> = [];
  for (let index = 0; index < roots.length; index += 1) {
    const rem = roots[index];
    records.push({ rem, parentId, depth, index });
    const children = await runSdkOperation('rem.getChildrenRem', () => rem.getChildrenRem());
    records.push(...(await collectRemRecordsPreOrder(children, rem._id, depth + 1)));
  }
  return records;
}

export async function structuredWriteEngine(
  plugin: RNPlugin,
  args: CreateStyledRemTreeArgs,
  options: { skipTransaction?: boolean } = {}
): Promise<CreateStyledRemTreeResult> {
  const startedAt = Date.now();
  const idempotencyKey = getWriteIdempotencyKey(args.idempotencyKey, 'styled-tree');
  if (!args.dryRun) {
    const cached = STYLED_TREE_RESULT_CACHE.get(idempotencyKey);
    if (cached) {
      const replayPlan = finalizeWriteOperationPlan(
        plugin,
        cached.operationPlan ??
          buildWriteOperationPlan({
            toolName: 'create_styled_rem_tree',
            operation: 'create_styled_rem_tree',
            dryRun: false,
            idempotencyKey,
            target: { parentId: args.parentId },
            nodesToCreate: cached.createdNodeCount,
          }),
        { idempotencyReplay: true, skipTransaction: options.skipTransaction }
      );
      return {
        ...cached,
        status: 'already_applied',
        operationPlan: replayPlan,
        writeEngine: writeEngineExecutionFromPlan(replayPlan, { idempotencyReplay: true }),
        durationMs: Date.now() - startedAt,
      };
    }
  }

  const parent = await findRequiredRem(plugin, args.parentId, 'Parent', 'PARENT_NOT_FOUND');
  const validationState: TreeValidationState = { nodeCount: 0 };
  const tree = normalizeStyledNode(applyStylePresetToTree(args.tree, args), 1, validationState);
  assertTreeLimits(
    validationState,
    { maxDepth: args.maxDepth, maxNodeCount: args.maxNodeCount },
    'Styled tree'
  );
  const plan = collectStyledTreePlan(tree);
  const operationPlan = finalizeWriteOperationPlan(
    plugin,
    buildWriteOperationPlan({
      toolName: 'create_styled_rem_tree',
      operation: 'create_styled_rem_tree',
      dryRun: Boolean(args.dryRun),
      idempotencyKey,
      target: { parentId: parent._id },
      nodes: [tree],
      verificationChecks: args.dryRun ? ['validate_tree_limits'] : ['created_rems_exist'],
      rollbackStrategy: 'delete_created_rems',
      replacement: {
        strategy: 'create_child_tree',
        preservesExistingUntilVerified: true,
        oldChildrenSnapshotRequired: false,
      },
    }),
    { skipTransaction: options.skipTransaction }
  );
  const planningDurationMs = Date.now() - startedAt;
  const createdRemIds: string[] = [];
  const createdNodes: CreateStyledRemTreeResult['createdNodes'] = [];
  const idMap: Record<string, string> = {};

  if (args.dryRun) {
    const performance = buildWritePerformanceReport({
      phaseDurationsMs: {
        planning: planningDurationMs,
        singleWriteExecution: 0,
        verification: 0,
        total: Date.now() - startedAt,
      },
      primaryToolCallCount: 1,
      sdkOperationCount: 0,
    });
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
      operationPlan,
      writeEngine: writeEngineExecutionFromPlan(operationPlan),
      performance,
      durationMs: Date.now() - startedAt,
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
      const remType =
        type === 'conceptCard' ? 'concept' : type === 'descriptorCard' ? 'descriptor' : undefined;
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
      const back = [
        `Answer: ${node.correctChoice ?? node.answer ?? ''}`,
        ...choices.map((choice) => `Choice: ${choice}`),
      ].join('\n');
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
          next = (
            await applyClozeToRange(
              plugin,
              getRemRichText(created),
              start,
              start + clozeText.length
            )
          ).richText;
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
      await runSdkOperation('rem.setPracticeDirection', () =>
        created.setPracticeDirection(node.direction ?? 'both')
      );
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
    const executionStartedAt = Date.now();
    const executed = await executeWriteOperation(
      plugin,
      operationPlan,
      async (activePlan) => {
        const canUseBulkMarkdownTree =
          (args.position ?? 'end') === 'end' &&
          hasRemSdkApi(plugin, 'createTreeWithMarkdown') &&
          canUseMarkdownTreeFastPath(tree);
        if (canUseBulkMarkdownTree) {
          const roots = await createRemTreeWithMarkdownApi(
            plugin,
            styledNodeToMarkdownLines(tree).join('\n'),
            parent
          );
          const records = await collectRemRecordsPreOrder(roots, parent._id);
          const plannedNodes = flattenStyledNodes(tree);
          for (let index = 0; index < Math.min(records.length, plannedNodes.length); index += 1) {
            const node = plannedNodes[index];
            const record = records[index];
            if (node.richText?.length) {
              const richText = await buildRichTextFromSpans(plugin, node.richText);
              await runSdkOperation('rem.setText', () => record.rem.setText(richText));
            } else if (node.type === 'mathBlock' || node.type === 'inlineMath') {
              const richText = await buildRichTextFromSpans(plugin, [
                { type: node.type, latex: node.latex ?? node.text ?? node.title ?? '' },
              ]);
              await runSdkOperation('rem.setText', () => record.rem.setText(richText));
            }
            await applyRemStyle(plugin, record.rem, node.style);
            if (node.clientNodeId) {
              idMap[node.clientNodeId] = record.rem._id;
            }
            createdRemIds.push(record.rem._id);
            createdNodes.push({
              remId: record.rem._id,
              parentId: record.parentId,
              depth: record.depth,
              index: record.index,
              type: node.type ?? 'rem',
            });
          }
          const root = roots[0];
          const result: CreateStyledRemTreeResult = {
            rootCreatedRemId: root._id,
            createdNodeCount: createdRemIds.length,
            createdRemIds,
            createdNodes,
            rootInsertIndex: await getRemSiblingIndex(root),
            rootInsertPosition: 'end',
            status: 'created_styled_tree',
            idempotencyKey,
            idMap,
            previewOutline: plan.previewOutline,
            styleOperationCount: plan.styleOperationCount,
            mathNodeCount: plan.mathNodeCount,
            cardNodeCount: plan.cardNodeCount,
            operationPlan: activePlan,
            writeEngine: writeEngineExecutionFromPlan(activePlan),
          };
          return result;
        }

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
          operationPlan: activePlan,
          writeEngine: writeEngineExecutionFromPlan(activePlan),
        };
        return result;
      },
      { skipTransaction: options.skipTransaction }
    );
    const executionDurationMs = Date.now() - executionStartedAt;
    const performance = buildWritePerformanceReport({
      phaseDurationsMs: {
        planning: planningDurationMs,
        singleWriteExecution: executionDurationMs,
        verification: 0,
        total: Date.now() - startedAt,
      },
      primaryToolCallCount: 1,
      sdkOperationCount: operationPlan.estimatedOperationCount,
    });
    const result = {
      ...executed.result,
      status: performance.status === 'success_with_performance_warning'
        ? 'success_with_performance_warning' as const
        : executed.result.status,
      operationPlan: executed.operationPlan,
      writeEngine: executed.writeEngine,
      performance,
      durationMs: Date.now() - startedAt,
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

export function rememberStructuredBatchResult(
  idempotencyKey: string,
  result: ApplyStructuredNoteBatchResult
) {
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

export function rememberStyledTreeResult(
  idempotencyKey: string,
  result: CreateStyledRemTreeResult
) {
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
  const details =
    typeof error.details === 'object' && error.details !== null
      ? (error.details as Record<string, unknown>)
      : {};
  const direct = Array.isArray(details.createdRemIds) ? details.createdRemIds : [];
  const partial = getPartialExecutionDetails(error.details);
  const partialIds = Array.isArray(partial.createdRemIds) ? partial.createdRemIds : [];
  return Array.from(
    new Set(
      [...direct, ...partialIds].filter(
        (id): id is string => typeof id === 'string' && id.length > 0
      )
    )
  );
}

export async function rollbackCreatedRems(plugin: RNPlugin, createdRemIds: string[]) {
  return rollbackCreatedRemsFromEngine(plugin, createdRemIds);
}

export async function verifyCreatedRems(
  plugin: RNPlugin,
  createdRemIds: string[],
  rootCreatedRemId?: string
): Promise<ApplyStructuredNoteBatchResult['verification']> {
  return verifyCreatedRemsFromEngine(plugin, createdRemIds, rootCreatedRemId);
}

export async function createStyledRemTree(
  plugin: RNPlugin,
  args: CreateStyledRemTreeArgs,
  options: { skipTransaction?: boolean } = {}
): Promise<CreateStyledRemTreeResult> {
  return structuredWriteEngine(plugin, args, options);
}

export async function applyStructuredNoteBatch(
  plugin: RNPlugin,
  args: ApplyStructuredNoteBatchArgs
): Promise<ApplyStructuredNoteBatchResult> {
  const startedAt = Date.now();
  const operation = args.operation ?? 'create_child_tree';
  const target = args.target ?? {
    mode: 'parent_child' as const,
    parentId: args.parentId ?? null,
  };
  const noteRoot = args.note?.root ?? args.root;
  const rawNoteChildren = args.note?.children;
  const noteChildren = Array.isArray(rawNoteChildren) ? rawNoteChildren : [];
  if (!noteRoot && !noteChildren.length) {
    throw new RemnoteWriteError(
      'INVALID_ARGS',
      'Structured note batch requires root, note.root, or note.children.'
    );
  }
  if (
    !noteRoot &&
    (operation === 'create_child_tree' || operation === 'update_root_and_replace_children')
  ) {
    throw new RemnoteWriteError('INVALID_ARGS', `${operation} requires root or note.root.`);
  }

  const validationState: TreeValidationState = { nodeCount: 0 };
  const presetRootInput = noteRoot
    ? applyStylePresetToTree(
        {
          ...noteRoot,
          children: [
            ...(Array.isArray(noteRoot.children) ? noteRoot.children : []),
            ...noteChildren,
          ],
        },
        args
      )
    : undefined;
  const presetChildren =
    !noteRoot && args.stylePreset
      ? (applyStylePresetToTree({ type: 'rem', text: 'Preset root', children: noteChildren }, args)
          .children ?? [])
      : noteChildren;
  const root = presetRootInput
    ? normalizeStyledNode(presetRootInput, 1, validationState)
    : undefined;
  const childNodes =
    root?.children ?? presetChildren.map((child) => normalizeStyledNode(child, 1, validationState));
  assertTreeLimits(
    validationState,
    { maxDepth: args.maxDepth, maxNodeCount: args.maxNodeCount },
    'Structured note batch'
  );
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

  if (!args.dryRun) {
    const cached = STRUCTURED_BATCH_RESULT_CACHE.get(idempotencyKey);
    if (cached) {
      const replayPlan = finalizeWriteOperationPlan(
        plugin,
        cached.operationPlan ??
          buildWriteOperationPlan({
            toolName: 'apply_structured_note_batch',
            operation,
            dryRun: false,
            idempotencyKey,
            target: {
              parentId: cached.parentId,
              targetRemId: cached.targetRemId,
              rootRemId: cached.rootCreatedRemId,
            },
            nodesToCreate: cached.createdNodeCount,
            nodesToUpdate: cached.updatedRemIds?.length ?? 0,
            nodesToDelete: cached.deletedRemIds?.length ?? 0,
          }),
        { idempotencyReplay: true }
      );
      return {
        ...cached,
        status: 'already_applied',
        dryRun: false,
        operationPlan: replayPlan,
        writeEngine: writeEngineExecutionFromPlan(replayPlan, { idempotencyReplay: true }),
        durationMs: Date.now() - startedAt,
      };
    }
  }

  const targetRemId = target.remId ?? null;
  const requestedParentId = target.parentId ?? args.parentId ?? null;
  const parentId =
    operation === 'create_child_tree'
      ? (requestedParentId ?? targetRemId)
      : (targetRemId ?? requestedParentId);
  if (!parentId) {
    throw new RemnoteWriteError(
      'INVALID_ARGS',
      'Structured note batch target did not resolve to a Rem ID.'
    );
  }

  const parent = await findRequiredRem(
    plugin,
    parentId,
    operation === 'create_child_tree' ? 'Parent' : 'Target',
    operation === 'create_child_tree' ? 'PARENT_NOT_FOUND' : 'REM_NOT_FOUND'
  );
  const replacementOperation =
    operation === 'replace_children' || operation === 'update_root_and_replace_children';
  const operationPlan = finalizeWriteOperationPlan(
    plugin,
    buildWriteOperationPlan({
      toolName: 'apply_structured_note_batch',
      operation,
      dryRun: Boolean(args.dryRun),
      idempotencyKey,
      target:
        operation === 'create_child_tree'
          ? { parentId: parent._id }
          : { targetRemId: parent._id, parentId: parent.parent ?? undefined },
      nodes: root ? [root] : childNodes,
      nodesToUpdate: operation === 'update_root_and_replace_children' ? 1 : 0,
      nodesToDelete: replacementOperation ? (parent.children?.length ?? 0) : 0,
      verificationChecks: [
        'validate_tree_limits',
        ...(verifyAfterWrite ? ['created_rems_exist'] : []),
        ...(replacementOperation ? ['staged_replacement_verified_before_delete'] : []),
      ],
      rollbackStrategy: replacementOperation ? 'create_new_verify_swap' : 'delete_created_rems',
      replacement: {
        strategy: replacementOperation
          ? 'create_new_verify_swap'
          : operation === 'create_child_tree'
            ? 'create_child_tree'
            : 'direct_append',
        preservesExistingUntilVerified: replacementOperation,
        oldChildrenSnapshotRequired: replacementOperation,
      },
    })
  );
  const planningDurationMs = Date.now() - startedAt;

  if (args.dryRun) {
    const performance = buildWritePerformanceReport({
      phaseDurationsMs: {
        planning: planningDurationMs,
        singleWriteExecution: 0,
        verification: 0,
        total: Date.now() - startedAt,
      },
      primaryToolCallCount: 1,
      sdkOperationCount: 0,
    });
    return {
      operationId: operationPlan.operationId,
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
      operationPlan,
      writeEngine: writeEngineExecutionFromPlan(operationPlan),
      rollback: {
        attempted: false,
        completed: false,
      },
      performance,
      durationMs: Date.now() - startedAt,
    };
  }

  const createdRemIds: string[] = [];
  const updatedRemIds: string[] = [];
  const deletedRemIds: string[] = [];
  const movedRemIds: string[] = [];
  const stagedRemIds: string[] = [];
  const backupRemIds: string[] = [];
  let verificationDurationMs = 0;

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

  async function createChildNodes(rem: Rem, nodes: StyledRemTreeNode[]): Promise<string[]> {
    const rootIds: string[] = [];
    for (let index = 0; index < nodes.length; index += 1) {
      const created = await structuredWriteEngine(
        plugin,
        {
          parentId: rem._id,
          position: 'end',
          tree: nodes[index],
        },
        { skipTransaction: true }
      );
      createdRemIds.push(...created.createdRemIds);
      rootIds.push(created.rootCreatedRemId);
    }
    return rootIds;
  }

  async function getDirectChildren(rem: Rem): Promise<Rem[]> {
    return runSdkOperation('rem.getChildrenRem', () => rem.getChildrenRem());
  }

  async function createStagingRem(rem: Rem): Promise<Rem> {
    const insertIndex = await getFreshInsertIndex(plugin, rem, 'end');
    const staging = await createRemWithRichText(
      plugin,
      await buildStyledText(plugin, `RemnoteMCP staging ${operationPlan.operationId}`, {
        hideBullet: true,
      }),
      rem,
      insertIndex
    );
    stagedRemIds.push(staging._id);
    return staging;
  }

  async function createBackupRem(rem: Rem): Promise<Rem> {
    const insertIndex = await getFreshInsertIndex(plugin, rem, 'end');
    const backup = await createRemWithRichText(
      plugin,
      await buildStyledText(plugin, `RemnoteMCP replacement backup ${operationPlan.operationId}`, {
        hideBullet: true,
      }),
      rem,
      insertIndex
    );
    backupRemIds.push(backup._id);
    return backup;
  }

  async function stageReplacementChildren(rem: Rem, nodes: StyledRemTreeNode[]) {
    const oldChildren = await getDirectChildren(rem);
    if (!nodes.length) {
      return { oldChildren, staging: null as Rem | null, stagedRootIds: [] as string[] };
    }

    const staging = await createStagingRem(rem);
    const stagedRootIds = await createChildNodes(staging, nodes);
    const verification = await verifyStagedReplacement(plugin, stagedRootIds);
    if (!verification.ok) {
      throw new RemnoteWriteError(
        'PARTIAL_FAILURE',
        'Replacement staging verification failed before deleting existing children.',
        {
          operationId: operationPlan.operationId,
          idempotencyKey,
          verification,
          partialExecution: {
            createdRemIds,
            stagedRemIds,
            failedStage: 'verify_staged_replacement',
            rollbackStatus: 'not_attempted',
            recovery: {
              existingChildrenPreserved: true,
              oldChildRemIds: oldChildren.map((child) => child._id),
            },
          },
        }
      );
    }
    return { oldChildren, staging, stagedRootIds };
  }

  async function moveStagedChildrenToTarget(staging: Rem, rem: Rem) {
    const stagedChildren = await getDirectChildren(staging);
    for (let index = 0; index < stagedChildren.length; index += 1) {
      await runSdkOperation('rem.setParent', () => stagedChildren[index].setParent(rem, index));
      movedRemIds.push(stagedChildren[index]._id);
    }
    await runSdkOperation('rem.remove', () => staging.remove());
  }

  async function moveChildrenToBackup(children: Rem[], backup: Rem) {
    for (let index = 0; index < children.length; index += 1) {
      await runSdkOperation('rem.setParent', () => children[index].setParent(backup, index));
      movedRemIds.push(children[index]._id);
    }
  }

  async function removeBackupTree(backup: Rem) {
    const descendants = await runSdkOperation('rem.getDescendants', () => backup.getDescendants());
    deletedRemIds.push(...descendants.map((descendant) => descendant._id));
    await runSdkOperation('rem.remove', () => backup.remove());
  }

  try {
    const executionStartedAt = Date.now();
    const executed = await executeWriteOperation(plugin, operationPlan, async (activePlan) => {
      let rootCreatedRemId: string | undefined;
      let rootInsertIndex: number | undefined;
      let rootInsertPosition: 'start' | 'end' | undefined;

      if (operation === 'create_child_tree') {
        if (!root) {
          throw new RemnoteWriteError(
            'INVALID_ARGS',
            'create_child_tree requires root or note.root.'
          );
        }
        const created = await structuredWriteEngine(
          plugin,
          {
            parentId: parent._id,
            position: args.position ?? 'end',
            tree: root,
          },
          { skipTransaction: true }
        );
        createdRemIds.push(...created.createdRemIds);
        rootCreatedRemId = created.rootCreatedRemId;
        rootInsertIndex = created.rootInsertIndex;
        rootInsertPosition = created.rootInsertPosition;
      } else if (operation === 'append_children') {
        await createChildNodes(parent, childNodes);
      } else {
        const staged = await stageReplacementChildren(parent, childNodes);
        if (operation === 'update_root_and_replace_children') {
          if (!root) {
            throw new RemnoteWriteError(
              'INVALID_ARGS',
              'update_root_and_replace_children requires root or note.root.'
            );
          }
          await updateExistingRoot(parent, root);
        }
        const backup = staged.oldChildren.length ? await createBackupRem(parent) : null;
        if (backup) {
          await moveChildrenToBackup(staged.oldChildren, backup);
        }
        if (staged.staging) {
          await moveStagedChildrenToTarget(staged.staging, parent);
        }
        if (backup) {
          await removeBackupTree(backup);
        }
      }

      let verification: ApplyStructuredNoteBatchResult['verification'];
      if (verifyAfterWrite) {
        const verificationStartedAt = Date.now();
        verification = await verifyCreatedRems(
          plugin,
          Array.from(new Set([...createdRemIds, ...updatedRemIds])),
          rootCreatedRemId ?? parent._id
        );
        verificationDurationMs += Date.now() - verificationStartedAt;
      }
      if (verification && !verification.ok) {
        throw new RemnoteWriteError(
          'PARTIAL_FAILURE',
          'Structured note batch verification failed.',
          {
            operationId: activePlan.operationId,
            idempotencyKey,
            verification,
            partialExecution: {
              createdRemIds,
              updatedRemIds,
              deletedRemIds: Array.from(new Set(deletedRemIds)),
              movedRemIds,
              stagedRemIds,
              failedStage: 'verify_structured_note_batch',
              rollbackStatus: 'not_attempted',
            },
          }
        );
      }
      const result: ApplyStructuredNoteBatchResult = {
        operationId: activePlan.operationId,
        status: 'applied',
        targetRemId: operation === 'create_child_tree' ? rootCreatedRemId : parent._id,
        parentId: operation === 'create_child_tree' ? parent._id : (parent.parent ?? undefined),
        operation,
        plannedNodeCount: validationState.nodeCount,
        createdNodeCount: createdRemIds.length,
        createdRemIds,
        updatedRemIds,
        deletedRemIds: Array.from(new Set(deletedRemIds)),
        movedRemIds,
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
        operationPlan: activePlan,
        writeEngine: writeEngineExecutionFromPlan(activePlan),
        rollback: {
          attempted: false,
          completed: false,
        },
        ...(verification ? { verification } : {}),
      };
      return result;
    });
    const executionDurationMs = Date.now() - executionStartedAt;
    const performance = buildWritePerformanceReport({
      phaseDurationsMs: {
        planning: planningDurationMs,
        singleWriteExecution: Math.max(0, executionDurationMs - verificationDurationMs),
        verification: verificationDurationMs,
        total: Date.now() - startedAt,
      },
      primaryToolCallCount: 1,
      sdkOperationCount: operationPlan.estimatedOperationCount,
    });
    const result = {
      ...executed.result,
      status: performance.status === 'success_with_performance_warning'
        ? 'success_with_performance_warning' as const
        : executed.result.status,
      operationPlan: executed.operationPlan,
      writeEngine: executed.writeEngine,
      performance,
      durationMs: Date.now() - startedAt,
    };

    rememberStructuredBatchResult(idempotencyKey, result);

    return result;
  } catch (error: unknown) {
    if (error instanceof RemnoteWriteError) {
      const nestedCreatedRemIds = readCreatedRemIdsFromError(error);
      for (const remId of nestedCreatedRemIds) {
        createdRemIds.push(remId);
      }
      const uniqueCreatedRemIds = Array.from(new Set([...createdRemIds, ...stagedRemIds]));
      const hasPartial =
        uniqueCreatedRemIds.length > 0 ||
        updatedRemIds.length > 0 ||
        deletedRemIds.length > 0 ||
        movedRemIds.length > 0;
      const rollback =
        rollbackOnFailure && uniqueCreatedRemIds.length
          ? await rollbackCreatedRems(plugin, uniqueCreatedRemIds)
          : { status: 'not_attempted' as const, removedRemIds: [], failedRemIds: [] };
      throw new RemnoteWriteError(
        hasPartial ? 'PARTIAL_FAILURE' : error.code,
        hasPartial ? 'Structured note batch failed after partial execution.' : error.message,
        {
          originalDetails: error.details,
          operationId: operationPlan.operationId,
          idempotencyKey,
          operationPlan,
          partialExecution: {
            ...getPartialExecutionDetails(error.details),
            createdNodeCount: uniqueCreatedRemIds.length,
            createdRemIds: Array.from(new Set([...uniqueCreatedRemIds, ...stagedRemIds])),
            updatedRemIds,
            deletedRemIds: Array.from(new Set(deletedRemIds)),
            movedRemIds,
            stagedRemIds,
            backupRemIds,
            failedStage: 'apply_structured_note_batch',
            rollbackStatus: rollback.status,
            rollbackRemovedRemIds: rollback.removedRemIds,
            rollbackFailedRemIds: rollback.failedRemIds,
            recovery:
              replacementOperation && backupRemIds.length
                ? {
                    oldContentMayBeInBackupRemIds: backupRemIds,
                    reason:
                      'Replacement keeps old children in backup until new children move succeeds.',
                  }
                : undefined,
          },
        }
      );
    }

    throw new RemnoteWriteError('SDK_ERROR', 'Structured note batch failed.', {
      sdkMessage: getSdkErrorMessage(error),
      operationId: operationPlan.operationId,
      idempotencyKey,
      operationPlan,
      partialExecution: {
        createdRemIds: Array.from(new Set([...createdRemIds, ...stagedRemIds])),
        updatedRemIds,
        deletedRemIds: Array.from(new Set(deletedRemIds)),
        movedRemIds,
        stagedRemIds,
        backupRemIds,
        failedStage: 'apply_structured_note_batch',
        rollbackStatus: 'not_attempted',
        recovery:
          replacementOperation && backupRemIds.length
            ? {
                oldContentMayBeInBackupRemIds: backupRemIds,
                reason:
                  'Replacement keeps old children in backup until new children move succeeds.',
              }
            : undefined,
      },
    });
  }
}
